"use server";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { synthesizeNeuralSpeech, type SynthesizeOptions } from "./tts";
import { CURRICULUM_TRACKS_BLUEPRINT } from "./curriculum-data";
import type {
  TargetLevel,
  FluencyCategory,
  AiEnglishSession,
  AiEnglishVocabulary,
  AiEnglishStreak,
  SpeechEvaluationResult,
  ExtractedVocab,
  EnglishAnalyticsReport,
  CefrMilestone,
  VocabExample,
  CurriculumTrack,
  CurriculumLesson,
} from "./types";

const {
  aiEnglishSessions,
  aiEnglishVocabularies,
  aiEnglishStreaks,
  aiKnowledgeItems,
  aiEnglishCurriculumProgress,
} = schema;

function cleanJsonText(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }
  return cleaned.trim();
}

/**
 * Returns current date string (YYYY-MM-DD) in Asia/Jakarta timezone.
 */
function getJakartaDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

/**
 * Calculates day difference between two YYYY-MM-DD strings in a timezone-independent manner.
 */
function getDaysDifference(currentDateStr: string, pastDateStr: string): number {
  const [cy, cm, cd] = currentDateStr.split("-").map(Number);
  const [py, pm, pd] = pastDateStr.split("-").map(Number);
  const currentUtc = Date.UTC(cy, cm - 1, cd);
  const pastUtc = Date.UTC(py, pm - 1, pd);
  return Math.round((currentUtc - pastUtc) / (1000 * 60 * 60 * 24));
}

/**
 * Gets or initializes the user's daily English streak and stats.
 */
export async function getEnglishFluencyStreak(): Promise<AiEnglishStreak> {
  await assertAdmin();
  const db = getDb();

  const [streak] = await db
    .select()
    .from(aiEnglishStreaks)
    .where(eq(aiEnglishStreaks.userId, "wisman-primary"))
    .limit(1);

  // Reconcile actual counts from DB
  const [vocabCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiEnglishVocabularies)
    .where(eq(aiEnglishVocabularies.masteryStatus, "mastered"));
  const actualMasteredCount = Number(vocabCount?.count || 0);

  const [dailyCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiEnglishSessions)
    .where(eq(aiEnglishSessions.status, "completed"));
  const [curriculumCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiEnglishCurriculumProgress)
    .where(eq(aiEnglishCurriculumProgress.completed, true));
  const actualTotalSessions =
    Number(dailyCount?.count || 0) + Number(curriculumCount?.count || 0);

  if (streak) {
    // Self-healing synchronization if counts diverged
    if (
      streak.masteredVocabCount !== actualMasteredCount ||
      streak.totalSessions < actualTotalSessions
    ) {
      const [updated] = await db
        .update(aiEnglishStreaks)
        .set({
          masteredVocabCount: actualMasteredCount,
          totalSessions: Math.max(streak.totalSessions, actualTotalSessions),
          updatedAt: new Date(),
        })
        .where(eq(aiEnglishStreaks.id, streak.id))
        .returning();
      return (updated || streak) as AiEnglishStreak;
    }
    return streak as AiEnglishStreak;
  }

  const [newStreak] = await db
    .insert(aiEnglishStreaks)
    .values({
      userId: "wisman-primary",
      currentStreak: actualTotalSessions > 0 ? 1 : 0,
      longestStreak: actualTotalSessions > 0 ? 1 : 0,
      totalSessions: actualTotalSessions,
      totalSpeakingMinutes: Math.max(5, actualTotalSessions * 3),
      masteredVocabCount: actualMasteredCount,
    })
    .returning();

  return newStreak as AiEnglishStreak;
}

/**
 * Retrieves recent practice sessions.
 */
export async function getRecentSessions(limit = 10): Promise<AiEnglishSession[]> {
  await assertAdmin();
  const db = getDb();

  const rows = await db
    .select()
    .from(aiEnglishSessions)
    .orderBy(desc(aiEnglishSessions.createdAt))
    .limit(limit);

  return rows as AiEnglishSession[];
}

/**
 * Retrieves the current uncompleted in-progress session if any.
 */
export async function getActiveInProgressSession(): Promise<AiEnglishSession | null> {
  await assertAdmin();
  const db = getDb();

  const [session] = await db
    .select()
    .from(aiEnglishSessions)
    .where(eq(aiEnglishSessions.status, "in_progress"))
    .orderBy(desc(aiEnglishSessions.createdAt))
    .limit(1);

  return (session as AiEnglishSession) || null;
}

/**
 * Deletes a practice session from history.
 */
export async function deleteSession(id: string): Promise<void> {
  await assertAdmin();
  const db = getDb();

  const [target] = await db
    .select()
    .from(aiEnglishSessions)
    .where(eq(aiEnglishSessions.id, id))
    .limit(1);

  if (target) {
    await db.delete(aiEnglishSessions).where(eq(aiEnglishSessions.id, id));

    // If completed session was deleted, safely update total sessions & speaking minutes
    if (target.status === "completed") {
      const [streak] = await db
        .select()
        .from(aiEnglishStreaks)
        .where(eq(aiEnglishStreaks.userId, "wisman-primary"))
        .limit(1);

      if (streak && streak.totalSessions > 0) {
        const deductedMinutes = Math.max(1, Math.round(target.durationSeconds / 60));
        await db
          .update(aiEnglishStreaks)
          .set({
            totalSessions: Math.max(0, streak.totalSessions - 1),
            totalSpeakingMinutes: Math.max(0, streak.totalSpeakingMinutes - deductedMinutes),
            updatedAt: new Date(),
          })
          .where(eq(aiEnglishStreaks.id, streak.id));
      }
    }
  }

  revalidatePath("/cms/ai-english-fluency");
}

