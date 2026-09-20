import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FileCode,
  Layers,
  Network,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CurriculumTopic,
  FrontendDifficulty,
  FrontendMasteryProgressItem,
  FrontendPillar,
  PillarMetadata,
} from "@/services/frontend-mastery/types";

interface TabCurriculumProps {
  pillars: PillarMetadata[];
  topics: CurriculumTopic[];
  progressByTopic: Record<string, FrontendMasteryProgressItem>;
  activeSessionTopicId?: string | null;
  onStartTopic: (topicId: string, difficulty: FrontendDifficulty) => void;
  isLoadingSession?: boolean;
  selectedTopicIdStarting?: string | null;
}

export function TabCurriculum({
  pillars,
  topics,
  progressByTopic,
  activeSessionTopicId,
  onStartTopic,
  isLoadingSession,
  selectedTopicIdStarting,
}: TabCurriculumProps) {
  const [selectedPillar, setSelectedPillar] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchPillar = selectedPillar === "all" || t.pillar === selectedPillar;
      const matchDiff = selectedDifficulty === "all" || t.difficulty === selectedDifficulty;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.keyConcepts.some((k) => k.toLowerCase().includes(query)) ||
        t.bigTechContext.toLowerCase().includes(query);

      return matchPillar && matchDiff && matchSearch;
    });
  }, [topics, selectedPillar, selectedDifficulty, searchQuery]);

  const getPillarIcon = (pillar: FrontendPillar) => {
    switch (pillar) {
      case "concepts":
        return <Layers className="h-4 w-4 text-blue-400" />;
      case "javascript":
        return <FileCode className="h-4 w-4 text-amber-400" />;
      case "react":
        return <Zap className="h-4 w-4 text-cyan-400" />;
      case "system_design":
        return <Network className="h-4 w-4 text-purple-400" />;
    }
  };

  const getDifficultyBadge = (difficulty: FrontendDifficulty) => {
    switch (difficulty) {
      case "mid":
        return (
          <span className="inline-flex items-center rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
            L4 • Mid
          </span>
        );
      case "senior":
        return (
          <span className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            L5 • Senior
          </span>
        );
      case "staff":
        return (
          <span className="inline-flex items-center rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-300">
            L6 • Staff
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Pillar Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#22283E] pb-4">
        <button
          type="button"
          onClick={() => setSelectedPillar("all")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            selectedPillar === "all"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              : "border border-white/[0.06] bg-[#0C0E18] text-zinc-400 hover:border-white/[0.12] hover:text-white"
          }`}
        >
          <span>All 4 Pillars</span>
          <span className="rounded-md bg-black/30 px-1.5 py-0.5 text-[10px]">
            {topics.length}
          </span>
        </button>

        {pillars.map((p) => {
          const isSelected = selectedPillar === p.pillar;
          const count = topics.filter((t) => t.pillar === p.pillar).length;
          return (
            <button
              key={p.pillar}
              type="button"
              onClick={() => setSelectedPillar(p.pillar)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "border border-white/[0.06] bg-[#0C0E18] text-zinc-400 hover:border-white/[0.12] hover:text-white"
              }`}
            >
              {getPillarIcon(p.pillar)}
              <span>{p.title.split(". ")[1]}</span>
              <span className="rounded-md bg-black/30 px-1.5 py-0.5 text-[10px]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search questions, concepts, algorithms, Big Tech contexts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-white/[0.08] bg-[#0C0E18] pl-10 text-xs text-white placeholder:text-zinc-500 focus:border-indigo-500"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-zinc-500 mr-1">Level:</span>
          {(["all", "mid", "senior", "staff"] as const).map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedDifficulty === diff
                  ? "bg-[#22283E] text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {diff === "all" ? "All" : diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTopics.map((topic) => {
          const progress = progressByTopic[topic.id];
          const isMastered = progress?.masteryStatus === "mastered";
          const isPracticing = progress?.masteryStatus === "practicing";
          const isActiveSession = activeSessionTopicId === topic.id;
          const isStarting = selectedTopicIdStarting === topic.id && isLoadingSession;

          return (
            <div
              key={topic.id}
              className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 ${
                isActiveSession
                  ? "border-indigo-500/60 bg-[#0E1122] shadow-lg shadow-indigo-500/10"
                  : "border-white/[0.08] bg-[#0C0E18] hover:border-indigo-500/30 hover:bg-[#0E1120]"
              }`}
            >
              {/* Card Header: Category & Difficulty */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {getPillarIcon(topic.pillar)}
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      {topic.category}
                    </span>
                  </div>
                  {getDifficultyBadge(topic.difficulty)}
                </div>

                {/* Topic Title */}
                <h3 className="mt-3 text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {topic.title}
                </h3>

                {/* Description */}
                <p className="mt-1.5 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {topic.description}
                </p>

                {/* Big Tech Bar Context */}
                <div className="mt-3 rounded-lg border border-[#22283E]/60 bg-[#131726]/60 p-2.5 text-[11px] text-zinc-300">
                  <span className="font-semibold text-indigo-300">Target Bar: </span>
                  {topic.bigTechContext}
                </div>

                {/* Key Concepts Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {topic.keyConcepts.slice(0, 3).map((k) => (
                    <span
                      key={k}
                      className="rounded-md border border-white/[0.05] bg-white/[0.02] px-2 py-0.5 text-[10px] text-zinc-400"
                    >
                      {k}
                    </span>
                  ))}
                  {topic.keyConcepts.length > 3 && (
                    <span className="rounded-md border border-white/[0.05] bg-white/[0.02] px-1.5 py-0.5 text-[10px] text-zinc-400">
                      +{topic.keyConcepts.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Status & Start Button */}
              <div className="mt-5 border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between">
                  {/* Status Indicator */}
                  <div>
                    {isMastered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mastered ({progress.bestScore}%)</span>
                      </span>
                    ) : isPracticing ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Best: {progress.bestScore ?? 0}%</span>
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">Not started yet</span>
                    )}
                  </div>

                  {/* CTA Action */}
                  <Button
                    size="sm"
                    disabled={isLoadingSession}
                    onClick={() => onStartTopic(topic.id, topic.difficulty)}
                    className={`h-8 gap-1.5 rounded-lg px-3 text-xs font-medium transition-all ${
                      isActiveSession
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : "border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                    }`}
                  >
                    {isStarting ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-spin text-indigo-300" />
                        <span>Generating...</span>
                      </>
                    ) : isActiveSession ? (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Resume Arena</span>
                      </>
                    ) : isMastered ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Review & Drill</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>Start Challenge</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTopics.length === 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0C0E18] p-12 text-center">
          <Compass className="mx-auto h-8 w-8 text-zinc-500" />
          <h4 className="mt-3 text-sm font-semibold text-white">No topics found</h4>
          <p className="mt-1 text-xs text-zinc-400">
            Try adjusting your search keywords or level filter.
          </p>
        </div>
      )}
    </div>
  );
}
