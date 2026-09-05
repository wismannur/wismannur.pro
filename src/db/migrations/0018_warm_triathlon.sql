DROP TABLE "offers" CASCADE;--> statement-breakpoint
DROP TABLE "pricing_tiers" CASCADE;--> statement-breakpoint
ALTER TABLE "page_copy" ALTER COLUMN "page" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."page_key";--> statement-breakpoint
CREATE TYPE "public"."page_key" AS ENUM('home', 'about', 'services', 'hire-me', 'blog', 'projects', 'contact', 'not-found', 'default');--> statement-breakpoint
ALTER TABLE "page_copy" ALTER COLUMN "page" SET DATA TYPE "public"."page_key" USING "page"::"public"."page_key";