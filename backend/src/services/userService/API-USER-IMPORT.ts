import { hash } from "bcryptjs";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { calcAge } from "@shared/schemas/user.js";
import { db } from "../../db/index.js";
import {
	userProfiles,
	userQualifications,
	users,
	userWorkHistories,
	userWorkTypes,
} from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";

const logger = getAppLogger(["services", "users", "API-USER-IMPORT"]);

export const IMPORT_TEMPLATE_HEADERS = [
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
] as const;

const VALID_GENDERS = ["男性", "女性", "その他"] as const;
const VALID_WORK_TYPES = ["フルタイム", "パートタイム", "リモート", "フリーランス"] as const;
const YYYYMMDD_RE = /^\d{4}-\d{2}-\d{2}$/;
const YYYYMM_RE = /^\d{4}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ImportValidationError extends Error {
	constructor(public readonly messages: string[]) {
		super(messages[0]);
		this.name = "ImportValidationError";
	}
}

type WorkHistoryCell = { company: string; startMonth: string; endMonth: string; role: string };

type ParsedRow = {
	rowNum: number;
	id: string;
	name: string;
	email: string;
	password: string;
	phone: string;
	birthDate: string;
	gender: string;
	postalCode: string;
	prefecture: string;
	city: string;
	streetAddress: string;
	building: string;
	workTypes: string[];
	qualifications: string[];
	selfPR: string;
	workHistories: WorkHistoryCell[];
};

// シンプルな CSV 行パーサー（ダブルクォート対応）
function parseCsvLine(line: string): string[] {
	const fields: string[] = [];
	let i = 0;
	while (i <= line.length) {
		if (i === line.length) {
			if (line.at(-1) === ",") fields.push("");
			break;
		}
		if (line[i] === '"') {
			i++;
			let value = "";
			while (i < line.length) {
				if (line[i] === '"' && line[i + 1] === '"') {
					value += '"';
					i += 2;
				} else if (line[i] === '"') {
					i++;
					break;
				} else {
					value += line[i++];
				}
			}
			fields.push(value);
			if (line[i] === ",") i++;
		} else {
			const comma = line.indexOf(",", i);
			if (comma === -1) {
				fields.push(line.slice(i));
				break;
			}
			fields.push(line.slice(i, comma));
			i = comma + 1;
		}
	}
	while (fields.length < IMPORT_TEMPLATE_HEADERS.length) fields.push("");
	return fields;
}

function toRow(rowNum: number, cols: string[]): ParsedRow {
	const wh = (n: 0 | 1 | 2): WorkHistoryCell => ({
		company: cols[15 + n * 4] ?? "",
		startMonth: cols[16 + n * 4] ?? "",
		endMonth: cols[17 + n * 4] ?? "",
		role: cols[18 + n * 4] ?? "",
	});
	return {
		rowNum,
		id: cols[0] ?? "",
		name: cols[1] ?? "",
		email: cols[2] ?? "",
		password: cols[3] ?? "",
		phone: cols[4] ?? "",
		birthDate: cols[5] ?? "",
		gender: cols[6] ?? "",
		postalCode: cols[7] ?? "",
		prefecture: cols[8] ?? "",
		city: cols[9] ?? "",
		streetAddress: cols[10] ?? "",
		building: cols[11] ?? "",
		workTypes: cols[12] ? cols[12].split(";").map((s) => s.trim()).filter(Boolean) : [],
		qualifications: cols[13] ? cols[13].split(";").map((s) => s.trim()).filter(Boolean) : [],
		selfPR: cols[14] ?? "",
		workHistories: [wh(0), wh(1), wh(2)],
	};
}