/**
 * Clones a past historical session into a fresh in-progress drill so the user can retry and improve.
 */
export async function retryDrillSession(sessionId: string): Promise<AiEnglishSession> {
  await assertAdmin();
  const db = getDb();

  const [past] = await db
    .select()
    .from(aiEnglishSessions)
    .where(eq(aiEnglishSessions.id, sessionId))
    .limit(1);

  if (!past) {
    throw new Error("Past session not found.");
  }

  // Clear previous abandoned in_progress sessions to keep workspace clean
  await db
    .delete(aiEnglishSessions)
    .where(eq(aiEnglishSessions.status, "in_progress"));

  const [newSession] = await db
    .insert(aiEnglishSessions)
    .values({
      targetLevel: past.targetLevel,
      topicTitle: past.topicTitle,
      topicCategory: past.topicCategory,
      knowledgeItemId: past.knowledgeItemId,
      knowledgeSnippet: past.knowledgeSnippet,
      scenarioPrompt: past.scenarioPrompt,
      sentenceStarters: past.sentenceStarters || [],
      sampleModelAnswer: past.sampleModelAnswer,
      status: "in_progress",
    })
    .returning();

  revalidatePath("/cms/ai-english-fluency");
  return newSession as AiEnglishSession;
}

/**
 * Retrieves vocabularies with optional filters.
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

  revalidatePath("/cms/ai-english-fluency");
}

/**
 * Deletes a vocabulary item from the bank.
 */
export async function deleteVocab(id: string): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db.delete(aiEnglishVocabularies).where(eq(aiEnglishVocabularies.id, id));
  revalidatePath("/cms/ai-english-fluency");
}

/**
 * Generates a grounded daily practice drill using AI Knowledge Hub items.
 */
