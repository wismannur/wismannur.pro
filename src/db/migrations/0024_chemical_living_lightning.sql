CREATE TABLE "ai_english_curriculum_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'wisman-primary' NOT NULL,
	"track_level" text NOT NULL,
	"unit_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"quiz_score" integer,
	"spoken_transcript" text,
	"spoken_score" integer,
	"staff_upgrade_feedback" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
