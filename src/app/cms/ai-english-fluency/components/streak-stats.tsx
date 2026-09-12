"use client";

import React from "react";
import { Flame, Trophy, Clock, BookOpen, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AiEnglishStreak, TargetLevel } from "@/services/ai-english-fluency/types";

interface StreakStatsProps {
  streak: AiEnglishStreak | null;
  targetLevel: TargetLevel;
  onLevelChange: (level: TargetLevel) => void;
  isRefetching?: boolean;
  onSyncStreak?: () => void;
}

export function StreakStats({
  streak,
  targetLevel,
  onLevelChange,
  isRefetching,
  onSyncStreak,
}: StreakStatsProps) {
  const current = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;
  const totalMinutes = streak?.totalSpeakingMinutes ?? 0;
  const masteredVocab = streak?.masteredVocabCount ?? 0;

  return (
    <div className="flex flex-col gap-4 bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl p-4 md:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">
              Habit Tracker &amp; Milestones
            </h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px] gap-1 py-0 font-medium">
              <Sparkles className="w-3 h-3" /> Live Streaks
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consistency over intensity. Build automatic English speaking reflexes every single day.
          </p>
        </div>

        {/* Level Switcher & Sync Button Group */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-xl border border-border/60">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Target:</span>
            <Select value={targetLevel} onValueChange={(val) => onLevelChange(val as TargetLevel)}>
              <SelectTrigger className="h-7 w-[135px] text-xs font-semibold bg-background border-border/60 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1-A2" className="text-xs font-medium">
                  🌱 A1-A2 (Foundations)
                </SelectItem>
                <SelectItem value="B1" className="text-xs font-medium">
                  ⚡ B1 (Autonomous)
                </SelectItem>
                <SelectItem value="B2" className="text-xs font-medium">
                  🚀 B2 (Staff Engineer)
                </SelectItem>
                <SelectItem value="C1" className="text-xs font-medium">
                  👑 C1 (Executive)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {onSyncStreak && (
            <button
              onClick={onSyncStreak}
              disabled={isRefetching}
              className="h-9 px-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
              title="Synchronize streak with server"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-primary" : ""}`} />
              <span>{isRefetching ? "Syncing..." : "Sync"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {/* Streak */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-500 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold font-mono text-foreground leading-none">
              {current} <span className="text-xs font-normal text-muted-foreground">Days</span>
            </div>
            <div className="text-xs text-amber-500/90 font-medium mt-1">Current Streak</div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
          <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold font-mono text-foreground leading-none">
              {longest} <span className="text-xs font-normal text-muted-foreground">Days</span>
            </div>
            <div className="text-xs text-purple-400/90 font-medium mt-1">Personal Best</div>
          </div>
        </div>

        {/* Total Speaking Minutes */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
          <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold font-mono text-foreground leading-none">
              {totalMinutes} <span className="text-xs font-normal text-muted-foreground">Mins</span>
            </div>
            <div className="text-xs text-blue-400/90 font-medium mt-1">Speaking Time</div>
          </div>
        </div>

        {/* Mastered Vocabularies */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold font-mono text-foreground leading-none">
              {masteredVocab} <span className="text-xs font-normal text-muted-foreground">Phrases</span>
            </div>
            <div className="text-xs text-emerald-400/90 font-medium mt-1">Mastered Lexicon</div>
          </div>
        </div>
      </div>
    </div>
  );
}
