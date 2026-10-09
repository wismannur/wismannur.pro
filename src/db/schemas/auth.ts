import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const theme = pgEnum("theme", ["light", "dark", "system"]);

export const colorScheme = pgEnum("color_scheme", ["blue", "purple", "green", "orange", "red"]);

// Single admin row. Credentials live in env vars (Auth.js, phase 8.4) — this
// table only holds the public profile shown by AuthorBio / CMS profile page.
export const users = pgTable("users", {
  uid: text("uid").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  photoURL: text("photo_url"),
  bio: text("bio").notNull().default(""),
  location: text("location").notNull().default(""),
  website: text("website").notNull().default(""),
  social: jsonb("social").$type<{ github: string; twitter: string; linkedin: string }>().notNull(),
});

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.uid, { onDelete: "cascade" }),
  theme: theme("theme").notNull().default("system"),
  colorScheme: colorScheme("color_scheme").notNull().default("blue"),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  marketingEmails: boolean("marketing_emails").notNull().default(false),
  newCommentNotifications: boolean("new_comment_notifications").notNull().default(true),
  mentionNotifications: boolean("mention_notifications").notNull().default(true),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("Asia/Jakarta"),
  dateFormat: text("date_format").notNull().default("DD/MM/YYYY"),
  careerWeeklyTarget: integer("career_weekly_target").notNull().default(5),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserRow = typeof users.$inferSelect;
export type UserSettingsRow = typeof userSettings.$inferSelect;
