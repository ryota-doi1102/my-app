import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { signupTokens } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";

const logger = getAppLogger(["auth"]);

export async function requestSignup(email: string): Promise<{ token: string }> {
	logger.info("サインアップトークン発行リクエスト", { email });

	// 既存の有効なトークンを無効化
	await db
		.update(signupTokens)
		.set({ revokedAt: new Date() })
		.where(and(eq(signupTokens.email, email), isNull(signupTokens.revokedAt)));

	// 新しいトークンを生成（UUID v4）
	const token = randomUUID();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

	const [created] = await db
		.insert(signupTokens)
		.values({ email, token, expiresAt })
		.returning();

	// DBへの挿入に失敗した場合（通常は発生しない）
	if (!created) {
		logger.error("サインアップトークンの保存に失敗", { email });
		throw new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました");
	}

	logger.info("サインアップトークン発行成功", { email });
	return { token: created.token };
}