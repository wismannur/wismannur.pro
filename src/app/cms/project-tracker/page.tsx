"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Crosshair,
  Kanban,
  List,
  Plus,
  RefreshCw,
  Search,
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
import { projectFinderService } from "@/services/project-finder";
import type {
  ProjectProspect,
  ProjectProspectStatus,
} from "@/services/project-finder/types";
import { KanbanBoard } from "./components/kanban-board";
import { ProspectTable } from "./components/prospect-table";
import { ProspectDetailDialog } from "./components/prospect-detail-dialog";
import { NewProspectDialog } from "./components/new-prospect-dialog";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";

export default function ProjectTrackerPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedProspect, setSelectedProspect] = useState<ProjectProspect | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
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
    setSelectedProspect(prospect);
    setIsDetailOpen(true);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Kanban className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Project Tracker
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                {prospects.length} Active Deals
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
            Pipeline CRM for European & US e-commerce modernization. Track stages from live audit to Nuxt 4 MVP demo, Loom walkthrough, and closed contracts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/cms/project-hunter">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs h-9 bg-[#0C0E18] border-white/[0.1] hover:bg-white/[0.06] text-gray-300"
            >
              <Crosshair className="w-4 h-4 text-primary" />
              Source via Hunter
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsNewDialogOpen(true)}
            className="gap-2 text-xs h-9 bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Prospect
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="h-9 w-9 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filter and View Switcher Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, countries, contacts..."
              className="pl-8 bg-[#0C0E18] border-white/[0.08] text-xs h-9 text-white focus:border-primary"
            />
          </div>

          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="h-9 w-[150px] text-xs bg-[#0C0E18] border-white/[0.08] text-white">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="home_living">Home & Sanitary</SelectItem>
              <SelectItem value="outdoor_mobility">Outdoor & Mobility</SelectItem>
              <SelectItem value="d2c_luxury">D2C Luxury</SelectItem>
              <SelectItem value="b2b_wholesale">B2B Wholesale</SelectItem>
              <SelectItem value="specialty_food">Specialty Food</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px] text-xs bg-[#0C0E18] border-white/[0.08] text-white">
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
              <SelectItem value="won">Won</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs
          value={viewMode}
          onValueChange={(val) => setViewMode(val as "kanban" | "table")}
          className="w-auto"
        >
          <TabsList className="bg-[#0C0E18] border border-white/[0.08] p-1 rounded-xl h-auto">
            <TabsTrigger
              value="kanban"
              className="text-xs py-1.5 px-3 data-[state=active]:bg-primary data-[state=active]:text-white font-medium flex items-center gap-1.5"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="text-xs py-1.5 px-3 data-[state=active]:bg-primary data-[state=active]:text-white font-medium flex items-center gap-1.5"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main View Area */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          prospects={filteredProspects}
          onOpenDetail={handleOpenDetail}
          onUpdateStatus={handleUpdateStatus}
          onDelete={(id) => setProspectToDelete(id)}
          onNewProspect={() => setIsNewDialogOpen(true)}
        />
      ) : (
        <ProspectTable
          prospects={filteredProspects}
          onOpenDetail={handleOpenDetail}
          onUpdateStatus={handleUpdateStatus}
          onDelete={(id) => setProspectToDelete(id)}
        />
      )}

      {/* Modals */}
      <ProspectDetailDialog
        prospect={selectedProspect}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onProspectUpdated={(updated) => {
          setSelectedProspect(updated);
          refetch();
        }}
      />

      <NewProspectDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onProspectCreated={() => refetch()}
      />

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
