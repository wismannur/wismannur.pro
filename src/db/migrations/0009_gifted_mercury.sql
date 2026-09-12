ALTER TABLE "contacts" ADD COLUMN "message_id" text;--> statement-breakpoint
ALTER TABLE "hire_requests" ADD COLUMN "message_id" text;--> statement-breakpoint
ALTER TABLE "inquiry_messages" ADD COLUMN "message_id" text;--> statement-breakpoint
ALTER TABLE "job_outreach_messages" ADD COLUMN "message_id" text;--> statement-breakpoint
ALTER TABLE "job_outreaches" ADD COLUMN "initial_message_id" text;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "message_id" text;