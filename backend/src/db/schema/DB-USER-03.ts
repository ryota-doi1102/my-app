import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./DB-AUTH-01.js";

export const userQualifications = pgTable("user_qualifications", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	value: text("value").notNull(),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserQualification = typeof userQualifications.$inferSelect;
export type NewUserQualification = typeof userQualifications.$inferInsert;