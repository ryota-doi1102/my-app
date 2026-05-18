import { promisify } from "node:util";
import { gunzip } from "node:zlib";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getAppLogger } from "../lib/logger.js";
import { requireAuth } from "../middleware/auth.js";
import { IMPORT_TEMPLATE_HEADERS } from "../services/userService/API-USER-IMPORT.js";

const gunzipAsync = promisify(gunzip);

import {
	userProfileCreateBackendSchema,
	userProfileEditBackendSchema,
} from "../schemas/user.js";
import { userService } from "../services/userService/index.js";

const logger = getAppLogger(["routes", "users"]);

const errorResponseSchema = z.object({
	status_code: z.number(),
	is_success: z.literal(false),
	error: z.object({ code: z.string(), messages: z.array(z.string()) }),
});

const workHistorySchema = z.object({
	company: z.string(),
	startMonth: z.string(),
	endMonth: z.string().nullable(),
	role: z.string(),
});

const userProfileDetailSchema = z.object({
	id: z.string().uuid(),
	name: z.string().nullable(),
	email: z.string(),
	birthDate: z.string().nullable(),
	gender: z.string().nullable(),
	profileImageUrl: z.string().nullable(),
	phone: z.string().nullable(),
	postalCode: z.string().nullable(),
	prefecture: z.string().nullable(),
	city: z.string().nullable(),
	streetAddress: z.string().nullable(),
	building: z.string().nullable(),
	workTypes: z.array(z.string()),
	qualifications: z.array(z.string()),
	workHistories: z.array(workHistorySchema),
	selfPR: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const usersRoute = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json(
				{
					status_code: 422,
					is_success: false as const,
					error: {
						code: "VALIDATION_ERROR",
						messages: result.error.issues.map((i) => i.message),
					},
				},
				422,
			);
		}
	},
});

// JWT 認証: /:id ルート（GET/PUT/DELETE）と POST /（検索）に適用
// PUT /（ユーザー作成）は未認証ユーザーが呼ぶため認証不要
usersRoute.use("/:id", requireAuth());
// ジョブ取得ルート（2セグメントのため /:id ミドルウェアが効かないため明示的に設定）
usersRoute.use("/import-jobs/*", requireAuth());
usersRoute.use("/export-jobs/*", requireAuth());
usersRoute.use("/:id", async (c, next) => {
	if (c.req.method === "PUT") {
		const contentType = c.req.header("content-type");
		const badRequest = c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: {
					code: "BAD_REQUEST",
					messages: ["リクエストの形式が正しくありません"],
				},
			},
			400,
		);
		if (!contentType?.includes("application/json")) return badRequest;
		try {
			const text = await c.req.raw.clone().text();
			if (!text.trim()) return badRequest;
			JSON.parse(text);
		} catch {
			return badRequest;
		}
	}
	return next();
});
usersRoute.use("/", async (c, next) => {
	if (c.req.method === "PUT" || c.req.method === "POST") {
		const contentType = c.req.header("content-type");
		const badRequest = c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: {
					code: "BAD_REQUEST",
					messages: ["リクエストの形式が正しくありません"],
				},
			},
			400,
		);
		if (!contentType?.includes("application/json")) return badRequest;
		try {
			const text = await c.req.raw.clone().text();
			if (!text.trim()) return badRequest;
			JSON.parse(text);
		} catch {
			return badRequest;
		}
		if (c.req.method === "PUT") return next();
	}
	return requireAuth()(c, next);
});

