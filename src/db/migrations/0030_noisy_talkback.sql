ALTER TABLE "contacts" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "inquiry_messages" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "job_outreach_messages" ADD COLUMN "attachments" jsonb;