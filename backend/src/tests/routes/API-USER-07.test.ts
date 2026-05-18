import { OpenAPIHono } from "@hono/zod-openapi";
import { sign } from "hono/jwt";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../middleware/error.js";
import usersRoute from "../../routes/users.js";
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

let validToken: string;
let expiredToken: string;

function getTemplate(token?: string) {
	return app.request("/api/v1/users/template", {
		method: "GET",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
}

describe("API-USER-07 GET /api/v1/users/template", () => {
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

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: Authorizationヘッダーなしでリクエストを送信する", async () => {
			const res = await getTemplate();
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("認証が必要です");
		});

		it("TC-002: 不正な形式のトークンを付与してリクエストを送信する", async () => {
			const res = await app.request("/api/v1/users/template", {
				method: "GET",
				headers: { Authorization: "Bearer invalid_token" },
			});
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});

		it("TC-003: 期限切れのトークンを付与してリクエストを送信する", async () => {
			const res = await getTemplate(expiredToken);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});
	});

	// -------------------------------------------------------------------------
	// TC-400〜499: 分岐処理
	// -------------------------------------------------------------------------
	describe("分岐処理", () => {
		it("TC-401: 有効なトークンでリクエストを送信する", async () => {
			const res = await getTemplate(validToken);
			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toContain("text/csv");
			expect(res.headers.get("Content-Disposition")).toContain(
				"users_import_template.csv",
			);
		});

		it("TC-402: レスポンスのCSVにヘッダー行が27列含まれる", async () => {
			const res = await getTemplate(validToken);
			expect(res.status).toBe(200);
			const text = await res.text();
			const withoutBom = text.replace(/^﻿/, "");
			const headerLine = withoutBom.split("\n")[0] ?? "";
			const columns = headerLine.split(",");
			expect(columns).toHaveLength(27);
		});

		it("TC-403: レスポンスが UTF-8 BOM 付きであることを確認する", async () => {
			const res = await getTemplate(validToken);
			expect(res.status).toBe(200);
			const buffer = await res.arrayBuffer();
			const bytes = new Uint8Array(buffer);
			expect(bytes[0]).toBe(0xef);
			expect(bytes[1]).toBe(0xbb);
			expect(bytes[2]).toBe(0xbf);
		});
	});
});
