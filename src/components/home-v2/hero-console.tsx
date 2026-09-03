"use client";

import React, { useState } from "react";
import {
  Bot,
  Check,
  Code2,
  Cpu,
  Database,
  Layers,
  Play,
  RefreshCw,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ConsoleTab = "agent" | "stack" | "metrics";

export function HeroConsole() {
  const [activeTab, setActiveTab] = useState<ConsoleTab>("agent");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(3);

  const handleRunAgentSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);

    setTimeout(() => setSimulationStep(1), 500);
    setTimeout(() => setSimulationStep(2), 1100);
    setTimeout(() => {
      setSimulationStep(3);
      setIsSimulating(false);
    }, 1800);
  };

  return (
    <div className="relative rounded-3xl border border-border/60 bg-[#090A0F]/90 dark:bg-[#07080D]/95 text-[#E2E8F0] shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-primary/40 group/console">
      {/* Ambient top glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Console Window Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#11131E]/80 border-b border-white/[0.08]">
        {/* Window Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]/80 border border-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80 border border-amber-500/40" />
            <div className="w-3 h-3 rounded-full bg-[#10B981]/80 border border-emerald-500/40" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-muted-foreground/80 hidden sm:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            wismannur ~ fullstack-ai-console
          </span>
        </div>

        {/* Interactive Tabs */}
        <div className="flex items-center gap-1 bg-[#181B29] p-1 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("agent")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              activeTab === "agent"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Bot size={13} />
            <span className="hidden sm:inline">AI Agent Runtime</span>
            <span className="sm:hidden">Agent</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stack")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              activeTab === "stack"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Layers size={13} />
            <span className="hidden sm:inline">Fullstack Stack</span>
            <span className="sm:hidden">Stack</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("metrics")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              activeTab === "metrics"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Zap size={13} />
            <span className="hidden sm:inline">Live Telemetry</span>
            <span className="sm:hidden">Metrics</span>
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div className="p-5 md:p-6 min-h-[300px] flex flex-col justify-between">
        {/* TAB 1: AI Agent Runtime */}
        {activeTab === "agent" && (
          <div className="space-y-4 font-mono text-xs animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Sparkles size={14} className="animate-pulse" />
                <span>Multi-Agent Task Orchestrator</span>
              </div>
              <button
                type="button"
                onClick={handleRunAgentSimulation}
                disabled={isSimulating}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all font-sans text-xs font-medium disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Orchestrating...</span>
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>
            </div>

            {/* Step Execution Sequence */}
            <div className="space-y-2.5 pt-1">
              {/* Step 1: Ingestion & Intent */}
              <div
                className={cn(
                  "p-3 rounded-xl border transition-all duration-300",
                  simulationStep >= 1
                    ? "bg-[#131726] border-indigo-500/40 text-gray-200"
                    : "bg-white/[0.02] border-white/[0.05] text-gray-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span className="font-semibold text-foreground">
                      Task Decomposition & Tool Selection
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">Gemini 3.7 Flash</span>
                </div>
                {simulationStep >= 1 && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground pl-7">
                    Model identified required tools:{" "}
                    <code className="text-cyan-400">
                      [postgres_query, schema_analyzer, edge_cache]
                    </code>
                  </p>
                )}
              </div>

              {/* Step 2: Tool Calling & DB Query */}
              <div
                className={cn(
                  "p-3 rounded-xl border transition-all duration-300",
                  simulationStep >= 2
                    ? "bg-[#131726] border-cyan-500/40 text-gray-200"
                    : "bg-white/[0.02] border-white/[0.05] text-gray-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <span className="font-semibold text-foreground">
                      Type-Safe Tool Execution (Neon Postgres)
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">18ms</span>
                </div>
                {simulationStep >= 2 && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground pl-7">
                    Executed indexed Drizzle query via Server Actions with zero SQL injection risk.
                  </p>
                )}
              </div>

              {/* Step 3: Synthesis & Edge Response */}
              <div
                className={cn(
                  "p-3 rounded-xl border transition-all duration-300",
                  simulationStep >= 3
                    ? "bg-[#131726] border-emerald-500/40 text-gray-200"
                    : "bg-white/[0.02] border-white/[0.05] text-gray-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                      3
                    </span>
                    <span className="font-semibold text-foreground">
                      Streaming Structured JSON Response
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">P95 ~72ms</span>
                </div>
                {simulationStep >= 3 && (
                  <div className="mt-1.5 text-[11px] text-emerald-400/90 pl-7 flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-400" />
                    <span>Completed: 100% verified schema contracts & telemetry logged.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Fullstack Architecture */}
        {activeTab === "stack" && (
          <div className="space-y-4 animate-fade-in font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold font-mono text-xs">
                <Cpu size={14} />
                <span>Core Production Stack Architecture</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                Modern Next.js 16 + Cloud
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Code2 size={16} className="text-indigo-400" />
                  <span className="font-bold text-xs text-foreground">Next.js 16</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  React 19 App Router, Server Components & Actions
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={16} className="text-cyan-400" />
                  <span className="font-bold text-xs text-foreground">TypeScript</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Strict end-to-end type validation with Zod & Drizzle
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Database size={16} className="text-emerald-400" />
                  <span className="font-bold text-xs text-foreground">Neon Postgres</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Serverless PostgreSQL with instant autoscaling
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Bot size={16} className="text-purple-400" />
                  <span className="font-bold text-xs text-foreground">GenAI & MCP</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Gemini 3.7 Flash SDK, Model Context Protocol & Agents
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap size={16} className="text-amber-400" />
                  <span className="font-bold text-xs text-foreground">Tailwind & Motion</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  High-framerate micro-interactions & sleek token design
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Terminal size={16} className="text-rose-400" />
                  <span className="font-bold text-xs text-foreground">Edge & Cloud</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Vercel Global Edge Network & Google Cloud Run
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Live Telemetry & Metrics */}
        {activeTab === "metrics" && (
          <div className="space-y-4 animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Zap size={14} />
                <span>Production Telemetry & SLO Benchmarks</span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                All Systems Optimal
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="text-2xl font-black text-indigo-400 mb-0.5">7+ Yrs</div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Production Experience
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="text-2xl font-black text-cyan-400 mb-0.5">&lt;75ms</div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  P95 Edge Latency
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="text-2xl font-black text-emerald-400 mb-0.5">100%</div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Type Safety Ratio
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="text-2xl font-black text-amber-400 mb-0.5">99.9%</div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Uptime Reliability
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#131726] border border-white/[0.08] flex items-center justify-between text-[11px] text-muted-foreground font-sans">
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-emerald-400" />
                <span>Core Web Vitals: LCP &lt;1.2s • CLS 0.00 • INP &lt;50ms</span>
              </span>
              <span className="text-primary font-semibold">Audited</span>
            </div>
          </div>
        )}

        {/* Console Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Environment: Production Ready</span>
          </div>
          <span>Engineered by Wisman Nur</span>
        </div>
      </div>
    </div>
  );
}
