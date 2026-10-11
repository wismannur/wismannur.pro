ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "raw_html" text;--> statement-breakpoint
ALTER TABLE "frontend_mastery_sessions" ADD COLUMN IF NOT EXISTS "job_application_id" text;--> statement-breakpoint
ALTER TABLE "inquiry_messages" ADD COLUMN IF NOT EXISTS "raw_html" text;--> statement-breakpoint
ALTER TABLE "job_outreach_messages" ADD COLUMN IF NOT EXISTS "raw_html" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "career_weekly_target" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "frontend_mastery_sessions" ADD CONSTRAINT "frontend_mastery_sessions_job_application_id_job_applications_id_fk" FOREIGN KEY ("job_application_id") REFERENCES "public"."job_applications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "frontend_mastery_sessions_job_app_id_idx" ON "frontend_mastery_sessions" USING btree ("job_application_id");