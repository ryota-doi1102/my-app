import { gzipSync } from "node:zlib";
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
const VALID_CSV = "ID,氏名\n,山田太郎\n";

let validToken: string;
let expiredToken: string;

function importFile(
	body: string | Buffer | Uint8Array,
	extraHeaders: Record<string, string> = {},
	token?: string,
) {
	return app.request("/api/v1/users/import", {
		method: "POST",
		headers: {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...extraHeaders,
		},
		body,
	});
}

describe("API-USER-08 POST /api/v1/users/import", () => {
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
		vi.mocked(userService.submitImportJob).mockResolvedValue(MOCK_JOB_ID as never);
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: Authorizationヘッダーなしで最小有効なリクエストを送信する", async () => {
			const res = await importFile(VALID_CSV, { "Content-Type": "text/csv" });
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("認証が必要です");
		});

		it("TC-002: 不正な形式のトークンを付与してリクエストを送信する", async () => {
			const res = await app.request("/api/v1/users/import", {
				method: "POST",
				headers: {
					"Content-Type": "text/csv",
					Authorization: "Bearer invalid_token",
				},
				body: VALID_CSV,
			});
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});

		it("TC-003: 期限切れのトークンを付与してリクエストを送信する", async () => {
			const res = await importFile(
				VALID_CSV,
				{ "Content-Type": "text/csv" },
				expiredToken,
			);
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
		it("TC-301: Content-Encoding: gzip を付与したが gzip でないファイルを送信する", async () => {
			const res = await importFile(
				VALID_CSV,
				{ "Content-Type": "text/csv", "Content-Encoding": "gzip" },
				validToken,
			);
			expect(res.status).toBe(400);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("BAD_REQUEST");
			expect(json.error.messages[0]).toBe(
				"ファイル形式が正しくありません（gzipファイルではありません）",
			);
		});

		it("TC-302: gzip ファイルを Content-Encoding なしで送信する", async () => {
			const gzipped = gzipSync(Buffer.from(VALID_CSV));
			const res = await importFile(
				gzipped,
				{ "Content-Type": "text/csv" },
				validToken,
			);
			expect(res.status).toBe(400);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("BAD_REQUEST");
			expect(json.error.messages[0]).toBe(
				"ファイル形式が正しくありません（CSVファイルを指定してください）",
			);
		});

		it("TC-303: 破損した gzip ファイルを送信する（解凍失敗）", async () => {
			const brokenGzip = Buffer.concat([
				Buffer.from([0x1f, 0x8b]),
				Buffer.from([0x00, 0x00, 0xff, 0xff]),
			]);
			const res = await importFile(
				brokenGzip,
				{ "Content-Type": "text/csv", "Content-Encoding": "gzip" },
				validToken,
			);
			expect(res.status).toBe(400);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("BAD_REQUEST");
			expect(json.error.messages[0]).toBe("ファイルの解凍に失敗しました");
		});

		it("TC-304: 空ファイル（0バイト）を送信する", async () => {
			const res = await importFile(
				new Uint8Array(0),
				{ "Content-Type": "text/csv" },
				validToken,
			);
			expect(res.status).toBe(400);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("BAD_REQUEST");
			expect(json.error.messages[0]).toBe("ファイルが空です");
		});
	});

	// -------------------------------------------------------------------------
	// TC-400〜499: 分岐処理
	// -------------------------------------------------------------------------
	describe("分岐処理", () => {
		it("TC-401: 有効なCSVファイルを Content-Type: text/csv で送信する", async () => {
			const res = await importFile(
				VALID_CSV,
				{ "Content-Type": "text/csv" },
				validToken,
			);
			expect(res.status).toBe(200);
			const json = (await res.json()) as { data: { jobId: string } };
			expect(json.data.jobId).toBe(MOCK_JOB_ID);
		});

		it("TC-402: gzip圧縮した有効なCSVファイルを Content-Encoding: gzip 付きで送信する", async () => {
			const gzipped = gzipSync(Buffer.from(VALID_CSV));
			const res = await importFile(
				gzipped,
				{ "Content-Type": "text/csv", "Content-Encoding": "gzip" },
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
			vi.mocked(userService.submitImportJob).mockRejectedValueOnce(
				new Error("DB connection failed"),
			);
			const res = await importFile(
				VALID_CSV,
				{ "Content-Type": "text/csv" },
				validToken,
			);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: DBエラーが発生した場合に500を返す", async () => {
			vi.mocked(userService.submitImportJob).mockRejectedValueOnce(
				new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました"),
			);
			const res = await importFile(
				VALID_CSV,
				{ "Content-Type": "text/csv" },
				validToken,
			);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("予期せぬエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(userService.submitImportJob).mockRejectedValueOnce(
				new Error("DB error"),
			);
			const res = await importFile(
				VALID_CSV,
				{ "Content-Type": "text/csv" },
				validToken,
			);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
			vi.stubEnv("JWT_SECRET", JWT_SECRET);
		});
	});
});
