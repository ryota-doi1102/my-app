import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context, Next } from "hono";
import { getAppLogger, initLogger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRoute } from "./routes/auth.js";
import health from "./routes/health.js";
import usersRoute from "./routes/users.js";

// ロガーを初期化
await initLogger();

const logger = getAppLogger(["server"]);

// Hono アプリ
const app = new OpenAPIHono();

// リクエスト/レスポンスをログに記録するミドルウェア
app.use(async (c: Context, next: Next) => {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;
	logger.info("HTTPリクエスト処理完了", {
		method: c.req.method,
		path: c.req.path,
		status: c.res.status,
		ms,
	});
});

// 静的ファイル（プロフィール画像）
app.use("/uploads/*", serveStatic({ root: "./" }));

// ルーティング
app.route("/health", health);
app.route("/api/v1/auth", authRoute);
app.route("/api/v1/users", usersRoute);

// OpenAPI スキーマ・Swagger UI（非本番環境のみ）
if (process.env.NODE_ENV !== "production") {
	app.doc("/doc", {
		openapi: "3.0.0",
		info: { title: "API ドキュメント", version: "1.0.0" },
	});
	app.get("/ui", swaggerUI({ url: "/doc" }));
}

// 404
app.notFound(notFoundHandler);

// エラーハンドラー
app.onError(errorHandler);

// サーバー起動
const port = Number(process.env.PORT ?? 3000);
logger.info(`Server starting on port ${port}`);

serve({ fetch: app.fetch, port });

export default app;
