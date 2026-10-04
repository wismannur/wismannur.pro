"use server";

import { revalidatePath } from "next/cache";
import { and, arrayContains, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { countRows, descNullsLast } from "@/db/sort";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { invalidateKnowledgeCache } from "../ai-chat/knowledge-context";
import type { ProjectRow } from "@/db/schema";
import type {
  DraftProjectResult,
  DraftProjectWithSecondBrainParams,
  NewProject,
  Project,
  SyncProjectToSecondBrainParams,
  TProjectResponse,
  UpdateProject,
} from "./types";

const { projects, aiKnowledgeItems } = schema;
const DEFAULT_PAGE_SIZE = 9;

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 300 * (i + 1)));
    }
  }
  return fn();
}

function revalidateProjectPaths(...slugs: Array<string | null | undefined>) {
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/projects/${slug}`);
  }
  revalidatePath("/sitemap.xml");
}

const toProject = (row: ProjectRow): Project => ({
  ...row,
  demoUrl: row.demoUrl ?? undefined,
  repoUrl: row.repoUrl ?? undefined,
  authorId: row.authorId ?? undefined,
  authorName: row.authorName ?? undefined,
});

export async function getAll(): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(descNullsLast(projects.publishedDate));
    return rows.map(toProject);
  });
}

export async function getPaginated(_lastVisible?: unknown) {
  return withRetry(async () => {
    const db = getDb();
    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(eq(projects.isPublished, true))
        .orderBy(descNullsLast(projects.publishedDate))
        .limit(DEFAULT_PAGE_SIZE),
      db.select({ count: countRows }).from(projects).where(eq(projects.isPublished, true)),
    ]);
    return { projects: rows.map(toProject), lastDoc: null, hasMore: count > DEFAULT_PAGE_SIZE };
  });
}

export async function getFeatured(count = 3): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(desc(projects.views))
      .limit(count);
    return rows.map(toProject);
  });
}

export async function getLatest(count = 3): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(descNullsLast(projects.publishedDate))
      .limit(count);
    return rows.map(toProject);
  });
}

export async function getBySlug(slug: string): Promise<TProjectResponse | null> {
  return withRetry(async () => {
    const [row] = await getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublished, true)))
      .limit(1);
    return row ? toProject(row) : null;
  });
}

export async function getById(id: string): Promise<TProjectResponse | null> {
  return withRetry(async () => {
    const [row] = await getDb().select().from(projects).where(eq(projects.id, id)).limit(1);
    return row ? toProject(row) : null;
  });
}

export async function getByAuthor(authorId: string): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.isPublished, true), eq(projects.authorId, authorId)))
      .orderBy(descNullsLast(projects.publishedDate));
    return rows.map(toProject);
  });
}

export async function incrementView(id: string): Promise<void> {
  try {
    await getDb()
      .update(projects)
      .set({ views: sql`${projects.views} + 1` })
      .where(eq(projects.id, id));
  } catch (err) {
    console.warn("Silent failure incrementing view:", err);
  }
}

export async function incrementLike(id: string): Promise<void> {
  try {
    await getDb()
      .update(projects)
      .set({ likes: sql`${projects.likes} + 1` })
      .where(eq(projects.id, id));
  } catch (err) {
    console.warn("Silent failure incrementing like:", err);
  }
}

export async function create(project: NewProject): Promise<string> {
  await assertAdmin();
  const [{ id }] = await getDb()
    .insert(projects)
    .values({
      ...project,
      views: 0,
      likes: 0,
      publishedDate: project.isPublished ? (project.publishedDate ?? new Date()) : null,
    })
    .returning({ id: projects.id });
  revalidateProjectPaths(project.slug);
  return id;
}

export async function update(id: string, project: UpdateProject): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const existing = await getById(id);
  if (!existing) return;
  await db
    .update(projects)
    .set({
      ...project,
      updatedAt: new Date(),
      ...(project.isPublished && !existing.publishedDate ? { publishedDate: new Date() } : {}),
    })
    .where(eq(projects.id, id));
  revalidateProjectPaths(existing.slug, project.slug);
}

export async function deleteProject(id: string): Promise<void> {
  await assertAdmin();
  const [deleted] = await getDb()
    .delete(projects)
    .where(eq(projects.id, id))
    .returning({ slug: projects.slug });
  revalidateProjectPaths(deleted?.slug);
}

export async function searchByTechnology(technology: string): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(
        and(eq(projects.isPublished, true), arrayContains(projects.technologies, [technology]))
      )
      .orderBy(descNullsLast(projects.publishedDate));
    return rows.map(toProject);
  });
}

export async function getFeaturedProjects(): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.isPublished, true), eq(projects.isFeatured, true)))
      .orderBy(descNullsLast(projects.publishedDate));
    return rows.map(toProject);
  });
}

export async function getByPage(
  page: number,
  pageSize: number,
  filters?: { searchTerm?: string; technology?: string }
): Promise<{ projects: Project[]; totalPages: number; currentPage: number }> {
  return withRetry(async () => {
    const conditions = [eq(projects.isPublished, true), eq(projects.isFeatured, false)];
    if (filters?.technology) {
      conditions.push(arrayContains(projects.technologies, [filters.technology]));
    }
    if (filters?.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      conditions.push(
        or(
          ilike(projects.title, term),
          ilike(projects.summary, term),
          ilike(projects.description, term)
        )!
      );
    }

    const db = getDb();
    const where = and(...conditions);
    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(where)
        .orderBy(descNullsLast(projects.publishedDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: countRows }).from(projects).where(where),
    ]);
    return {
      projects: rows.map(toProject),
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
      currentPage: page,
    };
  });
}

export async function getAllTechnologies(): Promise<string[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select({ technologies: projects.technologies })
      .from(projects)
      .where(eq(projects.isPublished, true));
    return Array.from(new Set(rows.flatMap((r) => r.technologies))).sort();
  });
}

export async function getAllForCms(): Promise<Project[]> {
  await assertAdmin();
  return withRetry(async () => {
    const rows = await getDb().select().from(projects).orderBy(desc(projects.createdAt));
    return rows.map(toProject);
  });
}

/**
 * Drafts an in-depth engineering project case study in MDX format
 * grounded in My Second Brain knowledge items using Gemini AI.
 */
export async function draftProjectCaseStudyWithSecondBrain(
  params: DraftProjectWithSecondBrainParams
): Promise<DraftProjectResult> {
  await assertAdmin();

  const db = getDb();
  const knowledgeRows = await db
    .select({
      id: aiKnowledgeItems.id,
      category: aiKnowledgeItems.category,
      title: aiKnowledgeItems.title,
      content: aiKnowledgeItems.content,
      tags: aiKnowledgeItems.tags,
    })
    .from(aiKnowledgeItems)
    .where(eq(aiKnowledgeItems.isPublished, true))
    .orderBy(asc(aiKnowledgeItems.sortOrder));

  const knowledgeContext =
    knowledgeRows.length > 0
      ? knowledgeRows
          .map(
            (k) =>
              `• [${k.category.toUpperCase()}] ${k.title}:\n  ${k.content}${
                k.tags && k.tags.length ? `\n  Tags: ${k.tags.join(", ")}` : ""
              }`
          )
          .join("\n\n")
      : "No Second Brain documents available.";

  const ai = getGeminiClient();
  const model = getGeminiModel();

  const prompt = `You are the personal AI clone (Digital Twin) of Wisman, an elite full-stack engineer and distributed systems architect.
Your task is to draft an industry-standard, deeply engaging engineering case study in MDX format for Wisman's portfolio.

Target Project Context:
- Project Title / Focus: ${params.projectTitle?.trim() || "A high-impact distributed web platform or AI engineering showcase"}
- Technologies / Stacks: ${params.technologies?.trim() || "Modern TypeScript, Next.js, Cloud, Databases"}
- Existing Draft Summary: ${params.existingSummary?.trim() || "None"}
- Existing Draft Description / Notes:
"""
${params.existingDescription?.trim() || "Synthesize an authentic case study based on Wisman's verified Second Brain achievements, architecture decisions, and metrics."}
"""

Wisman's Verified Second Brain (Authentic Architecture Decisions, Metrics, Incident Case Studies & Voice):
"""
${knowledgeContext}
"""

CASE STUDY WRITING & STRUCTURE GUIDELINES (MDX):
1. Ground the architecture, trade-offs, and metrics strictly in Wisman's Second Brain or project context. Never hallucinate fake enterprise names.
2. Structure the description into a rich MDX case study:
   - ## Executive Overview & Problem Statement (The business/technical challenge, scale, constraints)
   - ## System Architecture & Technical Decisions (Trade-offs made, architectural patterns, data flow)
   - ## Key Technical Implementations & Code Highlights (Explain key technical algorithms or pipeline design)
   - ## Complex Engineering Challenges Solved (STAR format: Situation, Task, Action, Result)
   - ## Quantifiable Impact & Production Metrics (Google XYZ format: Accomplished X measured by Y doing Z)
3. Summary: 1-2 concise, punchy sentences explaining what the project is and its primary accomplishment.
4. Technologies: A clean comma-separated list of 4-8 primary technologies (e.g. "Next.js, TypeScript, PostgreSQL, Drizzle ORM, Tailwind CSS, Redis").

Return a JSON object conforming strictly to this format:
{
  "title": "string (Project Title)",
  "summary": "string (Executive summary)",
  "technologies": "string (Comma-separated list)",
  "description": "string (Full rich MDX case study)",
  "matchedSecondBrainTopics": ["string (titles of Second Brain items referenced)"]
}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Failed to generate project case study from Gemini AI.");
  }

  let clean = responseText.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("Failed to parse Gemini project draft JSON:", responseText, err);
    throw new Error("Failed to parse drafted project case study response.");
  }
}

/**
 * Syncs a project case study and architecture decisions to My Second Brain
 * as a new active knowledge item (category: case-studies).
 */
export async function syncProjectToSecondBrain(
  params: SyncProjectToSecondBrainParams
): Promise<string> {
  await assertAdmin();

  const db = getDb();
  const category = params.category || "case-studies";
  const title = `${params.title} — Architecture & Project Case Study`;
  const tags =
    params.technologies && params.technologies.length > 0
      ? ["project", "case-study", ...params.technologies.map((t) => t.toLowerCase().trim())]
      : ["project", "case-study", "architecture"];

  const content = `${params.summary}\n\nCase Study Highlights:\n${params.description.slice(0, 1500)}${params.description.length > 1500 ? "\n..." : ""}`;

  const [{ id }] = await db
    .insert(aiKnowledgeItems)
    .values({
      category,
      title,
      content,
      tags,
      isPublished: true,
      sortOrder: 0,
    })
    .returning({ id: aiKnowledgeItems.id });

  revalidatePath("/cms/ai-knowledge");
  invalidateKnowledgeCache();
  return id;
}

