import { useCallback, useEffect, useRef, useState } from "react";
import { useJobs } from "@/contexts/JobsContext";
import type { UserListItem } from "@/lib/api/users";
import {
	deleteUsers,
	downloadTemplate,
	searchUsers,
	submitExportJob,
	submitImportJob,
} from "@/lib/api/users";

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

const IMPORT_TEMPLATE_HEADERS = [
	"ID",
	"氏名",
	"メールアドレス",
	"パスワード",
	"電話番号",
	"生年月日",
	"性別",
	"郵便番号",
	"都道府県",
	"市区町村",
	"番地",
	"建物名",
	"希望勤務形態",
	"資格",
	"自己PR",
	"職歴1_会社名",
	"職歴1_開始月",
	"職歴1_終了月",
	"職歴1_役職",
	"職歴2_会社名",
	"職歴2_開始月",
	"職歴2_終了月",
	"職歴2_役職",
	"職歴3_会社名",
	"職歴3_開始月",
	"職歴3_終了月",
	"職歴3_役職",
];

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

function downloadBlob(blob: Blob, filename: string): void {
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
	const { addImportJob, addExportJob } = useJobs();

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
			await deleteUsers(selectedIds);
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

		if (file.size > 5 * 1024 * 1024) {
			setImportErrors(["ファイルサイズが上限（5MB）を超えています"]);
			setImportErrorDialogOpen(true);
			return;
		}

		const text = await file.text();
		const stripped = text.replace(/^﻿/, "");
		const lines = stripped.trim().split(/\r?\n/);
		if (lines.length < 2) return;

		const [headerLine, ...rawDataLines] = lines;
		if (!headerLine) return;

		const dataLines = rawDataLines.filter((l) => l.trim().length > 0);
		if (dataLines.length > 500) {
			setImportErrors(["データ行数が上限（500 件）を超えています"]);
			setImportErrorDialogOpen(true);
			return;
		}

		const headers = headerLine.split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
		const expectedHeaders = IMPORT_TEMPLATE_HEADERS as readonly string[];
		const headersMatch =
			headers.length === expectedHeaders.length &&
			expectedHeaders.every((h, i) => h === headers[i]);
		if (!headersMatch) {
			setImportErrors(["ヘッダーが仕様と一致しません"]);
			setImportErrorDialogOpen(true);
			return;
		}

		const idIdx = headers.indexOf("ID");
		const nameIdx = headers.indexOf("氏名");
		const emailIdx = headers.indexOf("メールアドレス");
		const errors: string[] = [];
		const seenIds = new Set<string>();
		const seenEmails = new Set<string>();

		for (let i = 0; i < dataLines.length; i++) {
			const line = dataLines[i];
			if (!line) continue;
			const row = line.split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
			const rowNum = i + 2;

			const id = idIdx >= 0 ? row[idIdx] : undefined;
			const name = nameIdx >= 0 ? row[nameIdx] : undefined;
			const email = emailIdx >= 0 ? row[emailIdx] : undefined;

			if (id) {
				if (seenIds.has(id)) {
					errors.push(`${rowNum}行目: ID "${id}" が重複しています`);
				} else {
					seenIds.add(id);
				}
			}

			if (!name) errors.push(`${rowNum}行目: 氏名 は必須項目です`);
			if (!email) {
				errors.push(`${rowNum}行目: メールアドレス は必須項目です`);
			} else if (seenEmails.has(email)) {
				errors.push(`${rowNum}行目: メールアドレス ${email} が重複しています`);
			} else {
				seenEmails.add(email);
			}
		}

		if (errors.length > 0) {
			setImportErrors(errors);
			setImportErrorDialogOpen(true);
			return;
		}

		setIsLoading(true);
		try {
			const encoder = new TextEncoder();
			const encoded = encoder.encode(text);

			let body: ArrayBuffer;
			let compressed = false;

			if (typeof CompressionStream !== "undefined") {
				const cs = new CompressionStream("gzip");
				const writer = cs.writable.getWriter();
				writer.write(encoded);
				writer.close();
				body = await new Response(cs.readable).arrayBuffer();
				compressed = true;
			} else {
				body = encoded.buffer as ArrayBuffer;
			}

			const jobId = await submitImportJob(body, compressed);
			addImportJob(jobId, () => void fetchUsers(listState));
		} catch (err) {
			setImportErrors([
				err instanceof Error ? err.message : "インポートジョブの登録に失敗しました",
			]);
			setImportErrorDialogOpen(true);
		} finally {
			setIsLoading(false);
		}
	}

	async function handleTemplateDownload(): Promise<void> {
		setIsLoading(true);
		try {
			const blob = await downloadTemplate();
			downloadBlob(blob, "users_import_template.csv");
		} catch (err) {
			setError(err instanceof Error ? err.message : "テンプレートのダウンロードに失敗しました");
		} finally {
			setIsLoading(false);
		}
	}

	async function handleExport(): Promise<void> {
		try {
			const jobId = await submitExportJob({
				name: listState.appliedParams.name || undefined,
				email: listState.appliedParams.email || undefined,
				phone: listState.appliedParams.phone || undefined,
				workTypes:
					listState.appliedParams.workTypes.length > 0
						? listState.appliedParams.workTypes
						: undefined,
				sortKey: listState.sortKey ?? undefined,
				sortOrder: listState.sortOrder,
			});
			addExportJob(jobId);
		} catch (err) {
			setError(err instanceof Error ? err.message : "エクスポートジョブの登録に失敗しました");
		}
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
