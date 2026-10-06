"use server";

import { revalidatePath } from "next/cache";

import { asc, desc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { invalidateKnowledgeCache } from "../ai-chat/knowledge-context";
import type { ResumeEntryRow } from "@/db/schema";
import type {
  NewResumeEntry,
  PolishResumeParams,
  PolishResumeResult,
  ResumeEntry,
  ResumeSections,
  SyncToSecondBrainParams,
  UpdateResumeEntry,
} from "./types";

// Server actions backing `resumeService` — the work experience and education
// timelines on /about. Admin-only actions (create/update/delete/getAllForCms)
// are gated by assertAdmin(); server actions are public POST endpoints otherwise.

const { resumeEntries, aiKnowledgeItems } = schema;

// /about renders on the server, so every mutation has to invalidate it or the
// edit only shows up after a redeploy.
function revalidateResumePaths() {
  revalidatePath("/about");
  revalidatePath("/cv");
}

// Optional⇄nullable mapping: the contract has `location?: string`, `employmentType?: string`, `locationType?: string`.
const toResumeEntry = (row: ResumeEntryRow): ResumeEntry => ({
  ...row,
  location: row.location ?? undefined,
  employmentType: row.employmentType ?? undefined,
  locationType: row.locationType ?? undefined,
  endDate: row.endDate ?? undefined,
});

// Newest first, with `sortOrder` as the manual override — everything at the
// default 0 means pure reverse-chronological order.
const displayOrder = [desc(resumeEntries.sortOrder), desc(resumeEntries.startDate)];

export async function getPublished(): Promise<ResumeSections> {
  const rows = await getDb()
    .select()
    .from(resumeEntries)
    .where(eq(resumeEntries.isPublished, true))
    .orderBy(...displayOrder);

  const entries = rows.map(toResumeEntry);
  return {
    experiences: entries.filter((entry) => entry.kind === "experience"),
    education: entries.filter((entry) => entry.kind === "education"),
  };
}

export async function getById(id: string): Promise<ResumeEntry | null> {
  await assertAdmin();
  const [row] = await getDb().select().from(resumeEntries).where(eq(resumeEntries.id, id)).limit(1);
  return row ? toResumeEntry(row) : null;
}

export async function create(entry: NewResumeEntry): Promise<string> {
  await assertAdmin();
  const [{ id }] = await getDb()
    .insert(resumeEntries)
    .values({
      ...entry,
      endDate: entry.isCurrent ? null : (entry.endDate ?? null),
      employmentType: entry.employmentType || null,
      locationType: entry.locationType || null,
    })
    .returning({ id: resumeEntries.id });
  revalidateResumePaths();
  return id;
}

export async function update(id: string, entry: UpdateResumeEntry): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(resumeEntries)
    .set({
      ...entry,
      updatedAt: new Date(),
      // An ongoing role has no end date, whatever the form last held.
      ...(entry.isCurrent ? { endDate: null } : {}),
      ...(entry.employmentType !== undefined ? { employmentType: entry.employmentType || null } : {}),
      ...(entry.locationType !== undefined ? { locationType: entry.locationType || null } : {}),
    })
    .where(eq(resumeEntries.id, id));
  revalidateResumePaths();
}

export async function deleteResumeEntry(id: string): Promise<void> {
  await assertAdmin();
  await getDb().delete(resumeEntries).where(eq(resumeEntries.id, id));
  revalidateResumePaths();
}

// CMS helper — drafts included, grouped by kind then display order.
export async function getAllForCms(): Promise<ResumeEntry[]> {
  await assertAdmin();
  const rows = await getDb()
    .select()
    .from(resumeEntries)
    .orderBy(asc(resumeEntries.kind), ...displayOrder);
  return rows.map(toResumeEntry);
}

/**
 * Uses Gemini AI grounded in My Second Brain knowledge to polish and upgrade
 * a work experience description using the Google XYZ formula and quantifiable impact.
 */
export async function polishResumeExperienceWithSecondBrain(
  params: PolishResumeParams
): Promise<PolishResumeResult> {
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

  const prompt = `You are a Staff Technical Recruiter and Engineering Career Architect specializing in high-level engineering talent and international executive resumes.
Your task is to polish and upgrade the candidate's work experience description for their master portfolio resume.

Target Role & Experience:
- Title / Role: ${params.title}
- Organization / Company: ${params.organization}
- Location: ${params.location || "Not specified"}
- Work Type: ${params.employmentType || "Not specified"}
- Workplace Mode: ${params.locationType || "Not specified"}
- Period: ${params.period || "Not specified"}

Current Draft Description:
"""
${params.currentDescription?.trim() || "No draft description provided. Synthesize an authentic, high-impact description based on the role and verified Second Brain knowledge."}
"""

Candidate's Verified Second Brain (Real Metrics, Architecture Principles, Incident Case Studies & Engineering Achievements):
"""
${knowledgeContext}
"""

CRITICAL ANTI-HALLUCINATION & AUTHENTICITY GUARDRAILS:
1. Ground all achievements, metrics, and architecture principles strictly in the candidate's Second Brain or current draft.
2. Synthesize real accomplishments, metrics, tech stacks, and architecture principles from the candidate's Second Brain that align with this specific role (${params.title} at ${params.organization}).
3. Do NOT fabricate unrelated company names, wild revenue claims, or technologies absent from the candidate's profile.
4. Formulate 3 to 5 high-impact bullet points using Google's XYZ formula:
   "Accomplished [X] as measured by [Y], by doing [Z]"
5. Each bullet point should be concise, executive-ready, and start with an action verb (e.g. "Architected", "Engineered", "Optimized", "Scaled", "Spearheaded").
6. Format the output with clear bullet points (using standard "- " prefix) separated by newlines.

Return a JSON object conforming strictly to this format:
{
  "polishedDescription": "string (multiline bullet points starting with - )",
  "highlights": ["string (key achievement highlights)"],
  "matchedSecondBrainTopics": ["string (titles or categories of Second Brain items that were referenced)"]
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
    throw new Error("Failed to generate polished resume description from Gemini AI.");
  }

  let clean = responseText.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("Failed to parse Gemini resume polish JSON:", responseText, err);
    throw new Error("Failed to parse polished resume response.");
  }
}

/**
 * Saves or exports a role's accomplishments directly into My Second Brain
 * as a new active knowledge item for cross-ecosystem generation.
 */
export async function syncResumeExperienceToSecondBrain(
  params: SyncToSecondBrainParams
): Promise<string> {
  await assertAdmin();

  const db = getDb();
  const category = params.category || "career-impact";
  const title = `${params.title} at ${params.organization} — Career Impact & Accomplishments`;
  const tags =
    params.tags && params.tags.length > 0
      ? params.tags
      : [
          "resume",
          "career-impact",
          params.organization.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        ];

  const [{ id }] = await db
    .insert(aiKnowledgeItems)
    .values({
      category,
      title,
      content: params.description,
      tags,
      isPublished: true,
      sortOrder: 0,
    })
    .returning({ id: aiKnowledgeItems.id });

  revalidatePath("/cms/ai-knowledge");
  invalidateKnowledgeCache();
  return id;
}
