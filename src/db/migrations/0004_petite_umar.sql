CREATE TYPE "public"."interview_stage_type" AS ENUM('hr_screening', 'technical_interview', 'live_coding', 'take_home_test', 'user_interview', 'system_design', 'final_leadership', 'offering_discussion', 'other');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('scheduled', 'completed', 'passed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_application_status" AS ENUM('wishlist', 'applied', 'screening', 'interview_hr', 'interview_tech', 'interview_user', 'offering', 'accepted', 'rejected', 'withdrawn', 'ghosted');--> statement-breakpoint
CREATE TYPE "public"."job_employment_type" AS ENUM('full_time', 'contract', 'part_time', 'freelance', 'internship');--> statement-breakpoint
CREATE TYPE "public"."job_platform" AS ENUM('linkedin', 'jobstreet', 'glints', 'techinasia', 'indeed', 'company_website', 'referral', 'other');--> statement-breakpoint
CREATE TYPE "public"."workplace_type" AS ENUM('remote', 'hybrid', 'onsite');--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"company_logo" text,
	"company_website" text,
	"job_title" text NOT NULL,
	"job_url" text,
	"platform" "job_platform" DEFAULT 'linkedin' NOT NULL,
	"location" text,
	"workplace_type" "workplace_type" DEFAULT 'remote' NOT NULL,
	"job_type" "job_employment_type" DEFAULT 'full_time' NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" text DEFAULT 'IDR' NOT NULL,
	"salary_period" text DEFAULT 'monthly' NOT NULL,
	"job_description_raw" text,
	"requirements" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "job_application_status" DEFAULT 'wishlist' NOT NULL,
	"applied_at" timestamp with time zone,
	"ats_score" integer,
	"ats_analysis" jsonb,
	"tailored_summary" text,
	"tailored_bullet_points" jsonb,
	"cover_letter" text,
	"notes" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"follow_up_date" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_interviews" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"stage_type" "interview_stage_type" DEFAULT 'hr_screening' NOT NULL,
	"title" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"interviewers" text,
	"meeting_link" text,
	"raw_invitation" text,
	"ai_summary" text,
	"ai_predicted_questions" jsonb,
	"notes" text,
	"feedback" text,
	"status" "interview_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_interviews" ADD CONSTRAINT "job_interviews_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;