import { WORK_TYPES } from "@shared/schemas/user";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Download,
	FileDown,
	Trash2,
	Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InputCheckboxGroup } from "@/components/shadcn/custom/input/checkbox-group";
import { Button } from "@/components/shadcn/original/button";
import { Card, CardContent } from "@/components/shadcn/original/card";
import { Checkbox } from "@/components/shadcn/original/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/shadcn/original/dialog";
import { Input } from "@/components/shadcn/original/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/shadcn/original/table";
import { type PerPage, type SortKey, type SortOrder, useUserList } from "./useUserList";

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function getPageNumbers(current: number, total: number): PageItem[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const pages: PageItem[] = [1];
	if (current > 3) pages.push("ellipsis-start");
	for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
		pages.push(p);
	}
	if (current < total - 2) pages.push("ellipsis-end");
	pages.push(total);
	return pages;
}

type SortIconProps = {
	columnKey: SortKey;
	sortKey: SortKey | null;
	sortOrder: SortOrder;
};

function SortIcon({ columnKey, sortKey, sortOrder }: SortIconProps) {
	if (sortKey !== columnKey)
		return <ArrowUpDown className="ml-1 inline size-3 text-muted-foreground" />;
	return sortOrder === "asc" ? (
		<ArrowUp className="ml-1 inline size-3" />
	) : (
		<ArrowDown className="ml-1 inline size-3" />
	);
}

