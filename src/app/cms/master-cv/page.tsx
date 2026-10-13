"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Brain,
  Briefcase,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FolderGit2,
  Loader2,
  SlidersHorizontal,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { CmsMetricCards } from "@/components/cms/cms-metric-cards";
import { CmsPageHeader } from "@/components/cms/cms-page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import { formatResumePeriod } from "@/lib/resume";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { masterCvService, type MasterCvSyncProposal } from "@/services";
import { TabAiSync } from "./components/tab-ai-sync";
import { TabCurateCv } from "./components/tab-curate-cv";
import { TabLivePreview } from "./components/tab-live-preview";

type StudioTab = "sync" | "curate" | "preview";

function splitBulletsForPdf(description?: string): string[] {
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
    .filter(Boolean)
    .map((item) => (item.endsWith(".") || item.includes(":") ? item : `${item}.`));
}

export default function CmsMasterCvStudioPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<StudioTab>("sync");
  const [proposal, setProposal] = useState<MasterCvSyncProposal | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const hasAutoAuditedRef = useRef(false);

  const {
    data: snapshot,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["cms-master-cv-studio"],
    queryFn: () => masterCvService.getStudioSnapshot(),
    refetchOnMount: "always",
    staleTime: 0,
  });

  const handleRunAudit = useCallback(
    async (focusPrompt?: string, categoryFilter?: string) => {
      setIsAuditing(true);
      setActiveTab("sync");
      try {
        const res = await masterCvService.auditWithSecondBrain({
          focusPrompt,
          categoryFilter,
        });
        setProposal(res);
        toast.success(
          `Audit selesai! Ditemukan ${res.experienceUpgrades.length} upgrade Experience, ${res.projectUpgrades.length} Project, dan ${res.missingSkills.length} Skill baru.`
        );
      } catch (error) {
        console.error("Failed to audit Master CV with Second Brain:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Gagal menjalankan audit Master CV dari Second Brain."
        );
      } finally {
        setIsAuditing(false);
      }
    },
    []
  );

  // Support ?autoAudit=true when navigating from My Second Brain
  useEffect(() => {
    if (
      searchParams.get("autoAudit") === "true" &&
      snapshot &&
      !hasAutoAuditedRef.current &&
      !isAuditing
    ) {
      hasAutoAuditedRef.current = true;
      handleRunAudit();
    }
  }, [searchParams, snapshot, isAuditing, handleRunAudit]);

  // Listen to live CMS Staff Copilot tool executions to sync UI state in real time
  useEffect(() => {
    const handleCopilotMutation = (event: Event) => {
      const customEvent = event as CustomEvent<{
        tool?: string;
        result?: { success?: boolean; data?: unknown };
      }>;
      const toolName = customEvent.detail?.tool;
      const resultData = customEvent.detail?.result?.data;

      if (toolName === "audit_master_cv_with_second_brain" && resultData) {
        setProposal(resultData as MasterCvSyncProposal);
        setActiveTab("sync");
      } else if (
        toolName === "apply_master_cv_sync_plan" ||
        toolName === "update_master_cv_executive_header" ||
        toolName === "toggle_project_featured_on_cv"
      ) {
        if (toolName === "apply_master_cv_sync_plan") {
          setProposal(null);
        }
        refetch();
      }
    };

    window.addEventListener("cms-data-mutated", handleCopilotMutation);
    return () => window.removeEventListener("cms-data-mutated", handleCopilotMutation);
  }, [refetch]);

  const metrics = useMemo(() => {
    if (!snapshot) {
      return {
        activeBrain: 0,
        publishedResume: 0,
        featuredProjects: 0,
        publishedSkills: 0,
      };
    }
    return {
      activeBrain: snapshot.knowledgeItems.filter((k) => k.isPublished).length,
      publishedResume:
        snapshot.experiences.filter((e) => e.isPublished).length +
        snapshot.education.filter((e) => e.isPublished).length,
      featuredProjects: snapshot.projects.filter((p) => p.isPublished && p.isFeatured).length,
      publishedSkills: snapshot.skills.filter((s) => s.isPublished).length,
    };
  }, [snapshot]);

  useRegisterCmsPageContext(
    useMemo(() => {
      if (!snapshot) return null;
      return {
        pageTitle: "Master CV Studio",
        summary: `Managing Master CV (/cv) synchronized with ${metrics.activeBrain} Second Brain items, ${metrics.publishedResume} Resume entries, ${metrics.featuredProjects} Featured Projects, and ${metrics.publishedSkills} Skills. Viewing tab: ${activeTab}.${
          proposal
            ? ` Active Diff Proposal on screen (Alignment Score: ${proposal.alignmentScore}%, ${proposal.experienceUpgrades.length} experience upgrades, ${proposal.projectUpgrades.length} project upgrades, ${proposal.missingSkills.length} new skills).`
            : ""
        }`,
        filters: { activeTab, hasActiveProposal: Boolean(proposal) },
        activeItems: [
          ...(proposal
            ? [
                {
                  type: "active-diff-proposal",
                  alignmentScore: proposal.alignmentScore,
                  proposedHeadline: proposal.executiveProfile.proposedHeadline,
                  proposedBio: proposal.executiveProfile.proposedBio,
                  experienceUpgrades: proposal.experienceUpgrades.map((e) => ({
                    entryId: e.entryId,
                    title: e.title,
                    organization: e.organization,
                    proposedDescription: e.proposedDescription,
                  })),
                  projectUpgrades: proposal.projectUpgrades.map((p) => ({
                    projectId: p.projectId,
                    title: p.title,
                    proposedSummary: p.proposedSummary,
                    recommendFeatured: p.recommendFeatured,
                  })),
                  missingSkills: proposal.missingSkills,
                },
              ]
            : []),
          ...snapshot.experiences.slice(0, 6).map((e) => ({
            type: "experience",
            id: e.id,
            title: e.title,
            organization: e.organization,
            isPublished: e.isPublished,
          })),
          ...snapshot.projects
            .filter((p) => p.isPublished)
            .slice(0, 6)
            .map((p) => ({
              type: "cv-project",
              id: p.id,
              title: p.title,
              isFeatured: p.isFeatured,
            })),
        ],
      };
    }, [snapshot, metrics, activeTab, proposal])
  );

  const handleDownloadPdf = async () => {
    if (!snapshot) return;
    setIsDownloadingPdf(true);
    const toastId = toast.loading("Generating ATS Vector PDF...");
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { CvPdfDocument } = await import("@/app/cv/cv-pdf-document");

      const { user, settings } = snapshot;
      const name = user?.displayName || settings.siteName || "Wisman Nur";
      const headline =
        settings.ogTagline || "Senior Fullstack & Autonomous AI Systems Engineer";
      const email = settings.publicEmail || user?.email || PUBLIC_SUPPORT_EMAIL;
      const location = settings.location || user?.location || "Bandung, ID";
      const website = user?.website || "https://wismannur.pro";
      const github =
        settings.social?.github || user?.social?.github || "https://github.com/wismannur";
      const linkedin =
        settings.social?.linkedin || user?.social?.linkedin || "https://linkedin.com/in/wismannur";
      const bio =
        user?.bio ||
        settings.footerBio ||
        "Senior Fullstack & Autonomous AI Systems Engineer with 7+ years of experience architecting high-performance web applications, sub-second edge runtimes, and autonomous multi-agent pipelines.";

      const pdfExperiences = snapshot.experiences
        .filter((e) => e.isPublished)
        .map((exp) => ({
          title: exp.title,
          organization: exp.organization,
          location: exp.location,
          employmentType: exp.employmentType,
          locationType: exp.locationType,
          period: formatResumePeriod(exp),
          bullets: splitBulletsForPdf(exp.description),
        }));

      const pdfProjects = snapshot.projects
        .filter((p) => p.isPublished)
        .slice(0, 4)
        .map((proj) => {
          const text = proj.summary || proj.description || "";
          const bullets = splitBulletsForPdf(text);
          return {
            title: proj.title,
            technologies: proj.technologies,
            description: text,
            bullets: bullets.length > 0 ? bullets : [text],
          };
        });

      const pdfEducation = snapshot.education
        .filter((e) => e.isPublished)
        .map((edu) => ({
          title: edu.title,
          organization: edu.organization,
          period: formatResumePeriod(edu),
          description: edu.description,
        }));

      const pdfSkills = snapshot.skills.filter((s) => s.isPublished).map((s) => s.name);

      const doc = (
        <CvPdfDocument
          name={name}
          headline={headline}
          email={email}
          location={location}
          website={website}
          linkedin={linkedin}
          github={github}
          bio={bio}
          experiences={pdfExperiences}
          projects={pdfProjects}
          skills={pdfSkills}
          education={pdfEducation}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CV_${name.replace(/\s+/g, "_")}_wismannur.pro.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("ATS Vector PDF berhasil diunduh!", { id: toastId });
    } catch (error) {
      console.error("Failed to generate vector PDF:", error);
      toast.error("Gagal membuat ATS Vector PDF.", { id: toastId });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <CmsPageHeader
        icon={FileCheck2}
        title="Master CV Studio"
        description="Hub-and-Spoke CV command center • Synchronized with My Second Brain, Resume, Projects & Skills"
        badge="ATS Vector Ready"
        onRefresh={() => refetch()}
        isRefreshing={isLoading || isRefetching}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl border-white/[0.1] bg-white/[0.03] text-slate-200 hover:bg-white/[0.07] text-xs h-9"
            >
              <Link href="/cv" target="_blank">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                View Live /cv
              </Link>
            </Button>

            <Button
              onClick={handleDownloadPdf}
              disabled={isLoading || isDownloadingPdf}
              size="sm"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 font-semibold text-xs h-9"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              Download ATS PDF
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <CmsMetricCards
        gridCols="grid-cols-2 sm:grid-cols-4"
        metrics={[
          {
            id: "brain",
            label: "Active Second Brain",
            value: metrics.activeBrain,
            icon: Brain,
            color: "purple",
            active: activeTab === "sync",
            onClick: () => setActiveTab("sync"),
          },
          {
            id: "resume",
            label: "CV Experience & Edu",
            value: metrics.publishedResume,
            icon: Briefcase,
            color: "indigo",
            active: activeTab === "curate",
            onClick: () => setActiveTab("curate"),
          },
          {
            id: "projects",
            label: "CV Featured Projects",
            value: `${metrics.featuredProjects}/4`,
            icon: FolderGit2,
            color: "emerald",
            active: activeTab === "curate",
            onClick: () => setActiveTab("curate"),
          },
          {
            id: "skills",
            label: "Published Skills",
            value: metrics.publishedSkills,
            icon: Award,
            color: "amber",
            active: activeTab === "preview",
            onClick: () => setActiveTab("preview"),
          },
        ]}
      />

      {isLoading || !snapshot ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full max-w-lg rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as StudioTab)}
          className="space-y-6"
        >
          <TabsList className="bg-[#131726]/90 border border-white/[0.08] p-1 rounded-xl flex flex-wrap h-auto gap-1 w-fit">
            <TabsTrigger
              value="sync"
              className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs sm:text-sm py-2 px-3.5"
            >
              <Wand2 className="w-3.5 h-3.5 mr-2" />
              AI Second Brain Re-Generator
              {proposal && (
                <span className="ml-2 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Diff Ready
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="curate"
              className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs sm:text-sm py-2 px-3.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-2" />
              Curate CV Sections & Projects
            </TabsTrigger>

            <TabsTrigger
              value="preview"
              className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs sm:text-sm py-2 px-3.5"
            >
              <Eye className="w-3.5 h-3.5 mr-2" />
              Live Master CV & PDF Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="mt-0">
            <TabAiSync
              snapshot={snapshot}
              proposal={proposal}
              setProposal={setProposal}
              isAuditing={isAuditing}
              onRunAudit={handleRunAudit}
              onApplied={() => refetch()}
            />
          </TabsContent>

          <TabsContent value="curate" className="mt-0">
            <TabCurateCv snapshot={snapshot} onUpdated={() => refetch()} />
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <TabLivePreview
              snapshot={snapshot}
              isDownloadingPdf={isDownloadingPdf}
              onDownloadPdf={handleDownloadPdf}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
