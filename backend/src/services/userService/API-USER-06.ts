import { and, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";

const logger = getAppLogger(["services", "users", "API-USER-06"]);

export async function deleteUsers(userIds: string[]): Promise<void> {
	await db
		.update(users)
		.set({ deletedAt: new Date() })
		.where(and(inArray(users.id, userIds), isNull(users.deletedAt)));

	logger.info("ユーザー一括論理削除完了", { count: userIds.length });
}
