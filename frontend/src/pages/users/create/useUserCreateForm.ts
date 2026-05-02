import { zodResolver } from "@hookform/resolvers/zod";
import type { UserProfileCreateInput } from "@shared/schemas/user";
import { calcAge, userProfileCreateSchema } from "@shared/schemas/user";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { createUserProfile, fileToBase64 } from "@/lib/api/users";

export function useUserCreateForm() {
	const navigate = useNavigate();
	const [apiError, setApiError] = useState<string | null>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

	const {
		control,
		handleSubmit,
		watch,
		formState: { isSubmitting, isDirty },
	} = useForm<UserProfileCreateInput>({
		resolver: zodResolver(userProfileCreateSchema),
		defaultValues: {
			name: "",
			birthDate: "",
			profileImage: null,
			phone: "",
			email: "",
			password: "",
			postalCode: "",
			prefecture: "",
			city: "",
			streetAddress: "",
			building: "",
			workTypes: [],
			qualifications: [],
			workHistories: [{ company: "", startMonth: "", endMonth: null, role: "" }],
			selfPR: "",
			agreedToTerms: false,
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

	async function onSubmit(data: UserProfileCreateInput) {
		setApiError(null);
		try {
			const profileImageBase64 =
				data.profileImage instanceof File ? await fileToBase64(data.profileImage) : null;

			const result = await createUserProfile({
				name: data.name,
				birthDate: data.birthDate,
				gender: data.gender,
				profileImage: profileImageBase64,
				phone: data.phone,
				email: data.email,
				password: data.password,
				postalCode: data.postalCode,
				prefecture: data.prefecture,
				city: data.city,
				streetAddress: data.streetAddress,
				building: data.building,
				workTypes: data.workTypes,
				qualifications: data.qualifications,
				workHistories: data.workHistories,
				selfPR: data.selfPR,
				agreedToTerms: true,
			});
			navigate(`/users/${result.id}`, {
				state: { snackbar: { severity: "success", message: "プロフィールを保存しました" } },
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
			navigate("/users/list");
		}
	}

	function confirmCancel() {
		setCancelDialogOpen(false);
		navigate("/users/list");
	}

	return {
		control,
		handleSubmit: handleSubmit(onSubmit),
		isSubmitting,
		isDirty,
		age,
		profileImagePreviewUrl,
		apiError,
		cancelDialogOpen,
		setCancelDialogOpen,
		handleCancel,
		confirmCancel,
		qualificationFieldArray,
		workHistoryFieldArray,
	};
}
