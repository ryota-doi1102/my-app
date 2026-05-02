import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).notNull(),
	token: varchar("token", { length: 255 }).notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	usedAt: timestamp("used_at"),
	revokedAt: timestamp("revoked_at"),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