// フォーマット・必須チェック（DB アクセスなし）
function validateFormat(row: ParsedRow, isNew: boolean): string[] {
	const errors: string[] = [];
	const p = `${row.rowNum}行目: `;

	if (!row.name) errors.push(`${p}氏名 は必須項目です`);
	else if (row.name.length > 100) errors.push(`${p}氏名は100文字以下で入力してください`);

	if (!row.email) errors.push(`${p}メールアドレス は必須項目です`);
	else if (!EMAIL_RE.test(row.email)) errors.push(`${p}メールアドレス の形式が正しくありません`);

	if (isNew) {
		if (!row.password) errors.push(`${p}パスワード は必須項目です`);
		else {
			if (row.password.length < 8) errors.push(`${p}パスワードは8文字以上で入力してください`);
			if (!/[A-Z]/.test(row.password)) errors.push(`${p}パスワードには大文字の英字を1文字以上含めてください`);
			if (!/[a-z]/.test(row.password)) errors.push(`${p}パスワードには小文字の英字を1文字以上含めてください`);
			if (!/[0-9]/.test(row.password)) errors.push(`${p}パスワードには数字を1文字以上含めてください`);
		}
	}

	if (row.phone) {
		if (row.phone.includes("-")) errors.push(`${p}電話番号にハイフンは使用できません（例: 09012345678）`);
		else if (!/^\d+$/.test(row.phone)) errors.push(`${p}電話番号は半角数字で入力してください`);
		else if (!/^\d{10,11}$/.test(row.phone)) errors.push(`${p}電話番号は10〜11桁で入力してください`);
	}

	if (!row.birthDate) errors.push(`${p}生年月日 は必須項目です`);
	else if (!YYYYMMDD_RE.test(row.birthDate)) errors.push(`${p}生年月日 の形式が正しくありません（YYYY-MM-DD で入力してください）`);
	else if (calcAge(row.birthDate) < 18) errors.push(`${p}18歳未満の方は登録できません`);
	else if (calcAge(row.birthDate) >= 60) errors.push(`${p}60歳以上の方は登録できません`);

	if (!row.gender) errors.push(`${p}性別 は必須項目です`);
	else if (!VALID_GENDERS.includes(row.gender as (typeof VALID_GENDERS)[number])) errors.push(`${p}性別 の形式が正しくありません`);

	if (row.postalCode) {
		if (row.postalCode.includes("-")) errors.push(`${p}郵便番号にハイフンは使用できません（例: 1234567）`);
		else if (!/^\d+$/.test(row.postalCode)) errors.push(`${p}郵便番号は半角数字で入力してください`);
		else if (!/^\d{7}$/.test(row.postalCode)) errors.push(`${p}郵便番号は7桁で入力してください`);
	}

	for (const wt of row.workTypes) {
		if (!VALID_WORK_TYPES.includes(wt as (typeof VALID_WORK_TYPES)[number])) {
			errors.push(`${p}希望勤務形態 に無効な値 "${wt}" が含まれています`);
		}
	}

	for (const q of row.qualifications) {
		if (!q) errors.push(`${p}資格名 は必須項目です`);
	}

	// 職歴1（必須）
	const wh1 = row.workHistories[0];
	if (!wh1?.company) errors.push(`${p}職歴1_会社名 は必須項目です`);
	else if (wh1.company.length > 255) errors.push(`${p}職歴1_会社名 は255文字以下で入力してください`);
	if (!wh1?.startMonth) errors.push(`${p}職歴1_開始月 は必須項目です`);
	else if (!YYYYMM_RE.test(wh1.startMonth)) errors.push(`${p}職歴1_開始月 の形式が正しくありません（YYYY-MM で入力してください）`);
	if (wh1?.endMonth && !YYYYMM_RE.test(wh1.endMonth)) errors.push(`${p}職歴1_終了月 の形式が正しくありません（YYYY-MM で入力してください）`);
	if (!wh1?.role) errors.push(`${p}職歴1_役職 は必須項目です`);
	else if (wh1.role.length > 255) errors.push(`${p}職歴1_役職 は255文字以下で入力してください`);

	// 職歴2・3（条件付き）
	for (const [wi, wh] of ([row.workHistories[1], row.workHistories[2]] as WorkHistoryCell[]).entries()) {
		const n = wi + 2;
		if (!wh?.company) continue;
		if (wh.company.length > 255) errors.push(`${p}職歴${n}_会社名 は255文字以下で入力してください`);
		if (!wh.startMonth) errors.push(`${p}職歴${n}_会社名 を入力した場合、職歴${n}_開始月 は必須です`);
		else if (!YYYYMM_RE.test(wh.startMonth)) errors.push(`${p}職歴${n}_開始月 の形式が正しくありません（YYYY-MM で入力してください）`);
		if (wh.endMonth && !YYYYMM_RE.test(wh.endMonth)) errors.push(`${p}職歴${n}_終了月 の形式が正しくありません（YYYY-MM で入力してください）`);
		if (!wh.role) errors.push(`${p}職歴${n}_会社名 を入力した場合、職歴${n}_役職 は必須です`);
		else if (wh.role.length > 255) errors.push(`${p}職歴${n}_役職 は255文字以下で入力してください`);
	}

	return errors;
}

