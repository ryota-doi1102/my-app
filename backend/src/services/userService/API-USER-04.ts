import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
	userProfiles,
	userQualifications,
	users,
	userWorkHistories,
	userWorkTypes,
} from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { AppError } from "../../middleware/error.js";
import type { UserProfileEditBackendInput } from "../../schemas/user.js";
import {
	deleteProfileImageFile,
	saveProfileImage,
} from "./common.js";

const logger = getAppLogger(["services", "users", "API-USER-04"]);

export async function updateUserProfile(
	userId: string,
	data: UserProfileEditBackendInput,
): Promise<void> {
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

	const [existingUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.id, userId), isNull(users.deletedAt)))
		.limit(1);

	if (!existingUser) {
		logger.warn("ユーザーが見つからない", { userId });
		throw new AppError(404, "NOT_FOUND", "ユーザーが見つかりません");
	}

	const [emailConflict] = await db
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.email, email), ne(users.id, userId)))
		.limit(1);

	if (emailConflict) {
		logger.warn("メールアドレスが既に他ユーザーに使用されている", {
			userId,
			email,
		});
		throw new AppError(409, "CONFLICT", "メールアドレスが既に登録されています");
	}

	const [profileRow] = await db
		.select({ profileImageUrl: userProfiles.profileImageUrl })
		.from(userProfiles)
		.where(eq(userProfiles.userId, userId))
		.limit(1);

	const oldImageUrl = profileRow?.profileImageUrl ?? null;

	let newProfileImageUrl: string | null | undefined;
	if (profileImage === null) {
		newProfileImageUrl = null;
	} else if (profileImage) {
		newProfileImageUrl = await saveProfileImage(profileImage);
	}

	await db.transaction(async (tx) => {
		await tx
			.update(users)
			.set({ email, updatedAt: new Date() })
			.where(eq(users.id, userId));

		const imageUrlToSave =
			newProfileImageUrl !== undefined ? newProfileImageUrl : oldImageUrl;

		await tx
			.update(userProfiles)
			.set({
				name,
				birthDate: birthDate ?? null,
				gender,
				profileImageUrl: imageUrlToSave,
				phone: phone || null,
				postalCode: postalCode || null,
				prefecture: prefecture || null,
				city: city || null,
				streetAddress: streetAddress || null,
				building: building || null,
				selfPr: selfPR || null,
				updatedAt: new Date(),
			})
			.where(eq(userProfiles.userId, userId));

		await tx.delete(userWorkTypes).where(eq(userWorkTypes.userId, userId));
		if (workTypeNames && workTypeNames.length > 0) {
			await tx.insert(userWorkTypes).values(
				workTypeNames.map((wt, i) => ({
					userId,
					workType: wt,
					sortOrder: i,
				})),
			);
		}

		await tx
			.delete(userQualifications)
			.where(eq(userQualifications.userId, userId));
		if (qualifications && qualifications.length > 0) {
			await tx.insert(userQualifications).values(
				qualifications.map((q, i) => ({
					userId,
					value: q.value,
					sortOrder: i,
				})),
			);
		}

		await tx
			.delete(userWorkHistories)
			.where(eq(userWorkHistories.userId, userId));
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

	if (newProfileImageUrl !== undefined && oldImageUrl) {
		await deleteProfileImageFile(oldImageUrl);
	}

	logger.info("ユーザープロフィール更新成功", { userId });
}
