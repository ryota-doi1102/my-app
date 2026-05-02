import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { refreshTokens, users } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";
import { createAccessToken, createRefreshToken } from "./common.js";

const logger = getAppLogger(["auth"]);

export async function refresh(
	token: string,
): Promise<{ accessToken: string; refreshToken: string }> {
	logger.info("トークンリフレッシュリクエスト");

	const unauthorizedError = new AppError(
		401,
		"UNAUTHORIZED",
		"リフレッシュトークンが無効または期限切れです",
	);

	// トークンを検索
	const [tokenRecord] = await db
		.select()
		.from(refreshTokens)
		.where(eq(refreshTokens.token, token))
		.limit(1);

	// トークンの有効性を確認（存在しない・失効済み・期限切れ）
	if (
		!tokenRecord ||
		tokenRecord.revokedAt !== null ||
		tokenRecord.expiresAt < new Date()
	) {
		logger.warn("無効なリフレッシュトークン");
		throw unauthorizedError;
	}

	// ユーザー情報を取得
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, tokenRecord.userId))
		.limit(1);

	// トークンに紐づくユーザーが存在しない場合
	if (!user) {
		logger.warn("リフレッシュトークンに対応するユーザーが存在しない", { userId: tokenRecord.userId });
		throw unauthorizedError;
	}

	// 古いリフレッシュトークンを無効化（ローテーション）
	await db
		.update(refreshTokens)
		.set({ revokedAt: new Date() })
		.where(eq(refreshTokens.id, tokenRecord.id));

	const accessToken = await createAccessToken(user.id, user.email);
	const newRefreshToken = await createRefreshToken(user.id);

	logger.info("トークンリフレッシュ成功", { userId: user.id });
	return { accessToken, refreshToken: newRefreshToken };
}