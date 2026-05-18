import { zodResolver } from "@hookform/resolvers/zod";
import type { UserProfileEditInput } from "@shared/schemas/user";
import { calcAge, userProfileEditSchema } from "@shared/schemas/user";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { UserProfileDetail } from "@/lib/api/users";
import { fileToBase64, updateUserProfile } from "@/lib/api/users";

export function useUserEditForm(userId: string, initialData: UserProfileDetail) {
	const navigate = useNavigate();
	const [apiError, setApiError] = useState<string | null>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { isSubmitting, isDirty },
	} = useForm<UserProfileEditInput>({
		resolver: zodResolver(userProfileEditSchema),
		defaultValues: {
			name: initialData.name ?? "",
			birthDate: initialData.birthDate ?? "",
			gender: (initialData.gender as UserProfileEditInput["gender"]) ?? undefined,
			profileImage: initialData.profileImageUrl ?? null,
			phone: initialData.phone ?? null,
			email: initialData.email,
			postalCode: initialData.postalCode ?? null,
			prefecture: initialData.prefecture ?? null,
			city: initialData.city ?? null,
			streetAddress: initialData.streetAddress ?? null,
			building: initialData.building ?? null,
			workTypes: (initialData.workTypes as UserProfileEditInput["workTypes"]) ?? [],
			qualifications: initialData.qualifications.map((v) => ({ value: v })),
			workHistories: initialData.workHistories,
			selfPR: initialData.selfPR ?? null,
		},
	});

	const birthDate = watch("birthDate");
	const age = birthDate ? calcAge(birthDate) : null;

	const profileImage = watch("profileImage");
	const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!profileImage || !(profileImage instanceof Blob)) {
			setProfileImagePreviewUrl(null);
			return;
		}
		const url = URL.createObjectURL(profileImage);
		setProfileImagePreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [profileImage]);

	const qualificationFieldArray = useFieldArray({ control, name: "qualifications" });
	const workHistoryFieldArray = useFieldArray({ control, name: "workHistories" });

	async function onSubmit(data: UserProfileEditInput) {
		setApiError(null);
		try {
			const profileImageResult =
				data.profileImage instanceof File
					? await fileToBase64(data.profileImage)
					: typeof data.profileImage === "string"
						? undefined
						: data.profileImage; // null → null (削除), undefined → undefined (変更なし)

			await updateUserProfile(userId, {
				name: data.name,
				birthDate: data.birthDate,
				gender: data.gender,
				profileImage: profileImageResult,
				phone: data.phone || null,
				email: data.email,
				postalCode: data.postalCode || null,
				prefecture: data.prefecture || null,
				city: data.city || null,
				streetAddress: data.streetAddress || null,
				building: data.building || null,
				workTypes: data.workTypes ?? [],
				qualifications: data.qualifications ?? [],
				workHistories: data.workHistories,
				selfPR: data.selfPR || null,
			});
			navigate(`/users/${userId}`, {
				state: { snackbar: { severity: "success", message: "プロフィールを更新しました" } },
			});
		} catch (err) {
			setApiError(
				err instanceof Error ? err.message : "保存に失敗しました。もう一度お試しください。",
			);
		}
	}

	function handleCancel() {
		if (isDirty) {
			setCancelDialogOpen(true);
		} else {
			navigate(`/users/${userId}`);
		}
	}

	function confirmCancel() {
		setCancelDialogOpen(false);
		navigate(`/users/${userId}`);
	}

	function removeProfileImage() {
		setValue("profileImage", null);
	}

	return {
		control,
		handleSubmit: handleSubmit(onSubmit),
		setValue,
		isSubmitting,
		isDirty,
		age,
		profileImagePreviewUrl,
		apiError,
		cancelDialogOpen,
		setCancelDialogOpen,
		handleCancel,
		confirmCancel,
		removeProfileImage,
		qualificationFieldArray,
		workHistoryFieldArray,
	};
}
