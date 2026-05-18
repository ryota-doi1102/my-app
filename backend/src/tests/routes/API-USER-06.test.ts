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
const VALID_ID_1 = "11111111-1111-1111-1111-111111111111";
const VALID_ID_2 = "22222222-2222-2222-2222-222222222222";
const VALID_ID_3 = "33333333-3333-3333-3333-333333333333";
const NON_EXISTENT_ID = "99999999-9999-9999-9999-999999999999";

let validToken: string;
let expiredToken: string;

function bulkDelete(body: unknown, token?: string) {
	return app.request("/api/v1/users/bulk", {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(body),
	});
}

/** 101件のUUID配列を生成する */
function generateIds(count: number): string[] {
	return Array.from({ length: count }, (_, i) => {
		const hex = i.toString(16).padStart(12, "0");
		return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-1111-1111-111111111111`;
	});
}

describe("API-USER-06 DELETE /api/v1/users/bulk", () => {
	beforeAll(async () => {
		vi.stubEnv("JWT_SECRET", JWT_SECRET);
		const now = Math.floor(Date.now() / 1000);
		validToken = await sign(
			{ sub: VALID_ID_1, email: "test@example.com", iat: now, exp: now + 3600 },
			JWT_SECRET,
			"HS256",
		);
		expiredToken = await sign(
			{ sub: VALID_ID_1, email: "test@example.com", iat: now - 7200, exp: now - 3600 },
			JWT_SECRET,
			"HS256",
		);
	});

	afterAll(() => {
		vi.unstubAllEnvs();
	});

	beforeEach(() => {
		vi.mocked(userService.deleteUsers).mockResolvedValue(undefined as never);
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: Authorizationヘッダーなしで最小有効なリクエストを送信する", async () => {
			const res = await bulkDelete({ ids: [VALID_ID_1] });
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("認証が必要です");
		});

		it("TC-002: 不正な形式のトークンを付与してリクエストを送信する", async () => {
			const res = await app.request("/api/v1/users/bulk", {
				method: "DELETE",
				headers: { "Content-Type": "application/json", Authorization: "Bearer invalid_token" },
				body: JSON.stringify({ ids: [VALID_ID_1] }),
			});
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});

		it("TC-003: 期限切れのトークンを付与してリクエストを送信する", async () => {
			const res = await bulkDelete({ ids: [VALID_ID_1] }, expiredToken);
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
		describe("ids", () => {
			it("TC-301: idsを省略する", async () => {
				const res = await bulkDelete({}, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("IDは1件以上指定してください");
			});

			it("TC-302: idsにnullを指定する", async () => {
				const res = await bulkDelete({ ids: null }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-303: idsに空配列を指定する", async () => {
				const res = await bulkDelete({ ids: [] }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("IDは1件以上指定してください");
			});

			it("TC-304: idsに101件指定する", async () => {
				const res = await bulkDelete({ ids: generateIds(101) }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("IDは100件以内で指定してください");
			});

			it("TC-305: idsにUUID形式でない要素を含む", async () => {
				const res = await bulkDelete({ ids: ["abc"] }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("IDの形式が正しくありません");
			});
		});

		describe("リクエストボディ全体", () => {
			it("TC-374: リクエストボディを送信しない（空リクエスト）", async () => {
				const res = await app.request("/api/v1/users/bulk", {
					method: "DELETE",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${validToken}` },
				});
				expect(res.status).toBe(400);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("BAD_REQUEST");
			});

			it("TC-375: Content-Typeがapplication/jsonでないリクエストを送信する", async () => {
				const res = await app.request("/api/v1/users/bulk", {
					method: "DELETE",
					headers: { "Content-Type": "text/plain", Authorization: `Bearer ${validToken}` },
					body: `{"ids":["${VALID_ID_1}"]}`,
				});
				expect(res.status).toBe(400);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("BAD_REQUEST");
			});
		});
	});

	// -------------------------------------------------------------------------
	// TC-400〜499: 分岐処理
	// -------------------------------------------------------------------------
	describe("分岐処理", () => {
		it("TC-401: 有効なUUIDを1件指定する", async () => {
			const res = await bulkDelete({ ids: [VALID_ID_1] }, validToken);
			expect(res.status).toBe(204);
		});

		it("TC-402: 有効なUUIDを複数件（3件）指定する", async () => {
			const res = await bulkDelete({ ids: [VALID_ID_1, VALID_ID_2, VALID_ID_3] }, validToken);
			expect(res.status).toBe(204);
		});

		it("TC-403: 有効なUUIDを100件指定する（上限）", async () => {
			const res = await bulkDelete({ ids: generateIds(100) }, validToken);
			expect(res.status).toBe(204);
		});

		it("TC-404: 存在しないUUIDのみ指定する（スキップされる）", async () => {
			const res = await bulkDelete({ ids: [NON_EXISTENT_ID] }, validToken);
			expect(res.status).toBe(204);
		});

		it("TC-405: 論理削除済みのUUIDのみ指定する（スキップされる）", async () => {
			const res = await bulkDelete({ ids: [VALID_ID_1] }, validToken);
			expect(res.status).toBe(204);
		});

		it("TC-406: 有効なUUIDと存在しないUUIDを混在させる", async () => {
			const res = await bulkDelete({ ids: [VALID_ID_1, NON_EXISTENT_ID] }, validToken);
			expect(res.status).toBe(204);
		});
	});

	// -------------------------------------------------------------------------
	// TC-500〜599: エラー（500系）
	// -------------------------------------------------------------------------
	describe("エラー（500系）", () => {
		it("TC-501: DB接続失敗時に500を返す", async () => {
			vi.mocked(userService.deleteUsers).mockRejectedValueOnce(new Error("DB connection failed"));
			const res = await bulkDelete({ ids: [VALID_ID_1] }, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: DBエラーが発生した場合に500を返す", async () => {
			vi.mocked(userService.deleteUsers).mockRejectedValueOnce(
				new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました"),
			);
			const res = await bulkDelete({ ids: [VALID_ID_1] }, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("予期せぬエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(userService.deleteUsers).mockRejectedValueOnce(new Error("DB error"));
			const res = await bulkDelete({ ids: [VALID_ID_1] }, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
			vi.stubEnv("JWT_SECRET", JWT_SECRET);
		});
	});
});
