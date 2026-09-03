"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle,
  FileText,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";

import type { SiteSettings } from "@/services/site-settings/types";

interface RecruiterFastTrackProps {
  settings?: SiteSettings;
}

export function RecruiterFastTrack({ settings }: RecruiterFastTrackProps) {
  const locationDisplay = settings?.location
    ? `${settings.location} • Global Remote Ready`
    : "Bandung, West Java, Indonesia (UTC+7) • Global Remote Ready";

  return (
    <section className="relative overflow-hidden py-8 md:py-12">
      <div className="container px-4 max-w-6xl mx-auto">
        <SectionHeader
          title="Talent & Engineering Leadership Snapshot"
          subtitle="For Recruiters & Hiring Managers"
          description="A concise overview of seniority, core proficiencies, work authorization, and track record."
          className="text-center mb-10 md:mb-12"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Summary Card (Col 7) */}
          <div className="lg:col-span-7 flex">
            <SpotlightCard className="p-6 md:p-8 flex flex-col justify-between h-full rounded-3xl bg-card/70 border border-border/50">
              <div>
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <UserCheck size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg md:text-xl text-foreground">Wisman Nur</h3>
                      <p className="text-xs text-muted-foreground">
                        Senior Fullstack & AI Systems Engineer • 7+ Yrs Exp
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Open for Roles
                  </span>
                </div>

                {/* Recruiter Quick Fact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className="p-3.5 rounded-2xl bg-background/50 border border-border/40">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1">
                      <MapPin size={14} className="text-primary" />
                      <span>Location & Timezone</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{locationDisplay}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-background/50 border border-border/40">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1">
                      <Briefcase size={14} className="text-primary" />
                      <span>Engagement Types</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Full-Time Senior Roles, Tech Lead, Strategic Consulting
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-background/50 border border-border/40">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1">
                      <Sparkles size={14} className="text-indigo-400" />
                      <span>Primary Stack</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Next.js 16, React 19, TypeScript, Node.js, Postgres
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-background/50 border border-border/40">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1">
                      <GraduationCap size={14} className="text-emerald-400" />
                      <span>AI & Cloud Architecture</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gemini 3.7 Agents, MCP Protocols, Cloud Run & Edge
                    </p>
                  </div>
                </div>

                {/* Proven Highlights */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Key Engineering Value
                  </h4>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>
                        Proven ability to architect zero-to-one scalable web & mobile platforms.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>
                        Experienced in high-load production environments (500k+ users, 99.9%
                        uptime).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>
                        Strong technical leadership, automated code review pipelines, and mentoring.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                <Button
                  asChild
                  size="sm"
                  className="rounded-full px-5 text-xs font-semibold shadow-md"
                >
                  <Link href="/hire-me" data-umami-event="recruiter-fast-track-hire-click">
                    <Mail size={13} className="mr-1.5" />
                    <span>Contact Directly</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full px-5 text-xs font-semibold border-border/60 hover:border-primary/40"
                >
                  <Link href="/about" data-umami-event="recruiter-fast-track-resume-click">
                    <FileText size={13} className="mr-1.5" />
                    <span>View Detailed Resume</span>
                  </Link>
                </Button>
              </div>
            </SpotlightCard>
          </div>

          {/* Right Connect & Channels Card (Col 5) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Channel 1: Direct LinkedIn */}
            <SpotlightCard className="p-6 rounded-3xl bg-card/70 border border-border/50 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Linkedin size={20} />
                </div>
                <a
                  href="https://linkedin.com/in/wismannur"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="recruiter-linkedin-click"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>View Profile</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
              <h4 className="font-bold text-sm text-foreground mb-1">LinkedIn Network</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect directly for opportunities, recommendations, and professional endorsements.
              </p>
            </SpotlightCard>

            {/* Channel 2: Book Intro */}
            <SpotlightCard className="p-6 rounded-3xl bg-card/70 border border-border/50 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Briefcase size={20} />
                </div>
                <Link
                  href="/contact"
                  data-umami-event="recruiter-schedule-click"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Book Intro</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
              <h4 className="font-bold text-sm text-foreground mb-1">Introductory Discussion</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Discuss role alignment, technical scope, or architecture requirements in a 15-minute
                sync.
              </p>
            </SpotlightCard>

            {/* Channel 3: GitHub Codebase & Blueprints */}
            <SpotlightCard className="p-6 rounded-3xl bg-card/70 border border-border/50 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Github size={20} />
                </div>
                <a
                  href="https://github.com/wismannur"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="recruiter-github-click"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Explore Code</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
              <h4 className="font-bold text-sm text-foreground mb-1">GitHub Repositories</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore public source code, architecture patterns, and open-source contributions.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}
