"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { CURRICULUM_TOPICS, PILLAR_METADATA } from "./curriculum-data";
import { generateChallengeDetailsWithAI, evaluateFrontendSubmissionWithAI } from "./gemini-ai";
import type {
  CurriculumTopic,
  FrontendDifficulty,
  FrontendMasteryProgressItem,
  FrontendMasterySession,
  FrontendPillar,
} from "./types";

const { frontendMasterySessions, frontendMasteryProgress } = schema;

/**
 * Returns curriculum roadmap, user progress, and summary statistics.
 */
export async function getFrontendMasteryOverview() {
  await assertAdmin();
  const db = getDb();

  const progressRows = await db.select().from(frontendMasteryProgress);

  const progressByTopic = new Map<string, FrontendMasteryProgressItem>();
  for (const row of progressRows) {
    progressByTopic.set(row.topicId, row as unknown as FrontendMasteryProgressItem);
  }

  // Calculate statistics
  let totalPracticing = 0;
  let totalMastered = 0;
  let totalScoreSum = 0;
  let completedDrillsCount = 0;

  for (const p of progressRows) {
    if (p.masteryStatus === "mastered") {
      totalMastered++;
    } else if (p.masteryStatus === "practicing") {
      totalPracticing++;
    }
    if (p.bestScore && p.bestScore > 0) {
      totalScoreSum += p.bestScore;
      completedDrillsCount++;
    }
  }

  const averageScore =
    completedDrillsCount > 0 ? Math.round(totalScoreSum / completedDrillsCount) : 0;

  // Recent completed sessions
  const recentSessions = await db
    .select()
    .from(frontendMasterySessions)
    .where(eq(frontendMasterySessions.status, "completed"))
    .orderBy(desc(frontendMasterySessions.updatedAt))
    .limit(10);

  // Active in-progress session if any
  const [activeSession] = await db
    .select()
    .from(frontendMasterySessions)
    .where(eq(frontendMasterySessions.status, "in_progress"))
    .orderBy(desc(frontendMasterySessions.createdAt))
    .limit(1);

  return {
    pillars: PILLAR_METADATA,
    topics: CURRICULUM_TOPICS,
    progressByTopic: Object.fromEntries(progressByTopic),
    stats: {
      totalTopics: CURRICULUM_TOPICS.length,
      totalMastered,
      totalPracticing,
      averageScore,
      completedDrillsCount,
    },
    activeSession: (activeSession as unknown as FrontendMasterySession) || null,
    recentSessions: recentSessions as unknown as FrontendMasterySession[],
  };
}

/**
 * Starts or retrieves an active drill session for a specific curriculum topic.
 */
export async function startOrGetChallengeSession(
  topicId: string,
  difficulty: FrontendDifficulty = "senior"
): Promise<FrontendMasterySession> {
  await assertAdmin();
  const db = getDb();

  // 1. Check if there is already an in_progress session for this topic
  const [existing] = await db
    .select()
    .from(frontendMasterySessions)
    .where(eq(frontendMasterySessions.topicId, topicId))
    .orderBy(desc(frontendMasterySessions.createdAt))
    .limit(1);

  if (existing && existing.status === "in_progress") {
    return existing as unknown as FrontendMasterySession;
  }

  // 2. Find curriculum topic metadata
  const topic = CURRICULUM_TOPICS.find((t) => t.id === topicId);
  if (!topic) {
    throw new Error(`Topic not found for id: ${topicId}`);
  }

  // 3. Generate tailored challenge using Vertex AI
  const challenge = await generateChallengeDetailsWithAI(topic, difficulty);

  // 4. Create new session
  const [newSession] = await db
    .insert(frontendMasterySessions)
    .values({
      pillar: topic.pillar,
      topicId: topic.id,
      topicTitle: topic.title,
      difficulty,
      questionPrompt: challenge.questionPrompt,
      starterCode: challenge.starterCode || topic.starterCode || null,
      hints: challenge.hints,
      status: "in_progress",
    })
    .returning();

  // 5. Update or initialize progress record
  const [existingProgress] = await db
    .select()
    .from(frontendMasteryProgress)
    .where(eq(frontendMasteryProgress.topicId, topicId))
    .limit(1);

  if (!existingProgress) {
    await db.insert(frontendMasteryProgress).values({
      topicId: topic.id,
      pillar: topic.pillar,
      topicTitle: topic.title,
      masteryStatus: "practicing",
      attemptsCount: 0,
      bestScore: 0,
    });
  }

  revalidatePath("/cms/frontend-mastery");
  return newSession as unknown as FrontendMasterySession;
}

/**
 * Submits the candidate's solution for Senior Staff evaluation via Vertex AI.
 */
