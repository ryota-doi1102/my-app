import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";

const logger = getAppLogger(["services", "users", "API-USER-05"]);

export async function deleteUser(userId: string): Promise<void> {
	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.id, userId), isNull(users.deletedAt)))
		.limit(1);

	if (!existing) {
		logger.warn("ユーザーが見つからない（削除済みを含む）", { userId });
		throw new AppError(404, "NOT_FOUND", "ユーザーが見つかりません");
	}

	await db
		.update(users)
		.set({ deletedAt: new Date() })
		.where(eq(users.id, userId));

	logger.info("ユーザー論理削除完了", { userId });
}