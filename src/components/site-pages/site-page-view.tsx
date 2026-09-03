"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Calendar, FileCheck, Globe, Shield, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getContentIcon } from "@/lib/icon-registry";

// Client-side MDX preview rendering
const MDXPreview = dynamic(() => import("@/components/mdx/mdx-preview"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 py-6">
      <Skeleton className="h-8 w-1/3 bg-white/[0.06] rounded-xl" />
      <Skeleton className="h-4 w-full bg-white/[0.04] rounded-lg" />
      <Skeleton className="h-4 w-5/6 bg-white/[0.04] rounded-lg" />
      <Skeleton className="h-4 w-2/3 bg-white/[0.04] rounded-lg" />
    </div>
  ),
});

type SitePageViewProps = {
  title: string;
  lastUpdatedLabel: string;
  content: string;
  icon: string;
};

export function SitePageView({ title, lastUpdatedLabel, content, icon }: SitePageViewProps) {
  const IconComponent = getContentIcon(icon) || Shield;

  return (
    <div className="min-h-screen py-12 sm:py-16 md:py-20 px-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-[450px] h-[250px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="container max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Navigation & Breadcrumb Row */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="rounded-full gap-2 text-gray-400 hover:text-white hover:bg-white/[0.06] font-semibold px-4 h-9 border border-white/[0.06]"
          >
            <Link href="/" data-umami-event="legal-back-home-click">
              <ArrowLeft size={15} />
              <span>Return Home</span>
            </Link>
          </Button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-gray-400 text-xs font-mono">
            <Globe size={12} className="text-primary" />
            <span>Legal Compliance</span>
          </div>
        </div>

        {/* Main Document Card */}
        <article className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0C0E18]/90 p-8 sm:p-12 md:p-14 shadow-2xl shadow-black/80 backdrop-blur-2xl">
          {/* Top Accent Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 pointer-events-none" />

          {/* Document Header */}
          <header className="border-b border-white/[0.08] pb-8 mb-8 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/30 text-primary shadow-lg shadow-primary/20 shrink-0">
                {React.createElement(IconComponent, { size: 22 })}
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-widest">
                  <Sparkles size={10} />
                  <span>OFFICIAL POLICY DOCUMENT</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  {title}
                </h1>
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 font-mono">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-primary shrink-0" />
                <span>
                  Last Modified:{" "}
                  <strong className="text-gray-200 font-semibold">{lastUpdatedLabel}</strong>
                </span>
              </div>
              <span className="text-gray-700 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <FileCheck size={13} className="text-emerald-400 shrink-0" />
                <span className="text-emerald-400/90 font-medium">Legally Verified & Active</span>
              </div>
            </div>
          </header>

          {/* MDX Document Body */}
          <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-gray-300 prose-p:leading-relaxed prose-li:text-gray-300 prose-strong:text-white prose-a:text-primary hover:prose-a:text-primary/80 prose-hr:border-white/[0.08]">
            <MDXPreview code={content} />
          </div>
        </article>
      </div>
    </div>
  );
}