// DB を使ったバリデーション（ID 存在確認・メール重複確認）
async function validateWithDb(
	newRows: ParsedRow[],
	updateRows: ParsedRow[],
): Promise<string[]> {
	const errors: string[] = [];

	// 更新行: ID が DB に存在するか確認
	if (updateRows.length > 0) {
		const updateIds = updateRows.map((r) => r.id);
		const found = await db
			.select({ id: users.id })
			.from(users)
			.where(and(inArray(users.id, updateIds), isNull(users.deletedAt)));
		const foundSet = new Set(found.map((u) => u.id));
		for (const row of updateRows) {
			if (!foundSet.has(row.id)) {
				errors.push(`${row.rowNum}行目: ID "${row.id}" に一致するユーザーが見つかりません`);
			}
		}
	}

	// 全行: メールアドレスの DB 重複確認
	const allEmails = [...newRows, ...updateRows].map((r) => r.email).filter(Boolean);
	if (allEmails.length > 0) {
		const conflicting = await db
			.select({ id: users.id, email: users.email })
			.from(users)
			.where(and(inArray(users.email, allEmails), isNull(users.deletedAt)));
		const emailToId = new Map(conflicting.map((u) => [u.email, u.id]));

		for (const row of newRows) {
			if (emailToId.has(row.email)) {
				errors.push(`${row.rowNum}行目: メールアドレス ${row.email} は既に登録されています`);
			}
		}
		for (const row of updateRows) {
			const conflictId = emailToId.get(row.email);
			if (conflictId && conflictId !== row.id) {
				errors.push(`${row.rowNum}行目: メールアドレス ${row.email} は既に登録されています`);
			}
		}
	}

	return errors;
}

function buildWorkHistories(row: ParsedRow): WorkHistoryCell[] {
	return row.workHistories.filter((wh) => wh.company);
}

// 一括登録・更新トランザクション
async function executeImport(
	newRows: ParsedRow[],
	updateRows: ParsedRow[],
): Promise<{ created: number; updated: number }> {
	await db.transaction(async (tx) => {
		// 新規登録
		for (const row of newRows) {
			const passwordHash = await hash(row.password, 12);
			const [newUser] = await tx.insert(users).values({ email: row.email, passwordHash }).returning();
			if (!newUser) throw new Error("ユーザー作成に失敗しました");

			await tx.insert(userProfiles).values({
				userId: newUser.id,
				name: row.name,
				birthDate: row.birthDate || null,
				gender: row.gender as "男性" | "女性" | "その他",
				phone: row.phone || null,
				postalCode: row.postalCode || null,
				prefecture: row.prefecture || null,
				city: row.city || null,
				streetAddress: row.streetAddress || null,
				building: row.building || null,
				selfPr: row.selfPR || null,
			});

			if (row.workTypes.length > 0) {
				await tx.insert(userWorkTypes).values(
					row.workTypes.map((wt, i) => ({ userId: newUser.id, workType: wt as "フルタイム" | "パートタイム" | "リモート" | "フリーランス", sortOrder: i })),
				);
			}
			if (row.qualifications.length > 0) {
				await tx.insert(userQualifications).values(
					row.qualifications.map((q, i) => ({ userId: newUser.id, value: q, sortOrder: i })),
				);
			}
			const histories = buildWorkHistories(row);
			await tx.insert(userWorkHistories).values(
				histories.map((wh, i) => ({
					userId: newUser.id,
					company: wh.company,
					startMonth: wh.startMonth,
					endMonth: wh.endMonth || null,
					role: wh.role,
					sortOrder: i,
				})),
			);
		}

		// 更新
		for (const row of updateRows) {
			await tx
				.update(users)
				.set({ email: row.email, updatedAt: new Date() })
				.where(eq(users.id, row.id));

			await tx
				.update(userProfiles)
				.set({
					name: row.name,
					birthDate: row.birthDate || null,
					gender: row.gender as "男性" | "女性" | "その他",
					phone: row.phone || null,
					postalCode: row.postalCode || null,
					prefecture: row.prefecture || null,
					city: row.city || null,
					streetAddress: row.streetAddress || null,
					building: row.building || null,
					selfPr: row.selfPR || null,
					updatedAt: new Date(),
				})
				.where(eq(userProfiles.userId, row.id));

			await tx.delete(userWorkTypes).where(eq(userWorkTypes.userId, row.id));
			if (row.workTypes.length > 0) {
				await tx.insert(userWorkTypes).values(
					row.workTypes.map((wt, i) => ({ userId: row.id, workType: wt as "フルタイム" | "パートタイム" | "リモート" | "フリーランス", sortOrder: i })),
				);
			}

			await tx.delete(userQualifications).where(eq(userQualifications.userId, row.id));
			if (row.qualifications.length > 0) {
				await tx.insert(userQualifications).values(
					row.qualifications.map((q, i) => ({ userId: row.id, value: q, sortOrder: i })),
				);
			}

			const histories = buildWorkHistories(row);
			await tx.delete(userWorkHistories).where(eq(userWorkHistories.userId, row.id));
			await tx.insert(userWorkHistories).values(
				histories.map((wh, i) => ({
					userId: row.id,
					company: wh.company,
					startMonth: wh.startMonth,
					endMonth: wh.endMonth || null,
					role: wh.role,
					sortOrder: i,
				})),
			);
		}
	});

	logger.info("インポート完了", { created: newRows.length, updated: updateRows.length });
	return { created: newRows.length, updated: updateRows.length };
}

