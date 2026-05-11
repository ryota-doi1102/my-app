import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getAppLogger } from "../lib/logger.js";
import { requireAuth } from "../middleware/auth.js";
import {
	userProfileCreateBackendSchema,
	userProfileEditBackendSchema,
} from "../schemas/user.js";
import { userService } from "../services/userService/index.js";

const logger = getAppLogger(["routes", "users"]);

const errorResponseSchema = z.object({
	status_code: z.number(),
	is_is_success: z.literal(false),
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
usersRoute.use("/", async (c, next) => {
	if (c.req.method === "PUT") {
		const contentType = c.req.header("content-type");
		if (!contentType?.includes("application/json")) {
			return c.json(
				{
					status_code: 400,
					is_success: false as const,
					error: { code: "BAD_REQUEST", messages: ["リクエストの形式が正しくありません"] },
				},
				400,
			);
		}
		// クローンでボディを先読みし、空ボディ・JSON パースエラーを 400 として返す
		const badRequest = c.json(
			{
				status_code: 400,
				is_success: false as const,
				error: { code: "BAD_REQUEST", messages: ["リクエストの形式が正しくありません"] },
			},
			400,
		);
		try {
			const text = await c.req.raw.clone().text();
			if (!text.trim()) return badRequest;
			JSON.parse(text);
		} catch {
			return badRequest;
		}
		return next();
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
		params: z.object({ id: z.string().uuid() }),
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
