import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Check,
  Eye,
  GripHorizontal,
  Lightbulb,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CopilotMarkdown } from "@/components/cms/copilot/copilot-markdown";

import type { Monaco } from "@monaco-editor/react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-[#22283E] bg-[#08090C] text-xs text-zinc-400">
      <Sparkles className="h-5 w-5 animate-spin text-indigo-400" />
      <span>Loading VS Code Monaco Engine...</span>
    </div>
  ),
});
import type {
  FrontendDifficulty,
  FrontendMasteryEvaluation,
  FrontendMasterySession,
  FrontendVerdict,
} from "@/services/frontend-mastery/types";

interface TabArenaProps {
  session: FrontendMasterySession | null;
  onSubmitAnswer: (sessionId: string, code: string, timeSpentSeconds: number) => Promise<void>;
  onBackToCurriculum: () => void;
  onRetrySession: (topicId: string, difficulty: FrontendDifficulty) => void;
  isEvaluating?: boolean;
}

export function TabArena(props: TabArenaProps) {
  if (!props.session) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-12 text-center">
        <Zap className="mx-auto h-10 w-10 text-indigo-400 opacity-60" />
        <h3 className="mt-4 text-base font-semibold text-white">No Active Drill Session</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Select any topic from the curriculum roadmap to begin an interactive interview challenge.
        </p>
        <Button
          onClick={props.onBackToCurriculum}
          className="mt-6 bg-indigo-600 text-white hover:bg-indigo-500"
        >
          Browse Curriculum
        </Button>
      </div>
    );
  }

  return <ArenaInner key={props.session.id} {...props} session={props.session} />;
}

