import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./DB-AUTH-01.js";
import { workTypeEnum } from "./DB-MASTER-02.js";

export const userWorkTypes = pgTable("user_work_types", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	workType: workTypeEnum("work_type").notNull(),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserWorkType = typeof userWorkTypes.$inferSelect;
export type NewUserWorkType = typeof userWorkTypes.$inferInsert;
