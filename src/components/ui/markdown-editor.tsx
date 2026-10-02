"use client";

import React, { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Columns2,
  Copy,
  Eye,
  GripVertical,
  Maximize2,
  Minimize2,
  PenLine,
  Sparkles,
  SquareCode,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Monaco } from "@monaco-editor/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CopilotMarkdown } from "@/components/cms/copilot/copilot-markdown";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[340px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#08090C] text-xs text-zinc-400">
      <Sparkles className="h-5 w-5 animate-spin text-primary" />
      <span>Loading Monaco Editor Engine...</span>
    </div>
  ),
});

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  defaultHeight?: number;
  badgeLabel?: string;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  className,
  defaultHeight = 380,
  badgeLabel = "Monaco Markdown",
  placeholder = "Markdown preview will render here in real time as you write.",
}: MarkdownEditorProps) {
  // Modes: "split" (side-by-side) or "tab" (single pane toggle between write & preview)
  const [viewMode, setViewMode] = useState<"split" | "tab">("split");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage for left editor pane
  const [editorHeight, setEditorHeight] = useState<number>(defaultHeight);
  const [copied, setCopied] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingSplitRef = useRef<boolean>(false);
  const isDraggingHeightRef = useRef<boolean>(false);
  const dragStartYHeightRef = useRef<number>(0);
  const startHeightRef = useRef<number>(defaultHeight);

  // Define Monaco Editor Obsidian Theme
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

  // Horizontal Split Resizing logic
  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSplitRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingSplitRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = moveEvent.clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      // Clamp between 20% and 80%
      const clampedRatio = Math.min(Math.max(percentage, 20), 80);
      setSplitRatio(clampedRatio);
    };

    const handleMouseUp = () => {
      isDraggingSplitRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleSplitTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingSplitRef.current = true;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingSplitRef.current || !containerRef.current || moveEvent.touches.length !== 1) return;
      const touch = moveEvent.touches[0];
      if (!touch) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = touch.clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      const clampedRatio = Math.min(Math.max(percentage, 20), 80);
      setSplitRatio(clampedRatio);
    };

    const handleTouchEnd = () => {
      isDraggingSplitRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Vertical Height Resizing logic
  const handleHeightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingHeightRef.current = true;
    dragStartYHeightRef.current = e.clientY;
    startHeightRef.current = editorHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingHeightRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYHeightRef.current;
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 260), 900);
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingHeightRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleHeightTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingHeightRef.current = true;
    dragStartYHeightRef.current = touch.clientY;
    startHeightRef.current = editorHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingHeightRef.current) return;
      const currentTouch = moveEvent.touches[0];
      if (!currentTouch) return;
      const deltaY = currentTouch.clientY - dragStartYHeightRef.current;
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 260), 900);
      setEditorHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingHeightRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const handleCopyMarkdown = useCallback(() => {
    if (!value) {
      toast.info("No content to copy");
      return;
    }
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Markdown copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  // Word and character count
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className={cn("space-y-2 rounded-2xl border border-white/[0.08] bg-[#0A0D18] p-3 sm:p-4 shadow-xl", className)}>
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-white/[0.06]">
        {/* Left indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="bg-indigo-500/10 border-indigo-500/25 text-indigo-300 font-mono text-[11px] gap-1 px-2.5 py-0.5"
          >
            <SquareCode className="w-3 h-3 text-indigo-400" />
            <span>{badgeLabel}</span>
          </Badge>
          <span className="text-[11px] text-gray-400 font-mono">
            {wordCount} words &bull; {charCount} chars
          </span>
        </div>

        {/* Right switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* If Tab mode is active, show Tab triggers */}
          {viewMode === "tab" && (
            <div className="flex items-center rounded-xl bg-[#131726] border border-white/[0.08] p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("write")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                  activeTab === "write"
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <PenLine className="w-3 h-3" />
                <span>Write</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                  activeTab === "preview"
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>
          )}

          {/* View Mode Switcher (Split vs Tab) */}
          <div className="flex items-center rounded-xl bg-[#131726] border border-white/[0.08] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                viewMode === "split"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              )}
              title="Side-by-side Split View"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tab")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                viewMode === "tab"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              )}
              title="Tab View (Write / Preview)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabs</span>
            </button>
          </div>

          {/* Copy Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopyMarkdown}
            className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>

          {/* Expand/Collapse Height Quick Toggles */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setEditorHeight((prev) => (prev > 450 ? 320 : 560))}
            className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
            title={editorHeight > 450 ? "Collapse height" : "Expand height"}
          >
            {editorHeight > 450 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main Resizable Editor Box with Nested Bottom Drag Handle */}
      <div
        ref={containerRef}
        style={{ height: `${editorHeight}px` }}
        className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#08090C] overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-inner"
      >
        {/* Pane Container */}
        <div className="relative flex-1 flex flex-row overflow-hidden w-full">
          {viewMode === "split" ? (
            /* SPLIT SIDE-BY-SIDE MODE */
            <>
              {/* Left: Monaco Editor Pane */}
              <div style={{ width: `${splitRatio}%` }} className="relative h-full overflow-hidden shrink-0">
                <MonacoEditor
                  height="100%"
                  language="markdown"
                  theme="electric-obsidian"
                  value={value}
                  beforeMount={handleEditorBeforeMount}
                  onChange={(newVal) => onChange(newVal || "")}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    tabSize: 2,
                    automaticLayout: true,
                    renderLineHighlight: "all",
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>

              {/* Center Divider Resizer Handle */}
              <div
                onMouseDown={handleSplitMouseDown}
                onTouchStart={handleSplitTouchStart}
                className="group relative z-20 flex w-2 cursor-col-resize items-center justify-center bg-white/[0.03] hover:bg-primary/20 transition-colors select-none shrink-0 border-x border-white/[0.04]"
                title="Drag horizontally to resize panes"
              >
                <div className="flex h-8 w-3 items-center justify-center rounded-sm bg-[#131726] border border-white/[0.1] group-hover:border-primary/50 shadow-sm">
                  <GripVertical className="w-2.5 h-2.5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
              </div>

              {/* Right: Markdown Preview Pane */}
              <div
                style={{ width: `${100 - splitRatio}%` }}
                className="relative h-full overflow-y-auto custom-scrollbar p-4 bg-[#08090C] border-l border-white/[0.06] text-slate-100 flex-1"
              >
                <div className="sticky top-0 right-0 z-10 flex justify-end pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 bg-[#0C0E18]/80 px-2 py-0.5 rounded border border-white/[0.08]">
                    Live Preview ({Math.round(100 - splitRatio)}%)
                  </span>
                </div>
                {value.trim() ? (
                  <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed text-gray-200">
                    <CopilotMarkdown content={value} />
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-gray-500 italic space-y-1">
                    <Sparkles className="w-5 h-5 text-gray-600 mb-1" />
                    <p>{placeholder}</p>
                    <p className="text-[11px] text-gray-600">Supports headers (#), lists (-), bold (**), tables, and code blocks.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* TABBED MODE */
            <div className="w-full h-full">
              {activeTab === "write" ? (
                <MonacoEditor
                  height="100%"
                  language="markdown"
                  theme="electric-obsidian"
                  value={value}
                  beforeMount={handleEditorBeforeMount}
                  onChange={(newVal) => onChange(newVal || "")}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    tabSize: 2,
                    automaticLayout: true,
                    renderLineHighlight: "all",
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              ) : (
                <div className="w-full h-full overflow-y-auto custom-scrollbar p-5 bg-[#08090C] text-slate-100">
                  {value.trim() ? (
                    <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed text-gray-200">
                      <CopilotMarkdown content={value} />
                    </div>
                  ) : (
                    <div className="flex h-60 flex-col items-center justify-center text-center text-xs text-gray-500 italic space-y-1">
                      <Sparkles className="w-6 h-6 text-gray-600 mb-1" />
                      <p>No markdown content entered yet.</p>
                      <p className="text-[11px] text-gray-600">Switch back to &quot;Write&quot; tab to type or paste content.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Drag Handle Bar to Resize Inside Field */}
        <div
          onMouseDown={handleHeightMouseDown}
          onTouchStart={handleHeightTouchStart}
          className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04] shrink-0"
          title="Drag handle to resize editor height"
        >
          <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-16 transition-all duration-200" />
        </div>
      </div>
    </div>
  );
}
