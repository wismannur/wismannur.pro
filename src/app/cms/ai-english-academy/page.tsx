"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  Dumbbell,
  ArrowRight,
  Sparkles,
  BookMarked,
  RotateCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import { getEnglishFluencyStreak } from "@/services/ai-english-fluency/actions";
import type { TargetLevel } from "@/services/ai-english-fluency/types";
import { TabCurriculum } from "./components/tab-curriculum";
import { TabVocabVault } from "./components/tab-vocab-vault";
import { TabAnalytics } from "./components/tab-analytics";

const TAB_METADATA: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
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
  analytics: {
    title: "CEFR Growth Roadmap & Diagnostics",
    subtitle: "Track your score trajectory across Fluency, Grammar, and Vocabulary against international CEFR benchmarks.",
    icon: <TrendingUp className="w-4 h-4 text-purple-400" />,
  },
};

export default function CmsAiEnglishAcademyPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("curriculum");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("B1");

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
        pageTitle: "AI English Academy",
        summary: `Exploring structured developer English at target level ${targetLevel}. Mastered Lexicon: ${
          streak?.masteredVocabCount ?? 0
        } phrases. Active tab: ${activeTab}.`,
        filters: { targetLevel, activeTab },
        activeItems: [
          {
            id: "academy-status",
            name: "Academy Progress",
            details: `Mastered Vocab: ${streak?.masteredVocabCount ?? 0}, Level: ${targetLevel}`,
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
      queryClient.invalidateQueries({ queryKey: ["ai-english-analytics-report"] }),
    ]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              AI English Academy
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 font-mono font-normal">
                <BookMarked className="w-3 h-3 text-amber-500" /> Career Tracks &amp; Lexicon
              </Badge>
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            Structured English curriculum for software engineers. Study workplace dialogues, master technical collocations
            with spaced repetition (SRS), and track your CEFR milestone roadmap.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs h-8 border-border/70 hover:bg-muted/80 gap-1.5"
          >
            <Link href="/cms/ai-english-gym">
              <Dumbbell className="w-3.5 h-3.5 text-primary" />
              <span>Go to Gym</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </Link>
          </Button>
          <Badge variant="secondary" className="text-xs font-mono py-1 px-2.5 bg-muted/60 border border-border/60 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            CEFR Focus: {targetLevel}
          </Badge>
        </div>
      </div>

      {/* Academy Overview & Quick Control Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">
              Curriculum &amp; Knowledge Base
            </h2>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] gap-1 py-0 font-medium">
              <Sparkles className="w-3 h-3" /> freeCodeCamp Inspired
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Progress through real developer work scenarios from onboarding to Staff-level architecture defense.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Mastered Vocab Counter */}
          <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60">
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">Mastered Lexicon:</span>
            <span className="text-xs font-bold font-mono text-foreground">
              {streak?.masteredVocabCount ?? 0} phrases
            </span>
          </div>

          {/* Level Switcher */}
          <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-xl border border-border/60">
            <span className="text-xs font-medium text-muted-foreground">Track Level:</span>
            <Select value={targetLevel} onValueChange={(val) => setTargetLevel(val as TargetLevel)}>
              <SelectTrigger className="h-7 w-[135px] text-xs font-semibold bg-background border-border/60 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1-A2" className="text-xs font-medium">
                  🌱 A1-A2 (Junior)
                </SelectItem>
                <SelectItem value="B1" className="text-xs font-medium">
                  ⚡ B1 (Autonomous)
                </SelectItem>
                <SelectItem value="B2" className="text-xs font-medium">
                  🚀 B2 (Staff/Lead)
                </SelectItem>
                <SelectItem value="C1" className="text-xs font-medium">
                  👑 C1 (Executive)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSyncAllData}
            disabled={isRefetching}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            title="Refresh Curriculum & Deck Data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation (Academy: 3 Structured Tabs) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full bg-card/60 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 flex items-stretch gap-2 shadow-sm h-auto overflow-x-auto scrollbar-none">
          <TabsTrigger
            value="curriculum"
            className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-xs md:text-sm leading-tight">Career Tracks</span>
              <span className="text-[10px] opacity-80 font-normal">A2 • B1 • B2 Units</span>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="vocab-vault"
            className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-xs md:text-sm leading-tight">Lexicon Vault</span>
              <span className="text-[10px] opacity-80 font-normal">SRS Flashcards</span>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="analytics"
            className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=active]:border-primary/40 transition-all font-medium"
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-xs md:text-sm leading-tight">CEFR Roadmap</span>
              <span className="text-[10px] opacity-80 font-normal">Growth &amp; Diagnostics</span>
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
            {activeTab.replace("-", " ")}
          </Badge>
        </div>

        {/* Tab 1: Guided Curriculum Tracks (freeCodeCamp A2/B1 inspired) */}
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

        {/* Tab 3: Analytics & CEFR Roadmap */}
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
