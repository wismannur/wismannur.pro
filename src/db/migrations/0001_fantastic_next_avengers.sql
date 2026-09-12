CREATE TYPE "public"."resume_kind" AS ENUM('experience', 'education');--> statement-breakpoint
CREATE TABLE "resume_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "resume_kind" NOT NULL,
	"title" text NOT NULL,
	"organization" text NOT NULL,
	"location" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_current" boolean DEFAULT false NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
-- Data seed: placeholder resume entries so a fresh database renders a working
-- /about page out of the box. All values are fictional sample content — replace
-- them with your own via the CMS (Resume section) after logging in.
INSERT INTO "resume_entries" ("id", "kind", "title", "organization", "location", "start_date", "end_date", "description") VALUES
	('resume-exp-1', 'experience', 'Senior Frontend Engineer', 'Acme Corporation', 'Jakarta, Indonesia.', '2021-05-01', '2024-09-01', ''),
	('resume-exp-2', 'experience', 'Frontend Developer', 'Globex Labs', 'Jakarta, Indonesia.', '2019-06-01', '2021-09-01', ''),
	('resume-exp-3', 'experience', 'Frontend Developer', 'Initech Solutions', 'Bandung, Indonesia.', '2018-11-01', '2019-05-01', ''),
	('resume-exp-4', 'experience', 'Jr. Frontend Developer', 'Umbrella Studio', 'Jakarta, Indonesia.', '2018-02-01', '2018-09-01', ''),
	('resume-edu-1', 'education', 'Responsive Web Design', 'Online Learning Platform', NULL, '2021-01-01', '2021-12-01', ''),
	('resume-edu-2', 'education', 'FullStack Developer Academy', 'Coding Bootcamp', NULL, '2017-01-01', '2018-12-01', 'Intensive FullStack Developer BootCamp for 3 Months.'),
	('resume-edu-3', 'education', 'Computer Science', 'State Vocational High School', NULL, '2014-01-01', '2017-12-01', '');
