DELETE FROM "services" WHERE "slug" IN ('frontend', 'ui-ux', 'performance', 'api', 'animation', 'leadership');--> statement-breakpoint
INSERT INTO "services" ("id", "slug", "title", "description", "long_description", "icon", "price_label", "features", "sort_order", "show_on_home", "show_on_hire_me", "is_published") VALUES
	('service-full-cycle-web', 'full-cycle-web', 'Full-Cycle Web & SaaS Engineering',
		'Architecting end-to-end production web applications from relational database design to responsive frontend deployment.',
		'From concept to production launch, I build scalable, type-safe web applications and SaaS platforms. Combining robust serverless PostgreSQL architectures with responsive, high-fidelity interfaces using Next.js 16 and React 19.',
		'layers', 'Project-Based',
		ARRAY['End-to-end architecture (DB to UI)','Strict TypeScript & Drizzle ORM','Next.js 16 App Router & React 19','Scalable REST & RPC API design'], 1, true, true, true),
	('service-ai-agentic', 'ai-agentic', 'Autonomous AI Agents & Workflows',
		'Building custom AI agents, MCP tool integrations, structured reasoning loops, and LLM automation pipelines.',
		'Empower your products with agentic capabilities. I design and implement reliable AI workflows, custom Model Context Protocol (MCP) servers, tool calling pipelines, and intelligent automations that solve real operational bottlenecks.',
		'bot', 'Custom Scope',
		ARRAY['Model Context Protocol (MCP) tools','Multi-step tool calling & agent loops','Structured LLM outputs & schemas','Gemini & Claude enterprise APIs'], 2, true, true, true),
	('service-architecture-advisory', 'architecture-advisory', 'Performance & Architecture Advisory',
		'Deep-dive system audits, database query optimization, Core Web Vitals remediation, and technical direction.',
		'Ensure your digital infrastructure scales effortlessly. I conduct comprehensive code reviews, optimize edge caching and bundle sizes, and provide strategic technical guidance to eliminate performance bottlenecks.',
		'zap', 'Advisory / Retainer',
		ARRAY['Sub-second P95 latency & CWV audit','Database query & indexing optimization','CI/CD automation & edge deployment','Codebase modernization & review'], 3, true, true, true)
ON CONFLICT ("slug") DO UPDATE SET
	"title" = EXCLUDED."title",
	"description" = EXCLUDED."description",
	"long_description" = EXCLUDED."long_description",
	"icon" = EXCLUDED."icon",
	"price_label" = EXCLUDED."price_label",
	"features" = EXCLUDED."features",
	"sort_order" = EXCLUDED."sort_order",
	"show_on_home" = EXCLUDED."show_on_home",
	"show_on_hire_me" = EXCLUDED."show_on_hire_me",
	"is_published" = EXCLUDED."is_published",
	"updated_at" = NOW();
