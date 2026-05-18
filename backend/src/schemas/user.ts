import {
	qualificationItemSchema,
	userProfileCreateSchema,
	userProfileEditSchema,
	WORK_TYPES,
} from "@shared/schemas/user.js";
import { z } from "zod";

const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const profileImageBase64Schema = z
	.string()
	.refine(
		(val) => !val || /^data:image\/(jpeg|png|webp);base64,/.test(val),
		"対応していないファイル形式です",
	)
	.refine((val) => {
		if (!val) return true;
		const base64 = val.split(",")[1] ?? "";
		return (base64.length * 3) / 4 <= PROFILE_IMAGE_MAX_BYTES;
	}, "ファイルサイズが上限を超えています")
	.nullable()
	.optional();

export const userProfileCreateBackendSchema = userProfileCreateSchema
	.omit({ profileImage: true })
	.extend({
		profileImage: profileImageBase64Schema,
		phone: userProfileEditSchema.shape.phone,
		postalCode: userProfileEditSchema.shape.postalCode,
		prefecture: userProfileEditSchema.shape.prefecture,
		city: userProfileEditSchema.shape.city,
		streetAddress: userProfileEditSchema.shape.streetAddress,
		building: userProfileEditSchema.shape.building,
		selfPR: userProfileEditSchema.shape.selfPR,
		workTypes: z.array(z.enum(WORK_TYPES)).nullable().optional(),
		qualifications: z.array(qualificationItemSchema).nullable().optional(),
	});

export const userProfileEditBackendSchema = userProfileEditSchema
	.omit({ profileImage: true })
	.extend({
		profileImage: profileImageBase64Schema,
		workTypes: z.array(z.enum(WORK_TYPES)).nullable().optional(),
		qualifications: z.array(qualificationItemSchema).nullable().optional(),
	});

export type UserProfileCreateBackendInput = z.infer<
	typeof userProfileCreateBackendSchema
>;
export type UserProfileEditBackendInput = z.infer<
	typeof userProfileEditBackendSchema
>;
