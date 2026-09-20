DO $$ BEGIN
    CREATE TYPE "public"."project_prospect_status" AS ENUM('sourced', 'audited', 'building_mvp', 'pitch_ready', 'outreach_sent', 'negotiation', 'won', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "frontend_mastery_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"pillar" text NOT NULL,
	"topic_title" text NOT NULL,
	"mastery_status" text DEFAULT 'not_started' NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"best_score" integer DEFAULT 0,
	"last_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "frontend_mastery_progress_topic_id_unique" UNIQUE("topic_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "frontend_mastery_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"pillar" text NOT NULL,
	"topic_id" text NOT NULL,
	"topic_title" text NOT NULL,
	"difficulty" text DEFAULT 'senior' NOT NULL,
	"question_prompt" text NOT NULL,
	"starter_code" text,
	"hints" jsonb,
	"user_submission" text,
	"evaluation_result" jsonb,
	"score" integer,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_prospects" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"company_logo" text,
	"company_website" text NOT NULL,
	"industry" text DEFAULT 'home_living' NOT NULL,
	"country" text DEFAULT 'Netherlands' NOT NULL,
	"city" text,
	"timezone" text DEFAULT 'Europe/Amsterdam' NOT NULL,
	"status" "project_prospect_status" DEFAULT 'sourced' NOT NULL,
	"estimated_revenue_tier" text,
	"audit_score" integer,
	"audit_analysis" jsonb,
	"mvp_demo_url" text,
	"loom_video_url" text,
	"pitch_script" text,
	"contact_name" text,
	"contact_role" text,
	"contact_email" text,
	"contact_linkedin" text,
	"outreach_status" text,
	"outreach_sent_at" timestamp with time zone,
	"follow_up_due_date" timestamp with time zone,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "company_intelligence" jsonb;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "inbound_reachout" jsonb;