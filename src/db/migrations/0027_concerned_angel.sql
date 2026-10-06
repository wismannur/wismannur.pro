ALTER TABLE "resume_entries" ADD COLUMN IF NOT EXISTS "employment_type" text;--> statement-breakpoint
ALTER TABLE "resume_entries" ADD COLUMN IF NOT EXISTS "location_type" text;