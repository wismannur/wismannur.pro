"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Languages,
  Dumbbell,
  BookOpen,
  History,
  TrendingUp,
  Flame,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import { getEnglishFluencyStreak } from "@/services/ai-english-fluency/actions";
import type { TargetLevel } from "@/services/ai-english-fluency/types";
import { StreakStats } from "./components/streak-stats";
import { TabDailyGym } from "./components/tab-daily-gym";
import { TabCurriculum } from "./components/tab-curriculum";
import { TabVocabVault } from "./components/tab-vocab-vault";
import { TabHistory } from "./components/tab-history";
import { TabAnalytics } from "./components/tab-analytics";

const TAB_METADATA: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
  "daily-gym": {
    title: "Daily Deliberate Speaking Gym",
    subtitle: "Real-world engineering scenarios with interactive 2-turn pushback from an AI Senior Staff Engineer.",
    icon: <Dumbbell className="w-4 h-4 text-primary" />,
  },
  curriculum: {
    title: "Guided Developer Career Tracks",
    subtitle: "Structured modules inspired by freeCodeCamp. Listen to dialogues, solve micro-checks, and defend in spoken role-plays.",
    icon: <GraduationCap className="w-4 h-4 text-amber-400" />,
  },
  "vocab-vault": {
    title: "Lexicon & Workplace Phrasing Vault",
    subtitle: "Curated high-impact technical phrases, idioms, and collocations with Spaced Repetition (SRS) flashcards.",
    icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
  },
  history: {
    title: "Practice History & Audio Archives",
    subtitle: "Revisit your past practice runs, audio playbacks, scores, and Git-diff grammar refinements.",
    icon: <History className="w-4 h-4 text-blue-400" />,
  },
  analytics: {
    title: "CEFR Growth Roadmap & Diagnostics",
    subtitle: "Track your score trajectory across Fluency, Grammar, and Vocabulary against international CEFR benchmarks.",
    icon: <TrendingUp className="w-4 h-4 text-purple-400" />,
  },
};

export default function CmsAiEnglishFluencyPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("daily-gym");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("A1-A2");

  const {
    data: streak = null,
    refetch: refetchStreak,
    isRefetching,
  } = useQuery({
    queryKey: ["ai-english-streak"],
    queryFn: () => getEnglishFluencyStreak(),
  });

  // Expose live context to CMS Copilot
  useRegisterCmsPageContext(
    useMemo(() => {
      return {
        pageTitle: "AI English Fluency Hub",
        summary: `Currently practicing English fluency at level ${targetLevel}. Current Streak: ${
          streak?.currentStreak ?? 0
        } days. Mastered Lexicon: ${streak?.masteredVocabCount ?? 0} phrases.`,
        filters: { targetLevel, activeTab },
        activeItems: [
          {
            id: "fluency-status",
            name: "English Habit Tracker",
            details: `Streak: ${streak?.currentStreak ?? 0}d, Speaking Time: ${
              streak?.totalSpeakingMinutes ?? 0
            }m`,
          },
        ],
      };
    }, [streak, targetLevel, activeTab])
  );

  const handleSyncAllData = async () => {
    await refetchStreak();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ai-english-curriculum-tracks"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-english-vocabularies"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-english-recent-sessions"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-english-analytics"] }),
    ]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Languages className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              AI English Fluency Hub
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 gap-1 font-mono font-normal">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500/20" /> Deliberate Practice
              </Badge>
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            Daily English habit loop grounded in your real-world tech stack &amp; AI Knowledge Hub. Designed to elevate
            your speaking reflexes, articulation, and vocabulary from A1 to strong B2.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="secondary" className="text-xs font-mono py-1 px-2.5 bg-muted/60 border border-border/60 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            CEFR Target: {targetLevel}
          </Badge>
        </div>
      </div>

      {/* Streak & Milestone Stats Banner */}
      <StreakStats
        streak={streak}
        targetLevel={targetLevel}
        onLevelChange={setTargetLevel}
        isRefetching={isRefetching}
        onSyncStreak={handleSyncAllData}
      />

      {/* Main Tabs Navigation (Expansive Responsive Segmented Bar) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full bg-card/60 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 flex items-stretch gap-1.5 overflow-x-auto scrollbar-none shadow-sm h-auto">
          <TabsTrigger
            value="daily-gym"
            className="flex-1 min-w-[135px] sm:min-w-0 py-2.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs md:text-sm">
              <Dumbbell className="w-4 h-4 shrink-0" />
              <span>Daily Gym</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">Ad-hoc Drill</span>
          </TabsTrigger>

          <TabsTrigger
            value="curriculum"
            className="flex-1 min-w-[135px] sm:min-w-0 py-2.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs md:text-sm">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Curriculum</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">A2 • B1 • B2</span>
          </TabsTrigger>

          <TabsTrigger
            value="vocab-vault"
            className="flex-1 min-w-[135px] sm:min-w-0 py-2.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs md:text-sm">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Lexicon Vault</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">SRS Review</span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="flex-1 min-w-[135px] sm:min-w-0 py-2.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs md:text-sm">
              <History className="w-4 h-4 shrink-0" />
              <span>History</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">Recordings</span>
          </TabsTrigger>

          <TabsTrigger
            value="analytics"
            className="flex-1 min-w-[135px] sm:min-w-0 py-2.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs md:text-sm">
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Roadmap</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Active Tab Contextual Strip */}
        <div className="px-4 py-2.5 rounded-xl bg-card/40 border border-border/60 flex items-center justify-between gap-3 text-xs text-muted-foreground animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 min-w-0">
            {TAB_METADATA[activeTab]?.icon}
            <span className="font-semibold text-foreground shrink-0">
              {TAB_METADATA[activeTab]?.title}:
            </span>
            <span className="truncate hidden sm:inline">
              {TAB_METADATA[activeTab]?.subtitle}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono shrink-0 uppercase tracking-wider py-0">
            {activeTab.replace("-", " ")}
          </Badge>
        </div>

        {/* Tab 1: Daily Gym */}
        <TabsContent
          value="daily-gym"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <TabDailyGym
            currentStreak={streak}
            targetLevel={targetLevel}
            onSessionCompleted={() => refetchStreak()}
          />
        </TabsContent>

        {/* Tab 2: Guided Curriculum Tracks (freeCodeCamp A2/B1 inspired) */}
        <TabsContent
          value="curriculum"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <TabCurriculum onProgressUpdated={() => refetchStreak()} />
        </TabsContent>

        {/* Tab 2: Vocabulary & Phrasing Vault */}
        <TabsContent
          value="vocab-vault"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <TabVocabVault
            targetLevel={targetLevel}
            onVocabUpdated={() => refetchStreak()}
          />
        </TabsContent>

        {/* Tab 3: History */}
        <TabsContent
          value="history"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <TabHistory
            onRetrySession={(session) => {
              queryClient.setQueryData(["ai-english-active-in-progress"], session);
              setActiveTab("daily-gym");
            }}
          />
        </TabsContent>

        {/* Tab 4: Analytics & CEFR Roadmap */}
        <TabsContent
          value="analytics"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <TabAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
