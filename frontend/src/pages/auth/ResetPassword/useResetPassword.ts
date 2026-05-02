import { zodResolver } from "@hookform/resolvers/zod";
import { passwordResetRequestSchema, passwordResetSchema } from "@shared/schemas/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { requestPasswordReset, resetPassword } from "@/lib/api/auth";

type RequestFormValues = z.infer<typeof passwordResetRequestSchema>;

const resetFormSchema = passwordResetSchema
	.omit({ token: true })
	.extend({
		confirmPassword: z.string().min(1, "パスワードを再入力してください"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "パスワードが一致しません",
		path: ["confirmPassword"],
	});

type ResetFormValues = z.infer<typeof resetFormSchema>;

export function useResetPassword() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [resetToken, setResetToken] = useState<string | null>(null);

	const requestForm = useForm<RequestFormValues>({
		resolver: zodResolver(passwordResetRequestSchema),
		defaultValues: { email: "" },
	});

	const resetForm = useForm<ResetFormValues>({
		resolver: zodResolver(resetFormSchema),
		defaultValues: { password: "", confirmPassword: "" },
	});

	async function onRequestSubmit(data: RequestFormValues) {
		setError(null);
		try {
			const result = await requestPasswordReset(data.email);
			setResetToken(result.token);
		} catch (err) {
			setError(err instanceof Error ? err.message : "リクエストに失敗しました");
		}
	}

	async function onResetSubmit(data: ResetFormValues) {
		if (!resetToken) return;
		setError(null);
		try {
			await resetPassword(resetToken, data.password);
			navigate("/sign-in");
		} catch (err) {
			setError(err instanceof Error ? err.message : "パスワードリセットに失敗しました");
		}
	}

	function backToRequest() {
		setResetToken(null);
		setError(null);
	}

	return {
		step: resetToken ? ("reset" as const) : ("request" as const),
		requestForm,
		resetForm,
		onRequestSubmit,
		onResetSubmit,
		backToRequest,
		error,
	};
}
