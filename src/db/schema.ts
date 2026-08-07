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

// Mirrors the service contracts in `src/services/*/types.ts` 1:1 — those
// interfaces stay the source of truth for what pages/components consume.
// Two deliberate mappings happen in the service layer, not here:
//   - optional fields (`demoUrl?: string`) ⇄ nullable columns (string | null)
//   - fixture-style ids ("blog-1") coexist with generated UUIDs (text pk,
//     app-side crypto.randomUUID() default — same strategy as the mock services)

export const contactStatus = pgEnum("contact_status", [
	"new",
	"read",
	"replied",
	"archived",
]);

export const serviceRequestStatus = pgEnum("service_request_status", [
	"new",
	"in-progress",
	"completed",
	"cancelled",
]);

export const resumeKind = pgEnum("resume_kind", ["experience", "education"]);

export const theme = pgEnum("theme", ["light", "dark", "system"]);

export const colorScheme = pgEnum("color_scheme", [
	"blue",
	"purple",
	"green",
	"orange",
	"red",
]);

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
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
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
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
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

// Work experience + education, both behind one `kind` discriminator — the two
// lists on /about carry the same fields (title/degree, company/institution) and
// only `location` is experience-specific. Dates are stored structurally so the
// period label ("May 2021 - Sep 2024", "2014 - 2017") and the chronological
// order are derived, not typed by hand.
export const resumeEntries = pgTable("resume_entries", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	kind: resumeKind("kind").notNull(),
	title: text("title").notNull(),
	organization: text("organization").notNull(),
	location: text("location"),
	startDate: date("start_date").notNull(),
	endDate: date("end_date"),
	isCurrent: boolean("is_current").notNull().default(false),
	description: text("description").notNull().default(""),
	// Manual override; 0 for everything means pure reverse-chronological order.
	sortOrder: integer("sort_order").notNull().default(0),
	isPublished: boolean("is_published").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const contacts = pgTable("contacts", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	email: text("email").notNull(),
	subject: text("subject").notNull(),
	message: text("message").notNull(),
	status: contactStatus("status").notNull().default("new"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const serviceRequests = pgTable("service_requests", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	email: text("email").notNull(),
	company: text("company"),
	serviceType: text("service_type").notNull(),
	budget: text("budget").notNull(),
	timeframe: text("timeframe").notNull(),
	projectDetails: text("project_details").notNull(),
	status: serviceRequestStatus("status").notNull().default("new"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

// Single admin row. Credentials live in env vars (Auth.js, phase 8.4) — this
// table only holds the public profile shown by AuthorBio / CMS profile page.
export const users = pgTable("users", {
	uid: text("uid").primaryKey(),
	displayName: text("display_name").notNull(),
	email: text("email").notNull().unique(),
	photoURL: text("photo_url"),
	bio: text("bio").notNull().default(""),
	location: text("location").notNull().default(""),
	website: text("website").notNull().default(""),
	social: jsonb("social")
		.$type<{ github: string; twitter: string; linkedin: string }>()
		.notNull(),
});

export const userSettings = pgTable("user_settings", {
	userId: text("user_id")
		.primaryKey()
		.references(() => users.uid, { onDelete: "cascade" }),
	theme: theme("theme").notNull().default("system"),
	colorScheme: colorScheme("color_scheme").notNull().default("blue"),
	emailNotifications: boolean("email_notifications").notNull().default(true),
	marketingEmails: boolean("marketing_emails").notNull().default(false),
	newCommentNotifications: boolean("new_comment_notifications")
		.notNull()
		.default(true),
	mentionNotifications: boolean("mention_notifications").notNull().default(true),
	language: text("language").notNull().default("en"),
	timezone: text("timezone").notNull().default("Asia/Jakarta"),
	dateFormat: text("date_format").notNull().default("DD/MM/YYYY"),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// ---------------------------------------------------------------------------
// Site content (phase: "everything editable from the CMS") — the tables below
// replace copy that used to be hardcoded in views/constants. Seed data lives
// in the generating migration (same strategy as resume_entries above).

export const pageKeyEnum = pgEnum("page_key", [
	"home",
	"about",
	"services",
	"hire-me",
	"offers",
	"blog",
	"projects",
	"contact",
	"not-found",
	"default",
]);

export const processScope = pgEnum("process_scope", ["services", "hire-me"]);

export const availabilityStatus = pgEnum("availability_status", [
	"available",
	"limited",
	"booked",
]);

// Singleton (id is always 'site', upserted like user_settings) — global
// identity/SEO/contact/footer values plus the request-form dropdown options
// that used to be duplicated across services-view and hire-me-view.
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
	social: jsonb("social")
		.$type<{ github: string; twitter: string; linkedin: string }>()
		.notNull(),
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
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// One typed jsonb blob per page (hero copy, section headers, per-page meta,
// CTA variant). The shape per key is `PageCopyMap[page]` — enforced by
// TS/Zod in the service layer, not by SQL.
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
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// One row per service, rendered on / (longDescription), /services and
// /hire-me's expertise tab (description) — unifies the three arrays that used
// to drift apart in those views.
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
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const pricingTiers = pgTable("pricing_tiers", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull(),
	priceLabel: text("price_label").notNull(),
	description: text("description").notNull(),
	features: text("features")
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
	isPopular: boolean("is_popular").notNull().default(false),
	ctaLabel: text("cta_label").notNull().default("Get Started"),
	sortOrder: integer("sort_order").notNull().default(0),
	isPublished: boolean("is_published").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
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
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// /services and /hire-me show different step sets — `scope` picks the set.
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
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// Deliberately unseeded — the /hire-me section stays hidden until a real
// testimonial is published (drafts by default, unlike the other lists).
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
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
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
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// The /offers catalog (IDR fixed-price packages). Icons are lucide names
// resolved through src/lib/icon-registry.ts.
export const offers = pgTable("offers", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	slug: text("slug").notNull().unique(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	icon: text("icon").notNull(),
	price: integer("price").notNull(),
	forWho: text("for_who").notNull().default(""),
	extras: text("extras")
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
	isPopular: boolean("is_popular").notNull().default(false),
	color: text("color"),
	sortOrder: integer("sort_order").notNull().default(0),
	isPublished: boolean("is_published").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

// Long-form MDX pages (privacy-policy, terms-of-service) rendered through the
// same pipeline as blog content; updatedAt doubles as the public
// "Last updated" date.
export const sitePages = pgTable("site_pages", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	slug: text("slug").notNull().unique(),
	title: text("title").notNull(),
	content: text("content").notNull(),
	isPublished: boolean("is_published").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type BlogRow = typeof blogs.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type ResumeEntryRow = typeof resumeEntries.$inferSelect;
export type ContactRow = typeof contacts.$inferSelect;
export type ServiceRequestRow = typeof serviceRequests.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type SiteSettingsRow = typeof siteSettings.$inferSelect;
export type PageCopyRow = typeof pageCopy.$inferSelect;
export type SkillRow = typeof skills.$inferSelect;
export type ServiceRow = typeof services.$inferSelect;
export type PricingTierRow = typeof pricingTiers.$inferSelect;
export type FaqRow = typeof faqs.$inferSelect;
export type ProcessStepRow = typeof processSteps.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type AvailabilitySlotRow = typeof availabilitySlots.$inferSelect;
export type OfferRow = typeof offers.$inferSelect;
export type SitePageRow = typeof sitePages.$inferSelect;
