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
import { generateEntityId } from "@/lib/id-generator";

// Mirrors the service contracts in `src/services/*/types.ts` 1:1 — those
// interfaces stay the source of truth for what pages/components consume.
// Two deliberate mappings happen in the service layer, not here:
//   - optional fields (`demoUrl?: string`) ⇄ nullable columns (string | null)
//   - fixture-style ids ("blog-1") coexist with generated UUIDs (text pk,
//     app-side crypto.randomUUID() default — same strategy as the mock services)

export const contactStatus = pgEnum("contact_status", ["new", "read", "replied", "archived"]);

export const serviceRequestStatus = pgEnum("service_request_status", [
  "new",
  "in-progress",
  "completed",
  "cancelled",
]);

export const hireRequestStatus = pgEnum("hire_request_status", [
  "new",
  "reviewed",
  "interviewing",
  "offered",
  "rejected",
  "archived",
]);

export const resumeKind = pgEnum("resume_kind", ["experience", "education"]);

export const theme = pgEnum("theme", ["light", "dark", "system"]);

export const colorScheme = pgEnum("color_scheme", ["blue", "purple", "green", "orange", "red"]);

export const jobApplicationStatus = pgEnum("job_application_status", [
  "wishlist",
  "applied",
  "screening",
  "interview_hr",
  "interview_tech",
  "interview_user",
  "offering",
  "accepted",
  "rejected",
  "withdrawn",
  "ghosted",
]);

export const jobPlatform = pgEnum("job_platform", [
  "linkedin",
  "jobstreet",
  "glints",
  "techinasia",
  "indeed",
  "company_website",
  "referral",
  "other",
]);

export const workplaceType = pgEnum("workplace_type", ["remote", "hybrid", "onsite"]);

export const jobEmploymentType = pgEnum("job_employment_type", [
  "full_time",
  "contract",
  "part_time",
  "freelance",
  "internship",
]);

export const interviewStageType = pgEnum("interview_stage_type", [
  "hr_screening",
  "technical_interview",
  "live_coding",
  "take_home_test",
  "user_interview",
  "system_design",
  "final_leadership",
  "offering_discussion",
  "other",
]);

