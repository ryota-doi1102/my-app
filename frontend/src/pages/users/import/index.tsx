import { Download, FileText, Upload } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/shadcn/original/accordion";
import { Button } from "@/components/shadcn/original/button";
import { Card, CardContent } from "@/components/shadcn/original/card";
import { useUserImport } from "./useUserImport";

const FORMAT_ROWS = [
	{ col: 1, name: "ID", required: "-", rule: "空欄で新規登録。入力する場合は既存ユーザーの UUID" },
	{ col: 2, name: "氏名", required: "✓", rule: "100文字以下" },
	{
		col: 3,
		name: "メールアドレス",
		required: "✓",
		rule: "メールアドレス形式。他のユーザーと重複不可",
	},
	{
		col: 4,
		name: "パスワード",
		required: "✓（新規のみ）",
		rule: "8文字以上・大文字/小文字/数字を各1文字以上含む。更新時は無視される",
	},
	{ col: 5, name: "電話番号", required: "-", rule: "ハイフンなし半角数字・10〜11桁" },
	{ col: 6, name: "生年月日", required: "✓", rule: "YYYY-MM-DD形式・18歳以上60歳未満" },
	{ col: 7, name: "性別", required: "✓", rule: "男性 / 女性 / その他 のいずれか" },
	{ col: 8, name: "郵便番号", required: "-", rule: "半角数字7桁（ハイフンなし）" },
	{ col: 9, name: "都道府県", required: "-", rule: "50文字以下" },
	{ col: 10, name: "市区町村", required: "-", rule: "100文字以下" },
	{ col: 11, name: "番地", required: "-", rule: "255文字以下" },
	{ col: 12, name: "建物名", required: "-", rule: "255文字以下" },
	{
		col: 13,
		name: "希望勤務形態",
		required: "-",
		rule: "セミコロン区切り（例: フルタイム;リモート）。フルタイム / パートタイム / リモート / フリーランス のいずれか",
	},
	{ col: 14, name: "資格", required: "-", rule: "セミコロン区切り。各値は1文字以上" },
	{ col: 15, name: "自己PR", required: "-", rule: "制限なし" },
	{ col: 16, name: "職歴1（会社名）", required: "✓", rule: "255文字以下" },
	{ col: 17, name: "職歴1（開始月）", required: "✓", rule: "YYYY-MM形式" },
	{ col: 18, name: "職歴1（終了月）", required: "-", rule: "YYYY-MM形式。空欄は在職中として扱う" },
	{ col: 19, name: "職歴1（役職）", required: "✓", rule: "255文字以下" },
	{ col: 20, name: "職歴2（会社名）", required: "-", rule: "255文字以下" },
	{
		col: 21,
		name: "職歴2（開始月）",
		required: "-",
		rule: "YYYY-MM形式。職歴2を入力する場合は必須",
	},
	{ col: 22, name: "職歴2（終了月）", required: "-", rule: "YYYY-MM形式。空欄は在職中として扱う" },
	{ col: 23, name: "職歴2（役職）", required: "-", rule: "255文字以下。職歴2を入力する場合は必須" },
	{ col: 24, name: "職歴3（会社名）", required: "-", rule: "255文字以下" },
	{
		col: 25,
		name: "職歴3（開始月）",
		required: "-",
		rule: "YYYY-MM形式。職歴3を入力する場合は必須",
	},
	{ col: 26, name: "職歴3（終了月）", required: "-", rule: "YYYY-MM形式。空欄は在職中として扱う" },
	{ col: 27, name: "職歴3（役職）", required: "-", rule: "255文字以下。職歴3を入力する場合は必須" },
] as const;

