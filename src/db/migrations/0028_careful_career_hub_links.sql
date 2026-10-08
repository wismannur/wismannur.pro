ALTER TABLE "frontend_mastery_sessions" ADD COLUMN IF NOT EXISTS "job_application_id" text REFERENCES "job_applications"("id") ON DELETE set null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "frontend_mastery_sessions_job_app_id_idx" ON "frontend_mastery_sessions" ("job_application_id");--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "career_weekly_target" integer DEFAULT 5 NOT NULL;
