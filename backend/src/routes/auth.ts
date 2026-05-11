import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	passwordResetRequestSchema,
	passwordResetSchema,
	refreshSchema,
	signinSchema,
	signupRequestSchema,
	signupSchema,
} from "@shared/schemas/auth.js";
import { authService } from "../services/authService/index.js";

const errorResponseSchema = z.object({
	status_code: z.number(),
	is_success: z.literal(false),
	error: z.object({ code: z.string(), message: z.string() }),
});

const authRoute = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json(
				{
					status_code: 422,
					is_success: false,
					error: {
						code: "VALIDATION_ERROR",
						messages: result.error.issues.map((i: { message: string }) => i.message),
					},
				},
				422,
			);
		}
	},
});

/** POST /api/v1/auth/signup/request — サインアップトークン発行 */
const signupRequestRoute = createRoute({
	method: "post",
	path: "/signup/request",
	tags: ["Auth"],
	summary: "サインアップトークン発行",
	request: {
		body: {
			content: { "application/json": { schema: signupRequestSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: z.object({
						status_code: z.number(),
						is_success: z.literal(true),
						data: z.object({ token: z.string().uuid() }),
					}),
				},
			},
			description: "トークン発行成功",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リクエスト形式不正",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
		500: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "サーバーエラー",
		},
	},
});

authRoute.openapi(signupRequestRoute, async (c) => {
	const { email } = c.req.valid("json");
	const data = await authService.requestSignup(email);
	return c.json({ status_code: 201, is_success: true, data }, 201);
});

/** POST /api/v1/auth/signup — サインアップ実行 */
const signupRoute = createRoute({
	method: "post",
	path: "/signup",
	tags: ["Auth"],
	summary: "サインアップ",
	request: {
		body: {
			content: { "application/json": { schema: signupSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: z.object({
						status_code: z.number(),
						is_success: z.literal(true),
						data: z.object({ accessToken: z.string() }),
					}),
				},
			},
			description: "サインアップ成功",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リクエスト形式不正",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "トークンが無効または期限切れ",
		},
		409: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "メールアドレスが既に登録済み",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
		500: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "サーバーエラー",
		},
	},
});

authRoute.openapi(signupRoute, async (c) => {
	const { token, email, password } = c.req.valid("json");
	const data = await authService.signup(token, email, password);
	return c.json({ status_code: 201, is_success: true, data }, 201);
});

/** POST /api/v1/auth/signin — サインイン */
const signinRoute = createRoute({
	method: "post",
	path: "/signin",
	tags: ["Auth"],
	summary: "サインイン",
	request: {
		body: {
			content: { "application/json": { schema: signinSchema } },
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
							accessToken: z.string(),
							refreshToken: z.string(),
						}),
					}),
				},
			},
			description: "サインイン成功",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リクエスト形式不正",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "メールアドレスまたはパスワードが正しくない・退会済み",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
		500: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "サーバーエラー",
		},
	},
});

authRoute.openapi(signinRoute, async (c) => {
	const { email, password } = c.req.valid("json");
	const data = await authService.signin(email, password);
	return c.json({ status_code: 200, is_success: true, data }, 200);
});

/** POST /api/v1/auth/refresh — トークンリフレッシュ */
const refreshRoute = createRoute({
	method: "post",
	path: "/refresh",
	tags: ["Auth"],
	summary: "トークンリフレッシュ",
	request: {
		body: {
			content: { "application/json": { schema: refreshSchema } },
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
							accessToken: z.string(),
							refreshToken: z.string(),
						}),
					}),
				},
			},
			description: "リフレッシュ成功",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リクエスト形式不正",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リフレッシュトークンが無効または期限切れ",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
		500: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "サーバーエラー",
		},
	},
});

authRoute.openapi(refreshRoute, async (c) => {
	const { refreshToken } = c.req.valid("json");
	const data = await authService.refresh(refreshToken);
	return c.json({ status_code: 200, is_success: true, data }, 200);
});

/** POST /api/v1/auth/signout — サインアウト */
const signoutRoute = createRoute({
	method: "post",
	path: "/signout",
	tags: ["Auth"],
	summary: "サインアウト",
	request: {
		body: {
			content: { "application/json": { schema: refreshSchema } },
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
						data: z.null(),
					}),
				},
			},
			description: "サインアウト成功",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リクエスト形式不正",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リフレッシュトークンが無効または期限切れ",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
		500: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "サーバーエラー",
		},
	},
});

authRoute.openapi(signoutRoute, async (c) => {
	const { refreshToken } = c.req.valid("json");
	await authService.signout(refreshToken);
	return c.json({ status_code: 200, is_success: true, data: null }, 200);
});

/** POST /api/v1/auth/password-reset/request — パスワードリセットトークン発行 */
const passwordResetRequestRoute = createRoute({
	method: "post",
	path: "/password-reset/request",
	tags: ["Auth"],
	summary: "パスワードリセットトークン発行",
	request: {
		body: {
			content: { "application/json": { schema: passwordResetRequestSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: z.object({
						status_code: z.number(),
						is_success: z.literal(true),
						data: z.object({ token: z.string().uuid() }),
					}),
				},
			},
			description: "トークン発行成功",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リクエスト形式不正",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "ユーザーが存在しない",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
		500: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "サーバーエラー",
		},
	},
});

authRoute.openapi(passwordResetRequestRoute, async (c) => {
	const { email } = c.req.valid("json");
	const data = await authService.requestPasswordReset(email);
	return c.json({ status_code: 201, is_success: true, data }, 201);
});

/** POST /api/v1/auth/password-reset — パスワードリセット実行 */
const passwordResetRoute = createRoute({
	method: "post",
	path: "/password-reset",
	tags: ["Auth"],
	summary: "パスワードリセット",
	request: {
		body: {
			content: { "application/json": { schema: passwordResetSchema } },
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
						data: z.null(),
					}),
				},
			},
			description: "パスワードリセット成功",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リクエスト形式不正",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "トークンが無効または期限切れ",
		},
		404: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "ユーザーが存在しない",
		},
		422: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "バリデーションエラー",
		},
		500: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "サーバーエラー",
		},
	},
});

authRoute.openapi(passwordResetRoute, async (c) => {
	const { token, password } = c.req.valid("json");
	await authService.resetPassword(token, password);
	return c.json({ status_code: 200, is_success: true, data: null }, 200);
});

export { authRoute };
