import type { Context, Next } from "hono";
import { getAppLogger } from "../lib/logger.js";
import type { ErrorCode, ErrorResponse } from "../types/api.js";

const logger = getAppLogger(["middleware", "error"]);

export class AppError extends Error {
	constructor(
		public readonly statusCode: number,
		public readonly code: ErrorCode,
		message: string,
	) {
		super(message);
		this.name = "AppError";
	}
}

// アプリ全体のエラーを捕捉してエラーレスポンスを返す
export async function errorHandler(
	err: unknown,
	c: Context,
): Promise<Response> {
	const isProduction = process.env.NODE_ENV === "production";

	// AppError（想定済みエラー）はそのままレスポンスに変換する
	if (err instanceof AppError) {
		logger.error("AppError が発生", {
			statusCode: err.statusCode,
			code: err.code,
			message: err.message,
		});
		const body: ErrorResponse = {
			status_code: err.statusCode,
			success: false,
			error: { code: err.code, message: err.message },
		};
		return c.json(body, err.statusCode as Parameters<typeof c.json>[1]);
	}

	// 予期しないエラー（本番ではスタックトレースを隠蔽する）
	logger.error("予期しないエラーが発生", {
		error: err instanceof Error ? err.message : String(err),
		stack: err instanceof Error ? err.stack : undefined,
	});
	const message = isProduction
		? "Internal server error"
		: err instanceof Error
			? err.message
			: "Unknown error";

	const body: ErrorResponse = {
		status_code: 500,
		success: false,
		error: { code: "INTERNAL_SERVER_ERROR", message },
	};
	return c.json(body, 500);
}

// 404 Not Found レスポンスを返す
export async function notFoundHandler(c: Context): Promise<Response> {
	logger.warn("存在しないパスへのリクエスト", { path: c.req.path });
	const body: ErrorResponse = {
		status_code: 404,
		success: false,
		error: { code: "NOT_FOUND", message: "Resource not found" },
	};
	return c.json(body, 404);
}

// リクエストロガーミドルウェア（現在は index.ts のミドルウェアで代替）
export async function requestLogger(_c: Context, next: Next): Promise<void> {
	await next();
}
