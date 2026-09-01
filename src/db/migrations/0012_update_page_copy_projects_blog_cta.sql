UPDATE "page_copy"
SET "content" = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                "content",
                '{sections,projects,title}',
                '"Featured Case Studies"'
              ),
              '{sections,projects,subtitle}',
              '"Selected Works"'
            ),
            '{sections,projects,description}',
            '"Real-world web architectures, AI workflows, and products delivered with measurable impact."'
          ),
          '{sections,blog,title}',
          '"Technical Notes & Architecture"'
        ),
        '{sections,blog,subtitle}',
        '"Engineering Blog"'
      ),
      '{sections,blog,description}',
      '"Insights on Next.js 16, agentic AI systems, PostgreSQL performance, and modern frontend patterns."'
    ),
    '{cta,title}',
    '"Have an ambitious project or engineering challenge?"'
  ),
  '{cta,description}',
  '"From architecture design to production rollout, let''s build scalable web applications and intelligent AI systems that drive measurable results."'
)
WHERE "page" = 'home';