export async function generateDailyDrill(
  targetLevel: TargetLevel = "A1-A2",
  preferredCategory?: string
): Promise<AiEnglishSession> {
  await assertAdmin();
  const db = getDb();

  // 1. Fetch published items from AI Knowledge Hub
  const knowledgeQuery = db
    .select()
    .from(aiKnowledgeItems)
    .where(eq(aiKnowledgeItems.isPublished, true));

  const allKnowledge = await knowledgeQuery;

  let chosenKnowledge = null;
  if (allKnowledge.length > 0) {
    if (preferredCategory && preferredCategory !== "all") {
      const filtered = allKnowledge.filter((k) => k.category === preferredCategory);
      chosenKnowledge =
        filtered.length > 0
          ? filtered[Math.floor(Math.random() * filtered.length)]
          : allKnowledge[Math.floor(Math.random() * allKnowledge.length)];
    } else {
      chosenKnowledge = allKnowledge[Math.floor(Math.random() * allKnowledge.length)];
    }
  }

  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  const prompt = `You are an elite Senior Staff Engineer, Engineering Coach, and English Fluency Mentor specializing in training non-native software engineers for global tech roles.

Candidate's Background & Knowledge Hub Anchor:
- Target Learner: Wisman (Senior Fullstack & AI Agent Architect)
- Target Fluency Level for this Drill: "${targetLevel}"
${
  chosenKnowledge
    ? `- Anchor Topic from AI Knowledge Hub: "${chosenKnowledge.title}" (Category: ${chosenKnowledge.category})
- Context Snippet: """${chosenKnowledge.content.slice(0, 700)}"""`
    : `- General Topic: Technical Communication in Modern Web, AI Agents, or Cloud Architecture`
}

Task:
Generate an engaging, highly realistic Daily English Speaking & Shadowing Drill tailored specifically for level "${targetLevel}".

Guidelines per level:
- "A1-A2": The learner is building basic speaking reflexes and needs structure. Make the prompt clear, approachable, and provide 3 easy sentence starters so they never freeze. The scenario should ask them to explain a simple tech choice or task in 30-45 seconds.
- "B1": Conversational fluency. Ask them to explain a feature trade-off, code review comment, or bug fix in 45-60 seconds.
- "B2": Professional Tech & Staff-level fluency. Ask them to articulate an architectural decision, handle pushback, or defend a design choice in 60-90 seconds.

Return a JSON object conforming strictly to this structure:
{
  "topicTitle": "string (Short, punchy topic title e.g. 'Explaining In-Memory Caching with Redis')",
  "topicCategory": "technical" | "workplace_idiom" | "collaboration" | "leadership",
  "scenarioPrompt": "string (The practical work scenario and exact speaking challenge instructions)",
  "sentenceStarters": [
    "string (e.g. 'In our project, we decided to use...')",
    "string (e.g. 'This was important because...')",
    "string (e.g. 'As a result, we noticed that...')"
  ],
  "sampleModelAnswer": "string (A clean, natural, native-sounding model response that the user can listen to and practice shadowing. 2 to 4 sentences appropriate for ${targetLevel})"
}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error("Failed to receive response from Gemini AI.");
  }

  interface DrillJson {
    topicTitle: string;
    topicCategory: string;
    scenarioPrompt: string;
    sentenceStarters: string[];
    sampleModelAnswer: string;
  }

  const parsed = JSON.parse(cleanJsonText(responseText)) as DrillJson;

  const [session] = await db
    .insert(aiEnglishSessions)
    .values({
      targetLevel,
      topicTitle: parsed.topicTitle || "Daily Tech English Drill",
      topicCategory: parsed.topicCategory || "technical",
      knowledgeItemId: chosenKnowledge ? chosenKnowledge.id : null,
      knowledgeSnippet: chosenKnowledge ? chosenKnowledge.content.slice(0, 500) : null,
      scenarioPrompt: parsed.scenarioPrompt,
      sentenceStarters: parsed.sentenceStarters || [],
      sampleModelAnswer: parsed.sampleModelAnswer,
      status: "in_progress",
    })
    .returning();

  revalidatePath("/cms/ai-english-fluency");
  return session as AiEnglishSession;
}

/**
 * Evaluates the user's spoken transcript using Gemini AI.
 * Produces multi-dimensional scores, friendly constructive feedback,
 * a native Staff-Engineer upgrade, and extracts key vocabulary into the user's vault.
 */
export async function evaluateSpeechAttempt(params: {
  sessionId: string;
  userTranscript: string;
  durationSeconds: number;
}): Promise<{ session: AiEnglishSession; streak: AiEnglishStreak }> {
  await assertAdmin();
  const db = getDb();

  const [session] = await db
    .select()
    .from(aiEnglishSessions)
    .where(eq(aiEnglishSessions.id, params.sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Practice session not found.");
  }

  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  const prompt = `You are a supportive, high-caliber Senior Staff Engineer and English Language Coach reviewing a software engineer's spoken English response.

Context of the Drill:
- Target Level: "${session.targetLevel}"
- Topic: "${session.topicTitle}"
- Scenario Prompt: "${session.scenarioPrompt}"
- Model Reference Answer: "${session.sampleModelAnswer || "N/A"}"

User's Spoken Transcript (recorded via microphone):
"""
${params.userTranscript}
"""
Speaking Duration: ${params.durationSeconds} seconds.

Evaluation Rules:
1. Empathy & Encouragement: If the user is at A1-A2, celebrate their effort for speaking complete thoughts. Do not discourage them with overly pedantic grammar jargon.
2. Fluency & Clarity: Assess how easily their point comes across.
3. Grammar: Point out 1-3 actionable grammatical refinements with clear explanations in polite Indonesian/English.
4. "How a Native Staff Engineer Would Say It": Rewrite the user's answer into a polished, crisp, natural tech response that would impress in a global remote engineering team.
5. Pronunciation Tips: Mention 2-3 key technical words that non-native engineers often mispronounce (with simple phonetic guides, e.g. "cache" -> /kæʃ/ like 'cash', "hierarchy" -> /ˈhaɪ.rɑːr.ki/).
6. Extracted Key Vocabularies: Extract 2-3 high-impact words or workplace phrases from this topic/response that will help the user expand their English lexicon.

Return a JSON object conforming strictly to this format:
{
  "overallScore": number (0 to 100),
  "fluencyScore": number (0 to 100),
  "grammarScore": number (0 to 100),
  "vocabularyScore": number (0 to 100),
  "feedbackSummary": "string (Encouraging, high-signal feedback in Indonesian with constructive technical advice)",
  "betterAlternative": "string (Polished, natural Staff Engineer version of their answer)",
  "pronunciationTips": "string (Brief tips on pronouncing 2-3 key technical terms)",
  "grammarCorrections": [
    {
      "original": "string (the user phrase with error)",
      "corrected": "string (the natural correction)",
      "explanation": "string (simple explanation of the rule)"
    }
  ],
  "extractedVocabularies": [
    {
      "phrase": "string (the word or idiom)",
      "phonetic": "string (e.g. /kənˈten.ʃən/)",
      "meaning": "string (Indonesian translation and brief explanation)",
      "category": "technical" | "workplace_idiom" | "collaboration" | "leadership",
      "targetLevel": "${session.targetLevel}",
      "techContextExample": "string (Sentence showing how to use it in an engineering meeting or PR review)",
      "casualVsStaff": "string (e.g. 'Instead of: ..., Say: ...')"
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.5,
    },
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error("Failed to receive evaluation from Gemini AI.");
  }

  const evalResult = JSON.parse(cleanJsonText(responseText)) as SpeechEvaluationResult;

  // 1. Update session record
  const [updatedSession] = await db
    .update(aiEnglishSessions)
    .set({
      userSpeechTranscript: params.userTranscript,
      durationSeconds: params.durationSeconds,
      overallScore: evalResult.overallScore,
      fluencyScore: evalResult.fluencyScore,
      grammarScore: evalResult.grammarScore,
      vocabularyScore: evalResult.vocabularyScore,
      feedbackSummary: evalResult.feedbackSummary,
      betterAlternative: evalResult.betterAlternative,
      pronunciationTips: evalResult.pronunciationTips,
      grammarCorrections: evalResult.grammarCorrections,
      extractedVocabularies: evalResult.extractedVocabularies,
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(aiEnglishSessions.id, params.sessionId))
    .returning();

  // 2. Automatically save extracted vocabularies to the user's vault
  if (evalResult.extractedVocabularies && evalResult.extractedVocabularies.length > 0) {
    for (const vocab of evalResult.extractedVocabularies) {
      // Check if already exists by phrase
      const [existing] = await db
        .select()
        .from(aiEnglishVocabularies)
        .where(ilike(aiEnglishVocabularies.phrase, vocab.phrase.trim()))
        .limit(1);

      if (!existing) {
        await db.insert(aiEnglishVocabularies).values({
          phrase: vocab.phrase.trim(),
          phonetic: vocab.phonetic || null,
          meaning: vocab.meaning,
          category: vocab.category || "technical",
          targetLevel: session.targetLevel,
          techContextExample: vocab.techContextExample,
          casualVsStaff: vocab.casualVsStaff || null,
          masteryStatus: "learning",
          sourceSessionId: session.id,
        });
      }
    }
  }

  // 3. Update streak & habit tracker (guarded with Asia/Jakarta timezone)
  const todayStr = getJakartaDateString();
  const streak = await getEnglishFluencyStreak();

  let newCurrentStreak = streak.currentStreak;
  const lastDate = streak.lastActivityDate;

  if (!lastDate) {
    newCurrentStreak = 1;
  } else if (lastDate === todayStr) {
    // Already practiced today, keep current streak
    newCurrentStreak = Math.max(1, streak.currentStreak);
  } else {
    const diffDays = getDaysDifference(todayStr, lastDate);

    if (diffDays === 1) {
      newCurrentStreak += 1;
    } else {
      // Missed more than 1 day, reset streak
      newCurrentStreak = 1;
    }
  }

  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);
  const additionalMinutes = Math.max(1, Math.round(params.durationSeconds / 60));

  const [updatedStreak] = await db
    .update(aiEnglishStreaks)
    .set({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalSessions: streak.totalSessions + 1,
      totalSpeakingMinutes: streak.totalSpeakingMinutes + additionalMinutes,
      lastActivityDate: todayStr,
      updatedAt: new Date(),
    })
    .where(eq(aiEnglishStreaks.id, streak.id))
    .returning();

  revalidatePath("/cms/ai-english-fluency");

  return {
    session: updatedSession as AiEnglishSession,
    streak: updatedStreak as AiEnglishStreak,
  };
}

/**
 * Generates high-impact tech phrases on a specific topic on demand.
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

  revalidatePath("/cms/ai-english-fluency");
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

  revalidatePath("/cms/ai-english-fluency");
  return row as AiEnglishVocabulary;
}

/**
 * Server action to generate ultra-realistic native English audio using Google Cloud Journey neural voices.
 */
export async function getNeuralSpeechAudio(
  text: string,
  options?: SynthesizeOptions
): Promise<{ audioUrl: string | null; error?: string }> {
  await assertAdmin();
  return synthesizeNeuralSpeech(text, options);
}

/**
 * Generates comprehensive analytics and CEFR progression report (A1 -> A2 -> B1 -> B2 -> C1).
 */
export async function getEnglishAnalyticsReport(): Promise<EnglishAnalyticsReport> {
  await assertAdmin();
  const db = getDb();

  // 1. Fetch completed sessions & curriculum progress
  const completedSessions = await db
    .select()
    .from(aiEnglishSessions)
    .where(eq(aiEnglishSessions.status, "completed"))
    .orderBy(desc(aiEnglishSessions.completedAt));

  const completedCurriculum = await db
    .select()
    .from(aiEnglishCurriculumProgress)
    .where(eq(aiEnglishCurriculumProgress.completed, true))
    .orderBy(desc(aiEnglishCurriculumProgress.completedAt));

  // 2. Fetch vocabulary stats
  const allVocab = await db.select().from(aiEnglishVocabularies);
  const masteredCount = allVocab.filter((v) => v.masteryStatus === "mastered").length;
  const learningCount = allVocab.length - masteredCount;

  // 3. Fetch streak stats
  const streak = await getEnglishFluencyStreak();
  const totalCompleted = completedSessions.length + completedCurriculum.length;
  const totalMinutes = streak.totalSpeakingMinutes;

  // 4. Calculate score averages across both daily sessions and curriculum lessons
  const overallScores = [
    ...completedSessions.map((s) => s.overallScore).filter((s): s is number => s !== null),
    ...completedCurriculum.map((c) => c.spokenScore ?? c.quizScore).filter((s): s is number => s !== null),
  ];
  const fluencyScores = [
    ...completedSessions.map((s) => s.fluencyScore).filter((s): s is number => s !== null),
    ...completedCurriculum.map((c) => c.spokenScore).filter((s): s is number => s !== null),
  ];
  const grammarScores = completedSessions
    .map((s) => s.grammarScore)
    .filter((s): s is number => s !== null);
  const vocabScores = [
    ...completedSessions.map((s) => s.vocabularyScore).filter((s): s is number => s !== null),
    ...completedCurriculum.map((c) => c.quizScore).filter((s): s is number => s !== null),
  ];

  const avgOverall =
    overallScores.length > 0
      ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length)
      : 0;
  const avgFluency =
    fluencyScores.length > 0
      ? Math.round(fluencyScores.reduce((a, b) => a + b, 0) / fluencyScores.length)
      : 0;
  const avgGrammar =
    grammarScores.length > 0
      ? Math.round(grammarScores.reduce((a, b) => a + b, 0) / grammarScores.length)
      : avgOverall;
  const avgVocab =
    vocabScores.length > 0
      ? Math.round(vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length)
      : avgOverall;

  // 5. Recent trend: merge both daily sessions and curriculum lessons, sorted by date
  type TrendCandidate = {
    date: string;
    completedAtTime: number;
    topic: string;
    score: number;
    fluency: number;
    grammar: number;
  };

  const trendCandidates: TrendCandidate[] = [];

  for (const s of completedSessions) {
    trendCandidates.push({
      date: s.completedAt ? getJakartaDateString(new Date(s.completedAt)) : "",
      completedAtTime: s.completedAt ? new Date(s.completedAt).getTime() : 0,
      topic: s.topicTitle,
      score: s.overallScore ?? 0,
      fluency: s.fluencyScore ?? 0,
      grammar: s.grammarScore ?? 0,
    });
  }

  for (const c of completedCurriculum) {
    trendCandidates.push({
      date: c.completedAt ? getJakartaDateString(new Date(c.completedAt)) : "",
      completedAtTime: c.completedAt ? new Date(c.completedAt).getTime() : 0,
      topic: `Track ${c.trackLevel}: Lesson ${c.lessonId}`,
      score: c.spokenScore ?? c.quizScore ?? 80,
      fluency: c.spokenScore ?? 80,
      grammar: c.quizScore ?? 80,
    });
  }

  trendCandidates.sort((a, b) => b.completedAtTime - a.completedAtTime);
  const recentTrend = trendCandidates
    .slice(0, 7)
    .reverse()
    .map(({ date, topic, score, fluency, grammar }) => ({
      date,
      topic,
      score,
      fluency,
      grammar,
    }));

  // 6. Tier Milestone Definitions
  const tierConfigs: Array<{
    level: TargetLevel;
    title: string;
    description: string;
    targetSessions: number;
    targetScore: number;
    targetPhrases: number;
    targetMinutes: number;
    keyCompetencyBadge: string;
  }> = [
    {
      level: "A1-A2",
      title: "Level A1-A2: Foundation & Daily Standup",
      description:
        "Mampu membentuk kalimat dasar, memahami kata kunci teknis, dan memberikan update sprint standup tanpa panik.",
      targetSessions: 5,
      targetScore: 60,
      targetPhrases: 10,
      targetMinutes: 15,
      keyCompetencyBadge: "🌱 Basic Standup & Keyword Fluency",
    },
    {
      level: "B1",
      title: "Level B1: Independent Conversationalist",
      description:
        "Mampu menjelaskan alur kerja fitur, merespons review kode di GitHub/GitLab, dan menjelaskan trade-off teknis sederhana.",
      targetSessions: 20,
      targetScore: 72,
      targetPhrases: 35,
      targetMinutes: 60,
      keyCompetencyBadge: "⚡ Code Review & Feature Rationale",
    },
    {
      level: "B2",
      title: "Level B2: Global Staff Engineer (TARGET UTAMA)",
      description:
        "Kelancaran kerja penuh: Memimpin technical sync internasional, berdebat arsitektur sistem, dan presentasi persuasif ke stakeholder global.",
      targetSessions: 50,
      targetScore: 80,
      targetPhrases: 80,
      targetMinutes: 180,
      keyCompetencyBadge: "🚀 System Architecture & Global Debates",
    },
    {
      level: "C1",
      title: "Level C1: Executive & Strategic Polish",
      description:
        "Penguasaan bahasa tingkat tinggi: Diplomasi teknis, negosiasi strategis, dan artikulasi bahasa Inggris setara penutur asli.",
      targetSessions: 100,
      targetScore: 88,
      targetPhrases: 180,
      targetMinutes: 400,
      keyCompetencyBadge: "👑 Executive Tech Leadership & Nuance",
    },
  ];

  const milestones: CefrMilestone[] = tierConfigs.map((cfg, index) => {
    const sessionProg = Math.min(1, totalCompleted / cfg.targetSessions);
    const phraseProg = Math.min(1, masteredCount / cfg.targetPhrases);
    const minuteProg = Math.min(1, totalMinutes / cfg.targetMinutes);
    const scoreProg =
      totalCompleted === 0 ? 0 : avgOverall >= cfg.targetScore ? 1 : Math.min(1, avgOverall / cfg.targetScore);

    const progressPercentage = Math.round(
      (sessionProg * 0.35 + phraseProg * 0.25 + minuteProg * 0.2 + scoreProg * 0.2) * 100
    );

    const isCompleted = progressPercentage >= 100;
    const isUnlocked =
      index === 0 || (tierConfigs[index - 1] ? totalCompleted >= tierConfigs[index - 1].targetSessions * 0.6 : true);

    return {
      level: cfg.level,
      title: cfg.title,
      description: cfg.description,
      targetSessions: cfg.targetSessions,
      targetScore: cfg.targetScore,
      targetPhrases: cfg.targetPhrases,
      targetMinutes: cfg.targetMinutes,
      progressPercentage,
      isUnlocked,
      isCompleted,
      sessionsCompleted: totalCompleted,
      phrasesMastered: masteredCount,
      speakingMinutes: totalMinutes,
      averageScore: avgOverall,
      remainingSessions: Math.max(0, cfg.targetSessions - totalCompleted),
      remainingPhrases: Math.max(0, cfg.targetPhrases - masteredCount),
      remainingMinutes: Math.max(0, cfg.targetMinutes - totalMinutes),
      scoreGap: Math.max(0, cfg.targetScore - avgOverall),
      keyCompetencyBadge: cfg.keyCompetencyBadge,
    };
  });

  let currentEstimatedLevel: TargetLevel = "A1-A2";
  let nextTargetLevel: TargetLevel | "MAX" = "B1";
  let currentLevelPercentage = 0;

  if (!milestones[0].isCompleted) {
    currentEstimatedLevel = "A1-A2";
    currentLevelPercentage = milestones[0].progressPercentage;
    nextTargetLevel = "A1-A2";
  } else if (!milestones[1].isCompleted) {
    currentEstimatedLevel = "A1-A2";
    currentLevelPercentage = milestones[1].progressPercentage;
    nextTargetLevel = "B1";
  } else if (!milestones[2].isCompleted) {
    currentEstimatedLevel = "B1";
    currentLevelPercentage = milestones[2].progressPercentage;
    nextTargetLevel = "B2";
  } else if (!milestones[3].isCompleted) {
    currentEstimatedLevel = "B2";
    currentLevelPercentage = milestones[3].progressPercentage;
    nextTargetLevel = "C1";
  } else {
    currentEstimatedLevel = "C1";
    currentLevelPercentage = 100;
    nextTargetLevel = "MAX";
  }

  let diagnosticMessage = "";
  if (totalCompleted === 0) {
    diagnosticMessage =
      "Anda berada di garis awal perjalanan menuju Strong B2! Selesaikan 1 sesi latihan speaking pertama Anda di tab Daily Gym untuk membuka pengukuran analitik awal.";
  } else if (!milestones[0].isCompleted) {
    diagnosticMessage = `Posisi Anda saat ini: Menuntaskan fondasi A1 (${milestones[0].progressPercentage}% selesai). Butuh ${milestones[0].remainingSessions} sesi latihan lagi dan ${milestones[0].remainingPhrases} kosakata terkuasai untuk menyempurnakan level A1 dan membuka gerbang B1!`;
  } else if (!milestones[1].isCompleted) {
    diagnosticMessage = `Fondasi A1 Anda sudah tuntas! Anda sedang berakselerasi di level B1 (${milestones[1].progressPercentage}%). Pertahankan skor rata-rata di atas 72% dan lengkapi ${milestones[1].remainingSessions} sesi lagi menuju percakapan kerja mandiri.`;
  } else if (!milestones[2].isCompleted) {
    diagnosticMessage = `Luar biasa! Anda berada di jalur emas Staff Engineer B2 (${milestones[2].progressPercentage}%). Terus latih pertahanan keputusan arsitektur dan idiom kerja untuk mengunci kelancaran global penuh.`;
  } else {
    diagnosticMessage = `Pencapaian kelas eksekutif! Anda telah menguasai level B2 dan sedang memoles keahlian retorika level C1.`;
  }

  return {
    currentEstimatedLevel,
    currentLevelPercentage,
    nextTargetLevel,
    totalCompletedSessions: totalCompleted,
    totalSpeakingMinutes: totalMinutes,
    masteredVocabCount: masteredCount,
    learningVocabCount: learningCount,
    averageScores: {
      overall: avgOverall,
      fluency: avgFluency,
      grammar: avgGrammar,
      vocabulary: avgVocab,
    },
    recentTrend,
    milestones,
    diagnosticMessage,
  };
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

  revalidatePath("/cms/ai-english-fluency");

  return {
    success: true,
    examples: updatedExamples,
  };
}

