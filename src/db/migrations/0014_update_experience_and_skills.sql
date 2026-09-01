-- Update About page copy with 7+ Years
UPDATE "page_copy"
SET "content" = jsonb_set(
  jsonb_set(
    "content",
    '{hero,statPills}',
    '[{"icon":"calendar","label":"7+ Years Experience","variant":"primary"},{"icon":"check-circle","label":"Available for Hire","variant":"success"}]'::jsonb
  ),
  '{hero,paragraphs}',
  '["__I''m **Wisman** Nur__, a Senior Full-Stack and AI Systems Engineer with over 7 years of professional experience architecting resilient web applications, serverless databases, and autonomous AI agents.","My engineering approach unites strict type safety, scalable cloud backends, and responsive user interfaces. I bridge complex backend systems and LLM workflows with polished client applications.","When architecting systems, I prioritize deterministic reliability, sub-second latency, and clean code that teams can confidently maintain and scale."]'::jsonb
)
WHERE "page" = 'about';--> statement-breakpoint

-- Re-populate curated skills list
DELETE FROM "skills";--> statement-breakpoint
INSERT INTO "skills" ("id", "name", "sort_order") VALUES
	('skill-1', 'Next.js 16 (App Router)', 1),
	('skill-2', 'React 19', 2),
	('skill-3', 'TypeScript (Strict)', 3),
	('skill-4', 'Tailwind CSS', 4),
	('skill-5', 'Autonomous AI Agents', 5),
	('skill-6', 'Model Context Protocol (MCP)', 6),
	('skill-7', 'Gemini & Claude APIs', 7),
	('skill-8', 'Tool Calling & Agentic Loops', 8),
	('skill-9', 'PostgreSQL', 9),
	('skill-10', 'Drizzle ORM', 10),
	('skill-11', 'Neon Serverless', 11),
	('skill-12', 'TanStack Query', 12),
	('skill-13', 'Zustand State Management', 13),
	('skill-14', 'Framer Motion', 14),
	('skill-15', 'REST & RPC APIs', 15),
	('skill-16', 'Docker & Containerization', 16),
	('skill-17', 'Google Cloud Platform (GCP)', 17),
	('skill-18', 'Vercel Edge Platform', 18),
	('skill-19', 'GitHub Actions CI/CD', 19),
	('skill-20', 'System Architecture & CWV', 20);
