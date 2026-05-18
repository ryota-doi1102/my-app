import { userProfileCreateSchema, userProfileEditSchema } from "@shared/schemas/user";
import { describe, expect, it } from "vitest";

const VALID_DATA = {
	name: "山田太郎",
	birthDate: "1990-01-15",
	gender: "男性" as const,
	email: "test@example.com",
	password: "Password123",
	workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" }],
	agreedToTerms: true,
};

describe("userProfileCreateSchema", () => {
	// ----------------------------------------------------------------
	// 必須チェック（001〜099）
	// ----------------------------------------------------------------

	describe("name（氏名）", () => {
		it("TC-001: name を省略すると invalid になる", () => {
			const { name: _n, ...data } = VALID_DATA;
			const result = userProfileCreateSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("氏名は必須項目です");
		});

		it("TC-002: name に空文字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, name: "" });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("氏名は必須項目です");
		});

		it("TC-003: name に null を指定すると invalid になる（型エラー）", () => {
			const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, name: null } as unknown);
			expect(result.success).toBe(false);
		});
	});

	describe("birthDate（生年月日）", () => {
		it("TC-004: birthDate を省略すると invalid になる", () => {
			const { birthDate: _b, ...data } = VALID_DATA;
			const result = userProfileCreateSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("生年月日は必須項目です");
		});

		it("TC-005: birthDate に空文字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, birthDate: "" });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("生年月日は必須項目です");
		});

		it("TC-006: birthDate に null を指定すると invalid になる（型エラー）", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				birthDate: null,
			} as unknown);
			expect(result.success).toBe(false);
		});
	});

	describe("gender（性別）", () => {
		it("TC-007: gender を省略すると invalid になる", () => {
			const { gender: _g, ...data } = VALID_DATA;
			const result = userProfileCreateSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("性別は必須項目です");
		});

		it("TC-008: gender に null を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				gender: null,
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("性別は必須項目です");
		});
	});

	describe("email（メールアドレス）", () => {
		it("TC-009: email を省略すると invalid になる", () => {
			const { email: _e, ...data } = VALID_DATA;
			const result = userProfileCreateSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("メールアドレスは必須項目です");
		});

		it("TC-010: email に空文字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, email: "" });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("メールアドレスは必須項目です");
		});

		it("TC-011: email に null を指定すると invalid になる（型エラー）", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				email: null,
			} as unknown);
			expect(result.success).toBe(false);
		});
	});

	describe("password（パスワード）", () => {
		it("TC-012: password を省略すると invalid になる", () => {
			const { password: _p, ...data } = VALID_DATA;
			const result = userProfileCreateSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("パスワードは必須項目です");
		});

		it("TC-013: password に空文字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, password: "" });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("パスワードは必須項目です");
		});

		it("TC-014: password に null を指定すると invalid になる（型エラー）", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				password: null,
			} as unknown);
			expect(result.success).toBe(false);
		});
	});

	describe("workHistories（職歴）", () => {
		it("TC-015: workHistories を省略すると invalid になる", () => {
			const { workHistories: _w, ...data } = VALID_DATA;
			const result = userProfileCreateSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("職歴を1件以上入力してください");
		});

		it("TC-016: workHistories に null を指定すると invalid になる（型エラー）", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: null,
			} as unknown);
			expect(result.success).toBe(false);
		});

		it("TC-017: workHistories に空配列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, workHistories: [] });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("職歴を1件以上入力してください");
		});

		it("TC-018: workHistories[0].company を省略すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [{ startMonth: "2020-04", role: "エンジニア" }],
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("会社名は必須項目です");
		});

		it("TC-019: workHistories[0].company に空文字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [{ company: "", startMonth: "2020-04", role: "エンジニア" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("会社名は必須項目です");
		});

		it("TC-020: workHistories[0].startMonth を省略すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [{ company: "株式会社ABC", role: "エンジニア" }],
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("在籍開始月は必須項目です");
		});

		it("TC-021: workHistories[0].startMonth に空文字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [{ company: "株式会社ABC", startMonth: "", role: "エンジニア" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("在籍開始月は必須項目です");
		});

		it("TC-022: workHistories[0].role を省略すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [{ company: "株式会社ABC", startMonth: "2020-04" }],
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("役職は必須項目です");
		});

		it("TC-023: workHistories[0].role に空文字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("役職は必須項目です");
		});
	});

	describe("agreedToTerms（利用規約への同意）", () => {
		it("TC-024: agreedToTerms を省略すると invalid になる", () => {
			const { agreedToTerms: _a, ...data } = VALID_DATA;
			const result = userProfileCreateSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"利用規約・プライバシーポリシーへの同意が必要です",
			);
		});

		it("TC-025: agreedToTerms に null を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				agreedToTerms: null,
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"利用規約・プライバシーポリシーへの同意が必要です",
			);
		});

		it("TC-026: agreedToTerms に false を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, agreedToTerms: false });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"利用規約・プライバシーポリシーへの同意が必要です",
			);
		});
	});

	// ----------------------------------------------------------------
	// 形式・制約チェック（100〜499）
	// ----------------------------------------------------------------

	describe("name（氏名）- 制約", () => {
		it("TC-101: name に 101 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, name: "あ".repeat(101) });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("氏名は100文字以下で入力してください");
		});
	});

	describe("birthDate（生年月日）- 制約", () => {
		it("TC-110: birthDate に YYYY-MM-DD 以外の形式を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				birthDate: "2000/01/01",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("生年月日はYYYY-MM-DD形式で入力してください");
		});

		it("TC-111: birthDate に 17 年前の日付を指定すると invalid になる（18歳未満）", () => {
			const d = new Date();
			d.setFullYear(d.getFullYear() - 17);
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				birthDate: d.toISOString().slice(0, 10),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("18歳未満の方は登録できません");
		});

		it("TC-112: birthDate にちょうど 60 年前の日付を指定すると invalid になる（60歳）", () => {
			const d = new Date();
			d.setFullYear(d.getFullYear() - 60);
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				birthDate: d.toISOString().slice(0, 10),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("60歳以上の方は登録できません");
		});
	});

	describe("gender（性別）- 制約", () => {
		it("TC-120: gender に空文字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, gender: "" } as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("性別の形式が正しくありません");
		});

		it("TC-121: gender に許可値以外を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				gender: "unknown",
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("性別の形式が正しくありません");
		});
	});

	describe("profileImage（プロフィール画像）- 制約", () => {
		it("TC-130: profileImage に非対応 MIME タイプのファイルを指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				profileImage: { type: "image/gif", size: 1000 },
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("対応していないファイル形式です");
		});

		it("TC-131: profileImage に 5MB を超えるファイルを指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				profileImage: { type: "image/jpeg", size: 5 * 1024 * 1024 + 1 },
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("ファイルサイズが上限を超えています");
		});

		it("TC-132: profileImage に空ファイル（サイズ 0）を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				profileImage: { type: "image/jpeg", size: 0 },
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("ファイルが空です");
		});
	});

	describe("phone（電話番号）- 制約", () => {
		it("TC-140: phone にハイフンを含む値を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				phone: "090-1234-5678",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"電話番号にハイフンは使用できません（例: 09012345678）",
			);
		});

		it("TC-141: phone に半角数字以外を含む値を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				phone: "０９０１２３４５６７８",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("電話番号は半角数字で入力してください");
		});

		it("TC-142: phone に 9 桁の数字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				phone: "090123456",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("電話番号は10〜11桁で入力してください");
		});

		it("TC-143: phone に 12 桁の数字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				phone: "090123456789",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("電話番号は10〜11桁で入力してください");
		});
	});

	describe("email（メールアドレス）- 制約", () => {
		it("TC-150: email にメール形式でない文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				email: "not-an-email",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"メールアドレスはメールアドレス形式で入力してください",
			);
		});
	});

	describe("password（パスワード）- 制約", () => {
		it("TC-160: password に 7 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				password: "Pass123",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("パスワードは8文字以上で入力してください");
		});

		it("TC-161: password に大文字を含まない文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				password: "password1",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"パスワードには大文字の英字を1文字以上含めてください",
			);
		});

		it("TC-162: password に小文字を含まない文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				password: "PASSWORD1",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"パスワードには小文字の英字を1文字以上含めてください",
			);
		});

		it("TC-163: password に数字を含まない文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				password: "Passworddd",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("パスワードには数字を1文字以上含めてください");
		});
	});

	describe("postalCode（郵便番号）- 制約", () => {
		it("TC-170: postalCode にハイフンを含む値を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				postalCode: "123-4567",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"郵便番号にハイフンは使用できません（例: 1234567）",
			);
		});

		it("TC-171: postalCode に 6 桁の数字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				postalCode: "123456",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("郵便番号は7桁で入力してください");
		});

		it("TC-172: postalCode に半角数字以外を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				postalCode: "ABC1234",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("郵便番号は半角数字で入力してください");
		});
	});

	describe("住所（prefecture / city / streetAddress / building）- 制約", () => {
		it("TC-175: prefecture に 51 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				prefecture: "あ".repeat(51),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("都道府県は50文字以下で入力してください");
		});

		it("TC-176: city に 101 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				city: "あ".repeat(101),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("市区町村は100文字以下で入力してください");
		});

		it("TC-177: streetAddress に 256 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				streetAddress: "あ".repeat(256),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("番地は255文字以下で入力してください");
		});

		it("TC-178: building に 256 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				building: "あ".repeat(256),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"建物名・部屋番号は255文字以下で入力してください",
			);
		});
	});

	describe("workHistories（職歴）- 制約", () => {
		it("TC-180: workHistories[0].startMonth に YYYY-MM 以外の形式を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [{ company: "株式会社ABC", startMonth: "2020/04", role: "エンジニア" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("在籍開始月はYYYY-MM形式で入力してください");
		});

		it("TC-181: workHistories[0].endMonth に YYYY-MM 以外の形式を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [
					{
						company: "株式会社ABC",
						startMonth: "2020-04",
						endMonth: "2024/03",
						role: "エンジニア",
					},
				],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("在籍終了月はYYYY-MM形式で入力してください");
		});

		it("TC-182: workHistories[0].company に 256 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [{ company: "あ".repeat(256), startMonth: "2020-04", role: "エンジニア" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("会社名は255文字以下で入力してください");
		});

		it("TC-183: workHistories[0].role に 256 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "あ".repeat(256) }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("役職は255文字以下で入力してください");
		});
	});

	describe("qualifications（資格）- 制約", () => {
		it("TC-190: qualifications[0].value に空文字を指定すると invalid になる", () => {
			const result = userProfileCreateSchema.safeParse({
				...VALID_DATA,
				qualifications: [{ value: "" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("資格名は必須項目です");
		});
	});

	// ----------------------------------------------------------------
	// 正常系バリエーション（500〜599）
	// ----------------------------------------------------------------

	it("TC-501: 必須項目のみで valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-502: profileImage を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-503: profileImage に null を指定すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, profileImage: null });
		expect(result.success).toBe(true);
	});

	it("TC-504: phone を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-505: phone に空文字を指定すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, phone: "" });
		expect(result.success).toBe(true);
	});

	it("TC-506: postalCode を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-507: postalCode に空文字を指定すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, postalCode: "" });
		expect(result.success).toBe(true);
	});

	it("TC-508: prefecture を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-509: city を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-510: streetAddress を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-511: building を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-512: workTypes を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-513: workTypes に空配列を指定すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, workTypes: [] });
		expect(result.success).toBe(true);
	});

	it("TC-514: qualifications を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-515: qualifications に空配列を指定すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, qualifications: [] });
		expect(result.success).toBe(true);
	});

	it("TC-516: selfPR を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse(VALID_DATA);
		expect(result.success).toBe(true);
	});

	it("TC-517: workHistories[0].endMonth に null を指定すると valid になる（現職）", () => {
		const result = userProfileCreateSchema.safeParse({
			...VALID_DATA,
			workHistories: [
				{ company: "株式会社ABC", startMonth: "2020-04", endMonth: null, role: "エンジニア" },
			],
		});
		expect(result.success).toBe(true);
	});

	it("TC-518: workHistories[0].endMonth を省略すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse({
			...VALID_DATA,
			workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" }],
		});
		expect(result.success).toBe(true);
	});

	it("TC-519: すべての項目を指定すると valid になる", () => {
		const result = userProfileCreateSchema.safeParse({
			name: "山田太郎",
			birthDate: "1990-01-15",
			gender: "男性" as const,
			profileImage: { type: "image/jpeg", size: 1024 },
			phone: "09012345678",
			email: "test@example.com",
			password: "Password123",
			postalCode: "1234567",
			prefecture: "東京都",
			city: "渋谷区",
			streetAddress: "1-2-3",
			building: "テストビル101",
			workTypes: ["フルタイム"],
			qualifications: [{ value: "基本情報技術者" }],
			workHistories: [
				{ company: "株式会社ABC", startMonth: "2020-04", endMonth: "2023-03", role: "エンジニア" },
			],
			selfPR: "よろしくお願いします",
			agreedToTerms: true,
		});
		expect(result.success).toBe(true);
	});
});