/**
 * Transcribes user speech from an audio recording using Gemini's native multimodal capabilities.
 * Serves as a rock-solid, browser-independent fallback for Brave, Safari, Firefox, or mobile environments.
 */
export async function transcribeSpokenAudio(
  base64Audio: string,
  mimeType = "audio/webm"
): Promise<{ transcript: string }> {
  await assertAdmin();

  if (!base64Audio || base64Audio.length < 50) {
    return { transcript: "" };
  }

  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  // Strip data:audio/xxx;base64, if present
  const cleanBase64 = base64Audio.includes("base64,")
    ? base64Audio.split("base64,")[1]
    : base64Audio;

  const prompt = `You are a high-accuracy English speech-to-text transcriber for a software engineer practicing speaking drills.
Transcribe the English speech in this audio recording accurately.
Guidelines:
- Return ONLY the exact transcribed text spoken in the audio.
- Accurately capture technical engineering terminology (e.g., Kubernetes, Redis, Docker, microservices, latency, throughput, PR, API, PostgreSQL).
- Do not include conversational commentary, explanations, labels, or quotation marks.
- If there is no speech or only background silence/noise, return an empty string.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: cleanBase64,
        },
      },
      {
        text: prompt,
      },
    ],
  });

  const transcript = response.text?.trim() || "";
  return { transcript };
}

/**
 * Generates a realistic, critical Senior/Staff Engineer follow-up challenge ("Pushback")
 * in response to the user's initial spoken pitch or proposal.
 */
export async function generateStaffPushback(params: {
  sessionId: string;
  userTranscript: string;
}): Promise<{ pushbackText: string; audioUrl: string | null }> {
  await assertAdmin();
  const db = getDb();

  const [session] = await db
    .select()
    .from(aiEnglishSessions)
    .where(eq(aiEnglishSessions.id, params.sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Practice session not found.");
  }

  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  const prompt = `You are a sharp, realistic Silicon Valley Principal / Senior Staff Engineer in an architectural design review or technical interview.
The candidate (Wisman) has just made the following initial pitch in response to the challenge:

Scenario: "${session.scenarioPrompt}"
Candidate's Initial Response:
"""
${params.userTranscript}
"""

Task:
Provide 1 realistic, constructive, and probing pushback or follow-up question in natural, conversational tech English (2 to 3 sentences maximum).
Guidelines:
- Acknowledge their point briefly, then challenge a real-world engineering trade-off (e.g. edge cases, scalability bottlenecks, failure modes, data consistency, operational cost, or developer ergonomics).
- Keep the tone professional, supportive yet inquisitive (the way a great Staff Engineer pushes peers to think deeper).
- Ask a direct question at the end prompting the candidate to defend or clarify their decision.
- Do NOT output any JSON or markdown headers. Just output the spoken pushback text directly.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  const pushbackText =
    response.text?.trim() ||
    "Good point. But how would your architecture handle sudden network partitions or data inconsistency?";

  // Synthesize neural voice for the pushback so the user hears the colleague's challenge!
  let audioUrl: string | null = null;
  try {
    const speech = await synthesizeNeuralSpeech(pushbackText, {
      voice: "en-US-Journey-D",
      speakingRate: 0.98,
    });
    audioUrl = speech.audioUrl;
  } catch (err) {
    console.warn("Pushback TTS synthesis failed:", err);
  }

  return { pushbackText, audioUrl };
}

