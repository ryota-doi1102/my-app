import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";
import { getUserProfileById } from "./common.js";
import type { UserProfileDetail } from "./common.js";

const logger = getAppLogger(["services", "users", "API-USER-03"]);

export async function getUserProfile(userId: string): Promise<UserProfileDetail> {
	const profile = await getUserProfileById(userId);

	if (!profile) {
		logger.warn("ユーザーが見つからない", { userId });
		throw new AppError(404, "NOT_FOUND", "ユーザーが見つかりません");
	}

	logger.info("ユーザープロフィール取得成功", { userId });
	return profile;
}