CREATE TYPE "public"."hire_request_status" AS ENUM('new', 'reviewed', 'interviewing', 'offered', 'rejected', 'archived');--> statement-breakpoint
ALTER TYPE "public"."inquiry_type" ADD VALUE 'hire_request';--> statement-breakpoint
CREATE TABLE "hire_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"role_title" text NOT NULL,
	"employment_type" text DEFAULT 'full_time' NOT NULL,
	"workplace_type" text DEFAULT 'remote' NOT NULL,
	"location" text,
	"salary_range" text,
	"message" text NOT NULL,
	"status" "hire_request_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
