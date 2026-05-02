import { randomUUID } from "node:crypto";
import { sign } from "hono/jwt";
import { db } from "../../db/index.js";
import { refreshTokens } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";

const logger = getAppLogger(["auth"]);

export async function createAccessToken(userId: string, email: string): Promise<string> {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		logger.error("JWT_SECRET が未設定");
		throw new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました");
	}
	const expiresIn = Number(process.env.JWT_ACCESS_EXPIRES_IN ?? 2400);
	const now = Math.floor(Date.now() / 1000);
	return sign(
		{ sub: userId, email, iat: now, exp: now + expiresIn },
		jwtSecret,
		"HS256",
	);
}

export async function createRefreshToken(userId: string): Promise<string> {
	const refreshExpiresIn = Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 86400);
	const now = Math.floor(Date.now() / 1000);
	const token = randomUUID();
	const expiresAt = new Date((now + refreshExpiresIn) * 1000);
	await db.insert(refreshTokens).values({ userId, token, expiresAt });
	return token;
}