"use client";

import React from "react";
import { Activity, Bot, Database, Globe, ShieldCheck } from "lucide-react";

export function ConsoleMetricsTab() {
  return (
    <div className="space-y-3 animate-fade-in font-mono text-xs flex-1 min-h-0 flex flex-col justify-between overflow-y-auto pr-1">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Activity size={14} />
            <span>Production Telemetry & Observability</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            All Systems Optimal
          </span>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 font-sans">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <div className="text-xl font-black text-indigo-400 mb-0.5">7+ Yrs</div>
            <div className="text-[10px] text-muted-foreground font-medium">
              Production Experience
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <div className="text-xl font-black text-cyan-400 mb-0.5">&lt;65ms</div>
            <div className="text-[10px] text-muted-foreground font-medium">
              P95 Edge Latency
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <div className="text-xl font-black text-emerald-400 mb-0.5">100%</div>
            <div className="text-[10px] text-muted-foreground font-medium">
              Type Safety Ratio
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <div className="text-xl font-black text-amber-400 mb-0.5">99.9%</div>
            <div className="text-[10px] text-muted-foreground font-medium">
              Uptime Reliability
            </div>
          </div>
        </div>

        {/* Live Subsystems Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 font-sans">
          <div className="p-2.5 rounded-xl bg-[#121524]/60 border border-white/[0.06] text-[11px] space-y-1">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span className="flex items-center gap-1">
                <Globe size={12} className="text-cyan-400" /> Global Edge
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">sin1 (SG)</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              HTTP/3 & TLS 1.3 edge termination with global caching
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#121524]/60 border border-white/[0.06] text-[11px] space-y-1">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span className="flex items-center gap-1">
                <Database size={12} className="text-emerald-400" /> Neon DB Pool
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">14ms P95</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Zero idle leaks & connection pool autoscaling active
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#121524]/60 border border-white/[0.06] text-[11px] space-y-1">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span className="flex items-center gap-1">
                <Bot size={12} className="text-purple-400" /> Gemini Vertex
              </span>
              <span className="text-[10px] text-purple-400 font-mono">~38ms TTFT</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Streaming at ~72 tok/s with live prompt caching
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Audited Bar */}
      <div className="p-2.5 rounded-xl bg-[#131726] border border-white/[0.08] flex items-center justify-between text-[11px] text-muted-foreground font-sans">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <span>Core Web Vitals: LCP &lt;1.1s • CLS 0.00 • INP &lt;45ms • CSP Active</span>
        </span>
        <span className="text-primary font-semibold text-xs hidden sm:inline">Audited</span>
      </div>
    </div>
  );
}
