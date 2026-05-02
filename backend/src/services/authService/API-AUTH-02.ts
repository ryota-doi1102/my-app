import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { signupTokens, userProfiles, users } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";
import { createAccessToken } from "./common.js";

const logger = getAppLogger(["auth"]);

export async function signup(
	token: string,
	email: string,
	password: string,
): Promise<{ accessToken: string }> {
	logger.info("サインアップリクエスト", { email });

	// トークンを検索
	const [tokenRecord] = await db
		.select()
		.from(signupTokens)
		.where(eq(signupTokens.token, token))
		.limit(1);

	// トークンの有効性を確認（存在しない・失効済み・使用済み・期限切れ）
	if (
		!tokenRecord ||
		tokenRecord.revokedAt !== null ||
		tokenRecord.usedAt !== null ||
		tokenRecord.expiresAt < new Date()
	) {
		logger.warn("無効なサインアップトークン", { email });
		throw new AppError(401, "UNAUTHORIZED", "トークンが無効または期限切れです");
	}

	// トークンのメールアドレスと一致するか確認
	if (tokenRecord.email !== email) {
		logger.warn("トークンのメールアドレスが不一致", { email, tokenEmail: tokenRecord.email });
		throw new AppError(401, "UNAUTHORIZED", "トークンが無効または期限切れです");
	}

	// メールアドレスの重複確認
	const [existing] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (existing) {
		logger.warn("メールアドレスが既に登録済み", { email });
		throw new AppError(409, "CONFLICT", "このメールアドレスは既に登録済みです");
	}

	// パスワードをハッシュ化
	const passwordHash = await hash(password, 12);

	// トランザクション: ユーザー作成 + プロフィール作成 + トークン使用済み更新
	const [created] = await db.transaction(async (tx) => {
		const [newUser] = await tx
			.insert(users)
			.values({ email, passwordHash })
			.returning();

		// ユーザー挿入に失敗した場合（通常は発生しない）
		if (!newUser) {
			logger.error("ユーザー作成に失敗（トランザクション内）", { email });
			throw new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました");
		}

		await tx.insert(userProfiles).values({ userId: newUser.id });

		await tx
			.update(signupTokens)
			.set({ usedAt: new Date() })
			.where(eq(signupTokens.id, tokenRecord.id));

		return [newUser];
	});

	// トランザクション結果が取得できない場合（通常は発生しない）
	if (!created) {
		logger.error("サインアップトランザクション結果が取得できない", { email });
		throw new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました");
	}

	const accessToken = await createAccessToken(created.id, created.email);

	logger.info("サインアップ成功", { userId: created.id, email });
	return { accessToken };
}