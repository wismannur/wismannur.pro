"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEmploymentType, formatLocationType, formatResumePeriod } from "@/lib/resume";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import type { MasterCvStudioSnapshot } from "@/services";

interface TabLivePreviewProps {
  snapshot: MasterCvStudioSnapshot;
  isDownloadingPdf: boolean;
  onDownloadPdf: () => Promise<void>;
}

function splitBullets(description?: string): string[] {
  if (!description) return [];
  if (description.includes("\n")) {
    return description
      .split("\n")
      .map((item) => item.trim().replace(/^[-•*]\s*/, ""))
      .filter(Boolean);
  }
  const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z])/;
  return description
    .split(sentenceRegex)
    .map((item) => item.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);
}

export function TabLivePreview({
  snapshot,
  isDownloadingPdf,
  onDownloadPdf,
}: TabLivePreviewProps) {
  const [previewTheme, setPreviewTheme] = useState<"ats-paper" | "obsidian">("ats-paper");

  const { user, settings } = snapshot;
  const publishedExperiences = snapshot.experiences.filter((e) => e.isPublished);
  const publishedEducation = snapshot.education.filter((e) => e.isPublished);
  const publishedSkills = snapshot.skills.filter((s) => s.isPublished);
  const cvProjects = snapshot.projects
    .filter((p) => p.isPublished)
    .slice(0, 4);

  const name = user?.displayName || settings.siteName || "Wisman Nur";
  const headline =
    settings.ogTagline || "Senior Fullstack & Autonomous AI Systems Engineer";
  const email = settings.publicEmail || user?.email || PUBLIC_SUPPORT_EMAIL;
  const location = settings.location || user?.location || "Bandung, ID";
  const website = user?.website || "https://wismannur.pro";
  const github = settings.social?.github || user?.social?.github || "https://github.com/wismannur";
  const linkedin =
    settings.social?.linkedin || user?.social?.linkedin || "https://linkedin.com/in/wismannur";
  const bio =
    user?.bio ||
    settings.footerBio ||
    "Senior Fullstack & Autonomous AI Systems Engineer with 7+ years of experience architecting high-performance web applications, sub-second edge runtimes, and autonomous multi-agent pipelines.";

  const isPaper = previewTheme === "ats-paper";

  return (
    <div className="space-y-5">
      {/* Preview Toolbar */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/90 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewTheme("ats-paper")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
              isPaper
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white/[0.04] text-slate-400 hover:text-slate-200"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ATS Vector PDF Layout (A4 Paper)</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewTheme("obsidian")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
              !isPaper
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white/[0.04] text-slate-400 hover:text-slate-200"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Web Obsidian Theme (/cv)</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-white/[0.1] text-xs h-9"
          >
            <Link href="/cv" target="_blank">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Buka /cv Publik
            </Link>
          </Button>

          <Button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            size="sm"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9 px-4"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            Download ATS Vector PDF
          </Button>
        </div>
      </div>

      {/* Document Canvas */}
      <div
        className={cn(
          "max-w-4xl mx-auto rounded-2xl border p-8 sm:p-12 shadow-2xl transition-colors",
          isPaper
            ? "bg-white text-zinc-900 border-zinc-300"
            : "bg-[#0C0E18] text-slate-100 border-white/[0.1]"
        )}
      >
        {/* Header */}
        <header
          className={cn(
            "border-b pb-5 mb-6",
            isPaper ? "border-zinc-900" : "border-white/[0.1]"
          )}
        >
          <h1
            className={cn(
              "text-2xl sm:text-3xl font-extrabold uppercase tracking-tight",
              isPaper ? "text-zinc-950" : "text-white"
            )}
          >
            {name}
          </h1>
          <p
            className={cn(
              "text-sm sm:text-base font-bold mt-1",
              isPaper ? "text-blue-600" : "text-indigo-400"
            )}
          >
            {headline}
          </p>
          <div
            className={cn(
              "text-xs mt-2 flex flex-wrap items-center gap-x-2 gap-y-1",
              isPaper ? "text-zinc-600" : "text-slate-400"
            )}
          >
            <span>{location}</span>
            <span>|</span>
            <span>{email}</span>
            <span>|</span>
            <span>{website.replace(/^https?:\/\//, "")}</span>
            {linkedin && (
              <>
                <span>|</span>
                <span>{linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
              </>
            )}
            {github && (
              <>
                <span>|</span>
                <span>{github.replace(/^https?:\/\/(www\.)?/, "")}</span>
              </>
            )}
          </div>
        </header>

        {/* Professional Summary */}
        <section className="mb-6">
          <h2
            className={cn(
              "text-xs font-extrabold uppercase tracking-wider border-b pb-1.5 mb-2.5",
              isPaper
                ? "text-zinc-900 border-zinc-300"
                : "text-indigo-400 border-white/[0.08]"
            )}
          >
            Professional Summary
          </h2>
          <p
            className={cn(
              "text-xs sm:text-sm leading-relaxed",
              isPaper ? "text-zinc-800" : "text-slate-300"
            )}
          >
            {bio}
          </p>
        </section>

        {/* Work Experience */}
        {publishedExperiences.length > 0 && (
          <section className="mb-6">
            <h2
              className={cn(
                "text-xs font-extrabold uppercase tracking-wider border-b pb-1.5 mb-3",
                isPaper
                  ? "text-zinc-900 border-zinc-300"
                  : "text-indigo-400 border-white/[0.08]"
              )}
            >
              Work Experience
            </h2>
            <div className="space-y-4">
              {publishedExperiences.map((exp) => {
                const bullets = splitBullets(exp.description);
                return (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <div className="text-xs sm:text-sm font-bold">
                        <span>{exp.title}</span>
                        <span className={isPaper ? "text-zinc-500" : "text-slate-500"}> — </span>
                        <span className={isPaper ? "text-zinc-700" : "text-indigo-300"}>
                          {exp.organization}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-mono font-semibold shrink-0",
                          isPaper ? "text-zinc-600" : "text-slate-400"
                        )}
                      >
                        {formatResumePeriod(exp)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-[11px] italic",
                        isPaper ? "text-zinc-500" : "text-slate-400"
                      )}
                    >
                      {[
                        exp.location,
                        exp.employmentType ? formatEmploymentType(exp.employmentType) : null,
                        exp.locationType ? formatLocationType(exp.locationType) : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                    <ul className="space-y-1 pt-1 pl-4 list-disc">
                      {bullets.map((b, i) => (
                        <li
                          key={i}
                          className={cn(
                            "text-xs leading-relaxed",
                            isPaper ? "text-zinc-800" : "text-slate-300"
                          )}
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Key Technical Projects */}
        {cvProjects.length > 0 && (
          <section className="mb-6">
            <h2
              className={cn(
                "text-xs font-extrabold uppercase tracking-wider border-b pb-1.5 mb-3",
                isPaper
                  ? "text-zinc-900 border-zinc-300"
                  : "text-indigo-400 border-white/[0.08]"
              )}
            >
              Key Technical Projects
            </h2>
            <div className="space-y-3">
              {cvProjects.map((proj) => (
                <div key={proj.id} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                      <span>{proj.title}</span>
                      {proj.isFeatured && !isPaper && (
                        <Badge className="bg-teal-500/15 text-teal-300 border-teal-500/30 text-[10px] py-0">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-mono",
                        isPaper ? "text-zinc-600 italic" : "text-indigo-300"
                      )}
                    >
                      {(proj.technologies || []).slice(0, 5).join(" • ")}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-xs leading-relaxed",
                      isPaper ? "text-zinc-800" : "text-slate-300"
                    )}
                  >
                    • {proj.summary || proj.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Core Skills */}
        {publishedSkills.length > 0 && (
          <section className="mb-6">
            <h2
              className={cn(
                "text-xs font-extrabold uppercase tracking-wider border-b pb-1.5 mb-2.5",
                isPaper
                  ? "text-zinc-900 border-zinc-300"
                  : "text-indigo-400 border-white/[0.08]"
              )}
            >
              Core Skills & Technologies
            </h2>
            <p
              className={cn(
                "text-xs leading-relaxed",
                isPaper ? "text-zinc-800" : "text-slate-300"
              )}
            >
              {publishedSkills.map((s) => s.name).join(" • ")}
            </p>
          </section>
        )}

        {/* Education */}
        {publishedEducation.length > 0 && (
          <section>
            <h2
              className={cn(
                "text-xs font-extrabold uppercase tracking-wider border-b pb-1.5 mb-2.5",
                isPaper
                  ? "text-zinc-900 border-zinc-300"
                  : "text-indigo-400 border-white/[0.08]"
              )}
            >
              Education & Certifications
            </h2>
            <div className="space-y-2">
              {publishedEducation.map((edu) => (
                <div
                  key={edu.id}
                  className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs"
                >
                  <span className="font-bold">
                    {edu.title} — {edu.organization}
                  </span>
                  <span className={isPaper ? "text-zinc-600" : "text-slate-400"}>
                    {formatResumePeriod(edu)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
