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
const VALID_JOB_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const NON_EXISTENT_JOB_ID = "99999999-9999-9999-9999-999999999999";

const MOCK_PROCESSING_JOB = {
	id: VALID_JOB_ID,
	status: "processing" as const,
};

const MOCK_COMPLETED_JOB = {
	id: VALID_JOB_ID,
	status: "completed" as const,
	result: { created: 5, updated: 2 },
};

let validToken: string;
let expiredToken: string;

function getImportJob(jobId: string, token?: string) {
	return app.request(`/api/v1/users/import-jobs/${jobId}`, {
		method: "GET",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
}

describe("API-USER-09 GET /api/v1/users/import-jobs/:jobId", () => {
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
		vi.mocked(userService.getImportJob).mockResolvedValue(
			MOCK_PROCESSING_JOB as never,
		);
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: Authorizationヘッダーなしで最小有効なリクエストを送信する", async () => {
			const res = await getImportJob(VALID_JOB_ID);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("認証が必要です");
		});

		it("TC-002: 不正な形式のトークンを付与してリクエストを送信する", async () => {
			const res = await app.request(
				`/api/v1/users/import-jobs/${VALID_JOB_ID}`,
				{
					method: "GET",
					headers: { Authorization: "Bearer invalid_token" },
				},
			);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});

		it("TC-003: 期限切れのトークンを付与してリクエストを送信する", async () => {
			const res = await getImportJob(VALID_JOB_ID, expiredToken);
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
		it("TC-201: jobIdにUUID形式でない文字列を指定する", async () => {
			vi.mocked(userService.getImportJob).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "ジョブが見つかりません"),
			);
			const res = await getImportJob("abc", validToken);
			expect(res.status).toBe(404);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("NOT_FOUND");
			expect(json.error.messages[0]).toBe("ジョブが見つかりません");
		});

		it("TC-202: jobIdに存在しないUUIDを指定する", async () => {
			vi.mocked(userService.getImportJob).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "ジョブが見つかりません"),
			);
			const res = await getImportJob(NON_EXISTENT_JOB_ID, validToken);
			expect(res.status).toBe(404);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("NOT_FOUND");
			expect(json.error.messages[0]).toBe("ジョブが見つかりません");
		});
	});

	// -------------------------------------------------------------------------
	// TC-400〜499: 分岐処理
	// -------------------------------------------------------------------------
	describe("分岐処理", () => {
		it("TC-401: statusがpending/processingのジョブIDを指定する", async () => {
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(202);
			const json = (await res.json()) as { data: { status: string } };
			expect(json.data.status).toBe("processing");
		});

		it("TC-402: statusがcompletedのジョブIDを指定する", async () => {
			vi.mocked(userService.getImportJob).mockResolvedValueOnce(
				MOCK_COMPLETED_JOB as never,
			);
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(200);
			const json = (await res.json()) as {
				data: { result: { created: number; updated: number } };
			};
			expect(json.data.result.created).toBe(5);
			expect(json.data.result.updated).toBe(2);
		});

		it("TC-403: statusがfailed（ファイル構造エラー）のジョブIDを指定する", async () => {
			vi.mocked(userService.getImportJob).mockResolvedValueOnce({
				id: VALID_JOB_ID,
				status: "failed",
				errors: ["ファイル形式が正しくありません（CSVファイルを指定してください）"],
			} as never);
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(422);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNPROCESSABLE_ENTITY");
			expect(json.error.messages[0]).toBe(
				"ファイル形式が正しくありません（CSVファイルを指定してください）",
			);
		});

		it("TC-404: statusがfailed（行データバリデーションエラー）のジョブIDを指定する", async () => {
			vi.mocked(userService.getImportJob).mockResolvedValueOnce({
				id: VALID_JOB_ID,
				status: "failed",
				errors: [
					"2行目: 氏名は必須です",
					"3行目: メールアドレスの形式が正しくありません",
				],
			} as never);
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(422);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNPROCESSABLE_ENTITY");
			expect(json.error.messages[0]).toContain("行目:");
		});

		it("TC-405: statusがfailed（DB検証エラー：存在しないID）のジョブIDを指定する", async () => {
			vi.mocked(userService.getImportJob).mockResolvedValueOnce({
				id: VALID_JOB_ID,
				status: "failed",
				errors: ["5行目: 指定されたIDが存在しません"],
			} as never);
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(422);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNPROCESSABLE_ENTITY");
			expect(json.error.messages[0]).toContain("指定されたIDが存在しません");
		});

		it("TC-406: statusがfailed（DB検証エラー：メールアドレス重複）のジョブIDを指定する", async () => {
			vi.mocked(userService.getImportJob).mockResolvedValueOnce({
				id: VALID_JOB_ID,
				status: "failed",
				errors: ["3行目: このメールアドレスはすでに使用されています"],
			} as never);
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(422);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNPROCESSABLE_ENTITY");
			expect(json.error.messages[0]).toContain(
				"このメールアドレスはすでに使用されています",
			);
		});

		it("TC-407: statusがfailed（インポート実行エラー）のジョブIDを指定する", async () => {
			vi.mocked(userService.getImportJob).mockResolvedValueOnce({
				id: VALID_JOB_ID,
				status: "failed",
				errors: ["インポートに失敗しました"],
			} as never);
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("インポートに失敗しました");
		});
	});

	// -------------------------------------------------------------------------
	// TC-500〜599: エラー（500系）
	// -------------------------------------------------------------------------
	describe("エラー（500系）", () => {
		it("TC-501: DB接続失敗時に500を返す", async () => {
			vi.mocked(userService.getImportJob).mockRejectedValueOnce(
				new Error("DB connection failed"),
			);
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: DBエラーが発生した場合に500を返す", async () => {
			vi.mocked(userService.getImportJob).mockRejectedValueOnce(
				new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました"),
			);
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("予期せぬエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(userService.getImportJob).mockRejectedValueOnce(
				new Error("DB error"),
			);
			const res = await getImportJob(VALID_JOB_ID, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
			vi.stubEnv("JWT_SECRET", JWT_SECRET);
		});
	});
});
