import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const workTypes = pgTable("work_types", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 20 }).notNull().unique(),
	sortOrder: integer("sort_order").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WorkType = typeof workTypes.$inferSelect;
export type NewWorkType = typeof workTypes.$inferInsert;