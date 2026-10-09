"use server";

import { desc, eq, ilike, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import type {
  TargetLevel,
  AiEnglishSession,
  AiEnglishStreak,
  SpeechEvaluationResult,
} from "./types";
import {
  cleanJsonText,
  getJakartaDateString,
  getDaysDifference,
  revalidateEnglishHubs,
} from "./helpers";

// Re-export all sub-domain actions so existing consumers don't break
export * from "./vocab-actions";
export * from "./audio-actions";
export * from "./curriculum-actions";
export * from "./analytics-actions";

const {
  aiEnglishSessions,
  aiEnglishVocabularies,
  aiEnglishStreaks,
  aiKnowledgeItems,
  aiEnglishCurriculumProgress,
} = schema;

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

  revalidateEnglishHubs();
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

  revalidateEnglishHubs();
  return newSession as AiEnglishSession;
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

  revalidateEnglishHubs();
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
    newCurrentStreak = Math.max(1, streak.currentStreak);
  } else {
    const diffDays = getDaysDifference(todayStr, lastDate);

    if (diffDays === 1) {
      newCurrentStreak += 1;
    } else {
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

  revalidateEnglishHubs();

  return {
    session: updatedSession as AiEnglishSession,
    streak: updatedStreak as AiEnglishStreak,
  };
}
