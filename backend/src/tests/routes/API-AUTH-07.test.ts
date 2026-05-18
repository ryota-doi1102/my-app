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

const VALID_TOKEN = "550e8400-e29b-41d4-a716-446655440000";
const VALID_BODY = {
	token: VALID_TOKEN,
	password: "Password1",
};

function post(body: unknown, headers?: Record<string, string>) {
	return app.request("/api/v1/auth/password-reset", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
}

describe("API-AUTH-07 POST /api/v1/auth/password-reset", () => {
	beforeEach(() => {
		vi.mocked(authService.resetPassword).mockResolvedValue(undefined as never);
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
		describe("token", () => {
			it("TC-301: tokenを省略する", async () => {
				const { token: _, ...body } = VALID_BODY;
				const res = await post(body);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("トークンを入力してください");
			});

			it("TC-302: tokenにnullを指定する", async () => {
				const res = await post({ ...VALID_BODY, token: null });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-303: tokenに空文字を指定する", async () => {
				const res = await post({ ...VALID_BODY, token: "" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("トークンを入力してください");
			});

			it("TC-304: tokenにUUID v4形式でない文字列を指定する", async () => {
				const res = await post({ ...VALID_BODY, token: "not-a-uuid" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("UUID v4形式で入力してください");
			});

			it("TC-305: tokenに256文字の文字列を指定する", async () => {
				// uuid()はmax(255)より先に検証されるため、メッセージはアサートしない
				const res = await post({ ...VALID_BODY, token: "a".repeat(256) });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
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
				const password = `Aa1${"a".repeat(253)}`; // 256文字・regex通過
				const res = await post({ ...VALID_BODY, password });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("パスワードは255文字以内で入力してください");
			});

			it("TC-309: passwordに大文字を含まない文字列を指定する", async () => {
				const res = await post({ ...VALID_BODY, password: "password1" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe(
					"半角英数字（大文字・小文字・数字をそれぞれ1文字以上含む）で入力してください",
				);
			});

			it("TC-310: passwordに小文字を含まない文字列を指定する", async () => {
				const res = await post({ ...VALID_BODY, password: "PASSWORD1" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe(
					"半角英数字（大文字・小文字・数字をそれぞれ1文字以上含む）で入力してください",
				);
			});

			it("TC-311: passwordに数字を含まない文字列を指定する", async () => {
				const res = await post({ ...VALID_BODY, password: "Password" });
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe(
					"半角英数字（大文字・小文字・数字をそれぞれ1文字以上含む）で入力してください",
				);
			});
		});

		describe("リクエストボディ全体", () => {
			it("TC-374: リクエストボディを送信しない（空リクエスト）", async () => {
				const res = await app.request("/api/v1/auth/password-reset", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});
				expect(res.status).toBe(400);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("BAD_REQUEST");
				expect(json.error.messages[0]).toBe("リクエストの形式が正しくありません");
			});

			it("TC-375: Content-Typeがapplication/jsonでないリクエストを送信する", async () => {
				const res = await app.request("/api/v1/auth/password-reset", {
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
		it("TC-401: 有効なトークンと新しいパスワードを指定してリクエストを送信する", async () => {
			const res = await post(VALID_BODY);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: null };
			expect(json.data).toBeNull();
		});

		it("TC-402: 存在しないトークンを指定する", async () => {
			vi.mocked(authService.resetPassword).mockRejectedValueOnce(
				new AppError(401, "UNAUTHORIZED", "トークンが無効または期限切れです"),
			);
			const res = await post(VALID_BODY);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効または期限切れです");
		});

		it("TC-403: 有効期限切れのトークンを指定する", async () => {
			vi.mocked(authService.resetPassword).mockRejectedValueOnce(
				new AppError(401, "UNAUTHORIZED", "トークンが無効または期限切れです"),
			);
			const res = await post(VALID_BODY);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効または期限切れです");
		});

		it("TC-404: 使用済みのトークンを指定する", async () => {
			vi.mocked(authService.resetPassword).mockRejectedValueOnce(
				new AppError(401, "UNAUTHORIZED", "トークンが無効または期限切れです"),
			);
			const res = await post(VALID_BODY);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効または期限切れです");
		});

		it("TC-405: 対応するユーザーが退会済みの場合", async () => {
			vi.mocked(authService.resetPassword).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "ユーザーが見つかりません"),
			);
			const res = await post(VALID_BODY);
			expect(res.status).toBe(404);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("NOT_FOUND");
			expect(json.error.messages[0]).toBe("ユーザーが見つかりません");
		});
	});

	// -------------------------------------------------------------------------
	// TC-500〜599: エラー（500系）
	// -------------------------------------------------------------------------
	describe("エラー（500系）", () => {
		it("TC-501: DB接続失敗時に500を返す", async () => {
			vi.mocked(authService.resetPassword).mockRejectedValueOnce(
				new Error("DB connection failed"),
			);
			const res = await post(VALID_BODY);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: トランザクション内でDBエラーが発生した場合500を返す", async () => {
			vi.mocked(authService.resetPassword).mockRejectedValueOnce(
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
			vi.mocked(authService.resetPassword).mockRejectedValueOnce(new Error("DB error"));
			const res = await post(VALID_BODY);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
		});
	});
});