export function UserListPage() {
	const navigate = useNavigate();
	const {
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
	} = useUserList();

	const pageNumbers = getPageNumbers(page, totalPages);

	return (
		<div className="space-y-4 p-6">
			{error && <p className="text-sm text-destructive">{error}</p>}
			{/* 検索フォーム */}
			<Card className="bg-white">
				<CardContent className="pt-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-foreground" htmlFor="search-name">
								氏名
							</label>
							<Input
								id="search-name"
								value={searchParams.name}
								onChange={(e) => setSearchParams((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="氏名で検索"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-foreground" htmlFor="search-email">
								メールアドレス
							</label>
							<Input
								id="search-email"
								type="email"
								value={searchParams.email}
								onChange={(e) => setSearchParams((prev) => ({ ...prev, email: e.target.value }))}
								placeholder="メールアドレスで検索"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-foreground" htmlFor="search-phone">
								電話番号
							</label>
							<Input
								id="search-phone"
								value={searchParams.phone}
								onChange={(e) => setSearchParams((prev) => ({ ...prev, phone: e.target.value }))}
								placeholder="電話番号で検索"
							/>
						</div>
						<InputCheckboxGroup
							label="希望勤務形態"
							groupName="search-work-types"
							options={WORK_TYPES}
							value={searchParams.workTypes}
							onChange={(value) => setSearchParams((prev) => ({ ...prev, workTypes: value }))}
						/>
					</div>
					<div className="mt-4 flex justify-end gap-2">
						<Button variant="outline" onClick={handleClear}>
							クリア
						</Button>
						<Button onClick={handleSearch}>検索</Button>
					</div>
				</CardContent>
			</Card>

			{/* アクションバー */}
			<div className="flex items-center justify-between">
				<div className="flex gap-2">
					<Button variant="outline" onClick={handleImportClick}>
						<Upload className="size-4" />
						インポート
					</Button>
					<Button variant="ghost" onClick={handleTemplateDownload}>
						<FileDown className="size-4" />
						テンプレートDL
					</Button>
					<Button variant="outline" onClick={handleExport}>
						<Download className="size-4" />
						エクスポート
					</Button>
					<Button
						variant="destructive"
						disabled={selectedIds.length === 0}
						onClick={() => setDeleteDialogOpen(true)}
					>
						<Trash2 className="size-4" />
						削除{selectedIds.length > 0 && `（${selectedIds.length}件）`}
					</Button>
				</div>

				{/* 表示件数・件数表示・ページネーション */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">表示件数</span>
						<select
							value={perPage}
							onChange={(e) => handlePerPageChange(Number(e.target.value) as PerPage)}
							className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm focus-visible:border-ring focus-visible:outline-none"
						>
							{([10, 20, 50, 100] as const).map((n) => (
								<option key={n} value={n}>
									{n}件
								</option>
							))}
						</select>
					</div>
					<span className="text-sm text-muted-foreground">
						{startIndex}〜{endIndex}件 / 全{totalCount}件
					</span>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon-sm"
							disabled={page <= 1}
							onClick={() => handlePageChange(page - 1)}
						>
							<ChevronLeft className="size-4" />
						</Button>
						{pageNumbers.map((p) =>
							typeof p === "number" ? (
								<Button
									key={p}
									variant={p === page ? "outline" : "ghost"}
									size="icon-sm"
									onClick={() => handlePageChange(p)}
								>
									{p}
								</Button>
							) : (
								<span
									key={p}
									className="flex size-7 items-center justify-center text-sm text-muted-foreground"
								>
									…
								</span>
							),
						)}
						<Button
							variant="outline"
							size="icon-sm"
							disabled={page >= totalPages}
							onClick={() => handlePageChange(page + 1)}
						>
							<ChevronRight className="size-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* テーブル */}
			<Card className="bg-white">
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10 px-4">
									<Checkbox
										checked={isAllCurrentPageSelected}
										indeterminate={isIndeterminate}
										onCheckedChange={() => toggleAllCurrentPage(!isAllCurrentPageSelected)}
									/>
								</TableHead>
								<TableHead>
									<button
										type="button"
										className="flex items-center font-medium hover:text-foreground"
										onClick={() => handleSortChange("name")}
									>
										氏名
										<SortIcon columnKey="name" sortKey={sortKey} sortOrder={sortOrder} />
									</button>
								</TableHead>
								<TableHead>
									<button
										type="button"
										className="flex items-center font-medium hover:text-foreground"
										onClick={() => handleSortChange("email")}
									>
										メールアドレス
										<SortIcon columnKey="email" sortKey={sortKey} sortOrder={sortOrder} />
									</button>
								</TableHead>
								<TableHead>
									<button
										type="button"
										className="flex items-center font-medium hover:text-foreground"
										onClick={() => handleSortChange("phone")}
									>
										電話番号
										<SortIcon columnKey="phone" sortKey={sortKey} sortOrder={sortOrder} />
									</button>
								</TableHead>
								<TableHead>希望勤務形態</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
										読み込み中...
									</TableCell>
								</TableRow>
							) : pagedUsers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
										該当するユーザーが見つかりませんでした
									</TableCell>
								</TableRow>
							) : (
								pagedUsers.map((user) => (
									<TableRow key={user.id} className="cursor-pointer">
										<TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
											<Checkbox
												checked={selectedIds.includes(user.id)}
												onCheckedChange={(checked) => toggleUser(user.id, !!checked)}
											/>
										</TableCell>
										<TableCell
											className="font-medium text-primary hover:underline"
											onClick={() => navigate(`/users/${user.id}`)}
										>
											{user.name}
										</TableCell>
										<TableCell onClick={() => navigate(`/users/${user.id}`)}>
											{user.email}
										</TableCell>
										<TableCell onClick={() => navigate(`/users/${user.id}`)}>
											{user.phone}
										</TableCell>
										<TableCell onClick={() => navigate(`/users/${user.id}`)}>
											<div className="flex flex-wrap gap-1">
												{user.workTypes.map((wt) => (
													<span
														key={wt}
														className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
													>
														{wt}
													</span>
												))}
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* 削除確認ダイアログ */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>ユーザーの削除</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						{selectedIds.length}件のユーザーを削除しますか？この操作は取り消せません。
					</p>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
						<Button variant="destructive" onClick={handleDelete}>
							削除する
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* インポートエラーダイアログ */}
			<Dialog open={importErrorDialogOpen} onOpenChange={setImportErrorDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>インポートエラー</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						以下のエラーが検出されたため、インポートを中断しました。
					</p>
					<ul className="max-h-60 overflow-y-auto space-y-1">
						{importErrors.map((error) => (
							<li key={error} className="text-sm text-destructive">
								{error}
							</li>
						))}
					</ul>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" />}>閉じる</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 非表示ファイルインプット */}
			<input
				type="file"
				accept=".csv"
				ref={fileInputRef}
				className="hidden"
				onChange={handleFileChange}
			/>
		</div>
	);
}