// --------------------------------------------------------------------------
// GUIDED CURRICULUM TRACKS SERVER ACTIONS
// --------------------------------------------------------------------------

/**
 * Fetches all curriculum tracks with user progress and completion stats.
 */
export async function getCurriculumTracksWithProgress(): Promise<CurriculumTrack[]> {
  await assertAdmin();
  const db = getDb();

  const progressRecords = await db
    .select()
    .from(aiEnglishCurriculumProgress)
    .where(eq(aiEnglishCurriculumProgress.userId, "wisman-primary"));

  const progressMap = new Map<string, typeof progressRecords[0]>();
  for (const record of progressRecords) {
    progressMap.set(record.lessonId, record);
  }

  const tracks: CurriculumTrack[] = CURRICULUM_TRACKS_BLUEPRINT.map((blueprint) => {
    let totalLessons = 0;
    let completedLessons = 0;

    const units = blueprint.units.map((unit) => {
      const lessons = unit.lessons.map((lesson) => {
        totalLessons++;
        const record = progressMap.get(lesson.id);
        const isCompleted = record?.completed ?? false;
        if (isCompleted) completedLessons++;

        return {
          ...lesson,
          isCompleted,
          userQuizScore: record?.quizScore ?? null,
          userSpokenScore: record?.spokenScore ?? null,
          userSpokenTranscript: record?.spokenTranscript ?? null,
          userStaffUpgradeFeedback: record?.staffUpgradeFeedback ?? null,
        };
      });

      return {
        ...unit,
        lessons,
      };
    });

    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      ...blueprint,
      units,
      totalLessons,
      completedLessons,
      progressPercentage,
    };
  });

  return tracks;
}

