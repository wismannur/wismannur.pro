import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { generateEntityId } from "@/lib/id-generator";

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

export const messageSenderType = pgEnum("message_sender_type", ["admin", "client"]);

export const inquiryType = pgEnum("inquiry_type", ["contact", "service_request", "hire_request"]);

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
  rawHtml: text("raw_html"),
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
  rawHtml: text("raw_html"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ContactRow = typeof contacts.$inferSelect;
export type ServiceRequestRow = typeof serviceRequests.$inferSelect;
export type HireRequestRow = typeof hireRequests.$inferSelect;
export type InquiryMessageRow = typeof inquiryMessages.$inferSelect;
