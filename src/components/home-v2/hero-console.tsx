"use client";

import React from "react";
import { ConsoleHeader } from "./hero-console/console-header";
import { ConsoleAssistantTab } from "./hero-console/console-assistant-tab";
import { ConsoleStackTab } from "./hero-console/console-stack-tab";
import { ConsoleMetricsTab } from "./hero-console/console-metrics-tab";
import { useHeroConsole } from "./hero-console/use-hero-console";

export function HeroConsole() {
  const {
    activeTab,
    setActiveTab,
    messages,
    input,
    setInput,
    isLoading,
    suggestedPrompts,
    refreshSuggestedPrompts,
    scrollRef,
    inputRef,
    consoleHeight,
    inputHeight,
    handleMouseDownResizeConsole,
    handleMouseDownOnResize,
    handleReset,
    handleSendMessage,
  } = useHeroConsole();

  return (
    <div className="relative rounded-3xl border border-border/60 bg-[#090A0F]/90 dark:bg-[#07080D]/95 text-[#E2E8F0] shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-primary/40 group/console">
      {/* Ambient top glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header with window controls & tabs */}
      <ConsoleHeader activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Body Area */}
      <div
        style={{ height: `${consoleHeight}px` }}
        className="p-4 sm:p-5 flex flex-col justify-between min-h-[380px] transition-[height] duration-75"
      >
        {/* TAB 1: Live AI Assistant Terminal */}
        {activeTab === "assistant" && (
          <ConsoleAssistantTab
            messages={messages}
            isLoading={isLoading}
            input={input}
            setInput={setInput}
            inputHeight={inputHeight}
            suggestedPrompts={suggestedPrompts}
            refreshSuggestedPrompts={refreshSuggestedPrompts}
            onReset={handleReset}
            onSendMessage={handleSendMessage}
            onMouseDownOnResize={handleMouseDownOnResize}
            scrollRef={scrollRef}
            inputRef={inputRef}
          />
        )}

        {/* TAB 2: Fullstack Architecture (Rich 9-Item Grid) */}
        {activeTab === "stack" && <ConsoleStackTab />}

        {/* TAB 3: Live Telemetry & Metrics (Observability Dashboard) */}
        {activeTab === "metrics" && <ConsoleMetricsTab />}

        {/* Console Footer */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Powered by Gemini 3.8 Flash & Vertex AI</span>
          </div>
          <span>Engineered by Wisman Nur</span>
        </div>
      </div>

      {/* Bottom Resize Handle */}
      <div
        onMouseDown={handleMouseDownResizeConsole}
        className="w-full h-3.5 cursor-row-resize flex items-center justify-center bg-[#090A0F]/90 hover:bg-white/[0.04] transition-colors border-t border-white/[0.06] group/resize select-none"
        title="Drag down to resize terminal height"
      >
        <div className="w-12 h-1 rounded-full bg-white/20 group-hover/resize:bg-primary transition-colors" />
      </div>
    </div>
  );
}
