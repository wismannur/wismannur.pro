import React from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatsHeaderProps {
  stats: {
    totalTopics: number;
    totalMastered: number;
    totalPracticing: number;
    averageScore: number;
    completedDrillsCount: number;
  };
  isAiGenerating?: boolean;
}

export function StatsHeader({ stats, isAiGenerating }: StatsHeaderProps) {
  const masteryPercentage =
    stats.totalTopics > 0
      ? Math.round((stats.totalMastered / stats.totalTopics) * 100)
      : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-6 backdrop-blur-sm">
      {/* Background Radial Glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Title & Description */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              Career Hub • Senior Staff Engine
            </span>
            <Badge
              variant="outline"
              className={`border-emerald-500/30 bg-emerald-500/10 text-emerald-400 ${
                isAiGenerating ? "animate-pulse" : ""
              }`}
            >
              <Sparkles className={`mr-1 h-3 w-3 ${isAiGenerating ? "animate-spin" : ""}`} />
              Vertex AI (Gemini 3.8 Flash)
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Frontend Mastery Gym
          </h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Deliberate practice curriculum based on Big Tech interview standards (OpenAI, Meta, Google, Airbnb).
            Sharpen Core Concepts, JavaScript utilities, React components, and Frontend System Design with real-time Senior Staff AI evaluations.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          <div className="rounded-xl border border-[#22283E] bg-[#131726]/80 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Award className="h-3.5 w-3.5 text-indigo-400" />
              <span>Curriculum</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">{stats.totalTopics}</span>
              <span className="text-xs text-zinc-500">topics</span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">
              {masteryPercentage}% mastered
            </div>
          </div>

          <div className="rounded-xl border border-[#22283E] bg-[#131726]/80 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mastered</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-400">
                {stats.totalMastered}
              </span>
              <span className="text-xs text-zinc-500">/ {stats.totalTopics}</span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">
              Score &ge; 80% (Hire Bar)
            </div>
          </div>

          <div className="rounded-xl border border-[#22283E] bg-[#131726]/80 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              <span>In Practice</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold text-amber-400">
                {stats.totalPracticing}
              </span>
              <span className="text-xs text-zinc-500">active</span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">
              {stats.completedDrillsCount} drills evaluated
            </div>
          </div>

          <div className="rounded-xl border border-[#22283E] bg-[#131726]/80 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Average Score</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">
                {stats.averageScore > 0 ? `${stats.averageScore}%` : "—"}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">
              {stats.averageScore >= 85
                ? "Strong Hire Bar"
                : stats.averageScore >= 75
                ? "Solid Hire Bar"
                : "Continuous Polish"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