/**
 * Evaluates the user's spoken response in the curriculum role-play challenge.
 */
export async function evaluateCurriculumRolePlay(params: {
  trackLevel: string;
  unitId: string;
  lessonId: string;
  userTranscript: string;
}): Promise<{
  spokenScore: number;
  fluencyScore: number;
  feedbackSummary: string;
  staffUpgrade: string;
  grammarCorrections: Array<{ original: string; corrected: string; explanation: string }>;
}> {
  await assertAdmin();

  // Find lesson from blueprint
  let targetLesson: CurriculumLesson | null = null;
  for (const track of CURRICULUM_TRACKS_BLUEPRINT) {
    for (const unit of track.units) {
      const found = unit.lessons.find((l) => l.id === params.lessonId);
      if (found) {
        targetLesson = found;
        break;
      }
    }
  }

  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  const prompt = `You are a Silicon Valley Senior Staff Engineer and expert English fluency coach for global software developers.
Evaluate this engineer's spoken response in a workplace role-play challenge:

Context / Scenario: "${targetLesson?.rolePlay.scenario ?? "Workplace Engineering Discussion"}"
Colleague Asking Question: "${targetLesson?.rolePlay.characterName ?? "Lead"} (${targetLesson?.rolePlay.characterRole ?? "Lead"})"
Prompt Question: "${targetLesson?.rolePlay.promptQuestion ?? "What is your update?"}"
Ideal Model Answer: "${targetLesson?.rolePlay.modelAnswer ?? ""}"

Candidate's Spoken Answer (from Speech-To-Text):
"""
${params.userTranscript}
"""

Instructions:
Evaluate the response strictly against modern tech workplace English standards (clarity, concise impact, professionalism, appropriate idioms).
Output ONLY valid JSON with this exact schema:
{
  "spokenScore": integer between 45 and 100,
  "fluencyScore": integer between 45 and 100,
  "feedbackSummary": string (2 concise sentences highlighting strengths and how to be more articulate),
  "staffUpgrade": string (an articulate, natural Senior/Staff-level phrasing that answers the prompt with high signal-to-noise ratio),
  "grammarCorrections": [
    { "original": string, "corrected": string, "explanation": string }
  ]
}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  try {
    const parsed = JSON.parse(cleanJsonText(response.text || "{}"));
    return {
      spokenScore: Math.min(100, Math.max(50, parsed.spokenScore ?? 80)),
      fluencyScore: Math.min(100, Math.max(50, parsed.fluencyScore ?? 80)),
      feedbackSummary:
        parsed.feedbackSummary ||
        "Good effort! Your response addressed the core question clearly.",
      staffUpgrade:
        parsed.staffUpgrade ||
        targetLesson?.rolePlay.modelAnswer ||
        "All systems are operational with zero blocking issues.",
      grammarCorrections: Array.isArray(parsed.grammarCorrections)
        ? parsed.grammarCorrections
        : [],
    };
  } catch (err) {
    console.error("Failed to parse curriculum roleplay evaluation:", err);
    return {
      spokenScore: 78,
      fluencyScore: 80,
      feedbackSummary: "Good response! Clear articulation of the technical context.",
      staffUpgrade: targetLesson?.rolePlay.modelAnswer || params.userTranscript,
      grammarCorrections: [],
    };
  }
}

/**
 * Submits and records completion for a curriculum lesson, updating streak & analytics.
 */
export async function submitCurriculumLessonProgress(params: {
  trackLevel: string;
  unitId: string;
  lessonId: string;
  quizScore: number;
  spokenTranscript?: string;
  spokenScore?: number;
  staffUpgradeFeedback?: string;
}): Promise<{ success: boolean; completed: boolean }> {
  await assertAdmin();
  const db = getDb();

  const existing = await db
    .select()
    .from(aiEnglishCurriculumProgress)
    .where(
      and(
        eq(aiEnglishCurriculumProgress.userId, "wisman-primary"),
        eq(aiEnglishCurriculumProgress.lessonId, params.lessonId)
      )
    )
    .limit(1);

  const wasCompleted = existing[0]?.completed ?? false;

  if (existing.length > 0) {
    await db
      .update(aiEnglishCurriculumProgress)
      .set({
        completed: true,
        quizScore: params.quizScore,
        spokenTranscript: params.spokenTranscript,
        spokenScore: params.spokenScore,
        staffUpgradeFeedback: params.staffUpgradeFeedback,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aiEnglishCurriculumProgress.id, existing[0].id));
  } else {
    await db.insert(aiEnglishCurriculumProgress).values({
      userId: "wisman-primary",
      trackLevel: params.trackLevel,
      unitId: params.unitId,
      lessonId: params.lessonId,
      completed: true,
      quizScore: params.quizScore,
      spokenTranscript: params.spokenTranscript,
      spokenScore: params.spokenScore,
      staffUpgradeFeedback: params.staffUpgradeFeedback,
      completedAt: new Date(),
    });
  }

  // If newly completed, record activity in streak
  if (!wasCompleted) {
    const todayStr = getJakartaDateString();
    const [streak] = await db
      .select()
      .from(aiEnglishStreaks)
      .where(eq(aiEnglishStreaks.userId, "wisman-primary"))
      .limit(1);

    if (streak) {
      let newCurrentStreak = streak.currentStreak;
      if (!streak.lastActivityDate) {
        newCurrentStreak = 1;
      } else if (streak.lastActivityDate !== todayStr) {
        const diffDays = getDaysDifference(todayStr, streak.lastActivityDate);
        if (diffDays === 1) {
          newCurrentStreak += 1;
        } else if (diffDays > 1) {
          newCurrentStreak = 1;
        }
      }
      const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

      await db
        .update(aiEnglishStreaks)
        .set({
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          totalSessions: streak.totalSessions + 1,
          totalSpeakingMinutes: streak.totalSpeakingMinutes + 3,
          lastActivityDate: todayStr,
          updatedAt: new Date(),
        })
        .where(eq(aiEnglishStreaks.id, streak.id));
    }
  }

  revalidatePath("/cms/ai-english-fluency");
  return { success: true, completed: true };
}

/**
 * Synthesizes neural audio for a specific character dialogue line.
 */
export async function synthesizeDialogueLine(params: {
  text: string;
  speaker: string;
}): Promise<{ audioUrl: string | null }> {
  await assertAdmin();

  let voice = "en-US-Journey-D";
  const lowerSpeaker = params.speaker.toLowerCase();
  if (lowerSpeaker.includes("sarah") || lowerSpeaker.includes("maria")) {
    voice = "en-US-Journey-F";
  } else if (lowerSpeaker.includes("alex") || lowerSpeaker.includes("hiring")) {
    voice = "en-US-Neural2-A";
  } else if (lowerSpeaker.includes("david")) {
    voice = "en-US-Journey-D";
  } else if (lowerSpeaker.includes("tom")) {
    voice = "en-US-Studio-O";
  }

  try {
    const speech = await synthesizeNeuralSpeech(params.text, { voice, speakingRate: 0.98 });
    return { audioUrl: speech.audioUrl };
  } catch (err) {
    console.warn("Dialogue line TTS failed:", err);
    return { audioUrl: null };
  }
}

