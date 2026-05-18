import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const importJobs = pgTable("import_jobs", {
	id: uuid("id").primaryKey().defaultRandom(),
	status: text("status").notNull().default("pending"), // pending | processing | completed | failed
	createdCount: integer("created_count"),
	updatedCount: integer("updated_count"),
	errors: text("errors").array(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exportJobs = pgTable("export_jobs", {
	id: uuid("id").primaryKey().defaultRandom(),
	status: text("status").notNull().default("pending"), // pending | processing | completed | failed
	csvContent: text("csv_content"),
	errors: text("errors").array(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ImportJob = typeof importJobs.$inferSelect;
export type ExportJob = typeof exportJobs.$inferSelect;
