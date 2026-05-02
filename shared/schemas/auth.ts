import { z } from "zod";

export const signupRequestSchema = z.object({
	email: z
		.string({ required_error: "メールアドレスを入力してください" })
		.min(1, "メールアドレスを入力してください")
		.email("有効なメールアドレスを入力してください")
		.max(255, "メールアドレスは255文字以内で入力してください"),
});

export type SignupRequestInput = z.infer<typeof signupRequestSchema>;

export const signupSchema = z.object({
	token: z
		.string({ required_error: "トークンを入力してください" })
		.min(1, "トークンを入力してください")
		.uuid("UUID v4形式で入力してください")
		.max(255, "トークンは255文字以内で入力してください"),
	email: z
		.string({ required_error: "メールアドレスを入力してください" })
		.min(1, "メールアドレスを入力してください")
		.email("有効なメールアドレスを入力してください")
		.max(255, "メールアドレスは255文字以内で入力してください"),
	password: z
		.string({ required_error: "パスワードを入力してください" })
		.min(8, "パスワードは8文字以上で入力してください")
		.max(255, "パスワードは255文字以内で入力してください")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]+$/,
			"半角英数字（大文字・小文字・数字をそれぞれ1文字以上含む）で入力してください",
		),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
	email: z
		.string({ required_error: "メールアドレスを入力してください" })
		.min(1, "メールアドレスを入力してください")
		.email("有効なメールアドレスを入力してください")
		.max(255, "メールアドレスは255文字以内で入力してください"),
	password: z
		.string({ required_error: "パスワードを入力してください" })
		.min(8, "パスワードは8文字以上で入力してください")
		.max(255, "パスワードは255文字以内で入力してください"),
});

export type SigninInput = z.infer<typeof signinSchema>;

export const refreshSchema = z.object({
	refreshToken: z
		.string({ required_error: "リフレッシュトークンを入力してください" })
		.min(1, "リフレッシュトークンを入力してください")
		.uuid("UUID v4形式で入力してください")
		.max(255, "リフレッシュトークンは255文字以内で入力してください"),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const passwordResetRequestSchema = z.object({
	email: z
		.string({ required_error: "メールアドレスを入力してください" })
		.min(1, "メールアドレスを入力してください")
		.email("有効なメールアドレスを入力してください")
		.max(255, "メールアドレスは255文字以内で入力してください"),
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetSchema = z.object({
	token: z
		.string({ required_error: "トークンを入力してください" })
		.min(1, "トークンを入力してください")
		.uuid("UUID v4形式で入力してください")
		.max(255, "トークンは255文字以内で入力してください"),
	password: z
		.string({ required_error: "パスワードを入力してください" })
		.min(8, "パスワードは8文字以上で入力してください")
		.max(255, "パスワードは255文字以内で入力してください")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]+$/,
			"半角英数字（大文字・小文字・数字をそれぞれ1文字以上含む）で入力してください",
		),
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
