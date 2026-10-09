"use client";

import React from "react";
import { Bot, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsoleTab } from "./constants";

interface ConsoleHeaderProps {
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
}

export function ConsoleHeader({ activeTab, onSelectTab }: ConsoleHeaderProps) {
  return (
    <>
      {/* Console Window Header (Desktop / Tablet) */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#11131E]/80 border-b border-white/[0.08]">
        {/* Window Controls */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]/80 border border-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80 border border-amber-500/40" />
            <div className="w-3 h-3 rounded-full bg-[#10B981]/80 border border-emerald-500/40" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-muted-foreground/80 inline-flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">wismannur ~ ai-assistant-console</span>
          </span>
        </div>

        {/* Interactive Tabs (Desktop / Tablet >= sm) */}
        <div className="hidden sm:flex items-center gap-1 bg-[#181B29] p-1 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => onSelectTab("assistant")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              activeTab === "assistant"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Bot size={13} className="text-primary-foreground" />
            <span>Wisman&apos;s AI Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("stack")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              activeTab === "stack"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Layers size={13} />
            <span>Fullstack Stack</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("metrics")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              activeTab === "metrics"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Zap size={13} />
            <span>Live Telemetry</span>
          </button>
        </div>
      </div>

      {/* Interactive Tabs (Mobile: positioned between header and body content) */}
      <div className="sm:hidden px-3 pt-2.5 pb-2 bg-[#11131E]/60 border-b border-white/[0.06]">
        <div className="grid grid-cols-3 gap-1 bg-[#181B29] p-1 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => onSelectTab("assistant")}
            className={cn(
              "py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === "assistant"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Bot size={12} className="text-primary-foreground shrink-0" />
            <span className="truncate">Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("stack")}
            className={cn(
              "py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === "stack"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Layers size={12} className="shrink-0" />
            <span className="truncate">Stack</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("metrics")}
            className={cn(
              "py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === "metrics"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Zap size={12} className="shrink-0" />
            <span className="truncate">Metrics</span>
          </button>
        </div>
      </div>
    </>
  );
}
