"use server";

import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import type {
  AiEnglishVocabulary,
  TargetLevel,
  FluencyCategory,
  ExtractedVocab,
  VocabExample,
} from "./types";
import { cleanJsonText, revalidateEnglishHubs } from "./helpers";

const { aiEnglishVocabularies, aiEnglishStreaks } = schema;

/**
 * Fetches saved vocabulary bank with optional filtering.
 */
export async function getEnglishVocabularies(
  status?: string,
  category?: string,
  search?: string
): Promise<AiEnglishVocabulary[]> {
  await assertAdmin();
  const db = getDb();

  const conditions = [];

  if (status && status !== "all") {
    conditions.push(eq(aiEnglishVocabularies.masteryStatus, status as "learning" | "mastered"));
  }

  if (category && category !== "all") {
    conditions.push(eq(aiEnglishVocabularies.category, category));
  }

  if (search) {
    conditions.push(
      or(
        ilike(aiEnglishVocabularies.phrase, `%${search}%`),
        ilike(aiEnglishVocabularies.meaning, `%${search}%`),
        ilike(aiEnglishVocabularies.techContextExample, `%${search}%`)
      )
    );
  }

  const query = db
    .select()
    .from(aiEnglishVocabularies)
    .orderBy(desc(aiEnglishVocabularies.createdAt));

  const rows =
    conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : or(...conditions))
      : await query;

  return rows as AiEnglishVocabulary[];
}

/**
 * Toggles a vocabulary item between 'learning' and 'mastered'.
 */