/** API-USER-01: POST /api/v1/users — ユーザー一覧検索 */
const searchUsersRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Users"],
	summary: "ユーザー一覧検索",
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						name: z.string().default(""),
						email: z.string().default(""),
						phone: z.string().default(""),
						workTypes: z
							.array(
								z.enum(
									["フルタイム", "パートタイム", "リモート", "フリーランス"],
									{
										errorMap: () => ({
											message: "希望勤務形態の形式が正しくありません",
										}),
									},
								),
							)
							.default([]),
						sortKey: z
							.enum(["name", "email", "phone"], {
								errorMap: () => ({
									message: "ソートキーの形式が正しくありません",
								}),
							})
							.nullable()
							.default(null),
						sortOrder: z
							.enum(["asc", "desc"], {
								errorMap: () => ({
									message: "ソート方向の形式が正しくありません",
								}),
							})
							.default("asc"),
						page: z.number().int().min(1).default(1),
						perPage: z
							.union([
								z.literal(10),
								z.literal(20),
								z.literal(50),
								z.literal(100),
							])
							.default(10)
							.refine(
								(v) => [10, 20, 50, 100].includes(v),
								"表示件数の形式が正しくありません",
							),
					}),
				},
			},
			required: true,
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						status_code: z.number(),
						is_success: z.literal(true),
						data: z.object({
							users: z.array(
								z.object({
									id: z.string().uuid(),
									name: z.string().nullable(),
									email: z.string(),
									phone: z.string().nullable(),
									workTypes: z.array(z.string()),
								}),
							),
							totalCount: z.number(),
							page: z.number(),
							perPage: z.number(),
							totalPages: z.number(),
						}),
					}),
				},
			},
			description: "ユーザー一覧",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "認証エラー",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
	},
});

usersRoute.openapi(searchUsersRoute, async (c) => {
	const { name, email, phone, workTypes, sortKey, sortOrder, page, perPage } =
		c.req.valid("json");

	logger.info("ユーザー一覧検索リクエスト", {
		name,
		email,
		phone,
		workTypes,
		sortKey,
		sortOrder,
		page,
		perPage,
	});

	const result = await userService.searchUsers({
		name,
		email,
		phone,
		workTypeNames: workTypes,
		sortKey,
		sortOrder,
		page,
		perPage,
	});

	return c.json(
		{ status_code: 200, is_success: true as const, data: result },
		200,
	);
});

/** API-USER-02: PUT /api/v1/users — ユーザープロフィール作成 */
const createUserProfileRoute = createRoute({
	method: "put",
	path: "/",
	tags: ["Users"],
	summary: "ユーザープロフィール作成",
	request: {
		body: {
			content: {
				"application/json": {
					schema: userProfileCreateBackendSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		204: { description: "プロフィール作成成功" },
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "認証エラー",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "メールアドレス重複",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
	},
});

usersRoute.openapi(createUserProfileRoute, async (c) => {
	const body = c.req.valid("json");

	logger.info("ユーザープロフィール作成リクエスト", { email: body.email });

	await userService.createUserProfile(body);

	return c.body(null, 204);
});

/** API-USER-07: GET /api/v1/users/template — インポート用CSVテンプレートダウンロード */
usersRoute.get("/template", async (_c) => {
	const header = IMPORT_TEMPLATE_HEADERS.map((h) => `"${h}"`).join(",");
	const csv = `﻿${header}\n`;

	return new Response(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="users_import_template.csv"',
		},
	});
});

/** API-USER-08: POST /api/v1/users/import — CSVインポートジョブ登録 */
usersRoute.post("/import", async (c) => {
	const raw = await c.req.arrayBuffer();
	const encoding = c.req.header("content-encoding");
	const rawBuf = Buffer.from(raw);

	// 解凍前拡張子チェック（マジックバイトで実際のファイル形式を確認）
	const isGzipMagic =
		rawBuf.length >= 2 &&
		rawBuf.readUInt8(0) === 0x1f &&
		rawBuf.readUInt8(1) === 0x8b;
	if (encoding === "gzip" && !isGzipMagic) {
		return c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: {
					code: "BAD_REQUEST",
					messages: [
						"ファイル形式が正しくありません（gzipファイルではありません）",
					],
				},
			},
			400,
		);
	}
	if (encoding !== "gzip" && isGzipMagic) {
		return c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: {
					code: "BAD_REQUEST",
					messages: [
						"ファイル形式が正しくありません（CSVファイルを指定してください）",
					],
				},
			},
			400,
		);
	}

	// 解凍
	let csvBuf: Buffer;
	try {
		csvBuf = encoding === "gzip" ? await gunzipAsync(rawBuf) : rawBuf;
	} catch {
		return c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: {
					code: "BAD_REQUEST",
					messages: ["ファイルの解凍に失敗しました"],
				},
			},
			400,
		);
	}

	// 解凍後拡張子チェック（ヌルバイト検出によるバイナリファイル混入防止）
	if (csvBuf.indexOf(0x00) !== -1) {
		return c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: {
					code: "BAD_REQUEST",
					messages: [
						"ファイル形式が正しくありません（CSVファイルを指定してください）",
					],
				},
			},
			400,
		);
	}

	// 空ファイルチェック
	if (csvBuf.length === 0) {
		return c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: { code: "BAD_REQUEST", messages: ["ファイルが空です"] },
			},
			400,
		);
	}

	const csvText = csvBuf.toString("utf-8");
	const jobId = await userService.submitImportJob(csvText);
	return c.json(
		{ status_code: 200, is_success: true as const, data: { jobId } },
		200,
	);
});

