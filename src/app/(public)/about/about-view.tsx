"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { SectionHeader } from "@/components/ui/section-header";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { CtaV2 } from "@/components/home-v2/cta-v2";
import { ResumeSection } from "./resume-section";
import { getContentIcon } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import type { AboutCopy } from "@/services/page-copy/types";
import type { ResumeEntry } from "@/services/resume/types";
import type { SiteSettings } from "@/services/site-settings/types";
import type { Skill } from "@/services/skills/types";

type AboutViewProps = {
  experiences: ResumeEntry[];
  education: ResumeEntry[];
  skills: Skill[];
  copy: AboutCopy | null;
  settings?: SiteSettings;
};

export function AboutView({ experiences, education, skills, copy, settings }: AboutViewProps) {
  const hasResume = experiences.length > 0 || education.length > 0;
  const hero = copy?.hero;

  return (
    <div className="space-y-16 md:space-y-24 pb-12">
      {/* 1. Hero / Architect Profile Spotlight */}
      <section className="relative overflow-hidden pt-4 sm:pt-8 md:pt-12">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-primary/15 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 w-[450px] h-[250px] bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="container px-4 max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Bio & High-Signal Storytelling (Col 7) */}
            <div className="lg:col-span-7 space-y-6 animate-fade-in order-2 lg:order-1">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-semibold border border-primary/25 shadow-sm backdrop-blur-sm">
                <Sparkles size={14} className="animate-pulse text-primary" />
                <span>{hero?.badge || "FULLSTACK ARCHITECTURE • AGENTIC AI"}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
                <HighlightedText
                  text={
                    hero?.title ?? "Building High-Performance Digital Systems for the Modern Web."
                  }
                />
              </h1>

              {/* Narrative Paragraphs */}
              <div className="space-y-4 text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
                {hero?.paragraphs?.map((paragraph, index) => (
                  <p key={index}>
                    <HighlightedText text={paragraph} boldClassName="font-bold text-white" />
                  </p>
                ))}
              </div>

              {/* Primary Actions */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
                >
                  <Link
                    href="/hire-me"
                    data-umami-event="about-hero-hire-me-click"
                    className="inline-flex items-center gap-2"
                  >
                    <Sparkles size={15} className="animate-pulse" />
                    <span>Start a Project</span>
                    <ChevronRight
                      size={15}
                      className="group-hover:translate-x-1 transition-transform duration-200"
                    />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold border-white/[0.12] bg-white/[0.04] backdrop-blur-md hover:bg-primary/10 hover:border-primary/40 hover:text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group text-gray-200"
                >
                  <Link
                    href="/services"
                    data-umami-event="about-hero-services-click"
                    className="inline-flex items-center gap-2"
                  >
                    <span>Explore Solutions & Retainers</span>
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
                    />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: Profile Card / Avatar Spotlight (Col 5) */}
            <div className="lg:col-span-5 animate-scale-in order-1 lg:order-2">
              <SpotlightCard className="p-5 md:p-6 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.09] shadow-2xl backdrop-blur-xl">
                {/* Avatar Wrapper */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/[0.08] group flex items-center justify-center">
                  {hero?.photoUrl && hero.photoUrl !== "/placeholder.svg" ? (
                    <Image
                      src={hero.photoUrl}
                      alt="Wisman Nur"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                  ) : (
                    /* Premium Monogram Fallback Avatar */
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#121526] via-[#0E111F] to-[#08090C] p-6 text-center">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#171B30] shadow-xl flex items-center justify-center mb-4 group-hover:border-primary/50 transition-all">
                        <Image
                          src="/logo.webp"
                          alt="Wisman Nur Logo"
                          width={64}
                          height={64}
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Wisman Nur</h3>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        Senior Fullstack & AI Systems Engineer
                      </p>
                    </div>
                  )}

                  {/* Hover Badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                    {hero?.photoBadge && (
                      <span className="bg-primary/90 text-white text-xs px-3.5 py-1.5 rounded-full font-semibold shadow-lg backdrop-blur-md">
                        {hero.photoBadge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stat Pills Grid */}
                {hero?.statPills && hero.statPills.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {hero.statPills.map((pill) => {
                      const Icon = getContentIcon(pill.icon);
                      return (
                        <div
                          key={pill.label}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border backdrop-blur-sm",
                            pill.variant === "success"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-primary/10 text-primary border-primary/25"
                          )}
                        >
                          <Icon size={14} className="flex-shrink-0" />
                          <span className="truncate">{pill.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SpotlightCard>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Architectural Convictions & Values */}
      <section className="py-6 md:py-10 relative overflow-hidden">
        <div className="container max-w-6xl px-4 mx-auto">
          <SectionHeader
            title={copy?.whySection.title || "Engineering Values & Principles"}
            subtitle={copy?.whySection.subtitle || "How I Build"}
            description={
              copy?.whySection.description ||
              "Delivering production-grade software by combining architectural discipline with modern agentic AI workflows."
            }
            className="text-center mb-10 md:mb-12"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {copy?.whyCards?.map((card, index) => {
              const Icon = getContentIcon(card.icon);
              return (
                <SpotlightCard
                  key={card.title || index}
                  className="p-7 md:p-8 flex flex-col justify-between h-full bg-[#0D0F19]/80 border border-white/[0.08] hover:border-primary/40 hover:shadow-2xl transition-all duration-300 rounded-3xl"
                >
                  <div>
                    <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Skills & Technical Arsenal Grid */}
      {skills.length > 0 && (
        <section className="py-6 md:py-10 relative overflow-hidden">
          <div className="container px-4 max-w-6xl mx-auto">
            <SectionHeader
              title={copy?.skillsSection.title || "Skills & Core Ecosystem"}
              subtitle={copy?.skillsSection.subtitle || "Technical Arsenal"}
              description="Core toolchain and frameworks utilized to build fast, type-safe, and scalable systems."
              className="mb-8 md:mb-10 text-center"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-fade-in">
              {skills.map((skill, index) => (
                <SpotlightCard
                  key={skill.id}
                  className="p-3.5 flex items-center justify-center text-center rounded-2xl bg-[#0D0F19]/80 border border-white/[0.08] hover:border-primary/40 transition-all duration-200"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <span className="text-xs md:text-sm font-semibold text-gray-200 group-hover:text-primary transition-colors truncate">
                    {skill.name}
                  </span>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Experience & Education Timeline */}
      {hasResume && <ResumeSection experiences={experiences} education={education} />}

      {/* 5. Conversion Closing CTA Card */}
      <CtaV2 settings={settings} />
    </div>
  );
}
