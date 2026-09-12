"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseIcon,
  Calendar,
  CheckCircle2,
  FileText,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { formatResumePeriod } from "@/lib/resume";
import { trackEvent } from "@/lib/umami";
import type { ResumeEntry } from "@/services/resume/types";

type ResumeSectionProps = {
  experiences: ResumeEntry[];
  education: ResumeEntry[];
};

export function ResumeSection({ experiences, education }: ResumeSectionProps) {
  const [activeTab, setActiveTab] = useState<"experience" | "education">("experience");

  const handleTabChange = (tab: "experience" | "education") => {
    setActiveTab(tab);
    trackEvent("about-resume-tab-change", { tab });
  };

  return (
    <section className="py-8 md:py-12 relative overflow-hidden">
      <div className="container px-4 max-w-6xl mx-auto">
        <SectionHeader
          title={
            activeTab === "experience"
              ? "Work Experience & Track Record"
              : "Education & Credentials"
          }
          subtitle={activeTab === "experience" ? "Career Milestones" : "Academic Background"}
          description="A chronological record of technical leadership, architected systems, and engineering accomplishments."
          className="mb-10 md:mb-12 text-center"
        />

        {/* Interactive Obsidian Tabs */}
        <div className="flex justify-center mb-10 md:mb-14">
          <div className="inline-flex p-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-lg">
            <button
              type="button"
              onClick={() => handleTabChange("experience")}
              data-umami-event="about-resume-tab-click"
              data-umami-event-tab="experience"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${
                activeTab === "experience"
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <BriefcaseIcon size={14} />
              <span>Work Experience</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("education")}
              data-umami-event="about-resume-tab-click"
              data-umami-event-tab="education"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${
                activeTab === "education"
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <GraduationCap size={15} />
              <span>Education & Certs</span>
            </button>
          </div>
        </div>

        {/* Experience Content */}
        {activeTab === "experience" && (
          <div>
            {experiences.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-gray-400">
                <BriefcaseIcon size={32} className="mx-auto mb-3 text-gray-500 opacity-50" />
                <p>No work experience entries published yet.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Center Timeline Spine */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/80 via-primary/30 to-transparent hidden md:block -translate-x-1/2" />

                <div className="space-y-8 md:space-y-12">
                  {experiences.map((exp, index) => (
                    <div key={exp.id} className="relative">
                      <div
                        className={`md:flex items-center ${index % 2 === 0 ? "" : "md:flex-row-reverse"}`}
                      >
                        {/* Center Timeline Node */}
                        <div className="absolute left-1/2 top-8 -translate-x-1/2 hidden md:flex items-center justify-center z-20">
                          <div className="w-8 h-8 rounded-full bg-[#0D0F19] border-2 border-primary flex items-center justify-center shadow-lg shadow-primary/25">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                          </div>
                        </div>

                        {/* Card Container */}
                        <div className="md:w-1/2 md:px-8">
                          <SpotlightCard className="p-6 md:p-7 rounded-2xl bg-[#0D0F19]/80 border border-white/[0.08] hover:border-primary/40 hover:shadow-xl transition-all duration-300">
                            {/* Header metadata */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
                                <Calendar size={12} />
                                <span>{formatResumePeriod(exp)}</span>
                              </div>

                              {exp.location && (
                                <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                                  <MapPin size={12} className="text-primary" />
                                  <span>{exp.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Role & Org */}
                            <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                              {exp.title}
                            </h3>

                            <div className="text-sm font-semibold text-primary/90 mt-1 mb-4 flex items-center gap-2">
                              <span>{exp.organization}</span>
                            </div>

                            {/* Structured STAR Bullet Points */}
                            {exp.description && (
                              <div className="text-xs md:text-sm text-gray-300 leading-relaxed space-y-2 border-t border-white/[0.08] pt-4">
                                {exp.description.split(". ").map((sentence, i) => {
                                  if (
                                    sentence.startsWith("Problem:") ||
                                    sentence.startsWith("Role:") ||
                                    sentence.startsWith("Action:") ||
                                    sentence.startsWith("Quantifiable results:")
                                  ) {
                                    const [prefix, content] = sentence.split(": ");
                                    return (
                                      <div key={i} className="flex items-start gap-2">
                                        <CheckCircle2
                                          size={14}
                                          className="text-primary mt-0.5 flex-shrink-0"
                                        />
                                        <p>
                                          <span className="font-semibold text-white">
                                            {prefix}:{" "}
                                          </span>
                                          <span className="text-gray-300">{content}</span>
                                        </p>
                                      </div>
                                    );
                                  }
                                  return <p key={i}>{sentence}</p>;
                                })}
                              </div>
                            )}
                          </SpotlightCard>
                        </div>

                        <div className="hidden md:block md:w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education Content */}
        {activeTab === "education" && (
          <div>
            {education.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-gray-400">
                <GraduationCap size={32} className="mx-auto mb-3 text-gray-500 opacity-50" />
                <p>No education credentials published yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {education.map((edu) => (
                  <SpotlightCard
                    key={edu.id}
                    className="p-6 md:p-7 rounded-2xl bg-[#0D0F19]/80 border border-white/[0.08] hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                          <GraduationCap size={22} />
                        </div>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold border border-primary/20 inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {formatResumePeriod(edu)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold mb-1 text-white group-hover:text-primary transition-colors">
                        {edu.title}
                      </h3>

                      <div className="text-sm font-medium text-gray-400 mb-3">
                        {edu.organization}
                      </div>

                      {edu.description && (
                        <p className="text-xs md:text-sm text-gray-300 leading-relaxed border-t border-white/[0.08] pt-3">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Printable CV Action */}
        <div className="mt-12 md:mt-16 text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold border-white/[0.12] bg-white/[0.04] backdrop-blur-md hover:bg-primary/10 hover:border-primary/40 hover:text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group text-gray-200"
          >
            <Link
              href="/cv"
              data-umami-event="about-view-full-cv-click"
              className="inline-flex items-center gap-2"
            >
              <FileText size={15} className="text-primary" />
              <span>View & Download Printable CV (PDF)</span>
              <ArrowRight
                size={15}
                className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
              />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
