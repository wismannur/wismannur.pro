"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Globe2,
  HelpCircle,
  Loader2,
  MapPin,
  Plane,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { jobDiscoveryService } from "@/services";
import type { DiscoveredJob } from "@/services/job-discovery/types";

interface JobDiscoveryFeedProps {
  onJobImported?: () => void;
}

const REGION_FILTERS = [
  { id: "all", label: "🌍 All Regions" },
  { id: "worldwide", label: "🌐 100% Worldwide Remote" },
  { id: "apac", label: "🇸🇬 Singapore & APAC" },
  { id: "japan", label: "🇯🇵 Japan" },
  { id: "europe", label: "🇪🇺 Europe & UK" },
  { id: "australia", label: "🇦🇺 Australia & NZ" },
  { id: "usa", label: "🇺🇸 USA & Americas" },
];

const POPULAR_SEARCH_TAGS = [
  "All Roles",
  "Fullstack",
  "Frontend",
  "Backend",
  "Next.js",
  "React",
  "TypeScript",
  "Go",
  "AI / ML",
  "Mobile / Flutter",
];

function formatRelativeTime(dateString: string): { relative: string; exact: string } {
  try {
    const date = new Date(dateString);
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

    if (diffMonths >= 1) return { relative: `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`, exact };
    if (diffWeeks >= 1) return { relative: `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`, exact };
    if (diffDays >= 1) return { relative: `${diffDays} day${diffDays > 1 ? "s" : ""} ago`, exact };
    if (diffHours >= 1) return { relative: `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`, exact };
    if (diffMin >= 1) return { relative: `${diffMin} min${diffMin > 1 ? "s" : ""} ago`, exact };
    return { relative: "Just now", exact };
  } catch {
    return { relative: "Recently", exact: "N/A" };
  }
}

