"use client";

import { useState } from "react";
import {
  Sparkles,
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Award,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { jobTrackerService } from "@/services";
import type {
  JobApplication,
  JobInterview,
  MockInterviewAnswerEvaluation,
  PredictedQuestion,
} from "@/services/job-tracker/types";

interface MockInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication;
  interview: JobInterview;
}

export function MockInterviewDialog({
  open,
  onOpenChange,
  application,
  interview,
}: MockInterviewDialogProps) {
  const questions: PredictedQuestion[] = interview.aiPredictedQuestions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<MockInterviewAnswerEvaluation | null>(null);
  const [completedScores, setCompletedScores] = useState<Record<number, number>>({});

  const currentQuestion = questions[currentIndex] || {
    question: `Why do you want to join ${application.companyName} as a ${application.jobTitle}?`,
    category: "role_fit",
    tip: "Align your personal career trajectory with company vision and tech stack.",
    sampleAnswer: "",
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim() || userAnswer.trim().length < 20) {
      toast.error("Please provide a more detailed answer (at least 1-2 sentences) to evaluate.");
      return;
    }

    setIsEvaluating(true);
    try {
      const result = await jobTrackerService.aiEvaluateMockAnswer({
        jobTitle: application.jobTitle,
        companyName: application.companyName,
        stageType: interview.stageType,
        question: currentQuestion.question,
        category: currentQuestion.category,
        userAnswer: userAnswer.trim(),
      });

      setEvaluation(result);
      setCompletedScores((prev) => ({ ...prev, [currentIndex]: result.score }));
      toast.success(`Answer evaluated! Score: ${result.score}/10`);
    } catch (err: unknown) {
      console.error("Evaluation error:", err);
      toast.error((err as Error).message || "Failed to evaluate answer.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setEvaluation(null);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setUserAnswer("");
      setEvaluation(null);
    }
  };

  const handleResetSession = () => {
    setCurrentIndex(0);
    setUserAnswer("");
    setEvaluation(null);
    setCompletedScores({});
  };

  const averageScore = Object.values(completedScores).length > 0
    ? (Object.values(completedScores).reduce((a, b) => a + b, 0) / Object.values(completedScores).length).toFixed(1)
    : null;

  const getVerdictStyle = (verdict?: string) => {
    switch (verdict) {
      case "excellent":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "good":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "needs_improvement":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      default:
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border/70 bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-500" />
                Interactive AI Mock Interviewer
              </DialogTitle>
              <DialogDescription className="text-xs">
                Simulating interview for <strong>{interview.title}</strong> at{" "}
                <strong>{application.companyName}</strong>.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              {averageScore && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1 text-xs">
                  <Award className="w-3.5 h-3.5" /> Avg Score: {averageScore}/10
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleResetSession} className="text-xs h-7 gap-1 text-muted-foreground">
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          {questions.length > 0 && (
            <div className="pt-2 space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{Object.keys(completedScores).length} completed</span>
              </div>
              <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5" />
            </div>
          )}
        </DialogHeader>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Question Card */}
          <div className="p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-600 border-purple-500/30">
                {currentQuestion.category.replace("_", " ")}
              </Badge>

              {completedScores[currentIndex] !== undefined && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Score: {completedScores[currentIndex]}/10
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-foreground">
              &quot;{currentQuestion.question}&quot;
            </h3>

            {currentQuestion.tip && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Interviewer Strategy: {currentQuestion.tip}</span>
              </p>
            )}
          </div>

          {/* Answer Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Your Spoken / Typed Response:
              </span>
              <span className="text-muted-foreground text-[11px] font-mono">
                {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <Textarea
              rows={5}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Structure your answer using STAR (Situation, Task, Action, Result) or articulate your technical trade-offs..."
              className="text-xs leading-relaxed font-sans"
              disabled={isEvaluating}
            />

            <div className="flex justify-between items-center pt-1">
              <div className="text-[11px] text-muted-foreground">
                💡 <em>Tip: Mention specific metrics, technical decisions, and business impact.</em>
              </div>
              <Button
                onClick={handleEvaluate}
                disabled={isEvaluating || !userAnswer.trim()}
                size="sm"
                className="gap-2 text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    AI Grading & Analyzing...
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" />
                    Grade My Response
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Feedback Report (when evaluated) */}
          {evaluation && (
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 animate-fade-in">
              {/* Score Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-black text-xl text-purple-600 dark:text-purple-400">
                    {evaluation.score}
                    <span className="text-xs font-normal text-muted-foreground">/10</span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold">Evaluation Verdict</div>
                    <Badge variant="outline" className={`text-xs capitalize font-bold ${getVerdictStyle(evaluation.verdict)}`}>
                      {evaluation.verdict.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Hiring Bar</span>
                  <div className="text-xs font-bold text-foreground">
                    {evaluation.score >= 7 ? "✅ Passing Standard" : "⚠️ Needs Refinement"}
                  </div>
                </div>
              </div>

              {/* Strengths and Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> What You Did Well
                  </div>
                  <ul className="space-y-1 text-xs text-foreground">
                    {evaluation.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Areas to Polish
                  </div>
                  <ul className="space-y-1 text-xs text-foreground">
                    {evaluation.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* STAR Breakdown if present */}
              {evaluation.starBreakdown && (evaluation.starBreakdown.situation || evaluation.starBreakdown.result) && (
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2 text-xs">
                  <div className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                    STAR Framework Alignment
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-background border border-border/40">
                      <span className="font-bold text-primary">S:</span> {evaluation.starBreakdown.situation || "Implicit"}
                    </div>
                    <div className="p-2 rounded bg-background border border-border/40">
                      <span className="font-bold text-primary">T:</span> {evaluation.starBreakdown.task || "Implicit"}
                    </div>
                    <div className="p-2 rounded bg-background border border-border/40">
                      <span className="font-bold text-primary">A:</span> {evaluation.starBreakdown.action || "Implicit"}
                    </div>
                    <div className="p-2 rounded bg-background border border-border/40">
                      <span className="font-bold text-primary">R:</span> {evaluation.starBreakdown.result || "Missing"}
                    </div>
                  </div>
                </div>
              )}

              {/* Upgraded Model Answer */}
              {evaluation.refinedAnswer && (
                <div className="space-y-1.5 p-3.5 rounded-xl border border-border/70 bg-muted/10">
                  <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    How a Staff/Senior Engineer Would Phrase This:
                  </div>
                  <p className="text-xs text-foreground leading-relaxed italic bg-card p-3 rounded-lg border border-border/40">
                    &quot;{evaluation.refinedAnswer}&quot;
                  </p>
                </div>
              )}

              {/* Follow-up question preview */}
              {evaluation.followUpQuestion && (
                <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs space-y-1">
                  <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Expected Probing Follow-Up:
                  </div>
                  <p className="text-foreground italic">&quot;{evaluation.followUpQuestion}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-muted/20 border-t border-border/60 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevQuestion}
            disabled={currentIndex === 0}
            className="text-xs gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous Question
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Finish Session
            </Button>
            <Button
              size="sm"
              onClick={handleNextQuestion}
              disabled={currentIndex >= questions.length - 1}
              className="text-xs gap-1 bg-primary"
            >
              Next Question <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
