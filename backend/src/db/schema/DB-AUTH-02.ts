import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./DB-AUTH-01.js";

export const signupTokens = pgTable("signup_tokens", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).notNull(),
	token: varchar("token", { length: 255 }).notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	usedAt: timestamp("used_at"),
	revokedAt: timestamp("revoked_at"),
});

export type SignupToken = typeof signupTokens.$inferSelect;
export type NewSignupToken = typeof signupTokens.$inferInsert;