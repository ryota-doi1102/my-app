import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const genders = pgTable("genders", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 10 }).notNull().unique(),
	sortOrder: integer("sort_order").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Gender = typeof genders.$inferSelect;
export type NewGender = typeof genders.$inferInsert;