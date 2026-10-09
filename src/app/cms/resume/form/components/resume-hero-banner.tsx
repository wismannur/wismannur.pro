"use client";

import React from "react";
import {
  Briefcase,
  GraduationCap,
  Sparkles,
  Loader2,
  Send,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeHeroBannerProps {
  isExperience: boolean;
  isPublished: boolean;
  periodPreview: string;
  watchedSortOrder: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ResumeHeroBanner({
  isExperience,
  isPublished,
  periodPreview,
  watchedSortOrder,
  isSubmitting,
  onCancel,
  onSubmit,
}: ResumeHeroBannerProps) {
  return (
    <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] border border-white/[0.08] shadow-2xl">
      <div className="absolute top-0 right-0 w-[450px] h-[240px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[280px] h-[140px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
              {isExperience ? (
                <Briefcase size={13} className="text-primary" />
              ) : (
                <GraduationCap size={13} className="text-primary" />
              )}
              <span>CAREER TIMELINE ARCHITECT</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Chronology Engine Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
              {isExperience ? "Work Experience" : "Education & Credential"}
            </span>
            {isPublished ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                Public / Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                Hidden Draft
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isExperience ? "Work Experience Profile" : "Education & Credential"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Record, calibrate, and polish chronological milestones with quantifiable STAR impact
            and Google XYZ formula bullets for recruiter discovery.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
            {periodPreview && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <span className="text-slate-500 font-medium">Timeline:</span>
                <span className="text-primary font-semibold">{periodPreview}</span>
              </div>
            )}
            {watchedSortOrder !== 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Pin Weight: <strong className="text-white font-bold">{watchedSortOrder}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Buttons on Hero Header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="gap-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 text-xs px-5 h-10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                {isPublished ? (
                  <>
                    <Send className="w-4 h-4 text-emerald-300" />
                    <span>Publish Entry</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>Save as Hidden</span>
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
