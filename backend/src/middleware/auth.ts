import type { Context, Next } from "hono";
import { jwt } from "hono/jwt";
import { getAppLogger } from "../lib/logger.js";
import { AppError } from "./error.js";

const logger = getAppLogger(["middleware", "auth"]);

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// Authorization: Bearer ヘッダーの JWT を検証するミドルウェアを返す
export function requireAuth() {
  return async (c: Context, next: Next): Promise<void> => {
    // JWT_SECRET が未設定の場合はサーバー設定エラー
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error("JWT_SECRET が未設定");
      throw new AppError(500, "INTERNAL_SERVER_ERROR", "JWT_SECRET is not set");
    }

    const middleware = jwt({ secret, alg: "HS256" });

    try {
      await middleware(c, next);
    } catch {
      // JWT の検証に失敗した場合（署名不正・期限切れ等）
      logger.warn("JWT 認証失敗", { path: c.req.path });
      throw new AppError(401, "UNAUTHORIZED", "トークンが無効です");
    }
  };
}
