"use server";

import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type {
  EnglishAnalyticsReport,
  TargetLevel,
  CefrMilestone,
} from "./types";
import { getJakartaDateString } from "./helpers";
import { getEnglishFluencyStreak } from "./actions";

const {
  aiEnglishSessions,
  aiEnglishVocabularies,
  aiEnglishCurriculumProgress,
} = schema;

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
