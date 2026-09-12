"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Globe2,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import { atsDirectService, jobDiscoveryService } from "@/services";
import type { DiscoveredJob } from "@/services/job-discovery/types";
import type { AtsPlatform } from "@/services/job-discovery/ats-direct/types";
import { AddCompanyDialog } from "./add-company-dialog";

interface DirectAtsFeedProps {
  onJobImported?: () => void;
}

function formatRelativeTime(dateString: string): { relative: string; exact: string } {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { relative: "Recently", exact: "" };

    const exact = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths >= 1) return { relative: `${diffMonths} mo ago`, exact };
    if (diffWeeks >= 1) return { relative: `${diffWeeks} wk${diffWeeks > 1 ? "s" : ""} ago`, exact };
    if (diffDays >= 1) return { relative: `${diffDays}d ago`, exact };
    if (diffHours >= 1) return { relative: `${diffHours}h ago`, exact };
    if (diffMin >= 1) return { relative: `${diffMin}m ago`, exact };
    return { relative: "Just now", exact };
  } catch {
    return { relative: "Recently", exact: "" };
  }
}

function decodeHtmlEntities(html: string): string {
  if (!html) return "";

  const decodeOnce = (str: string) => {
    let text = str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&nbsp;/g, " ")
      .replace(/&#160;/g, " ")
      .replace(/&bull;/g, "•")
      .replace(/&ndash;/g, "–")
      .replace(/&mdash;/g, "—")
      .replace(/&hellip;/g, "…");

    text = text.replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return "";
      }
    });

    text = text.replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    });

    return text;
  };

  let decoded = decodeOnce(html);
  if (decoded.includes("&lt;") || decoded.includes("&gt;")) {
    decoded = decodeOnce(decoded);
  }

  return decoded;
}

