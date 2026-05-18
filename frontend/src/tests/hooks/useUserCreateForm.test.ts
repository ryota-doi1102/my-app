import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as usersApi from "@/lib/api/users";
import { useUserCreateForm } from "@/pages/users/create/useUserCreateForm";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/api/users");

/** 必須フィールドの最小有効値 */
const REQUIRED_FIELDS = {
	name: "山田太郎",
	birthDate: "1990-01-15",
	gender: "男性" as const,
	email: "test@example.com",
	password: "Password123",
	workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" }],
	agreedToTerms: true,
} as const;

async function fillRequiredFields(setValue: ReturnType<typeof useUserCreateForm>["setValue"]) {
	setValue("name", REQUIRED_FIELDS.name);
	setValue("birthDate", REQUIRED_FIELDS.birthDate);
	setValue("gender", REQUIRED_FIELDS.gender);
	setValue("email", REQUIRED_FIELDS.email);
	setValue("password", REQUIRED_FIELDS.password);
	setValue("workHistories", [...REQUIRED_FIELDS.workHistories]);
	setValue("agreedToTerms", REQUIRED_FIELDS.agreedToTerms);
}

describe("useUserCreateForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(usersApi.createUserProfile).mockResolvedValue(undefined);
		vi.mocked(usersApi.fileToBase64).mockResolvedValue("data:image/jpeg;base64,mock");
		global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
		global.URL.revokeObjectURL = vi.fn();
	});

	// ----------------------------------------------------------------
	// API 変換（600〜699）
	// ----------------------------------------------------------------

	describe("API 変換", () => {
		it("TC-601: 必須項目のみで createUserProfile が呼ばれる", async () => {
			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.createUserProfile).toHaveBeenCalledOnce();
			expect(usersApi.createUserProfile).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "山田太郎",
					birthDate: "1990-01-15",
					gender: "男性",
					email: "test@example.com",
					password: "Password123",
					agreedToTerms: true,
				}),
			);
		});

		it("TC-602: profileImage が File の場合 base64 に変換されて送信される", async () => {
			const mockBase64 = "data:image/jpeg;base64,/9j/4AAQ";
			vi.mocked(usersApi.fileToBase64).mockResolvedValue(mockBase64);

			const mockFile = new File(["content"], "test.jpg", { type: "image/jpeg" });

			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
				result.current.setValue("profileImage", mockFile);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.fileToBase64).toHaveBeenCalledWith(mockFile);
			expect(usersApi.createUserProfile).toHaveBeenCalledWith(
				expect.objectContaining({ profileImage: mockBase64 }),
			);
		});

		it("TC-602b: profileImage が未選択（初期状態）の場合、省略して送信される", async () => {
			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.fileToBase64).not.toHaveBeenCalled();
			expect(usersApi.createUserProfile).toHaveBeenCalledWith(
				expect.objectContaining({ profileImage: undefined }),
			);
		});

		it("TC-603: 削除ボタン押下（profileImage が null）の場合 null で送信される", async () => {
			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
				result.current.removeProfileImage();
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.fileToBase64).not.toHaveBeenCalled();
			expect(usersApi.createUserProfile).toHaveBeenCalledWith(
				expect.objectContaining({ profileImage: null }),
			);
		});

		it("TC-604: 任意文字列フィールドが空文字の場合、null に変換されて送信される", async () => {
			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
				result.current.setValue("phone", "");
				result.current.setValue("postalCode", "");
				result.current.setValue("prefecture", "");
				result.current.setValue("city", "");
				result.current.setValue("streetAddress", "");
				result.current.setValue("building", "");
				result.current.setValue("selfPR", "");
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.createUserProfile).toHaveBeenCalledWith(
				expect.objectContaining({
					phone: null,
					postalCode: null,
					prefecture: null,
					city: null,
					streetAddress: null,
					building: null,
					selfPR: null,
				}),
			);
		});

		it("TC-605: 任意文字列フィールドが undefined の場合、null に変換されて送信される", async () => {
			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
				result.current.setValue("phone", undefined as unknown as string);
				result.current.setValue("postalCode", undefined as unknown as string);
				result.current.setValue("prefecture", undefined as unknown as string);
				result.current.setValue("city", undefined as unknown as string);
				result.current.setValue("streetAddress", undefined as unknown as string);
				result.current.setValue("building", undefined as unknown as string);
				result.current.setValue("selfPR", undefined as unknown as string);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.createUserProfile).toHaveBeenCalledWith(
				expect.objectContaining({
					phone: null,
					postalCode: null,
					prefecture: null,
					city: null,
					streetAddress: null,
					building: null,
					selfPR: null,
				}),
			);
		});

		it("TC-606: 送信成功後に /users/list へ遷移し snackbar メッセージが渡される", async () => {
			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(mockNavigate).toHaveBeenCalledWith("/users/list", {
				state: {
					snackbar: { severity: "success", message: "プロフィールを保存しました" },
				},
			});
		});
	});

	// ----------------------------------------------------------------
	// API エラー処理（700〜799）
	// ----------------------------------------------------------------

	describe("API エラー処理", () => {
		it("TC-701: API エラー時に apiError にエラーメッセージがセットされる", async () => {
			const errorMessage = "サーバーエラーが発生しました";
			vi.mocked(usersApi.createUserProfile).mockRejectedValueOnce(new Error(errorMessage));

			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(result.current.apiError).toBe(errorMessage);
		});

		it("TC-702: メールアドレス重複エラーが返ってきたとき apiError にメッセージがセットされる", async () => {
			vi.mocked(usersApi.createUserProfile).mockRejectedValueOnce(
				new Error("メールアドレスが既に登録されています"),
			);

			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(result.current.apiError).toBe("メールアドレスが既に登録されています");
		});

		it("TC-703: API エラー後に isSubmitting が false にリセットされる", async () => {
			vi.mocked(usersApi.createUserProfile).mockRejectedValueOnce(
				new Error("エラーが発生しました"),
			);

			const { result } = renderHook(() => useUserCreateForm());

			await act(async () => {
				await fillRequiredFields(result.current.setValue);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(result.current.isSubmitting).toBe(false);
		});
	});
});
