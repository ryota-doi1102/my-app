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
		createUserProfile: vi.fn(),
		searchUsers: vi.fn(),
		getUserProfile: vi.fn(),
		updateUserProfile: vi.fn(),
		deleteUser: vi.fn(),
	},
}));

const app = new OpenAPIHono();
app.route("/api/v1/users", usersRoute);
app.onError(errorHandler);

const JWT_SECRET = "test-secret";
const VALID_USER_ID = "11111111-1111-1111-1111-111111111111";

/** 最小有効リクエストボディ（必須項目のみ） */
const MIN_BODY = {
	name: "山田太郎",
	birthDate: "1990-01-15",
	gender: "男性",
	email: "test@example.com",
	workHistories: [
		{ company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" },
	],
};

let validToken: string;
let expiredToken: string;

function put(id: string, body: unknown, token?: string) {
	return app.request(`/api/v1/users/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(body),
	});
}

/** 今日から n 年前の日付を YYYY-MM-DD 形式で返す */
function yearsAgoDate(years: number): string {
	const d = new Date();
	d.setFullYear(d.getFullYear() - years);
	return d.toISOString().slice(0, 10);
}

describe("API-USER-04 PUT /api/v1/users/:id", () => {
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
		vi.mocked(userService.updateUserProfile).mockResolvedValue(
			undefined as never,
		);
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: Authorizationヘッダーなしで最小有効なリクエストを送信する", async () => {
			const res = await put(VALID_USER_ID, MIN_BODY);
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("認証が必要です");
		});

		it("TC-002: 不正な形式のトークンを付与してリクエストを送信する", async () => {
			const res = await app.request(`/api/v1/users/${VALID_USER_ID}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer invalid_token",
				},
				body: JSON.stringify(MIN_BODY),
			});
			expect(res.status).toBe(401);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("UNAUTHORIZED");
			expect(json.error.messages[0]).toBe("トークンが無効です");
		});

		it("TC-003: 期限切れのトークンを付与してリクエストを送信する", async () => {
			const res = await put(VALID_USER_ID, MIN_BODY, expiredToken);
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
		it("TC-201: idにUUID形式でない文字列を指定する", async () => {
			vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "ユーザーが見つかりません"),
			);
			const res = await put("abc", MIN_BODY, validToken);
			expect(res.status).toBe(404);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("NOT_FOUND");
			expect(json.error.messages[0]).toBe("ユーザーが見つかりません");
		});

		it("TC-202: idに存在しないユーザーのUUIDを指定する", async () => {
			vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "ユーザーが見つかりません"),
			);
			const res = await put("22222222-2222-2222-2222-222222222222", MIN_BODY, validToken);
			expect(res.status).toBe(404);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("NOT_FOUND");
			expect(json.error.messages[0]).toBe("ユーザーが見つかりません");
		});

		it("TC-203: idに論理削除済みユーザーのUUIDを指定する", async () => {
			vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
				new AppError(404, "NOT_FOUND", "ユーザーが見つかりません"),
			);
			const res = await put("33333333-3333-3333-3333-333333333333", MIN_BODY, validToken);
			expect(res.status).toBe(404);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("NOT_FOUND");
			expect(json.error.messages[0]).toBe("ユーザーが見つかりません");
		});
	});

	// -------------------------------------------------------------------------
	// TC-300〜399: リクエストチェック（ボディ）
	// -------------------------------------------------------------------------
	describe("リクエストチェック（ボディ）", () => {
		// --- name ---
		describe("name", () => {
			it("TC-301: nameを省略する", async () => {
				const { name: _n, ...body } = MIN_BODY;
				const res = await put(VALID_USER_ID, body, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("氏名は必須項目です");
			});

			it("TC-302: nameにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, name: null }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-303: nameに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, name: "" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("氏名は必須項目です");
			});
		});

		// --- birthDate ---
		describe("birthDate", () => {
			it("TC-304: birthDateを省略する", async () => {
				const { birthDate: _b, ...body } = MIN_BODY;
				const res = await put(VALID_USER_ID, body, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("生年月日は必須項目です");
			});

			it("TC-305: birthDateにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, birthDate: null }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-306: birthDateに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, birthDate: "" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("生年月日は必須項目です");
			});

			it("TC-307: YYYY-MM-DD以外の形式を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, birthDate: "2000/01/01" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"生年月日はYYYY-MM-DD形式で入力してください",
				);
			});

			it("TC-308: 18歳未満の日付を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, birthDate: yearsAgoDate(17) }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("18歳未満の方は登録できません");
			});

			it("TC-309: ちょうど60歳の日付を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, birthDate: yearsAgoDate(60) }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("60歳以上の方は登録できません");
			});
		});

		// --- gender ---
		describe("gender", () => {
			it("TC-310: genderを省略する", async () => {
				const { gender: _g, ...body } = MIN_BODY;
				const res = await put(VALID_USER_ID, body, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("性別は必須項目です");
			});

			it("TC-311: genderにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, gender: null }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("性別は必須項目です");
			});

			it("TC-312: genderに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, gender: "" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("性別の形式が正しくありません");
			});

			it("TC-313: genderに許可値以外を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, gender: "unknown" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("性別の形式が正しくありません");
			});
		});

		// --- profileImage ---
		describe("profileImage", () => {
			it("TC-314: profileImageを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-315: profileImageにnullを明示的に指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, profileImage: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-316: profileImageに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, profileImage: "" }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-317: 非対応MIMEタイプを指定する", async () => {
				const res = await put(
					VALID_USER_ID,
					{ ...MIN_BODY, profileImage: "data:image/gif;base64,R0lGOD" },
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("対応していないファイル形式です");
			});

			it("TC-318: 有効なJPEGのbase64文字列を指定する", async () => {
				const res = await put(
					VALID_USER_ID,
					{ ...MIN_BODY, profileImage: "data:image/jpeg;base64,/9j/4AAQ" },
					validToken,
				);
				expect(res.status).toBe(204);
			});

			it("TC-319: 5MBを超えるbase64画像を指定する", async () => {
				const largeBase64 = "A".repeat(7_000_000);
				const res = await put(
					VALID_USER_ID,
					{ ...MIN_BODY, profileImage: `data:image/jpeg;base64,${largeBase64}` },
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("ファイルサイズが上限を超えています");
			});
		});

		// --- phone ---
		describe("phone", () => {
			it("TC-320: phoneを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-321: phoneにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, phone: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-322: phoneに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, phone: "" }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-323: phoneに9桁の数字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, phone: "090123456" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"電話番号は10〜11桁で入力してください",
				);
			});

			it("TC-324: phoneに12桁の数字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, phone: "090123456789" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"電話番号は10〜11桁で入力してください",
				);
			});
		});

		// --- email ---
		describe("email", () => {
			it("TC-325: emailを省略する", async () => {
				const { email: _e, ...body } = MIN_BODY;
				const res = await put(VALID_USER_ID, body, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("メールアドレスは必須項目です");
			});

			it("TC-326: emailにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, email: null }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-327: emailに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, email: "" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("メールアドレスは必須項目です");
			});

			it("TC-328: emailにメール形式でない文字列を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, email: "not-an-email" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"メールアドレスはメールアドレス形式で入力してください",
				);
			});
		});

		// --- postalCode ---
		describe("postalCode", () => {
			it("TC-329: postalCodeを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-330: postalCodeにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, postalCode: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-331: postalCodeに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, postalCode: "" }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-332: postalCodeに6桁の数字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, postalCode: "123456" }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("郵便番号は7桁で入力してください");
			});
		});

		// --- prefecture ---
		describe("prefecture", () => {
			it("TC-333: prefectureを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-334: prefectureにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, prefecture: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-335: prefectureに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, prefecture: "" }, validToken);
				expect(res.status).toBe(204);
			});
		});

		// --- city ---
		describe("city", () => {
			it("TC-336: cityを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-337: cityにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, city: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-338: cityに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, city: "" }, validToken);
				expect(res.status).toBe(204);
			});
		});

		// --- streetAddress ---
		describe("streetAddress", () => {
			it("TC-339: streetAddressを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-340: streetAddressにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, streetAddress: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-341: streetAddressに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, streetAddress: "" }, validToken);
				expect(res.status).toBe(204);
			});
		});

		// --- building ---
		describe("building", () => {
			it("TC-342: buildingを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-343: buildingにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, building: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-344: buildingに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, building: "" }, validToken);
				expect(res.status).toBe(204);
			});
		});

		// --- selfPR ---
		describe("selfPR", () => {
			it("TC-345: selfPRを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-346: selfPRにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, selfPR: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-347: selfPRに空文字を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, selfPR: "" }, validToken);
				expect(res.status).toBe(204);
			});
		});

		// --- workTypes ---
		describe("workTypes", () => {
			it("TC-348: workTypesを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-349: workTypesにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, workTypes: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-350: workTypesに空配列を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, workTypes: [] }, validToken);
				expect(res.status).toBe(204);
			});
		});

		// --- qualifications ---
		describe("qualifications", () => {
			it("TC-351: qualificationsを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-352: qualificationsにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, qualifications: null }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-353: qualificationsに空配列を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, qualifications: [] }, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-354: qualifications[0].valueに空文字を指定する", async () => {
				const res = await put(
					VALID_USER_ID,
					{ ...MIN_BODY, qualifications: [{ value: "" }] },
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("資格名は必須項目です");
			});
		});

		// --- workHistories ---
		describe("workHistories", () => {
			it("TC-355: workHistoriesを省略する", async () => {
				const { workHistories: _w, ...body } = MIN_BODY;
				const res = await put(VALID_USER_ID, body, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("職歴を1件以上入力してください");
			});

			it("TC-356: workHistoriesにnullを指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, workHistories: null }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-357: workHistoriesに空配列を指定する", async () => {
				const res = await put(VALID_USER_ID, { ...MIN_BODY, workHistories: [] }, validToken);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("職歴を1件以上入力してください");
			});

			it("TC-358: workHistories[0].companyを省略する", async () => {
				const res = await put(
					VALID_USER_ID,
					{ ...MIN_BODY, workHistories: [{ startMonth: "2020-04", role: "エンジニア" }] },
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("会社名は必須項目です");
			});

			it("TC-359: workHistories[0].companyに空文字を指定する", async () => {
				const res = await put(
					VALID_USER_ID,
					{
						...MIN_BODY,
						workHistories: [{ company: "", startMonth: "2020-04", role: "エンジニア" }],
					},
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("会社名は必須項目です");
			});

			it("TC-360: workHistories[0].startMonthを省略する", async () => {
				const res = await put(
					VALID_USER_ID,
					{ ...MIN_BODY, workHistories: [{ company: "株式会社ABC", role: "エンジニア" }] },
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("在籍開始月は必須項目です");
			});

			it("TC-361: workHistories[0].startMonthにYYYY-MM以外の形式を指定する", async () => {
				const res = await put(
					VALID_USER_ID,
					{
						...MIN_BODY,
						workHistories: [
							{ company: "株式会社ABC", startMonth: "2020/04", role: "エンジニア" },
						],
					},
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"在籍開始月はYYYY-MM形式で入力してください",
				);
			});

			it("TC-362: workHistories[0].roleを省略する", async () => {
				const res = await put(
					VALID_USER_ID,
					{ ...MIN_BODY, workHistories: [{ company: "株式会社ABC", startMonth: "2020-04" }] },
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("役職は必須項目です");
			});

			it("TC-363: workHistories[0].roleに空文字を指定する", async () => {
				const res = await put(
					VALID_USER_ID,
					{
						...MIN_BODY,
						workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "" }],
					},
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe("役職は必須項目です");
			});

			it("TC-364: workHistories[0].endMonthにnullを指定する（現職）", async () => {
				const res = await put(
					VALID_USER_ID,
					{
						...MIN_BODY,
						workHistories: [
							{
								company: "株式会社ABC",
								startMonth: "2020-04",
								endMonth: null,
								role: "エンジニア",
							},
						],
					},
					validToken,
				);
				expect(res.status).toBe(204);
			});

			it("TC-365: workHistories[0].endMonthを省略する", async () => {
				const res = await put(VALID_USER_ID, MIN_BODY, validToken);
				expect(res.status).toBe(204);
			});

			it("TC-366: workHistories[0].endMonthにYYYY-MM以外の形式を指定する", async () => {
				const res = await put(
					VALID_USER_ID,
					{
						...MIN_BODY,
						workHistories: [
							{
								company: "株式会社ABC",
								startMonth: "2020-04",
								endMonth: "2024/03",
								role: "エンジニア",
							},
						],
					},
					validToken,
				);
				expect(res.status).toBe(422);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"在籍終了月はYYYY-MM形式で入力してください",
				);
			});
		});

		// --- ボディ全体 ---
		describe("リクエストボディ全体", () => {
			it("TC-367: リクエストボディを送信しない", async () => {
				const res = await app.request(`/api/v1/users/${VALID_USER_ID}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${validToken}`,
					},
				});
				expect(res.status).toBe(400);
				const json = (await res.json()) as ErrorResponse;
				expect(json.error.code).toBe("BAD_REQUEST");
			});

			it("TC-368: Content-Typeがapplication/jsonでないリクエストを送信する", async () => {
				const res = await app.request(`/api/v1/users/${VALID_USER_ID}`, {
					method: "PUT",
					headers: {
						"Content-Type": "text/plain",
						Authorization: `Bearer ${validToken}`,
					},
					body: "not json",
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
		it("TC-401: 必須項目のみを含む最小有効なリクエストを送信する", async () => {
			const res = await put(VALID_USER_ID, MIN_BODY, validToken);
			expect(res.status).toBe(204);
		});

		it("TC-402: すべての項目を含む完全なリクエストを送信する", async () => {
			const res = await put(
				VALID_USER_ID,
				{
					...MIN_BODY,
					profileImage: "data:image/jpeg;base64,/9j/4AAQ",
					phone: "09012345678",
					postalCode: "1500001",
					prefecture: "東京都",
					city: "渋谷区",
					streetAddress: "1-2-3",
					building: "渋谷マンション101",
					workTypes: ["フルタイム", "リモート"],
					qualifications: [{ value: "TOEIC 900点" }],
					selfPR: "自己PRテキスト",
				},
				validToken,
			);
			expect(res.status).toBe(204);
		});

		it("TC-403: phoneにハイフンを含む文字列を指定する", async () => {
			const res = await put(VALID_USER_ID, { ...MIN_BODY, phone: "090-1234-5678" }, validToken);
			expect(res.status).toBe(422);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.messages[0]).toBe(
				"電話番号にハイフンは使用できません（例: 09012345678）",
			);
		});

		it("TC-404: postalCodeにハイフンを含む文字列を指定する", async () => {
			const res = await put(VALID_USER_ID, { ...MIN_BODY, postalCode: "123-4567" }, validToken);
			expect(res.status).toBe(422);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.messages[0]).toBe(
				"郵便番号にハイフンは使用できません（例: 1234567）",
			);
		});

		it("TC-405: 対象ユーザー自身のメールアドレスを指定する（変更なし）", async () => {
			const res = await put(VALID_USER_ID, MIN_BODY, validToken);
			expect(res.status).toBe(204);
		});

		it("TC-406: 他ユーザーが使用中のメールアドレスを指定する", async () => {
			vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
				new AppError(409, "CONFLICT", "メールアドレスが既に登録されています"),
			);
			const res = await put(
				VALID_USER_ID,
				{ ...MIN_BODY, email: "other@example.com" },
				validToken,
			);
			expect(res.status).toBe(409);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("CONFLICT");
			expect(json.error.messages[0]).toBe("メールアドレスが既に登録されています");
		});

		it("TC-407: profileImageにnullを指定する（既存画像がある場合）", async () => {
			const res = await put(VALID_USER_ID, { ...MIN_BODY, profileImage: null }, validToken);
			expect(res.status).toBe(204);
		});

		it("TC-408: workTypesに複数の有効な値を指定する", async () => {
			const res = await put(
				VALID_USER_ID,
				{ ...MIN_BODY, workTypes: ["フルタイム", "リモート"] },
				validToken,
			);
			expect(res.status).toBe(204);
		});

		it("TC-409: workTypesに全4種類の値を指定する", async () => {
			const res = await put(
				VALID_USER_ID,
				{
					...MIN_BODY,
					workTypes: ["フルタイム", "パートタイム", "リモート", "フリーランス"],
				},
				validToken,
			);
			expect(res.status).toBe(204);
		});

		it("TC-410: workHistoriesに複数件指定する", async () => {
			const res = await put(
				VALID_USER_ID,
				{
					...MIN_BODY,
					workHistories: [
						{
							company: "株式会社A",
							startMonth: "2018-04",
							endMonth: "2020-03",
							role: "営業",
						},
						{ company: "株式会社B", startMonth: "2020-04", role: "エンジニア" },
					],
				},
				validToken,
			);
			expect(res.status).toBe(204);
		});

		it("TC-411: qualificationsに複数件指定する", async () => {
			const res = await put(
				VALID_USER_ID,
				{
					...MIN_BODY,
					qualifications: [{ value: "TOEIC 900点" }, { value: "基本情報技術者" }],
				},
				validToken,
			);
			expect(res.status).toBe(204);
		});

		it("TC-412: クリア可能な任意項目にすべてnullを指定する", async () => {
			const res = await put(
				VALID_USER_ID,
				{
					...MIN_BODY,
					phone: null,
					postalCode: null,
					prefecture: null,
					city: null,
					streetAddress: null,
					building: null,
					selfPR: null,
				},
				validToken,
			);
			expect(res.status).toBe(204);
		});
	});

	// -------------------------------------------------------------------------
	// TC-500〜599: エラー（500系）
	// -------------------------------------------------------------------------
	describe("エラー（500系）", () => {
		it("TC-501: DB接続失敗時に500を返す", async () => {
			vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
				new Error("DB connection failed"),
			);
			const res = await put(VALID_USER_ID, MIN_BODY, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: トランザクション内でDBエラーが発生した場合500を返す", async () => {
			vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
				new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました"),
			);
			const res = await put(VALID_USER_ID, MIN_BODY, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("予期せぬエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
				new Error("DB error"),
			);
			const res = await put(VALID_USER_ID, MIN_BODY, validToken);
			expect(res.status).toBe(500);
			const json = (await res.json()) as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
			vi.stubEnv("JWT_SECRET", JWT_SECRET);
		});
	});
});
