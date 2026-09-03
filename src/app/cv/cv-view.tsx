"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Check,
  Clock,
  Code2,
  Copy,
  Download,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Send,
  Sparkles,
  Twitter,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatResumePeriod } from "@/lib/resume";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";
import type { ResumeEntry } from "@/services/resume/types";
import type { SiteSettings } from "@/services/site-settings/types";
import type { Skill } from "@/services/skills/types";
import type { UserProfile } from "@/services/user/types";

interface CVViewProps {
  user: UserProfile | null;
  experiences: ResumeEntry[];
  education: ResumeEntry[];
  skills: Skill[];
  settings: SiteSettings;
}

interface CVSectionTitleProps {
  icon: React.ComponentType<{
    size?: number;
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
  title: string;
}

function CVSectionTitle({ icon: Icon, title }: CVSectionTitleProps) {
  return (
    <div className="flex items-center gap-2.5 mb-6 pb-2.5 border-b border-white/[0.08] print:border-zinc-300">
      <div className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 print:bg-transparent print:p-0 print:border-none print:text-zinc-900">
        <Icon size={15} aria-hidden="true" />
      </div>
      <h2 className="text-xs uppercase font-extrabold tracking-widest text-primary print:text-zinc-900 print:text-sm print:font-extrabold">
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-white/[0.08] to-transparent print:hidden" />
    </div>
  );
}

function renderDescriptionItems(description?: string) {
  if (!description) return null;

  const rawItems = description.includes("\n") ? description.split("\n") : description.split(". ");

  const items = rawItems
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.endsWith(".") || item.includes(":") ? item : `${item}.`));

  if (items.length === 0) return null;

  const highlightPrefixes = [
    "Problem:",
    "Role:",
    "Action:",
    "Quantifiable results:",
    "Impact:",
    "Key Achievements:",
    "Responsibility:",
    "Responsibilities:",
    "Technologies:",
  ];

  return (
    <ul className="text-xs sm:text-sm text-gray-300 print:text-zinc-800 space-y-2 print:space-y-1 leading-relaxed list-none print:list-disc print:pl-4">
      {items.map((item, i) => {
        const matchingPrefix = highlightPrefixes.find((p) =>
          item.toLowerCase().startsWith(p.toLowerCase())
        );

        if (matchingPrefix) {
          const parts = item.split(":");
          const prefix = parts[0];
          const content = parts.slice(1).join(":").trim();
          return (
            <li key={i} className="flex items-start gap-2.5 print:list-item print:gap-0">
              <span
                aria-hidden="true"
                className="text-primary print:hidden font-bold shrink-0 mt-0.5"
              >
                •
              </span>
              <p className="inline">
                <strong className="text-white print:text-zinc-950 font-semibold">{prefix}:</strong>{" "}
                {content}
              </p>
            </li>
          );
        }

        return (
          <li key={i} className="flex items-start gap-2.5 print:list-item print:gap-0">
            <span
              aria-hidden="true"
              className="text-primary print:hidden font-bold shrink-0 mt-0.5"
            >
              •
            </span>
            <p className="inline">{item}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function CVView({ user, experiences, education, skills, settings }: CVViewProps) {
  const [copied, setCopied] = useState(false);

  const name = user?.displayName || settings.siteName || "Wisman Nur";
  const email = settings.publicEmail || user?.email || PUBLIC_SUPPORT_EMAIL;
  const location = settings.location || user?.location || "Bandung, ID";
  const timezone = settings.timezoneLabel || "WIB (UTC+7)";
  const website = user?.website || "https://wismannur.pro";
  const github = settings.social?.github || user?.social?.github || "https://github.com/wismannur";
  const linkedin =
    settings.social?.linkedin || user?.social?.linkedin || "https://linkedin.com/in/wismannur";
  const twitter = settings.social?.twitter || user?.social?.twitter || "https://x.com/wismannur";
  const bio =
    user?.bio ||
    settings.footerBio ||
    "Senior Fullstack & Autonomous AI Systems Engineer with 7+ years of experience architecting high-performance web applications, sub-second edge runtimes, and autonomous multi-agent pipelines.";

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      trackEvent("cv-copy-email", { email });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy email", err);
    }
  };

  const handlePrint = () => {
    trackEvent("cv-download-pdf-click", { name, format: "pdf" });
    const previousTitle = document.title;
    document.title = `CV_${name.replace(/\s+/g, "_")}_wismannur.pro`;
    window.print();
    window.addEventListener(
      "afterprint",
      () => {
        document.title = previousTitle;
      },
      { once: true }
    );
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E2E8F0] py-6 sm:py-12 print:py-0 print:bg-white print:text-zinc-950 relative selection:bg-indigo-500/20 selection:text-indigo-300">
      {/* ATS & PDF Print Optimization CSS Rules */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm 15mm;
            size: A4 portrait;
          }
          html,
          body {
            background: #ffffff !important;
            color: #09090b !important;
            font-size: 10pt;
            line-height: 1.45;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            text-shadow: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Screen Ambient Background Lighting Glow */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/12 rounded-full blur-[140px] pointer-events-none -z-10 print:hidden" />
      <div className="fixed bottom-20 right-10 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none -z-10 print:hidden" />

      {/* Standalone Action Header (Hidden on Print) */}
      <header className="sticky top-4 z-40 container max-w-4xl mx-auto px-4 mb-8 print:hidden">
        <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-[#0C0E18]/85 backdrop-blur-2xl border border-white/[0.09] shadow-2xl shadow-black/60">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full gap-2 text-gray-300 hover:text-white hover:bg-white/[0.06] font-semibold px-3 h-9"
            >
              <Link href="/" data-umami-event="cv-back-home-click">
                <ArrowLeft size={15} />
                <span>wismannur.pro</span>
              </Link>
            </Button>
            <span className="text-white/[0.12] hidden sm:inline">•</span>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-gray-400 hover:text-primary hover:bg-white/[0.06] font-medium px-3 h-9 hidden sm:inline-flex"
            >
              <Link href="/about" data-umami-event="cv-about-click">
                About
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-gray-400 hover:text-primary hover:bg-white/[0.06] font-medium px-3 h-9 hidden sm:inline-flex"
            >
              <Link href="/projects" data-umami-event="cv-projects-click">
                Projects
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-gray-400 hover:text-primary hover:bg-white/[0.06] font-medium px-3 h-9 hidden sm:inline-flex"
            >
              <Link href="/hire-me" data-umami-event="cv-hire-me-click">
                Hire Me
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              data-umami-event="cv-top-download-pdf-click"
              size="sm"
              className="rounded-full gap-1.5 px-4 h-9 bg-primary text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main CV Document Canvas (Screen: Electric Obsidian • Print: Pure White) */}
      <main className="container max-w-4xl mx-auto px-4">
        <article
          id="cv-document"
          className={cn(
            "relative bg-[#0C0E18]/90 text-[#E2E8F0] border border-white/[0.09] rounded-3xl shadow-2xl p-8 sm:p-12 md:p-14 transition-all duration-300 backdrop-blur-2xl",
            "print:bg-white print:text-zinc-950 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:max-w-none print:backdrop-blur-none"
          )}
        >
          {/* Top Accent Gradient Bar (Screen only) */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 rounded-t-3xl print:hidden pointer-events-none" />

          {/* CV Header */}
          <header className="border-b border-white/[0.08] print:border-zinc-300 pb-8 mb-8 print:pb-4 print:mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 print:flex-row print:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/25 mb-1 print:hidden">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>CURRICULUM VITAE</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white print:text-zinc-950 print:text-3xl">
                  {name}
                </h1>
                <p className="text-base sm:text-lg font-bold text-primary print:text-zinc-800 print:text-sm">
                  Senior Fullstack & Autonomous AI Systems Engineer
                </p>

                {/* Live Availability Badge (Screen only) */}
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold whitespace-nowrap print:hidden">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Open for Senior Roles & AI Architecture</span>
                </div>
              </div>

              {/* Contact & Links Matrix */}
              <address className="not-italic flex flex-col gap-2 text-xs sm:text-sm text-gray-300 print:text-zinc-800 print:gap-1">
                {/* Email with copy button */}
                <div className="flex items-center gap-2">
                  <Mail
                    size={14}
                    aria-hidden="true"
                    className="text-primary shrink-0 print:text-zinc-800"
                  />
                  <a
                    href={`mailto:${email}`}
                    className="hover:text-white print:text-zinc-900 transition-colors font-mono font-medium"
                    data-umami-event="cv-email-click"
                  >
                    {email}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    aria-label="Copy email"
                    className="p-1 text-gray-400 hover:text-primary print:hidden transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>

                {/* Location & Timezone */}
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={14}
                      aria-hidden="true"
                      className="text-primary shrink-0 print:text-zinc-800"
                    />
                    <span>{location}</span>
                    <span className="text-gray-600 print:text-zinc-400">•</span>
                    <Clock
                      size={13}
                      aria-hidden="true"
                      className="text-primary/80 shrink-0 print:hidden"
                    />
                    <span>{timezone}</span>
                  </div>
                )}

                {/* Website */}
                {website && (
                  <div className="flex items-center gap-2">
                    <Globe
                      size={14}
                      aria-hidden="true"
                      className="text-primary shrink-0 print:text-zinc-800"
                    />
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white print:text-zinc-900 transition-colors font-mono font-medium"
                      data-umami-event="cv-website-click"
                    >
                      {website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}

                {/* Social Channel Links */}
                <div className="flex flex-wrap items-center gap-3 pt-1.5 print:pt-0 print:gap-x-4">
                  {linkedin && (
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white print:text-zinc-900 transition-colors"
                      data-umami-event="cv-linkedin-click"
                    >
                      <Linkedin
                        size={13}
                        aria-hidden="true"
                        className="text-primary print:text-zinc-800"
                      />
                      <span className="print:hidden">LinkedIn</span>
                      <span className="hidden print:inline">
                        {linkedin.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    </a>
                  )}
                  {github && (
                    <a
                      href={github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white print:text-zinc-900 transition-colors"
                      data-umami-event="cv-github-click"
                    >
                      <Github
                        size={13}
                        aria-hidden="true"
                        className="text-primary print:text-zinc-800"
                      />
                      <span className="print:hidden">GitHub</span>
                      <span className="hidden print:inline">
                        {github.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    </a>
                  )}
                  {twitter && (
                    <a
                      href={twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white print:text-zinc-900 transition-colors"
                      data-umami-event="cv-twitter-click"
                    >
                      <Twitter
                        size={13}
                        aria-hidden="true"
                        className="text-primary print:text-zinc-800"
                      />
                      <span className="print:hidden">Twitter / X</span>
                      <span className="hidden print:inline">
                        {twitter.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    </a>
                  )}
                </div>
              </address>
            </div>
          </header>

          {/* Professional Summary */}
          <section className="mb-10 print:mb-6">
            <CVSectionTitle icon={User} title="Professional Summary" />
            <p className="text-gray-300 print:text-zinc-800 leading-relaxed text-xs sm:text-sm print:text-xs">
              {bio}
            </p>
          </section>

          {/* Technical Skills & Competencies */}
          {skills.length > 0 && (
            <section className="mb-10 print:mb-6">
              <CVSectionTitle icon={Code2} title="Technical Skills & Competencies" />
              <ul className="flex flex-wrap gap-2 print:gap-1.5 list-none p-0 m-0">
                {skills.map((skill) => (
                  <li key={skill.id}>
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 text-xs font-medium rounded-full bg-white/[0.04] text-gray-200 border border-white/[0.08] hover:border-primary/40 hover:text-white transition-colors print:bg-zinc-100 print:text-zinc-950 print:border-zinc-300 print:rounded-md print:px-2 print:py-0.5 print:font-semibold print:text-[10pt]"
                    >
                      {skill.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Work Experience */}
          {experiences.length > 0 && (
            <section className="mb-10 print:mb-6">
              <CVSectionTitle icon={Briefcase} title="Work Experience" />

              <div className="space-y-8 print:space-y-4">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="relative pl-6 border-l-2 border-primary/30 print:border-l-0 print:pl-0 break-inside-avoid print:break-inside-avoid space-y-2 print:space-y-1"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-[#0C0E18] print:hidden"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 print:flex-row print:justify-between print:items-baseline">
                      <h3 className="text-base sm:text-lg font-bold text-white print:text-zinc-950 print:text-sm print:font-bold">
                        {exp.title}
                      </h3>
                      <span className="text-xs font-semibold text-primary print:text-zinc-700 bg-primary/10 print:bg-transparent border border-primary/20 print:border-none px-2.5 py-0.5 print:px-0 print:py-0 rounded-full w-fit print:text-[9.5pt] font-mono">
                        {formatResumePeriod(exp)}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-semibold text-primary/90 print:text-zinc-800 flex items-center gap-2 print:text-xs">
                      <span>{exp.organization}</span>
                      {exp.location && (
                        <>
                          <span aria-hidden="true" className="text-gray-600 print:text-zinc-500">
                            •
                          </span>
                          <span className="text-gray-400 font-normal print:text-zinc-700">
                            {exp.location}
                          </span>
                        </>
                      )}
                    </div>

                    {renderDescriptionItems(exp.description)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education & Certifications */}
          {education.length > 0 && (
            <section className="mb-8 print:mb-4">
              <CVSectionTitle icon={GraduationCap} title="Education & Certifications" />

              <div className="space-y-6 print:space-y-4">
                {education.map((edu) => (
                  <div
                    key={edu.id}
                    className="relative pl-6 border-l-2 border-primary/30 print:border-l-0 print:pl-0 break-inside-avoid print:break-inside-avoid space-y-1.5 print:space-y-1"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-[#0C0E18] print:hidden"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 print:flex-row print:justify-between print:items-baseline">
                      <h3 className="text-base sm:text-lg font-bold text-white print:text-zinc-950 print:text-sm print:font-bold">
                        {edu.title}
                      </h3>
                      <span className="text-xs font-semibold text-primary print:text-zinc-700 bg-primary/10 print:bg-transparent border border-primary/20 print:border-none px-2.5 py-0.5 print:px-0 print:py-0 rounded-full w-fit print:text-[9.5pt] font-mono">
                        {formatResumePeriod(edu)}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-semibold text-primary/90 print:text-zinc-800 print:text-xs">
                      {edu.organization}
                    </div>

                    {edu.description && (
                      <p className="text-xs sm:text-sm text-gray-300 print:text-zinc-800 leading-relaxed print:text-xs">
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Bottom Fast-Track Recruiter CTA (Screen only) */}
        <footer className="mt-12 mb-16 relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-white/[0.09] bg-[#0C0E18]/85 backdrop-blur-xl shadow-2xl text-center space-y-5 print:hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold">
            <Sparkles size={13} className="animate-pulse" />
            <span>EXPORT & COLLABORATION</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Looking for a Senior Engineer or AI Architect?
          </h2>

          <p className="text-gray-400 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
            Download this clean, ATS-compliant PDF for your hiring team, or reach out directly to
            discuss high-impact engineering engagements and founding roles.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Button
              onClick={handlePrint}
              data-umami-event="cv-bottom-download-pdf-click"
              size="lg"
              className="rounded-full px-7 h-11 text-xs md:text-sm font-bold bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all group"
            >
              <Download size={16} />
              <span>Download PDF</span>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-7 h-11 text-xs md:text-sm font-semibold border-white/[0.12] bg-white/[0.04] text-white hover:bg-primary/10 hover:border-primary/40 transition-all group"
            >
              <Link
                href="/hire-me"
                data-umami-event="cv-bottom-hire-me-click"
                className="inline-flex items-center gap-2"
              >
                <Send size={15} className="text-primary" />
                <span>Hire Me / Contact</span>
              </Link>
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
