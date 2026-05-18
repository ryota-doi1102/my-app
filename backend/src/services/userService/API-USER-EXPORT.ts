import { and, asc, eq, ilike, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import type { WorkTypeEnumValue } from "../../db/schema.js";
import {
	userProfiles,
	userQualifications,
	users,
	userWorkHistories,
	userWorkTypes,
} from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";
import { IMPORT_TEMPLATE_HEADERS } from "./API-USER-IMPORT.js";

const logger = getAppLogger(["services", "users", "API-USER-EXPORT"]);

type ExportParams = {
	name?: string | undefined;
	email?: string | undefined;
	phone?: string | undefined;
	workTypeNames?: string[] | undefined;
	sortKey?: "name" | "email" | "phone" | null | undefined;
	sortOrder?: "asc" | "desc" | undefined;
};

function escapeCsv(value: string | null | undefined): string {
	const s = value ?? "";
	return `"${s.replace(/"/g, '""')}"`;
}

export async function exportUsers(params: ExportParams): Promise<string> {
	const { name, email, phone, workTypeNames = [], sortKey, sortOrder = "asc" } = params;

	// 検索条件ビルド（API-USER-01 と同じロジック・ページングなし）
	const conditions = [isNull(users.deletedAt)];
	if (name) conditions.push(ilike(userProfiles.name, `%${name}%`));
	if (email) conditions.push(ilike(users.email, `%${email}%`));
	if (phone) conditions.push(ilike(userProfiles.phone, `%${phone}%`));
	if (workTypeNames.length > 0) {
		conditions.push(
			inArray(
				users.id,
				db
					.select({ userId: userWorkTypes.userId })
					.from(userWorkTypes)
					.where(inArray(userWorkTypes.workType, workTypeNames as WorkTypeEnumValue[])),
			),
		);
	}
	const where = and(...conditions);

	const sortColumn =
		sortKey === "name"
			? userProfiles.name
			: sortKey === "email"
				? users.email
				: sortKey === "phone"
					? userProfiles.phone
					: users.createdAt;
	const order = sortOrder === "desc" ? asc(sortColumn) : asc(sortColumn);

	// 全件取得（ページングなし）
	const rows = await db
		.select({
			userId: users.id,
			email: users.email,
			name: userProfiles.name,
			birthDate: userProfiles.birthDate,
			gender: userProfiles.gender,
			phone: userProfiles.phone,
			postalCode: userProfiles.postalCode,
			prefecture: userProfiles.prefecture,
			city: userProfiles.city,
			streetAddress: userProfiles.streetAddress,
			building: userProfiles.building,
			selfPr: userProfiles.selfPr,
		})
		.from(users)
		.innerJoin(userProfiles, eq(userProfiles.userId, users.id))
		.where(where)
		.orderBy(order);

	const userIds = rows.map((r) => r.userId);

	// 関連データを一括取得
	const [workTypeRows, qualRows, historyRows] =
		userIds.length > 0
			? await Promise.all([
					db
						.select({ userId: userWorkTypes.userId, workType: userWorkTypes.workType })
						.from(userWorkTypes)
						.where(inArray(userWorkTypes.userId, userIds))
						.orderBy(asc(userWorkTypes.sortOrder)),
					db
						.select({ userId: userQualifications.userId, value: userQualifications.value })
						.from(userQualifications)
						.where(inArray(userQualifications.userId, userIds))
						.orderBy(asc(userQualifications.sortOrder)),
					db
						.select({
							userId: userWorkHistories.userId,
							company: userWorkHistories.company,
							startMonth: userWorkHistories.startMonth,
							endMonth: userWorkHistories.endMonth,
							role: userWorkHistories.role,
						})
						.from(userWorkHistories)
						.where(inArray(userWorkHistories.userId, userIds))
						.orderBy(asc(userWorkHistories.sortOrder)),
				])
			: [[], [], []];

	// userId をキーにした Map を構築
	const workTypeMap = new Map<string, string[]>();
	for (const wt of workTypeRows) {
		const arr = workTypeMap.get(wt.userId) ?? [];
		arr.push(wt.workType);
		workTypeMap.set(wt.userId, arr);
	}
	const qualMap = new Map<string, string[]>();
	for (const q of qualRows) {
		const arr = qualMap.get(q.userId) ?? [];
		arr.push(q.value);
		qualMap.set(q.userId, arr);
	}
	const historyMap = new Map<string, typeof historyRows>();
	for (const h of historyRows) {
		const arr = historyMap.get(h.userId) ?? [];
		arr.push(h);
		historyMap.set(h.userId, arr);
	}

	// CSV 行を生成
	const header = IMPORT_TEMPLATE_HEADERS.map(escapeCsv).join(",");

	const dataRows = rows.map((row) => {
		const workTypes = workTypeMap.get(row.userId) ?? [];
		const qualifications = qualMap.get(row.userId) ?? [];
		const histories = historyMap.get(row.userId) ?? [];

		const wh = (i: number) => ({
			company: histories[i]?.company ?? "",
			startMonth: histories[i]?.startMonth ?? "",
			endMonth: histories[i]?.endMonth ?? "",
			role: histories[i]?.role ?? "",
		});
		const h1 = wh(0);
		const h2 = wh(1);
		const h3 = wh(2);

		return [
			escapeCsv(row.userId),
			escapeCsv(row.name),
			escapeCsv(row.email),
			escapeCsv(""),           // パスワード（出力しない）
			escapeCsv(row.phone),
			escapeCsv(row.birthDate),
			escapeCsv(row.gender),
			escapeCsv(row.postalCode),
			escapeCsv(row.prefecture),
			escapeCsv(row.city),
			escapeCsv(row.streetAddress),
			escapeCsv(row.building),
			escapeCsv(workTypes.join(";")),
			escapeCsv(qualifications.join(";")),
			escapeCsv(row.selfPr),
			escapeCsv(h1.company),
			escapeCsv(h1.startMonth),
			escapeCsv(h1.endMonth),
			escapeCsv(h1.role),
			escapeCsv(h2.company),
			escapeCsv(h2.startMonth),
			escapeCsv(h2.endMonth),
			escapeCsv(h2.role),
			escapeCsv(h3.company),
			escapeCsv(h3.startMonth),
			escapeCsv(h3.endMonth),
			escapeCsv(h3.role),
		].join(",");
	});

	logger.info("エクスポート完了", { count: rows.length });

	// UTF-8 BOM 付き CSV を返す
	return `﻿${header}\n${dataRows.join("\n")}`;
}
