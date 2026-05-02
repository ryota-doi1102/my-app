import { hash } from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { passwordResetTokens, refreshTokens, users } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";

const logger = getAppLogger(["auth"]);

export async function resetPassword(token: string, password: string): Promise<void> {
	logger.info("パスワードリセットリクエスト");

	// トークンを検索
	const [tokenRecord] = await db
		.select()
		.from(passwordResetTokens)
		.where(eq(passwordResetTokens.token, token))
		.limit(1);

	// トークンの有効性を確認（存在しない・失効済み・使用済み・期限切れ）
	if (
		!tokenRecord ||
		tokenRecord.revokedAt !== null ||
		tokenRecord.usedAt !== null ||
		tokenRecord.expiresAt < new Date()
	) {
		logger.warn("無効なパスワードリセットトークン");
		throw new AppError(401, "UNAUTHORIZED", "トークンが無効または期限切れです");
	}

	// 対象ユーザーを取得（退会済みは対象外）
	const [user] = await db
		.select()
		.from(users)
		.where(and(eq(users.email, tokenRecord.email), isNull(users.deletedAt)))
		.limit(1);

	if (!user) {
		logger.warn("パスワードリセット対象ユーザーが存在しない", { email: tokenRecord.email });
		throw new AppError(404, "NOT_FOUND", "ユーザーが見つかりません");
	}

	// 新しいパスワードをハッシュ化
	const passwordHash = await hash(password, 12);

	// トランザクション: パスワード更新 + トークン使用済み + リフレッシュトークン全失効
	await db.transaction(async (tx) => {
		await tx
			.update(users)
			.set({ passwordHash, updatedAt: new Date() })
			.where(eq(users.id, user.id));

		await tx
			.update(passwordResetTokens)
			.set({ usedAt: new Date() })
			.where(eq(passwordResetTokens.id, tokenRecord.id));

		// セキュリティのため既存リフレッシュトークンをすべて失効させる
		await tx
			.update(refreshTokens)
			.set({ revokedAt: new Date() })
			.where(and(eq(refreshTokens.userId, user.id), isNull(refreshTokens.revokedAt)));
	});

	logger.info("パスワードリセット成功", { userId: user.id });
}
