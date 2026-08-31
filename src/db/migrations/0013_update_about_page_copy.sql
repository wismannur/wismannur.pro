UPDATE "page_copy"
SET "content" = $json$
{
  "meta": {
    "title": "About",
    "description": "Learn more about Wisman Nur, a Senior Full-Stack & AI Systems Engineer specializing in Next.js 16, React 19, autonomous AI workflows, and resilient cloud architectures."
  },
  "hero": {
    "badge": "ABOUT ME",
    "photoUrl": "/placeholder.svg",
    "photoBadge": "Senior Full-Stack & AI Engineer",
    "statPills": [
      {"icon": "calendar", "label": "5+ Years Experience", "variant": "primary"},
      {"icon": "check-circle", "label": "Available for Hire", "variant": "success"}
    ],
    "title": "Senior Full-Stack **&** AI Systems Engineer",
    "paragraphs": [
      "__I'm **Wisman** Nur__, a Senior Full-Stack and AI Systems Engineer with over 5 years of experience architecting resilient web applications, serverless databases, and autonomous AI agents.",
      "My engineering approach unites strict type safety, scalable cloud backends, and responsive user interfaces. I bridge complex backend systems and LLM workflows with polished client applications.",
      "When architecting systems, I prioritize deterministic reliability, sub-second latency, and clean code that teams can confidently maintain and scale."
    ]
  },
  "skillsSection": {
    "title": "Skills & Core Ecosystem",
    "subtitle": "Tech Stack"
  },
  "whySection": {
    "title": "Engineering Values & Principles",
    "subtitle": "How I Build",
    "description": "Delivering production-grade software by combining architectural discipline with modern AI workflows."
  },
  "whyCards": [
    {
      "icon": "layers",
      "title": "Architecture-First Engineering",
      "description": "Building resilient foundations from database schemas to client state, ensuring long-term maintainability and effortless scalability."
    },
    {
      "icon": "bot",
      "title": "Agentic AI & LLM Systems",
      "description": "Integrating autonomous workflows, custom Model Context Protocol (MCP) tools, and structured LLM pipelines into real business products."
    },
    {
      "icon": "zap",
      "title": "Measurable Performance & Latency",
      "description": "Optimizing Core Web Vitals, serverless query execution, and edge caching to deliver sub-second P95 response times."
    }
  ],
  "cta": {
    "title": "Ready to engineer high-impact solutions together?",
    "description": "Whether building a greenfield SaaS product, integrating autonomous AI agents, or optimizing architecture, let's turn complex requirements into production reality.",
    "primaryButtonText": "Start a Project",
    "primaryButtonLink": "/hire-me",
    "secondaryButtonText": "Explore Case Studies",
    "secondaryButtonLink": "/projects",
    "badge": "🚀 Engineering Collaboration"
  }
}
$json$::jsonb
WHERE "page" = 'about';
