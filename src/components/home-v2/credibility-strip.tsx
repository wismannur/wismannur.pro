"use client";

import React from "react";
import { ShieldCheck, Zap, Layers, Sparkles } from "lucide-react";

export function CredibilityStrip() {
  const items = [
    {
      icon: Zap,
      label: "7+ Years Experience",
      sub: "Production Web & Distributed Systems",
    },
    {
      icon: ShieldCheck,
      label: "Strict Type Safety",
      sub: "100% Zod + Drizzle + TypeScript",
    },
    {
      icon: Sparkles,
      label: "Production AI Agents",
      sub: "Gemini 3.8 Flash & Tool Calling",
    },
    {
      icon: Layers,
      label: "Sub-85ms Edge P95",
      sub: "Next.js 16 App Router & Edge Runtime",
    },
  ];

  return (
    <section className="relative">
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4 md:p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-md shadow-sm">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-muted/40 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
