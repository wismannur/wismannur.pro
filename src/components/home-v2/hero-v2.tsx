"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { HeroConsole } from "./hero-console";

interface HeroV2Props {
  eyebrow?: string;
  title?: string;
  bio?: string;
}

export function HeroV2({ eyebrow, title, bio }: HeroV2Props) {
  const defaultEyebrow = "FULLSTACK ARCHITECTURE • AGENTIC AI • CLOUD";
  const defaultTitle = "Building High-Performance **Web Platforms** Powered by **Agentic AI**.";
  const defaultBio =
    "__Senior Fullstack Engineer__ turning complex product visions into production-grade web platforms and autonomous multi-agent workflows with Next.js 16, TypeScript, Neon PostgreSQL, and Gemini 3.7 Flash.";

  const displayEyebrow = eyebrow || defaultEyebrow;
  const displayTitle = title || defaultTitle;
  const displayBio = bio || defaultBio;

  return (
    <section className="pt-6 sm:pt-10 md:pt-14 pb-6 relative overflow-hidden">
      {/* Ambient background lighting effects */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-primary/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-48 left-1/3 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="container px-4 max-w-6xl mx-auto">
        {/* Monumental Centered Hero Content */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-semibold border border-primary/25 shadow-sm backdrop-blur-sm">
            <Sparkles size={14} className="animate-pulse text-primary" />
            <span>
              <HighlightedText text={displayEyebrow} />
            </span>
          </div>

          {/* Massive Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-balance text-white">
            <HighlightedText text={displayTitle} />
          </h1>

          {/* Balanced Sub-Headline */}
          <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto text-balance">
            <HighlightedText text={displayBio} />
          </p>
        </div>

        {/* Centerpiece Interactive Intelligence Console */}
        <div className="mt-10 md:mt-14 max-w-5xl mx-auto animate-scale-in">
          <HeroConsole />
        </div>
      </div>
    </section>
  );
}
