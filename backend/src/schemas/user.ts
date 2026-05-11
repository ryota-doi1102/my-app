import { z } from "zod";
import { userProfileCreateSchema, userProfileEditSchema } from "@shared/schemas/user.js";

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
	.extend({ profileImage: profileImageBase64Schema });

export const userProfileEditBackendSchema = userProfileEditSchema
	.omit({ profileImage: true })
	.extend({ profileImage: profileImageBase64Schema });

export type UserProfileCreateBackendInput = z.infer<typeof userProfileCreateBackendSchema>;
export type UserProfileEditBackendInput = z.infer<typeof userProfileEditBackendSchema>;