export function DirectAtsFeed({ onJobImported }: DirectAtsFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 400);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<AtsPlatform | "all">("all");

  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [expandedReasonsId, setExpandedReasonsId] = useState<string | null>(null);
  const [selectedJobPreview, setSelectedJobPreview] = useState<DiscoveredJob | null>(null);

  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedJobMap, setImportedJobMap] = useState<Record<string, string>>({});

  // 1. Fetch Companies list
  const {
    data: companies = [],
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["direct-ats-companies"],
    queryFn: () => atsDirectService.getCompanies(),
  });

  const [shouldForceRefresh, setShouldForceRefresh] = useState(false);

  // 2. Fetch Jobs from ATS (Defaults to 100% Worldwide Remote & Indonesia-friendly)
  const {
    data: jobsData,
    isLoading,
    isRefetching,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: [
      "direct-ats-jobs",
      debouncedQuery,
      selectedCompanyId,
      selectedPlatform,
      shouldForceRefresh,
    ],
    queryFn: async () => {
      const res = await atsDirectService.fetchJobs({
        query: debouncedQuery,
        selectedCompanies: selectedCompanyId !== "all" ? [selectedCompanyId] : undefined,
        platform: selectedPlatform,
        remoteOnly: true,
        worldwideOnly: true,
        limit: 80,
        forceRefresh: shouldForceRefresh,
      });
      if (shouldForceRefresh) {
        setShouldForceRefresh(false);
      }
      return res;
    },
  });

  const jobs = useMemo(() => jobsData?.jobs || [], [jobsData?.jobs]);
  const totalCount = jobsData?.totalCount || 0;
  const companiesCount = jobsData?.companiesCount || 0;

  // Expose live rendered ATS jobs to CMS Copilot
  useRegisterCmsPageContext(
    useMemo(() => {
      if (jobs.length === 0) return null;
      return {
        pageTitle: "Job Hunter - Direct ATS Feed",
        summary: `Currently viewing ${jobs.length} jobs out of ${totalCount} total from ${companiesCount} companies (Ashby, Greenhouse, Lever). Filters: platform=${selectedPlatform}, company=${selectedCompanyId}, search="${debouncedQuery || ""}"`,
        filters: { platform: selectedPlatform, company: selectedCompanyId, query: debouncedQuery },
        activeItems: jobs.slice(0, 15).map((j) => ({
          title: j.title,
          company: j.companyName,
          platform: j.source,
          location: j.location,
          matchScore: j.matchScore,
          matchedSkills: j.matchedSkills?.slice(0, 4),
          salary: j.salary,
          url: j.jobUrl,
        })),
      };
    }, [jobs, totalCount, companiesCount, selectedPlatform, selectedCompanyId, debouncedQuery])
  );

  const handleImport = async (job: DiscoveredJob) => {
    setImportingId(job.id);
    try {
      const createdId = await jobDiscoveryService.importJob(job);
      setImportedJobMap((prev) => ({ ...prev, [job.id]: createdId }));
      toast.success(`"${job.title}" at ${job.companyName} imported to Job Tracker!`);
      if (onJobImported) onJobImported();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to import job.");
    } finally {
      setImportingId(null);
    }
  };

  const getPlatformBadge = (platform?: string) => {
    switch (platform) {
      case "ashby":
        return { label: "Ashby", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
      case "greenhouse":
        return { label: "Greenhouse", color: "bg-teal-500/15 text-teal-400 border-teal-500/30" };
      case "lever":
        return { label: "Lever", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" };
      default:
        return { label: "Direct ATS", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
    }
  };

  const getMatchScoreBadge = (score: number) => {
    if (score >= 85) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (score >= 70) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0C0E18] via-[#111425] to-[#17132B] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Zap className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Direct ATS Hub
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30">
                  Zero Intermediaries
                </Badge>
              </h2>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl">
              Real-time published opportunities synced directly from official ATS APIs (<strong>Ashby, Greenhouse, and Lever</strong>). Clean application forms with zero recruiter spam.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddCompanyOpen(true)}
              className="gap-1.5 text-xs h-9 bg-white/[0.04] border-white/[0.1] hover:bg-white/[0.08]"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              Add Target Company
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShouldForceRefresh(true);
                toast.info("Fetching latest openings from official ATS engines...");
              }}
              disabled={isLoading || isRefetching}
              className="gap-1.5 text-xs h-9 bg-white/[0.04] border-white/[0.1] hover:bg-white/[0.08]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Company Quick-Filter Chips */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Target Tech Companies ({companies.length}):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => setSelectedCompanyId("all")}
              className={`text-xs px-3 py-1 rounded-xl font-medium transition-all ${
                selectedCompanyId === "all"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] border border-white/[0.06]"
              }`}
            >
              🌟 All ({companies.length})
            </button>
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCompanyId(c.id === selectedCompanyId ? "all" : c.id)}
                className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                  selectedCompanyId === c.id
                    ? "bg-primary text-white shadow-sm font-semibold"
                    : "bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-white/[0.1] text-gray-400">
                  {c.platform}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0C0E18] border border-white/[0.08] p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search role, skills, or title (e.g. Staff Fullstack, Next.js, Frontend)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 bg-black/40 border-white/[0.08] focus:border-primary/50 text-white"
          />
        </div>

        {/* ATS Engine Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 rounded-xl bg-black/40 border border-white/[0.08]">
            {(["all", "ashby", "greenhouse", "lever"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPlatform(p)}
                className={`text-xs px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                  selectedPlatform === p
                    ? "bg-primary text-white font-semibold"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Globe2 className="w-3.5 h-3.5 shrink-0" />
            <span>100% Worldwide Remote</span>
          </div>
        </div>
      </div>

      {/* Jobs Feed List */}
      {isLoading ? (
        <div className="text-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-xs text-gray-400 font-medium">
            Syncing real-time job openings from {companiesCount || "target"} official ATS engines...
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl border-white/[0.08] bg-card/30 space-y-2">
          <Compass className="w-10 h-10 mx-auto text-gray-500" />
          <p className="text-sm font-semibold text-gray-200">No open roles found</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try adjusting your search keyword, clearing filters, or adding more target companies.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCompanyId("all");
              setSelectedPlatform("all");
            }}
            className="text-xs mt-2"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              Showing <strong>{jobs.length}</strong> active roles across <strong>{companiesCount}</strong> target companies
            </span>
            <span>Sorted by CMS Profile Match Score</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {jobs.map((job) => {
              const platformBadge = getPlatformBadge(job.source);
              const isImported = Boolean(importedJobMap[job.id]);
              const isReasonsExpanded = expandedReasonsId === job.id;
              const isWorldwide = job.geoRegion === "worldwide" || job.geoRegion === "apac";
              const time = formatRelativeTime(job.publishedAt);

              return (
                <div
                  key={job.id}
                  className="group rounded-2xl border border-white/[0.08] bg-[#0C0E18] hover:border-primary/40 hover:bg-[#101322] transition-all p-4 space-y-3 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Company Name */}
                        <span className="font-semibold text-xs text-purple-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {job.companyName}
                        </span>

                        {/* ATS Platform Badge */}
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 uppercase font-mono ${platformBadge.color}`}
                        >
                          {platformBadge.label}
                        </Badge>

                        {/* Workplace & Location Badge */}
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 flex items-center gap-1 ${
                            isWorldwide
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                              : job.workplaceType === "remote"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/25"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {isWorldwide ? (
                            <>
                              <Globe2 className="w-3 h-3 text-emerald-400" />
                              <span>{job.geoRegion === "apac" ? "APAC Remote" : "Worldwide Remote"}</span>
                            </>
                          ) : (
                            <>
                              <span>{job.workplaceType === "remote" ? "Remote" : "Onsite"}:</span>
                              <span className="font-semibold">{job.location}</span>
                            </>
                          )}
                        </Badge>

                        {job.seniorityLevel && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/[0.04] text-gray-300 border-white/[0.08]">
                            {job.seniorityLevel}
                          </Badge>
                        )}
                      </div>

                      {/* Job Title */}
                      <h3
                        onClick={() => setSelectedJobPreview(job)}
                        className="text-sm sm:text-base font-bold text-white group-hover:text-primary transition-colors cursor-pointer"
                      >
                        {job.title}
                      </h3>

                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <span>📍 {job.location}</span>
                        {job.salary && <span className="text-emerald-400 font-medium font-mono">💵 {job.salary}</span>}
                      </p>
                    </div>

                    {/* Match Score & Relative Time */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0.5 font-bold flex items-center gap-1 ${getMatchScoreBadge(
                            job.matchScore
                          )}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {job.matchScore}% Match
                        </Badge>
                        {job.matchReasons && job.matchReasons.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedReasonsId(isReasonsExpanded ? null : job.id)
                            }
                            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08]"
                            title="Show Match Breakdown"
                          >
                            {isReasonsExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Pretty Relative Date */}
                      <div className="flex items-center gap-1.5 text-right font-mono">
                        <Clock className="w-3 h-3 text-gray-500 shrink-0" />
                        <span className="text-xs font-semibold text-purple-300">
                          {time.relative}
                        </span>
                        {time.exact && (
                          <span className="text-[10px] text-gray-500 hidden sm:inline">
                            ({time.exact})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Match Breakdown Expandable */}
                  {isReasonsExpanded && job.matchReasons && (
                    <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-200/90 space-y-1">
                      <p className="font-semibold text-[11px] text-purple-300">
                        AI Skill Calibration Reasons:
                      </p>
                      <ul className="space-y-0.5 text-[11px] list-disc list-inside">
                        {job.matchReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.tags.slice(0, 5).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-gray-400 border border-white/[0.06]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions Bottom Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedJobPreview(job)}
                      className="text-xs h-8 text-gray-400 hover:text-white px-2"
                    >
                      <Info className="w-3.5 h-3.5 mr-1" />
                      View Description
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImport(job)}
                        disabled={importingId === job.id || isImported}
                        className={`text-xs h-8 gap-1.5 ${
                          isImported
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-white/[0.04] border-white/[0.1] hover:bg-white/[0.08]"
                        }`}
                      >
                        {importingId === job.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isImported ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Briefcase className="w-3.5 h-3.5 text-primary" />
                        )}
                        {isImported ? "Added to Tracker" : "1-Click Import"}
                      </Button>

                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-sm transition-all"
                      >
                        Apply Officially
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog Preview */}
      <Dialog
        open={Boolean(selectedJobPreview)}
        onOpenChange={(open) => !open && setSelectedJobPreview(null)}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          {selectedJobPreview && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {selectedJobPreview.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedJobPreview.companyName}
                    </span>
                  </div>
                  <DialogTitle className="text-lg font-bold">
                    {selectedJobPreview.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    📍 {selectedJobPreview.location} • {selectedJobPreview.workplaceType}
                    {selectedJobPreview.salary && ` • ${selectedJobPreview.salary}`}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div
                className="prose prose-sm dark:prose-invert max-w-none text-xs text-gray-300 border-t border-border/50 pt-4 space-y-2
                  [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-4 [&_h1]:mb-2
                  [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-1.5
                  [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-2.5 [&_h3]:mb-1
                  [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-purple-300 [&_h4]:mt-2 [&_h4]:mb-1
                  [&_p]:leading-relaxed [&_p]:mb-2.5 [&_p]:text-gray-300
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-2.5 [&_ul]:text-gray-300
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-2.5 [&_ol]:text-gray-300
                  [&_li]:leading-relaxed
                  [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80
                  [&_strong]:text-white [&_strong]:font-semibold
                  [&_b]:text-white [&_b]:font-semibold"
                dangerouslySetInnerHTML={{
                  __html:
                    decodeHtmlEntities(selectedJobPreview.description) ||
                    "<p>No detailed description provided by the ATS feed.</p>",
                }}
              />

              <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleImport(selectedJobPreview)}
                  disabled={
                    importingId === selectedJobPreview.id ||
                    Boolean(importedJobMap[selectedJobPreview.id])
                  }
                  className="text-xs h-8 gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  {importedJobMap[selectedJobPreview.id]
                    ? "In Tracker"
                    : "1-Click Import to Tracker"}
                </Button>

                <a
                  href={selectedJobPreview.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-sm"
                >
                  Apply Officially
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Manage Company Dialog */}
      <AddCompanyDialog
        open={isAddCompanyOpen}
        onOpenChange={setIsAddCompanyOpen}
        companies={companies}
        onCompanyUpdated={() => {
          refetchCompanies();
          refetchJobs();
        }}
      />
    </div>
  );
}
