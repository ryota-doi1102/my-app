import { OpenAPIHono } from "@hono/zod-openapi";
import { sign } from "hono/jwt";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorHandler } from "../../middleware/error.js";
import usersRoute from "../../routes/users.js";
import { userService } from "../../services/userService/index.js";
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

vi.mock("../../services/userService/index.js", () => ({
	userService: {
		searchUsers: vi.fn(),
		createUserProfile: vi.fn(),
		getUserProfile: vi.fn(),
		updateUserProfile: vi.fn(),
		deleteUser: vi.fn(),
		deleteUsers: vi.fn(),
		submitImportJob: vi.fn(),
		getImportJob: vi.fn(),
		submitExportJob: vi.fn(),
		getExportJob: vi.fn(),
	},
}));

const app = new OpenAPIHono();
app.route("/api/v1/users", usersRoute);
app.onError(errorHandler);

const JWT_SECRET = "test-secret";
const VALID_USER_ID = "11111111-1111-1111-1111-111111111111";
const NON_EXISTENT_ID = "99999999-9999-9999-9999-999999999999";

let validToken: string;
let expiredToken: string;

function del(id: string, token?: string) {
	return app.request(`/api/v1/users/${id}`, {
		method: "DELETE",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
}

describe("API-USER-05 DELETE /api/v1/users/:id", () => {
	beforeAll(async () => {
		vi.stubEnv("JWT_SECRET", JWT_SECRET);
		const now = Math.floor(Date.now() / 1000);
		validToken = await sign(
			{ sub: VALID_USER_ID, email: "test@example.com", iat: now, exp: now + 3600 },
			JWT_SECRET,
			"HS256",
		);
		expiredToken = await sign(
			{ sub: VALID_USER_ID, email: "test@example.com", iat: now - 7200, exp: now - 3600 },
			JWT_SECRET,
			"HS256",
		);
	});

	afterAll(() => {
		vi.unstubAllEnvs();
	});

	beforeEach(() => {
		vi.mocked(userService.deleteUser).mockResolvedValue(undefined as never);
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: Authorizationヘッダーなしで最小有効なリクエストを送信する", async () => {
			const res = await del(VALID_USER_ID);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("認証が必要です");
		});

		it("TC-002: 不正な形式のトークンを付与してリクエストを送信する", async () => {
			const res = await app.request(`/api/v1/users/${VALID_USER_ID}`, {
				method: "DELETE",
				headers: { Authorization: "Bearer invalid_token" },
			});
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});

		it("TC-003: 期限切れのトークンを付与してリクエストを送信する", async () => {
			const res = await del(VALID_USER_ID, expiredToken);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});
	});

	// -------------------------------------------------------------------------
	// TC-200〜299: リクエストチェック（パラム）
	// -------------------------------------------------------------------------
	describe("リクエストチェック（パラム）", () => {
		// UUID バリデーションは params スキーマ（z.string().uuid()）で行われるため 422 を返す
		it("TC-201: idにUUID形式でない文字列を指定する", async () => {
			const res = await del("abc", validToken);
			expect(res.status).toBe(422);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("VALIDATION_ERROR");
		});

		it("TC-202: idに存在しないユーザーのUUIDを指定する", async () => {
			vi.mocked(userService.deleteUser).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "ユーザーが見つかりません"),
			);
			const res = await del(NON_EXISTENT_ID, validToken);
			expect(res.status).toBe(404);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("NOT_FOUND");
			expect(json.error.messages[0]).toBe("ユーザーが見つかりません");
		});

		it("TC-203: idに論理削除済みユーザーのUUIDを指定する", async () => {
			vi.mocked(userService.deleteUser).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "ユーザーが見つかりません"),
			);
			const res = await del(VALID_USER_ID, validToken);
			expect(res.status).toBe(404);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("NOT_FOUND");
			expect(json.error.messages[0]).toBe("ユーザーが見つかりません");
		});
	});

	// -------------------------------------------------------------------------
	// TC-400〜499: 分岐処理
	// -------------------------------------------------------------------------
	describe("分岐処理", () => {
		it("TC-401: 有効なユーザーIDを指定してリクエストを送信する", async () => {
			const res = await del(VALID_USER_ID, validToken);
			expect(res.status).toBe(204);
		});

		it("TC-402: 削除済みユーザーのIDで再度削除を試みる", async () => {
			vi.mocked(userService.deleteUser).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "ユーザーが見つかりません"),
			);
			const res = await del(VALID_USER_ID, validToken);
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
			vi.mocked(userService.deleteUser).mockRejectedValueOnce(new Error("DB connection failed"));
			const res = await del(VALID_USER_ID, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: DBエラーが発生した場合に500を返す", async () => {
			vi.mocked(userService.deleteUser).mockRejectedValueOnce(
				new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました"),
			);
			const res = await del(VALID_USER_ID, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("予期せぬエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(userService.deleteUser).mockRejectedValueOnce(new Error("DB error"));
			const res = await del(VALID_USER_ID, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
			vi.stubEnv("JWT_SECRET", JWT_SECRET);
		});
	});
});
