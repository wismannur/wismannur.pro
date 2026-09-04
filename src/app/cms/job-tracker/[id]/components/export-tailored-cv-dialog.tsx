"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Copy,
  Printer,
  FileText,
  Sparkles,
  Check,
  SlidersHorizontal,
  Eye,
  Code,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { resumeService, skillsService, userService } from "@/services";
import type { JobApplication } from "@/services/job-tracker/types";

interface ExportTailoredCvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication;
}

export function ExportTailoredCvDialog({
  open,
  onOpenChange,
  application,
}: ExportTailoredCvDialogProps) {
  const [formatMode, setFormatMode] = useState<"preview" | "markdown">("preview");
  const [includeTailoredSummary, setIncludeTailoredSummary] = useState(true);
  const [includeTailoredBullets, setIncludeTailoredBullets] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeEducation, setIncludeEducation] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch candidate master resume, skills, and profile
  const { data: resumeData } = useQuery({
    queryKey: ["resumePublished"],
    queryFn: () => resumeService.getPublished(),
    enabled: open,
  });

  const { data: skillsData = [] } = useQuery({
    queryKey: ["skillsPublished"],
    queryFn: () => skillsService.getPublished(),
    enabled: open,
  });

  const { data: userData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getProfile(),
    enabled: open,
  });

  const printRef = useRef<HTMLDivElement>(null);

  const candidateName = userData?.displayName || "Wisman Nur";
  const candidateEmail = userData?.email || "contact@wismannur.pro";
  const candidateLocation = userData?.location || "Jakarta, Indonesia";
  const candidateWebsite = "https://wismannur.pro";

  const formatResumePeriod = (entry: { startDate: string; endDate?: string; isCurrent?: boolean }) => {
    if (!entry.startDate) return "";
    const startYear = new Date(entry.startDate).getFullYear();
    if (entry.isCurrent) return `${startYear} - Present`;
    if (entry.endDate) return `${startYear} - ${new Date(entry.endDate).getFullYear()}`;
    return `${startYear}`;
  };

  // Build markdown representation of tailored CV
  const markdownCv = useMemo(() => {
    const lines: string[] = [];

    lines.push(`# ${candidateName}`);
    lines.push(`**Target Role:** ${application.jobTitle} | **Target Company:** ${application.companyName}`);
    lines.push(`${candidateLocation} • ${candidateEmail} • [Portfolio](${candidateWebsite})`);
    lines.push("");

    if (includeTailoredSummary && application.tailoredSummary) {
      lines.push(`## Professional Summary`);
      lines.push(application.tailoredSummary);
      lines.push("");
    }

    lines.push(`## Work Experience`);
    if (includeTailoredBullets && application.tailoredBulletPoints && application.tailoredBulletPoints.length > 0) {
      lines.push(`### Targeted Highlights for ${application.jobTitle} (${application.companyName})`);
      application.tailoredBulletPoints.forEach((bullet) => {
        const prefix = bullet.roleContext ? `**[${bullet.roleContext}]** ` : "";
        lines.push(`- ${prefix}${bullet.tailored}`);
      });
      lines.push("");
    }

    if (resumeData?.experiences && resumeData.experiences.length > 0) {
      resumeData.experiences.forEach((exp) => {
        const period = formatResumePeriod(exp);
        lines.push(`### ${exp.title} — ${exp.organization} ${period ? `(${period})` : ""}`);
        if (exp.location) lines.push(`*${exp.location}*`);
        if (exp.description) {
          lines.push(exp.description);
        }
        lines.push("");
      });
    }

    if (includeSkills && skillsData.length > 0) {
      lines.push(`## Core Skills & Technologies`);
      const skillNames = skillsData.map((s) => s.name).join(" • ");
      lines.push(skillNames);
      lines.push("");
    }

    if (includeEducation && resumeData?.education && resumeData.education.length > 0) {
      lines.push(`## Education`);
      resumeData.education.forEach((edu) => {
        const period = formatResumePeriod(edu);
        lines.push(`- **${edu.title}**, ${edu.organization} ${period ? `(${period})` : ""}`);
        if (edu.description) lines.push(`  ${edu.description}`);
      });
      lines.push("");
    }

    return lines.join("\n");
  }, [
    candidateName,
    candidateEmail,
    candidateLocation,
    candidateWebsite,
    application,
    includeTailoredSummary,
    includeTailoredBullets,
    includeSkills,
    includeEducation,
    resumeData,
    skillsData,
  ]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownCv);
    setCopied(true);
    toast.success("Tailored ATS CV Markdown copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownCv], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeCompany = application.companyName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.href = url;
    link.download = `Resume_${candidateName.replace(/\s+/g, "_")}_${safeCompany}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown CV downloaded!");
  };

  const handlePrintPdf = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print / save as PDF.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume - ${candidateName} (${application.companyName})</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 15mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #111827;
              background: #fff;
              line-height: 1.45;
              font-size: 10.5pt;
              margin: 0;
              padding: 0;
            }
            h1 {
              font-size: 20pt;
              font-weight: 800;
              margin: 0 0 2px 0;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .contact-line {
              font-size: 9pt;
              color: #4b5563;
              margin-bottom: 14px;
              border-bottom: 1.5px solid #111827;
              padding-bottom: 8px;
            }
            .section-title {
              font-size: 11pt;
              font-weight: 800;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.75px;
              border-bottom: 1px solid #d1d5db;
              padding-bottom: 2px;
              margin-top: 12px;
              margin-bottom: 6px;
            }
            .summary-text {
              font-size: 9.5pt;
              color: #1f2937;
              text-align: justify;
              margin-bottom: 8px;
            }
            .experience-item {
              margin-bottom: 10px;
            }
            .exp-header {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              font-weight: 700;
              font-size: 10pt;
              color: #111827;
            }
            .exp-company {
              font-weight: 600;
              color: #374151;
            }
            .exp-date {
              font-size: 9pt;
              font-weight: 500;
              color: #6b7280;
            }
            ul {
              margin: 4px 0 6px 0;
              padding-left: 18px;
            }
            li {
              font-size: 9.5pt;
              color: #374151;
              margin-bottom: 3px;
              line-height: 1.35;
            }
            .skills-list {
              font-size: 9.5pt;
              color: #374151;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#0C0E18] border border-white/[0.12] text-foreground shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-white/[0.08] bg-[#131726]/60">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Export Tailored ATS Resume
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Export ATS-friendly resume customized for <strong className="text-white">{application.jobTitle}</strong> at{" "}
                <strong className="text-indigo-400">{application.companyName}</strong>.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMarkdown}
                className="gap-1.5 text-xs h-8 bg-[#0C0E18] border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Markdown"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMarkdown}
                className="gap-1.5 text-xs h-8 bg-[#0C0E18] border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                .md
              </Button>

              <Button
                size="sm"
                onClick={handlePrintPdf}
                className="gap-1.5 text-xs h-8 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </Button>
            </div>
          </div>

          {/* Section Toggles */}
          <div className="flex flex-wrap items-center gap-4 pt-3 text-xs">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" /> Include:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <Checkbox
                checked={includeTailoredSummary}
                onCheckedChange={(c) => setIncludeTailoredSummary(Boolean(c))}
                className="border-white/[0.2]"
              />
              <span>Tailored Summary</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <Checkbox
                checked={includeTailoredBullets}
                onCheckedChange={(c) => setIncludeTailoredBullets(Boolean(c))}
                className="border-white/[0.2]"
              />
              <span>XYZ Targeted Bullets</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <Checkbox
                checked={includeSkills}
                onCheckedChange={(c) => setIncludeSkills(Boolean(c))}
                className="border-white/[0.2]"
              />
              <span>Core Skills</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <Checkbox
                checked={includeEducation}
                onCheckedChange={(c) => setIncludeEducation(Boolean(c))}
                className="border-white/[0.2]"
              />
              <span>Education</span>
            </label>
          </div>
        </DialogHeader>

        {/* View Switcher */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-white/[0.08] bg-[#131726]/40">
          <Tabs value={formatMode} onValueChange={(v) => setFormatMode(v as "preview" | "markdown")} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="h-8 bg-[#0C0E18] border border-white/[0.08]">
                <TabsTrigger value="preview" className="text-xs gap-1.5 px-3 data-[state=active]:bg-[#131726] data-[state=active]:text-white">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> ATS Document Preview
                </TabsTrigger>
                <TabsTrigger value="markdown" className="text-xs gap-1.5 px-3 data-[state=active]:bg-[#131726] data-[state=active]:text-white">
                  <Code className="w-3.5 h-3.5 text-purple-400" /> Raw Markdown (ATS Copy-Paste)
                </TabsTrigger>
              </TabsList>

              {application.atsScore && (
                <Badge variant="outline" className="text-[11px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 font-mono">
                  <Sparkles className="w-3 h-3" /> ATS Match: {application.atsScore}%
                </Badge>
              )}
            </div>

            {/* TAB CONTENT: PREVIEW */}
            <TabsContent value="preview" className="mt-3 mb-0">
              <div className="p-6 bg-[#08090C] text-slate-100 rounded-xl border border-white/[0.08] shadow-inner overflow-y-auto max-h-[50vh] font-sans">
                {/* Print area container */}
                <div ref={printRef} className="space-y-4 max-w-2xl mx-auto">
                  {/* Header */}
                  <div>
                    <h1 className="text-2xl font-extrabold uppercase tracking-tight text-white">
                      {candidateName}
                    </h1>
                    <div className="text-xs font-semibold text-indigo-400 mt-0.5">
                      Target Role: {application.jobTitle} • {application.companyName}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 border-b pb-2 border-white/[0.1]">
                      {candidateLocation} | {candidateEmail} | {candidateWebsite}
                    </div>
                  </div>

                  {/* Summary */}
                  {includeTailoredSummary && application.tailoredSummary && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
                        Professional Summary
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300 pt-1">
                        {application.tailoredSummary}
                      </p>
                    </div>
                  )}

                  {/* Targeted Highlights */}
                  {includeTailoredBullets && application.tailoredBulletPoints && application.tailoredBulletPoints.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
                        Targeted Accomplishments (XYZ Method)
                      </div>
                      <ul className="list-disc list-inside space-y-1 pt-1 text-xs text-slate-300">
                        {application.tailoredBulletPoints.map((b, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {b.roleContext && <span className="font-semibold text-indigo-300">[{b.roleContext}] </span>}
                            <span>{b.tailored}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Work Experience */}
                  {resumeData?.experiences && resumeData.experiences.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
                        Work Experience
                      </div>
                      <div className="space-y-3 pt-1">
                        {resumeData.experiences.map((exp) => {
                          const period = formatResumePeriod(exp);
                          return (
                            <div key={exp.id} className="space-y-0.5 text-xs">
                              <div className="flex justify-between font-bold text-slate-200">
                                <span>{exp.title} — {exp.organization}</span>
                                <span className="text-[11px] font-normal text-muted-foreground font-mono">{period}</span>
                              </div>
                              {exp.description && (
                                <p className="text-slate-400 leading-relaxed text-[11px]">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {includeSkills && skillsData.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
                        Core Skills & Technologies
                      </div>
                      <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                        {skillsData.map((s) => s.name).join(" • ")}
                      </p>
                    </div>
                  )}

                  {/* Education */}
                  {includeEducation && resumeData?.education && resumeData.education.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
                        Education
                      </div>
                      <div className="space-y-1.5 pt-1">
                        {resumeData.education.map((edu) => (
                          <div key={edu.id} className="text-xs flex justify-between">
                            <span className="font-semibold text-slate-200">{edu.title} — {edu.organization}</span>
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
            </TabsContent>

            {/* TAB CONTENT: MARKDOWN */}
            <TabsContent value="markdown" className="mt-3 mb-0">
              <div className="p-4 bg-[#08090C] rounded-xl border border-white/[0.08] max-h-[50vh] overflow-y-auto">
                <pre className="text-xs font-mono text-indigo-300 whitespace-pre-wrap leading-relaxed">
                  {markdownCv}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 bg-[#131726]/60 border-t border-white/[0.08] flex justify-between items-center text-xs text-muted-foreground">
          <span>Formatted according to ATS single-column parse standards.</span>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
