import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { and, asc, eq, isNull } from "drizzle-orm";
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

const logger = getAppLogger(["services", "users"]);

const UPLOADS_DIR = join(process.cwd(), "uploads", "profile-images");

export type UserProfileDetail = {
	id: string;
	name: string | null;
	email: string;
	birthDate: string | null;
	gender: string | null;
	profileImageUrl: string | null;
	phone: string | null;
	postalCode: string | null;
	prefecture: string | null;
	city: string | null;
	streetAddress: string | null;
	building: string | null;
	workTypes: string[];
	qualifications: string[];
	workHistories: {
		company: string;
		startMonth: string;
		endMonth: string | null;
		role: string;
	}[];
	selfPR: string | null;
	createdAt: string;
	updatedAt: string;
};

export async function getUserProfileById(
	userId: string,
): Promise<UserProfileDetail | null> {
	const [row] = await db
		.select({
			userId: users.id,
			email: users.email,
			name: userProfiles.name,
			birthDate: userProfiles.birthDate,
			gender: userProfiles.gender,
			profileImageUrl: userProfiles.profileImageUrl,
			phone: userProfiles.phone,
			postalCode: userProfiles.postalCode,
			prefecture: userProfiles.prefecture,
			city: userProfiles.city,
			streetAddress: userProfiles.streetAddress,
			building: userProfiles.building,
			selfPr: userProfiles.selfPr,
			profileCreatedAt: userProfiles.createdAt,
			profileUpdatedAt: userProfiles.updatedAt,
		})
		.from(users)
		.innerJoin(userProfiles, eq(userProfiles.userId, users.id))
		.where(and(eq(users.id, userId), isNull(users.deletedAt)))
		.limit(1);

	if (!row) return null;

	const [workTypeRows, qualRows, historyRows] = await Promise.all([
		db
			.select({ workType: userWorkTypes.workType })
			.from(userWorkTypes)
			.where(eq(userWorkTypes.userId, userId))
			.orderBy(asc(userWorkTypes.sortOrder)),
		db
			.select({ value: userQualifications.value })
			.from(userQualifications)
			.where(eq(userQualifications.userId, userId))
			.orderBy(asc(userQualifications.sortOrder)),
		db
			.select({
				company: userWorkHistories.company,
				startMonth: userWorkHistories.startMonth,
				endMonth: userWorkHistories.endMonth,
				role: userWorkHistories.role,
			})
			.from(userWorkHistories)
			.where(eq(userWorkHistories.userId, userId))
			.orderBy(asc(userWorkHistories.sortOrder)),
	]);

	return {
		id: row.userId,
		name: row.name ?? null,
		email: row.email,
		birthDate: row.birthDate ?? null,
		gender: row.gender ?? null,
		profileImageUrl: row.profileImageUrl ?? null,
		phone: row.phone ?? null,
		postalCode: row.postalCode ?? null,
		prefecture: row.prefecture ?? null,
		city: row.city ?? null,
		streetAddress: row.streetAddress ?? null,
		building: row.building ?? null,
		workTypes: workTypeRows.map((r) => r.workType),
		qualifications: qualRows.map((r) => r.value),
		workHistories: historyRows.map((r) => ({
			company: r.company,
			startMonth: r.startMonth,
			endMonth: r.endMonth ?? null,
			role: r.role,
		})),
		selfPR: row.selfPr ?? null,
		createdAt: row.profileCreatedAt.toISOString(),
		updatedAt: row.profileUpdatedAt.toISOString(),
	};
}

export async function saveProfileImage(dataUri: string): Promise<string> {
	const match = dataUri.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s);
	if (!match || !match[1] || !match[2]) {
		throw new AppError(
			422,
			"VALIDATION_ERROR",
			"対応していないファイル形式です",
		);
	}
	const mimeType = match[1];
	const base64Data = match[2];
	const ext = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];

	await mkdir(UPLOADS_DIR, { recursive: true });

	const filename = `${randomUUID()}.${ext}`;
	const filepath = join(UPLOADS_DIR, filename);
	await writeFile(filepath, Buffer.from(base64Data, "base64"));

	logger.info("プロフィール画像保存完了", { filename });
	return `/uploads/profile-images/${filename}`;
}

export async function deleteProfileImageFile(
	profileImageUrl: string | null,
): Promise<void> {
	if (!profileImageUrl) return;
	const filename = profileImageUrl.split("/").at(-1);
	if (!filename) return;
	const filepath = join(UPLOADS_DIR, filename);
	try {
		await unlink(filepath);
		logger.info("プロフィール画像削除完了", { filename });
	} catch {
		logger.warn("プロフィール画像の削除に失敗（ファイルが存在しない可能性）", {
			filename,
		});
	}
}
