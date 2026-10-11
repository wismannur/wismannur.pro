import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { CompanyIntelligence, InboundReachout } from "@/services/job-tracker/types";
import type { ProjectAuditAnalysis } from "@/services/project-finder/types";
import { generateEntityId } from "@/lib/id-generator";
import { messageSenderType } from "./inquiry";

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
  "ashby",
  "greenhouse",
  "lever",
  "arbeitnow",
  "remoteok",
  "remotive",
  "jobicy",
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

export const projectProspectStatus = pgEnum("project_prospect_status", [
  "sourced",
  "audited",
  "building_mvp",
  "pitch_ready",
  "outreach_sent",
  "negotiation",
  "won",
  "archived",
]);

export const outreachType = pgEnum("outreach_type", ["direct_apply", "cold_pitch", "follow_up"]);

export const outreachStatus = pgEnum("outreach_status", [
  "draft",
  "sent",
  "follow_up_due",
  "replied",
  "converted",
  "closed",
]);

export const jobApplications = pgTable(
  "job_applications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateEntityId("job")),
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
    companyIntelligence: jsonb("company_intelligence").$type<CompanyIntelligence>(),
    inboundReachout: jsonb("inbound_reachout").$type<InboundReachout>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("job_applications_status_idx").on(table.status),
    index("job_applications_created_at_idx").on(table.createdAt),
    index("job_applications_company_name_idx").on(table.companyName),
  ]
);

export const jobInterviews = pgTable(
  "job_interviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateEntityId("interview")),
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
  },
  (table) => [
    index("job_interviews_application_id_idx").on(table.applicationId),
    index("job_interviews_status_idx").on(table.status),
    index("job_interviews_scheduled_at_idx").on(table.scheduledAt),
  ]
);

export const jobOutreaches = pgTable(
  "job_outreaches",
  {
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
  },
  (table) => [
    index("job_outreaches_job_app_id_idx").on(table.jobApplicationId),
    index("job_outreaches_status_idx").on(table.status),
    index("job_outreaches_follow_up_idx").on(table.followUpDueDate),
    index("job_outreaches_created_at_idx").on(table.createdAt),
  ]
);

export const jobOutreachMessages = pgTable(
  "job_outreach_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateEntityId("outmsg")),
    outreachId: text("outreach_id")
      .notNull()
      .references(() => jobOutreaches.id, { onDelete: "cascade" }),
    senderType: messageSenderType("sender_type").notNull(),
    senderName: text("sender_name").notNull(),
    senderEmail: text("sender_email").notNull(),
    message: text("message").notNull(),
    messageId: text("message_id"),
    rawHtml: text("raw_html"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("job_outreach_messages_outreach_id_idx").on(table.outreachId),
    index("job_outreach_messages_created_at_idx").on(table.createdAt),
  ]
);

export const atsTargetCompanies = pgTable(
  "ats_target_companies",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    platform: text("platform").notNull(),
    slug: text("slug").notNull(),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("ats_target_companies_platform_idx").on(table.platform),
    index("ats_target_companies_is_active_idx").on(table.isActive),
  ]
);

export const projectProspects = pgTable("project_prospects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateEntityId("prospect")),
  companyName: text("company_name").notNull(),
  companyLogo: text("company_logo"),
  companyWebsite: text("company_website").notNull(),
  industry: text("industry").notNull().default("home_living"),
  country: text("country").notNull().default("Netherlands"),
  city: text("city"),
  timezone: text("timezone").notNull().default("Europe/Amsterdam"),
  status: projectProspectStatus("status").notNull().default("sourced"),
  estimatedRevenueTier: text("estimated_revenue_tier"),
  auditScore: integer("audit_score"),
  auditAnalysis: jsonb("audit_analysis").$type<ProjectAuditAnalysis>(),
  mvpDemoUrl: text("mvp_demo_url"),
  loomVideoUrl: text("loom_video_url"),
  pitchScript: text("pitch_script"),
  contactName: text("contact_name"),
  contactRole: text("contact_role"),
  contactEmail: text("contact_email"),
  contactLinkedin: text("contact_linkedin"),
  outreachStatus: text("outreach_status"),
  outreachSentAt: timestamp("outreach_sent_at", { withTimezone: true }),
  followUpDueDate: timestamp("follow_up_due_date", { withTimezone: true }),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type JobApplicationRow = typeof jobApplications.$inferSelect;
export type JobInterviewRow = typeof jobInterviews.$inferSelect;
export type JobOutreachRow = typeof jobOutreaches.$inferSelect;
export type JobOutreachMessageRow = typeof jobOutreachMessages.$inferSelect;
export type AtsTargetCompanyRow = typeof atsTargetCompanies.$inferSelect;
export type ProjectProspectRow = typeof projectProspects.$inferSelect;
