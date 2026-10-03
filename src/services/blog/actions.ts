"use server";

import { revalidatePath } from "next/cache";
import { asc, desc, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { countRows, descNullsLast } from "@/db/sort";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { invalidateKnowledgeCache } from "../ai-chat/knowledge-context";
import type {
  Blog,
  DraftBlogResult,
  DraftBlogWithSecondBrainParams,
  NewBlog,
  SyncBlogToSecondBrainParams,
  UpdateBlog,
} from "./types";

const { blogs, aiKnowledgeItems } = schema;

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

function revalidateBlogPaths(...slugs: Array<string | null | undefined>) {
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/blog/${slug}`);
  }
  revalidatePath("/sitemap.xml");
}

export async function getByPage(
  page: number,
  pageSize: number
): Promise<{ blogs: Blog[]; totalPages: number; currentPage: number }> {
  return withRetry(async () => {
    const db = getDb();
    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(blogs)
        .where(eq(blogs.isPublished, true))
        .orderBy(descNullsLast(blogs.publishedDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: countRows }).from(blogs).where(eq(blogs.isPublished, true)),
    ]);
    return {
      blogs: rows,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
      currentPage: page,
    };
  });
}

export async function getAll(): Promise<Blog[]> {
  await assertAdmin();
  return withRetry(async () => {
    return getDb().select().from(blogs).orderBy(descNullsLast(blogs.publishedDate));
  });
}

export async function getLatest(count = 3): Promise<Blog[]> {
  return withRetry(async () => {
    return getDb()
      .select()
      .from(blogs)
      .where(eq(blogs.isPublished, true))
      .orderBy(descNullsLast(blogs.publishedDate))
      .limit(count);
  });
}

export async function getBySlug(slug: string): Promise<Blog | null> {
  return withRetry(async () => {
    const rows = await getDb().select().from(blogs).where(eq(blogs.slug, slug)).limit(1);
    return rows[0] ?? null;
  });
}

export async function getById(id: string): Promise<Blog | null> {
  return withRetry(async () => {
    const rows = await getDb().select().from(blogs).where(eq(blogs.id, id)).limit(1);
    return rows[0] ?? null;
  });
}

export async function incrementView(id: string): Promise<void> {
  try {
    await getDb()
      .update(blogs)
      .set({ views: sql`${blogs.views} + 1` })
      .where(eq(blogs.id, id));
  } catch (err) {
    console.warn("Silent failure incrementing view:", err);
  }
}

export async function incrementLike(id: string): Promise<void> {
  try {
    await getDb()
      .update(blogs)
      .set({ likes: sql`${blogs.likes} + 1` })
      .where(eq(blogs.id, id));
  } catch (err) {
    console.warn("Silent failure incrementing like:", err);
  }
}

export async function create(blog: NewBlog): Promise<string> {
  await assertAdmin();
  const [{ id }] = await getDb()
    .insert(blogs)
    .values({
      ...blog,
      views: 0,
      likes: 0,
      publishedDate: blog.isPublished ? (blog.publishedDate ?? new Date()) : null,
    })
    .returning({ id: blogs.id });
  revalidateBlogPaths(blog.slug);
  return id;
}

export async function update(id: string, blog: UpdateBlog): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const existing = await getById(id);
  if (!existing) return;
  await db
    .update(blogs)
    .set({
      ...blog,
      updatedAt: new Date(),
      ...(blog.isPublished && !existing.publishedDate ? { publishedDate: new Date() } : {}),
    })
    .where(eq(blogs.id, id));
  revalidateBlogPaths(existing.slug, blog.slug);
}

export async function deleteBlog(id: string): Promise<void> {
  await assertAdmin();
  const [deleted] = await getDb()
    .delete(blogs)
    .where(eq(blogs.id, id))
    .returning({ slug: blogs.slug });
  revalidateBlogPaths(deleted?.slug);
}

export async function getAllForCms(): Promise<Blog[]> {
  await assertAdmin();
  return withRetry(async () => {
    return getDb().select().from(blogs).orderBy(desc(blogs.createdAt));
  });
}

export async function getAllTags(): Promise<string[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select({ tags: blogs.tags })
      .from(blogs)
      .where(eq(blogs.isPublished, true));
    return Array.from(new Set(rows.flatMap((r) => r.tags))).sort();
  });
}

/**
 * Drafts a comprehensive technical blog article in MDX format
 * grounded in My Second Brain knowledge items using Gemini AI.
 */
export async function draftBlogWithSecondBrain(
  params: DraftBlogWithSecondBrainParams
): Promise<DraftBlogResult> {
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

  // Filter if specific category requested
  const filteredRows =
    params.categoryFilter && params.categoryFilter !== "all"
      ? knowledgeRows.filter((k) => k.category === params.categoryFilter)
      : knowledgeRows;

  const knowledgeContext =
    filteredRows.length > 0
      ? filteredRows
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

  const prompt = `You are the personal AI clone (Digital Twin) of Wisman, an experienced Staff / Lead Software Engineer, architect, and technical writer.
Your role is to author an authoritative, deep-dive technical engineering article formatted in clean MDX for Wisman's personal tech blog.

Target Topic or Direction:
${params.topicPrompt?.trim() || params.existingTitle?.trim() || "A modern software engineering architecture or technical decision deep dive based on your authentic expertise."}

${params.existingTitle ? `Existing Working Title: "${params.existingTitle}"` : ""}

Wisman's Verified Second Brain (Authentic Opinions, Architecture Decisions, Production Incidents & Voice):
"""
${knowledgeContext}
"""

WRITING & FORMATTING GUIDELINES:
1. Ground the core philosophies, architectural patterns, and engineering opinions directly in Wisman's Second Brain entries. Never fabricate irrelevant details.
2. Tone: Pragmatic, authoritative, lucid, senior engineering leader voice (not generic boilerplate or buzzword soup).
3. Format the content in clean MDX:
   - Engaging introduction highlighting real production pain points or trade-offs.
   - Deep architectural breakdown with code snippets (\`\`\`typescript, \`\`\`tsx, or \`\`\`go), or ASCII/Mermaid diagrams where helpful.
   - Concrete lessons learned, benchmarks, or trade-off evaluation.
   - Actionable conclusion summarizing key takeaways.
4. Summary: 1-2 punchy, executive sentences (under 250 characters).
5. Tags: 3-5 comma-separated tags (e.g. "Next.js, System Architecture, Distributed Systems, Performance").

Return a JSON object conforming strictly to this structure:
{
  "title": "string (Compelling engineering title)",
  "summary": "string (Crisp executive summary)",
  "tags": "string (Comma-separated tags)",
  "content": "string (Full MDX content article)",
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
    throw new Error("Failed to generate blog article draft from Gemini AI.");
  }

  let clean = responseText.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("Failed to parse Gemini blog draft JSON:", responseText, err);
    throw new Error("Failed to parse drafted blog article response.");
  }
}

/**
 * Syncs a blog article's key insights and takeaways to My Second Brain
 * as a new active knowledge item (category: tech-opinions).
 */
export async function syncBlogToSecondBrain(
  params: SyncBlogToSecondBrainParams
): Promise<string> {
  await assertAdmin();

  const db = getDb();
  const category = params.category || "tech-opinions";
  const title = `${params.title} — Technical Synthesis & Opinion`;
  const tags =
    params.tags && params.tags.length > 0
      ? params.tags
      : ["blog", "tech-opinion", "engineering-insights"];

  const content = `${params.summary}\n\nCore Discussion & Insights:\n${params.content.slice(0, 1500)}${params.content.length > 1500 ? "\n..." : ""}`;

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