export async function importUsers(csvText: string): Promise<{ created: number; updated: number }> {
	// BOM 除去・行分割
	const text = csvText.startsWith("﻿") ? csvText.slice(1) : csvText;
	const lines = text.split(/\r?\n/).filter((l) => l.trim());

	const [headerLine, ...dataLines] = lines;
	if (!headerLine || dataLines.length === 0) {
		throw new ImportValidationError(["データ行が存在しません"]);
	}

	// ヘッダー検証
	const headerCols = parseCsvLine(headerLine);
	const headerMismatch = IMPORT_TEMPLATE_HEADERS.some((h, i) => headerCols[i] !== h);
	if (headerMismatch) {
		throw new ImportValidationError(["ヘッダーが仕様と一致しません"]);
	}

	// データ行パース・分類
	const allRows = dataLines.map((line, i) => toRow(i + 2, parseCsvLine(line)));
	const newRows = allRows.filter((r) => !r.id);
	const updateRows = allRows.filter((r) => r.id);

	// ファイル内 ID 重複チェック
	const idErrors: string[] = [];
	const idMap = new Map<string, number[]>();
	for (const row of updateRows) {
		const rows = idMap.get(row.id) ?? [];
		rows.push(row.rowNum);
		idMap.set(row.id, rows);
	}
	for (const [id, rowNums] of idMap) {
		if (rowNums.length > 1) {
			idErrors.push(`${rowNums.join("行目・")}行目: ID "${id}" が重複しています`);
		}
	}

	// ファイル内メールアドレス重複チェック
	const emailMap = new Map<string, number[]>();
	for (const row of allRows) {
		if (!row.email) continue;
		const rows = emailMap.get(row.email) ?? [];
		rows.push(row.rowNum);
		emailMap.set(row.email, rows);
	}
	for (const [email, rowNums] of emailMap) {
		if (rowNums.length > 1) {
			idErrors.push(`${rowNums.join("行目・")}行目: メールアドレス ${email} が重複しています`);
		}
	}

	if (idErrors.length > 0) throw new ImportValidationError(idErrors);

	// フォーマット・必須バリデーション
	const formatErrors = [
		...newRows.flatMap((r) => validateFormat(r, true)),
		...updateRows.flatMap((r) => validateFormat(r, false)),
	];
	if (formatErrors.length > 0) throw new ImportValidationError(formatErrors);

	// DB バリデーション
	const dbErrors = await validateWithDb(newRows, updateRows);
	if (dbErrors.length > 0) throw new ImportValidationError(dbErrors);

	return executeImport(newRows, updateRows);
}
