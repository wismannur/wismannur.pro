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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { resumeService, siteSettingsService, skillsService, userService } from "@/services";
import { formatResumePeriod } from "@/lib/resume";
import { rankSkillsForJobApplication, type RankedSkillItem } from "@/lib/tailored-skills";
import type { JobApplication, TailoredBullet, TailoredProjectHighlight } from "@/services/job-tracker/types";
import {
  DEFAULT_FLAGSHIP_PROJECT,
  initializeTailoredProjects,
  splitDescriptionToBullets,
  getTailoredBulletsForExperience,
  getUnmatchedTailoredBullets,
} from "./tailored-cv/constants";
import { generatePrintableCvHtml } from "./tailored-cv/print-html";
import { TailoredCvPreviewTab } from "./tailored-cv/tailored-cv-preview-tab";
import { TailoredCvEditTab } from "./tailored-cv/tailored-cv-edit-tab";
import { TailoredCvMarkdownTab } from "./tailored-cv/tailored-cv-markdown-tab";

export { DEFAULT_FLAGSHIP_PROJECT };

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
  const [customProjects, setCustomProjects] = useState<TailoredProjectHighlight[] | null>(null);
  const [customSkills, setCustomSkills] = useState<string[] | null>(
    application.atsAnalysis?.tailoredSkills && application.atsAnalysis.tailoredSkills.length > 0
      ? application.atsAnalysis.tailoredSkills
      : null
  );
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isSavingDialog, setIsSavingDialog] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch candidate master resume, skills, and profile
  const { data: resumeData } = useQuery({
    queryKey: ["resumePublished"],
    queryFn: () => resumeService.getPublished(),
    enabled: open,
  });

  const employerNames = useMemo(
    () => resumeData?.experiences?.map((e) => e.organization) || [],
    [resumeData?.experiences]
  );

  const activeProjects = useMemo(() => {
    if (customProjects !== null) {
      return customProjects;
    }
    return initializeTailoredProjects(application.atsAnalysis?.tailoredProjects, employerNames);
  }, [customProjects, application.atsAnalysis?.tailoredProjects, employerNames]);

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
              tailoredSkills: activeSkills,
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

  const handleAddDialogProject = () => {
    setCustomProjects([
      ...activeProjects,
      {
        title: "",
        technologies: [],
        description: "",
        bullets: [""],
      },
    ]);
  };

  const handleUpdateDialogProject = (
    index: number,
    field: keyof TailoredProjectHighlight,
    value: string | string[]
  ) => {
    setCustomProjects(
      activeProjects.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteDialogProject = (index: number) => {
    setCustomProjects(activeProjects.filter((_, i) => i !== index));
  };

  const handleAddProjectBullet = (projIndex: number) => {
    setCustomProjects(
      activeProjects.map((item, i) => {
        if (i !== projIndex) return item;
        const currentBullets =
          item.bullets && item.bullets.length > 0
            ? item.bullets
            : item.description
              ? [item.description]
              : [];
        return {
          ...item,
          bullets: [...currentBullets, ""],
        };
      })
    );
  };

  const handleUpdateProjectBullet = (
    projIndex: number,
    bulletIndex: number,
    val: string
  ) => {
    setCustomProjects(
      activeProjects.map((item, i) => {
        if (i !== projIndex) return item;
        const currentBullets =
          item.bullets && item.bullets.length > 0
            ? [...item.bullets]
            : item.description
              ? [item.description]
              : [""];
        currentBullets[bulletIndex] = val;
        return {
          ...item,
          bullets: currentBullets,
          description: currentBullets[0] || "",
        };
      })
    );
  };

  const handleDeleteProjectBullet = (projIndex: number, bulletIndex: number) => {
    setCustomProjects(
      activeProjects.map((item, i) => {
        if (i !== projIndex) return item;
        const currentBullets = (item.bullets || []).filter((_, bIdx) => bIdx !== bulletIndex);
        return {
          ...item,
          bullets: currentBullets,
          description: currentBullets[0] || "",
        };
      })
    );
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

  const { data: skillsData = [] } = useQuery({
    queryKey: ["skillsPublished"],
    queryFn: () => skillsService.getPublished(),
    enabled: open,
  });

  const rankedSkillsInfo = useMemo(() => {
    if (!skillsData || skillsData.length === 0) return [];
    return rankSkillsForJobApplication(skillsData, application);
  }, [skillsData, application]);

  const rankedSkillsMap = useMemo(() => {
    const map = new Map<string, RankedSkillItem>();
    rankedSkillsInfo.forEach((item) => {
      map.set(item.name.toLowerCase().trim(), item);
    });
    return map;
  }, [rankedSkillsInfo]);

  const activeSkills =
    customSkills !== null
      ? customSkills
      : rankedSkillsInfo.length > 0
        ? rankedSkillsInfo.map((s) => s.name)
        : skillsData.map((s) => s.name);

  const matchedSkillNamesSet = useMemo(() => {
    return new Set(
      rankedSkillsInfo.filter((s) => s.isMatched).map((s) => s.name.toLowerCase().trim())
    );
  }, [rankedSkillsInfo]);

  const handleMoveSkill = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeSkills.length) return;
    const next = [...activeSkills];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setCustomSkills(next);
  };

  const handleRemoveSkill = (index: number) => {
    setCustomSkills(activeSkills.filter((_, i) => i !== index));
  };

  const handleAddCustomSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (activeSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" is already included in skills.`);
      return;
    }
    setCustomSkills([...activeSkills, trimmed]);
    setNewSkillInput("");
    toast.success(`Added "${trimmed}" to Core Skills`);
  };

  const handleResetSkillsToJd = () => {
    const resetList = rankSkillsForJobApplication(skillsData, application).map((s) => s.name);
    setCustomSkills(resetList);
    toast.info("Core Skills re-sorted by target Job Description relevance!");
  };

  const { data: userData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getProfile(),
    enabled: open,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => siteSettingsService.get(),
    enabled: open,
  });

  const printRef = useRef<HTMLDivElement>(null);

  const candidateName = userData?.displayName || siteSettings?.siteName || "Wisman Nur";
  const candidateEmail = siteSettings?.publicEmail || "hi@wismannur.pro";
  const candidateLocation = userData?.location || siteSettings?.location || "Bandung, West Java, Indonesia";
  const candidateWebsite = userData?.website || "https://www.wismannur.pro";
  const candidateGithub = userData?.social?.github || siteSettings?.social?.github || "https://github.com/wismannur";
  const candidateLinkedin = userData?.social?.linkedin || siteSettings?.social?.linkedin || "https://linkedin.com/in/wismannur";

  // Build markdown representation of tailored CV
  const markdownCv = useMemo(() => {
    const lines: string[] = [];

    lines.push(`# ${candidateName}`);
    if (includeHeadline && headlineText) {
      lines.push(`**${headlineText}**`);
    }
    const contactParts = [
      candidateLocation,
      `[${candidateEmail}](mailto:${candidateEmail})`,
      candidateWebsite ? `[${candidateWebsite.replace(/^https?:\/\/(www\.)?/, "")}](${candidateWebsite})` : "",
      candidateLinkedin ? `[${candidateLinkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "linkedin.com/in/")}](${candidateLinkedin})` : "",
      candidateGithub ? `[${candidateGithub.replace(/^https?:\/\/(www\.)?github\.com\//, "github.com/")}](${candidateGithub})` : "",
    ].filter(Boolean);
    lines.push(contactParts.join(" | "));
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

        const tailored = includeTailoredBullets
          ? getTailoredBulletsForExperience(exp, activeBullets)
          : [];
        const originalBullets = splitDescriptionToBullets(exp.description);

        if (tailored.length > 0) {
          tailored.forEach((b) => lines.push(`- ${b.tailored.replace(/^[-•*]\s*/, "")}`));
        } else if (originalBullets.length > 0) {
          originalBullets.forEach((b) => lines.push(`- ${b.replace(/^[-•*]\s*/, "")}`));
        } else if (exp.description) {
          lines.push(exp.description.replace(/^[-•*]\s*/, ""));
        }
        lines.push("");
      });

      if (includeTailoredBullets) {
        const unmatched = getUnmatchedTailoredBullets(
          resumeData.experiences,
          activeBullets
        );
        if (unmatched.length > 0) {
          lines.push(`### Additional Targeted Accomplishments`);
          unmatched.forEach((b) => {
            lines.push(`- ${b.roleContext ? `**[${b.roleContext}]** ` : ""}${b.tailored.replace(/^[-•*]\s*/, "")}`);
          });
          lines.push("");
        }
      }
    }

    if (includeProjects && activeProjects.length > 0) {
      lines.push(`## Key Technical Projects`);
      activeProjects.forEach((proj) => {
        lines.push(`### ${proj.title}${proj.technologies?.length ? ` (${proj.technologies.join(", ")})` : ""}`);
        const bullets =
          proj.bullets && proj.bullets.length > 0
            ? proj.bullets
            : proj.description
              ? proj.description
                  .split("\n")
                  .map((s) => s.trim().replace(/^[•\-\*]\s*/, ""))
                  .filter(Boolean)
              : [proj.description];
        bullets.forEach((b) => lines.push(`- ${b}`));
        lines.push("");
      });
    }

    if (includeSkills && activeSkills.length > 0) {
      lines.push(`## Core Skills & Technologies`);
      lines.push(activeSkills.join(" • "));
      lines.push("");
    }

    if (includeEducation && resumeData?.education && resumeData.education.length > 0) {
      lines.push(`## Education & Certifications`);
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
    candidateGithub,
    candidateLinkedin,
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
    activeSkills,
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
              ? tailored.map((b) => b.tailored.replace(/^[-•*]\s*/, ""))
              : originalBullets.length > 0
              ? originalBullets.map((b) => b.replace(/^[-•*]\s*/, ""))
              : exp.description
              ? [exp.description.replace(/^[-•*]\s*/, "")]
              : [];

          return {
            title: exp.title,
            organization: exp.organization,
            location: exp.location,
            employmentType: exp.employmentType,
            locationType: exp.locationType,
            period,
            bullets,
          };
        }) || [];

      const pdfUnmatched =
        includeTailoredBullets && resumeData?.experiences
          ? getUnmatchedTailoredBullets(resumeData.experiences, activeBullets).map((b) => ({
              roleContext: b.roleContext,
              tailored: b.tailored.replace(/^[-•*]\s*/, ""),
            }))
          : [];

      const pdfEducation =
        resumeData?.education?.map((edu) => ({
          title: edu.title,
          organization: edu.organization,
          period: formatResumePeriod(edu),
          description: edu.description,
        })) || [];

      const pdfSkills = includeSkills && activeSkills.length > 0 ? activeSkills : [];

      const pdfProjects =
        includeProjects && activeProjects.length > 0
          ? activeProjects.map((p) => {
              const bullets =
                p.bullets && p.bullets.length > 0
                  ? p.bullets
                  : p.description
                    ? p.description
                        .split("\n")
                        .map((s) => s.trim().replace(/^[•\-\*]\s*/, ""))
                        .filter(Boolean)
                    : [p.description];
              return {
                title: p.title,
                technologies: p.technologies,
                description: p.description || bullets[0] || "",
                bullets,
              };
            })
          : [];

      const doc = (
        <TailoredCvPdfDocument
          candidateName={candidateName}
          candidateEmail={candidateEmail}
          candidateLocation={candidateLocation}
          candidateWebsite={candidateWebsite}
          candidateLinkedin={candidateLinkedin}
          candidateGithub={candidateGithub}
          targetCompany={application.companyName}
          targetRole={application.jobTitle || headlineText}
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

    const html = generatePrintableCvHtml({
      candidateName,
      candidateEmail,
      candidateLocation,
      candidateWebsite,
      candidateLinkedin,
      candidateGithub,
      application,
      headlineText,
      includeHeadline,
      activeSummary,
      includeTailoredSummary,
      activeBullets,
      includeTailoredBullets,
      activeProjects,
      includeProjects,
      activeSkills,
      includeSkills,
      includeEducation,
      resumeData,
    });

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
              <span>Education & Certifications</span>
            </label>
          </div>
        </DialogHeader>

        {/* View Switcher */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-white/[0.08] bg-[#131726]/40">
          <Tabs value={formatMode} onValueChange={(v) => setFormatMode(v as "preview" | "edit" | "markdown")} className="w-full">
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
              <TailoredCvPreviewTab
                candidateName={candidateName}
                candidateEmail={candidateEmail}
                candidateLocation={candidateLocation}
                candidateWebsite={candidateWebsite}
                candidateLinkedin={candidateLinkedin}
                candidateGithub={candidateGithub}
                includeHeadline={includeHeadline}
                headlineText={headlineText}
                includeTailoredSummary={includeTailoredSummary}
                activeSummary={activeSummary}
                includeTailoredBullets={includeTailoredBullets}
                activeBullets={activeBullets}
                includeProjects={includeProjects}
                activeProjects={activeProjects}
                includeSkills={includeSkills}
                activeSkills={activeSkills}
                includeEducation={includeEducation}
                resumeData={resumeData}
                printRef={printRef}
              />
            </TabsContent>

            {/* TAB CONTENT: EDIT */}
            <TabsContent value="edit" className="mt-3 mb-0">
              <TailoredCvEditTab
                hasUpdateHandler={Boolean(onUpdate)}
                isSavingDialog={isSavingDialog}
                onSaveDialogChanges={handleSaveDialogChanges}
                headlineText={headlineText}
                setHeadlineText={setHeadlineText}
                activeSummary={activeSummary}
                setActiveSummary={setActiveSummary}
                activeBullets={activeBullets}
                onAddBullet={handleAddDialogBullet}
                onUpdateBullet={handleUpdateDialogBullet}
                onDeleteBullet={handleDeleteDialogBullet}
                activeProjects={activeProjects}
                onAddProject={handleAddDialogProject}
                onUpdateProject={handleUpdateDialogProject}
                onDeleteProject={handleDeleteDialogProject}
                onAddProjectBullet={handleAddProjectBullet}
                onUpdateProjectBullet={handleUpdateProjectBullet}
                onDeleteProjectBullet={handleDeleteProjectBullet}
                activeSkills={activeSkills}
                matchedSkillNamesSet={matchedSkillNamesSet}
                rankedSkillsMap={rankedSkillsMap}
                newSkillInput={newSkillInput}
                setNewSkillInput={setNewSkillInput}
                onAddCustomSkill={handleAddCustomSkill}
                onResetSkillsToJd={handleResetSkillsToJd}
                onMoveSkill={handleMoveSkill}
                onRemoveSkill={handleRemoveSkill}
              />
            </TabsContent>

            {/* TAB CONTENT: MARKDOWN */}
            <TabsContent value="markdown" className="mt-3 mb-0">
              <TailoredCvMarkdownTab markdownCv={markdownCv} />
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
