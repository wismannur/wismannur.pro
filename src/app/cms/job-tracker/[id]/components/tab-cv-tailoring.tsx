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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="border-primary/30 shadow-sm bg-gradient-to-b from-primary/5 via-card to-card">
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Gemini AI Resume Matcher & ATS Optimizer
            </CardTitle>
            <CardDescription className="text-xs">
              Tailor your master experience to align with this job description
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsExportOpen(true)}
              className="gap-2 shadow-sm text-xs h-9 border-primary/30 hover:bg-primary/10"
            >
              <Download className="w-4 h-4 text-primary" />
              Export Tailored CV (PDF / Markdown)
            </Button>

            <Button onClick={onRunATSAnalysis} disabled={isAnalyzingATS} className="gap-2 shadow-sm text-xs h-9">
              {isAnalyzingATS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Optimizing with Gemini AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {application.atsAnalysis ? "Re-Analyze & Re-Tailor" : "Analyze & Tailor CV"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>

      {application.atsAnalysis ? (
        <CardContent className="space-y-6">
          {/* Score and Match Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl border ${atsColor.bgColor} ${atsColor.borderColor} flex flex-col justify-center`}
            >
              <div className="text-xs text-muted-foreground font-medium">ATS Match Score</div>
              <div className={`text-4xl font-extrabold mt-1 ${atsColor.color}`}>
                {application.atsScore}%
              </div>
              <div className="text-xs font-medium mt-1">{atsColor.label}</div>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card md:col-span-2 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                AI Match Summary
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {application.atsAnalysis.summaryFeedback}
              </p>
            </div>
          </div>

          {/* Strengths & Missing Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2.5">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Matching Strengths in Your CV
              </div>
              <ul className="space-y-1.5 text-xs">
                {(application.atsAnalysis.matchStrengths || []).map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2.5">
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Missing Keywords & Skill Gaps
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(application.atsAnalysis.missingKeywords || []).map((kw, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Tailored Professional Summary */}
          {application.tailoredSummary && (
            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  Tailored Professional Summary (For this Application)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyText(application.tailoredSummary, "Summary")}
                  className="text-xs gap-1 h-7"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </Button>
              </div>
              <p className="text-xs leading-relaxed bg-muted/40 p-3 rounded-lg border border-border/40 font-mono">
                {application.tailoredSummary}
              </p>
            </div>
          )}

          {/* Tailored Bullet Points (XYZ Method) */}
          {application.tailoredBulletPoints && application.tailoredBulletPoints.length > 0 && (
            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    High-Impact Bullet Points (XYZ Method)
                  </div>
                  <div className="text-[11px] text-muted-foreground">
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
                  className="text-xs gap-1 h-7"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy All
                </Button>
              </div>

              <div className="space-y-2.5">
                {application.tailoredBulletPoints.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1 text-xs"
                  >
                    {item.roleContext && (
                      <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                        {item.roleContext}
                      </span>
                    )}
                    <p className="font-medium text-foreground pt-1">• {item.tailored}</p>
                    {item.rationale && (
                      <p className="text-[11px] text-muted-foreground italic">
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
            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-500" />
                  Tailored Cover Letter / Cold Outreach Message
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyText(application.coverLetter, "Cover letter")}
                  className="text-xs gap-1 h-7"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Message
                </Button>
              </div>
              <pre className="text-xs leading-relaxed bg-muted/40 p-3.5 rounded-lg border border-border/40 font-mono whitespace-pre-wrap">
                {application.coverLetter}
              </pre>
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-base">No AI Match Analysis Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md">
            Click the button below to compare your master CV with this job description. Gemini AI
            will compute your ATS score, reveal keyword gaps, and tailor your bullet points.
          </p>
          <Button onClick={onRunATSAnalysis} disabled={isAnalyzingATS} className="gap-2 mt-2">
            {isAnalyzingATS ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Gemini ATS Analysis...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run ATS Analysis & Tailor CV
              </>
            )}
          </Button>
        </CardContent>
      )}
    </Card>

    <ExportTailoredCvDialog
      open={isExportOpen}
      onOpenChange={setIsExportOpen}
      application={application}
    />
  </>
  );
}
