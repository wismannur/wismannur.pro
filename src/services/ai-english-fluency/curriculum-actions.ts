"use server";

import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { CURRICULUM_TRACKS_BLUEPRINT } from "./curriculum-data";
import { synthesizeNeuralSpeech } from "./tts";
import type { CurriculumTrack, CurriculumLesson } from "./types";
import {
  cleanJsonText,
  getJakartaDateString,
  getDaysDifference,
  revalidateEnglishHubs,
} from "./helpers";

const {
  aiEnglishSessions,
  aiEnglishStreaks,
  aiEnglishCurriculumProgress,
} = schema;

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

  const progressMap = new Map<string, (typeof progressRecords)[0]>();
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

  revalidateEnglishHubs();
  return { success: true, completed: true };
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