function FormatTable() {
	return (
		<div className="space-y-3 text-sm">
			<p className="text-muted-foreground">
				凡例：<span className="font-medium text-foreground">✓</span> = 常に必須
				<span className="font-medium text-foreground">✓（新規のみ）</span> = 新規作成時のみ必須
				<span className="font-medium text-foreground">-</span> = 任意
			</p>
			<div className="overflow-x-auto rounded-md border">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-3 py-2 text-left font-medium text-muted-foreground">列</th>
							<th className="px-3 py-2 text-left font-medium text-muted-foreground">カラム名</th>
							<th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
								必須
							</th>
							<th className="px-3 py-2 text-left font-medium text-muted-foreground">
								形式・バリデーション
							</th>
						</tr>
					</thead>
					<tbody>
						{FORMAT_ROWS.map((row) => (
							<tr key={row.col} className="border-b last:border-0 hover:bg-muted/30">
								<td className="px-3 py-2 text-muted-foreground">{row.col}</td>
								<td className="px-3 py-2 font-medium whitespace-nowrap">{row.name}</td>
								<td className="px-3 py-2 whitespace-nowrap">{row.required}</td>
								<td className="px-3 py-2 text-muted-foreground">{row.rule}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="space-y-1 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
				<p className="font-medium text-foreground">職歴の補足</p>
				<p>・職歴は連番で入力すること（例: 職歴1と職歴3のみ入力は不可）</p>
				<p>・職歴が複数ある場合、最後の職歴以外の終了月は必須（複数の在職中は不正）</p>
				<p className="font-medium text-foreground pt-1">ファイル全体の制約</p>
				<p>
					・ファイルサイズ：5MB
					以下　・データ行数：500件以下　・ファイル内でID・メールアドレスの重複不可
				</p>
			</div>
		</div>
	);
}

export function UserImportPage() {
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const {
		phase,
		file,
		clientError,
		result,
		serverErrors,
		isDragging,
		isProcessing,
		handleInputChange,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleImport,
		handleReset,
		handleDownloadTemplate,
	} = useUserImport();

	const navigateToList = () => navigate("/users/list");
	const navigateToListWithSuccess = () =>
		navigate("/users/list", {
			state: {
				snackbar: {
					severity: "success",
					message: `インポートが完了しました（新規 ${result?.created ?? 0}件・更新 ${result?.updated ?? 0}件）`,
				},
			},
		});

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<div className="px-8 py-8">
			<div className="mx-auto max-w-2xl space-y-6">
				{/* F-01: テンプレートダウンロード・フォーマット説明 */}
				<Card>
					<CardContent className="pt-6 space-y-4">
						<div className="flex items-center gap-3">
							<Button variant="outline" onClick={handleDownloadTemplate}>
								<Download className="mr-2 h-4 w-4" />
								テンプレートをダウンロード
							</Button>
							<span className="text-sm text-muted-foreground">CSV（UTF-8 BOM付き）</span>
						</div>

						<Accordion multiple={false}>
							<AccordionItem value="format">
								<AccordionTrigger className="px-4 text-sm font-medium">
									インポートフォーマット・バリデーション仕様
								</AccordionTrigger>
								<AccordionContent>
									<div className="py-2">
										<FormatTable />
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</CardContent>
				</Card>

				{/* F-02〜F-04: ファイル選択・実行・結果 */}
				<Card>
					<CardContent className="pt-6">
						{/* idle / file_selected: ファイル選択エリア */}
						{(phase === "idle" || phase === "file_selected") && (
							<div className="space-y-4">
								{/* ドロップゾーン（キーボード操作は内部のボタンで担保） */}
								{/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop is supplementary; keyboard access is provided by the button inside */}
								<div
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop}
									className={[
										"flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 transition-colors",
										isDragging
											? "border-primary bg-primary/5"
											: "border-muted-foreground/25 hover:border-muted-foreground/50",
									].join(" ")}
								>
									<FileText className="h-10 w-10 text-muted-foreground" />
									<div className="text-center">
										<p className="text-sm text-muted-foreground">CSVファイルをドラッグ＆ドロップ</p>
										<p className="text-xs text-muted-foreground">または</p>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => fileInputRef.current?.click()}
									>
										<Upload className="mr-2 h-4 w-4" />
										ファイルを選択
									</Button>
									<input
										ref={fileInputRef}
										type="file"
										accept=".csv,text/csv"
										className="hidden"
										onChange={handleInputChange}
									/>
								</div>

								{/* 選択済みファイル表示 */}
								{file && (
									<div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
										<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
										<span className="flex-1 truncate font-medium">{file.name}</span>
										<span className="shrink-0 text-muted-foreground">
											{formatFileSize(file.size)}
										</span>
									</div>
								)}

								{/* クライアントバリデーションエラー */}
								{clientError && (
									<p role="alert" className="text-sm text-destructive">
										{clientError}
									</p>
								)}

								<p className="text-xs text-muted-foreground">
									※ CSV（UTF-8 BOM付き）・5MB以内・500件以内
								</p>

								{/* ボタン */}
								<div className="flex justify-end gap-3 pt-2">
									<Button type="button" variant="outline" onClick={navigateToList}>
										キャンセル
									</Button>
									<Button type="button" disabled={phase !== "file_selected"} onClick={handleImport}>
										インポートを実行
									</Button>
								</div>
							</div>
						)}

						{/* uploading / polling: 処理中 */}
						{isProcessing && (
							<div className="space-y-4">
								<div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10">
									<span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
									<p className="text-sm text-muted-foreground">インポートを実行しています…</p>
									<p className="text-xs text-muted-foreground">しばらくお待ちください</p>
								</div>
								<div className="flex justify-end gap-3 pt-2">
									<Button type="button" variant="outline" disabled>
										キャンセル
									</Button>
									<Button type="button" disabled>
										インポートを実行
									</Button>
								</div>
							</div>
						)}

						{/* completed: 成功 */}
						{phase === "completed" && result && (
							<div className="space-y-6">
								<div className="rounded-lg border border-green-200 bg-green-50 px-6 py-6 text-center dark:border-green-900 dark:bg-green-950/30">
									<p className="text-lg font-semibold text-green-700 dark:text-green-400">
										インポートが完了しました
									</p>
									<div className="mt-4 flex justify-center gap-8 text-sm">
										<div>
											<span className="text-muted-foreground">新規登録</span>
											<p className="text-2xl font-bold text-foreground">{result.created}件</p>
										</div>
										<div>
											<span className="text-muted-foreground">更新</span>
											<p className="text-2xl font-bold text-foreground">{result.updated}件</p>
										</div>
									</div>
								</div>
								<div className="flex justify-end">
									<Button type="button" onClick={navigateToListWithSuccess}>
										一覧に戻る
									</Button>
								</div>
							</div>
						)}

						{/* failed: 失敗 */}
						{phase === "failed" && (
							<div className="space-y-6">
								<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-4">
									<p className="font-semibold text-destructive">インポートに失敗しました</p>
									{serverErrors.length > 0 && (
										<ul className="mt-3 space-y-1 text-sm text-destructive">
											{serverErrors.map((msg) => (
												<li key={msg} className="flex gap-2">
													<span className="shrink-0">・</span>
													<span>{msg}</span>
												</li>
											))}
										</ul>
									)}
								</div>
								<div className="flex justify-end gap-3">
									<Button type="button" variant="outline" onClick={navigateToList}>
										一覧に戻る
									</Button>
									<Button type="button" onClick={handleReset}>
										別のファイルを選択
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
