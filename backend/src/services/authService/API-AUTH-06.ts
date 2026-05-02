import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { passwordResetTokens, users } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";

const logger = getAppLogger(["auth"]);

export async function requestPasswordReset(email: string): Promise<{ token: string }> {
	logger.info("パスワードリセットトークン発行リクエスト", { email });

	// ユーザー存在確認（退会済みは対象外）
	const [user] = await db
		.select()
		.from(users)
		.where(and(eq(users.email, email), isNull(users.deletedAt)))
		.limit(1);

	if (!user) {
		logger.warn("パスワードリセット対象ユーザーが存在しない", { email });
		throw new AppError(404, "NOT_FOUND", "このメールアドレスのユーザーが見つかりません");
	}

	// 既存の有効なトークンを無効化
	await db
		.update(passwordResetTokens)
		.set({ revokedAt: new Date() })
		.where(
			and(eq(passwordResetTokens.email, email), isNull(passwordResetTokens.revokedAt)),
		);

	// 新しいトークンを生成（UUID v4）
	const token = randomUUID();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

	const [created] = await db
		.insert(passwordResetTokens)
		.values({ email, token, expiresAt })
		.returning();

	if (!created) {
		logger.error("パスワードリセットトークンの保存に失敗", { email });
		throw new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました");
	}

	logger.info("パスワードリセットトークン発行成功", { email });
	return { token: created.token };
}
