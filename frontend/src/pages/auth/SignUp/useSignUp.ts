import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@shared/schemas/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { requestSignup, signup } from "@/lib/api/auth";

const signUpSchema = z
	.object({
		email: signupSchema.shape.email,
		password: signupSchema.shape.password,
		confirmPassword: z.string().min(1, "パスワードを再入力してください"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "パスワードが一致しません",
		path: ["confirmPassword"],
	});

type SignUpSchema = z.infer<typeof signUpSchema>;

const defaultValues: SignUpSchema = {
	email: "",
	password: "",
	confirmPassword: "",
};

export function useSignUp() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	const { control, handleSubmit } = useForm<SignUpSchema>({
		resolver: zodResolver(signUpSchema),
		defaultValues,
	});

	async function onSubmit(data: SignUpSchema) {
		setError(null);
		try {
			const { token } = await requestSignup(data.email);
			await signup(token, data.email, data.password);
			navigate("/sign-in");
		} catch (err) {
			setError(err instanceof Error ? err.message : "サインアップに失敗しました");
		}
	}

	return {
		control,
		handleSubmit: handleSubmit(onSubmit),
		error,
	};
}
