"use client";

import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Bot,
  CheckCircle2,
  Copy,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  Loader2,
  Mail,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { jobTrackerService } from "@/services";
import type { RejectionDiagnosticResult } from "@/services/job-tracker/types";

export interface PostMortemData {
  stageFailedAt: string;
  primaryReason: string;
  recruiterFeedback: string;
  lessonsLearned: string;
}

interface PostMortemDialogProps {
  isOpen: boolean;
  companyName: string;
  jobTitle: string;
  initialData?: Partial<PostMortemData>;
  onClose: () => void;
  onSave: (data: PostMortemData) => Promise<void>;
}

export function PostMortemDialog({
  isOpen,
  companyName,
  jobTitle,
  initialData,
  onClose,
  onSave,
}: PostMortemDialogProps) {
  const [stageFailedAt, setStageFailedAt] = useState(
    initialData?.stageFailedAt || "technical_interview"
  );
  const [primaryReason, setPrimaryReason] = useState(
    initialData?.primaryReason || "Skill / Tech Stack Mismatch"
  );
  const [recruiterFeedback, setRecruiterFeedback] = useState(initialData?.recruiterFeedback || "");
  const [lessonsLearned, setLessonsLearned] = useState(initialData?.lessonsLearned || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnostic, setDiagnostic] = useState<RejectionDiagnosticResult | null>(null);

  const handleRunAiDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const result = await jobTrackerService.aiDiagnoseRejection({
        jobTitle,
        companyName,
        stageFailedAt,
        primaryReason,
        recruiterFeedback,
        lessonsLearned,
      });

      setDiagnostic(result);
      if (!lessonsLearned.trim() && result.suggestedNextFocus) {
        setLessonsLearned(result.suggestedNextFocus);
      }
      toast.success("AI Diagnostic & Remediation Plan generated!");
    } catch (err: unknown) {
      console.error("Diagnosis error:", err);
      toast.error((err as Error).message || "Failed to generate rejection diagnosis.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave({
        stageFailedAt,
        primaryReason,
        recruiterFeedback,
        lessonsLearned,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base flex items-center gap-2">
                Application Post-Mortem & AI Diagnostic Copilot
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log reflection, diagnose root causes, and generate a skill remediation plan for{" "}
                <strong>{jobTitle}</strong> at <strong>{companyName}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stageFailed" className="text-xs font-semibold">
                Final Stage Reached
              </Label>
              <Select value={stageFailedAt} onValueChange={setStageFailedAt}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resume_screening">CV / Initial Screening</SelectItem>
                  <SelectItem value="hr_interview">HR Screening</SelectItem>
                  <SelectItem value="take_home_test">Take-Home Challenge</SelectItem>
                  <SelectItem value="technical_interview">Technical / Live Coding</SelectItem>
                  <SelectItem value="system_design">System Design</SelectItem>
                  <SelectItem value="user_interview">User / Team Lead</SelectItem>
                  <SelectItem value="final_leadership">Executive Leadership</SelectItem>
                  <SelectItem value="offering_stage">Offering Negotiation</SelectItem>
                  <SelectItem value="ghosted_no_reply">Ghosted / No Reply</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reasonCategory" className="text-xs font-semibold">
                Primary Factor
              </Label>
              <Select value={primaryReason} onValueChange={setPrimaryReason}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Skill / Tech Stack Mismatch">
                    Skill / Tech Stack Alignment
                  </SelectItem>
                  <SelectItem value="Found more senior candidate">
                    Found Candidate with More Domain Experience
                  </SelectItem>
                  <SelectItem value="Salary budget mismatch">Salary / Budget Mismatch</SelectItem>
                  <SelectItem value="Cultural / Communication Fit">
                    Communication / Cultural Fit
                  </SelectItem>
                  <SelectItem value="Position Cancelled / Hiring Freeze">
                    Headcount Frozen / Position Cancelled
                  </SelectItem>
                  <SelectItem value="Ghosted / Recruiter Stopped Responding">
                    No Response / Recruiter Ghosted
                  </SelectItem>
                  <SelectItem value="Other">Other Reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recruiterFeedback" className="text-xs font-semibold">
              Recruiter / Interviewer Feedback
            </Label>
            <Textarea
              id="recruiterFeedback"
              rows={2}
              placeholder="What specific feedback did the recruiter share?"
              value={recruiterFeedback}
              onChange={(e) => setRecruiterFeedback(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* AI Diagnostic Trigger Button */}
          <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="font-bold text-foreground">Run AI Rejection Diagnostic</div>
                <div className="text-[11px] text-muted-foreground">
                  Get Root Cause Analysis, Skill Remediation steps, and a Talent Bench closure email.
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleRunAiDiagnosis}
              disabled={isDiagnosing}
              className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white shrink-0 h-8"
            >
              {isDiagnosing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Diagnosing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Diagnose with Gemini
                </>
              )}
            </Button>
          </div>

          {/* Diagnostic Result Cards */}
          {diagnostic && (
            <div className="space-y-3 pt-1 animate-fade-in">
              {/* Root Cause Analysis */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1.5">
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Root Cause Analysis (RCA)
                </div>
                <p className="text-foreground leading-relaxed">{diagnostic.rootCauseAnalysis}</p>
              </div>

              {/* Remediation & Skill Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
                  <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Identified Skill Gaps
                  </div>
                  <ul className="space-y-1 text-foreground">
                    {diagnostic.skillGaps.map((sg, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{sg}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Remediation Action Plan
                  </div>
                  <ul className="space-y-1 text-foreground">
                    {diagnostic.remediationPlan.map((rp, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{rp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Graceful Talent Bench Closure Email */}
              <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-blue-500" />
                    Graceful &quot;Stay on Talent Bench&quot; Email Draft
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopyText(
                        `Subject: ${diagnostic.gracefulClosureEmail.subject}\n\n${diagnostic.gracefulClosureEmail.body}`,
                        "Closure Email"
                      )
                    }
                    className="h-6 text-[10px] gap-1 px-2 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                  >
                    <Copy className="w-2.5 h-2.5" /> Copy Email
                  </Button>
                </div>
                <div className="text-[11px] font-semibold text-muted-foreground">
                  Subject: {diagnostic.gracefulClosureEmail.subject}
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border/60 text-foreground whitespace-pre-wrap leading-relaxed text-[11px]">
                  {diagnostic.gracefulClosureEmail.body}
                </div>
              </div>
            </div>
          )}

          {/* Lessons Learned & Next Focus */}
          <div className="space-y-1.5">
            <Label
              htmlFor="lessonsLearned"
              className="text-xs flex items-center gap-1.5 text-primary font-bold"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Key Lesson & Next Strategic Focus
            </Label>
            <Textarea
              id="lessonsLearned"
              rows={2}
              placeholder="e.g. Sharpen distributed caching and Kafka consumer group mechanics..."
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              className="text-xs bg-primary/5 border-primary/20"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="gap-1.5 text-xs bg-primary">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Save Reflection & Post-Mortem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
