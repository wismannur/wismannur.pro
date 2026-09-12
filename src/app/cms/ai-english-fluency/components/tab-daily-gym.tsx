"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mic,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
  CheckCircle2,
  Brain,
  RotateCcw,
  Send,
  Loader2,
  Quote,
  Lightbulb,
  Headphones,
  BookOpen,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  GitCommit,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTextToSpeech, useSpeechRecognition } from "../hooks/use-speech";
import {
  generateDailyDrill,
  evaluateSpeechAttempt,
  getActiveInProgressSession,
  deleteSession,
  generateStaffPushback,
} from "@/services/ai-english-fluency/actions";
import type {
  AiEnglishSession,
  AiEnglishStreak,
  TargetLevel,
} from "@/services/ai-english-fluency/types";

interface TabDailyGymProps {
  currentStreak: AiEnglishStreak | null;
  targetLevel: TargetLevel;
  onSessionCompleted: () => void;
}

export function TabDailyGym({ targetLevel, onSessionCompleted }: TabDailyGymProps) {
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<AiEnglishSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isStep1Expanded, setIsStep1Expanded] = useState(false);
  const [isStep2Expanded, setIsStep2Expanded] = useState(false);
  const [copiedStaffKey, setCopiedStaffKey] = useState(false);
  const [copiedDiffIndex, setCopiedDiffIndex] = useState<number | null>(null);
  const [isPushbackLoading, setIsPushbackLoading] = useState(false);
  const [pushbackChallenge, setPushbackChallenge] = useState<{
    question: string;
    audioUrl?: string | null;
  } | null>(null);
  const [turn1Pitch, setTurn1Pitch] = useState<string | null>(null);
  const [isPlayingPushbackAudio, setIsPlayingPushbackAudio] = useState(false);

  const isCompleted = activeSession?.status === "completed";

  const [prevSessionStatus, setPrevSessionStatus] = useState(activeSession?.status);
  if (prevSessionStatus !== activeSession?.status) {
    setPrevSessionStatus(activeSession?.status);
    const completed = activeSession?.status === "completed";
    setIsStep1Expanded(!completed);
    setIsStep2Expanded(!completed);
  }

  const handleCopyStaffAlternative = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStaffKey(true);
      toast.success("Staff Engineer phrasing copied!");
      setTimeout(() => setCopiedStaffKey(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const handleCopyCorrection = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDiffIndex(index);
      toast.success("Corrected phrase copied!");
      setTimeout(() => setCopiedDiffIndex(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  // Query and restore active in-progress session if exists
  const { data: serverActiveSession } = useQuery({
    queryKey: ["ai-english-active-in-progress"],
    queryFn: () => getActiveInProgressSession(),
  });

  const [restoredSessionId, setRestoredSessionId] = useState<string | null>(null);
  if (serverActiveSession && !activeSession && restoredSessionId !== serverActiveSession.id) {
    setRestoredSessionId(serverActiveSession.id);
    setActiveSession(serverActiveSession);
  }

  // TTS Hook with Google Cloud Neural Voices
  const {
    speak,
    stop: stopAudio,
    isPlaying: isAudioPlaying,
    isLoadingAudio,
    rate: speechRate,
    setRate: setSpeechRate,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
  } = useTextToSpeech();

  // STT Recording Hook with Dual Engine (Web Speech + Gemini Audio Fallback)
  const {
    isRecording,
    transcript,
    setTranscript,
    recordingSeconds,
    audioLevel,
    recordedAudioUrl,
    recordedAudioBase64,
    isTranscribing,
    startRecording,
    stopRecording,
    resetTranscript,
    transcribeWithAi,
  } = useSpeechRecognition();

  // Handler: Start generating drill
  const handleStartDrill = async () => {
    setIsGenerating(true);
    try {
      const session = await generateDailyDrill(targetLevel, categoryFilter);
      setActiveSession(session);
      setPushbackChallenge(null);
      setTurn1Pitch(null);
      queryClient.setQueryData(["ai-english-active-in-progress"], session);
      resetTranscript();
      toast.success("Today's English Drill is ready! Let's level up.");
    } catch (err) {
      console.error("Failed to generate drill:", err);
      toast.error("Failed to generate practice drill. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Discard / Reset Drill
  const handleDiscardDrill = async () => {
    if (!activeSession) return;
    try {
      if (activeSession.status === "in_progress") {
        await deleteSession(activeSession.id);
      }
      setActiveSession(null);
      setPushbackChallenge(null);
      setTurn1Pitch(null);
      resetTranscript();
      queryClient.setQueryData(["ai-english-active-in-progress"], null);
      toast.success("Drill cleared. You can start a new scenario.");
    } catch (err) {
      console.error(err);
      setActiveSession(null);
      setPushbackChallenge(null);
      setTurn1Pitch(null);
    }
  };

  // Handler: Request Interactive Staff Pushback (2-Turn Debate Drill)
  const handleRequestPushback = async () => {
    if (!activeSession) return;
    if (isRecording) {
      stopRecording();
    }
    if (!transcript.trim()) {
      toast.warning("Please record or type your initial pitch first before asking for pushback!");
      return;
    }

    setIsPushbackLoading(true);
    const initialPitch = transcript.trim();
    setTurn1Pitch(initialPitch);

    try {
      const res = await generateStaffPushback({
        sessionId: activeSession.id,
        userTranscript: initialPitch,
      });

      setPushbackChallenge({
        question: res.pushbackText,
        audioUrl: res.audioUrl,
      });
      resetTranscript(); // Reset transcript so candidate can speak Turn 2 (Defense)
      toast.success("Senior Staff Engineer is pushing back! Listen to the challenge and defend your stance.");

      // Auto-play pushback neural voice if available
      if (res.audioUrl) {
        try {
          const audio = new Audio(res.audioUrl);
          setIsPlayingPushbackAudio(true);
          audio.onended = () => setIsPlayingPushbackAudio(false);
          audio.onerror = () => setIsPlayingPushbackAudio(false);
          audio.play().catch(() => setIsPlayingPushbackAudio(false));
        } catch {
          setIsPlayingPushbackAudio(false);
        }
      }
    } catch (err) {
      console.error("Failed to generate pushback:", err);
      toast.error("Failed to simulate staff pushback. You can still submit your answer directly.");
    } finally {
      setIsPushbackLoading(false);
    }
  };

  const handlePlayPushbackVoice = () => {
    if (!pushbackChallenge?.audioUrl) return;
    try {
      const audio = new Audio(pushbackChallenge.audioUrl);
      setIsPlayingPushbackAudio(true);
      audio.onended = () => setIsPlayingPushbackAudio(false);
      audio.onerror = () => setIsPlayingPushbackAudio(false);
      audio.play().catch(() => setIsPlayingPushbackAudio(false));
    } catch {
      setIsPlayingPushbackAudio(false);
    }
  };

  const handleCancelPushback = () => {
    if (turn1Pitch && !transcript.trim()) {
      setTranscript(turn1Pitch);
    }
    setPushbackChallenge(null);
    setTurn1Pitch(null);
    toast.info("Returned to single-turn pitch mode.");
  };

  // Handler: Submit speech for AI evaluation
  const handleSubmitEvaluation = async () => {
    if (!activeSession) return;
    if (isRecording) {
      stopRecording();
    }

    if (!transcript.trim()) {
      toast.warning("Please speak or write your answer before submitting.");
      return;
    }

    setIsEvaluating(true);
    try {
      const finalTranscript =
        pushbackChallenge && turn1Pitch
          ? `[Turn 1 - Initial Pitch]:\n"${turn1Pitch}"\n\n[Staff Engineer Pushback Challenge]:\n"${pushbackChallenge.question}"\n\n[Turn 2 - Candidate Defense]:\n"${transcript.trim()}"`
          : transcript.trim();

      const result = await evaluateSpeechAttempt({
        sessionId: activeSession.id,
        userTranscript: finalTranscript,
        durationSeconds: Math.max(recordingSeconds, 15),
      });

      setActiveSession(result.session);
      setPushbackChallenge(null);
      setTurn1Pitch(null);
      queryClient.setQueryData(["ai-english-active-in-progress"], null);
      queryClient.invalidateQueries({ queryKey: ["ai-english-recent-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-vocab"] });
      queryClient.invalidateQueries({ queryKey: ["ai-english-analytics"] });
      toast.success("Awesome effort! Your Staff-level review is ready.");
      onSessionCompleted();
    } catch (err) {
      console.error("Evaluation error:", err);
      toast.error("Failed to evaluate answer. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAppendStarter = (starter: string) => {
    setTranscript((prev) => {
      if (!prev.trim()) return starter + " ";
      return prev.trim() + " " + starter + " ";
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Generator Card if no drill is loaded */}
      {!activeSession && (
        <Card className="border-border/70 shadow-sm bg-gradient-to-b from-card to-card/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Brain className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold">Today&apos;s English Speaking Workout</CardTitle>
            <CardDescription className="max-w-lg mx-auto text-xs md:text-sm">
              Each drill is grounded directly in your AI Knowledge Hub, training you to articulate your actual projects,
              architecture choices, and technical trade-offs in English.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-4 pb-8">
            <div className="flex items-center gap-3 w-full max-w-sm">
              <div className="text-xs font-medium text-muted-foreground shrink-0">Topic Category:</div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌐 Any Knowledge Topic</SelectItem>
                  <SelectItem value="technical">⚙️ Technical & Architecture</SelectItem>
                  <SelectItem value="projects">📦 Real Case Projects</SelectItem>
                  <SelectItem value="philosophy">🧠 Engineering Philosophy</SelectItem>
                  <SelectItem value="hiring">💼 Hiring & Career</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="lg"
              onClick={handleStartDrill}
              disabled={isGenerating}
              className="gap-2 px-8 font-semibold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-primary/25 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Grounded Drill...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Today&apos;s Speaking Drill
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 2. Active Drill Workspace */}
      {activeSession && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Drill Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px] capitalize">
                  {activeSession.topicCategory}
                </Badge>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  Level: {activeSession.targetLevel}
                </Badge>
                {activeSession.knowledgeItemId && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px] gap-1">
                    <Brain className="w-3 h-3" /> Grounded from Knowledge Hub
                  </Badge>
                )}
              </div>
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                {activeSession.topicTitle}
              </h3>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartDrill}
                disabled={isGenerating || isEvaluating}
                className="text-xs gap-1.5 h-8"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Scenario
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscardDrill}
                disabled={isGenerating || isEvaluating}
                className="text-xs gap-1 h-8 text-muted-foreground hover:text-destructive"
                title="Discard this drill"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Discard
              </Button>
            </div>
          </div>

          {/* STEP 1: Listen & Shadowing (Pemanasan) - Collapsible when session completed */}
          {isCompleted && !isStep1Expanded ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm transition-all hover:border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">Step 1: Listen &amp; Shadowing</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-0 font-medium">
                      Completed
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate italic mt-0.5 max-w-xl">
                    &ldquo;{activeSession.sampleModelAnswer}&rdquo;
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (isAudioPlaying) stopAudio();
                    else if (activeSession.sampleModelAnswer) speak(activeSession.sampleModelAnswer);
                  }}
                  disabled={isLoadingAudio}
                  className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Replay Voice
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsStep1Expanded(true)}
                  className="h-8 text-xs gap-1 rounded-xl border-border/70"
                >
                  Expand <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <Card className="border-border/70 shadow-sm bg-gradient-to-br from-indigo-500/5 via-card to-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm md:text-base font-semibold">
                        Step 1: Listen &amp; Shadowing (Pemanasan Telinga &amp; Lidah)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Dengarkan model pelafalan native di bawah ini 2–3 kali, lalu tirukan intonasinya.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Voice & Speed Controls */}
                    <div className="hidden sm:flex flex-wrap items-center gap-2">
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger className="h-7 text-[11px] w-[140px] bg-background border-border/60">
                          <SelectValue placeholder="Voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVoices.map((v) => (
                            <SelectItem key={v.id} value={v.id} className="text-xs">
                              {v.gender === "male" ? "🎙️ " : "🎧 "} {v.label.split(" (")[0]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-[11px]">
                        <button
                          onClick={() => setSpeechRate(0.8)}
                          className={`px-2 py-0.5 rounded font-medium transition-all ${
                            speechRate === 0.8 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                          }`}
                        >
                          0.8x Slow
                        </button>
                        <button
                          onClick={() => setSpeechRate(0.95)}
                          className={`px-2 py-0.5 rounded font-medium transition-all ${
                            speechRate === 0.95 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                          }`}
                        >
                          1.0x Normal
                        </button>
                      </div>
                    </div>

                    {isCompleted && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsStep1Expanded(false)}
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        Collapse <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeSession.sampleModelAnswer && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 relative group">
                    <Quote className="w-5 h-5 text-muted-foreground/30 absolute right-3 top-3" />
                    <p className="text-sm md:text-base text-foreground/90 leading-relaxed italic pr-6">
                      &ldquo;{activeSession.sampleModelAnswer}&rdquo;
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    variant={isAudioPlaying ? "destructive" : "default"}
                    onClick={() => {
                      if (isAudioPlaying) {
                        stopAudio();
                      } else if (activeSession.sampleModelAnswer) {
                        speak(activeSession.sampleModelAnswer);
                      }
                    }}
                    disabled={isLoadingAudio}
                    className="gap-2 h-8 text-xs font-medium rounded-lg"
                  >
                    {isLoadingAudio ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading Studio Audio...
                      </>
                    ) : isAudioPlaying ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Stop Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> Listen Studio Voice
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Latih shadow reading (baca bersamaan dengan suara audio).
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Micro-Speech Drill (Latihan Bicara) - Collapsible when session completed */}
          {isCompleted && !isStep2Expanded ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm transition-all hover:border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">Step 2: Spoken Response Submitted</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-0 font-medium">
                      Submitted
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {activeSession.userSpeechTranscript?.split(/\s+/).filter(Boolean).length ?? 0} words ({activeSession.durationSeconds}s)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-xl">
                    &ldquo;{activeSession.userSpeechTranscript || transcript}&rdquo;
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {recordedAudioUrl && (
                  <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-lg border border-border/50">
                    <Headphones className="w-3 h-3 text-primary" />
                    <audio src={recordedAudioUrl} controls className="h-6 w-36 sm:w-44" />
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsStep2Expanded(true)}
                  className="h-8 text-xs gap-1 rounded-xl border-border/70"
                >
                  View Response <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm md:text-base font-semibold">
                        Step 2: Micro-Speaking Challenge
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Tantang diri Anda berbicara dalam bahasa Inggris. Gunakan microphone atau ketik jawaban Anda.
                      </CardDescription>
                    </div>
                  </div>

                  {isCompleted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsStep2Expanded(false)}
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      Collapse <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scenario Box */}
                <div className="p-4 rounded-xl bg-card/80 border border-border/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5" /> Work Scenario &amp; Challenge
                  </div>
                  <p className="text-sm md:text-base text-foreground font-medium leading-relaxed">
                    {activeSession.scenarioPrompt}
                  </p>
                </div>

                {/* Interactive Pushback Callout Card (Turn 2 of 2) */}
                {pushbackChallenge && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3 animate-in fade-in-50 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold px-2 py-0.5 text-xs">
                          Interactive Debate (Turn 2 of 2)
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          Senior Staff Engineer Counter-Argument
                        </span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {pushbackChallenge.audioUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePlayPushbackVoice}
                            disabled={isPlayingPushbackAudio}
                            className="h-7 text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-lg"
                          >
                            {isPlayingPushbackAudio ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" /> Playing Voice...
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" /> Replay Staff Voice
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelPushback}
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Reset to Single Turn
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {turn1Pitch && (
                        <div className="text-xs text-muted-foreground bg-background/60 p-2.5 rounded-lg border border-border/60">
                          <span className="font-semibold text-foreground">Your Initial Pitch (Turn 1): </span>
                          &ldquo;{turn1Pitch}&rdquo;
                        </div>
                      )}
                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-foreground">
                        <Quote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-amber-200 leading-relaxed">
                            {pushbackChallenge.question}
                          </p>
                          <p className="text-[11px] text-amber-300/80 font-normal">
                            Defend your trade-off, architecture, or reliability considerations in Turn 2 below.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sentence Starters for Beginners (Anti-Ngeblank) */}
                {activeSession.sentenceStarters && activeSession.sentenceStarters.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      💡 Sentence Starters (Klik untuk bantuan memulai kalimat):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeSession.sentenceStarters.map((starter, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAppendStarter(starter)}
                          className="text-xs py-1 px-2.5 rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border/60 text-muted-foreground transition-all text-left"
                        >
                          + &quot;{starter}&quot;
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recorder & Transcript Box */}
                <div className="space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant={isRecording ? "destructive" : "default"}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isEvaluating}
                        className={`gap-2 rounded-xl h-10 px-5 font-semibold transition-all ${
                          isRecording ? "animate-pulse shadow-lg shadow-destructive/25" : ""
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <Square className="w-4 h-4 fill-current" /> Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" /> {pushbackChallenge ? "Record Turn 2 Defense" : "Start Speaking"}
                          </>
                        )}
                      </Button>

                      {isRecording && (
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="flex items-center gap-1.5 bg-background/80 px-2.5 py-1 rounded-lg border border-border/60">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            <span className="text-xs font-mono font-bold text-red-500">
                              {Math.floor(recordingSeconds / 60)
                                .toString()
                                .padStart(2, "0")}
                              :{(recordingSeconds % 60).toString().padStart(2, "0")}
                            </span>
                          </div>

                          {/* Live Decibel / Frequency Equalizer Bars */}
                          <div className="flex items-center gap-1 h-7 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            {[0.4, 0.8, 1.0, 0.7, 0.5].map((multiplier, i) => {
                              const barHeight = Math.max(
                                4,
                                Math.min(20, Math.round((audioLevel / 100) * 20 * multiplier))
                              );
                              return (
                                <span
                                  key={i}
                                  className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                                  style={{ height: `${barHeight}px` }}
                                />
                              );
                            })}
                            <span className="text-[10px] font-semibold text-emerald-400 font-mono ml-1">
                              {audioLevel > 5 ? "Mic Live" : "Listening..."}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Audio Playback of Recorded Speech */}
                      {recordedAudioUrl && !isRecording && (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-background/80 border border-border/60">
                          <Headphones className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[11px] text-muted-foreground font-medium shrink-0">Playback:</span>
                          <audio src={recordedAudioUrl} controls className="h-7 w-44 sm:w-56" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-auto">
                      {/* Gemini AI Transcription Fallback / Retry */}
                      {recordedAudioBase64 && !isRecording && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => transcribeWithAi()}
                          disabled={isTranscribing || isEvaluating}
                          className="text-xs gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10 rounded-lg"
                          title="Transcribe recorded speech with Gemini AI"
                        >
                          {isTranscribing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              AI Transcribing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              AI Transcribe
                            </>
                          )}
                        </Button>
                      )}

                      {transcript && !isRecording && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetTranscript}
                          disabled={isEvaluating}
                          className="text-xs text-muted-foreground hover:text-foreground h-8"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear Text
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Editable Transcript Area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        {pushbackChallenge
                          ? "Turn 2: Candidate Defense (Live Transcript & Editable):"
                          : "Your Spoken Answer (Live Transcript & Editable):"}
                        {isTranscribing && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-1 animate-pulse"
                          >
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Transcribing with Gemini...
                          </Badge>
                        )}
                      </span>
                      <span>{transcript.split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                    <Textarea
                      rows={4}
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder={
                        pushbackChallenge
                          ? "Turn 2: Defend your architecture against the Staff Engineer's pushback. Explain trade-offs, mitigations, or alternative approaches..."
                          : "Click 'Start Speaking' and talk into your microphone, or type your response here..."
                      }
                      className="text-sm font-sans resize-none border-border/80 focus-visible:ring-primary/30"
                      disabled={isEvaluating}
                    />
                  </div>

                  {/* Action Bar: Pushback + Submit Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div>
                      {!pushbackChallenge && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRequestPushback}
                          disabled={isEvaluating || isPushbackLoading || !transcript.trim() || isRecording}
                          className="text-xs sm:text-sm h-10 gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-xl font-medium w-full sm:w-auto"
                          title="Simulate a real-time technical pushback from a Staff Engineer before final evaluation"
                        >
                          {isPushbackLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Staff Thinking of Pushback...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-amber-400" />
                              Request Staff Pushback (2-Turn Debate) 💬
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <Button
                      onClick={handleSubmitEvaluation}
                      disabled={isEvaluating || !transcript.trim() || isRecording}
                      className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-md px-6 h-10"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing Speech &amp; Generating Staff Feedback...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {pushbackChallenge ? "Submit Defense & Complete Drill" : "Submit for Staff-Level Evaluation"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Evaluation Results (2-Column Responsive Layout & Git-Diff View) */}
          {activeSession.status === "completed" && (
            <Card className="border-border/80 shadow-md bg-gradient-to-b from-card to-card/70 animate-in fade-in-50 duration-500">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base md:text-lg font-bold">
                        Staff-Level Review &amp; Coaching Feedback
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Deliberate feedback to bridge your English articulation to Silicon Valley standard.
                      </CardDescription>
                    </div>
                  </div>

                  {/* Overall Score Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-semibold text-primary">Overall Score:</span>
                    <span className="text-lg font-bold font-mono text-primary">
                      {activeSession.overallScore ?? 0}
                      <span className="text-xs text-muted-foreground font-normal">/100</span>
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-5">
                {/* Top Score Meters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Fluency &amp; Flow</span>
                      <span className="font-mono font-bold">{activeSession.fluencyScore ?? 0}%</span>
                    </div>
                    <Progress value={activeSession.fluencyScore ?? 0} className="h-2" />
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Grammar Accuracy</span>
                      <span className="font-mono font-bold">{activeSession.grammarScore ?? 0}%</span>
                    </div>
                    <Progress value={activeSession.grammarScore ?? 0} className="h-2" />
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Lexical Variety</span>
                      <span className="font-mono font-bold">{activeSession.vocabularyScore ?? 0}%</span>
                    </div>
                    <Progress value={activeSession.vocabularyScore ?? 0} className="h-2" />
                  </div>
                </div>

                {/* 2-Column Responsive Body */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                  {/* LEFT COLUMN: Observations, Git-Diff Grammar, Lexicon Vault (7 cols) */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Coaching Summary */}
                    {activeSession.feedbackSummary && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5">
                        <div className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                          🎯 Coach Summary &amp; Observations
                        </div>
                        <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
                          {activeSession.feedbackSummary}
                        </p>
                      </div>
                    )}

                    {/* Git-Diff Grammar & Phrasing Refinements */}
                    {activeSession.grammarCorrections && activeSession.grammarCorrections.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GitCommit className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Grammar &amp; Phrasing Refinements (Diff View)
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {activeSession.grammarCorrections.length} patches
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {activeSession.grammarCorrections.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-border/70 overflow-hidden bg-card/80 shadow-sm transition-all hover:border-border"
                            >
                              {/* Diff Header */}
                              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/50 text-[11px] text-muted-foreground font-mono">
                                <span className="flex items-center gap-1.5 truncate">
                                  <span className="w-2 h-2 rounded-full bg-amber-500/70 inline-block" />
                                  patch_{idx + 1}.diff
                                </span>
                                <button
                                  onClick={() => handleCopyCorrection(item.corrected, idx)}
                                  className="hover:text-foreground flex items-center gap-1 transition-colors shrink-0 text-[11px]"
                                  title="Copy natural correction"
                                >
                                  {copiedDiffIndex === idx ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400 font-medium">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Git-Diff Content Body */}
                              <div className="font-mono text-xs divide-y divide-border/30">
                                {/* Red original deletion */}
                                <div className="flex items-start gap-2.5 px-3.5 py-2 bg-red-500/10 text-red-400 border-l-2 border-red-500">
                                  <span className="select-none font-bold text-red-500/80 shrink-0">-</span>
                                  <span className="line-through decoration-red-400/60 font-sans leading-relaxed">
                                    {item.original}
                                  </span>
                                </div>

                                {/* Green corrected addition */}
                                <div className="flex items-start gap-2.5 px-3.5 py-2 bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 font-medium">
                                  <span className="select-none font-bold text-emerald-500/80 shrink-0">+</span>
                                  <span className="font-sans leading-relaxed">{item.corrected}</span>
                                </div>
                              </div>

                              {/* Diff Explanation Note */}
                              <div className="p-3 bg-muted/20 border-t border-border/40 text-xs text-muted-foreground flex items-start gap-2">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                  <span className="font-semibold text-foreground/90">Rule &amp; Context: </span>
                                  {item.explanation}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted Vocabularies Added to Lexicon */}
                    {activeSession.extractedVocabularies && activeSession.extractedVocabularies.length > 0 && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                            Added to your Lexicon Vault ({activeSession.extractedVocabularies.length} Phrases)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeSession.extractedVocabularies.map((v, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground font-mono">{v.phrase}</span>
                                {v.phonetic && <span className="text-[11px] text-muted-foreground">{v.phonetic}</span>}
                              </div>
                              <p className="text-muted-foreground text-[11px]">{v.meaning}</p>
                              <p className="text-[11px] text-emerald-400/90 italic mt-1">&quot;{v.techContextExample}&quot;</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Staff Engineer Upgrade, Pronunciation, Next Action (5 cols) */}
                  <div className="lg:col-span-5 space-y-5">
                    {/* Hero: "How a Native Staff Engineer Would Say It" */}
                    {activeSession.betterAlternative && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/15 via-card to-card border border-purple-500/30 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" /> Staff Engineer Upgrade
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyStaffAlternative(activeSession.betterAlternative!)}
                              className="h-7 text-[11px] gap-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-lg"
                              title="Copy Staff Alternative"
                            >
                              {copiedStaffKey ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                if (isAudioPlaying) stopAudio();
                                else speak(activeSession.betterAlternative!);
                              }}
                              disabled={isLoadingAudio}
                              className="h-7 text-[11px] gap-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-sm"
                            >
                              {isLoadingAudio ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isAudioPlaying ? (
                                <VolumeX className="w-3 h-3" />
                              ) : (
                                <Volume2 className="w-3 h-3" />
                              )}
                              {isAudioPlaying ? "Stop" : "Listen"}
                            </Button>
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-background/70 border border-purple-500/20 relative">
                          <Quote className="w-4 h-4 text-purple-400/40 absolute right-2.5 top-2.5" />
                          <p className="text-sm font-medium text-foreground leading-relaxed italic pr-5">
                            &ldquo;{activeSession.betterAlternative}&rdquo;
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Dengarkan model pelafalan native ini untuk melatih artikulasi berbobot saat standup atau RFC review.
                        </p>
                      </div>
                    )}

                    {/* Pronunciation Tips */}
                    {activeSession.pronunciationTips && (
                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
                        <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5" /> Pronunciation Notes for Key Tech Terms
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {activeSession.pronunciationTips}
                        </p>
                      </div>
                    )}

                    {/* Next Action Buttons */}
                    <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm space-y-2.5">
                      <div className="text-xs font-medium text-muted-foreground">Ready for another challenge?</div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handleStartDrill}
                          disabled={isGenerating}
                          className="w-full gap-2 rounded-xl bg-primary text-white shadow-md font-semibold h-9 text-xs"
                        >
                          <Sparkles className="w-4 h-4" /> Start Next Speaking Drill
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
