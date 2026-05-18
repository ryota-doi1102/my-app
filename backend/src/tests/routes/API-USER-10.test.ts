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
const MOCK_JOB_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

let validToken: string;
let expiredToken: string;

function exportJob(body: unknown, token?: string) {
	return app.request("/api/v1/users/export", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(body),
	});
}

describe("API-USER-10 POST /api/v1/users/export", () => {
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
		vi.mocked(userService.submitExportJob).mockResolvedValue(MOCK_JOB_ID as never);
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: Authorizationヘッダーなしで最小有効なリクエストを送信する", async () => {
			const res = await exportJob({});
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("認証が必要です");
		});

		it("TC-002: 不正な形式のトークンを付与してリクエストを送信する", async () => {
			const res = await app.request("/api/v1/users/export", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer invalid_token",
				},
				body: JSON.stringify({}),
			});
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});

		it("TC-003: 期限切れのトークンを付与してリクエストを送信する", async () => {
			const res = await exportJob({}, expiredToken);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});
	});

	// -------------------------------------------------------------------------
	// TC-300〜399: リクエストチェック（ボディ）
	// -------------------------------------------------------------------------
	describe("リクエストチェック（ボディ）", () => {
		it("TC-374: Content-Typeがapplication/jsonでないリクエストを送信する", async () => {
			const res = await app.request("/api/v1/users/export", {
				method: "POST",
				headers: {
					"Content-Type": "text/plain",
					Authorization: `Bearer ${validToken}`,
				},
				body: "invalid json content",
			});
			expect(res.status).toBe(400);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("BAD_REQUEST");
		});
	});

	// -------------------------------------------------------------------------
	// TC-400〜499: 分岐処理
	// -------------------------------------------------------------------------
	describe("分岐処理", () => {
		it("TC-401: 空ボディ（{}）で送信する（全件エクスポート）", async () => {
			const res = await exportJob({}, validToken);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: { jobId: string } };
			expect(json.data.jobId).toBe(MOCK_JOB_ID);
		});

		it("TC-402: name/email/phoneで部分一致絞り込みを指定する", async () => {
			const res = await exportJob(
				{ name: "山田", email: "example", phone: "090" },
				validToken,
			);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: { jobId: string } };
			expect(json.data.jobId).toBe(MOCK_JOB_ID);
		});

		it("TC-403: workTypesで絞り込みを指定する", async () => {
			const res = await exportJob(
				{ workTypes: ["フルタイム", "リモート"] },
				validToken,
			);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: { jobId: string } };
			expect(json.data.jobId).toBe(MOCK_JOB_ID);
		});

		it("TC-404: sortKey/sortOrderでソートを指定する", async () => {
			const res = await exportJob(
				{ sortKey: "name", sortOrder: "asc" },
				validToken,
			);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: { jobId: string } };
			expect(json.data.jobId).toBe(MOCK_JOB_ID);
		});
	});

	// -------------------------------------------------------------------------
	// TC-500〜599: エラー（500系）
	// -------------------------------------------------------------------------
	describe("エラー（500系）", () => {
		it("TC-501: DB接続失敗時に500を返す", async () => {
			vi.mocked(userService.submitExportJob).mockRejectedValueOnce(
				new Error("DB connection failed"),
			);
			const res = await exportJob({}, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: DBエラーが発生した場合に500を返す", async () => {
			vi.mocked(userService.submitExportJob).mockRejectedValueOnce(
				new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました"),
			);
			const res = await exportJob({}, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("予期せぬエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(userService.submitExportJob).mockRejectedValueOnce(
				new Error("DB error"),
			);
			const res = await exportJob({}, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
			vi.stubEnv("JWT_SECRET", JWT_SECRET);
		});
	});
});
