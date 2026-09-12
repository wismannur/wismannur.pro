CREATE TABLE "ai_english_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"target_level" text DEFAULT 'A1-A2' NOT NULL,
	"topic_title" text NOT NULL,
	"topic_category" text DEFAULT 'technical' NOT NULL,
	"knowledge_item_id" text,
	"knowledge_snippet" text,
	"scenario_prompt" text NOT NULL,
	"sentence_starters" text[] DEFAULT '{}'::text[] NOT NULL,
	"sample_model_answer" text,
	"user_speech_transcript" text,
	"user_audio_url" text,
	"fluency_score" integer,
	"grammar_score" integer,
	"vocabulary_score" integer,
	"overall_score" integer,
	"feedback_summary" text,
	"better_alternative" text,
	"pronunciation_tips" text,
	"grammar_corrections" jsonb,
	"extracted_vocabularies" jsonb,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_english_streaks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text DEFAULT 'wisman-primary' NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"total_speaking_minutes" integer DEFAULT 0 NOT NULL,
	"mastered_vocab_count" integer DEFAULT 0 NOT NULL,
	"last_activity_date" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_english_vocabularies" (
	"id" text PRIMARY KEY NOT NULL,
	"phrase" text NOT NULL,
	"phonetic" text,
	"meaning" text NOT NULL,
	"category" text DEFAULT 'technical' NOT NULL,
	"target_level" text DEFAULT 'A1-A2' NOT NULL,
	"tech_context_example" text NOT NULL,
	"casual_vs_staff" text,
	"mastery_status" text DEFAULT 'learning' NOT NULL,
	"times_practiced" integer DEFAULT 0 NOT NULL,
	"source_session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_english_sessions" ADD CONSTRAINT "ai_english_sessions_knowledge_item_id_ai_knowledge_items_id_fk" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."ai_knowledge_items"("id") ON DELETE set null ON UPDATE no action;