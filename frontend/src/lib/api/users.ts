import type { WorkHistoryItem, WorkType } from "@shared/schemas/user";
import { apiFetch } from "./client";

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
	profileImage: string | null;
	phone?: string;
	email: string;
	password: string;
	postalCode?: string;
	prefecture?: string;
	city?: string;
	streetAddress?: string;
	building?: string;
	workTypes?: WorkType[];
	qualifications?: { value: string }[];
	workHistories: WorkHistoryItem[];
	selfPR?: string;
	agreedToTerms: true;
};

type UpdateUserProfileParams = Omit<CreateUserProfileParams, "password" | "agreedToTerms">;

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

export async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
	});
}
