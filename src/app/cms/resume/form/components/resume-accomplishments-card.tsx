"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  Sparkles,
  Info,
  Brain,
  Share2,
  Loader2,
  GripHorizontal,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { ResumeFormValues } from "../resume-form-schema";

interface ResumeAccomplishmentsCardProps {
  form: UseFormReturn<ResumeFormValues>;
  isExperience: boolean;
  isSyncing: boolean;
  isPolishing: boolean;
  onSyncToSecondBrain: () => void;
  onPolish: () => void;
  descriptionHeight: number;
  setDescriptionHeight: React.Dispatch<React.SetStateAction<number>>;
  handleMouseDownDescriptionResize: (e: React.MouseEvent) => void;
  handleTouchStartDescriptionResize: (e: React.TouchEvent) => void;
}

export function ResumeAccomplishmentsCard({
  form,
  isExperience,
  isSyncing,
  isPolishing,
  onSyncToSecondBrain,
  onPolish,
  descriptionHeight,
  setDescriptionHeight,
  handleMouseDownDescriptionResize,
  handleTouchStartDescriptionResize,
}: ResumeAccomplishmentsCardProps) {
  return (
    <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="p-6 pb-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Role Summary, Accomplishments & Quantifiable Impact</span>
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Structured impact framing with STAR statements or bullet achievements
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
          <Info className="h-3 w-3 text-primary" />
          <span>Problem &bull; Role &bull; Action &bull; Quantifiable results</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* My Second Brain Persona Assistant Bar */}
        {isExperience && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-4 rounded-xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-slate-900/40 border border-purple-500/25 shadow-lg shadow-purple-950/10">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Brain className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">My Second Brain Co-Pilot</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                    Digital Twin SSOT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Synthesize verified XYZ impact bullets or export this role directly to your knowledge base.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSyncToSecondBrain}
                disabled={isSyncing || isPolishing}
                className="h-8 text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-white rounded-lg transition-colors"
                title="Export current accomplishments to My Second Brain as a Career Impact item"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                    <span>Sync to Brain</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={onPolish}
                disabled={isPolishing || isSyncing}
                className="h-8 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-purple-600/20 rounded-lg transition-all"
              >
                {isPolishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Consulting Brain...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-300" />
                    <span>Polish with Second Brain</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FormLabel className="text-slate-200 text-xs font-semibold">
                  Accomplishments Details
                </FormLabel>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1 font-mono">
                    <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDescriptionHeight((prev) => (prev > 180 ? 140 : 280));
                    }}
                    className="h-6 w-6 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    title={descriptionHeight > 180 ? "Collapse height" : "Expand height"}
                  >
                    {descriptionHeight > 180 ? (
                      <Minimize2 className="h-3 w-3" />
                    ) : (
                      <Maximize2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-inner">
                <FormControl>
                  <Textarea
                    placeholder={
                      isExperience
                        ? "Problem: High p99 API latency across microservices.\nRole: Lead Backend & Distributed Systems Architect.\nAction: Re-architected data pipelines with Go microservices, Redis caching, and async job queues.\nQuantifiable results: 420% throughput gain and $18k/month cloud cost reduction."
                        : "Dean's Honor List (4 semesters), Focus in Distributed Systems and Compilers, Capstone Thesis: High-Throughput RAFT Consensus Engine."
                    }
                    style={{ height: `${descriptionHeight}px` }}
                    className="w-full text-xs resize-none rounded-none border-0 bg-transparent text-slate-100 placeholder:text-slate-500 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto custom-scrollbar font-mono sm:font-sans"
                    {...field}
                  />
                </FormControl>
                {/* Bottom Drag Handle Bar to Resize Inside Field */}
                <div
                  onMouseDown={handleMouseDownDescriptionResize}
                  onTouchStart={handleTouchStartDescriptionResize}
                  className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
                  title="Drag handle to resize accomplishments"
                >
                  <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-16 transition-all duration-200" />
                </div>
              </div>
              <FormMessage className="text-xs text-rose-400" />
            </FormItem>
          )}
        />

        {/* Guide Note Box */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span>
              Sentences starting with <code className="text-slate-200 font-mono bg-white/[0.04] px-1 py-0.5 rounded">Problem:</code>, <code className="text-slate-200 font-mono bg-white/[0.04] px-1 py-0.5 rounded">Role:</code>, <code className="text-slate-200 font-mono bg-white/[0.04] px-1 py-0.5 rounded">Action:</code>, or <code className="text-slate-200 font-mono bg-white/[0.04] px-1 py-0.5 rounded">Quantifiable results:</code> automatically receive prominent visual badge styling on the public About page.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
