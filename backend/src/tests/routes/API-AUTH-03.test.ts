import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorHandler } from "../../middleware/error.js";
import { authRoute } from "../../routes/auth.js";
import { authService } from "../../services/authService/index.js";
import type { ErrorResponse } from "../../types/api.js";

vi.mock("../../lib/logger.js", () => ({
	getAppLogger: () => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	}),
	initLogger: vi.fn(),
}));

vi.mock("../../services/authService/index.js", () => ({
	authService: {
		requestSignup: vi.fn(),
		signup: vi.fn(),
		signin: vi.fn(),
		refresh: vi.fn(),
		signout: vi.fn(),
		requestPasswordReset: vi.fn(),
		resetPassword: vi.fn(),
	},
}));

const app = new OpenAPIHono();
app.route("/api/v1/auth", authRoute);
app.onError(errorHandler);

const VALID_BODY = {
	email: "test@example.com",
	password: "Password1",
};

function post(body: unknown, headers?: Record<string, string>) {
	return app.request("/api/v1/auth/signin", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
}

describe("API-AUTH-03 POST /api/v1/auth/signin", () => {
	beforeEach(() => {
		vi.mocked(authService.signin).mockResolvedValue({
			accessToken: "mock-access-token",
			refreshToken: "550e8400-e29b-41d4-a716-446655440000",
		});
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: BearerトークンつきでもリクエストをPOSTできる（認証ヘッダーは無視される）", async () => {
			const res = await post(VALID_BODY, { Authorization: "Bearer fake_token" });
			expect(res.status).toBe(200);
		});
	});

	// -------------------------------------------------------------------------
	// TC-300〜399: リクエストチェック（ボディ）
	// -------------------------------------------------------------------------
	describe("リクエストチェック（ボディ）", () => {
		describe("email", () => {
			it("TC-301: emailを省略する", async () => {
				const { email: _, ...body } = VALID_BODY;
				const res = await post(body);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("メールアドレスを入力してください");
			});

			it("TC-302: emailにnullを指定する", async () => {
				const res = await post({ ...VALID_BODY, email: null });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-303: emailに空文字を指定する", async () => {
				const res = await post({ ...VALID_BODY, email: "" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("メールアドレスを入力してください");
			});

			it("TC-304: emailにメールアドレス形式でない文字列を指定する", async () => {
				const res = await post({ ...VALID_BODY, email: "not-an-email" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("有効なメールアドレスを入力してください");
			});

			it("TC-305: emailに256文字の文字列を指定する", async () => {
				const email = `${"a".repeat(244)}@example.com`; // 256文字
				const res = await post({ ...VALID_BODY, email });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("メールアドレスは255文字以内で入力してください");
			});
		});

		describe("password", () => {
			it("TC-306: passwordを省略する", async () => {
				const { password: _, ...body } = VALID_BODY;
				const res = await post(body);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("パスワードを入力してください");
			});

			it("TC-307: passwordに7文字の文字列を指定する", async () => {
				const res = await post({ ...VALID_BODY, password: "Pass123" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("パスワードは8文字以上で入力してください");
			});

			it("TC-308: passwordに256文字の文字列を指定する", async () => {
				const password = `Aa1${"a".repeat(253)}`; // 256文字
				const res = await post({ ...VALID_BODY, password });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("パスワードは255文字以内で入力してください");
			});
		});

		describe("リクエストボディ全体", () => {
			it("TC-374: リクエストボディを送信しない（空リクエスト）", async () => {
				const res = await app.request("/api/v1/auth/signin", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});
				expect(res.status).toBe(400);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("BAD_REQUEST");
				expect(json.error.messages[0]).toBe("リクエストの形式が正しくありません");
			});

			it("TC-375: Content-Typeがapplication/jsonでないリクエストを送信する", async () => {
				const res = await app.request("/api/v1/auth/signin", {
					method: "POST",
					headers: { "Content-Type": "text/plain" },
					body: "invalid json content",
				});
				expect(res.status).toBe(400);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("BAD_REQUEST");
				expect(json.error.messages[0]).toBe("リクエストの形式が正しくありません");
			});
		});
	});

	// -------------------------------------------------------------------------
	// TC-400〜499: 分岐処理
	// -------------------------------------------------------------------------
	describe("分岐処理", () => {
		it("TC-401: 有効なメールアドレスとパスワードを指定してリクエストを送信する", async () => {
			const res = await post(VALID_BODY);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: { accessToken: string; refreshToken: string } };
			expect(json.data.accessToken).toBe("mock-access-token");
			expect(typeof json.data.refreshToken).toBe("string");
		});

		it("TC-402: 存在しないメールアドレスを指定する", async () => {
			vi.mocked(authService.signin).mockRejectedValueOnce(
				new AppError(401, "UNAUTHORIZED", "メールアドレスまたはパスワードが正しくありません"),
			);
			const res = await post({ email: "notfound@example.com", password: "Password1" });
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("メールアドレスまたはパスワードが正しくありません");
		});

		it("TC-403: パスワードが不一致の場合", async () => {
			vi.mocked(authService.signin).mockRejectedValueOnce(
				new AppError(401, "UNAUTHORIZED", "メールアドレスまたはパスワードが正しくありません"),
			);
			const res = await post({ ...VALID_BODY, password: "WrongPass1" });
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("メールアドレスまたはパスワードが正しくありません");
		});

		it("TC-404: 退会済みユーザーのメールアドレスを指定する", async () => {
			vi.mocked(authService.signin).mockRejectedValueOnce(
				new AppError(401, "UNAUTHORIZED", "メールアドレスまたはパスワードが正しくありません"),
			);
			const res = await post(VALID_BODY);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("メールアドレスまたはパスワードが正しくありません");
		});
	});

	// -------------------------------------------------------------------------
	// TC-500〜599: エラー（500系）
	// -------------------------------------------------------------------------
	describe("エラー（500系）", () => {
		it("TC-501: DB接続失敗時に500を返す", async () => {
			vi.mocked(authService.signin).mockRejectedValueOnce(new Error("DB connection failed"));
			const res = await post(VALID_BODY);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: トランザクション内でDBエラーが発生した場合500を返す", async () => {
			vi.mocked(authService.signin).mockRejectedValueOnce(
				new AppError(500, "INTERNAL_SERVER_ERROR", "サーバーエラーが発生しました"),
			);
			const res = await post(VALID_BODY);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("サーバーエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(authService.signin).mockRejectedValueOnce(new Error("DB error"));
			const res = await post(VALID_BODY);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
		});
	});
});
