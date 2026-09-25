"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Crosshair,
  Filter,
  Inbox,
  Kanban,
  Laptop,
  Layers,
  List,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Target,
  Trophy,
  Video,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { projectFinderService } from "@/services/project-finder";
import type {
  ProjectProspect,
  ProjectProspectStatus,
} from "@/services/project-finder/types";
import { KanbanBoard } from "./components/kanban-board";
import { ProspectTable } from "./components/prospect-table";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";

const FUNNEL_STAGES = [
  { id: "sourced", label: "Sourced", icon: Inbox, color: "text-slate-400", activeBg: "bg-slate-500/20 border-slate-500/40" },
  { id: "audited", label: "Audited", icon: Sparkles, color: "text-blue-400", activeBg: "bg-blue-500/20 border-blue-500/40" },
  { id: "building_mvp", label: "Building MVP", icon: Laptop, color: "text-amber-400", activeBg: "bg-amber-500/20 border-amber-500/40" },
  { id: "pitch_ready", label: "Pitch Ready", icon: CheckCircle2, color: "text-purple-400", activeBg: "bg-purple-500/20 border-purple-500/40" },
  { id: "outreach_sent", label: "Outreach Sent", icon: Send, color: "text-cyan-400", activeBg: "bg-cyan-500/20 border-cyan-500/40" },
  { id: "negotiation", label: "Negotiation", icon: Zap, color: "text-orange-400", activeBg: "bg-orange-500/20 border-orange-500/40" },
  { id: "won", label: "Won Deals", icon: Trophy, color: "text-emerald-400", activeBg: "bg-emerald-500/20 border-emerald-500/40" },
] as const;

