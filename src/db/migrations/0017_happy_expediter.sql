ALTER TABLE "ai_chat_sessions" ALTER COLUMN "title" SET DEFAULT 'New Conversation';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "enable_ai_chat" boolean DEFAULT false NOT NULL;