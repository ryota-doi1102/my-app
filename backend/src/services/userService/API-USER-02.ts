import { hash } from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
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
import type { UserProfileCreateBackendInput } from "../../schemas/user.js";
import { getUserProfileById, saveProfileImage } from "./common.js";
import type { UserProfileDetail } from "./common.js";

const logger = getAppLogger(["services", "users", "API-USER-02"]);

export async function createUserProfile(
	data: UserProfileCreateBackendInput,
): Promise<UserProfileDetail> {
	const {
		name,
		birthDate,
		gender,
		profileImage,
		phone,
		email,
		password,
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

	// メールアドレス重複確認
	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (existing) {
		logger.warn("メールアドレスが既に登録済み", { email });
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
	let resolvedWorkTypeIds: { id: string; name: string }[] = [];
	if (workTypeNames && workTypeNames.length > 0) {
		resolvedWorkTypeIds = await db
			.select({ id: workTypes.id, name: workTypes.name })
			.from(workTypes)
			.where(inArray(workTypes.name, [...workTypeNames]));
	}

	const passwordHash = await hash(password, 12);

	let profileImageUrl: string | null = null;

	const newUserId = await db.transaction(async (tx) => {
		const [newUser] = await tx.insert(users).values({ email, passwordHash }).returning();
		if (!newUser) {
			logger.error("ユーザー作成に失敗（トランザクション内）", { email });
			throw new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました");
		}

		if (profileImage) {
			profileImageUrl = await saveProfileImage(profileImage);
		}

		await tx.insert(userProfiles).values({
			userId: newUser.id,
			name,
			birthDate: birthDate ?? null,
			genderId: genderRow.id,
			profileImageUrl,
			phone: phone ?? null,
			postalCode: postalCode ?? null,
			prefecture: prefecture ?? null,
			city: city ?? null,
			streetAddress: streetAddress ?? null,
			building: building ?? null,
			selfPr: selfPR ?? null,
		});

		if (resolvedWorkTypeIds.length > 0) {
			await tx.insert(userWorkTypes).values(
				resolvedWorkTypeIds.map((wt, i) => ({
					userId: newUser.id,
					workTypeId: wt.id,
					sortOrder: i,
				})),
			);
		}

		if (qualifications && qualifications.length > 0) {
			await tx.insert(userQualifications).values(
				qualifications.map((q, i) => ({
					userId: newUser.id,
					value: q.value,
					sortOrder: i,
				})),
			);
		}

		await tx.insert(userWorkHistories).values(
			workHistories.map((wh, i) => ({
				userId: newUser.id,
				company: wh.company,
				startMonth: wh.startMonth,
				endMonth: wh.endMonth ?? null,
				role: wh.role,
				sortOrder: i,
			})),
		);

		return newUser.id;
	});

	const profile = await getUserProfileById(newUserId);
	if (!profile) {
		logger.error("プロフィール作成後の取得に失敗", { userId: newUserId });
		throw new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました");
	}

	logger.info("ユーザープロフィール作成成功", { userId: newUserId, email });
	return profile;
}