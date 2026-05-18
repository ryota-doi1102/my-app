import type { WorkHistoryItem, WorkType } from "@shared/schemas/user";
import { clearTokens, getAccessToken } from "@/lib/auth";
import { ApiError, apiFetch } from "./client";

type ErrorBody = {
	is_success: false;
	error: { code: string; messages: string[] };
};

export type UserListItem = {
	id: string;
	name: string | null;
	email: string;
	phone: string | null;
	workTypes: string[];
};

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
	workHistories: WorkHistoryItem[];
	selfPR: string | null;
	createdAt: string;
	updatedAt: string;
};

type SearchUsersParams = {
	name?: string;
	email?: string;
	phone?: string;
	workTypes?: string[];
	sortKey?: "name" | "email" | "phone" | null;
	sortOrder?: "asc" | "desc";
	page?: number;
	perPage?: 10 | 20 | 50 | 100;
};

type SearchUsersResult = {
	users: UserListItem[];
	totalCount: number;
	page: number;
	perPage: number;
	totalPages: number;
};

type CreateUserProfileParams = {
	name: string;
	birthDate: string;
	gender: string;
	profileImage?: string | null;
	phone?: string | null;
	email: string;
	password: string;
	postalCode?: string | null;
	prefecture?: string | null;
	city?: string | null;
	streetAddress?: string | null;
	building?: string | null;
	workTypes?: WorkType[];
	qualifications?: { value: string }[];
	workHistories: WorkHistoryItem[];
	selfPR?: string | null;
	agreedToTerms: true;
};

type UpdateUserProfileParams = Omit<
	CreateUserProfileParams,
	"password" | "agreedToTerms" | "profileImage"
> & {
	profileImage?: string | null;
};

export async function searchUsers(params: SearchUsersParams): Promise<SearchUsersResult> {
	const res = await apiFetch<{ is_success: true; data: SearchUsersResult }>("/api/v1/users", {
		method: "POST",
		body: JSON.stringify({
			name: params.name ?? "",
			email: params.email ?? "",
			phone: params.phone ?? "",
			workTypes: params.workTypes ?? [],
			sortKey: params.sortKey ?? null,
			sortOrder: params.sortOrder ?? "asc",
			page: params.page ?? 1,
			perPage: params.perPage ?? 10,
		}),
	});
	return res.data;
}

export async function getUserProfile(id: string): Promise<UserProfileDetail> {
	const res = await apiFetch<{ is_success: true; data: UserProfileDetail }>(`/api/v1/users/${id}`);
	return res.data;
}

export async function createUserProfile(params: CreateUserProfileParams): Promise<void> {
	await apiFetch<void>("/api/v1/users", {
		method: "PUT",
		body: JSON.stringify(params),
	});
}

export async function updateUserProfile(
	id: string,
	params: UpdateUserProfileParams,
): Promise<void> {
	await apiFetch<void>(`/api/v1/users/${id}`, {
		method: "PUT",
		body: JSON.stringify(params),
	});
}

export async function deleteUser(id: string): Promise<void> {
	await apiFetch<void>(`/api/v1/users/${id}`, { method: "DELETE" });
}

export async function deleteUsers(ids: string[]): Promise<void> {
	await apiFetch<void>("/api/v1/users/bulk", {
		method: "DELETE",
		body: JSON.stringify({ ids }),
	});
}

export async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
	});
}

export async function submitImportJob(body: ArrayBuffer, compressed: boolean): Promise<string> {
	const token = getAccessToken();
	const headers: Record<string, string> = {
		"Content-Type": "text/csv",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...(compressed ? { "Content-Encoding": "gzip" } : {}),
	};

	const response = await fetch("/api/v1/users/import", { method: "POST", headers, body });

	if (response.status === 401) {
		clearTokens();
		window.location.href = "/sign-in";
		throw new ApiError(401, "認証が必要です");
	}
	if (!response.ok) {
		const err = (await response.json()) as ErrorBody;
		throw new ApiError(response.status, err.error?.messages ?? ["エラーが発生しました"]);
	}

	const result = (await response.json()) as { is_success: true; data: { jobId: string } };
	return result.data.jobId;
}

export type ImportJobStatus = {
	id: string;
	status: "pending" | "processing" | "completed" | "failed";
	result?: { created: number; updated: number };
	errors?: string[];
};

export async function getImportJob(jobId: string): Promise<ImportJobStatus> {
	const res = await apiFetch<{ is_success: true; data: ImportJobStatus }>(
		`/api/v1/users/import-jobs/${jobId}`,
	);
	return res.data;
}

export type ExportJobStatus =
	| { id: string; status: "pending" | "processing" }
	| { id: string; status: "completed"; csvBlob: Blob }
	| { id: string; status: "failed"; errors?: string[] };

export async function getExportJob(jobId: string): Promise<ExportJobStatus> {
	const token = getAccessToken();
	const response = await fetch(`/api/v1/users/export-jobs/${jobId}`, {
		headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
	});

	if (response.status === 401) {
		clearTokens();
		window.location.href = "/sign-in";
		throw new ApiError(401, "認証が必要です");
	}

	const contentType = response.headers.get("Content-Type") ?? "";

	// completed: CSV 直接返却
	if (response.ok && contentType.includes("text/csv")) {
		const csvBlob = await response.blob();
		return { id: jobId, status: "completed", csvBlob };
	}

	const body = (await response.json()) as {
		data?: { id: string; status: string };
		error?: { messages: string[] };
	};

	if (response.status === 202) {
		return { id: jobId, status: body.data?.status as "pending" | "processing" };
	}

	// failed (500)
	return { id: jobId, status: "failed", errors: body.error?.messages };
}

export async function downloadTemplate(): Promise<Blob> {
	const token = getAccessToken();
	const response = await fetch("/api/v1/users/template", {
		headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
	});
	if (response.status === 401) {
		clearTokens();
		window.location.href = "/sign-in";
		throw new ApiError(401, "認証が必要です");
	}
	if (!response.ok) {
		const err = (await response.json()) as ErrorBody;
		throw new ApiError(response.status, err.error?.messages?.[0] ?? "エラーが発生しました");
	}
	return response.blob();
}

export async function submitExportJob(params: SearchUsersParams): Promise<string> {
	const res = await apiFetch<{ is_success: true; data: { jobId: string } }>(
		"/api/v1/users/export",
		{
			method: "POST",
			body: JSON.stringify({
				name: params.name || undefined,
				email: params.email || undefined,
				phone: params.phone || undefined,
				workTypes: params.workTypes && params.workTypes.length > 0 ? params.workTypes : undefined,
				sortKey: params.sortKey ?? null,
				sortOrder: params.sortOrder ?? "asc",
			}),
		},
	);
	return res.data.jobId;
}
