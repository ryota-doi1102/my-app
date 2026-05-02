import { apiFetch } from "./client";

type SigninResult = {
	accessToken: string;
	refreshToken: string;
};

export async function signin(email: string, password: string): Promise<SigninResult> {
	const res = await apiFetch<{ success: true; data: SigninResult }>("/api/v1/auth/signin", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});
	return res.data;
}

export async function requestSignup(email: string): Promise<{ token: string }> {
	const res = await apiFetch<{ success: true; data: { token: string } }>(
		"/api/v1/auth/signup/request",
		{
			method: "POST",
			body: JSON.stringify({ email }),
		},
	);
	return res.data;
}

export async function signup(
	token: string,
	email: string,
	password: string,
): Promise<{ accessToken: string }> {
	const res = await apiFetch<{ success: true; data: { accessToken: string } }>(
		"/api/v1/auth/signup",
		{
			method: "POST",
			body: JSON.stringify({ token, email, password }),
		},
	);
	return res.data;
}

export async function requestPasswordReset(email: string): Promise<{ token: string }> {
	const res = await apiFetch<{ success: true; data: { token: string } }>(
		"/api/v1/auth/password-reset/request",
		{
			method: "POST",
			body: JSON.stringify({ email }),
		},
	);
	return res.data;
}

export async function resetPassword(token: string, password: string): Promise<void> {
	await apiFetch<{ success: true; data: null }>("/api/v1/auth/password-reset", {
		method: "POST",
		body: JSON.stringify({ token, password }),
	});
}
