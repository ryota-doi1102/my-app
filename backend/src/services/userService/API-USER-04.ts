import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
	genders,
	userProfiles,
	userQualifications,
	userWorkHistories,
	userWorkTypes,
	users,
	workTypes,
} from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";
import type { UserProfileEditBackendInput } from "../../schemas/user.js";
import {
	deleteProfileImageFile,
	getUserProfileById,
	saveProfileImage,
} from "./common.js";
import type { UserProfileDetail } from "./common.js";

const logger = getAppLogger(["services", "users", "API-USER-04"]);

export async function updateUserProfile(
	userId: string,
	data: UserProfileEditBackendInput,
): Promise<UserProfileDetail> {
	const {
		name,
		birthDate,
		gender,
		profileImage,
		phone,
		email,
		postalCode,
		prefecture,
		city,
		streetAddress,
		building,
		workTypes: workTypeNames,
		qualifications,
		workHistories,
		selfPR,
	} = data;

	// ユーザー存在確認
	const [existingUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.id, userId), isNull(users.deletedAt)))
		.limit(1);

	if (!existingUser) {
		logger.warn("ユーザーが見つからない", { userId });
		throw new AppError(404, "NOT_FOUND", "ユーザーが見つかりません");
	}

	// メールアドレス重複確認（自分以外）
	const [emailConflict] = await db
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.email, email), ne(users.id, userId)))
		.limit(1);

	if (emailConflict) {
		logger.warn("メールアドレスが既に他ユーザーに使用されている", { userId, email });
		throw new AppError(409, "CONFLICT", "メールアドレスが既に登録されています");
	}

	// 性別 ID を解決
	const [genderRow] = await db
		.select({ id: genders.id })
		.from(genders)
		.where(eq(genders.name, gender))
		.limit(1);

	if (!genderRow) {
		throw new AppError(422, "VALIDATION_ERROR", "性別の形式が正しくありません");
	}

	// 勤務形態 ID を解決
	let resolvedWorkTypeIds: { id: string }[] = [];
	if (workTypeNames && workTypeNames.length > 0) {
		resolvedWorkTypeIds = await db
			.select({ id: workTypes.id })
			.from(workTypes)
			.where(inArray(workTypes.name, [...workTypeNames]));
	}

	// 既存プロフィール画像 URL を取得（削除用）
	const [profileRow] = await db
		.select({ profileImageUrl: userProfiles.profileImageUrl })
		.from(userProfiles)
		.where(eq(userProfiles.userId, userId))
		.limit(1);

	const oldImageUrl = profileRow?.profileImageUrl ?? null;

	let newProfileImageUrl: string | null | undefined = undefined;
	if (profileImage === null) {
		newProfileImageUrl = null;
	} else if (profileImage) {
		newProfileImageUrl = await saveProfileImage(profileImage);
	}

	await db.transaction(async (tx) => {
		await tx.update(users).set({ email, updatedAt: new Date() }).where(eq(users.id, userId));

		const imageUrlToSave =
			newProfileImageUrl !== undefined ? newProfileImageUrl : oldImageUrl;

		await tx
			.update(userProfiles)
			.set({
				name,
				birthDate: birthDate ?? null,
				genderId: genderRow.id,
				profileImageUrl: imageUrlToSave,
				phone: phone ?? null,
				postalCode: postalCode ?? null,
				prefecture: prefecture ?? null,
				city: city ?? null,
				streetAddress: streetAddress ?? null,
				building: building ?? null,
				selfPr: selfPR ?? null,
				updatedAt: new Date(),
			})
			.where(eq(userProfiles.userId, userId));

		await tx.delete(userWorkTypes).where(eq(userWorkTypes.userId, userId));
		if (resolvedWorkTypeIds.length > 0) {
			await tx.insert(userWorkTypes).values(
				resolvedWorkTypeIds.map((wt, i) => ({
					userId,
					workTypeId: wt.id,
					sortOrder: i,
				})),
			);
		}

		await tx.delete(userQualifications).where(eq(userQualifications.userId, userId));
		if (qualifications && qualifications.length > 0) {
			await tx.insert(userQualifications).values(
				qualifications.map((q, i) => ({
					userId,
					value: q.value,
					sortOrder: i,
				})),
			);
		}

		await tx.delete(userWorkHistories).where(eq(userWorkHistories.userId, userId));
		await tx.insert(userWorkHistories).values(
			workHistories.map((wh, i) => ({
				userId,
				company: wh.company,
				startMonth: wh.startMonth,
				endMonth: wh.endMonth ?? null,
				role: wh.role,
				sortOrder: i,
			})),
		);
	});

	// 画像の差し替えが発生した場合は古い画像を削除
	if (newProfileImageUrl !== undefined && oldImageUrl) {
		await deleteProfileImageFile(oldImageUrl);
	}

	const profile = await getUserProfileById(userId);
	if (!profile) {
		logger.error("プロフィール更新後の取得に失敗", { userId });
		throw new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました");
	}

	logger.info("ユーザープロフィール更新成功", { userId });
	return profile;
}