export async function submitChallengeSession(
  sessionId: string,
  userSubmission: string,
  timeSpentSeconds: number
): Promise<FrontendMasterySession> {
  await assertAdmin();
  const db = getDb();

  const [session] = await db
    .select()
    .from(frontendMasterySessions)
    .where(eq(frontendMasterySessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Drill session not found.");
  }

  // Find topic
  const topic = CURRICULUM_TOPICS.find((t) => t.id === session.topicId) || {
    id: session.topicId,
    pillar: session.pillar as FrontendPillar,
    title: session.topicTitle,
    category: "General Frontend",
    description: session.questionPrompt,
    difficulty: session.difficulty as FrontendDifficulty,
    keyConcepts: [],
    bigTechContext: "Frontend Engineering standard",
  };

  // Run Senior Staff evaluation with Vertex AI
  const evaluation = await evaluateFrontendSubmissionWithAI({
    topic,
    difficulty: session.difficulty as FrontendDifficulty,
    questionPrompt: session.questionPrompt,
    userSubmission,
    timeSpentSeconds,
  });

  const overallScore = evaluation.overallScore;

  // Update session
  const [updatedSession] = await db
    .update(frontendMasterySessions)
    .set({
      userSubmission,
      evaluationResult: evaluation,
      score: overallScore,
      status: "completed",
      timeSpentSeconds,
      updatedAt: new Date(),
    })
    .where(eq(frontendMasterySessions.id, sessionId))
    .returning();

  // Update topic progress
  const [currentProgress] = await db
    .select()
    .from(frontendMasteryProgress)
    .where(eq(frontendMasteryProgress.topicId, session.topicId))
    .limit(1);

  const prevBest = currentProgress?.bestScore || 0;
  const newBest = Math.max(prevBest, overallScore);
  const newStatus = newBest >= 80 ? "mastered" : "practicing";
  const newAttempts = (currentProgress?.attemptsCount || 0) + 1;

  if (currentProgress) {
    await db
      .update(frontendMasteryProgress)
      .set({
        attemptsCount: newAttempts,
        bestScore: newBest,
        masteryStatus: newStatus,
        lastCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(frontendMasteryProgress.id, currentProgress.id));
  } else {
    await db.insert(frontendMasteryProgress).values({
      topicId: session.topicId,
      pillar: session.pillar,
      topicTitle: session.topicTitle,
      attemptsCount: 1,
      bestScore: newBest,
      masteryStatus: newStatus,
      lastCompletedAt: new Date(),
    });
  }

  revalidatePath("/cms/frontend-mastery");
  return updatedSession as unknown as FrontendMasterySession;
}

/**
 * Resets / retries a topic by creating a fresh in-progress session.
 */
export async function retryChallengeSession(
  topicId: string,
  difficulty: FrontendDifficulty = "senior"
): Promise<FrontendMasterySession> {
  await assertAdmin();
  const db = getDb();

  // Delete previous abandoned in_progress sessions for this topic
  await db
    .delete(frontendMasterySessions)
    .where(
      eq(frontendMasterySessions.topicId, topicId)
    );

  return startOrGetChallengeSession(topicId, difficulty);
}

/**
 * Retrieves full session details by ID.
 */
export async function getChallengeSession(
  sessionId: string
): Promise<FrontendMasterySession | null> {
  await assertAdmin();
  const db = getDb();

  const [session] = await db
    .select()
    .from(frontendMasterySessions)
    .where(eq(frontendMasterySessions.id, sessionId))
    .limit(1);

  return (session as unknown as FrontendMasterySession) || null;
}

/**
 * Creates a custom ad-hoc mock interview with custom prompt specifications.
 */
export async function createCustomMockInterview(
  pillar: FrontendPillar,
  difficulty: FrontendDifficulty,
  customScenario: string
): Promise<FrontendMasterySession> {
  await assertAdmin();
  const db = getDb();

  const syntheticTopic: CurriculumTopic = {
    id: `custom-${Date.now()}`,
    pillar,
    title: `Custom Mock: ${customScenario.slice(0, 40)}...`,
    category: "Specialized Mock",
    description: customScenario,
    difficulty,
    keyConcepts: ["Architecture", "Resilience", "Edge Cases"],
    bigTechContext: "Dynamic Staff Mock Interview",
  };

  const challenge = await generateChallengeDetailsWithAI(syntheticTopic, difficulty);

  const [newSession] = await db
    .insert(frontendMasterySessions)
    .values({
      pillar,
      topicId: syntheticTopic.id,
      topicTitle: syntheticTopic.title,
      difficulty,
      questionPrompt: challenge.questionPrompt,
      starterCode: challenge.starterCode || null,
      hints: challenge.hints,
      status: "in_progress",
    })
    .returning();

  revalidatePath("/cms/frontend-mastery");
  return newSession as unknown as FrontendMasterySession;
}
