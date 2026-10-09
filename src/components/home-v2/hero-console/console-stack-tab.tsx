"use client";

import React from "react";
import {
  Bot,
  Check,
  Cloud,
  Code2,
  Cpu,
  Database,
  Layers,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

export function ConsoleStackTab() {
  return (
    <div className="space-y-3 animate-fade-in font-sans flex-1 min-h-0 flex flex-col justify-between overflow-y-auto pr-1">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold font-mono text-xs">
            <Cpu size={14} />
            <span>Core Production Stack Architecture</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
            Frontend + Fullstack + AI
          </span>
        </div>

        {/* 9-Item Rich Architecture Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2.5">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Code2 size={14} className="text-cyan-400 shrink-0" />
              <span className="font-bold text-xs text-foreground truncate">Frontend Architecture</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Micro-frontends, Design Systems, State & 60fps micro-interactions
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Code2 size={14} className="text-indigo-400 shrink-0" />
              <span className="font-bold text-xs text-foreground truncate">Next.js 16 & React 19</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Server Components, Server Actions & App Router
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={14} className="text-blue-400 shrink-0" />
              <span className="font-bold text-xs text-foreground truncate">TypeScript 5.x</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Strict end-to-end type safety with Zod & Drizzle schemas
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Database size={14} className="text-emerald-400 shrink-0" />
              <span className="font-bold text-xs text-foreground truncate">Neon Postgres</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Serverless PostgreSQL with instant branching & autoscaling
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Layers size={14} className="text-teal-400 shrink-0" />
              <span className="font-bold text-xs text-foreground truncate">Drizzle ORM</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Type-safe relational queries & zero runtime overhead migrations
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Bot size={14} className="text-purple-400 shrink-0" />
              <span className="font-bold text-xs text-foreground truncate">Gemini 3.8 Flash</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Google Vertex AI SDK, Tool Calling & Agentic workflows
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={14} className="text-amber-400 shrink-0" />
              <span className="font-bold text-xs text-foreground truncate">Tailwind & Motion</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              High-framerate design tokens & glassmorphic system
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Cloud size={14} className="text-sky-400 shrink-0" />
              <span className="font-bold text-xs text-foreground truncate">Cloud Run & Docker</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Containerized microservices & Google Cloud infrastructure
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Terminal size={14} className="text-rose-400 shrink-0" />
              <span className="font-bold text-xs text-foreground truncate">Vercel Global Edge</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Low-latency edge caching, SSE stream & global CDN
            </p>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-[#131726] border border-white/[0.08] flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Check size={13} className="text-emerald-400 shrink-0" />
          <span>Zero legacy packages • Pure ESM Architecture • Sub-80ms TTFB</span>
        </span>
        <span className="text-primary font-semibold text-xs hidden sm:inline">Production Ready</span>
      </div>
    </div>
  );
}
