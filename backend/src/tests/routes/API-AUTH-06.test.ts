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

const MOCK_TOKEN = "550e8400-e29b-41d4-a716-446655440000";

function post(body: unknown, headers?: Record<string, string>) {
	return app.request("/api/v1/auth/password-reset/request", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
}

describe("API-AUTH-06 POST /api/v1/auth/password-reset/request", () => {
	beforeEach(() => {
		vi.mocked(authService.requestPasswordReset).mockResolvedValue({ token: MOCK_TOKEN });
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: BearerトークンつきでもリクエストをPOSTできる（認証ヘッダーは無視される）", async () => {
			const res = await post({ email: "test@example.com" }, { Authorization: "Bearer fake_token" });
			expect(res.status).toBe(201);
		});
	});

	// -------------------------------------------------------------------------
	// TC-300〜399: リクエストチェック（ボディ）
	// -------------------------------------------------------------------------
	describe("リクエストチェック（ボディ）", () => {
		describe("email", () => {
			it("TC-301: emailを省略する", async () => {
				const res = await post({});
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("メールアドレスを入力してください");
			});

			it("TC-302: emailにnullを指定する", async () => {
				const res = await post({ email: null });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-303: emailに空文字を指定する", async () => {
				const res = await post({ email: "" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("メールアドレスを入力してください");
			});

			it("TC-304: emailにメールアドレス形式でない文字列を指定する", async () => {
				const res = await post({ email: "not-an-email" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("有効なメールアドレスを入力してください");
			});

			it("TC-305: emailに256文字の文字列を指定する", async () => {
				const email = `${"a".repeat(244)}@example.com`; // 256文字
				const res = await post({ email });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("メールアドレスは255文字以内で入力してください");
			});
		});

		describe("リクエストボディ全体", () => {
			it("TC-374: リクエストボディを送信しない（空リクエスト）", async () => {
				const res = await app.request("/api/v1/auth/password-reset/request", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});
				expect(res.status).toBe(400);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("BAD_REQUEST");
				expect(json.error.messages[0]).toBe("リクエストの形式が正しくありません");
			});

			it("TC-375: Content-Typeがapplication/jsonでないリクエストを送信する", async () => {
				const res = await app.request("/api/v1/auth/password-reset/request", {
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
		it("TC-401: 登録済みユーザーの有効なメールアドレスを指定してリクエストを送信する", async () => {
			const res = await post({ email: "test@example.com" });
			expect(res.status).toBe(201);
			const json = (await res.json()) as { data: { token: string } };
			expect(json.data.token).toBe(MOCK_TOKEN);
		});

		it("TC-402: 存在しないメールアドレスを指定する", async () => {
			vi.mocked(authService.requestPasswordReset).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "このメールアドレスのユーザーが見つかりません"),
			);
			const res = await post({ email: "notfound@example.com" });
			expect(res.status).toBe(404);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("NOT_FOUND");
			expect(json.error.messages[0]).toBe("このメールアドレスのユーザーが見つかりません");
		});

		it("TC-403: 同一メールアドレスで再度リクエストを送信する（新しいトークンが返る）", async () => {
			const newToken = "660e8400-e29b-41d4-a716-446655440000";
			vi.mocked(authService.requestPasswordReset).mockResolvedValueOnce({ token: newToken });
			const res = await post({ email: "test@example.com" });
			expect(res.status).toBe(201);
			const json = (await res.json()) as { data: { token: string } };
			expect(json.data.token).toBe(newToken);
		});
	});

	// -------------------------------------------------------------------------
	// TC-500〜599: エラー（500系）
	// -------------------------------------------------------------------------
	describe("エラー（500系）", () => {
		it("TC-501: DB接続失敗時に500を返す", async () => {
			vi.mocked(authService.requestPasswordReset).mockRejectedValueOnce(
				new Error("DB connection failed"),
			);
			const res = await post({ email: "test@example.com" });
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: トランザクション内でDBエラーが発生した場合500を返す", async () => {
			vi.mocked(authService.requestPasswordReset).mockRejectedValueOnce(
				new AppError(500, "INTERNAL_SERVER_ERROR", "サーバーエラーが発生しました"),
			);
			const res = await post({ email: "test@example.com" });
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("サーバーエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(authService.requestPasswordReset).mockRejectedValueOnce(new Error("DB error"));
			const res = await post({ email: "test@example.com" });
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
		});
	});
});
