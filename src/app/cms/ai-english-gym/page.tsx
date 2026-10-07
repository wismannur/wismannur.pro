"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dumbbell,
  History,
  Flame,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import { getEnglishFluencyStreak } from "@/services/ai-english-fluency/actions";
import type { TargetLevel } from "@/services/ai-english-fluency/types";
import { StreakStats } from "./components/streak-stats";
import { TabDailyGym } from "./components/tab-daily-gym";
import { TabHistory } from "./components/tab-history";

const TAB_METADATA: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
  "daily-gym": {
    title: "Daily Speaking Sparring",
    subtitle: "Real-world tech scenarios with interactive 2-turn pushback from an AI Senior Staff Engineer.",
    icon: <Dumbbell className="w-4 h-4 text-primary" />,
  },
  history: {
    title: "Sparring Archives & Audio Recordings",
    subtitle: "Revisit your past practice runs, listen to audio playback, examine score breakdowns, and retry scenarios.",
    icon: <History className="w-4 h-4 text-blue-400" />,
  },
};

export default function CmsAiEnglishGymPage() {
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
        pageTitle: "AI English Gym",
        summary: `Currently practicing English fluency at level ${targetLevel}. Current Streak: ${
          streak?.currentStreak ?? 0
        } days. Total Speaking Minutes: ${streak?.totalSpeakingMinutes ?? 0}m.`,
        filters: { targetLevel, activeTab },
        activeItems: [
          {
            id: "gym-status",
            name: "Speaking Habit Tracker",
            details: `Streak: ${streak?.currentStreak ?? 0}d, Speaking: ${
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
              <Dumbbell className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              AI English Gym
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 gap-1 font-mono font-normal">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500/20" /> High-Intensity Sparring
              </Badge>
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            High-intensity technical speaking workout. Spar with an AI Senior Staff Engineer, master spontaneous
            articulation under pressure, and refine communication reflexes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs h-8 border-border/70 hover:bg-muted/80 gap-1.5"
          >
            <Link href="/cms/ai-english-academy">
              <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
              <span>Go to Academy</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </Link>
          </Button>
          <Badge variant="secondary" className="text-xs font-mono py-1 px-2.5 bg-muted/60 border border-border/60 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Target: {targetLevel}
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

      {/* Main Tabs Navigation (Gym: 2 Focused Tabs) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full bg-card/60 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 flex items-stretch gap-2 shadow-sm h-auto">
          <TabsTrigger
            value="daily-gym"
            className="flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <Dumbbell className="w-4 h-4 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-xs md:text-sm leading-tight">Daily Sparring</span>
              <span className="text-[10px] opacity-80 font-normal">AI Pushback Drills</span>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <History className="w-4 h-4 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-xs md:text-sm leading-tight">Sparring Archives</span>
              <span className="text-[10px] opacity-80 font-normal">Recordings &amp; Retries</span>
            </div>
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
            {activeTab === "daily-gym" ? "Live Drill" : "Archive"}
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

        {/* Tab 2: History & Recordings */}
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
      </Tabs>
    </div>
  );
}