export const interviewStatus = pgEnum("interview_status", [
  "scheduled",
  "completed",
  "passed",
  "failed",
  "cancelled",
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const contacts = pgTable("contacts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateEntityId("contact")),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: contactStatus("status").notNull().default("new"),
  messageId: text("message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceRequests = pgTable("service_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateEntityId("service")),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  serviceType: text("service_type").notNull(),
  budget: text("budget").notNull(),
  timeframe: text("timeframe").notNull(),
  projectDetails: text("project_details").notNull(),
  status: serviceRequestStatus("status").notNull().default("new"),
  messageId: text("message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const hireRequests = pgTable("hire_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateEntityId("hire")),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  roleTitle: text("role_title").notNull(),
  employmentType: text("employment_type").notNull().default("full_time"),
  workplaceType: text("workplace_type").notNull().default("remote"),
  location: text("location"),
  salaryRange: text("salary_range"),
  message: text("message").notNull(),
  status: hireRequestStatus("status").notNull().default("new"),
  messageId: text("message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
  "blog",
  "projects",
  "contact",
  "not-found",
  "default",
]);

export const processScope = pgEnum("process_scope", ["services", "hire-me"]);

export const availabilityStatus = pgEnum("availability_status", ["available", "limited", "booked"]);

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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const jobApplications = pgTable("job_applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  companyName: text("company_name").notNull(),
  companyLogo: text("company_logo"),
  companyWebsite: text("company_website"),
  jobTitle: text("job_title").notNull(),
  jobUrl: text("job_url"),
  platform: jobPlatform("platform").notNull().default("linkedin"),
  location: text("location"),
  workplaceType: workplaceType("workplace_type").notNull().default("remote"),
  jobType: jobEmploymentType("job_type").notNull().default("full_time"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").notNull().default("IDR"),
  salaryPeriod: text("salary_period").notNull().default("monthly"),
  jobDescriptionRaw: text("job_description_raw"),
  requirements: text("requirements")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  status: jobApplicationStatus("status").notNull().default("wishlist"),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  atsScore: integer("ats_score"),
  atsAnalysis: jsonb("ats_analysis"),
  tailoredSummary: text("tailored_summary"),
  tailoredBulletPoints: jsonb("tailored_bullet_points"),
  coverLetter: text("cover_letter"),
  notes: text("notes"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const jobInterviews = pgTable("job_interviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  applicationId: text("application_id")
    .notNull()
    .references(() => jobApplications.id, { onDelete: "cascade" }),
  stageType: interviewStageType("stage_type").notNull().default("hr_screening"),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  interviewers: text("interviewers"),
  meetingLink: text("meeting_link"),
  rawInvitation: text("raw_invitation"),
  aiSummary: text("ai_summary"),
  aiPredictedQuestions: jsonb("ai_predicted_questions"),
  notes: text("notes"),
  feedback: text("feedback"),
  status: interviewStatus("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const messageSenderType = pgEnum("message_sender_type", ["admin", "client"]);

export const inquiryType = pgEnum("inquiry_type", ["contact", "service_request", "hire_request"]);

export const outreachType = pgEnum("outreach_type", ["direct_apply", "cold_pitch", "follow_up"]);

export const outreachStatus = pgEnum("outreach_status", [
  "draft",
  "sent",
  "follow_up_due",
  "replied",
  "converted",
  "closed",
]);

export const jobOutreaches = pgTable("job_outreaches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateEntityId("outreach")),
  jobApplicationId: text("job_application_id").references(() => jobApplications.id, {
    onDelete: "set null",
  }),
  companyName: text("company_name").notNull(),
  companyWebsite: text("company_website"),
  jobTitle: text("job_title").notNull(),
  contactName: text("contact_name").notNull(),
  contactRole: text("contact_role"),
  contactEmail: text("contact_email").notNull(),
  contactLinkedin: text("contact_linkedin"),
  outreachType: outreachType("outreach_type").notNull().default("cold_pitch"),
  status: outreachStatus("status").notNull().default("draft"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  notes: text("notes"),
  attachments: jsonb("attachments"),
  initialMessageId: text("initial_message_id"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  followUpDueDate: timestamp("follow_up_due_date", { withTimezone: true }),
  lastRepliedAt: timestamp("last_replied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const jobOutreachMessages = pgTable("job_outreach_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  outreachId: text("outreach_id")
    .notNull()
    .references(() => jobOutreaches.id, { onDelete: "cascade" }),
  senderType: messageSenderType("sender_type").notNull(),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  message: text("message").notNull(),
  messageId: text("message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inquiryMessages = pgTable("inquiry_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  inquiryId: text("inquiry_id").notNull(),
  inquiryType: inquiryType("inquiry_type").notNull(),
  senderType: messageSenderType("sender_type").notNull(),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  message: text("message").notNull(),
  messageId: text("message_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiKnowledgeItems = pgTable("ai_knowledge_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull().default("general"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  visitorId: text("visitor_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  title: text("title").notNull().default("New Conversation"),
  messageCount: integer("message_count").notNull().default(0),
  lastMessage: text("last_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const aiChatMessages = pgTable("ai_chat_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => aiChatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  toolCallName: text("tool_call_name"),
  toolCallArgs: jsonb("tool_call_args"),
  toolCallResult: jsonb("tool_call_result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BlogRow = typeof blogs.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type ResumeEntryRow = typeof resumeEntries.$inferSelect;
export type ContactRow = typeof contacts.$inferSelect;
export type ServiceRequestRow = typeof serviceRequests.$inferSelect;
export type HireRequestRow = typeof hireRequests.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type SiteSettingsRow = typeof siteSettings.$inferSelect;
export type PageCopyRow = typeof pageCopy.$inferSelect;
export type SkillRow = typeof skills.$inferSelect;
export type ServiceRow = typeof services.$inferSelect;
export type FaqRow = typeof faqs.$inferSelect;
export type ProcessStepRow = typeof processSteps.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type AvailabilitySlotRow = typeof availabilitySlots.$inferSelect;
export type SitePageRow = typeof sitePages.$inferSelect;
export type JobApplicationRow = typeof jobApplications.$inferSelect;
export type JobInterviewRow = typeof jobInterviews.$inferSelect;
export type InquiryMessageRow = typeof inquiryMessages.$inferSelect;
export type JobOutreachRow = typeof jobOutreaches.$inferSelect;
export type JobOutreachMessageRow = typeof jobOutreachMessages.$inferSelect;
export type AiKnowledgeItemRow = typeof aiKnowledgeItems.$inferSelect;
export type AiChatSessionRow = typeof aiChatSessions.$inferSelect;
export type AiChatMessageRow = typeof aiChatMessages.$inferSelect;
