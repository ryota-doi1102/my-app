import { WORK_TYPES } from "@shared/schemas/user";
import { UserCircle } from "lucide-react";
import { Controller } from "react-hook-form";
import { InputCheckboxGroupField } from "@/components/shadcn/custom/input/checkbox-group";
import { DateInput, DateInputField } from "@/components/shadcn/custom/input/date";
import { EmailInputField } from "@/components/shadcn/custom/input/email";
import { TextInputField } from "@/components/shadcn/custom/input/text";
import { TextAreaInputField } from "@/components/shadcn/custom/input/textarea";
import { LeaveConfirmDialog } from "@/components/shadcn/custom/LeaveConfirmDialog";
import { Badge } from "@/components/shadcn/original/badge";
import { Button } from "@/components/shadcn/original/button";
import { Card, CardContent } from "@/components/shadcn/original/card";
import { FieldError } from "@/components/shadcn/original/field";
import { Input } from "@/components/shadcn/original/input";
import { Label } from "@/components/shadcn/original/label";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/original/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/shadcn/original/select";
import { useUserProfile } from "./useUserProfile";

const PREFECTURES = [
	"北海道",
	"青森県",
	"岩手県",
	"宮城県",
	"秋田県",
	"山形県",
	"福島県",
	"茨城県",
	"栃木県",
	"群馬県",
	"埼玉県",
	"千葉県",
	"東京都",
	"神奈川県",
	"新潟県",
	"富山県",
	"石川県",
	"福井県",
	"山梨県",
	"長野県",
	"岐阜県",
	"静岡県",
	"愛知県",
	"三重県",
	"滋賀県",
	"京都府",
	"大阪府",
	"兵庫県",
	"奈良県",
	"和歌山県",
	"鳥取県",
	"島根県",
	"岡山県",
	"広島県",
	"山口県",
	"徳島県",
	"香川県",
	"愛媛県",
	"高知県",
	"福岡県",
	"佐賀県",
	"長崎県",
	"熊本県",
	"大分県",
	"宮崎県",
	"鹿児島県",
	"沖縄県",
];

function formatDate(dateStr: string): string {
	const [y, m, d] = dateStr.split("-");
	return `${y}年${Number(m)}月${Number(d)}日`;
}

function formatMonth(monthStr: string | null | undefined): string {
	if (!monthStr) return "現在";
	const [y, m] = monthStr.split("-");
	return `${y}年${Number(m)}月`;
}

type DetailFieldProps = {
	label: string;
	value: React.ReactNode;
};

function DetailField({ label, value }: DetailFieldProps) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs font-medium text-muted-foreground">{label}</span>
			<span className="text-sm text-foreground">
				{value !== null && value !== undefined && value !== "" ? value : "—"}
			</span>
		</div>
	);
}

type AvatarProps = {
	url: string | null;
	name: string;
};

function ProfileAvatar({ url, name }: AvatarProps) {
	return (
		<div className="h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-black">
			{url ? (
				<img src={url} alt={name} className="h-full w-full object-cover" />
			) : (
				<UserCircle className="h-full w-full text-gray-300" strokeWidth={1} />
			)}
		</div>
	);
}

