"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Filter,
  Globe2,
  Kanban,
  List,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { jobTrackerService } from "@/services";
import type {
  JobApplicationStatus,
} from "@/services/job-tracker/types";
import { KanbanBoard } from "./components/kanban-board";
import { ApplicationTable } from "./components/application-table";
import { AnalyticsDashboard } from "./components/analytics-dashboard";
import { SmartJobImporterDialog } from "./components/smart-job-importer-dialog";
import { WeeklyGoalTracker } from "./components/weekly-goal-tracker";
import { JobDiscoveryFeed } from "./components/job-discovery-feed";

export default function JobTrackerPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "analytics" | "discovery">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);

  const {
    data: applications = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["jobApplications"],
    queryFn: () => jobTrackerService.getAll(),
  });

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ["jobTrackerAnalytics"],
    queryFn: () => jobTrackerService.getAnalytics(),
  });

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchAnalytics()]);
    toast.success("Job tracker refreshed");
  };

  const handleStatusChange = async (id: string, newStatus: JobApplicationStatus) => {
    try {
      await jobTrackerService.updateStatus(id, newStatus);
      await Promise.all([refetch(), refetchAnalytics()]);
      toast.success(`Application moved to ${newStatus}`);
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update application status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await jobTrackerService.delete(id);
      await Promise.all([refetch(), refetchAnalytics()]);
      setApplicationToDelete(null);
      toast.success("Application deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete application");
    }
  };

  // Filtered applications for Kanban & Table
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (platformFilter !== "all" && app.platform !== platformFilter) {
        return false;
      }
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const matchesTitle = app.jobTitle.toLowerCase().includes(term);
        const matchesCompany = app.companyName.toLowerCase().includes(term);
        const matchesLocation = (app.location || "").toLowerCase().includes(term);
        if (!matchesTitle && !matchesCompany && !matchesLocation) {
          return false;
        }
      }
      return true;
    });
  }, [applications, searchQuery, platformFilter, statusFilter]);

  // Quick top summary counts
  const summaryMetrics = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((a) =>
      ["applied", "screening", "interview_hr", "interview_tech", "interview_user", "offering"].includes(a.status)
    ).length;
    const interviews = applications.filter((a) =>
      ["interview_hr", "interview_tech", "interview_user"].includes(a.status) || (a.interviews?.length ?? 0) > 0
    ).length;
    const offers = applications.filter((a) => a.status === "offering" || a.status === "accepted").length;
    const atsScores = applications.filter((a) => typeof a.atsScore === "number").map((a) => a.atsScore as number);
    const avgAts = atsScores.length > 0 ? Math.round(atsScores.reduce((acc, curr) => acc + curr, 0) / atsScores.length) : null;

    return { total, active, interviews, offers, avgAts };
  }, [applications]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Electric Obsidian Command Center Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Ambient radial glow orb */}
        <div className="absolute top-0 right-0 w-[500px] h-[280px] bg-primary/10 rounded-full blur-[110px] pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[150px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <Briefcase size={13} className="text-primary" />
                <span>CAREER PIPELINE ORCHESTRATOR</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Gemini AI Engine Active</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Job Application{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-primary">
                Tracker & Copilot
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Track global opportunities, tailor CV & optimize ATS fit with Gemini AI, simulate live tech interviews, and manage offer negotiations in one unified cockpit.
            </p>

            {/* Quick KPI badges line */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span><strong className="text-white font-bold">{summaryMetrics.total}</strong> Total Tracked</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span><strong className="text-white font-bold">{summaryMetrics.active}</strong> In Funnel</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span><strong className="text-white font-bold">{summaryMetrics.interviews}</strong> Interviews</span>
              </div>
              {summaryMetrics.avgAts !== null && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong className="text-white font-bold">{summaryMetrics.avgAts}%</strong> Avg ATS Fit</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading || isRefetching}
              className="rounded-full h-10 w-10 border-white/[0.12] bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] transition-all"
              title="Refresh Pipeline"
            >
              <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin text-primary")} />
            </Button>

            <Button
              variant="outline"
              onClick={() => setViewMode("discovery")}
              className="rounded-full gap-1.5 px-4 h-10 border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-primary/40 transition-all font-semibold text-xs"
            >
              <Globe2 className="w-4 h-4 text-primary" />
              <span>Explore Global Jobs</span>
            </Button>

            <Button
              onClick={() => setIsImporterOpen(true)}
              className="rounded-full gap-2 px-5 h-10 bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Add & Import Job</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Weekly Goal & Motivation Gamification Tracker */}
      <WeeklyGoalTracker
        applications={applications}
        onAddJobClick={() => setIsImporterOpen(true)}
      />

      {/* View Switcher & Search / Filters Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-stretch lg:items-center">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "kanban" | "table" | "analytics" | "discovery")}
          className="w-full lg:w-auto"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full lg:w-auto p-1 bg-[#0C0E18] border border-white/[0.08] rounded-2xl h-auto">
            <TabsTrigger
              value="kanban"
              className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
              {applications.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.1] text-gray-300 font-mono">
                  {applications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium"
            >
              <List className="w-3.5 h-3.5" />
              <span>List Table</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger
              value="discovery"
              className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium text-primary hover:text-white"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Global Feeds</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode !== "analytics" && viewMode !== "discovery" && (
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 items-center">
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search role or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-10 rounded-xl bg-[#0C0E18] border-white/[0.08] focus:border-primary/50"
              />
            </div>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[150px] text-xs h-10 rounded-xl bg-[#0C0E18] border-white/[0.08] focus:border-primary/50">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Platform" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-xs">
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="jobstreet">Jobstreet</SelectItem>
                <SelectItem value="glints">Glints</SelectItem>
                <SelectItem value="techinasia">Tech in Asia</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="company_website">Company Web</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>

            {viewMode === "table" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] text-xs h-10 rounded-xl bg-[#0C0E18] border-white/[0.08] focus:border-primary/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-xs">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="wishlist">Wishlist</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview_hr">HR Interview</SelectItem>
                  <SelectItem value="interview_tech">Tech Interview</SelectItem>
                  <SelectItem value="interview_user">User Interview</SelectItem>
                  <SelectItem value="offering">Offering</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Views Content */}
      {viewMode === "kanban" && (
        <KanbanBoard
          applications={filteredApplications}
          onStatusChange={handleStatusChange}
          onDelete={(id) => setApplicationToDelete(id)}
          onAddNew={() => setIsImporterOpen(true)}
        />
      )}

      {viewMode === "table" && (
        <ApplicationTable
          applications={filteredApplications}
          isLoading={isLoading}
          onStatusChange={handleStatusChange}
          onDelete={(id) => setApplicationToDelete(id)}
        />
      )}

      {viewMode === "analytics" && (
        <AnalyticsDashboard analytics={analytics} applications={applications} />
      )}

      {viewMode === "discovery" && (
        <JobDiscoveryFeed onJobImported={handleRefresh} />
      )}

      {/* Smart Job Importer Dialog */}
      <SmartJobImporterDialog
        open={isImporterOpen}
        onOpenChange={setIsImporterOpen}
        onSuccess={() => {
          refetch();
          refetchAnalytics();
        }}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(applicationToDelete)}
        onOpenChange={(open) => !open && setApplicationToDelete(null)}
      >
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.1] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Job Application?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs leading-relaxed">
              This will permanently remove this job opportunity and all recorded interview sessions,
              ATS tailoring data, and reflections from your tracker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.08] bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => applicationToDelete && handleDelete(applicationToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