export default function ProjectTrackerPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [prospectToDelete, setProspectToDelete] = useState<string | null>(null);

  const {
    data: prospects = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["projectProspects"],
    queryFn: () => projectFinderService.getAll(),
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Prospects reloaded.");
    } catch {
      toast.error("Failed to refresh prospects.");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ProjectProspectStatus) => {
    try {
      await projectFinderService.updateStatus(id, newStatus);
      toast.success("Pipeline status updated.");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!prospectToDelete) return;
    try {
      await projectFinderService.delete(prospectToDelete);
      toast.success("Prospect removed from pipeline.");
      setProspectToDelete(null);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete prospect.");
    }
  };

  const handleOpenDetail = (prospect: ProjectProspect) => {
    router.push(`/cms/project-tracker/${prospect.id}`);
  };

  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyWebsite.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.contactName && p.contactName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesIndustry =
        industryFilter === "all" || p.industry === industryFilter;

      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesIndustry && matchesStatus;
    });
  }, [prospects, searchQuery, industryFilter, statusFilter]);

  useRegisterCmsPageContext(
    useMemo(() => {
      if (filteredProspects.length === 0) return null;
      return {
        pageTitle: "Finder Project Hub - Project Tracker",
        summary: `Loaded ${filteredProspects.length} client prospects (Total in DB: ${prospects.length}). Filters: Status ${statusFilter}, Industry ${industryFilter}, Search "${searchQuery}"`,
        filters: { status: statusFilter, industry: industryFilter, search: searchQuery },
        activeItems: filteredProspects.slice(0, 15).map((p) => ({
          id: p.id,
          companyName: p.companyName,
          companyWebsite: p.companyWebsite,
          industry: p.industry,
          country: p.country,
          status: p.status,
          auditScore: p.auditScore,
          contactName: p.contactName,
          contactEmail: p.contactEmail,
          outreachStatus: p.outreachStatus,
        })),
      };
    }, [filteredProspects, prospects.length, statusFilter, industryFilter, searchQuery])
  );

  // Quick summary counts
  const summaryMetrics = useMemo(() => {
    const total = prospects.length;
    const inFunnel = prospects.filter((p) =>
      ["sourced", "audited", "building_mvp", "pitch_ready", "outreach_sent", "negotiation"].includes(p.status)
    ).length;
    const highAudit = prospects.filter((p) => (p.auditScore ?? 0) >= 70).length;
    const pitchReady = prospects.filter((p) => p.status === "pitch_ready").length;
    const won = prospects.filter((p) => p.status === "won").length;
    const withMvpOrLoom = prospects.filter((p) => Boolean(p.mvpDemoUrl || p.loomVideoUrl)).length;

    // Stage counts for funnel breakdown
    const stageCounts: Record<string, number> = {
      sourced: prospects.filter((p) => p.status === "sourced").length,
      audited: prospects.filter((p) => p.status === "audited").length,
      building_mvp: prospects.filter((p) => p.status === "building_mvp").length,
      pitch_ready: prospects.filter((p) => p.status === "pitch_ready").length,
      outreach_sent: prospects.filter((p) => p.status === "outreach_sent").length,
      negotiation: prospects.filter((p) => p.status === "negotiation").length,
      won: prospects.filter((p) => p.status === "won").length,
    };

    return { total, inFunnel, highAudit, pitchReady, won, withMvpOrLoom, stageCounts };
  }, [prospects]);

  const hasActiveFilters = searchQuery !== "" || industryFilter !== "all" || statusFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setIndustryFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 text-slate-100">
      {/* Electric Obsidian Command Center Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Ambient radial glow orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[280px] bg-primary/10 rounded-full blur-[110px] pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[150px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <Briefcase size={13} className="text-primary" />
                <span>CLIENT PIPELINE &amp; DEAL CRM</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Gemini Hunter Engine Active</span>
              </span>
              {summaryMetrics.won > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  <Trophy size={11} className="text-emerald-400" />
                  <span>{summaryMetrics.won} Won Deals</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Project Pipeline{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-primary">
                Tracker &amp; CRM
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              High-converting outbound CRM for European &amp; US e-commerce modernization. Track stages from live performance audits to Nuxt 4 MVP demos, Loom video walkthroughs, and closed consulting contracts.
            </p>

            {/* Quick KPI badges line */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-gray-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span>
                  <strong className="text-white font-bold">{summaryMetrics.total}</strong> Total Deals
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  <strong className="text-white font-bold">{summaryMetrics.inFunnel}</strong> In Funnel
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  <strong className="text-white font-bold">{summaryMetrics.highAudit}</strong> High Opportunity (&ge;70)
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  <strong className="text-white font-bold">{summaryMetrics.pitchReady}</strong> Pitch Ready
                </span>
              </div>
              {summaryMetrics.withMvpOrLoom > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    <strong className="text-white font-bold">{summaryMetrics.withMvpOrLoom}</strong> Demos &amp; Looms
                  </span>
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

            <Link href="/cms/project-hunter">
              <Button
                variant="outline"
                className="rounded-full gap-2 px-4 h-10 border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-primary/40 transition-all font-semibold text-xs"
              >
                <Crosshair className="w-4 h-4 text-primary" />
                <span>Source via Hunter</span>
              </Button>
            </Link>

            <Link href="/cms/project-tracker/form">
              <Button
                className="rounded-full gap-2 px-5 h-10 bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Prospect</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Outbound Conversion Funnel Tracker Widget */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Outbound Conversion Funnel
                <Badge
                  variant="outline"
                  className="bg-white/[0.04] border-white/[0.08] text-gray-400 font-mono text-[10px]"
                >
                  Click any stage to filter
                </Badge>
              </h3>
              <p className="text-[11px] text-gray-400">
                Track prospect progression through every milestone from discovery to signed contract
              </p>
            </div>
          </div>

          {statusFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="h-7 px-2.5 text-[11px] text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg"
            >
              <X className="w-3 h-3 mr-1" /> Clear Stage Filter
            </Button>
          )}
        </div>

        {/* Funnel Stage Clickable Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3.5">
          {FUNNEL_STAGES.map((stage) => {
            const count = summaryMetrics.stageCounts[stage.id] ?? 0;
            const isSelected = statusFilter === stage.id;
            const Icon = stage.icon;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setStatusFilter(isSelected ? "all" : stage.id)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden group select-none",
                  isSelected
                    ? `${stage.activeBg} border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/40`
                    : "bg-[#131726]/60 border-white/[0.06] hover:bg-[#131726] hover:border-white/[0.12]"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Icon className={cn("w-3.5 h-3.5 transition-transform group-hover:scale-110", stage.color)} />
                  <span
                    className={cn(
                      "font-mono font-bold text-xs px-2 py-0.5 rounded-md",
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-white/[0.06] text-slate-300 group-hover:bg-white/[0.1]"
                    )}
                  >
                    {count}
                  </span>
                </div>
                <span className="text-xs font-semibold text-white truncate w-full">{stage.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Switcher & Search / Filters Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-stretch lg:items-center">
        {/* Left: View Mode Tabs */}
        <Tabs
          value={viewMode}
          onValueChange={(val) => setViewMode(val as "kanban" | "table")}
          className="w-full lg:w-auto"
        >
          <TabsList className="grid grid-cols-2 w-full lg:w-auto p-1 bg-[#0C0E18] border border-white/[0.08] rounded-2xl h-auto">
            <TabsTrigger
              value="kanban"
              className="flex items-center gap-1.5 text-xs py-2 px-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
              {prospects.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.1] text-gray-300 font-mono">
                  {filteredProspects.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="flex items-center gap-1.5 text-xs py-2 px-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table View</span>
              {prospects.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.1] text-gray-300 font-mono">
                  {filteredProspects.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right: Filters & Search */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2.5 items-center flex-1 lg:max-w-2xl justify-end">
          {/* Search Box */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, country, contact..."
              className="pl-9 pr-8 bg-[#0C0E18] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-slate-500 focus:border-primary/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Industry Filter */}
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full sm:w-[160px] text-xs h-10 rounded-xl bg-[#0C0E18] border-white/[0.08] text-white focus:border-primary/50">
              <div className="flex items-center gap-1.5 truncate">
                <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
                <SelectValue placeholder="All Industries" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="home_living">Home &amp; Sanitary</SelectItem>
              <SelectItem value="outdoor_mobility">Outdoor &amp; Mobility</SelectItem>
              <SelectItem value="d2c_luxury">D2C Luxury</SelectItem>
              <SelectItem value="b2b_wholesale">B2B Wholesale</SelectItem>
              <SelectItem value="specialty_food">Specialty Food</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Stage Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] text-xs h-10 rounded-xl bg-[#0C0E18] border-white/[0.08] text-white focus:border-primary/50">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="sourced">Sourced</SelectItem>
              <SelectItem value="audited">Audited</SelectItem>
              <SelectItem value="building_mvp">Building MVP</SelectItem>
              <SelectItem value="pitch_ready">Pitch Ready</SelectItem>
              <SelectItem value="outreach_sent">Outreach Sent</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="won">Won Deals</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetFilters}
              className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-xl shrink-0"
              title="Reset all filters"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          prospects={filteredProspects}
          onOpenDetail={handleOpenDetail}
          onUpdateStatus={handleUpdateStatus}
          onDelete={(id) => setProspectToDelete(id)}
          onNewProspect={() => router.push("/cms/project-tracker/form")}
        />
      ) : (
        <ProspectTable
          prospects={filteredProspects}
          onOpenDetail={handleOpenDetail}
          onUpdateStatus={handleUpdateStatus}
          onDelete={(id) => setProspectToDelete(id)}
        />
      )}

      <AlertDialog
        open={!!prospectToDelete}
        onOpenChange={(open) => !open && setProspectToDelete(null)}
      >
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.1] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Prospect?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs">
              This action cannot be undone. All audit dossiers, MVP demo links, and custom pitch scripts for this prospect will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/[0.1] text-gray-300 hover:bg-white/[0.04]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
