import { pgEnum } from "drizzle-orm/pg-core";

export const workTypeEnum = pgEnum("work_type", [
	"フルタイム",
	"パートタイム",
	"リモート",
	"フリーランス",
]);
export type WorkTypeEnumValue = (typeof workTypeEnum.enumValues)[number];
