"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAtsScoreColor } from "@/lib/job-tracker";
import type { JobApplication } from "@/services/job-tracker/types";
import { ExportTailoredCvDialog } from "./export-tailored-cv-dialog";

interface TabCvTailoringProps {
  application: JobApplication;
  isAnalyzingATS: boolean;
  onRunATSAnalysis: () => void;
  onCopyText: (text?: string, label?: string) => void;
}

export function TabCvTailoring({
  application,
  isAnalyzingATS,
  onRunATSAnalysis,
  onCopyText,
}: TabCvTailoringProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const atsColor = getAtsScoreColor(application.atsScore);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              Gemini AI Resume Matcher & ATS Optimizer
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Tailor your master experience to align specifically with this job description
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setIsExportOpen(true)}
              className="gap-2 text-xs h-9 px-4 rounded-xl border-white/[0.12] bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] font-medium transition-all"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Export Tailored CV (PDF / MD)</span>
            </Button>

            <Button
              onClick={onRunATSAnalysis}
              disabled={isAnalyzingATS}
              className="gap-2 text-xs h-9 px-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
            >
              {isAnalyzingATS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Optimizing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{application.atsAnalysis ? "Re-Analyze & Re-Tailor" : "Analyze & Tailor CV"}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {application.atsAnalysis ? (
          <div className="space-y-6 pt-2">
            {/* Score and Match Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-5 rounded-2xl border ${atsColor.bgColor} ${atsColor.borderColor} flex flex-col justify-center shadow-lg`}
              >
                <div className="text-xs text-gray-300 font-semibold uppercase tracking-wider">ATS Match Score</div>
                <div className={`text-4xl sm:text-5xl font-extrabold mt-1 font-mono ${atsColor.color}`}>
                  {application.atsScore}%
                </div>
                <div className="text-xs font-bold mt-1 text-white">{atsColor.label}</div>
              </div>

              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#131726] md:col-span-2 space-y-2 shadow-lg">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  AI Match Summary
                </div>
                <p className="text-xs text-gray-200 leading-relaxed">
                  {application.atsAnalysis.summaryFeedback}
                </p>
              </div>
            </div>

            {/* Strengths & Missing Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-3 shadow-lg">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Matching Strengths in Your CV</span>
                </div>
                <ul className="space-y-2 text-xs text-gray-200">
                  {(application.atsAnalysis.matchStrengths || []).map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-3 shadow-lg">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Missing Keywords & Skill Gaps</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(application.atsAnalysis.missingKeywords || []).map((kw, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[11px] bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Tailored Professional Summary */}
            {application.tailoredSummary && (
              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#131726] space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Tailored Professional Summary (For this Application)</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyText(application.tailoredSummary, "Summary")}
                    className="text-xs gap-1 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </Button>
                </div>
                <p className="text-xs leading-relaxed bg-[#08090C] p-3.5 rounded-xl border border-white/[0.06] text-gray-200 font-mono">
                  {application.tailoredSummary}
                </p>
              </div>
            )}

            {/* Tailored Bullet Points (XYZ Method) */}
            {application.tailoredBulletPoints && application.tailoredBulletPoints.length > 0 && (
              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#131726] space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>High-Impact Bullet Points (XYZ Method)</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Accomplished [X] as measured by [Y] by doing [Z]
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onCopyText(
                        application.tailoredBulletPoints?.map((b) => `• ${b.tailored}`).join("\n"),
                        "Bullet points"
                      )
                    }
                    className="text-xs gap-1 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {application.tailoredBulletPoints.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-white/[0.06] bg-[#08090C] space-y-1.5 text-xs"
                    >
                      {item.roleContext && (
                        <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/15 border border-primary/20">
                          {item.roleContext}
                        </span>
                      )}
                      <p className="font-semibold text-white pt-1">• {item.tailored}</p>
                      {item.rationale && (
                        <p className="text-[11px] text-gray-400 italic">
                          💡 {item.rationale}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tailored Cover Letter / Cold Message */}
            {application.coverLetter && (
              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#131726] space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Tailored Cover Letter / Cold Outreach Message</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyText(application.coverLetter, "Cover letter")}
                    className="text-xs gap-1 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Message</span>
                  </Button>
                </div>
                <pre className="text-xs leading-relaxed bg-[#08090C] p-4 rounded-xl border border-white/[0.06] text-gray-200 font-mono whitespace-pre-wrap custom-scrollbar">
                  {application.coverLetter}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <h3 className="font-bold text-base text-white">No AI Match Analysis Yet</h3>
            <p className="text-xs text-gray-400 max-w-md">
              Click the button below to compare your master CV with this job description. Gemini AI will compute your ATS score, reveal keyword gaps, and tailor your bullet points.
            </p>
            <Button
              onClick={onRunATSAnalysis}
              disabled={isAnalyzingATS}
              className="gap-2 mt-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 text-xs px-5 h-10"
            >
              {isAnalyzingATS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Gemini ATS Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Run ATS Analysis & Tailor CV</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <ExportTailoredCvDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        application={application}
      />
    </>
  );
}
