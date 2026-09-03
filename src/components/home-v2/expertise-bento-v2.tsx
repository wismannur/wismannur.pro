"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Globe, Sparkles } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExpertiseBentoV2() {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "fullstack" | "frontend" | "ai" | "cloud"
  >("all");

  const techPills = [
    { name: "Next.js 16 (App Router)", cat: "fullstack", badge: "Primary" },
    { name: "React 19 Server Components", cat: "frontend", badge: "Core" },
    { name: "TypeScript (Strict 5.x)", cat: "fullstack", badge: "Standard" },
    { name: "Gemini 3.7 Flash & Vertex AI", cat: "ai", badge: "AI Core" },
    { name: "Autonomous Tool Calling", cat: "ai", badge: "Agentic" },
    { name: "Model Context Protocol (MCP)", cat: "ai", badge: "Advanced" },
    { name: "Neon Serverless Postgres", cat: "cloud", badge: "Relational" },
    { name: "Drizzle ORM & Migrations", cat: "fullstack", badge: "Type-Safe" },
    { name: "Design Systems & Token Architecture", cat: "frontend", badge: "Design Tokens" },
    { name: "Tailwind CSS & Framer Motion", cat: "frontend", badge: "UI & Motion" },
    { name: "TanStack React Query", cat: "frontend", badge: "Async State" },
    { name: "Docker & Cloud Run / Edge", cat: "cloud", badge: "Cloud & Edge" },
  ];

  const filteredPills =
    activeCategory === "all" ? techPills : techPills.filter((item) => item.cat === activeCategory);

  return (
    <section className="relative overflow-hidden py-4 md:py-8">
      <div className="container px-4 max-w-6xl mx-auto">
        <SectionHeader
          title="Architectural Pillars & Technical Mastery"
          subtitle="Core Ecosystem"
          description="Engineered for high throughput, sub-second latency, and intuitive developer and user experiences."
          className="text-center mb-10 md:mb-12"
        />

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Pillar 1: Fullstack Web (Col 7) */}
          <div className="md:col-span-7 flex">
            <SpotlightCard className="p-6 md:p-8 flex flex-col justify-between h-full rounded-3xl bg-card/70 border border-border/50 hover:border-primary/40 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                      <Globe size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg md:text-xl text-foreground">
                        Modern Fullstack Web Engineering
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Next.js 16 App Router • React 19 • Server Actions
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Specialty
                  </span>
                </div>

                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-6">
                  Building production web applications with zero layout shift, instantaneous edge
                  hydration, and strict end-to-end type validation from database queries to UI
                  components.
                </p>

                {/* Features list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                  <div className="flex items-center gap-2 text-xs text-foreground/90 p-2.5 rounded-xl bg-background/50 border border-border/40">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    <span>SSR & Streaming Edge Runtimes</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/90 p-2.5 rounded-xl bg-background/50 border border-border/40">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    <span>Zod & TypeScript Strict Validation</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/90 p-2.5 rounded-xl bg-background/50 border border-border/40">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    <span>Optimistic UI & Cache Revalidation</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/90 p-2.5 rounded-xl bg-background/50 border border-border/40">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    <span>Lighthouse Score 95+ Standard</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span>High-throughput web architectures</span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="p-0 text-primary hover:bg-transparent font-semibold"
                >
                  <Link href="/projects" className="flex items-center gap-1">
                    Explore fullstack works <ArrowRight size={13} />
                  </Link>
                </Button>
              </div>
            </SpotlightCard>
          </div>

          {/* Pillar 2: Autonomous AI Systems (Col 5) */}
          <div className="md:col-span-5 flex">
            <SpotlightCard className="p-6 md:p-8 flex flex-col justify-between h-full rounded-3xl bg-card/70 border border-border/50 hover:border-cyan-500/40 transition-all duration-300">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-foreground">
                      Autonomous AI Systems & MCP
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Gemini API • Tool Calling • Multi-Agent Workflows
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-5">
                  Transforming raw LLMs into autonomous, reliable problem-solving agents equipped
                  with Model Context Protocol (MCP), schema validation, and safe execution
                  guardrails.
                </p>

                <div className="space-y-2.5 mb-6">
                  <div className="p-3 rounded-xl bg-[#10131E] border border-cyan-500/20 text-xs font-mono">
                    <div className="flex items-center justify-between text-cyan-400 mb-1">
                      <span className="font-semibold">Tool Calling Protocol</span>
                      <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-sans">
                      Deterministic function execution with structured JSON schemas and automatic
                      error recovery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span>Production GenAI Systems</span>
                <span className="font-mono text-cyan-400 font-semibold text-[11px]">
                  Gemini 3.7 Flash SDK
                </span>
              </div>
            </SpotlightCard>
          </div>

          {/* Pillar 3: Interactive Tech Radar (Col 12) */}
          <div className="md:col-span-12">
            <SpotlightCard className="p-6 md:p-8 rounded-3xl bg-card/70 border border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Production Tech Ecosystem</h3>
                    <p className="text-xs text-muted-foreground">
                      Battle-tested tools and frameworks utilized in production
                    </p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
                  {(
                    [
                      { id: "all", label: "All Stack" },
                      { id: "fullstack", label: "Fullstack" },
                      { id: "frontend", label: "Frontend & UI" },
                      { id: "ai", label: "AI & Agents" },
                      { id: "cloud", label: "Data & Cloud" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                        activeCategory === tab.id
                          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tech Pills Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {filteredPills.map((pill) => (
                  <div
                    key={pill.name}
                    className="p-3 rounded-xl bg-background/60 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 flex flex-col justify-between gap-1.5"
                  >
                    <span className="text-xs font-bold text-foreground">{pill.name}</span>
                    {pill.badge && (
                      <span className="text-[10px] w-fit px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20">
                        {pill.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}
