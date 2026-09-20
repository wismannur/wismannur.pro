import React from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  FrontendDifficulty,
  FrontendMasterySession,
  FrontendVerdict,
} from "@/services/frontend-mastery/types";

interface TabHistoryProps {
  sessions: FrontendMasterySession[];
  onSelectSession: (session: FrontendMasterySession) => void;
  onRetryTopic: (topicId: string, difficulty: FrontendDifficulty) => void;
}

export function TabHistory({
  sessions,
  onSelectSession,
  onRetryTopic,
}: TabHistoryProps) {
  const getVerdictBadge = (verdict?: FrontendVerdict | null) => {
    switch (verdict) {
      case "strong_hire":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
            <Trophy className="h-3 w-3" />
            Strong Hire
          </span>
        );
      case "hire":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-300">
            <CheckCircle2 className="h-3 w-3" />
            Hire
          </span>
        );
      case "lean_hire":
        return (
          <span className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
            Lean Hire
          </span>
        );
      case "lean_no_hire":
        return (
          <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            Lean No Hire
          </span>
        );
      case "no_hire":
        return (
          <span className="inline-flex items-center rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-300">
            Needs Polish
          </span>
        );
      default:
        return <span className="text-zinc-500 text-xs">—</span>;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatMinutes = (seconds: number) => {
    const mins = Math.max(1, Math.round(seconds / 60));
    return `${mins} min`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#22283E] pb-4">
        <div>
          <h2 className="text-base font-bold text-white">Evaluated Drill Archive</h2>
          <p className="text-xs text-zinc-400">
            Review past submissions, Senior Staff critiques, and model architectural solutions.
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-12 text-center">
          <History className="mx-auto h-8 w-8 text-zinc-500" />
          <h4 className="mt-3 text-sm font-semibold text-white">No completed drills yet</h4>
          <p className="mt-1 text-xs text-zinc-400">
            Complete your first challenge in the Arena to view detailed evaluation reports here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => {
            const verdict = sess.evaluationResult?.verdict;
            return (
              <div
                key={sess.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0C0E18] p-4 transition-all hover:border-indigo-500/30 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                      {sess.pillar.replace("_", " ")}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-[11px] text-zinc-400 capitalize">
                      {sess.difficulty}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(sess.updatedAt)}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white">{sess.topicTitle}</h3>

                  <div className="flex items-center gap-3 pt-1">
                    {getVerdictBadge(verdict)}
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {formatMinutes(sess.timeSpentSeconds)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      {sess.score ?? 0}%
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase">Score</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectSession(sess)}
                      className="border-white/[0.08] bg-[#131726] text-xs text-zinc-300 hover:text-white"
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      View Debrief
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetryTopic(sess.topicId, sess.difficulty)}
                      className="h-8 px-2 text-zinc-400 hover:text-white"
                      title="Retry this topic"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
