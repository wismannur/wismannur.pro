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
  TrendingUp,
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
import { jobTrackerService } from "@/services";
import type {
  JobApplication,
  JobApplicationStatus,
  JobPlatform,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Job Application Tracker</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track opportunities, match & tailor CV with Gemini AI, simulate interviews, and monitor
            hiring pipeline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="rounded-lg shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>

          <Button onClick={() => setIsImporterOpen(true)} className="gap-1.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Add & Import Job
          </Button>
        </div>
      </div>

      {/* Weekly Goal & Motivation Gamification Tracker */}
      <WeeklyGoalTracker
        applications={applications}
        onAddJobClick={() => setIsImporterOpen(true)}
      />

      {/* Top Controls & View Tabs */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "kanban" | "table" | "analytics" | "discovery")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="kanban" className="flex items-center gap-1.5 text-xs">
              <Kanban className="w-3.5 h-3.5" />
              Kanban Board
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-1.5 text-xs">
              <List className="w-3.5 h-3.5" />
              List Table
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="discovery" className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Globe2 className="w-3.5 h-3.5" />
              Explore Global Jobs
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode !== "analytics" && viewMode !== "discovery" && (
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 items-center">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search role or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[140px] text-xs h-9">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Platform" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Platforms
                </SelectItem>
                <SelectItem value="linkedin" className="text-xs">
                  LinkedIn
                </SelectItem>
                <SelectItem value="jobstreet" className="text-xs">
                  Jobstreet
                </SelectItem>
                <SelectItem value="glints" className="text-xs">
                  Glints
                </SelectItem>
                <SelectItem value="techinasia" className="text-xs">
                  Tech in Asia
                </SelectItem>
                <SelectItem value="indeed" className="text-xs">
                  Indeed
                </SelectItem>
                <SelectItem value="company_website" className="text-xs">
                  Company Web
                </SelectItem>
                <SelectItem value="referral" className="text-xs">
                  Referral
                </SelectItem>
              </SelectContent>
            </Select>

            {viewMode === "table" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] text-xs h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="wishlist" className="text-xs">
                    Wishlist
                  </SelectItem>
                  <SelectItem value="applied" className="text-xs">
                    Applied
                  </SelectItem>
                  <SelectItem value="screening" className="text-xs">
                    Screening
                  </SelectItem>
                  <SelectItem value="interview_hr" className="text-xs">
                    HR Interview
                  </SelectItem>
                  <SelectItem value="interview_tech" className="text-xs">
                    Tech Interview
                  </SelectItem>
                  <SelectItem value="interview_user" className="text-xs">
                    User Interview
                  </SelectItem>
                  <SelectItem value="offering" className="text-xs">
                    Offering
                  </SelectItem>
                  <SelectItem value="accepted" className="text-xs">
                    Accepted
                  </SelectItem>
                  <SelectItem value="rejected" className="text-xs">
                    Rejected
                  </SelectItem>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this job opportunity and all recorded interview sessions,
              ATS tailoring, and notes from your tracker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