export function UserProfilePage() {
	const {
		user,
		mode,
		isLoading,
		enterEditMode,
		control,
		handleSubmit,
		isSubmitting,
		age,
		profileImageDisplayUrl,
		apiError,
		cancelDialogOpen,
		setCancelDialogOpen,
		handleCancel,
		confirmCancel,
		qualificationFieldArray,
		workHistoryFieldArray,
		navigate,
	} = useUserProfile();

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">読み込み中...</p>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-destructive">ユーザーが見つかりませんでした</p>
			</div>
		);
	}

	return (
		<div className="px-8 py-8">
			<Card className="mx-auto max-w-2xl bg-white">
				<CardContent>
					{mode === "view" ? (
						<>
							{/* プロフィールヘッダー */}
							<div className="mb-6 flex items-center gap-4 border-b pb-6">
								<ProfileAvatar url={user.profileImageUrl ?? null} name={user.name} />
								<div>
									<p className="text-lg font-semibold text-foreground">{user.name}</p>
									<p className="text-sm text-muted-foreground">{user.email}</p>
								</div>
							</div>

							{/* 基本情報 */}
							<section className="mb-6 space-y-4">
								<h2 className="border-b pb-2 text-lg font-semibold text-foreground">基本情報</h2>
								<div className="grid grid-cols-2 gap-4">
									<DetailField label="生年月日" value={formatDate(user.birthDate)} />
									<DetailField label="年齢" value={`${age ?? "—"}歳`} />
								</div>
								<DetailField label="性別" value={user.gender} />
							</section>

							{/* 連絡先情報 */}
							<section className="mb-6 space-y-4">
								<h2 className="border-b pb-2 text-lg font-semibold text-foreground">連絡先情報</h2>
								<DetailField label="電話番号" value={user.phone} />
								<DetailField label="メールアドレス" value={user.email} />
							</section>

							{/* 住所 */}
							<section className="mb-6 space-y-4">
								<h2 className="border-b pb-2 text-lg font-semibold text-foreground">住所</h2>
								<DetailField label="郵便番号" value={user.postalCode} />
								<DetailField label="都道府県" value={user.prefecture} />
								<DetailField label="市区町村" value={user.city} />
								<DetailField label="番地" value={user.streetAddress} />
								<DetailField label="建物名・部屋番号" value={user.building} />
							</section>

							{/* 職業情報 */}
							<section className="mb-6 space-y-4">
								<h2 className="border-b pb-2 text-lg font-semibold text-foreground">職業情報</h2>
								<div className="flex flex-col gap-1">
									<span className="text-xs font-medium text-muted-foreground">希望勤務形態</span>
									{user.workTypes && user.workTypes.length > 0 ? (
										<div className="flex flex-wrap gap-2">
											{user.workTypes.map((wt) => (
												<Badge key={wt} variant="secondary">
													{wt}
												</Badge>
											))}
										</div>
									) : (
										<span className="text-sm text-foreground">—</span>
									)}
								</div>

								<div className="flex flex-col gap-1">
									<span className="text-xs font-medium text-muted-foreground">資格</span>
									{user.qualifications && user.qualifications.length > 0 ? (
										<div className="flex flex-wrap gap-2">
											{user.qualifications.map((qualification) => (
												<Badge key={qualification} variant="secondary">
													{qualification}
												</Badge>
											))}
										</div>
									) : (
										<span className="text-sm text-foreground">—</span>
									)}
								</div>

								<div className="flex flex-col gap-1">
									<span className="text-xs font-medium text-muted-foreground">職歴</span>
									<div className="space-y-3">
										{user.workHistories.map((workHistory) => (
											<div
												key={`${workHistory.company}-${workHistory.startMonth}`}
												className="rounded-lg border p-4 space-y-1"
											>
												<p className="text-sm font-medium text-foreground">{workHistory.company}</p>
												<p className="text-sm text-muted-foreground">{workHistory.role}</p>
												<p className="text-xs text-muted-foreground">
													{formatMonth(workHistory.startMonth)} 〜{" "}
													{formatMonth(workHistory.endMonth)}
												</p>
											</div>
										))}
									</div>
								</div>
							</section>

							{/* 自己PR */}
							<section className="mb-6 space-y-4">
								<h2 className="border-b pb-2 text-lg font-semibold text-foreground">自己PR</h2>
								<p className="whitespace-pre-wrap text-sm text-foreground">{user.selfPR || "—"}</p>
							</section>

							{/* ボタン */}
							<div className="flex justify-end gap-3 pt-4">
								<Button type="button" variant="outline" onClick={() => navigate("/users/list")}>
									戻る
								</Button>
								<Button type="button" onClick={enterEditMode}>
									編集
								</Button>
							</div>
						</>
					) : (
						<>
							{apiError && (
								<div
									role="alert"
									className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
								>
									{apiError}
								</div>
							)}

							<form onSubmit={handleSubmit} className="space-y-8">
								{/* 基本情報 */}
								<section className="space-y-4">
									<h2 className="border-b pb-2 text-lg font-semibold text-foreground">基本情報</h2>

									<TextInputField
										control={control}
										name="name"
										label="氏名"
										required
										disabled={isSubmitting}
									/>

									<div className="grid grid-cols-2 gap-4">
										<DateInputField
											control={control}
											name="birthDate"
											label="生年月日"
											required
											disabled={isSubmitting}
										/>
										<div className="flex flex-col gap-1.5">
											<label htmlFor="age-edit" className="text-sm font-medium text-foreground">
												年齢
											</label>
											<Input
												id="age-edit"
												value={age !== null ? `${age}歳` : ""}
												disabled
												readOnly
												placeholder="生年月日から自動計算"
											/>
										</div>
									</div>

									{/* 性別 */}
									<Controller
										control={control}
										name="gender"
										render={({ field, fieldState }) => (
											<div className="flex flex-col gap-1.5">
												<Label>
													性別
													<span className="ml-1 text-destructive" aria-hidden="true">
														*
													</span>
												</Label>
												<RadioGroup
													value={field.value}
													onValueChange={field.onChange}
													className="flex gap-6"
												>
													{(["男性", "女性", "その他"] as const).map((option) => (
														<div key={option} className="flex items-center gap-2">
															<RadioGroupItem
																value={option}
																id={`gender-edit-${option}`}
																disabled={isSubmitting}
															/>
															<Label htmlFor={`gender-edit-${option}`}>{option}</Label>
														</div>
													))}
												</RadioGroup>
												<FieldError>{fieldState.error?.message}</FieldError>
											</div>
										)}
									/>

									{/* プロフィール画像 */}
									<Controller
										control={control}
										name="profileImage"
										render={({ field: { onChange }, fieldState }) => (
											<div className="flex flex-col gap-1.5">
												<Label htmlFor="profileImage-edit">プロフィール画像</Label>
												<div className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-black">
													{profileImageDisplayUrl ? (
														<img
															src={profileImageDisplayUrl}
															alt="プロフィール画像プレビュー"
															className="h-full w-full object-cover"
														/>
													) : (
														<UserCircle className="h-full w-full text-gray-300" strokeWidth={1} />
													)}
												</div>
												<Input
													id="profileImage-edit"
													type="file"
													accept="image/jpeg,image/png,image/webp"
													onChange={(e) => onChange(e.target.files?.[0] ?? null)}
													disabled={isSubmitting}
												/>
												<p className="text-xs text-muted-foreground">
													JPEG / PNG / WebP（最大 5MB）
												</p>
												<FieldError>{fieldState.error?.message}</FieldError>
											</div>
										)}
									/>
								</section>

								{/* 連絡先情報 */}
								<section className="space-y-4">
									<h2 className="border-b pb-2 text-lg font-semibold text-foreground">
										連絡先情報
									</h2>
									<TextInputField
										control={control}
										name="phone"
										label="電話番号"
										type="tel"
										placeholder="09012345678"
										disabled={isSubmitting}
									/>
									<EmailInputField
										control={control}
										name="email"
										required
										disabled={isSubmitting}
									/>
								</section>

								{/* 住所 */}
								<section className="space-y-4">
									<h2 className="border-b pb-2 text-lg font-semibold text-foreground">住所</h2>
									<TextInputField
										control={control}
										name="postalCode"
										label="郵便番号"
										placeholder="1234567"
										maxLength={7}
										disabled={isSubmitting}
									/>
									<Controller
										control={control}
										name="prefecture"
										render={({ field, fieldState }) => (
											<div className="flex flex-col gap-1.5">
												<Label>都道府県</Label>
												<Select value={field.value} onValueChange={field.onChange}>
													<SelectTrigger className="w-full" disabled={isSubmitting}>
														<SelectValue placeholder="都道府県を選択" />
													</SelectTrigger>
													<SelectContent>
														{PREFECTURES.map((pref) => (
															<SelectItem key={pref} value={pref}>
																{pref}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FieldError>{fieldState.error?.message}</FieldError>
											</div>
										)}
									/>
									<TextInputField
										control={control}
										name="city"
										label="市区町村"
										disabled={isSubmitting}
									/>
									<TextInputField
										control={control}
										name="streetAddress"
										label="番地"
										disabled={isSubmitting}
									/>
									<TextInputField
										control={control}
										name="building"
										label="建物名・部屋番号"
										disabled={isSubmitting}
									/>
								</section>

								{/* 職業情報 */}
								<section className="space-y-4">
									<h2 className="border-b pb-2 text-lg font-semibold text-foreground">職業情報</h2>

									<InputCheckboxGroupField
										control={control}
										name="workTypes"
										label="希望勤務形態"
										options={WORK_TYPES}
										disabled={isSubmitting}
									/>

									{/* 資格 */}
									<div className="flex flex-col gap-1.5">
										<Label>資格</Label>
										<div className="space-y-2">
											{qualificationFieldArray.fields.map((item, index) => (
												<div key={item.id} className="flex gap-2">
													<TextInputField
														control={control}
														name={`qualifications.${index}.value`}
														placeholder="例: 普通自動車免許"
														disabled={isSubmitting}
													/>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => qualificationFieldArray.remove(index)}
														disabled={isSubmitting}
														className="mt-0 self-start"
													>
														削除
													</Button>
												</div>
											))}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => qualificationFieldArray.append({ value: "" })}
												disabled={isSubmitting}
											>
												＋ 資格を追加
											</Button>
										</div>
									</div>

									{/* 職歴 */}
									<div className="flex flex-col gap-2">
										<Label>
											職歴
											<span className="ml-1 text-destructive" aria-hidden="true">
												*
											</span>
										</Label>
										<div className="space-y-4">
											{workHistoryFieldArray.fields.map((item, index) => (
												<div key={item.id} className="rounded-lg border p-4 space-y-3">
													<div className="flex items-center justify-between">
														<span className="text-sm font-medium text-muted-foreground">
															職歴 {index + 1}
														</span>
														{workHistoryFieldArray.fields.length > 1 && (
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={() => workHistoryFieldArray.remove(index)}
																disabled={isSubmitting}
															>
																削除
															</Button>
														)}
													</div>
													<TextInputField
														control={control}
														name={`workHistories.${index}.company`}
														label="会社名"
														required
														disabled={isSubmitting}
													/>
													<div className="grid grid-cols-2 gap-4">
														<DateInputField
															control={control}
															name={`workHistories.${index}.startMonth`}
															label="在籍開始月"
															type="month"
															required
															disabled={isSubmitting}
														/>
														<Controller
															control={control}
															name={`workHistories.${index}.endMonth`}
															render={({ field, fieldState }) => (
																<DateInput
																	label="在籍終了月（現職の場合は空欄）"
																	type="month"
																	value={field.value ?? ""}
																	onChange={(v) => field.onChange(v || null)}
																	errorMessage={fieldState.error?.message}
																	disabled={isSubmitting}
																/>
															)}
														/>
													</div>
													<TextInputField
														control={control}
														name={`workHistories.${index}.role`}
														label="役職"
														required
														disabled={isSubmitting}
													/>
												</div>
											))}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													workHistoryFieldArray.append({
														company: "",
														startMonth: "",
														endMonth: null,
														role: "",
													})
												}
												disabled={isSubmitting}
											>
												＋ 職歴を追加
											</Button>
										</div>
									</div>
								</section>

								{/* 自己PR */}
								<section className="space-y-4">
									<h2 className="border-b pb-2 text-lg font-semibold text-foreground">自己PR</h2>
									<TextAreaInputField
										control={control}
										name="selfPR"
										label="自己PR"
										rows={6}
										disabled={isSubmitting}
									/>
								</section>

								{/* ボタン */}
								<div className="flex justify-end gap-3 pt-4">
									<Button
										type="button"
										variant="outline"
										onClick={handleCancel}
										disabled={isSubmitting}
									>
										キャンセル
									</Button>
									<Button type="submit" disabled={isSubmitting}>
										{isSubmitting ? "更新中..." : "更新"}
									</Button>
								</div>
							</form>

							<LeaveConfirmDialog
								open={cancelDialogOpen}
								onOpenChange={setCancelDialogOpen}
								onConfirm={confirmCancel}
							/>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
