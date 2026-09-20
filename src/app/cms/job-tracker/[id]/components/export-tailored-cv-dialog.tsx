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
  Edit3,
  Plus,
  Trash2,
  Save,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { resumeService, skillsService, userService } from "@/services";
import type { JobApplication, TailoredBullet, TailoredProjectHighlight } from "@/services/job-tracker/types";

interface ExportTailoredCvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication;
  onUpdate?: (updated: Partial<JobApplication>) => Promise<void>;
}

export function ExportTailoredCvDialog({
  open,
  onOpenChange,
  application,
  onUpdate,
}: ExportTailoredCvDialogProps) {
  const [formatMode, setFormatMode] = useState<"preview" | "edit" | "markdown">("preview");
  const [includeHeadline, setIncludeHeadline] = useState(true);
  const [headlineText, setHeadlineText] = useState(application.jobTitle || "");
  const [includeTailoredSummary, setIncludeTailoredSummary] = useState(true);
  const [includeTailoredBullets, setIncludeTailoredBullets] = useState(true);
  const [includeProjects, setIncludeProjects] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeEducation, setIncludeEducation] = useState(true);
  const [copied, setCopied] = useState(false);

  // Live editing state inside the export dialog
  const [activeSummary, setActiveSummary] = useState(application.tailoredSummary || "");
  const [activeBullets, setActiveBullets] = useState<TailoredBullet[]>(application.tailoredBulletPoints || []);
  const [activeProjects, setActiveProjects] = useState<TailoredProjectHighlight[]>(
    application.atsAnalysis?.tailoredProjects || []
  );
  const [isSavingDialog, setIsSavingDialog] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleSaveDialogChanges = async () => {
    if (!onUpdate) return;
    setIsSavingDialog(true);
    try {
      await onUpdate({
        tailoredSummary: activeSummary,
        tailoredBulletPoints: activeBullets,
        atsAnalysis: application.atsAnalysis
          ? {
              ...application.atsAnalysis,
              tailoredProjects: activeProjects,
            }
          : undefined,
      });
      toast.success("Changes saved to application!");
    } catch {
      toast.error("Failed to save changes to application");
    } finally {
      setIsSavingDialog(false);
    }
  };

  const handleUpdateDialogProject = (
    index: number,
    field: keyof TailoredProjectHighlight,
    value: string | string[]
  ) => {
    setActiveProjects((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteDialogProject = (index: number) => {
    setActiveProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDialogBullet = (index: number, field: keyof TailoredBullet, value: string) => {
    setActiveBullets((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteDialogBullet = (index: number) => {
    setActiveBullets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDialogBullet = () => {
    setActiveBullets((prev) => [
      ...prev,
      {
        roleContext: "",
        tailored: "",
        rationale: "",
      },
    ]);
  };

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

  const splitDescriptionToBullets = (description?: string): string[] => {
    if (!description) return [];
    const rawItems = description.includes("\n") ? description.split("\n") : description.split(". ");
    return rawItems
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item.endsWith(".") || item.includes(":") ? item : `${item}.`));
  };

  const getTailoredBulletsForExperience = (
    exp: { id: string; title: string; organization: string },
    tailoredBullets?: JobApplication["tailoredBulletPoints"]
  ) => {
    if (!tailoredBullets || tailoredBullets.length === 0) return [];

    // 1. Direct ID match
    const byId = tailoredBullets.filter((b) => b.experienceId && b.experienceId === exp.id);
    if (byId.length > 0) return byId;

    // 2. Fuzzy match by roleContext vs organization/title
    const orgLower = exp.organization.toLowerCase();
    const titleLower = exp.title.toLowerCase();

    return tailoredBullets.filter((b) => {
      if (!b.roleContext) return false;
      const ctx = b.roleContext.toLowerCase();
      return ctx.includes(orgLower) || orgLower.includes(ctx) || ctx.includes(titleLower);
    });
  };

  const getUnmatchedTailoredBullets = (
    experiences: { id: string; title: string; organization: string }[],
    tailoredBullets?: JobApplication["tailoredBulletPoints"]
  ) => {
    if (!tailoredBullets || tailoredBullets.length === 0) return [];
    return tailoredBullets.filter((b) => {
      return !experiences.some((exp) => {
        if (b.experienceId && b.experienceId === exp.id) return true;
        if (!b.roleContext) return false;
        const orgLower = exp.organization.toLowerCase();
        const titleLower = exp.title.toLowerCase();
        const ctx = b.roleContext.toLowerCase();
        return ctx.includes(orgLower) || orgLower.includes(ctx) || ctx.includes(titleLower);
      });
    });
  };

  // Build markdown representation of tailored CV
  const markdownCv = useMemo(() => {
    const lines: string[] = [];

    lines.push(`# ${candidateName}`);
    if (includeHeadline && headlineText) {
      lines.push(`**${headlineText}**`);
    }
    lines.push(`${candidateLocation} • ${candidateEmail} • [Portfolio](${candidateWebsite})`);
    lines.push("");

    if (includeTailoredSummary && activeSummary) {
      lines.push(`## Professional Summary`);
      lines.push(activeSummary);
      lines.push("");
    }

    lines.push(`## Work Experience`);

    if (resumeData?.experiences && resumeData.experiences.length > 0) {
      resumeData.experiences.forEach((exp) => {
        const period = formatResumePeriod(exp);
        lines.push(`### ${exp.title} — ${exp.organization} ${period ? `(${period})` : ""}`);
        if (exp.location) lines.push(`*${exp.location}*`);

        const tailored = includeTailoredBullets
          ? getTailoredBulletsForExperience(exp, activeBullets)
          : [];

        if (tailored.length > 0) {
          tailored.forEach((bullet) => {
            lines.push(`- ${bullet.tailored}`);
          });
        } else {
          const fallbackBullets = splitDescriptionToBullets(exp.description);
          if (fallbackBullets.length > 0) {
            fallbackBullets.forEach((b) => lines.push(`- ${b}`));
          } else if (exp.description) {
            lines.push(exp.description);
          }
        }
        lines.push("");
      });

      // Include unmatched bullets if any exist
      if (includeTailoredBullets) {
        const unmatched = getUnmatchedTailoredBullets(
          resumeData.experiences,
          activeBullets
        );
        if (unmatched.length > 0) {
          lines.push(`### Additional Targeted Accomplishments`);
          unmatched.forEach((b) => {
            const prefix = b.roleContext ? `**[${b.roleContext}]** ` : "";
            lines.push(`- ${prefix}${b.tailored}`);
          });
          lines.push("");
        }
      }
    }

    if (includeProjects && activeProjects.length > 0) {
      lines.push(`## Key Technical Projects`);
      activeProjects.forEach((proj) => {
        const techStr = proj.technologies?.length ? ` (${proj.technologies.join(", ")})` : "";
        lines.push(`### ${proj.title}${techStr}`);
        lines.push(`- ${proj.description}`);
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
    activeSummary,
    activeBullets,
    activeProjects,
    headlineText,
    includeHeadline,
    includeTailoredSummary,
    includeTailoredBullets,
    includeProjects,
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

  const handleDirectDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const toastId = toast.loading("Generating ATS Vector PDF...");
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { TailoredCvPdfDocument } = await import("./tailored-cv-pdf-document");

      const pdfExperiences =
        resumeData?.experiences?.map((exp) => {
          const period = formatResumePeriod(exp);
          const tailored = includeTailoredBullets
            ? getTailoredBulletsForExperience(exp, activeBullets)
            : [];
          const originalBullets = splitDescriptionToBullets(exp.description);
          const bullets =
            tailored.length > 0
              ? tailored.map((b) => b.tailored)
              : originalBullets.length > 0
              ? originalBullets
              : exp.description
              ? [exp.description]
              : [];

          return {
            title: exp.title,
            organization: exp.organization,
            location: exp.location,
            period,
            bullets,
          };
        }) || [];

      const pdfUnmatched =
        includeTailoredBullets && resumeData?.experiences
          ? getUnmatchedTailoredBullets(resumeData.experiences, activeBullets).map((b) => ({
              roleContext: b.roleContext,
              tailored: b.tailored,
            }))
          : [];

      const pdfEducation =
        resumeData?.education?.map((edu) => ({
          title: edu.title,
          organization: edu.organization,
          period: formatResumePeriod(edu),
          description: edu.description,
        })) || [];

      const pdfSkills = skillsData?.map((s) => s.name) || [];

      const pdfProjects =
        includeProjects && activeProjects.length > 0
          ? activeProjects.map((p) => ({
              title: p.title,
              technologies: p.technologies,
              description: p.description,
            }))
          : [];

      const doc = (
        <TailoredCvPdfDocument
          candidateName={candidateName}
          candidateEmail={candidateEmail}
          candidateLocation={candidateLocation}
          candidateWebsite={candidateWebsite}
          targetRole={application.jobTitle}
          targetCompany={application.companyName}
          targetRoleHeadline={headlineText}
          summary={activeSummary}
          experiences={pdfExperiences}
          unmatchedBullets={pdfUnmatched}
          projects={pdfProjects}
          skills={pdfSkills}
          education={pdfEducation}
          includeSummary={includeTailoredSummary}
          includeBullets={includeTailoredBullets}
          includeProjects={includeProjects}
          includeTargetRole={includeHeadline}
          includeSkills={includeSkills}
          includeEducation={includeEducation}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeCompany = application.companyName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      link.href = url;
      link.download = `Resume_${candidateName.replace(/\s+/g, "_")}_${safeCompany}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Tailored ATS PDF downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to generate vector PDF. You can use 'Print / Save PDF' as fallback.", { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print / save as PDF.");
      return;
    }

    // Generate semantic, high-contrast HTML tailored for ATS and printing
    let experiencesHtml = "";
    if (resumeData?.experiences && resumeData.experiences.length > 0) {
      experiencesHtml = resumeData.experiences
        .map((exp) => {
          const period = formatResumePeriod(exp);
          const tailored = includeTailoredBullets
            ? getTailoredBulletsForExperience(exp, activeBullets)
            : [];
          const originalBullets = splitDescriptionToBullets(exp.description);

          let bulletsHtml = "";
          if (tailored.length > 0) {
            bulletsHtml = `<ul>${tailored.map((b) => `<li>${b.tailored}</li>`).join("")}</ul>`;
          } else if (originalBullets.length > 0) {
            bulletsHtml = `<ul>${originalBullets.map((b) => `<li>${b}</li>`).join("")}</ul>`;
          } else if (exp.description) {
            bulletsHtml = `<p class="summary-text">${exp.description}</p>`;
          }

          return `
            <div class="experience-item">
              <div class="exp-header">
                <div>
                  <span class="exp-title">${exp.title}</span> — 
                  <span class="exp-company">${exp.organization}</span>
                </div>
                <div class="exp-date">${period}</div>
              </div>
              ${exp.location ? `<div class="exp-location">${exp.location}</div>` : ""}
              ${bulletsHtml}
            </div>
          `;
        })
        .join("");

      if (includeTailoredBullets) {
        const unmatched = getUnmatchedTailoredBullets(
          resumeData.experiences,
          activeBullets
        );
        if (unmatched.length > 0) {
          experiencesHtml += `
            <div class="experience-item">
              <div class="exp-header">
                <span class="exp-title">Additional Targeted Accomplishments</span>
              </div>
              <ul>${unmatched.map((b) => `<li>${b.roleContext ? `<strong>[${b.roleContext}]</strong> ` : ""}${b.tailored}</li>`).join("")}</ul>
            </div>
          `;
        }
      }
    }

    let projectsHtml = "";
    if (includeProjects && activeProjects.length > 0) {
      projectsHtml = `
        <div class="section-block">
          <div class="section-title">Key Technical Projects</div>
          ${activeProjects
            .map(
              (p) => `
            <div class="experience-item">
              <div class="exp-header">
                <div>
                  <span class="exp-title">${p.title}</span>
                  ${p.technologies?.length ? ` — <span class="exp-company">${p.technologies.join(" • ")}</span>` : ""}
                </div>
              </div>
              <ul><li>${p.description}</li></ul>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    let skillsHtml = "";
    if (includeSkills && skillsData.length > 0) {
      skillsHtml = `
        <div class="section-block">
          <div class="section-title">Core Skills & Technologies</div>
          <div class="skills-list">${skillsData.map((s) => s.name).join(" • ")}</div>
        </div>
      `;
    }

    let educationHtml = "";
    if (includeEducation && resumeData?.education && resumeData.education.length > 0) {
      educationHtml = `
        <div class="section-block">
          <div class="section-title">Education</div>
          ${resumeData.education
            .map(
              (edu) => `
            <div class="education-item">
              <div><strong>${edu.title}</strong> — ${edu.organization}</div>
              <div class="exp-date">${formatResumePeriod(edu)}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Resume - ${candidateName} (${application.companyName})</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #111827;
              background: #fff;
              line-height: 1.45;
              font-size: 10pt;
              margin: 0;
              padding: 0;
            }
            h1 {
              font-size: 19pt;
              font-weight: 800;
              margin: 0 0 6px 0;
              line-height: 1.15;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .target-role {
              font-size: 10pt;
              font-weight: 700;
              color: #2563eb;
              margin-bottom: 6px;
              line-height: 1.25;
            }
            .contact-line {
              font-size: 8.5pt;
              color: #4b5563;
              margin-bottom: 12px;
              border-bottom: 1.5px solid #111827;
              padding-bottom: 7px;
              line-height: 1.35;
            }
            .section-block {
              margin-bottom: 12px;
              page-break-inside: auto;
            }
            .section-title {
              font-size: 10.5pt;
              font-weight: 800;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.75px;
              border-bottom: 1px solid #d1d5db;
              padding-bottom: 2px;
              margin-top: 10px;
              margin-bottom: 6px;
            }
            .summary-text {
              font-size: 9.5pt;
              color: #1f2937;
              text-align: justify;
              margin-bottom: 6px;
              line-height: 1.4;
            }
            .experience-item {
              margin-bottom: 8px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .exp-header {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              font-weight: 700;
              font-size: 9.5pt;
              color: #111827;
            }
            .exp-title {
              font-weight: 700;
              color: #111827;
            }
            .exp-company {
              font-weight: 600;
              color: #374151;
            }
            .exp-location {
              font-size: 8pt;
              color: #6b7280;
              font-style: italic;
              margin-bottom: 2px;
            }
            .exp-date {
              font-size: 8.5pt;
              font-weight: 600;
              color: #4b5563;
            }
            ul {
              margin: 2px 0 4px 0;
              padding-left: 16px;
            }
            li {
              font-size: 9pt;
              color: #374151;
              margin-bottom: 2.5px;
              line-height: 1.35;
            }
            .skills-list {
              font-size: 9pt;
              color: #374151;
              line-height: 1.45;
            }
            .education-item {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              font-size: 9pt;
              margin-bottom: 4px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div>
            <h1>${candidateName}</h1>
            ${includeHeadline && headlineText ? `<div class="target-role">${headlineText}</div>` : ""}
            <div class="contact-line">
              ${candidateLocation} | ${candidateEmail} | ${candidateWebsite}
            </div>
          </div>

          ${
            includeTailoredSummary && activeSummary
              ? `
            <div class="section-block">
              <div class="section-title">Professional Summary</div>
              <p class="summary-text">${activeSummary}</p>
            </div>
          `
              : ""
          }

          ${
            experiencesHtml
              ? `
            <div class="section-block">
              <div class="section-title">Work Experience</div>
              ${experiencesHtml}
            </div>
          `
              : ""
          }

          ${projectsHtml}
          ${skillsHtml}
          ${educationHtml}

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

            <div className="flex flex-wrap items-center gap-2">
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
                variant="outline"
                size="sm"
                onClick={handlePrintPdf}
                title="Browser print dialog (HTML fallback)"
                className="gap-1.5 text-xs h-8 bg-[#0C0E18] border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                Print / HTML
              </Button>

              <Button
                size="sm"
                onClick={handleDirectDownloadPdf}
                disabled={isGeneratingPdf}
                className="gap-1.5 text-xs h-8 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </>
                )}
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
                checked={includeHeadline}
                onCheckedChange={(c) => setIncludeHeadline(Boolean(c))}
                className="border-white/[0.2]"
              />
              <span>Role Title</span>
            </label>
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
                checked={includeProjects}
                onCheckedChange={(c) => setIncludeProjects(Boolean(c))}
                className="border-white/[0.2]"
              />
              <span>Key Projects</span>
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
                <TabsTrigger value="edit" className="text-xs gap-1.5 px-3 data-[state=active]:bg-[#131726] data-[state=active]:text-white">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Live Content Editor
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
                    <h1 className="text-2xl font-extrabold uppercase tracking-tight text-white mb-1.5">
                      {candidateName}
                    </h1>
                    {includeHeadline && headlineText && (
                      <div className="text-xs font-semibold text-indigo-400 mb-1.5">
                        {headlineText}
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground border-b pb-2 border-white/[0.1]">
                      {candidateLocation} | {candidateEmail} | {candidateWebsite}
                    </div>
                  </div>

                  {/* Summary */}
                  {includeTailoredSummary && activeSummary && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b pb-0.5 border-white/[0.08]">
                        Professional Summary
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300 pt-1">
                        {activeSummary}
                      </p>
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
                                  <span>{exp.title} — {exp.organization}</span>
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
                              {exp.location && (
                                <div className="text-[11px] text-muted-foreground italic">
                                  {exp.location}
                                </div>
                              )}
                              {tailored.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 pt-0.5 text-xs text-slate-300">
                                  {tailored.map((b, bIdx) => (
                                    <li key={bIdx} className="leading-relaxed">
                                      <span>{b.tailored}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : originalBullets.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 pt-0.5 text-xs text-slate-300">
                                  {originalBullets.map((b, bIdx) => (
                                    <li key={bIdx} className="leading-relaxed">
                                      <span>{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : exp.description ? (
                                <p className="text-slate-400 leading-relaxed text-[11px]">
                                  {exp.description}
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
                                    <span>{b.tailored}</span>
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
                        {activeProjects.map((proj, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between items-baseline font-bold text-slate-200">
                              <span>{proj.title}</span>
                              {proj.technologies && proj.technologies.length > 0 && (
                                <span className="text-[11px] font-normal text-muted-foreground italic font-mono">
                                  {proj.technologies.join(" • ")}
                                </span>
                              )}
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-300">
                              <li className="leading-relaxed">{proj.description}</li>
                            </ul>
                          </div>
                        ))}
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

            {/* TAB CONTENT: EDIT */}
            <TabsContent value="edit" className="mt-3 mb-0">
              <div className="p-5 bg-[#08090C] rounded-xl border border-white/[0.08] max-h-[50vh] overflow-y-auto space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Live Resume Content Editor</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Edits here immediately update the ATS Document Preview, Markdown, and printed PDF.
                    </p>
                  </div>
                  {onUpdate && (
                    <Button
                      size="sm"
                      disabled={isSavingDialog}
                      onClick={handleSaveDialogChanges}
                      className="text-xs h-8 px-3.5 bg-primary text-white font-bold gap-1.5 shadow-md shadow-primary/20 shrink-0"
                    >
                      {isSavingDialog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save to Application</span>
                    </Button>
                  )}
                </div>

                {/* Headline Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Role Title / Headline</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Displays below name (or toggle off in toolbar)
                    </span>
                  </div>
                  <Input
                    value={headlineText}
                    onChange={(e) => setHeadlineText(e.target.value)}
                    placeholder="e.g. Frontend Engineer or Senior Frontend Engineer"
                    className="h-8 text-xs bg-[#0C0E18] border-white/[0.1] text-indigo-300 font-semibold"
                  />
                </div>

                {/* Summary Editor */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Professional Summary</span>
                  </label>
                  <Textarea
                    value={activeSummary}
                    onChange={(e) => setActiveSummary(e.target.value)}
                    rows={4}
                    className="bg-[#0C0E18] border-white/[0.1] text-xs text-white resize-y font-sans leading-relaxed"
                    placeholder="Edit professional summary..."
                  />
                </div>

                {/* Bullets Editor */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>In-Place Experience Bullets (XYZ Method)</span>
                      </label>
                      <p className="text-[11px] text-muted-foreground">
                        Customized achievements replacing roles in your work experience
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddDialogBullet}
                      className="text-xs h-7 gap-1 border-dashed border-white/[0.15] bg-white/[0.02] text-gray-300 hover:text-white"
                    >
                      <Plus className="w-3 h-3 text-primary" />
                      <span>Add Bullet</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {activeBullets.map((bullet, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-white/[0.08] bg-[#0C0E18] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            value={bullet.roleContext || ""}
                            onChange={(e) => handleUpdateDialogBullet(idx, "roleContext", e.target.value)}
                            placeholder="Target Role / Company (e.g. Senior Software Engineer at Kick Avenue)"
                            className="h-7 text-xs bg-[#08090C] border-white/[0.1] text-indigo-300 font-semibold"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDialogBullet(idx)}
                            className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                            title="Delete bullet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={bullet.tailored}
                          onChange={(e) => handleUpdateDialogBullet(idx, "tailored", e.target.value)}
                          rows={2}
                          placeholder="Accomplished [X] as measured by [Y] by doing [Z]..."
                          className="text-xs bg-[#08090C] border-white/[0.08] text-white resize-y"
                        />
                        <Input
                          value={bullet.rationale || ""}
                          onChange={(e) => handleUpdateDialogBullet(idx, "rationale", e.target.value)}
                          placeholder="JD Alignment Rationale (optional)"
                          className="h-7 text-[11px] bg-[#08090C] border-white/[0.06] text-gray-400 italic"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects Editor */}
                {activeProjects.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Key Technical Projects</span>
                      </label>
                      <p className="text-[11px] text-muted-foreground">
                        Showcase high-impact architecture and systems aligned with this target role
                      </p>
                    </div>

                    <div className="space-y-3">
                      {activeProjects.map((proj, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-white/[0.08] bg-[#0C0E18] space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Input
                              value={proj.title}
                              onChange={(e) => handleUpdateDialogProject(idx, "title", e.target.value)}
                              placeholder="Project Title"
                              className="h-7 text-xs bg-[#08090C] border-white/[0.1] text-indigo-300 font-semibold"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDialogProject(idx)}
                              className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <Input
                            value={(proj.technologies || []).join(", ")}
                            onChange={(e) =>
                              handleUpdateDialogProject(
                                idx,
                                "technologies",
                                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            placeholder="Technologies (comma separated, e.g. React, Next.js, Redis)"
                            className="h-7 text-xs bg-[#08090C] border-white/[0.08] text-amber-300/90 font-mono"
                          />
                          <Textarea
                            value={proj.description}
                            onChange={(e) => handleUpdateDialogProject(idx, "description", e.target.value)}
                            rows={2}
                            placeholder="Architecture, scale, and technical outcome..."
                            className="text-xs bg-[#08090C] border-white/[0.08] text-white resize-y"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
