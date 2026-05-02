import { compare } from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";
import { createAccessToken, createRefreshToken } from "./common.js";

const logger = getAppLogger(["auth"]);

export async function signin(
	email: string,
	password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
	logger.info("サインインリクエスト", { email });

	const unauthorizedError = new AppError(
		401,
		"UNAUTHORIZED",
		"メールアドレスまたはパスワードが正しくありません",
	);

	// ユーザーを検索（退会済みは除く）
	const [user] = await db
		.select()
		.from(users)
		.where(and(eq(users.email, email), isNull(users.deletedAt)))
		.limit(1);

	// ユーザーが存在しない場合（情報秘匿のため詳細は返さない）
	if (!user) {
		logger.warn("サインイン失敗: ユーザーが存在しない", { email });
		throw unauthorizedError;
	}

	// パスワード照合
	const isValid = await compare(password, user.passwordHash);
	if (!isValid) {
		logger.warn("サインイン失敗: パスワード不一致", { email });
		throw unauthorizedError;
	}

	const accessToken = await createAccessToken(user.id, user.email);
	const refreshToken = await createRefreshToken(user.id);

	logger.info("サインイン成功", { userId: user.id, email });
	return { accessToken, refreshToken };
}