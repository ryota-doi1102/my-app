import { and, asc, count, desc, eq, ilike, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import type { WorkTypeEnumValue } from "../../db/schema.js";
import { userProfiles, users, userWorkTypes } from "../../db/schema.js";
import { getAppLogger } from "../../lib/logger.js";

const logger = getAppLogger(["services", "users", "API-USER-01"]);

type SearchParams = {
	name: string;
	email: string;
	phone: string;
	workTypeNames: string[];
	sortKey: "name" | "email" | "phone" | null;
	sortOrder: "asc" | "desc";
	page: number;
	perPage: number;
};

type UserListItem = {
	id: string;
	name: string | null;
	email: string;
	phone: string | null;
	workTypes: string[];
};

type SearchResult = {
	users: UserListItem[];
	totalCount: number;
	page: number;
	perPage: number;
	totalPages: number;
};

export async function searchUsers(params: SearchParams): Promise<SearchResult> {
	const {
		name,
		email,
		phone,
		workTypeNames,
		sortKey,
		sortOrder,
		page,
		perPage,
	} = params;

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
					.where(
						inArray(
							userWorkTypes.workType,
							workTypeNames as WorkTypeEnumValue[],
						),
					),
			),
		);
	}

	const whereClause = and(...conditions);

	const sortColumn =
		sortKey === "name"
			? userProfiles.name
			: sortKey === "email"
				? users.email
				: sortKey === "phone"
					? userProfiles.phone
					: users.createdAt;
	const orderExpr = sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn);

	const [countRow, rows] = await Promise.all([
		db
			.select({ count: count() })
			.from(users)
			.innerJoin(userProfiles, eq(userProfiles.userId, users.id))
			.where(whereClause),
		db
			.select({
				userId: users.id,
				email: users.email,
				name: userProfiles.name,
				phone: userProfiles.phone,
			})
			.from(users)
			.innerJoin(userProfiles, eq(userProfiles.userId, users.id))
			.where(whereClause)
			.orderBy(orderExpr)
			.limit(perPage)
			.offset((page - 1) * perPage),
	]);

	const totalCount = countRow[0]?.count ?? 0;
	const totalPages = Math.ceil(totalCount / perPage);

	const userIds = rows.map((r) => r.userId);
	const workTypeMap = new Map<string, string[]>();

	if (userIds.length > 0) {
		const workTypeRows = await db
			.select({
				userId: userWorkTypes.userId,
				workType: userWorkTypes.workType,
			})
			.from(userWorkTypes)
			.where(inArray(userWorkTypes.userId, userIds))
			.orderBy(asc(userWorkTypes.sortOrder));

		for (const wt of workTypeRows) {
			const existing = workTypeMap.get(wt.userId) ?? [];
			existing.push(wt.workType);
			workTypeMap.set(wt.userId, existing);
		}
	}

	logger.info("ユーザー一覧検索完了", { totalCount, page, perPage });

	return {
		users: rows.map((r) => ({
			id: r.userId,
			name: r.name ?? null,
			email: r.email,
			phone: r.phone ?? null,
			workTypes: workTypeMap.get(r.userId) ?? [],
		})),
		totalCount,
		page,
		perPage,
		totalPages,
	};
}
