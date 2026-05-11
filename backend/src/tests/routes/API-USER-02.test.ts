import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

/** 最小有効リクエストボディ（必須項目のみ） */
const MIN_BODY = {
	name: "山田太郎",
	birthDate: "1990-01-15",
	gender: "男性",
	email: "test@example.com",
	password: "password123",
	workHistories: [
		{ company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" },
	],
	agreedToTerms: true,
};

function put(body: unknown, headers?: Record<string, string>) {
	return app.request("/api/v1/users", {
		method: "PUT",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
}

/** 今日から n 年前の日付を YYYY-MM-DD 形式で返す */
function yearsAgoDate(years: number): string {
	const d = new Date();
	d.setFullYear(d.getFullYear() - years);
	return d.toISOString().slice(0, 10);
}

describe("API-USER-02 PUT /api/v1/users", () => {
	beforeEach(() => {
		vi.mocked(userService.createUserProfile).mockResolvedValue(
			undefined as never,
		);
	});

	// -------------------------------------------------------------------------
	// TC-001〜099: 認証系
	// -------------------------------------------------------------------------
	describe("認証系", () => {
		it("TC-001: Authorizationヘッダーなしで最小有効なリクエストを送信する", async () => {
			const res = await put(MIN_BODY);
			expect(res.status).toBe(204);
		});

		it("TC-002: 不正なトークンを付与してリクエストを送信する", async () => {
			const res = await put(MIN_BODY, {
				Authorization: "Bearer invalid_token",
			});
			expect(res.status).toBe(204);
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
				const res = await put(body);
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("氏名は必須項目です");
			});

			it("TC-302: nameにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, name: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-303: nameに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, name: "" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
				expect(json.error.messages[0]).toBe("氏名は必須項目です");
			});
		});

		// --- birthDate ---
		describe("birthDate", () => {
			it("TC-304: birthDateを省略する", async () => {
				const { birthDate: _b, ...body } = MIN_BODY;
				const res = await put(body);
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("生年月日は必須項目です");
			});

			it("TC-305: birthDateにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, birthDate: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-306: birthDateに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, birthDate: "" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("生年月日は必須項目です");
			});

			it("TC-307: YYYY-MM-DD以外の形式を指定する", async () => {
				const res = await put({ ...MIN_BODY, birthDate: "2000/01/01" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"生年月日はYYYY-MM-DD形式で入力してください",
				);
			});

			it("TC-308: 18歳未満の日付を指定する", async () => {
				const res = await put({ ...MIN_BODY, birthDate: yearsAgoDate(17) });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("18歳未満の方は登録できません");
			});

			it("TC-309: ちょうど60歳の日付を指定する", async () => {
				const res = await put({ ...MIN_BODY, birthDate: yearsAgoDate(60) });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("60歳以上の方は登録できません");
			});
		});

		// --- gender ---
		describe("gender", () => {
			it("TC-310: genderを省略する", async () => {
				const { gender: _g, ...body } = MIN_BODY;
				const res = await put(body);
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("性別は必須項目です");
			});

			it("TC-311: genderにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, gender: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("性別は必須項目です");
			});

			it("TC-312: genderに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, gender: "" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("性別の形式が正しくありません");
			});

			it("TC-313: genderに許可値以外を指定する", async () => {
				const res = await put({ ...MIN_BODY, gender: "unknown" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("性別の形式が正しくありません");
			});
		});

		// --- profileImage ---
		describe("profileImage", () => {
			it("TC-314: profileImageを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-315: profileImageにnullを明示的に指定する", async () => {
				const res = await put({ ...MIN_BODY, profileImage: null });
				expect(res.status).toBe(204);
			});

			it("TC-316: profileImageに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, profileImage: "" });
				expect(res.status).toBe(204);
			});

			it("TC-317: 非対応MIMEタイプを指定する", async () => {
				const res = await put({
					...MIN_BODY,
					profileImage: "data:image/gif;base64,R0lGOD",
				});
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("対応していないファイル形式です");
			});

			it("TC-318: 5MBを超えるbase64画像を指定する", async () => {
				// base64で5MB超: 5*1024*1024 * 4/3 ≈ 6,990,507文字
				const largeBase64 = "A".repeat(7_000_000);
				const res = await put({
					...MIN_BODY,
					profileImage: `data:image/jpeg;base64,${largeBase64}`,
				});
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("ファイルサイズが上限を超えています");
			});
		});

		// --- phone ---
		describe("phone", () => {
			it("TC-319: phoneを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-320: phoneにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, phone: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-321: phoneに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, phone: "" });
				expect(res.status).toBe(204);
			});

			it("TC-322: phoneに9桁の数字を指定する", async () => {
				const res = await put({ ...MIN_BODY, phone: "090123456" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("電話番号の形式が正しくありません");
			});

			it("TC-323: phoneに12桁の数字を指定する", async () => {
				const res = await put({ ...MIN_BODY, phone: "090123456789" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("電話番号の形式が正しくありません");
			});
		});

		// --- email ---
		describe("email", () => {
			it("TC-324: emailを省略する", async () => {
				const { email: _e, ...body } = MIN_BODY;
				const res = await put(body);
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("メールアドレスは必須項目です");
			});

			it("TC-325: emailにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, email: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-326: emailに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, email: "" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("メールアドレスは必須項目です");
			});

			it("TC-327: emailにメール形式でない文字列を指定する", async () => {
				const res = await put({ ...MIN_BODY, email: "not-an-email" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"メールアドレスはメールアドレス形式で入力してください",
				);
			});
		});

		// --- password ---
		describe("password", () => {
			it("TC-328: passwordを省略する", async () => {
				const { password: _p, ...body } = MIN_BODY;
				const res = await put(body);
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("パスワードは必須項目です");
			});

			it("TC-329: passwordにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, password: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-330: passwordに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, password: "" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("パスワードは必須項目です");
			});

			it("TC-331: passwordに7文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, password: "pass123" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("パスワードは8文字以上で入力してください");
			});
		});

		// --- postalCode ---
		describe("postalCode", () => {
			it("TC-332: postalCodeを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-333: postalCodeにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, postalCode: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-334: postalCodeに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, postalCode: "" });
				expect(res.status).toBe(204);
			});

			it("TC-335: postalCodeに6桁の数字を指定する", async () => {
				const res = await put({ ...MIN_BODY, postalCode: "123456" });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("郵便番号の形式が正しくありません");
			});
		});

		// --- prefecture ---
		describe("prefecture", () => {
			it("TC-336: prefectureを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-337: prefectureにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, prefecture: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-338: prefectureに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, prefecture: "" });
				expect(res.status).toBe(204);
			});
		});

		// --- city ---
		describe("city", () => {
			it("TC-339: cityを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-340: cityにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, city: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-341: cityに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, city: "" });
				expect(res.status).toBe(204);
			});
		});

		// --- streetAddress ---
		describe("streetAddress", () => {
			it("TC-342: streetAddressを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-343: streetAddressにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, streetAddress: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-344: streetAddressに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, streetAddress: "" });
				expect(res.status).toBe(204);
			});
		});

		// --- building ---
		describe("building", () => {
			it("TC-345: buildingを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-346: buildingにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, building: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-347: buildingに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, building: "" });
				expect(res.status).toBe(204);
			});
		});

		// --- selfPR ---
		describe("selfPR", () => {
			it("TC-348: selfPRを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-349: selfPRにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, selfPR: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-350: selfPRに空文字を指定する", async () => {
				const res = await put({ ...MIN_BODY, selfPR: "" });
				expect(res.status).toBe(204);
			});
		});

		// --- workTypes ---
		describe("workTypes", () => {
			it("TC-351: workTypesを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-352: workTypesにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, workTypes: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-353: workTypesに空配列を指定する", async () => {
				const res = await put({ ...MIN_BODY, workTypes: [] });
				expect(res.status).toBe(204);
			});
		});

		// --- qualifications ---
		describe("qualifications", () => {
			it("TC-354: qualificationsを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});

			it("TC-355: qualificationsにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, qualifications: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-356: qualificationsに空配列を指定する", async () => {
				const res = await put({ ...MIN_BODY, qualifications: [] });
				expect(res.status).toBe(204);
			});

			it("TC-357: qualifications[0].valueに空文字を指定する", async () => {
				const res = await put({
					...MIN_BODY,
					qualifications: [{ value: "" }],
				});
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("資格名は必須項目です");
			});
		});

		// --- workHistories ---
		describe("workHistories", () => {
			it("TC-358: workHistoriesを省略する", async () => {
				const { workHistories: _w, ...body } = MIN_BODY;
				const res = await put(body);
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("職歴を1件以上入力してください");
			});

			it("TC-359: workHistoriesにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, workHistories: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-360: workHistoriesに空配列を指定する", async () => {
				const res = await put({ ...MIN_BODY, workHistories: [] });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("職歴を1件以上入力してください");
			});

			it("TC-361: workHistories[0].companyを省略する", async () => {
				const res = await put({
					...MIN_BODY,
					workHistories: [{ startMonth: "2020-04", role: "エンジニア" }],
				});
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("会社名は必須項目です");
			});

			it("TC-362: workHistories[0].companyに空文字を指定する", async () => {
				const res = await put({
					...MIN_BODY,
					workHistories: [
						{ company: "", startMonth: "2020-04", role: "エンジニア" },
					],
				});
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("会社名は必須項目です");
			});

			it("TC-363: workHistories[0].startMonthを省略する", async () => {
				const res = await put({
					...MIN_BODY,
					workHistories: [{ company: "株式会社ABC", role: "エンジニア" }],
				});
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("在籍開始月は必須項目です");
			});

			it("TC-364: workHistories[0].roleを省略する", async () => {
				const res = await put({
					...MIN_BODY,
					workHistories: [
						{ company: "株式会社ABC", startMonth: "2020-04" },
					],
				});
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("役職は必須項目です");
			});

			it("TC-365: workHistories[0].roleに空文字を指定する", async () => {
				const res = await put({
					...MIN_BODY,
					workHistories: [
						{ company: "株式会社ABC", startMonth: "2020-04", role: "" },
					],
				});
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe("役職は必須項目です");
			});

			it("TC-366: workHistories[0].endMonthにnullを指定する（現職）", async () => {
				const res = await put({
					...MIN_BODY,
					workHistories: [
						{
							company: "株式会社ABC",
							startMonth: "2020-04",
							endMonth: null,
							role: "エンジニア",
						},
					],
				});
				expect(res.status).toBe(204);
			});

			it("TC-367: workHistories[0].endMonthを省略する", async () => {
				const res = await put(MIN_BODY);
				expect(res.status).toBe(204);
			});
		});

		// --- agreedToTerms ---
		describe("agreedToTerms", () => {
			it("TC-368: agreedToTermsを省略する", async () => {
				const { agreedToTerms: _a, ...body } = MIN_BODY;
				const res = await put(body);
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"利用規約・プライバシーポリシーへの同意が必要です",
				);
			});

			it("TC-369: agreedToTermsにnullを指定する", async () => {
				const res = await put({ ...MIN_BODY, agreedToTerms: null });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.code).toBe("VALIDATION_ERROR");
			});

			it("TC-370: agreedToTermsにfalseを指定する", async () => {
				const res = await put({ ...MIN_BODY, agreedToTerms: false });
				expect(res.status).toBe(422);
				const json = await res.json() as ErrorResponse;
				expect(json.error.messages[0]).toBe(
					"利用規約・プライバシーポリシーへの同意が必要です",
				);
			});
		});

		// --- ボディ全体 ---
		describe("リクエストボディ全体", () => {
			it("TC-371: リクエストボディを送信しない", async () => {
				const res = await app.request("/api/v1/users", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
				});
				expect(res.status).toBe(400);
			});

			it("TC-372: Content-Typeがapplication/jsonでないリクエストを送信する", async () => {
				const res = await app.request("/api/v1/users", {
					method: "PUT",
					headers: { "Content-Type": "text/plain" },
					body: "not json",
				});
				expect(res.status).toBe(400);
			});
		});
	});

	// -------------------------------------------------------------------------
	// TC-400〜499: 分岐処理
	// -------------------------------------------------------------------------
	describe("分岐処理", () => {
		it("TC-401: 必須項目のみを含む最小有効なリクエストを送信する", async () => {
			const res = await put(MIN_BODY);
			expect(res.status).toBe(204);
		});

		it("TC-402: すべての項目を含む完全なリクエストを送信する", async () => {
			const res = await put({
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
			});
			expect(res.status).toBe(204);
		});

		it("TC-403: phoneにハイフンを含む文字列を指定する", async () => {
			const res = await put({ ...MIN_BODY, phone: "090-1234-5678" });
			expect(res.status).toBe(422);
			const json = await res.json() as ErrorResponse;
			expect(json.error.messages[0]).toBe("電話番号の形式が正しくありません");
		});

		it("TC-404: postalCodeにハイフンを含む文字列を指定する", async () => {
			const res = await put({ ...MIN_BODY, postalCode: "123-4567" });
			expect(res.status).toBe(422);
			const json = await res.json() as ErrorResponse;
			expect(json.error.messages[0]).toBe("郵便番号の形式が正しくありません");
		});

		it("TC-405: workTypesに複数の有効な値を指定する", async () => {
			const res = await put({
				...MIN_BODY,
				workTypes: ["フルタイム", "リモート"],
			});
			expect(res.status).toBe(204);
		});

		it("TC-406: workTypesに全4種類の値を指定する", async () => {
			const res = await put({
				...MIN_BODY,
				workTypes: ["フルタイム", "パートタイム", "リモート", "フリーランス"],
			});
			expect(res.status).toBe(204);
		});

		it("TC-407: workHistoriesに複数件指定する", async () => {
			const res = await put({
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
			});
			expect(res.status).toBe(204);
		});

		it("TC-408: qualificationsに複数件指定する", async () => {
			const res = await put({
				...MIN_BODY,
				qualifications: [
					{ value: "TOEIC 900点" },
					{ value: "基本情報技術者" },
				],
			});
			expect(res.status).toBe(204);
		});

		it("TC-409: 既に登録済みのメールアドレスで登録しようとする", async () => {
			vi.mocked(userService.createUserProfile).mockRejectedValueOnce(
				new AppError(409, "CONFLICT", "メールアドレスが既に登録されています"),
			);
			const res = await put(MIN_BODY);
			expect(res.status).toBe(409);
			const json = await res.json() as ErrorResponse;
			expect(json.error.code).toBe("CONFLICT");
			expect(json.error.messages[0]).toBe("メールアドレスが既に登録されています");
		});
	});

	// -------------------------------------------------------------------------
	// TC-500〜599: エラー（500系）
	// -------------------------------------------------------------------------
	describe("エラー（500系）", () => {
		it("TC-501: DB接続失敗時に500を返す", async () => {
			vi.mocked(userService.createUserProfile).mockRejectedValueOnce(
				new Error("DB connection failed"),
			);
			const res = await put(MIN_BODY);
			expect(res.status).toBe(500);
			const json = await res.json() as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.is_success).toBe(false);
		});

		it("TC-502: トランザクション内でDBエラーが発生した場合500を返す", async () => {
			vi.mocked(userService.createUserProfile).mockRejectedValueOnce(
				new AppError(
					500,
					"INTERNAL_SERVER_ERROR",
					"予期せぬエラーが発生しました",
				),
			);
			const res = await put(MIN_BODY);
			expect(res.status).toBe(500);
			const json = await res.json() as ErrorResponse;
			expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(json.error.messages[0]).toBe("予期せぬエラーが発生しました");
		});

		it("TC-503: NODE_ENV=production時にスタックトレースがレスポンスに含まれない", async () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.mocked(userService.createUserProfile).mockRejectedValueOnce(
				new Error("DB error"),
			);
			const res = await put(MIN_BODY);
			expect(res.status).toBe(500);
			const json = await res.json() as ErrorResponse;
			expect(json).not.toHaveProperty("stack");
			expect(json.error).not.toHaveProperty("stack");
			vi.unstubAllEnvs();
		});
	});
});
