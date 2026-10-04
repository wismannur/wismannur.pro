"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getEnglishAnalyticsReport } from "@/services/ai-english-fluency/actions";
import type { EnglishAnalyticsReport } from "@/services/ai-english-fluency/types";

export function TabAnalytics() {
  const { data: report, isLoading } = useQuery<EnglishAnalyticsReport>({
    queryKey: ["ai-english-analytics-report"],
    queryFn: () => getEnglishAnalyticsReport(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        Calculating your CEFR Skill Matrix &amp; Roadmap...
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 1. CURRENT CEFR STANDING HERO CARD */}
      <Card className="border-border/80 shadow-md bg-gradient-to-br from-primary/10 via-card to-card relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-mono gap-1">
                  <Target className="w-3.5 h-3.5" /> CEFR Benchmark Matrix
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono">
                  Current Rank: {report.currentEstimatedLevel}
                </Badge>
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
                Your Current English Skill Level &amp; Trajectory
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Objective competency tracking based on practice consistency, speech scores, and lexicon mastery.
              </CardDescription>
            </div>

            {/* Current Level Circle / Gauge */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center gap-4 shrink-0">
              <div className="space-y-0.5 text-right">
                <div className="text-xs text-muted-foreground font-medium">Active Mastery</div>
                <div className="text-2xl md:text-3xl font-bold font-mono text-primary leading-none">
                  {report.currentLevelPercentage}%
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  {report.nextTargetLevel === "MAX" ? "Top Tier Mastered" : `Targeting ${report.nextTargetLevel}`}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {/* Progress Bar for Current Level */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-foreground">Progress towards completing {report.currentEstimatedLevel}</span>
              <span className="font-mono text-primary">{report.currentLevelPercentage}%</span>
            </div>
            <Progress value={report.currentLevelPercentage} className="h-2.5" />
          </div>

          {/* Diagnostic Coach Note */}
          <div className="p-4 rounded-xl bg-card/90 border border-primary/20 flex items-start gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Brain className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                Senior Staff Coach Diagnostic Assessment
              </div>
              <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
                {report.diagnosticMessage}
              </p>
            </div>
          </div>

          {/* Core Metric Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div className="text-muted-foreground text-[11px]">Completed Drills</div>
              <div className="text-lg md:text-xl font-bold font-mono text-foreground mt-0.5">
                {report.totalCompletedSessions} <span className="text-xs font-normal text-muted-foreground">sessions</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div className="text-muted-foreground text-[11px]">Speaking Time</div>
              <div className="text-lg md:text-xl font-bold font-mono text-foreground mt-0.5">
                {report.totalSpeakingMinutes} <span className="text-xs font-normal text-muted-foreground">minutes</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div className="text-muted-foreground text-[11px]">Mastered Lexicon</div>
              <div className="text-lg md:text-xl font-bold font-mono text-foreground mt-0.5">
                {report.masteredVocabCount} <span className="text-xs font-normal text-muted-foreground">phrases</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div className="text-muted-foreground text-[11px]">Overall Avg Score</div>
              <div className="text-lg md:text-xl font-bold font-mono text-foreground mt-0.5">
                {report.averageScores.overall} <span className="text-xs font-normal text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. CEFR ROADMAP MATRIX (A1 -> A2 -> B1 -> B2 -> C1) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-base md:text-lg font-bold tracking-tight">
              CEFR Mastery Progression Roadmap
            </h3>
            <p className="text-xs text-muted-foreground">
              Concrete milestones showing exactly what requirements are needed to unlock each level.
            </p>
          </div>
          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/5 self-start sm:self-auto font-mono">
            🎯 Target Utama: Strong B2
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {report.milestones.map((ms) => {
            const isCurrent = report.currentEstimatedLevel === ms.level;
            const isCompleted = ms.isCompleted;

            return (
              <Card
                key={ms.level}
                className={`border transition-all shadow-sm relative ${
                  isCompleted
                    ? "bg-gradient-to-br from-emerald-500/5 via-card to-card border-emerald-500/30"
                    : isCurrent
                    ? "bg-gradient-to-br from-primary/10 via-card to-card border-primary/40 shadow-md ring-1 ring-primary/20"
                    : "bg-card/70 border-border/70 opacity-80"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isCurrent
                              ? "bg-primary/20 text-primary border-primary/30 font-bold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {ms.keyCompetencyBadge}
                        </Badge>
                        {isCompleted && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/20 text-emerald-300 gap-1">
                            <Check className="w-3 h-3" /> Mastered
                          </Badge>
                        )}
                        {isCurrent && !isCompleted && (
                          <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary font-semibold">
                            🔥 In Progress
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm md:text-base font-bold text-foreground">
                        {ms.title}
                      </CardTitle>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base md:text-lg font-bold font-mono text-primary">
                        {ms.progressPercentage}%
                      </span>
                    </div>
                  </div>
                  <CardDescription className="text-xs line-clamp-2 leading-relaxed mt-1">
                    {ms.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-1 text-xs">
                  {/* Progress Bar */}
                  <Progress value={ms.progressPercentage} className="h-2" />

                  {/* Requirements Checklist */}
                  <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Milestone Requirements:
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {/* Sessions */}
                      <div className="flex items-center gap-1.5">
                        {ms.sessionsCompleted >= ms.targetSessions ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span>
                          Sessions: <strong className="font-mono">{ms.sessionsCompleted}/{ms.targetSessions}</strong>
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-1.5">
                        {ms.averageScore >= ms.targetScore ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span>
                          Avg Score: <strong className="font-mono">{ms.averageScore}%</strong> (req {ms.targetScore}%)
                        </span>
                      </div>

                      {/* Vocabulary */}
                      <div className="flex items-center gap-1.5">
                        {ms.phrasesMastered >= ms.targetPhrases ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span>
                          Lexicon: <strong className="font-mono">{ms.phrasesMastered}/{ms.targetPhrases}</strong> phrases
                        </span>
                      </div>

                      {/* Speaking Minutes */}
                      <div className="flex items-center gap-1.5">
                        {ms.speakingMinutes >= ms.targetMinutes ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span>
                          Speaking: <strong className="font-mono">{ms.speakingMinutes}/{ms.targetMinutes}</strong> mins
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remaining delta for incomplete milestones */}
                  {!isCompleted && (
                    <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1.5 pt-0.5">
                      <Sparkles className="w-3 h-3 shrink-0 text-amber-400" />
                      <span>
                        Tersisa: {ms.remainingSessions > 0 ? `${ms.remainingSessions} sesi lagi, ` : ""}
                        {ms.remainingPhrases > 0 ? `${ms.remainingPhrases} kosakata lagi` : "kosakata cukup!"}
                        {ms.scoreGap > 0 ? `, naikkan skor +${ms.scoreGap}%` : ""}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. MULTI-DIMENSIONAL SKILL EVALUATION */}
      <Card className="border-border/80 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base font-semibold">
                Multi-Dimensional Articulation Breakdown
              </CardTitle>
              <CardDescription className="text-xs">
                Performa rata-rata berdasarkan penilaian audio &amp; transkrip Anda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Fluency */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-foreground">Fluency &amp; Cadence</span>
                <span className="font-mono font-bold text-primary">{report.averageScores.fluency}%</span>
              </div>
              <Progress value={report.averageScores.fluency} className="h-2" />
              <p className="text-[10px] text-muted-foreground">Kelancaran tempo bicara dan minimnya jeda ragu.</p>
            </div>

            {/* Grammar */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-foreground">Grammar Accuracy</span>
                <span className="font-mono font-bold text-primary">{report.averageScores.grammar}%</span>
              </div>
              <Progress value={report.averageScores.grammar} className="h-2" />
              <p className="text-[10px] text-muted-foreground">Ketepatan tenses, subjek-predikat, dan struktur kalimat.</p>
            </div>

            {/* Vocabulary */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-foreground">Lexical Variety</span>
                <span className="font-mono font-bold text-primary">{report.averageScores.vocabulary}%</span>
              </div>
              <Progress value={report.averageScores.vocabulary} className="h-2" />
              <p className="text-[10px] text-muted-foreground">Kekayaan istilah teknis dan workplace idioms.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
