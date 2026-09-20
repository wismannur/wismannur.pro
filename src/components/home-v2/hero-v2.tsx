"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { HeroConsole } from "./hero-console";

const ElectricObsidian = dynamic(
  () => import("./electric-obsidian").then((mod) => mod.ElectricObsidian),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] sm:h-[440px] md:h-[480px] flex items-center justify-center">
        <div className="w-44 h-44 rounded-full bg-primary/10 animate-pulse blur-2xl" />
      </div>
    ),
  }
);

interface HeroV2Props {
  eyebrow?: string;
  title?: string;
  bio?: string;
}

export function HeroV2({ eyebrow, title, bio }: HeroV2Props) {
  const defaultEyebrow = "FULLSTACK ARCHITECTURE • AGENTIC AI • CLOUD";
  const defaultTitle = "Building High-Performance **Web Platforms** Powered by **Agentic AI**.";
  const defaultBio =
    "__Senior Fullstack Engineer__ turning complex product visions into production-grade web platforms and autonomous multi-agent workflows with Next.js 16, TypeScript, Neon PostgreSQL, and Gemini 3.8 Flash.";

  const displayEyebrow = eyebrow || defaultEyebrow;
  const displayTitle = title || defaultTitle;
  const displayBio = bio || defaultBio;

  return (
    <section className="pt-6 sm:pt-10 md:pt-14 pb-6 relative overflow-hidden isolate">
      <div className="container px-4 max-w-6xl mx-auto relative z-10">
        {/* Hero Top Grid: Content Left + 3D Electric Obsidian Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Left Column: Monumental Content */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 animate-fade-in">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-semibold border border-primary/25 shadow-sm backdrop-blur-sm">
              <Sparkles size={14} className="animate-pulse text-primary" />
              <span>
                <HighlightedText text={displayEyebrow} />
              </span>
            </div>

            {/* Massive Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.65rem] font-extrabold tracking-tight leading-[1.1] text-balance text-white">
              <HighlightedText text={displayTitle} />
            </h1>

            {/* Balanced Sub-Headline */}
            <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl text-balance">
              <HighlightedText text={displayBio} />
            </p>
          </div>

          {/* Right Column: 3D Electric Obsidian Visual */}
          <div className="lg:col-span-5 flex items-center justify-center animate-scale-in">
            <ElectricObsidian />
          </div>
        </div>

        {/* Centerpiece Interactive Intelligence Console */}
        <div className="mt-10 md:mt-14 max-w-5xl mx-auto animate-scale-in">
          <HeroConsole />
        </div>
      </div>
    </section>
  );
}
