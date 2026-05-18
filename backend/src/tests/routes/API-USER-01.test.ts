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

const MOCK_SEARCH_RESULT = {
	users: [
		{
			id: "11111111-1111-1111-1111-111111111111",
			name: "山田太郎",
			email: "yamada@example.com",
			phone: "09012345678",
			workTypes: ["フルタイム"],
		},
	],
	totalCount: 1,
	page: 1,
	perPage: 10,
	totalPages: 1,
};

const EMPTY_SEARCH_RESULT = {
	users: [],
	totalCount: 0,
	page: 1,
	perPage: 10,
	totalPages: 0,
};

let validToken: string;
let expiredToken: string;

function post(body: unknown, token?: string) {
	return app.request("/api/v1/users", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(body),
	});
}

describe("API-USER-01 POST /api/v1/users", () => {
	beforeAll(async () => {
		vi.stubEnv("JWT_SECRET", JWT_SECRET);
		const now = Math.floor(Date.now() / 1000);
		validToken = await sign(
			{ sub: "11111111-1111-1111-1111-111111111111", email: "test@example.com", iat: now, exp: now + 3600 },
			JWT_SECRET,
			"HS256",
		);
		expiredToken = await sign(
			{ sub: "11111111-1111-1111-1111-111111111111", email: "test@example.com", iat: now - 7200, exp: now - 3600 },
			JWT_SECRET,
			"HS256",
		);
	});

	afterAll(() => {
		vi.unstubAllEnvs();
	});

	beforeEach(() => {
		vi.mocked(userService.searchUsers).mockResolvedValue(MOCK_SEARCH_RESULT as never);
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: Authorizationヘッダーなしで最小有効なリクエストを送信する", async () => {
			const res = await post({});
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("認証が必要です");
		});

		it("TC-002: 不正な形式のトークンを付与してリクエストを送信する", async () => {
			const res = await app.request("/api/v1/users", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: "Bearer invalid_token" },
				body: JSON.stringify({}),
			});
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});

		it("TC-003: 期限切れのトークンを付与してリクエストを送信する", async () => {
			const res = await post({}, expiredToken);
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
		describe("workTypes", () => {
			it("TC-301: workTypesに許可値以外を指定する", async () => {
				const res = await post({ workTypes: ["unknown"] }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("希望勤務形態の形式が正しくありません");
			});

			it("TC-302: workTypesに空配列を指定する", async () => {
				const res = await post({ workTypes: [] }, validToken);
				expect(res.status).toBe(200);
			});

			it("TC-303: workTypesを省略する", async () => {
				const res = await post({}, validToken);
				expect(res.status).toBe(200);
			});
		});

		describe("sortKey", () => {
			it("TC-304: sortKeyに許可値以外を指定する", async () => {
				const res = await post({ sortKey: "birthday" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("ソートキーの形式が正しくありません");
			});

			it("TC-305: sortKeyにnullを指定する", async () => {
				const res = await post({ sortKey: null }, validToken);
				expect(res.status).toBe(200);
			});
		});

		describe("sortOrder", () => {
			it("TC-306: sortOrderに許可値以外を指定する", async () => {
				const res = await post({ sortOrder: "ASC" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("ソート方向の形式が正しくありません");
			});
		});

		describe("page", () => {
			it("TC-307: pageに0を指定する", async () => {
				const res = await post({ page: 0 }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-308: pageに負数を指定する", async () => {
				const res = await post({ page: -1 }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});
		});

		describe("perPage", () => {
			it("TC-309: perPageに許可値以外（15）を指定する", async () => {
				const res = await post({ perPage: 15 }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});
		});

		describe("リクエストボディ全体", () => {
			it("TC-374: リクエストボディを送信しない（空リクエスト）", async () => {
				const res = await app.request("/api/v1/users", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${validToken}` },
				});
				expect(res.status).toBe(400);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("BAD_REQUEST");
			});

			it("TC-375: Content-Typeがapplication/jsonでないリクエストを送信する", async () => {
				const res = await app.request("/api/v1/users", {
					method: "POST",
					headers: { "Content-Type": "text/plain", Authorization: `Bearer ${validToken}` },
					body: "{}",
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
		it("TC-401: 空オブジェクトで送信する（すべてデフォルト値）", async () => {
			const res = await post({}, validToken);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: typeof MOCK_SEARCH_RESULT };
			expect(json.data.users).toBeDefined();
			expect(json.data.totalCount).toBe(1);
		});

		it("TC-402: name/email/phoneで絞り込みを指定する", async () => {
			const res = await post({ name: "山田", email: "", phone: "" }, validToken);
			expect(res.status).toBe(200);
		});

		it("TC-403: workTypesで絞り込みを指定する", async () => {
			const res = await post({ workTypes: ["フルタイム", "リモート"] }, validToken);
			expect(res.status).toBe(200);
		});

		it("TC-404: sortKey/sortOrderでソートを指定する", async () => {
			const res = await post({ sortKey: "name", sortOrder: "asc" }, validToken);
			expect(res.status).toBe(200);
		});

		it("TC-405: page/perPageでページングを指定する", async () => {
			const res = await post({ page: 2, perPage: 20 }, validToken);
			expect(res.status).toBe(200);
		});

		it("TC-406: 検索条件が一致しない場合（空配列が返る）", async () => {
			vi.mocked(userService.searchUsers).mockResolvedValueOnce(EMPTY_SEARCH_RESULT as never);
			const res = await post({ name: "存在しないユーザー" }, validToken);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: typeof EMPTY_SEARCH_RESULT };
			expect(json.data.users).toHaveLength(0);
			expect(json.data.totalCount).toBe(0);
		});

		it("TC-407: pageがtotalPagesを超える場合（空配列が返る）", async () => {
			vi.mocked(userService.searchUsers).mockResolvedValueOnce({ ...EMPTY_SEARCH_RESULT, page: 99 } as never);
			const res = await post({ page: 99 }, validToken);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: typeof EMPTY_SEARCH_RESULT };
			expect(json.data.users).toHaveLength(0);
		});
	});

	// -------------------------------------------------------------------------
	// TC-500〜599: エラー（500系）
	// -------------------------------------------------------------------------
	describe("エラー（500系）", () => {
		it("TC-501: DB接続失敗時に500を返す", async () => {
			vi.mocked(userService.searchUsers).mockRejectedValueOnce(new Error("DB connection failed"));
			const res = await post({}, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: DBエラーが発生した場合に500を返す", async () => {
			vi.mocked(userService.searchUsers).mockRejectedValueOnce(
				new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました"),
			);
			const res = await post({}, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("予期せぬエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(userService.searchUsers).mockRejectedValueOnce(new Error("DB error"));
			const res = await post({}, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
			vi.stubEnv("JWT_SECRET", JWT_SECRET);
		});
	});
});
