import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { PageCopyContent } from "@/services/page-copy/types";

export const resumeKind = pgEnum("resume_kind", ["experience", "education"]);

export const pageKeyEnum = pgEnum("page_key", [
  "home",
  "about",
  "services",
  "hire-me",
  "blog",
  "projects",
  "contact",
  "not-found",
  "default",
]);

export const processScope = pgEnum("process_scope", ["services", "hire-me"]);

export const availabilityStatus = pgEnum("availability_status", ["available", "limited", "booked"]);

export const blogs = pgTable("blogs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  image: text("image").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  publishedDate: timestamp("published_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  readingTime: integer("reading_time").notNull().default(0),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
});

export const projects = pgTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  publishedDate: timestamp("published_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  technologies: text("technologies")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  demoUrl: text("demo_url"),
  repoUrl: text("repo_url"),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  readingTime: integer("reading_time").notNull().default(0),
  authorId: text("author_id"),
  authorName: text("author_name"),
});

export const resumeEntries = pgTable("resume_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  kind: resumeKind("kind").notNull(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  location: text("location"),
  employmentType: text("employment_type"),
  locationType: text("location_type"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isCurrent: boolean("is_current").notNull().default(false),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("site"),
  siteName: text("site_name").notNull(),
  titleDefault: text("title_default").notNull(),
  titleTemplate: text("title_template").notNull(),
  metaDescription: text("meta_description").notNull(),
  keywords: text("keywords")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  twitterHandle: text("twitter_handle").notNull().default(""),
  themeColor: text("theme_color").notNull().default("#4F46E5"),
  ogTitle: text("og_title").notNull().default(""),
  ogTagline: text("og_tagline").notNull().default(""),
  publicEmail: text("public_email").notNull().default(""),
  location: text("location").notNull().default(""),
  timezoneLabel: text("timezone_label").notNull().default(""),
  social: jsonb("social").$type<{ github: string; twitter: string; linkedin: string }>().notNull(),
  footerBio: text("footer_bio").notNull().default(""),
  footerTagline: text("footer_tagline").notNull().default(""),
  copyrightName: text("copyright_name").notNull().default(""),
  repoUrl: text("repo_url").notNull().default(""),
  repoLinkLabel: text("repo_link_label").notNull().default(""),
  footerProjectLinks: jsonb("footer_project_links")
    .$type<Array<{ label: string; href: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  requestTimeframes: jsonb("request_timeframes")
    .$type<Array<{ id: string; label: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  requestBudgetRanges: jsonb("request_budget_ranges")
    .$type<Array<{ id: string; label: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  enableBlog: boolean("enable_blog").notNull().default(true),
  enableAiChat: boolean("enable_ai_chat").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const pageCopy = pgTable("page_copy", {
  page: pageKeyEnum("page").primaryKey(),
  content: jsonb("content").$type<PageCopyContent>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const skills = pgTable("skills", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const services = pgTable("services", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  icon: text("icon").notNull(),
  priceLabel: text("price_label").notNull().default(""),
  features: text("features")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  showOnHome: boolean("show_on_home").notNull().default(true),
  showOnHireMe: boolean("show_on_hire_me").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const faqs = pgTable("faqs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const processSteps = pgTable("process_steps", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  scope: processScope("scope").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const testimonials = pgTable("testimonials", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  quote: text("quote").notNull(),
  avatarUrl: text("avatar_url"),
  rating: integer("rating").notNull().default(5),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const availabilitySlots = pgTable("availability_slots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  status: availabilityStatus("status").notNull().default("available"),
  label: text("label").notNull().default("Available"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const sitePages = pgTable("site_pages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type BlogRow = typeof blogs.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type ResumeEntryRow = typeof resumeEntries.$inferSelect;
export type SiteSettingsRow = typeof siteSettings.$inferSelect;
export type PageCopyRow = typeof pageCopy.$inferSelect;
export type SkillRow = typeof skills.$inferSelect;
export type ServiceRow = typeof services.$inferSelect;
export type FaqRow = typeof faqs.$inferSelect;
export type ProcessStepRow = typeof processSteps.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type AvailabilitySlotRow = typeof availabilitySlots.$inferSelect;
export type SitePageRow = typeof sitePages.$inferSelect;