export function JobDiscoveryFeed({ onJobImported }: JobDiscoveryFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [activeTag, setActiveTag] = useState("All Roles");
  const [activeRegion, setActiveRegion] = useState<"all" | "worldwide" | "apac" | "japan" | "europe" | "australia" | "usa">("all");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedJobMap, setImportedJobMap] = useState<Record<string, string>>({});
  const [previewJob, setPreviewJob] = useState<DiscoveredJob | null>(null);

  const effectiveQuery = activeTag === "All Roles" ? debouncedSearchQuery : `${activeTag} ${debouncedSearchQuery}`.trim();

  const {
    data: jobs = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["discoveredJobs", effectiveQuery, activeRegion],
    queryFn: () =>
      jobDiscoveryService.fetchJobs({
        query: effectiveQuery,
        geo: activeRegion,
      }),
  });

  const handleImport = async (job: DiscoveredJob) => {
    setImportingId(job.id);
    try {
      const createdId = await jobDiscoveryService.importJob(job);
      setImportedJobMap((prev) => ({ ...prev, [job.id]: createdId }));
      toast.success(`"${job.title}" at ${job.companyName} added to Job Tracker!`);
      if (onJobImported) onJobImported();
    } catch (err: unknown) {
      console.error("Import error:", err);
      toast.error((err as Error).message || "Failed to import job to tracker.");
    } finally {
      setImportingId(null);
    }
  };

  const getMatchScoreBadge = (score: number) => {
    if (score >= 85) {
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    }
    if (score >= 70) {
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    }
    return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
  };

  const getSeniorityBadgeStyle = (level?: string) => {
    switch (level) {
      case "Lead":
      case "Staff":
      case "Executive":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "Senior":
        return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
      case "Junior":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Regional Filters */}
      <Card className="border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-sm">
        <CardHeader className="pb-3 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-primary" />
                Worldwide Tech Opportunities & Global Discovery
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aggregated in real-time from <strong>Jobicy, Remotive, Arbeitnow (Europe), and RemoteOK</strong> — auto-ranked against your CMS skills.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="gap-1.5 text-xs h-8 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh Feed
            </Button>
          </div>

          {/* Region Tabs / Filters */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground font-semibold mr-1">Region:</span>
            {REGION_FILTERS.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRegion(r.id as typeof activeRegion)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeRegion === r.id
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-muted/60 hover:bg-muted text-muted-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Search bar & Role Filters */}
          <div className="space-y-3 pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search job title, company, or tech stack (e.g. Senior Frontend, Next.js, Stripe, Berlin, Tokyo)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 text-xs h-9"
              />
              {(searchQuery !== debouncedSearchQuery || isRefetching) && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-semibold mr-1">Role:</span>
              {POPULAR_SEARCH_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    activeTag === tag
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted/70 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">
            Aggregating global tech feeds (Jobicy, Remotive, Arbeitnow, RemoteOK) & matching with your skills...
          </p>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State */
        <Card className="border-border/60">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <Globe className="w-10 h-10 text-muted-foreground/40" />
            <h4 className="font-semibold text-sm">No Jobs Found Matching Your Criteria</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Try selecting &quot;🌍 All Regions&quot; or searching with broader terms like &quot;React&quot; or &quot;Fullstack&quot;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setActiveTag("All Roles");
                setActiveRegion("all");
              }}
            >
              Reset All Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Jobs List / Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const isImported = Boolean(importedJobMap[job.id]);
            const createdAppId = importedJobMap[job.id];
            const isImporting = importingId === job.id;
            const timeInfo = formatRelativeTime(job.publishedAt);

            return (
              <Card
                key={job.id}
                className="border-border/80 hover:border-primary/40 transition-all shadow-sm hover:shadow flex flex-col justify-between overflow-hidden"
              >
                <CardHeader className="p-4 pb-2 space-y-2.5">
                  {/* Top Badges Row: Source Platform & Match Score */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Platform Source Badge */}
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${job.sourceBadgeColor || "bg-muted text-foreground border-border/60"}`}
                      >
                        {job.sourceName}
                      </Badge>

                      {/* Seniority Level */}
                      {job.seniorityLevel && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2 py-0.5 ${getSeniorityBadgeStyle(job.seniorityLevel)}`}
                        >
                          {job.seniorityLevel}
                        </Badge>
                      )}

                      {/* Visa Sponsorship */}
                      {job.visaSponsorship && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1"
                        >
                          <Plane className="w-2.5 h-2.5" /> Visa Sponsored
                        </Badge>
                      )}
                    </div>

                    {/* Skill Match Score */}
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold shrink-0 gap-1 px-2 py-0.5 ${getMatchScoreBadge(
                        job.matchScore
                      )}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {job.matchScore}% Match
                    </Badge>
                  </div>

                  {/* Main Company & Title Row */}
                  <div className="flex items-start gap-3">
                    {job.companyLogo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={job.companyLogo}
                        alt={job.companyName}
                        className="w-10 h-10 rounded-xl object-contain border border-border/60 p-1 bg-white shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
                        {job.companyName.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-1" title={job.title}>
                        {job.title}
                      </h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="font-semibold text-foreground/90">{job.companyName}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row: Salary, Mode, and Relative Posting Date */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <Badge variant="secondary" className="font-normal text-[10px] bg-muted/70">
                      🌐 {job.workplaceType}
                    </Badge>
                    <Badge variant="secondary" className="font-normal text-[10px] bg-muted/70">
                      ⏱️ {job.jobType}
                    </Badge>
                    {job.salary && (
                      <Badge variant="outline" className="font-bold text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                        💰 {job.salary}
                      </Badge>
                    )}

                    {/* Relative Posting Date with tooltip title */}
                    <div
                      className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto font-mono"
                      title={`Posted on: ${timeInfo.exact}`}
                    >
                      <Clock className="w-3 h-3 text-muted-foreground/70" />
                      <span>{timeInfo.relative}</span>
                    </div>
                  </div>

                  {/* Matched Skills Tags */}
                  {job.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold">Matched:</span>
                      {job.matchedSkills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium border border-primary/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>

                {/* Card Footer Actions */}
                <CardContent className="p-4 pt-2 border-t border-border/50 flex items-center justify-between gap-2 mt-2 bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewJob(job)}
                      className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-3 h-3" /> Preview JD
                    </Button>

                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      title="Open application portal in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Apply on {job.sourceName}
                    </a>
                  </div>

                  {isImported ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold shadow-xs"
                    >
                      <Link href={`/cms/job-tracker/${createdAppId}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Tracker 🚀
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleImport(job)}
                      disabled={isImporting}
                      className="h-7 text-xs gap-1 shadow-sm font-semibold bg-primary hover:bg-primary/90"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3 h-3" />
                          + 1-Click Track
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Job Description Dialog */}
      <Dialog open={Boolean(previewJob)} onOpenChange={(open) => !open && setPreviewJob(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          {previewJob && (
            <>
              <DialogHeader className="p-5 border-b border-border/70 bg-muted/20">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold ${previewJob.sourceBadgeColor}`}>
                        {previewJob.sourceName}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Posted {formatRelativeTime(previewJob.publishedAt).relative} ({formatRelativeTime(previewJob.publishedAt).exact})
                      </span>
                    </div>
                    <DialogTitle className="text-base font-bold">{previewJob.title}</DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      {previewJob.companyName} • {previewJob.location} • {previewJob.jobType}
                    </DialogDescription>
                  </div>
                  {previewJob.salary && (
                    <Badge variant="outline" className="text-xs font-bold border-emerald-500/30 text-emerald-600">
                      {previewJob.salary}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4 leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                {previewJob.description}
              </div>

              <div className="p-4 bg-muted/20 border-t border-border/60 flex justify-between items-center">
                <a
                  href={previewJob.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Application Portal on {previewJob.sourceName}
                </a>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewJob(null)} className="text-xs">
                    Close
                  </Button>
                  {!importedJobMap[previewJob.id] && (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleImport(previewJob);
                        setPreviewJob(null);
                      }}
                      className="text-xs gap-1 font-bold"
                    >
                      <Bookmark className="w-3 h-3" /> + Add to Job Tracker
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
