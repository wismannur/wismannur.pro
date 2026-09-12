"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Play,
  Volume2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Mic,
  Square,
  Loader2,
  Check,
  Copy,
  HelpCircle,
  Clock,
  GitCommit,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useSpeechRecognition, useTextToSpeech } from "../hooks/use-speech";
import {
  getCurriculumTracksWithProgress,
  evaluateCurriculumRolePlay,
  submitCurriculumLessonProgress,
  synthesizeDialogueLine,
} from "@/services/ai-english-fluency/actions";
import type {
  CurriculumUnit,
  CurriculumLesson,
  CurriculumTrackLevel,
  DialogueTurn,
  GrammarCorrection,
} from "@/services/ai-english-fluency/types";

interface TabCurriculumProps {
  onProgressUpdated?: () => void;
}

export function TabCurriculum({ onProgressUpdated }: TabCurriculumProps) {
  const queryClient = useQueryClient();
  const [selectedTrackLevel, setSelectedTrackLevel] = useState<CurriculumTrackLevel>("B1");

  // Lesson Player State
  const [activeLesson, setActiveLesson] = useState<CurriculumLesson | null>(null);
  const [activeUnit, setActiveUnit] = useState<CurriculumUnit | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Audio Playback for Dialogue Turns
  const [playingDialogueTurnId, setPlayingDialogueTurnId] = useState<string | null>(null);
  const [loadingAudioTurnId, setLoadingAudioTurnId] = useState<string | null>(null);

  // Quiz State
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(100);

  // Role-Play Evaluation State
  const [isEvaluatingRolePlay, setIsEvaluatingRolePlay] = useState(false);
  const [rolePlayResult, setRolePlayResult] = useState<{
    spokenScore: number;
    fluencyScore: number;
    feedbackSummary: string;
    staffUpgrade: string;
    grammarCorrections: GrammarCorrection[];
  } | null>(null);
  const [copiedUpgrade, setCopiedUpgrade] = useState(false);
  const [copiedDiffIndex, setCopiedDiffIndex] = useState<number | null>(null);

  // STT hook for role-play challenge
  const {
    isRecording,
    transcript,
    setTranscript,
    recordingSeconds,
    audioLevel,
    recordedAudioBase64,
    isTranscribing,
    startRecording,
    stopRecording,
    resetTranscript,
    transcribeWithAi,
  } = useSpeechRecognition();

  // TTS hook for staff upgrade review
  const { speak, isPlaying: isTtsPlaying } = useTextToSpeech();

  // Query: Fetch Tracks and progress
  const {
    data: tracks = [],
  } = useQuery({
    queryKey: ["ai-english-curriculum-tracks"],
    queryFn: () => getCurriculumTracksWithProgress(),
  });

  const currentTrack = tracks.find((t) => t.level === selectedTrackLevel) || tracks[0];

  // Open Lesson Player
  const handleOpenLesson = (unit: CurriculumUnit, lesson: CurriculumLesson) => {
    setActiveUnit(unit);
    setActiveLesson(lesson);
    setCurrentStep(1);
    setUserQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(100);
    setRolePlayResult(null);
    resetTranscript();
  };

  // Close Lesson Player
  const handleCloseLesson = () => {
    if (isRecording) stopRecording();
    setActiveLesson(null);
    setActiveUnit(null);
    setCurrentStep(1);
  };

  // Play audio for a dialogue line
  const handlePlayDialogueTurn = async (turn: DialogueTurn) => {
    setLoadingAudioTurnId(turn.id);
    try {
      let audioUrl = turn.audioUrl;
      if (!audioUrl) {
        const res = await synthesizeDialogueLine({
          text: turn.text,
          speaker: turn.speaker,
        });
        audioUrl = res.audioUrl;
      }
      if (audioUrl) {
        setPlayingDialogueTurnId(turn.id);
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingDialogueTurnId(null);
        audio.onerror = () => setPlayingDialogueTurnId(null);
        await audio.play();
      } else {
        toast.info("Audio synthesis unavailable. You can read the dialogue above.");
      }
    } catch {
      toast.error("Failed to play dialogue line.");
      setPlayingDialogueTurnId(null);
    } finally {
      setLoadingAudioTurnId(null);
    }
  };

  // Submit Quiz (Step 2)
  const handleCheckQuiz = () => {
    if (!activeLesson) return;
    let correctCount = 0;
    activeLesson.quiz.forEach((q) => {
      const selectedId = userQuizAnswers[q.id];
      const correctOption = q.options.find((opt) => opt.isCorrect);
      if (selectedId && correctOption && selectedId === correctOption.id) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / activeLesson.quiz.length) * 100);
    setQuizScore(calculatedScore);
    setQuizSubmitted(true);

    if (calculatedScore === 100) {
      toast.success("Perfect score! All quiz answers are correct.");
    } else {
      toast.info(`You scored ${calculatedScore}%. Review the explanations below.`);
    }
  };

  // Submit Spoken Role-Play (Step 3)
  const handleSubmitRolePlay = async () => {
    if (!activeLesson || !activeUnit) return;
    if (isRecording) stopRecording();

    if (!transcript.trim()) {
      toast.warning("Please record or write your spoken response before submitting.");
      return;
    }

    setIsEvaluatingRolePlay(true);
    try {
      const evalResult = await evaluateCurriculumRolePlay({
        trackLevel: selectedTrackLevel,
        unitId: activeUnit.id,
        lessonId: activeLesson.id,
        userTranscript: transcript.trim(),
      });

      setRolePlayResult(evalResult);

      // Save progress to database
      await submitCurriculumLessonProgress({
        trackLevel: selectedTrackLevel,
        unitId: activeUnit.id,
        lessonId: activeLesson.id,
        quizScore: quizScore,
        spokenTranscript: transcript.trim(),
        spokenScore: evalResult.spokenScore,
        staffUpgradeFeedback: evalResult.staffUpgrade,
      });

      queryClient.invalidateQueries({ queryKey: ["ai-english-curriculum-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-streak"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-recent-sessions"] });
      onProgressUpdated?.();

      setCurrentStep(4);
      toast.success("Lesson mastered! Your progress and streak have been updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to evaluate role-play. Please try again.");
    } finally {
      setIsEvaluatingRolePlay(false);
    }
  };

  const handleAppendStarter = (starter: string) => {
    setTranscript((prev) => {
      if (!prev.trim()) return starter + " ";
      return prev.trim() + " " + starter + " ";
    });
  };

  const handleCopyStaffUpgrade = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUpgrade(true);
      toast.success("Staff phrasing copied!");
      setTimeout(() => setCopiedUpgrade(false), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const handleCopyCorrection = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDiffIndex(index);
      toast.success("Corrected phrase copied!");
      setTimeout(() => setCopiedDiffIndex(null), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Track Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tracks.map((track) => {
          const isSelected = track.level === selectedTrackLevel;
          return (
            <button
              key={track.level}
              onClick={() => setSelectedTrackLevel(track.level)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                isSelected
                  ? "bg-gradient-to-b from-primary/15 via-primary/5 to-card border-primary/50 shadow-md ring-1 ring-primary/30"
                  : "bg-card border-border/70 hover:border-border hover:bg-muted/30"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono font-bold ${
                      track.level === "A2"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : track.level === "B1"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}
                  >
                    {track.level} Track
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {track.estimatedTime}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground leading-snug">{track.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{track.description}</p>
              </div>

              {/* Track Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-border/40 w-full">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {track.completedLessons} of {track.totalLessons} lessons
                  </span>
                  <span className="font-semibold font-mono text-foreground">
                    {track.progressPercentage}%
                  </span>
                </div>
                <Progress value={track.progressPercentage} className="h-1.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Track Overview Header */}
      {currentTrack && (
        <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-bold text-foreground">
                {currentTrack.title}
              </h2>
              <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                {currentTrack.cefrBadge}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">{currentTrack.description}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Overall Mastery</div>
              <div className="text-lg font-mono font-bold text-primary">
                {currentTrack.progressPercentage}%
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm font-mono">
              {currentTrack.completedLessons}/{currentTrack.totalLessons}
            </div>
          </div>
        </div>
      )}

      {/* Units Roadmap (fCC Inspired Milestone Units) */}
      <div className="space-y-6">
        {currentTrack?.units.map((unit) => {
          const allCompleted = unit.lessons.every((l) => l.isCompleted);
          return (
            <Card key={unit.id} className="border-border/80 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[11px] font-mono font-semibold">
                        Unit {unit.unitNumber}
                      </Badge>
                      <CardTitle className="text-base font-bold text-foreground">
                        {unit.title}
                      </CardTitle>
                      {allCompleted && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1 py-0">
                          <CheckCircle2 className="w-3 h-3" /> Unit Mastered
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">
                      {unit.description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[11px] text-muted-foreground border-border self-start sm:self-auto">
                    {unit.badge}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unit.lessons.map((lesson) => {
                    const isDone = lesson.isCompleted;
                    return (
                      <div
                        key={lesson.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          isDone
                            ? "bg-emerald-500/[0.03] border-emerald-500/20 hover:border-emerald-500/40"
                            : "bg-card border-border/70 hover:border-primary/40 hover:bg-muted/20"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                              Lesson {unit.unitNumber}.{lesson.lessonNumber}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {lesson.estimatedMinutes}m
                              </span>
                              {isDone ? (
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] py-0 gap-1">
                                  <Check className="w-3 h-3" /> Passed
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-foreground leading-snug">
                              {lesson.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {lesson.subtitle}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {lesson.targetSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/50"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                          {isDone ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {lesson.userSpokenScore && (
                                <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                                  Speech: {lesson.userSpokenScore}%
                                </span>
                              )}
                              {lesson.userQuizScore && (
                                <span className="font-mono text-primary font-semibold text-[11px]">
                                  Quiz: {lesson.userQuizScore}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              Ready for training
                            </span>
                          )}

                          <Button
                            size="sm"
                            variant={isDone ? "outline" : "default"}
                            onClick={() => handleOpenLesson(unit, lesson)}
                            className="h-8 text-xs gap-1.5 rounded-xl font-medium"
                          >
                            {isDone ? (
                              <>
                                <RotateCcw className="w-3 h-3" /> Practice Again
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" /> Start Lesson
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 4-STEP INTERACTIVE LESSON DIALOG MODAL                                */}
      {/* ==================================================================== */}
      <Dialog open={!!activeLesson} onOpenChange={(open) => !open && handleCloseLesson()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-border/80 shadow-2xl">
          {activeLesson && activeUnit && (
            <div className="flex flex-col h-full">
              {/* Modal Header & 4-Step Wizard Navigation */}
              <div className="p-4 border-b border-border/60 bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {activeUnit.trackLevel} • Unit {activeUnit.unitNumber}.{activeLesson.lessonNumber}
                      </Badge>
                      <h3 className="text-sm md:text-base font-bold text-foreground">
                        {activeLesson.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeLesson.subtitle}</p>
                  </div>
                </div>

                {/* 4-Step Stepper Bar */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { step: 1, title: "1. Dialogue" },
                    { step: 2, title: "2. Micro-Quiz" },
                    { step: 3, title: "3. Spoken Role-Play" },
                    { step: 4, title: "4. Staff Upgrade" },
                  ].map((s) => {
                    const isCurrent = currentStep === s.step;
                    const isPast = currentStep > s.step;
                    return (
                      <div
                        key={s.step}
                        className={`text-center py-1.5 px-1 rounded-lg border text-xs font-semibold transition-all ${
                          isCurrent
                            ? "bg-primary text-white border-primary shadow-sm"
                            : isPast
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-muted/40 text-muted-foreground border-border/60 opacity-60"
                        }`}
                      >
                        {s.title}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Body: Dynamic Step Content */}
              <div className="p-5 space-y-6 flex-1">
                {/* -------------------------------------------------------- */}
                {/* STEP 1: Character-Driven Dialogue (fCC Style)            */}
                {/* -------------------------------------------------------- */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5" /> Workplace Scenario Context
                      </div>
                      <p className="text-xs md:text-sm text-foreground">
                        Listen to the workplace conversation below. Click the speaker icon next to
                        any line to hear natural pronunciation and review the highlighted tech idioms.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {activeLesson.dialogue.map((turn) => {
                        const isWisman = turn.speaker.toLowerCase().includes("wisman");
                        const isPlaying = playingDialogueTurnId === turn.id;
                        const isLoading = loadingAudioTurnId === turn.id;
                        return (
                          <div
                            key={turn.id}
                            className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                              isWisman
                                ? "bg-primary/5 border-primary/20 ml-3 sm:ml-6"
                                : "bg-card border-border/70 mr-3 sm:mr-6"
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] font-semibold py-0 ${
                                    isWisman ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
                                  }`}
                                >
                                  {turn.speaker} ({turn.role})
                                </Badge>
                                {turn.indonesianHint && (
                                  <span className="text-[11px] text-muted-foreground italic">
                                    • {turn.indonesianHint}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-foreground font-medium leading-relaxed">
                                {turn.text}
                              </p>
                              {turn.keyPhraseHighlight && (
                                <div className="text-[11px] text-primary font-mono font-semibold flex items-center gap-1">
                                  💡 Key Tech Idiom: &quot;{turn.keyPhraseHighlight}&quot;
                                </div>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePlayDialogueTurn(turn)}
                              disabled={isLoading || isPlaying}
                              className="h-8 w-8 p-0 rounded-lg shrink-0 border-border/70"
                              title="Listen to this line"
                            >
                              {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Volume2
                                  className={`w-3.5 h-3.5 ${isPlaying ? "text-primary animate-pulse" : "text-muted-foreground"}`}
                                />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-3">
                      <Button
                        onClick={() => setCurrentStep(2)}
                        className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-md px-5"
                      >
                        Proceed to Micro-Quiz <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* STEP 2: Micro-Interactive Quiz (Cloze & Tone Checks)     */}
                {/* -------------------------------------------------------- */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                        <HelpCircle className="w-3.5 h-3.5" /> Comprehension &amp; Syntax Checks
                      </div>
                      <p className="text-xs md:text-sm text-foreground">
                        Test your understanding of the dialogue, idiomatic prepositions, and professional workplace tone.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {activeLesson.quiz.map((q, idx) => {
                        const selectedOptionId = userQuizAnswers[q.id];

                        return (
                          <div key={q.id} className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center font-mono">
                                {idx + 1}
                              </span>
                              <h4 className="text-sm font-semibold text-foreground">
                                {q.question}
                              </h4>
                            </div>

                            {q.sentenceWithBlank && (
                              <div className="p-3 rounded-lg bg-muted/40 font-mono text-sm text-foreground border border-border/60">
                                {q.sentenceWithBlank}
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-2">
                              {q.options.map((opt) => {
                                const isChosen = selectedOptionId === opt.id;
                                let btnClasses = "bg-card border-border/70 hover:bg-muted/40 text-foreground";
                                if (quizSubmitted) {
                                  if (opt.isCorrect) {
                                    btnClasses = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold";
                                  } else if (isChosen && !opt.isCorrect) {
                                    btnClasses = "bg-destructive/15 border-destructive/40 text-destructive line-through";
                                  }
                                } else if (isChosen) {
                                  btnClasses = "bg-primary/15 border-primary/40 text-primary font-semibold";
                                }

                                return (
                                  <button
                                    key={opt.id}
                                    disabled={quizSubmitted}
                                    onClick={() =>
                                      setUserQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                                    }
                                    className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${btnClasses}`}
                                  >
                                    <span>{opt.text}</span>
                                    {quizSubmitted && opt.isCorrect && (
                                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {quizSubmitted && (
                              <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground space-y-1">
                                <span className="font-semibold text-foreground">Pedagogical Rationale: </span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs rounded-xl"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dialogue
                      </Button>

                      {!quizSubmitted ? (
                        <Button
                          onClick={handleCheckQuiz}
                          disabled={Object.keys(userQuizAnswers).length < activeLesson.quiz.length}
                          className="gap-2 rounded-xl bg-primary text-white text-xs font-semibold px-5"
                        >
                          Check Answers
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setCurrentStep(3)}
                          className="gap-2 rounded-xl bg-primary text-white text-xs font-semibold px-5"
                        >
                          Proceed to Spoken Challenge <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* STEP 3: Spoken Role-Play Challenge (Swain's Output)      */}
                {/* -------------------------------------------------------- */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    {/* Character Challenge Prompt */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                          {activeLesson.rolePlay.characterName} ({activeLesson.rolePlay.characterRole}) asks:
                        </Badge>
                      </div>
                      <p className="text-base font-bold text-foreground leading-snug">
                        &ldquo;{activeLesson.rolePlay.promptQuestion}&rdquo;
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeLesson.rolePlay.scenario}
                      </p>
                    </div>

                    {/* Sentence Starters */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        💡 Sentence Starters (Click to insert):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {activeLesson.rolePlay.sentenceStarters.map((st, i) => (
                          <button
                            key={i}
                            onClick={() => handleAppendStarter(st)}
                            className="text-xs py-1 px-2.5 rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border/60 text-muted-foreground transition-all text-left"
                          >
                            + &quot;{st}&quot;
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Microphone & Live Audio Bar */}
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant={isRecording ? "destructive" : "default"}
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isEvaluatingRolePlay}
                          className={`gap-2 rounded-xl h-10 px-5 font-semibold transition-all w-full sm:w-auto ${
                            isRecording ? "animate-pulse shadow-lg shadow-destructive/25" : ""
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <Square className="w-4 h-4 fill-current" /> Stop Recording
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4" /> Speak Your Answer
                            </>
                          )}
                        </Button>

                        {isRecording && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-red-500">
                              {Math.floor(recordingSeconds / 60)
                                .toString()
                                .padStart(2, "0")}
                              :{(recordingSeconds % 60).toString().padStart(2, "0")}
                            </span>
                            <div className="flex items-center gap-1 h-6 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              {[0.4, 0.8, 1.0, 0.7, 0.5].map((multiplier, i) => {
                                const barHeight = Math.max(
                                  4,
                                  Math.min(18, Math.round((audioLevel / 100) * 18 * multiplier))
                                );
                                return (
                                  <span
                                    key={i}
                                    className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                                    style={{ height: `${barHeight}px` }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {recordedAudioBase64 && !isRecording && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => transcribeWithAi()}
                            disabled={isTranscribing || isEvaluatingRolePlay}
                            className="text-xs gap-1 h-8 text-primary border-primary/30 rounded-lg"
                          >
                            {isTranscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            AI Transcribe
                          </Button>
                        )}
                        {transcript && !isRecording && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetTranscript}
                            disabled={isEvaluatingRolePlay}
                            className="text-xs text-muted-foreground h-8"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Transcript Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Your Spoken Answer (Live Transcript &amp; Editable):</span>
                        <span>{transcript.split(/\s+/).filter(Boolean).length} words</span>
                      </div>
                      <Textarea
                        rows={3}
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Click 'Speak Your Answer' and respond to your colleague, or type your answer here..."
                        className="text-sm font-sans resize-none border-border/80 focus-visible:ring-primary/30"
                        disabled={isEvaluatingRolePlay}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs rounded-xl"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Quiz
                      </Button>

                      <Button
                        onClick={handleSubmitRolePlay}
                        disabled={isEvaluatingRolePlay || !transcript.trim()}
                        className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md px-5"
                      >
                        {isEvaluatingRolePlay ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Evaluating Speech &amp; Upgrading...
                          </>
                        ) : (
                          <>
                            Submit &amp; Get Staff Review <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* STEP 4: Staff Review & Phrasing Upgrade                  */}
                {/* -------------------------------------------------------- */}
                {currentStep === 4 && rolePlayResult && (
                  <div className="space-y-5 animate-in fade-in-50 duration-300">
                    {/* Scores & Celebration Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-card border border-emerald-500/30 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <h4 className="text-base font-bold text-foreground">
                            Lesson Complete! Fantastic Work.
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {rolePlayResult.feedbackSummary}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Speech</div>
                          <div className="text-lg font-mono font-bold text-emerald-400">
                            {rolePlayResult.spokenScore}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Quiz</div>
                          <div className="text-lg font-mono font-bold text-primary">
                            {quizScore}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hero Staff Upgrade Card */}
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            Staff Engineer Re-phrasing Upgrade
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => speak(rolePlayResult.staffUpgrade)}
                            disabled={isTtsPlaying}
                            className="h-7 text-xs gap-1 text-primary hover:bg-primary/20"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> Listen
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyStaffUpgrade(rolePlayResult.staffUpgrade)}
                            className="h-7 text-xs gap-1 text-primary hover:bg-primary/20"
                          >
                            {copiedUpgrade ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        &ldquo;{rolePlayResult.staffUpgrade}&rdquo;
                      </p>
                    </div>

                    {/* Git-Diff Grammar Refinements */}
                    {rolePlayResult.grammarCorrections.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <GitCommit className="w-3.5 h-3.5 text-primary" /> Grammar Refinements (Git-Diff)
                        </div>
                        <div className="space-y-2">
                          {rolePlayResult.grammarCorrections.map((corr, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-border/70 bg-card overflow-hidden font-mono text-xs shadow-sm"
                            >
                              <div className="px-3 py-1.5 bg-muted/40 border-b border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                                <span>patch_{idx + 1}.diff</span>
                                <button
                                  onClick={() => handleCopyCorrection(corr.corrected, idx)}
                                  className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                                >
                                  {copiedDiffIndex === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  Copy Fix
                                </button>
                              </div>
                              <div className="p-2.5 space-y-1">
                                <div className="text-red-400/90 line-through bg-red-500/10 px-2 py-0.5 rounded">
                                  - {corr.original}
                                </div>
                                <div className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                                  + {corr.corrected}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-sans pt-1">
                                  💡 {corr.explanation}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-3 border-t border-border/40">
                      <Button
                        onClick={handleCloseLesson}
                        className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md px-6 h-10"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete &amp; Return to Tracks
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
