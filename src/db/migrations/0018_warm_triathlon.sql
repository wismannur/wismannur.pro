DROP TABLE IF EXISTS "offers" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "pricing_tiers" CASCADE;--> statement-breakpoint
ALTER TABLE "page_copy" ALTER COLUMN "page" SET DATA TYPE text;--> statement-breakpoint
DELETE FROM "page_copy" WHERE "page" = 'offers';--> statement-breakpoint
DROP TYPE IF EXISTS "public"."page_key" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."page_key" AS ENUM('home', 'about', 'services', 'hire-me', 'blog', 'projects', 'contact', 'not-found', 'default');--> statement-breakpoint
ALTER TABLE "page_copy" ALTER COLUMN "page" SET DATA TYPE "public"."page_key" USING "page"::"public"."page_key";