import { zodResolver } from "@hookform/resolvers/zod";
import type { SigninInput } from "@shared/schemas/auth";
import { signinSchema } from "@shared/schemas/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { signin } from "@/lib/api/auth";
import { setTokens } from "@/lib/auth";

const defaultValues: SigninInput = {
	email: "",
	password: "",
};

export function useSignIn() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	const { control, handleSubmit } = useForm<SigninInput>({
		resolver: zodResolver(signinSchema),
		defaultValues,
	});

	async function onSubmit(data: SigninInput) {
		setError(null);
		try {
			const result = await signin(data.email, data.password);
			setTokens(result.accessToken, result.refreshToken);
			navigate("/users/list");
		} catch (err) {
			setError(err instanceof Error ? err.message : "サインインに失敗しました");
		}
	}

	return {
		control,
		handleSubmit: handleSubmit(onSubmit),
		error,
	};
}
