"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Volume2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Award,
  RotateCcw,
  Trash2,
  GitCommit,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTextToSpeech } from "../hooks/use-speech";
import {
  getRecentSessions,
  deleteSession,
  retryDrillSession,
} from "@/services/ai-english-fluency/actions";
import type { AiEnglishSession } from "@/services/ai-english-fluency/types";

interface TabHistoryProps {
  onRetrySession: (session: AiEnglishSession) => void;
}

export function TabHistory({ onRetrySession }: TabHistoryProps) {
  const queryClient = useQueryClient();
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const { speak } = useTextToSpeech();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["ai-english-recent-sessions"],
    queryFn: () => getRecentSessions(20),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => retryDrillSession(id),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["ai-english-recent-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-active-in-progress"] });
      toast.success("Scenario loaded into Daily Gym! Let's beat your previous score.");
      onRetrySession(newSession);
    },
    onError: () => {
      toast.error("Failed to retry scenario.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-english-recent-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-streak"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-analytics"] });
      toast.success("Session removed from history.");
    },
    onError: () => {
      toast.error("Failed to delete session.");
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm md:text-base font-semibold">Your Speaking Workout History</h3>
          <p className="text-xs text-muted-foreground">
            Review past drills, retry scenarios to beat your score, and listen back to Staff Engineer rewrites.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Loading practice history...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-2">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
          <h4 className="text-sm font-semibold">No practice sessions yet</h4>
          <p className="text-xs text-muted-foreground">
            Complete your first daily speaking workout in the &quot;Daily Gym&quot; tab to start your streak!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => {
            const isExpanded = expandedSessionId === sess.id;
            const dateDisplay = sess.createdAt
              ? format(new Date(sess.createdAt), "MMM d, yyyy • HH:mm")
              : "Recent";

            return (
              <Card
                key={sess.id}
                className="border-border/70 hover:border-border transition-all overflow-hidden bg-card"
              >
                <div
                  onClick={() => toggleExpand(sess.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono capitalize">
                        {sess.topicCategory}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {sess.targetLevel}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{dateDisplay}</span>
                    </div>
                    <div className="text-sm md:text-base font-semibold text-foreground">
                      {sess.topicTitle}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {sess.overallScore !== null && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary">
                        <Award className="w-3.5 h-3.5" />
                        {sess.overallScore}/100
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        retryMutation.mutate(sess.id);
                      }}
                      disabled={retryMutation.isPending}
                      className="h-8 px-2.5 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                      title="Practice this scenario again"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${retryMutation.isPending ? "animate-spin" : ""}`} />
                      <span>Retry</span>
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this session from history?")) {
                          deleteMutation.mutate(sess.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <CardContent className="border-t border-border/50 p-4 space-y-4 bg-muted/15 text-xs">
                    {/* Scenario */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Scenario Challenge
                      </div>
                      <p className="text-foreground/90">{sess.scenarioPrompt}</p>
                    </div>

                    {/* Spoken transcript */}
                    {sess.userSpeechTranscript && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Your Spoken Answer ({sess.durationSeconds}s)
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/60 italic text-foreground/90">
                          &ldquo;{sess.userSpeechTranscript}&rdquo;
                        </div>
                      </div>
                    )}

                    {/* Staff Upgrade */}
                    {sess.betterAlternative && (
                      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-purple-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Staff Engineer Upgrade:
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              speak(sess.betterAlternative!);
                            }}
                            className="h-6 px-2 text-[11px] text-purple-300 hover:bg-purple-500/10"
                          >
                            <Volume2 className="w-3 h-3 mr-1" /> Listen Studio Voice
                          </Button>
                        </div>
                        <p className="italic text-foreground font-medium">
                          &ldquo;{sess.betterAlternative}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Coach Feedback */}
                    {sess.feedbackSummary && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-1">
                        <span className="font-semibold text-primary">Coach Feedback:</span>
                        <p className="text-muted-foreground text-[11px]">{sess.feedbackSummary}</p>
                      </div>
                    )}

                    {/* Grammar Refinements (Git-Diff View) */}
                    {sess.grammarCorrections && sess.grammarCorrections.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <GitCommit className="w-3 h-3 text-primary" /> Grammar &amp; Phrasing Refinements ({sess.grammarCorrections.length})
                        </div>
                        <div className="space-y-2">
                          {sess.grammarCorrections.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-border/70 overflow-hidden bg-card/80 text-[11px]"
                            >
                              <div className="font-mono divide-y divide-border/30">
                                <div className="flex items-start gap-2 px-2.5 py-1.5 bg-red-500/10 text-red-400 border-l-2 border-red-500">
                                  <span className="select-none font-bold text-red-500/80">-</span>
                                  <span className="line-through decoration-red-400/60 font-sans">{item.original}</span>
                                </div>
                                <div className="flex items-start gap-2 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 font-medium">
                                  <span className="select-none font-bold text-emerald-500/80">+</span>
                                  <span className="font-sans">{item.corrected}</span>
                                </div>
                              </div>
                              <div className="p-2 bg-muted/20 border-t border-border/40 text-[11px] text-muted-foreground">
                                <span className="font-semibold text-foreground/80">Rule: </span>
                                {item.explanation}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
