import type { TailoredBullet, TailoredProjectHighlight } from "@/services/job-tracker/types";

export const DEFAULT_FLAGSHIP_PROJECT: TailoredProjectHighlight = {
  title: "wismannur.pro — Autonomous AI Fullstack Platform & Digital Twin",
  technologies: [
    "Next.js 16",
    "React 19",
    "TypeScript",
    "PostgreSQL (Neon)",
    "Drizzle ORM",
    "Gemini 2.5 Flash",
    "Tailwind CSS",
  ],
  description:
    "Autonomous digital twin and engineering operating system featuring AI agentic Copilot, multi-model LLM tool orchestration, and real-time CMS automation.",
  bullets: [
    "Architected 33 relational PostgreSQL schemas with Drizzle ORM and Neon serverless driver, implementing strict domain separation, transactions, and automated schema migrations.",
    "Engineered autonomous AI Staff Copilot engine integrated with Model Context Protocol (MCP) and 110+ deterministic tools, utilizing Gemini 2.5 structured output and Zod runtime validation.",
    "Optimized frontend performance with Next.js 16 App Router, React 19 Server Components, and zero-CLS streaming layouts, achieving 98+ Lighthouse scores and sub-second LCP.",
  ],
  relevanceRationale:
    "Demonstrates end-to-end Senior Staff system architecture, AI agent tooling, and production-grade fullstack engineering.",
};

export function initializeTailoredProjects(
  existingProjects?: TailoredProjectHighlight[],
  employerNames: string[] = []
): TailoredProjectHighlight[] {
  const employersLower = employerNames.map((e) => e.toLowerCase().trim()).filter(Boolean);

  const filtered = (existingProjects || []).filter((proj) => {
    const titleLower = proj.title.toLowerCase();
    return !employersLower.some((emp) => emp.length > 2 && titleLower.includes(emp));
  });

  if (filtered.length === 0) {
    return [DEFAULT_FLAGSHIP_PROJECT];
  }

  return filtered.map((proj) => {
    let bullets = proj.bullets;
    if (!bullets || bullets.length === 0) {
      if (proj.title.toLowerCase().includes("wismannur.pro")) {
        bullets = DEFAULT_FLAGSHIP_PROJECT.bullets;
      } else if (proj.description) {
        bullets = proj.description.includes("\n")
          ? proj.description
              .split("\n")
              .map((s) => s.trim().replace(/^[•\-\*]\s*/, ""))
              .filter(Boolean)
          : [proj.description];
      } else {
        bullets = [];
      }
    }
    return {
      ...proj,
      bullets,
    };
  });
}

export function splitDescriptionToBullets(description?: string): string[] {
  if (!description) return [];
  const rawItems = description.includes("\n") ? description.split("\n") : description.split(". ");
  return rawItems
    .map((item) => item.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
    .map((item) => (item.endsWith(".") || item.includes(":") ? item : `${item}.`));
}

export function getTailoredBulletsForExperience(
  exp: { id: string; title: string; organization: string },
  tailoredBullets?: TailoredBullet[]
): TailoredBullet[] {
  if (!tailoredBullets || tailoredBullets.length === 0) return [];

  // 1. Direct ID match
  const byId = tailoredBullets.filter((b) => b.experienceId && b.experienceId === exp.id);
  if (byId.length > 0) return byId;

  // 2. Fuzzy match by roleContext vs organization/title
  const orgLower = exp.organization.toLowerCase();
  const titleLower = exp.title.toLowerCase();

  return tailoredBullets.filter((b) => {
    if (!b.roleContext) return false;
    const ctx = b.roleContext.toLowerCase();
    return ctx.includes(orgLower) || orgLower.includes(ctx) || ctx.includes(titleLower);
  });
}

export function getUnmatchedTailoredBullets(
  experiences: { id: string; title: string; organization: string }[],
  tailoredBullets?: TailoredBullet[]
): TailoredBullet[] {
  if (!tailoredBullets || tailoredBullets.length === 0) return [];
  return tailoredBullets.filter((b) => {
    return !experiences.some((exp) => {
      if (b.experienceId && b.experienceId === exp.id) return true;
      if (!b.roleContext) return false;
      const orgLower = exp.organization.toLowerCase();
      const titleLower = exp.title.toLowerCase();
      const ctx = b.roleContext.toLowerCase();
      return ctx.includes(orgLower) || orgLower.includes(ctx) || ctx.includes(titleLower);
    });
  });
}