function ArenaInner({
  session,
  onSubmitAnswer,
  onBackToCurriculum,
  onRetrySession,
  isEvaluating,
}: TabArenaProps & { session: FrontendMasterySession }) {
  const [codeAnswer, setCodeAnswer] = useState<string>(
    () => session.userSubmission || session.starterCode || ""
  );
  const [editorLanguage, setEditorLanguage] = useState<string>(() => {
    if (session.pillar === "javascript") return "javascript";
    if (session.pillar === "react") return "typescript";
    if (session.pillar === "system_design") return "markdown";
    return "typescript";
  });
  const [editorHeight, setEditorHeight] = useState<number>(450);
  const [tabSize, setTabSize] = useState<number>(2);
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  const isDraggingEditorRef = useRef(false);
  const dragStartYRef = useRef(0);
  const startHeightRef = useRef(450);

  const handlePrettierFormat = async () => {
    if (!codeAnswer.trim()) return;
    setIsFormatting(true);
    try {
      const prettier = (await import("prettier/standalone")).default;
      let formatted = codeAnswer;

      if (editorLanguage === "markdown") {
        const markdownPlugin = (await import("prettier/plugins/markdown")).default;
        formatted = await prettier.format(codeAnswer, {
          parser: "markdown",
          plugins: [markdownPlugin],
          tabWidth: tabSize,
        });
      } else {
        const babelPlugin = (await import("prettier/plugins/babel")).default;
        const estreePlugin = (await import("prettier/plugins/estree")).default;
        const tsPlugin = (await import("prettier/plugins/typescript")).default;
        formatted = await prettier.format(codeAnswer, {
          parser: "typescript",
          plugins: [babelPlugin, estreePlugin, tsPlugin],
          tabWidth: tabSize,
          semi: true,
          singleQuote: false,
          trailingComma: "es5",
        });
      }

      setCodeAnswer(formatted);
      toast.success("Code formatted with Prettier!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Syntax error";
      toast.error(`Prettier cannot format: ${msg.split("\n")[0]}`);
    } finally {
      setIsFormatting(false);
    }
  };

  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(
    () => session.timeSpentSeconds || 0
  );
  const [isCopiedModel, setIsCopiedModel] = useState<boolean>(false);

  const isCompleted = session.status === "completed";

  // Active Timer when in_progress and not evaluating
  useEffect(() => {
    if (isCompleted || isEvaluating) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, isEvaluating]);

  const handleMouseDownOnResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingEditorRef.current = true;
    dragStartYRef.current = e.clientY;
    startHeightRef.current = editorHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingEditorRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYRef.current;
      const maxHeight = Math.min(1100, Math.floor(window.innerHeight * 0.85));
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 260), maxHeight);
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingEditorRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartOnResize = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingEditorRef.current = true;
    dragStartYRef.current = e.touches[0].clientY;
    startHeightRef.current = editorHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingEditorRef.current || moveEvent.touches.length !== 1) return;
      const deltaY = moveEvent.touches[0].clientY - dragStartYRef.current;
      const maxHeight = Math.min(1100, Math.floor(window.innerHeight * 0.85));
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 260), maxHeight);
      setEditorHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingEditorRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const handleEditorBeforeMount = (monaco: Monaco) => {
    monaco.editor.defineTheme("electric-obsidian", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "E0E7FF", background: "08090C" },
        { token: "comment", foreground: "64748B", fontStyle: "italic" },
        { token: "keyword", foreground: "818CF8", fontStyle: "bold" },
        { token: "identifier", foreground: "E0E7FF" },
        { token: "string", foreground: "34D399" },
        { token: "number", foreground: "FBBF24" },
        { token: "type", foreground: "A78BFA" },
        { token: "delimiter", foreground: "94A3B8" },
        { token: "operator", foreground: "818CF8" },
        { token: "tag", foreground: "F472B6" },
        { token: "attribute.name", foreground: "818CF8" },
        { token: "attribute.value", foreground: "34D399" },
      ],
      colors: {
        "editor.background": "#08090C",
        "editor.foreground": "#E0E7FF",
        "editorCursor.foreground": "#818CF8",
        "editor.lineHighlightBackground": "#0E1222",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#818CF8",
        "editor.selectionBackground": "#6366F135",
        "editor.inactiveSelectionBackground": "#6366F115",
        "editorGutter.background": "#08090C",
        "editorGutter.modifiedBackground": "#818CF8",
        "editorGutter.addedBackground": "#34D399",
        "editorGutter.deletedBackground": "#F87171",
        "scrollbarSlider.background": "#1E223580",
        "scrollbarSlider.hoverBackground": "#6366F180",
        "scrollbarSlider.activeBackground": "#6366F1AA",
        "editorWidget.background": "#0C0E18",
        "editorWidget.border": "#22283E",
        "editorSuggestWidget.background": "#0C0E18",
        "editorSuggestWidget.border": "#22283E",
        "editorSuggestWidget.foreground": "#E0E7FF",
        "editorSuggestWidget.selectedBackground": "#1E2235",
      },
    });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!session) return;
    if (!codeAnswer.trim()) {
      toast.error("Please enter your answer or code before submitting.");
      return;
    }
    await onSubmitAnswer(session.id, codeAnswer, elapsedSeconds);
  };

  const handleCopyModelAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedModel(true);
    toast.success("Staff model answer copied to clipboard!");
    setTimeout(() => setIsCopiedModel(false), 2000);
  };

  const getVerdictBadge = (verdict: FrontendVerdict) => {
    switch (verdict) {
      case "strong_hire":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Trophy className="h-3.5 w-3.5" />
            Strong Hire (L6 Staff)
          </span>
        );
      case "hire":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Hire (L5 Senior)
          </span>
        );
      case "lean_hire":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
            Lean Hire
          </span>
        );
      case "lean_no_hire":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            Lean No Hire
          </span>
        );
      case "no_hire":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-300">
            No Hire (Needs Polish)
          </span>
        );
    }
  };

  if (!session) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-12 text-center">
        <Zap className="mx-auto h-10 w-10 text-indigo-400 opacity-60" />
        <h3 className="mt-4 text-base font-semibold text-white">No Active Drill Session</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Select any topic from the curriculum roadmap to begin an interactive interview challenge.
        </p>
        <Button
          onClick={onBackToCurriculum}
          className="mt-6 bg-indigo-600 text-white hover:bg-indigo-500"
        >
          Browse Curriculum
        </Button>
      </div>
    );
  }

  const evaluation: FrontendMasteryEvaluation | null = session.evaluationResult || null;

  return (
    <div className="space-y-6">
      {/* Session Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#22283E] pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToCurriculum}
            className="border-white/[0.08] bg-[#0C0E18] text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Curriculum
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                {session.pillar.replace("_", " ")}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400 capitalize">
                Level: {session.difficulty}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{session.topicTitle}</h2>
          </div>
        </div>

        {/* Live Timer and Session Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#22283E] bg-[#131726] px-3 py-1.5 text-xs text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-mono font-medium">{formatTimer(elapsedSeconds)}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetrySession(session.topicId, session.difficulty)}
            className="border-white/[0.08] bg-[#0C0E18] text-zinc-300 hover:text-white"
            title="Start fresh with a new variation"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Retry / Fresh Drill
          </Button>
        </div>
      </div>

      {/* Main Split Layout: Prompt & Requirements on Left, Editor on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Pane (5 Cols): Problem Statement, Constraints, Progressive Hints */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E18] p-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Interview Challenge Brief</span>
              </div>
              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px]"
              >
                Big Tech Bar
              </Badge>
            </div>

            {/* Formatted Problem Statement */}
            <div className="mt-4">
              <CopilotMarkdown content={session.questionPrompt} />
            </div>
          </div>

          {/* Progressive Hints Accordion */}
          {session.hints && session.hints.length > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-[#0C0E18] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span>Senior Staff Progressive Hints</span>
              </div>
              <div className="mt-3 space-y-2">
                {session.hints.map((hint, idx) => {
                  const isRevealed = activeHintIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#22283E] bg-[#131726]/60 p-3 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-400">
                          Hint {idx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveHintIndex(isRevealed ? null : idx)}
                          className="h-6 px-2 text-[11px] text-zinc-400 hover:text-white"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          {isRevealed ? "Hide" : "Reveal"}
                        </Button>
                      </div>
                      {isRevealed && (
                        <p className="mt-2 text-xs text-amber-200/90 leading-relaxed border-t border-white/[0.05] pt-2">
                          {hint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane (7 Cols): Code / Solution Editor & Submission */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-white/[0.08] bg-[#0C0E18] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Code2 className="h-4 w-4 text-indigo-400" />
                  <span>Your Implementation / Solution</span>
                </div>

                {/* Language Switcher */}
                <div className="flex items-center rounded-lg border border-[#22283E] bg-[#08090C] p-0.5">
                  {(["typescript", "javascript", "markdown"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setEditorLanguage(lang)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-medium transition-all ${
                        editorLanguage === lang
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {lang === "typescript" ? "TS/TSX" : lang === "javascript" ? "JS" : "Markdown"}
                    </button>
                  ))}
                </div>

                {/* Indent Width Switcher */}
                <div className="flex items-center rounded-lg border border-[#22283E] bg-[#08090C] p-0.5" title="Indent size (spaces)">
                  {([2, 4] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTabSize(size)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-medium transition-all ${
                        tabSize === size
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {size} spaces
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={isFormatting || !codeAnswer.trim()}
                  onClick={handlePrettierFormat}
                  className="h-7 border-[#22283E] bg-[#08090C] text-[11px] text-zinc-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all shadow-sm"
                  title="Format code with Prettier (2-space indent)"
                >
                  <Wand2 className={`mr-1.5 h-3 w-3 text-indigo-400 ${isFormatting ? "animate-spin" : ""}`} />
                  {isFormatting ? "Formatting..." : "Prettier"}
                </Button>

                <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                  <GripHorizontal className="h-3 w-3 opacity-60" />
                  <span>Drag bar to resize</span>
                  <span className="text-zinc-700">•</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {codeAnswer.split("\n").length} lines • {codeAnswer.length} chars
                </span>
                {session.starterCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCodeAnswer(session.starterCode || "")}
                    className="h-7 text-[11px] text-zinc-400 hover:text-white"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Monaco Editor Container with Drag Resize */}
            <div className="mt-3 overflow-hidden rounded-xl border border-[#22283E] bg-[#08090C] shadow-inner transition-shadow focus-within:border-indigo-500/50">
              <MonacoEditor
                height={`${editorHeight}px`}
                language={editorLanguage}
                theme="electric-obsidian"
                beforeMount={handleEditorBeforeMount}
                value={codeAnswer}
                onChange={(val) => setCodeAnswer(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13.5,
                  lineHeight: 22,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, 'Courier New', monospace",
                  fontLigatures: true,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: tabSize,
                  detectIndentation: false,
                  insertSpaces: true,
                  renderWhitespace: "selection",
                  wordWrap: "on",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  padding: { top: 12, bottom: 12 },
                  formatOnPaste: false,
                  formatOnType: false,
                }}
              />

              {/* Drag Handle Bar to resize height */}
              <div
                onMouseDown={handleMouseDownOnResize}
                onTouchStart={handleTouchStartOnResize}
                className="group flex h-4 w-full cursor-row-resize items-center justify-center border-t border-[#22283E] bg-[#08090C] transition-colors select-none hover:bg-white/[0.04] active:bg-indigo-500/20"
                title="Drag handle to resize editor height"
              >
                <div className="h-1 w-12 rounded-full bg-white/20 transition-all duration-200 group-hover:w-20 group-hover:bg-indigo-400" />
              </div>
            </div>

            {/* Submission Action Bar */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] text-zinc-500">
                Evaluated by Vertex AI against OpenAI/Meta Staff Engineering rubrics.
              </p>

              <Button
                disabled={isEvaluating}
                onClick={handleSubmit}
                className="bg-indigo-600 text-white hover:bg-indigo-500 font-semibold text-xs shadow-lg shadow-indigo-500/20"
              >
                {isEvaluating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin text-white" />
                    <span>Evaluating with Vertex AI...</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-3.5 w-3.5" />
                    <span>Submit for Staff Review</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Senior Staff Evaluation Debrief Section */}
      {evaluation && (
        <div className="rounded-2xl border border-indigo-500/30 bg-[#0C0E18] p-6 shadow-2xl shadow-indigo-500/10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between border-b border-white/[0.08] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-0.5 text-xs font-semibold text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  Staff Debrief & Grade
                </span>
                {getVerdictBadge(evaluation.verdict)}
              </div>
              <h3 className="mt-2 text-xl font-bold text-white">
                Senior Staff Architectural Evaluation
              </h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-2xl leading-relaxed">
                {evaluation.summary}
              </p>
            </div>

            {/* Score Radial Card */}
            <div className="flex items-center gap-4 rounded-xl border border-[#22283E] bg-[#131726] p-4">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-white">
                  {evaluation.overallScore}
                  <span className="text-sm font-normal text-zinc-500">/100</span>
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-indigo-400">
                  Overall Score
                </div>
              </div>
            </div>
          </div>

          {/* 5-Point Rubric Breakdown */}
          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              5-Point Big Tech Rubric Breakdown
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Correctness", val: evaluation.rubricBreakdown.correctness },
                { label: "Performance & Microtasks", val: evaluation.rubricBreakdown.performance },
                { label: "Architecture & Clean Code", val: evaluation.rubricBreakdown.architecture },
                { label: "Edge Cases & Races", val: evaluation.rubricBreakdown.edgeCases },
                { label: "Accessibility (a11y) & UX", val: evaluation.rubricBreakdown.accessibilityOrUx },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#22283E] bg-[#131726]/60 p-3"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                    <span>{item.label}</span>
                    <span className="font-bold text-white">{item.val}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.val >= 80
                          ? "bg-emerald-500"
                          : item.val >= 65
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Critical Issues Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Strengths */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Demonstrated Strengths</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-zinc-300">
                {evaluation.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Issues */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                <ShieldAlert className="h-4 w-4" />
                <span>Critical Gaps & Red Flags</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-zinc-300">
                {evaluation.criticalIssues.length > 0 ? (
                  evaluation.criticalIssues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{issue}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500 italic">Zero critical architectural flaws detected.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Staff-Level Model Answer & Architecture */}
          <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#08090C] p-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <Trophy className="h-4 w-4 text-indigo-400" />
                <span>Staff-Level Model Implementation & Architecture</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyModelAnswer(evaluation.staffLevelModelAnswer)}
                className="h-7 border-white/[0.08] bg-[#131726] text-xs text-zinc-300 hover:text-white"
              >
                {isCopiedModel ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    <span>Copy Solution</span>
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4">
              <CopilotMarkdown content={evaluation.staffLevelModelAnswer} />
            </div>
          </div>

          {/* Senior Takeaways */}
          {evaluation.seniorTakeaways && evaluation.seniorTakeaways.length > 0 && (
            <div className="mt-6 rounded-xl border border-[#22283E] bg-[#131726]/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span>Curriculum Master Key Principles to Internalize</span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {evaluation.seniorTakeaways.map((takeaway, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5 text-xs text-zinc-400"
                  >
                    <span className="font-mono text-indigo-400 font-bold">{idx + 1}.</span>
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
