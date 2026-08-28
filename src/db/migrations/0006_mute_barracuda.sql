CREATE TYPE "public"."inquiry_type" AS ENUM('contact', 'service_request');--> statement-breakpoint
CREATE TYPE "public"."message_sender_type" AS ENUM('admin', 'client');--> statement-breakpoint
CREATE TABLE "inquiry_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"inquiry_id" text NOT NULL,
	"inquiry_type" "inquiry_type" NOT NULL,
	"sender_type" "message_sender_type" NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
