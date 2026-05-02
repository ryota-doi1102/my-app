import { zodResolver } from "@hookform/resolvers/zod";
import type { UserProfile, UserProfileEditInput, WorkType } from "@shared/schemas/user";
import { calcAge, userProfileEditSchema } from "@shared/schemas/user";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import type { UserProfileDetail } from "@/lib/api/users";
import { fileToBase64, getUserProfile, updateUserProfile } from "@/lib/api/users";

function toUserProfile(detail: UserProfileDetail): UserProfile {
	return {
		id: detail.id,
		name: detail.name ?? "",
		birthDate: detail.birthDate ?? "",
		gender: (detail.gender as UserProfile["gender"]) ?? "男性",
		profileImageUrl: detail.profileImageUrl,
		phone: detail.phone ?? undefined,
		email: detail.email,
		postalCode: detail.postalCode ?? undefined,
		prefecture: detail.prefecture ?? undefined,
		city: detail.city ?? undefined,
		streetAddress: detail.streetAddress ?? undefined,
		building: detail.building ?? undefined,
		workTypes: (detail.workTypes ?? []) as WorkType[],
		qualifications: detail.qualifications ?? [],
		workHistories: detail.workHistories,
		selfPR: detail.selfPR ?? undefined,
		createdAt: detail.createdAt,
		updatedAt: detail.updatedAt,
	};
}

function toFormValues(user: UserProfile): Omit<UserProfileEditInput, "profileImage"> {
	return {
		name: user.name,
		birthDate: user.birthDate,
		gender: user.gender,
		phone: user.phone ?? "",
		email: user.email,
		postalCode: user.postalCode ?? "",
		prefecture: user.prefecture ?? "",
		city: user.city ?? "",
		streetAddress: user.streetAddress ?? "",
		building: user.building ?? "",
		workTypes: user.workTypes ?? [],
		qualifications: (user.qualifications ?? []).map((v) => ({ value: v })),
		workHistories:
			user.workHistories.length > 0
				? user.workHistories
				: [{ company: "", startMonth: "", endMonth: null, role: "" }],
		selfPR: user.selfPR ?? "",
	};
}

export type ProfileMode = "view" | "edit";

export function useUserProfile() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [mode, setMode] = useState<ProfileMode>("view");
	const [user, setUser] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [apiError, setApiError] = useState<string | null>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

	const {
		control,
		handleSubmit,
		watch,
		reset,
		formState: { isSubmitting, isDirty },
	} = useForm<UserProfileEditInput>({
		resolver: zodResolver(userProfileEditSchema),
		defaultValues: {
			name: "",
			birthDate: "",
			profileImage: null,
			phone: "",
			email: "",
			postalCode: "",
			prefecture: "",
			city: "",
			streetAddress: "",
			building: "",
			workTypes: [],
			qualifications: [],
			workHistories: [{ company: "", startMonth: "", endMonth: null, role: "" }],
			selfPR: "",
		},
	});

	useEffect(() => {
		if (!id) return;
		setIsLoading(true);
		setApiError(null);
		getUserProfile(id)
			.then((detail) => {
				const profile = toUserProfile(detail);
				setUser(profile);
				reset({ ...toFormValues(profile), profileImage: null });
			})
			.catch((err: unknown) => {
				setApiError(err instanceof Error ? err.message : "プロフィールの取得に失敗しました");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [id, reset]);

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

	const profileImageDisplayUrl = profileImagePreviewUrl ?? user?.profileImageUrl ?? null;

	const qualificationFieldArray = useFieldArray({ control, name: "qualifications" });
	const workHistoryFieldArray = useFieldArray({ control, name: "workHistories" });

	function enterEditMode() {
		if (!user) return;
		reset({ ...toFormValues(user), profileImage: null });
		setApiError(null);
		setMode("edit");
	}

	function handleCancel() {
		if (isDirty) {
			setCancelDialogOpen(true);
		} else {
			setMode("view");
		}
	}

	function confirmCancel() {
		setCancelDialogOpen(false);
		if (user) reset({ ...toFormValues(user), profileImage: null });
		setMode("view");
	}

	async function onSubmit(data: UserProfileEditInput) {
		if (!id) return;
		setApiError(null);
		try {
			const profileImageBase64 =
				data.profileImage instanceof File ? await fileToBase64(data.profileImage) : null;

			await updateUserProfile(id, {
				name: data.name,
				birthDate: data.birthDate,
				gender: data.gender,
				profileImage: profileImageBase64,
				phone: data.phone,
				email: data.email,
				postalCode: data.postalCode,
				prefecture: data.prefecture,
				city: data.city,
				streetAddress: data.streetAddress,
				building: data.building,
				workTypes: data.workTypes,
				qualifications: data.qualifications,
				workHistories: data.workHistories,
				selfPR: data.selfPR,
			});
			navigate("/users/list", {
				state: { snackbar: { severity: "success", message: "プロフィールを更新しました" } },
			});
		} catch (err) {
			setApiError(
				err instanceof Error ? err.message : "更新に失敗しました。もう一度お試しください。",
			);
		}
	}

	return {
		user,
		mode,
		isLoading,
		enterEditMode,
		control,
		handleSubmit: handleSubmit(onSubmit),
		isSubmitting,
		age,
		profileImageDisplayUrl,
		apiError,
		cancelDialogOpen,
		setCancelDialogOpen,
		handleCancel,
		confirmCancel,
		qualificationFieldArray,
		workHistoryFieldArray,
		navigate,
	};
}
