UPDATE "page_copy"
SET "content" = jsonb_set(
  jsonb_set(
    jsonb_set(
      "content",
      '{sections,services,title}',
      '"Solutions & Specialized Engineering"'
    ),
    '{sections,services,subtitle}',
    '"What I Do"'
  ),
  '{sections,services,description}',
  '"High-impact web architectures and autonomous AI systems engineered for speed, scalability, and measurable business outcomes."'
)
WHERE "page" = 'home';
