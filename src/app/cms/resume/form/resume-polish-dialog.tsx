"use client";

import React from "react";
import { Brain, CheckCircle2, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PolishResumeResult } from "@/services";

interface ResumePolishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polishResult: PolishResumeResult | null;
  hasExistingDescription: boolean;
  onApply: (mode: "replace" | "append") => void;
}

export function ResumePolishDialog({
  open,
  onOpenChange,
  polishResult,
  hasExistingDescription,
  onApply,
}: ResumePolishDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0C0E18] border-white/[0.08] text-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Brain className="h-4 w-4" />
            <span>Second Brain Experience Synthesis</span>
          </div>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <span>Grounded XYZ Accomplishment Bullets</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Synthesized from your verified Second Brain knowledge entries and role coordinates using Google&apos;s XYZ formula.
          </DialogDescription>
        </DialogHeader>

        {polishResult && (
          <div className="space-y-4 py-2">
            {/* Matched Second Brain Topics */}
            {polishResult.matchedSecondBrainTopics.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Referenced Second Brain Knowledge:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {polishResult.matchedSecondBrainTopics.map((topic, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px] px-2 py-0.5 rounded-md"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            {polishResult.highlights.length > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <span className="text-[11px] font-semibold text-amber-300">Executive Highlights:</span>
                <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc">
                  {polishResult.highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generated Polished Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Synthesized XYZ Bullets:</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(polishResult.polishedDescription);
                    toast.success("Copied to clipboard!");
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-[#131726] border border-purple-500/30 text-xs text-slate-100 font-mono sm:font-sans whitespace-pre-wrap leading-relaxed max-h-[280px] overflow-y-auto custom-scrollbar">
                {polishResult.polishedDescription}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white text-xs h-9 rounded-xl"
          >
            Discard
          </Button>
          {hasExistingDescription && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onApply("append")}
              className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs h-9 rounded-xl"
            >
              Append to Existing
            </Button>
          )}
          <Button
            type="button"
            onClick={() => onApply("replace")}
            className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-primary/20"
          >
            Replace Description
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
