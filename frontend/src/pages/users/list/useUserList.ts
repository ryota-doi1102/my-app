import { useCallback, useEffect, useRef, useState } from "react";
import type { UserListItem } from "@/lib/api/users";
import { deleteUser, searchUsers } from "@/lib/api/users";

export type SortKey = "name" | "email" | "phone";
export type SortOrder = "asc" | "desc";
export type PerPage = 10 | 20 | 50 | 100;

type SearchParams = {
	name: string;
	email: string;
	phone: string;
	workTypes: string[];
};

type ListState = {
	appliedParams: SearchParams;
	sortKey: SortKey | null;
	sortOrder: SortOrder;
	page: number;
	perPage: PerPage;
};

export type { SearchParams, UserListItem };

const STORAGE_KEY = "userListSearchState";

const DEFAULT_SEARCH_PARAMS: SearchParams = {
	name: "",
	email: "",
	phone: "",
	workTypes: [],
};

const DEFAULT_LIST_STATE: ListState = {
	appliedParams: DEFAULT_SEARCH_PARAMS,
	sortKey: null,
	sortOrder: "asc",
	page: 1,
	perPage: 10,
};

const CSV_HEADERS = ["氏名", "メールアドレス", "電話番号", "希望勤務形態"];

function loadFromStorage(): ListState {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return DEFAULT_LIST_STATE;
		const parsed = JSON.parse(stored) as Partial<ListState>;
		return {
			...DEFAULT_LIST_STATE,
			...parsed,
			appliedParams: {
				...DEFAULT_LIST_STATE.appliedParams,
				...(parsed.appliedParams ?? {}),
			},
		};
	} catch {
		return DEFAULT_LIST_STATE;
	}
}

function saveToStorage(state: ListState): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function downloadCsv(content: string, filename: string): void {
	const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function useUserList() {
	const [listState, setListState] = useState<ListState>(loadFromStorage);
	const [searchParams, setSearchParams] = useState<SearchParams>(
		() => loadFromStorage().appliedParams,
	);
	const [pagedUsers, setPagedUsers] = useState<UserListItem[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [importErrors, setImportErrors] = useState<string[]>([]);
	const [importErrorDialogOpen, setImportErrorDialogOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { sortKey, sortOrder, page, perPage } = listState;

	const fetchUsers = useCallback(async (state: ListState) => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await searchUsers({
				name: state.appliedParams.name || undefined,
				email: state.appliedParams.email || undefined,
				phone: state.appliedParams.phone || undefined,
				workTypes:
					state.appliedParams.workTypes.length > 0 ? state.appliedParams.workTypes : undefined,
				sortKey: state.sortKey ?? null,
				sortOrder: state.sortOrder,
				page: state.page,
				perPage: state.perPage,
			});
			setPagedUsers(result.users);
			setTotalCount(result.totalCount);
			setTotalPages(result.totalPages);
		} catch (err) {
			setError(err instanceof Error ? err.message : "ユーザーの取得に失敗しました");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers(listState);
	}, [listState, fetchUsers]);

	const startIndex = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
	const endIndex = Math.min(page * perPage, totalCount);

	const currentPageIds = pagedUsers.map((u) => u.id);
	const isAllCurrentPageSelected =
		currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
	const isIndeterminate =
		!isAllCurrentPageSelected && currentPageIds.some((id) => selectedIds.includes(id));

	function updateListState(updates: Partial<ListState>): void {
		const next = { ...listState, ...updates };
		setListState(next);
		saveToStorage(next);
	}

	function handleSearch(): void {
		updateListState({ appliedParams: searchParams, page: 1 });
	}

	function handleClear(): void {
		setSearchParams(DEFAULT_SEARCH_PARAMS);
	}

	function handleSortChange(key: SortKey): void {
		const newOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
		updateListState({ sortKey: key, sortOrder: newOrder, page: 1 });
	}

	function handlePageChange(newPage: number): void {
		updateListState({ page: newPage });
	}

	function handlePerPageChange(newPerPage: PerPage): void {
		updateListState({ perPage: newPerPage, page: 1 });
	}

	function toggleAllCurrentPage(select: boolean): void {
		if (select) {
			setSelectedIds((prev) => [...new Set([...prev, ...currentPageIds])]);
		} else {
			setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
		}
	}

	function toggleUser(id: string, checked: boolean): void {
		setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));
	}

	async function handleDelete(): Promise<void> {
		setDeleteDialogOpen(false);
		setIsLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => deleteUser(id)));
			setSelectedIds([]);
			await fetchUsers(listState);
		} catch (err) {
			setError(err instanceof Error ? err.message : "削除に失敗しました");
			setIsLoading(false);
		}
	}

	function handleImportClick(): void {
		fileInputRef.current?.click();
	}

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";

		const text = await file.text();
		const lines = text.trim().split(/\r?\n/);
		if (lines.length < 2) return;

		const headers = lines[0].split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
		const dataLines = lines.slice(1);
		const errors: string[] = [];

		for (let i = 0; i < dataLines.length; i++) {
			const row = dataLines[i].split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
			const rowNum = i + 2;
			const nameIdx = headers.indexOf("氏名");
			const emailIdx = headers.indexOf("メールアドレス");

			if (nameIdx < 0 || !row[nameIdx]) {
				errors.push(`${rowNum}行目: 氏名は必須です`);
			}
			if (emailIdx < 0 || !row[emailIdx]) {
				errors.push(`${rowNum}行目: メールアドレスは必須です`);
			}
		}

		if (errors.length > 0) {
			setImportErrors(errors);
			setImportErrorDialogOpen(true);
			return;
		}

		// TODO: API呼び出し - POST /api/v1/users/import
		console.log("Import CSV:", dataLines.length, "件");
	}

	function handleTemplateDownload(): void {
		const csv = `${CSV_HEADERS.map((h) => `"${h}"`).join(",")}\n`;
		downloadCsv(csv, "users_template.csv");
	}

	function handleExport(): void {
		const rows = pagedUsers.map((u) => [
			u.name ?? "",
			u.email,
			u.phone ?? "",
			u.workTypes.join(";"),
		]);
		const csv = [CSV_HEADERS, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
		downloadCsv(csv, "users.csv");
	}

	return {
		searchParams,
		setSearchParams,
		handleSearch,
		handleClear,
		sortKey,
		sortOrder,
		page,
		perPage,
		handleSortChange,
		handlePageChange,
		handlePerPageChange,
		pagedUsers,
		totalCount,
		totalPages,
		startIndex,
		endIndex,
		isLoading,
		error,
		selectedIds,
		isAllCurrentPageSelected,
		isIndeterminate,
		toggleAllCurrentPage,
		toggleUser,
		deleteDialogOpen,
		setDeleteDialogOpen,
		handleDelete,
		fileInputRef,
		handleImportClick,
		handleFileChange,
		importErrors,
		importErrorDialogOpen,
		setImportErrorDialogOpen,
		handleExport,
		handleTemplateDownload,
	};
}