/** API-USER-10: POST /api/v1/users/export — CSVエクスポートジョブ登録 */
usersRoute.post("/export", async (c) => {
	let body: {
		name?: string;
		email?: string;
		phone?: string;
		workTypes?: string[];
		sortKey?: "name" | "email" | "phone" | null;
		sortOrder?: "asc" | "desc";
	} = {};
	try {
		const text = await c.req.raw.clone().text();
		if (text.trim()) body = JSON.parse(text) as typeof body;
	} catch {
		return c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: {
					code: "BAD_REQUEST",
					messages: ["リクエストの形式が正しくありません"],
				},
			},
			400,
		);
	}

	const jobId = await userService.submitExportJob({
		name: body.name || undefined,
		email: body.email || undefined,
		phone: body.phone || undefined,
		workTypeNames:
			body.workTypes && body.workTypes.length > 0 ? body.workTypes : undefined,
		sortKey: body.sortKey ?? null,
		sortOrder: body.sortOrder ?? "asc",
	});
	return c.json(
		{ status_code: 200, is_success: true as const, data: { jobId } },
		200,
	);
});

/** DELETE /api/v1/users/bulk のボディ形式チェック */
usersRoute.use("/bulk", async (c, next) => {
	if (c.req.method === "DELETE") {
		const contentType = c.req.header("content-type");
		const badRequest = c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: {
					code: "BAD_REQUEST",
					messages: ["リクエストの形式が正しくありません"],
				},
			},
			400,
		);
		if (!contentType?.includes("application/json")) return badRequest;
		try {
			const text = await c.req.raw.clone().text();
			if (!text.trim()) return badRequest;
			JSON.parse(text);
		} catch {
			return badRequest;
		}
	}
	return next();
});

/** API-USER-06: DELETE /api/v1/users/bulk — ユーザープロフィール一括削除 */
const bulkDeleteUsersRoute = createRoute({
	method: "delete",
	path: "/bulk",
	tags: ["Users"],
	summary: "ユーザープロフィール一括削除",
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						ids: z
							.array(z.string().uuid({ message: "IDの形式が正しくありません" }))
							.min(1, "IDは1件以上指定してください")
							.max(100, "IDは100件以内で指定してください")
							.default([]),
					}),
				},
			},
			required: true,
		},
	},
	responses: {
		204: { description: "一括削除成功" },
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "認証エラー",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
	},
});

usersRoute.openapi(bulkDeleteUsersRoute, async (c) => {
	const { ids } = c.req.valid("json");

	logger.info("ユーザー一括削除リクエスト", { count: ids.length });

	await userService.deleteUsers(ids);

	return c.body(null, 204);
});

