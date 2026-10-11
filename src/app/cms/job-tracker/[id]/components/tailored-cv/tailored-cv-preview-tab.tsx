"use client";

import React from "react";
import { formatResumePeriod, formatExperienceMeta } from "@/lib/resume";
import type { TailoredBullet, TailoredProjectHighlight } from "@/services/job-tracker/types";
import {
  splitDescriptionToBullets,
  getTailoredBulletsForExperience,
  getUnmatchedTailoredBullets,
} from "./constants";

interface TailoredCvPreviewTabProps {
  candidateName: string;
  candidateEmail: string;
  candidateLocation: string;
  candidateWebsite: string;
  candidateLinkedin: string;
  candidateGithub: string;
  includeHeadline: boolean;
  headlineText: string;
  includeTailoredSummary: boolean;
  activeSummary: string;
  includeTailoredBullets: boolean;
  activeBullets: TailoredBullet[];
  includeProjects: boolean;
  activeProjects: TailoredProjectHighlight[];
  includeSkills: boolean;
  activeSkills: string[];
  includeEducation: boolean;
  resumeData?: {
    experiences?: Array<{
      id: string;
      title: string;
      organization: string;
      location?: string;
      employmentType?: string;
      locationType?: string;
      startDate: string;
      endDate?: string;
      isCurrent: boolean;
      description?: string;
    }>;
    education?: Array<{
      id: string;
      title: string;
      organization: string;
      startDate: string;
      endDate?: string;
      isCurrent: boolean;
      description?: string;
    }>;
  };
  printRef: React.RefObject<HTMLDivElement | null>;
}

export function TailoredCvPreviewTab({
  candidateName,
  candidateEmail,
  candidateLocation,
  candidateWebsite,
  candidateLinkedin,
  candidateGithub,
  includeHeadline,
  headlineText,
  includeTailoredSummary,
  activeSummary,
  includeTailoredBullets,
  activeBullets,
  includeProjects,
  activeProjects,
  includeSkills,
  activeSkills,
  includeEducation,
  resumeData,
  printRef,
}: TailoredCvPreviewTabProps) {
  return (
    <div className="p-6 bg-[#08090C] text-slate-100 rounded-xl border border-white/[0.08] shadow-inner overflow-y-auto max-h-[50vh] font-sans">
      <div ref={printRef} className="space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-white mb-1.5">
            {candidateName}
          </h1>
          {includeHeadline && headlineText && (
            <div className="text-xs font-semibold text-indigo-400 mb-1.5">
              {headlineText}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground border-b pb-2 border-white/[0.1]">
            <span>{candidateLocation}</span>
            <span>|</span>
            <a href={`mailto:${candidateEmail}`} className="hover:text-blue-400 transition-colors">
              {candidateEmail}
            </a>
            {candidateWebsite && (
              <>
                <span>|</span>
                <a
                  href={candidateWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  {candidateWebsite.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              </>
            )}
            {candidateLinkedin && (
              <>
                <span>|</span>
                <a
                  href={candidateLinkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  {candidateLinkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "linkedin.com/in/")}
                </a>
              </>
            )}
            {candidateGithub && (
              <>
                <span>|</span>
                <a
                  href={candidateGithub}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  {candidateGithub.replace(/^https?:\/\/(www\.)?github\.com\//, "github.com/")}
                </a>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        {includeTailoredSummary && activeSummary && (
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
              Professional Summary
            </div>
            <p className="text-xs leading-relaxed text-slate-300 pt-1">{activeSummary}</p>
          </div>
        )}

        {/* Work Experience with in-place tailoring */}
        {resumeData?.experiences && resumeData.experiences.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
              Work Experience
            </div>
            <div className="space-y-4 pt-1">
              {resumeData.experiences.map((exp) => {
                const period = formatResumePeriod(exp);
                const tailored = includeTailoredBullets
                  ? getTailoredBulletsForExperience(exp, activeBullets)
                  : [];
                const originalBullets = splitDescriptionToBullets(exp.description);

                return (
                  <div key={exp.id} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span className="flex items-center gap-2">
                        <span>
                          {exp.title} — {exp.organization}
                        </span>
                        {tailored.length > 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            AI Tailored
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] font-normal text-muted-foreground font-mono">
                        {period}
                      </span>
                    </div>
                    {formatExperienceMeta(exp) ? (
                      <div className="text-[11px] text-muted-foreground italic">
                        {formatExperienceMeta(exp)}
                      </div>
                    ) : null}
                    {tailored.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 pt-0.5 text-xs text-slate-300">
                        {tailored.map((b, bIdx) => (
                          <li key={bIdx} className="leading-relaxed">
                            <span>{b.tailored.replace(/^[-•*]\s*/, "")}</span>
                          </li>
                        ))}
                      </ul>
                    ) : originalBullets.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 pt-0.5 text-xs text-slate-300">
                        {originalBullets.map((b, bIdx) => (
                          <li key={bIdx} className="leading-relaxed">
                            <span>{b.replace(/^[-•*]\s*/, "")}</span>
                          </li>
                        ))}
                      </ul>
                    ) : exp.description ? (
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        {exp.description.replace(/^[-•*]\s*/, "")}
                      </p>
                    ) : null}
                  </div>
                );
              })}

              {/* Unmatched Targeted Bullets if any */}
              {includeTailoredBullets && (() => {
                const unmatched = getUnmatchedTailoredBullets(
                  resumeData.experiences,
                  activeBullets
                );
                if (unmatched.length === 0) return null;
                return (
                  <div className="pt-2 space-y-1 border-t border-white/[0.05]">
                    <div className="text-[11px] font-semibold text-indigo-300">
                      Additional Targeted Accomplishments
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                      {unmatched.map((b, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {b.roleContext && (
                            <span className="font-semibold text-indigo-300">
                              [{b.roleContext}]{" "}
                            </span>
                          )}
                          <span>{b.tailored.replace(/^[-•*]\s*/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Key Technical Projects */}
        {includeProjects && activeProjects.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
              Key Technical Projects
            </div>
            <div className="space-y-3 pt-1">
              {activeProjects.map((proj, idx) => {
                const bullets =
                  proj.bullets && proj.bullets.length > 0
                    ? proj.bullets
                    : proj.description
                      ? proj.description
                          .split("\n")
                          .map((s) => s.trim().replace(/^[•\-\*]\s*/, ""))
                          .filter(Boolean)
                      : [proj.description];

                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex flex-col gap-y-1 items-baseline font-bold text-slate-200">
                      <span>{proj.title}</span>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <span className="text-[11px] font-normal text-muted-foreground italic font-mono">
                          {proj.technologies.join(" • ")}
                        </span>
                      )}
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-300">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="leading-relaxed">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills */}
        {includeSkills && activeSkills.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
              Core Skills & Technologies
            </div>
            <p className="text-xs text-slate-300 pt-1 leading-relaxed">
              {activeSkills.join(" • ")}
            </p>
          </div>
        )}

        {/* Education */}
        {includeEducation && resumeData?.education && resumeData.education.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
              Education & Certifications
            </div>
            <div className="space-y-1.5 pt-1">
              {resumeData.education.map((edu) => (
                <div key={edu.id} className="text-xs flex justify-between">
                  <span className="font-semibold text-slate-200">
                    {edu.title} — {edu.organization}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatResumePeriod(edu)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
