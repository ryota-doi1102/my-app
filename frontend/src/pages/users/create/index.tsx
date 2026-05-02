import { WORK_TYPES } from "@shared/schemas/user";
import { UserCircle } from "lucide-react";
import { Controller } from "react-hook-form";
import { InputCheckboxField } from "@/components/shadcn/custom/input/checkbox";
import { InputCheckboxGroupField } from "@/components/shadcn/custom/input/checkbox-group";
import { DateInput, DateInputField } from "@/components/shadcn/custom/input/date";
import { EmailInputField } from "@/components/shadcn/custom/input/email";
import { PasswordInputField } from "@/components/shadcn/custom/input/password";
import { TextInputField } from "@/components/shadcn/custom/input/text";
import { TextAreaInputField } from "@/components/shadcn/custom/input/textarea";
import { LeaveConfirmDialog } from "@/components/shadcn/custom/LeaveConfirmDialog";
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
import { useUserCreateForm } from "./useUserCreateForm";

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

const TERMS_LABEL = (
	<>
		<a
			href="/terms"
			target="_blank"
			rel="noopener noreferrer"
			className="underline underline-offset-4 hover:text-primary"
		>
			利用規約
		</a>
		・
		<a
			href="/privacy"
			target="_blank"
			rel="noopener noreferrer"
			className="underline underline-offset-4 hover:text-primary"
		>
			プライバシーポリシー
		</a>
		に同意する
	</>
);

export function UserCreatePage() {
	const {
		control,
		handleSubmit,
		isSubmitting,
		age,
		profileImagePreviewUrl,
		apiError,
		cancelDialogOpen,
		setCancelDialogOpen,
		handleCancel,
		confirmCancel,
		qualificationFieldArray,
		workHistoryFieldArray,
	} = useUserCreateForm();

	return (
		<div className="px-8 py-8">
			<Card className="mx-auto max-w-2xl bg-white">
				<CardContent>
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
									<label htmlFor="age" className="text-sm font-medium text-foreground">
										年齢
									</label>
									<Input
										id="age"
										value={age !== null ? `${age}歳` : ""}
										disabled
										readOnly
										placeholder="生年月日から自動計算"
									/>
								</div>
							</div>

							{/* 性別（ラジオボタン） */}
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
														id={`gender-${option}`}
														disabled={isSubmitting}
													/>
													<Label htmlFor={`gender-${option}`}>{option}</Label>
												</div>
											))}
										</RadioGroup>
										<FieldError>{fieldState.error?.message}</FieldError>
									</div>
								)}
							/>

							{/* プロフィール画像（ファイルアップロード） */}
							<Controller
								control={control}
								name="profileImage"
								render={({ field: { onChange }, fieldState }) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="profileImage">プロフィール画像</Label>
										<div className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-black">
											{profileImagePreviewUrl ? (
												<img
													src={profileImagePreviewUrl}
													alt="プロフィール画像プレビュー"
													className="h-full w-full object-cover"
												/>
											) : (
												<UserCircle className="h-full w-full text-gray-300" strokeWidth={1} />
											)}
										</div>
										<Input
											id="profileImage"
											type="file"
											accept="image/jpeg,image/png,image/webp"
											onChange={(e) => onChange(e.target.files?.[0] ?? null)}
											disabled={isSubmitting}
										/>
										<p className="text-xs text-muted-foreground">JPEG / PNG / WebP（最大 5MB）</p>
										<FieldError>{fieldState.error?.message}</FieldError>
									</div>
								)}
							/>
						</section>

						{/* 連絡先情報 */}
						<section className="space-y-4">
							<h2 className="border-b pb-2 text-lg font-semibold text-foreground">連絡先情報</h2>
							<TextInputField
								control={control}
								name="phone"
								label="電話番号"
								type="tel"
								placeholder="09012345678"
								disabled={isSubmitting}
							/>
							<EmailInputField control={control} name="email" required disabled={isSubmitting} />
							<PasswordInputField
								control={control}
								name="password"
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

							{/* 都道府県（セレクトボックス） */}
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

							{/* 資格（配列・任意） */}
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

							{/* 職歴（配列・必須） */}
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

												{/* 在籍終了月は null を扱うため inline Controller */}
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

						{/* 利用規約への同意（単一チェックボックス） */}
						<InputCheckboxField
							control={control}
							name="agreedToTerms"
							id="agreedToTerms"
							label={TERMS_LABEL}
							required
							disabled={isSubmitting}
						/>

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
								{isSubmitting ? "保存中..." : "保存"}
							</Button>
						</div>
					</form>

					<LeaveConfirmDialog
						open={cancelDialogOpen}
						onOpenChange={setCancelDialogOpen}
						onConfirm={confirmCancel}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
