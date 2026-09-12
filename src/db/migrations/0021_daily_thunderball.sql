CREATE TABLE "cms_copilot_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"tool_calls" jsonb,
	"tool_results" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_copilot_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'New Session' NOT NULL,
	"current_path" text,
	"last_message" text,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cms_copilot_messages" ADD CONSTRAINT "cms_copilot_messages_session_id_cms_copilot_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cms_copilot_sessions"("id") ON DELETE cascade ON UPDATE no action;