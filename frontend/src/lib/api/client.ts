import { clearTokens, getAccessToken } from "@/lib/auth";

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
	}
}

type ErrorBody = {
	success: false;
	error: { code: string; message: string };
};

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getAccessToken();

	const response = await fetch(path, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(options.headers as Record<string, string>),
		},
	});

	if (response.status === 204) return undefined as T;

	if (!response.ok) {
		if (response.status === 401) {
			clearTokens();
			window.location.href = "/sign-in";
			return undefined as T;
		}
		const body = (await response.json()) as ErrorBody;
		throw new ApiError(response.status, body.error?.message ?? "エラーが発生しました");
	}

	return response.json() as Promise<T>;
}