// ================================================================
// userProfileEditSchema
// ================================================================

const VALID_DATA_EDIT = {
	name: "山田太郎",
	birthDate: "1990-01-15",
	gender: "男性" as const,
	email: "test@example.com",
	workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" }],
};

describe("userProfileEditSchema", () => {
	// ----------------------------------------------------------------
	// 必須チェック（001〜099）
	// ----------------------------------------------------------------

	describe("name（氏名）", () => {
		it("TC-001: name を省略すると invalid になる", () => {
			const { name: _n, ...data } = VALID_DATA_EDIT;
			const result = userProfileEditSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("氏名は必須項目です");
		});

		it("TC-002: name に空文字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, name: "" });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("氏名は必須項目です");
		});

		it("TC-003: name に null を指定すると invalid になる（型エラー）", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				name: null,
			} as unknown);
			expect(result.success).toBe(false);
		});
	});

	describe("birthDate（生年月日）", () => {
		it("TC-004: birthDate を省略すると invalid になる", () => {
			const { birthDate: _b, ...data } = VALID_DATA_EDIT;
			const result = userProfileEditSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("生年月日は必須項目です");
		});

		it("TC-005: birthDate に空文字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, birthDate: "" });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("生年月日は必須項目です");
		});

		it("TC-006: birthDate に null を指定すると invalid になる（型エラー）", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				birthDate: null,
			} as unknown);
			expect(result.success).toBe(false);
		});
	});

	describe("gender（性別）", () => {
		it("TC-007: gender を省略すると invalid になる", () => {
			const { gender: _g, ...data } = VALID_DATA_EDIT;
			const result = userProfileEditSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("性別は必須項目です");
		});

		it("TC-008: gender に null を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				gender: null,
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("性別は必須項目です");
		});
	});

	describe("email（メールアドレス）", () => {
		it("TC-009: email を省略すると invalid になる", () => {
			const { email: _e, ...data } = VALID_DATA_EDIT;
			const result = userProfileEditSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("メールアドレスは必須項目です");
		});

		it("TC-010: email に空文字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, email: "" });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("メールアドレスは必須項目です");
		});

		it("TC-011: email に null を指定すると invalid になる（型エラー）", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				email: null,
			} as unknown);
			expect(result.success).toBe(false);
		});
	});

	describe("workHistories（職歴）", () => {
		it("TC-012: workHistories を省略すると invalid になる", () => {
			const { workHistories: _w, ...data } = VALID_DATA_EDIT;
			const result = userProfileEditSchema.safeParse(data);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("職歴を1件以上入力してください");
		});

		it("TC-013: workHistories に null を指定すると invalid になる（型エラー）", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: null,
			} as unknown);
			expect(result.success).toBe(false);
		});

		it("TC-014: workHistories に空配列を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, workHistories: [] });
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("職歴を1件以上入力してください");
		});

		it("TC-015: workHistories[0].company を省略すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [{ startMonth: "2020-04", role: "エンジニア" }],
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("会社名は必須項目です");
		});

		it("TC-016: workHistories[0].company に空文字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [{ company: "", startMonth: "2020-04", role: "エンジニア" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("会社名は必須項目です");
		});

		it("TC-017: workHistories[0].startMonth を省略すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [{ company: "株式会社ABC", role: "エンジニア" }],
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("在籍開始月は必須項目です");
		});

		it("TC-018: workHistories[0].startMonth に空文字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [{ company: "株式会社ABC", startMonth: "", role: "エンジニア" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("在籍開始月は必須項目です");
		});

		it("TC-019: workHistories[0].role を省略すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [{ company: "株式会社ABC", startMonth: "2020-04" }],
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("役職は必須項目です");
		});

		it("TC-020: workHistories[0].role に空文字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("役職は必須項目です");
		});
	});

	// ----------------------------------------------------------------
	// 形式・制約チェック（100〜499）
	// ----------------------------------------------------------------

	describe("name（氏名）- 制約", () => {
		it("TC-101: name に 101 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				name: "あ".repeat(101),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("氏名は100文字以下で入力してください");
		});
	});

	describe("birthDate（生年月日）- 制約", () => {
		it("TC-110: birthDate に YYYY-MM-DD 以外の形式を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				birthDate: "2000/01/01",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("生年月日はYYYY-MM-DD形式で入力してください");
		});

		it("TC-111: birthDate に 17 年前の日付を指定すると invalid になる（18歳未満）", () => {
			const d = new Date();
			d.setFullYear(d.getFullYear() - 17);
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				birthDate: d.toISOString().slice(0, 10),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("18歳未満の方は登録できません");
		});

		it("TC-112: birthDate にちょうど 60 年前の日付を指定すると invalid になる（60歳）", () => {
			const d = new Date();
			d.setFullYear(d.getFullYear() - 60);
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				birthDate: d.toISOString().slice(0, 10),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("60歳以上の方は登録できません");
		});
	});

	describe("gender（性別）- 制約", () => {
		it("TC-120: gender に空文字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				gender: "",
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("性別の形式が正しくありません");
		});

		it("TC-121: gender に許可値以外を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				gender: "unknown",
			} as unknown);
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("性別の形式が正しくありません");
		});
	});

	describe("profileImage（プロフィール画像）- 制約", () => {
		it("TC-130: profileImage に非対応 MIME タイプのファイルを指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				profileImage: { type: "image/gif", size: 1000 },
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("対応していないファイル形式です");
		});

		it("TC-131: profileImage に 5MB を超えるファイルを指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				profileImage: { type: "image/jpeg", size: 5 * 1024 * 1024 + 1 },
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("ファイルサイズが上限を超えています");
		});

		it("TC-132: profileImage に空ファイル（サイズ 0）を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				profileImage: { type: "image/jpeg", size: 0 },
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("ファイルが空です");
		});
	});

	describe("phone（電話番号）- 制約", () => {
		it("TC-140: phone にハイフンを含む値を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				phone: "090-1234-5678",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"電話番号にハイフンは使用できません（例: 09012345678）",
			);
		});

		it("TC-141: phone に半角数字以外を含む値を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				phone: "０９０１２３４５６７８",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("電話番号は半角数字で入力してください");
		});

		it("TC-142: phone に 9 桁の数字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				phone: "090123456",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("電話番号は10〜11桁で入力してください");
		});

		it("TC-143: phone に 12 桁の数字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				phone: "090123456789",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("電話番号は10〜11桁で入力してください");
		});
	});

	describe("email（メールアドレス）- 制約", () => {
		it("TC-150: email にメール形式でない文字列を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				email: "not-an-email",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"メールアドレスはメールアドレス形式で入力してください",
			);
		});
	});

	describe("postalCode（郵便番号）- 制約", () => {
		it("TC-160: postalCode にハイフンを含む値を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				postalCode: "123-4567",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"郵便番号にハイフンは使用できません（例: 1234567）",
			);
		});

		it("TC-161: postalCode に 6 桁の数字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				postalCode: "123456",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("郵便番号は7桁で入力してください");
		});

		it("TC-162: postalCode に半角数字以外を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				postalCode: "ABC1234",
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("郵便番号は半角数字で入力してください");
		});
	});

	describe("住所（prefecture / city / streetAddress / building）- 制約", () => {
		it("TC-170: prefecture に 51 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				prefecture: "あ".repeat(51),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("都道府県は50文字以下で入力してください");
		});

		it("TC-171: city に 101 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				city: "あ".repeat(101),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("市区町村は100文字以下で入力してください");
		});

		it("TC-172: streetAddress に 256 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				streetAddress: "あ".repeat(256),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("番地は255文字以下で入力してください");
		});

		it("TC-173: building に 256 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				building: "あ".repeat(256),
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe(
				"建物名・部屋番号は255文字以下で入力してください",
			);
		});
	});

	describe("workHistories（職歴）- 制約", () => {
		it("TC-180: workHistories[0].startMonth に YYYY-MM 以外の形式を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [{ company: "株式会社ABC", startMonth: "2020/04", role: "エンジニア" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("在籍開始月はYYYY-MM形式で入力してください");
		});

		it("TC-181: workHistories[0].endMonth に YYYY-MM 以外の形式を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [
					{
						company: "株式会社ABC",
						startMonth: "2020-04",
						endMonth: "2024/03",
						role: "エンジニア",
					},
				],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("在籍終了月はYYYY-MM形式で入力してください");
		});

		it("TC-182: workHistories[0].company に 256 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [{ company: "あ".repeat(256), startMonth: "2020-04", role: "エンジニア" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("会社名は255文字以下で入力してください");
		});

		it("TC-183: workHistories[0].role に 256 文字の文字列を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "あ".repeat(256) }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("役職は255文字以下で入力してください");
		});
	});

	describe("qualifications（資格）- 制約", () => {
		it("TC-190: qualifications[0].value に空文字を指定すると invalid になる", () => {
			const result = userProfileEditSchema.safeParse({
				...VALID_DATA_EDIT,
				qualifications: [{ value: "" }],
			});
			expect(result.success).toBe(false);
			expect(result.error?.issues[0].message).toBe("資格名は必須項目です");
		});
	});

	// ----------------------------------------------------------------
	// 正常系バリエーション（500〜599）
	// ----------------------------------------------------------------

	it("TC-501: 必須項目のみで valid になる", () => {
		const result = userProfileEditSchema.safeParse(VALID_DATA_EDIT);
		expect(result.success).toBe(true);
	});

	it("TC-502: profileImage を省略すると valid になる", () => {
		const result = userProfileEditSchema.safeParse(VALID_DATA_EDIT);
		expect(result.success).toBe(true);
	});

	it("TC-503: profileImage に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, profileImage: null });
		expect(result.success).toBe(true);
	});

	it("TC-504: profileImage に URL 文字列を指定すると valid になる（既存画像）", () => {
		const result = userProfileEditSchema.safeParse({
			...VALID_DATA_EDIT,
			profileImage: "https://example.com/image.jpg",
		});
		expect(result.success).toBe(true);
	});

	it("TC-505: phone に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, phone: null });
		expect(result.success).toBe(true);
	});

	it("TC-506: phone を省略すると valid になる", () => {
		const result = userProfileEditSchema.safeParse(VALID_DATA_EDIT);
		expect(result.success).toBe(true);
	});

	it("TC-507: phone に空文字を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, phone: "" });
		expect(result.success).toBe(true);
	});

	it("TC-508: postalCode に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, postalCode: null });
		expect(result.success).toBe(true);
	});

	it("TC-509: postalCode を省略すると valid になる", () => {
		const result = userProfileEditSchema.safeParse(VALID_DATA_EDIT);
		expect(result.success).toBe(true);
	});

	it("TC-510: postalCode に空文字を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, postalCode: "" });
		expect(result.success).toBe(true);
	});

	it("TC-511: prefecture に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, prefecture: null });
		expect(result.success).toBe(true);
	});

	it("TC-512: city に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, city: null });
		expect(result.success).toBe(true);
	});

	it("TC-513: streetAddress に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, streetAddress: null });
		expect(result.success).toBe(true);
	});

	it("TC-514: building に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, building: null });
		expect(result.success).toBe(true);
	});

	it("TC-515: workTypes に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, workTypes: null });
		expect(result.success).toBe(true);
	});

	it("TC-516: workTypes に空配列を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, workTypes: [] });
		expect(result.success).toBe(true);
	});

	it("TC-517: qualifications に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, qualifications: null });
		expect(result.success).toBe(true);
	});

	it("TC-518: qualifications に空配列を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, qualifications: [] });
		expect(result.success).toBe(true);
	});

	it("TC-519: selfPR に null を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({ ...VALID_DATA_EDIT, selfPR: null });
		expect(result.success).toBe(true);
	});

	it("TC-520: workHistories[0].endMonth に null を指定すると valid になる（現職）", () => {
		const result = userProfileEditSchema.safeParse({
			...VALID_DATA_EDIT,
			workHistories: [
				{ company: "株式会社ABC", startMonth: "2020-04", endMonth: null, role: "エンジニア" },
			],
		});
		expect(result.success).toBe(true);
	});

	it("TC-521: workHistories[0].endMonth を省略すると valid になる", () => {
		const result = userProfileEditSchema.safeParse(VALID_DATA_EDIT);
		expect(result.success).toBe(true);
	});

	it("TC-522: すべての項目を指定すると valid になる", () => {
		const result = userProfileEditSchema.safeParse({
			name: "山田太郎",
			birthDate: "1990-01-15",
			gender: "男性" as const,
			profileImage: { type: "image/jpeg", size: 1024 },
			phone: "09012345678",
			email: "test@example.com",
			postalCode: "1234567",
			prefecture: "東京都",
			city: "渋谷区",
			streetAddress: "1-2-3",
			building: "テストビル101",
			workTypes: ["フルタイム"],
			qualifications: [{ value: "基本情報技術者" }],
			workHistories: [
				{ company: "株式会社ABC", startMonth: "2020-04", endMonth: "2023-03", role: "エンジニア" },
			],
			selfPR: "よろしくお願いします",
		});
		expect(result.success).toBe(true);
	});
});
