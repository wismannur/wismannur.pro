"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Eye,
  Globe,
  Globe2,
  Loader2,
  MapPin,
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
import { jobDiscoveryService } from "@/services";
import type { DiscoveredJob } from "@/services/job-discovery/types";

interface JobDiscoveryFeedProps {
  onJobImported?: () => void;
}

const POPULAR_SEARCH_TAGS = [
  "All Tech",
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

export function JobDiscoveryFeed({ onJobImported }: JobDiscoveryFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All Tech");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedJobMap, setImportedJobMap] = useState<Record<string, string>>({}); // jobId -> createdAppId
  const [previewJob, setPreviewJob] = useState<DiscoveredJob | null>(null);

  const effectiveQuery = activeTag === "All Tech" ? searchQuery : `${activeTag} ${searchQuery}`.trim();

  const {
    data: jobs = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["discoveredJobs", effectiveQuery],
    queryFn: () => jobDiscoveryService.fetchJobs({ query: effectiveQuery }),
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

  return (
    <div className="space-y-6">
      {/* Header & Smart Search Banner */}
      <Card className="border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-primary" />
                Worldwide Remote Tech Jobs Engine
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live global tech opportunities auto-ranked and matched against your master resume skills in CMS.
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

          {/* Search bar & quick filter pills */}
          <div className="space-y-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search job title, company, or tech stack (e.g. Senior Frontend, Next.js, Stripe)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* Popular Filter Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-semibold mr-1">Quick Filters:</span>
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
            Fetching live worldwide tech feeds & matching with your CMS skills...
          </p>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State */
        <Card className="border-border/60">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <Globe className="w-10 h-10 text-muted-foreground/40" />
            <h4 className="font-semibold text-sm">No Jobs Found Matching Your Criteria</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Try searching with broader terms or selecting &quot;All Tech&quot;.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setActiveTag("All Tech"); }}>
              Reset Filters
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

            return (
              <Card
                key={job.id}
                className="border-border/80 hover:border-primary/40 transition-all shadow-sm hover:shadow flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
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

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate" title={job.title}>
                          {job.title}
                        </h3>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="font-medium text-foreground/80">{job.companyName}</span>
                          <span>•</span>
                          <span className="truncate">{job.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge */}
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

                  {/* Metadata Row: Salary & Mode */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <Badge variant="secondary" className="font-normal text-[10px] bg-muted/60">
                      🌐 {job.workplaceType}
                    </Badge>
                    <Badge variant="secondary" className="font-normal text-[10px] bg-muted/60">
                      ⏱️ {job.jobType}
                    </Badge>
                    {job.salary && (
                      <Badge variant="outline" className="font-bold text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                        💰 {job.salary}
                      </Badge>
                    )}
                  </div>

                  {/* Matched Skills Tags */}
                  {job.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
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
                <CardContent className="p-4 pt-2 border-t border-border/50 flex items-center justify-between gap-2 mt-2">
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
                    >
                      <ExternalLink className="w-3 h-3" />
                      Original Post
                    </a>
                  </div>

                  {isImported ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold"
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
                  <ExternalLink className="w-3.5 h-3.5" /> Open Application Portal
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
