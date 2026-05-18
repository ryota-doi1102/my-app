import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfileDetail } from "@/lib/api/users";
import * as usersApi from "@/lib/api/users";
import { useUserEditForm } from "@/pages/users/edit/useUserEditForm";

const MOCK_USER_ID = "user-123";

const MOCK_INITIAL_DATA: UserProfileDetail = {
	id: MOCK_USER_ID,
	name: "山田太郎",
	email: "test@example.com",
	birthDate: "1990-01-15",
	gender: "男性",
	profileImageUrl: null,
	phone: null,
	postalCode: null,
	prefecture: null,
	city: null,
	streetAddress: null,
	building: null,
	workTypes: [],
	qualifications: [],
	workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" }],
	selfPR: null,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/api/users");

describe("useUserEditForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(usersApi.updateUserProfile).mockResolvedValue(undefined);
		vi.mocked(usersApi.fileToBase64).mockResolvedValue("data:image/jpeg;base64,mock");
		global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
		global.URL.revokeObjectURL = vi.fn();
	});

	// ----------------------------------------------------------------
	// API 変換（600〜699）
	// ----------------------------------------------------------------

	describe("API 変換", () => {
		it("TC-601: 必須項目のみで updateUserProfile が呼ばれる", async () => {
			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, MOCK_INITIAL_DATA));

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.updateUserProfile).toHaveBeenCalledOnce();
			expect(usersApi.updateUserProfile).toHaveBeenCalledWith(
				MOCK_USER_ID,
				expect.objectContaining({
					name: "山田太郎",
					birthDate: "1990-01-15",
					gender: "男性",
					email: "test@example.com",
				}),
			);
		});

		it("TC-602: profileImage が File の場合 base64 に変換されて送信される", async () => {
			const mockBase64 = "data:image/jpeg;base64,/9j/4AAQ";
			vi.mocked(usersApi.fileToBase64).mockResolvedValue(mockBase64);

			const mockFile = new File(["content"], "test.jpg", { type: "image/jpeg" });
			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, MOCK_INITIAL_DATA));

			await act(async () => {
				result.current.setValue("profileImage", mockFile);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.fileToBase64).toHaveBeenCalledWith(mockFile);
			expect(usersApi.updateUserProfile).toHaveBeenCalledWith(
				MOCK_USER_ID,
				expect.objectContaining({ profileImage: mockBase64 }),
			);
		});

		it("TC-603: 削除ボタン押下（profileImage が null）の場合 null で送信される", async () => {
			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, MOCK_INITIAL_DATA));

			await act(async () => {
				result.current.setValue("profileImage", null);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.fileToBase64).not.toHaveBeenCalled();
			expect(usersApi.updateUserProfile).toHaveBeenCalledWith(
				MOCK_USER_ID,
				expect.objectContaining({ profileImage: null }),
			);
		});

		it("TC-604: profileImage が既存の URL 文字列の場合、profileImage フィールドを省略して送信される", async () => {
			const existingUrl = "https://example.com/profile.jpg";
			const initialDataWithImage = { ...MOCK_INITIAL_DATA, profileImageUrl: existingUrl };
			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, initialDataWithImage));

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.fileToBase64).not.toHaveBeenCalled();
			expect(usersApi.updateUserProfile).toHaveBeenCalledWith(
				MOCK_USER_ID,
				expect.objectContaining({ profileImage: undefined }),
			);
		});

		it("TC-605: 任意文字列フィールドが空文字の場合、null に変換されて送信される", async () => {
			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, MOCK_INITIAL_DATA));

			await act(async () => {
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

			expect(usersApi.updateUserProfile).toHaveBeenCalledWith(
				MOCK_USER_ID,
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

		it("TC-606: 任意フィールドが null の場合、null のまま送信される", async () => {
			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, MOCK_INITIAL_DATA));

			await act(async () => {
				result.current.setValue("phone", null);
				result.current.setValue("postalCode", null);
				result.current.setValue("prefecture", null);
				result.current.setValue("city", null);
				result.current.setValue("streetAddress", null);
				result.current.setValue("building", null);
				result.current.setValue("selfPR", null);
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.updateUserProfile).toHaveBeenCalledWith(
				MOCK_USER_ID,
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

		it("TC-605b: removeProfileImage 呼び出し後に null で送信される（既存画像の削除）", async () => {
			const existingUrl = "https://example.com/profile.jpg";
			const initialDataWithImage = { ...MOCK_INITIAL_DATA, profileImageUrl: existingUrl };
			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, initialDataWithImage));

			await act(async () => {
				result.current.removeProfileImage();
			});

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(usersApi.fileToBase64).not.toHaveBeenCalled();
			expect(usersApi.updateUserProfile).toHaveBeenCalledWith(
				MOCK_USER_ID,
				expect.objectContaining({ profileImage: null }),
			);
		});

		it("TC-607: 送信成功後に /users/:id へ遷移し snackbar メッセージが渡される", async () => {
			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, MOCK_INITIAL_DATA));

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(mockNavigate).toHaveBeenCalledWith(`/users/${MOCK_USER_ID}`, {
				state: {
					snackbar: { severity: "success", message: "プロフィールを更新しました" },
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
			vi.mocked(usersApi.updateUserProfile).mockRejectedValueOnce(new Error(errorMessage));

			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, MOCK_INITIAL_DATA));

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(result.current.apiError).toBe(errorMessage);
		});

		it("TC-702: メールアドレス重複エラーが返ってきたとき apiError にメッセージがセットされる", async () => {
			vi.mocked(usersApi.updateUserProfile).mockRejectedValueOnce(
				new Error("メールアドレスが既に登録されています"),
			);

			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, MOCK_INITIAL_DATA));

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(result.current.apiError).toBe("メールアドレスが既に登録されています");
		});

		it("TC-703: API エラー後に isSubmitting が false にリセットされる", async () => {
			vi.mocked(usersApi.updateUserProfile).mockRejectedValueOnce(
				new Error("エラーが発生しました"),
			);

			const { result } = renderHook(() => useUserEditForm(MOCK_USER_ID, MOCK_INITIAL_DATA));

			await act(async () => {
				await result.current.handleSubmit();
			});

			expect(result.current.isSubmitting).toBe(false);
		});
	});
});
