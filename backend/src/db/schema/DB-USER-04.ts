import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./DB-AUTH-01.js";

export const userWorkHistories = pgTable("user_work_histories", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	company: varchar("company", { length: 255 }).notNull(),
	startMonth: varchar("start_month", { length: 7 }).notNull(),
	endMonth: varchar("end_month", { length: 7 }),
	role: varchar("role", { length: 255 }).notNull(),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserWorkHistory = typeof userWorkHistories.$inferSelect;
export type NewUserWorkHistory = typeof userWorkHistories.$inferInsert;