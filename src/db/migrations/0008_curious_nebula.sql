CREATE TYPE "public"."outreach_status" AS ENUM('draft', 'sent', 'follow_up_due', 'replied', 'converted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."outreach_type" AS ENUM('direct_apply', 'cold_pitch', 'follow_up');--> statement-breakpoint
CREATE TABLE "job_outreach_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"outreach_id" text NOT NULL,
	"sender_type" "message_sender_type" NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_outreaches" (
	"id" text PRIMARY KEY NOT NULL,
	"job_application_id" text,
	"company_name" text NOT NULL,
	"company_website" text,
	"job_title" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_role" text,
	"contact_email" text NOT NULL,
	"contact_linkedin" text,
	"outreach_type" "outreach_type" DEFAULT 'cold_pitch' NOT NULL,
	"status" "outreach_status" DEFAULT 'draft' NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"notes" text,
	"attachments" jsonb,
	"sent_at" timestamp with time zone,
	"follow_up_due_date" timestamp with time zone,
	"last_replied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_outreach_messages" ADD CONSTRAINT "job_outreach_messages_outreach_id_job_outreaches_id_fk" FOREIGN KEY ("outreach_id") REFERENCES "public"."job_outreaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_outreaches" ADD CONSTRAINT "job_outreaches_job_application_id_job_applications_id_fk" FOREIGN KEY ("job_application_id") REFERENCES "public"."job_applications"("id") ON DELETE set null ON UPDATE no action;