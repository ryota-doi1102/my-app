import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { refreshTokens } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";

const logger = getAppLogger(["auth"]);

export async function signout(token: string): Promise<void> {
	logger.info("サインアウトリクエスト");

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
		logger.warn("サインアウト失敗: 無効なリフレッシュトークン");
		throw new AppError(401, "UNAUTHORIZED", "トークンが無効です");
	}

	// リフレッシュトークンを無効化
	await db
		.update(refreshTokens)
		.set({ revokedAt: new Date() })
		.where(eq(refreshTokens.id, tokenRecord.id));

	logger.info("サインアウト成功", { userId: tokenRecord.userId });
}