/** API-USER-09: GET /api/v1/users/import-jobs/:jobId — インポートジョブ結果取得 */
usersRoute.get("/import-jobs/:jobId", async (c) => {
	const jobId = c.req.param("jobId");
	const result = await userService.getImportJob(jobId);

	if (result.status === "pending" || result.status === "processing") {
		return c.json(
			{
				status_code: 202,
				is_success: true as const,
				data: { id: result.id, status: result.status },
			},
			202,
		);
	}

	if (result.status === "failed") {
		const errors = result.errors ?? ["エラーが発生しました"];
		const isSystemError =
			errors.length === 1 && errors[0] === "インポートに失敗しました";
		const statusCode = isSystemError ? 500 : 422;
		const code = isSystemError
			? "INTERNAL_SERVER_ERROR"
			: "UNPROCESSABLE_ENTITY";
		return c.json(
			{
				status_code: statusCode,
				is_success: false as const,
				error: { code, messages: errors },
			},
			statusCode as 422 | 500,
		);
	}

	// completed
	return c.json(
		{
			status_code: 200,
			is_success: true as const,
			data: { id: result.id, status: result.status, result: result.result },
		},
		200,
	);
});

/** API-USER-11: GET /api/v1/users/export-jobs/:jobId — エクスポートジョブ結果取得 */
usersRoute.get("/export-jobs/:jobId", async (c) => {
	const jobId = c.req.param("jobId");
	const result = await userService.getExportJob(jobId);

	if (result.status === "pending" || result.status === "processing") {
		return c.json(
			{
				status_code: 202,
				is_success: true as const,
				data: { id: result.id, status: result.status },
			},
			202,
		);
	}

	if (result.status === "failed") {
		return c.json(
			{
				status_code: 500,
				is_success: false as const,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					messages: ["エクスポートに失敗しました"],
				},
			},
			500,
		);
	}

	// completed: CSV を直接返却
	return new Response(result.csvContent ?? "", {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="users_export.csv"',
		},
	});
});

/** API-USER-03: GET /api/v1/users/:id — ユーザープロフィール取得 */
const getUserProfileRoute = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Users"],
	summary: "ユーザープロフィール取得",
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({ id: z.string().uuid() }),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						status_code: z.number(),
						is_success: z.literal(true),
						data: userProfileDetailSchema,
					}),
				},
			},
			description: "プロフィール取得成功",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "認証エラー",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "ユーザーが見つからない",
		},
	},
});

usersRoute.openapi(getUserProfileRoute, async (c) => {
	const { id } = c.req.valid("param");

	logger.info("ユーザープロフィール取得リクエスト", { userId: id });

	const profile = await userService.getUserProfile(id);

	return c.json(
		{ status_code: 200, is_success: true as const, data: profile },
		200,
	);
});

/** API-USER-04: PUT /api/v1/users/:id — ユーザープロフィール更新 */
const updateUserProfileRoute = createRoute({
	method: "put",
	path: "/{id}",
	tags: ["Users"],
	summary: "ユーザープロフィール更新",
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({ id: z.string() }),
		body: {
			content: {
				"application/json": {
					schema: userProfileEditBackendSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		204: { description: "プロフィール更新成功" },
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "認証エラー",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "ユーザーが見つからない",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "メールアドレス重複",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
	},
});

usersRoute.openapi(updateUserProfileRoute, async (c) => {
	const { id } = c.req.valid("param");
	const body = c.req.valid("json");

	logger.info("ユーザープロフィール更新リクエスト", {
		userId: id,
		email: body.email,
	});

	await userService.updateUserProfile(id, body);

	return c.body(null, 204);
});

/** API-USER-05: DELETE /api/v1/users/:id — ユーザー論理削除 */
const deleteUserRoute = createRoute({
	method: "delete",
	path: "/{id}",
	tags: ["Users"],
	summary: "ユーザー論理削除",
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({ id: z.string().uuid() }),
	},
	responses: {
		204: { description: "削除成功" },
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "認証エラー",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "ユーザーが見つからない",
		},
	},
});

usersRoute.openapi(deleteUserRoute, async (c) => {
	const { id } = c.req.valid("param");

	logger.info("ユーザー削除リクエスト", { userId: id });

	await userService.deleteUser(id);

	return c.body(null, 204);
});

export default usersRoute;
