import {
	date,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "./DB-AUTH-01.js";
import { genderEnum } from "./DB-MASTER-01.js";

export const userProfiles = pgTable("user_profiles", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 100 }),
	birthDate: date("birth_date"),
	gender: genderEnum("gender"),
	profileImageUrl: text("profile_image_url"),
	phone: varchar("phone", { length: 11 }),
	postalCode: varchar("postal_code", { length: 7 }),
	prefecture: varchar("prefecture", { length: 50 }),
	city: varchar("city", { length: 100 }),
	streetAddress: varchar("street_address", { length: 255 }),
	building: varchar("building", { length: 255 }),
	selfPr: text("self_pr"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