export async function toggleVocabMastery(
  id: string,
  newStatus: "learning" | "mastered"
): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db
    .update(aiEnglishVocabularies)
    .set({
      masteryStatus: newStatus,
      timesPracticed: sql`${aiEnglishVocabularies.timesPracticed} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(aiEnglishVocabularies.id, id));

  // Sync mastered count in streak tracker
  const [vocabCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiEnglishVocabularies)
    .where(eq(aiEnglishVocabularies.masteryStatus, "mastered"));

  await db
    .update(aiEnglishStreaks)
    .set({
      masteredVocabCount: Number(vocabCount?.count || 0),
      updatedAt: new Date(),
    })
    .where(eq(aiEnglishStreaks.userId, "wisman-primary"));

  revalidateEnglishHubs();
}

/**
 * Deletes a vocabulary item from the bank.
 */
export async function deleteVocab(id: string): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db.delete(aiEnglishVocabularies).where(eq(aiEnglishVocabularies.id, id));
  revalidateEnglishHubs();
}

/**
 * Generates quick vocabulary cards for on-demand study using Gemini AI.
 */
export async function generateQuickVocabularies(
  topic: string,
  targetLevel: TargetLevel = "A1-A2"
): Promise<AiEnglishVocabulary[]> {
  await assertAdmin();
  const db = getDb();
  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  const prompt = `Generate 5 high-impact English technical words, idioms, or workplace phrases for a non-native software engineer.
Topic: "${topic}"
Target Level: "${targetLevel}"

Guidelines:
- Provide terms that native senior/staff engineers frequently use in meetings, code reviews, design docs, or standups.
- For level A1-A2, choose useful, high-frequency phrases with clear explanations in Indonesian.
- For level B1-B2, include professional idioms and nuanced architectural terms.

Return a JSON array conforming strictly to:
[
  {
    "phrase": "string",
    "phonetic": "string",
    "meaning": "string (clear Indonesian explanation)",
    "category": "technical" | "workplace_idiom" | "collaboration" | "leadership",
    "targetLevel": "${targetLevel}",
    "techContextExample": "string (practical sentence in work context)",
    "casualVsStaff": "string (e.g. 'Instead of: ..., Say: ...')"
  }
]`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.6,
    },
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error("No response from Gemini AI.");
  }

  const items = JSON.parse(cleanJsonText(responseText)) as ExtractedVocab[];
  const inserted: AiEnglishVocabulary[] = [];

  for (const item of items) {
    const [existing] = await db
      .select()
      .from(aiEnglishVocabularies)
      .where(ilike(aiEnglishVocabularies.phrase, item.phrase.trim()))
      .limit(1);

    if (!existing) {
      const [newRow] = await db
        .insert(aiEnglishVocabularies)
        .values({
          phrase: item.phrase.trim(),
          phonetic: item.phonetic || null,
          meaning: item.meaning,
          category: item.category || "technical",
          targetLevel,
          techContextExample: item.techContextExample,
          casualVsStaff: item.casualVsStaff || null,
          masteryStatus: "learning",
        })
        .returning();
      if (newRow) inserted.push(newRow as AiEnglishVocabulary);
    }
  }

  revalidateEnglishHubs();
  return inserted;
}

/**
 * Adds a custom vocabulary manually.
 */
export async function saveCustomVocab(data: {
  phrase: string;
  phonetic?: string;
  meaning: string;
  category?: FluencyCategory;
  targetLevel?: TargetLevel;
  techContextExample: string;
  casualVsStaff?: string;
}): Promise<AiEnglishVocabulary> {
  await assertAdmin();
  const db = getDb();

  const [row] = await db
    .insert(aiEnglishVocabularies)
    .values({
      phrase: data.phrase.trim(),
      phonetic: data.phonetic || null,
      meaning: data.meaning,
      category: data.category || "technical",
      targetLevel: data.targetLevel || "A1-A2",
      techContextExample: data.techContextExample,
      casualVsStaff: data.casualVsStaff || null,
      masteryStatus: "learning",
    })
    .returning();

  revalidateEnglishHubs();
  return row as AiEnglishVocabulary;
}

/**
 * Generates an additional, distinct engineering workplace example for a vocabulary phrase.
 * Appends it to the examples array so the user can carousel/slide through multiple real scenarios.
 */
export async function regenerateVocabExample(
  vocabId: string
): Promise<{ success: boolean; examples: VocabExample[] }> {
  await assertAdmin();
  const db = getDb();

  const [vocab] = await db
    .select()
    .from(aiEnglishVocabularies)
    .where(eq(aiEnglishVocabularies.id, vocabId))
    .limit(1);

  if (!vocab) {
    throw new Error("Vocabulary not found.");
  }

  // Seed existing examples if empty
  const existingExamples: VocabExample[] =
    (vocab.examples as VocabExample[] | null) && (vocab.examples as VocabExample[]).length > 0
      ? (vocab.examples as VocabExample[])
      : [
          {
            workplaceExample: vocab.techContextExample,
            casualVsStaff: vocab.casualVsStaff || undefined,
            scenarioContext: "Workplace Example",
          },
        ];

  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  const prompt = `You are an elite Senior Staff Engineer and English Language Coach.
The non-native engineer is mastering this technical phrase or workplace idiom:
- Phrase: "${vocab.phrase}"
- Meaning: "${vocab.meaning}"
- Category: "${vocab.category}"
- Target Level: "${vocab.targetLevel}"

Existing examples already learned:
${existingExamples
  .map((ex, i) => `${i + 1}. [${ex.scenarioContext || "Context"}]: "${ex.workplaceExample}"`)
  .join("\n")}

Task:
Generate 1 BRAND NEW, DISTINCT practical engineering workplace example.
Requirements:
1. Scenario context must be DIFFERENT from existing ones (e.g. choose from: "System Architecture RFC", "PR Code Review", "Incident War Room", "Sprint Retro", "Cross-Functional Persuasion", "Standup Blocker", "Design Doc Review", "Technical 1-on-1").
2. The sentence should clearly demonstrate high-signal, natural native Staff Engineer phrasing.
3. Provide a 'casualVsStaff' comparison showing how an informal or basic phrase is elevated.

Return a JSON object conforming strictly to this format:
{
  "scenarioContext": "string (e.g. 'PR Code Review', 'Incident Triage', 'Architecture RFC')",
  "workplaceExample": "string (A realistic sentence used by a Senior/Staff Engineer demonstrating natural usage of '${vocab.phrase}')",
  "casualVsStaff": "string (e.g. 'Instead of: ..., Say: ...')"
}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.75,
    },
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error("Failed to generate example from Gemini AI.");
  }

  const newExample = JSON.parse(cleanJsonText(responseText)) as VocabExample;
  const updatedExamples = [...existingExamples, newExample];

  await db
    .update(aiEnglishVocabularies)
    .set({
      examples: updatedExamples,
      updatedAt: new Date(),
    })
    .where(eq(aiEnglishVocabularies.id, vocabId));

  revalidateEnglishHubs();

  return {
    success: true,
    examples: updatedExamples,
  };
}
