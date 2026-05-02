import "dotenv/config";
import { db } from "./index.js";
import { genders, workTypes } from "./schema.js";

const GENDERS = [
	{ name: "男性", sortOrder: 1 },
	{ name: "女性", sortOrder: 2 },
	{ name: "その他", sortOrder: 3 },
];

const WORK_TYPES = [
	{ name: "フルタイム", sortOrder: 1 },
	{ name: "パートタイム", sortOrder: 2 },
	{ name: "リモート", sortOrder: 3 },
	{ name: "フリーランス", sortOrder: 4 },
];

await db
	.insert(genders)
	.values(GENDERS)
	.onConflictDoNothing();

await db
	.insert(workTypes)
	.values(WORK_TYPES)
	.onConflictDoNothing();

console.log("シード完了: genders, work_types");
process.exit(0);