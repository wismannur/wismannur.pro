"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Check,
  Eye,
  Filter,
  ListOrdered,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getContentIcon } from "@/lib/icon-registry";
import { processStepsService, type ProcessScope, type ProcessStep } from "@/services";

// Number of entries to display per page (in-memory pagination)
const ENTRIES_PER_PAGE = 10;

export default function CmsProcessStepsPage() {
  const router = useRouter();
  const [activeScope, setActiveScope] = useState<ProcessScope>("services");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cmsProcessSteps"],
    queryFn: () => processStepsService.getAllForCms(),
  });

  const allSteps = useMemo(() => data ?? [], [data]);

  // Metric counts
  const stats = useMemo(() => {
    const total = allSteps.length;
    const servicesCount = allSteps.filter((s) => s.scope === "services").length;
    const hireMeCount = allSteps.filter((s) => s.scope === "hire-me").length;
    const publishedCount = allSteps.filter((s) => s.isPublished).length;
    return { total, servicesCount, hireMeCount, publishedCount };
  }, [allSteps]);

  // Apply scope tab + status filter + search filtering in memory
  const matchedSteps = useMemo(() => {
    let list = allSteps.filter((step) => step.scope === activeScope);

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((step) => Boolean(step.isPublished) === isPublished);
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(
        (step) =>
          step.title.toLowerCase().includes(term) || step.description.toLowerCase().includes(term)
      );
    }

    return list;
  }, [allSteps, activeScope, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
  const filteredSteps = matchedSteps.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
  const hasMore = pageStart + ENTRIES_PER_PAGE < matchedSteps.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleScopeChange = (scope: ProcessScope) => {
    setActiveScope(scope);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handlePublishToggle = async (stepId: string, currentStatus: boolean) => {
    try {
      await processStepsService.update(stepId, { isPublished: !currentStatus });

      refetch();
      toast.success(currentStatus ? "Step hidden from the public page" : "Step published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update step status");
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      await processStepsService.delete(stepId);

      refetch();
      setStepToDelete(null);
      toast.success("Step deleted successfully");
    } catch (error) {
      console.error("Error deleting step:", error);
      toast.error("Failed to delete step");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<ProcessStep>[] = [
    {
      header: "Step Details",
      cell: (step) => (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100">{step.title}</span>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono px-1.5 py-0 bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            >
              Order: {step.sortOrder}
            </Badge>
          </div>
          <div className="text-xs text-slate-400 line-clamp-2 max-w-[420px]">
            {step.description}
          </div>
        </div>
      ),
      className: "w-[440px]",
    },
    {
      header: "Icon",
      cell: (step) => {
        if (!step.icon) {
          return <span className="text-xs text-slate-500">—</span>;
        }
        const Icon = getContentIcon(step.icon);
        return (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="p-1.5 rounded-lg bg-[#131726] border border-white/[0.08] text-indigo-400">
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-mono text-slate-400">{step.icon}</span>
          </div>
        );
      },
      className: "hidden md:table-cell",
    },
    {
      header: "Status",
      cell: (step) => (
        <Badge
          variant="outline"
          className={
            step.isPublished
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }
        >
          {step.isPublished ? "Published" : "Hidden"}
        </Badge>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      cell: (step) => (
        <div className="flex justify-end">
          <AlertDialog
            open={stepToDelete === step.id}
            onOpenChange={(open) => !open && setStepToDelete(null)}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] rounded-lg"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200"
              >
                <DropdownMenuItem
                  onClick={() => router.push(step.scope === "hire-me" ? "/hire-me" : "/services")}
                  className="cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                >
                  <Eye className="h-4 w-4 mr-2 text-indigo-400" />
                  {step.scope === "hire-me" ? "View on Hire Me" : "View on Services"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/cms/process-steps/form/${step.id}`)}
                  className="cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                >
                  <Pencil className="h-4 w-4 mr-2 text-amber-400" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(step.id, step.isPublished)}
                  className="cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                >
                  {step.isPublished ? (
                    <>
                      <X className="h-4 w-4 mr-2 text-rose-400" />
                      Hide from Public
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2 text-emerald-400" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => setStepToDelete(step.id)}
                  className="text-rose-400 cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Step
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="bg-[#0C0E18] border border-white/[0.08] text-slate-100">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete the &ldquo;{step.title}&rdquo; step
                  from /{step.scope === "hire-me" ? "hire-me" : "services"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-slate-300 hover:bg-white/[0.1]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 hover:bg-rose-700 text-white border-0"
                  onClick={() => handleDeleteStep(step.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
      className: "w-[50px]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Workflow className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Process Steps
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Manage the how-it-works progression steps rendered on /services and /hire-me
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-medium"
          >
            <Link href={`/cms/process-steps/form?scope=${activeScope}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Step
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-lg rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Workflow className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Steps</p>
              <p className="text-xl font-bold text-slate-100">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-lg rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Workflow className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Services Steps</p>
              <p className="text-xl font-bold text-indigo-400">{stats.servicesCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-lg rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Hire Me Steps</p>
              <p className="text-xl font-bold text-violet-400">{stats.hireMeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-lg rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Published</p>
              <p className="text-xl font-bold text-emerald-400">{stats.publishedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scope Switcher Tabs */}
      <Tabs value={activeScope} onValueChange={(value) => handleScopeChange(value as ProcessScope)}>
        <TabsList className="bg-[#0C0E18]/80 border border-white/[0.08] p-1 rounded-xl">
          <TabsTrigger
            value="services"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-4 text-xs font-medium text-slate-400"
          >
            <Workflow className="mr-2 h-3.5 w-3.5" />
            Services (/services)
          </TabsTrigger>
          <TabsTrigger
            value="hire-me"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-4 text-xs font-medium text-slate-400"
          >
            <Briefcase className="mr-2 h-3.5 w-3.5" />
            Hire Me (/hire-me)
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search steps..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 w-full md:w-[280px] bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
          />
        </form>

        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-indigo-400" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200">
              <SelectItem value="all">All Steps</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Hidden</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="bg-[#131726]/80 border-white/[0.08] text-slate-300 hover:text-slate-100 hover:bg-white/[0.06] rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={filteredSteps}
          isLoading={isLoading}
          keyField="id"
          emptyState={{
            icon: <ListOrdered className="h-8 w-8 mb-2 text-slate-500" />,
            title: `No ${activeScope === "hire-me" ? "Hire Me" : "Services"} steps found`,
            description: searchQuery
              ? "Try adjusting your search query"
              : filterStatus && filterStatus !== "all"
                ? `No ${filterStatus} steps found`
                : "Get started by adding your first process step",
          }}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: handlePageChange,
          }}
          rowClassName={(step) => (!step.isPublished ? "opacity-60 bg-white/[0.01]" : "")}
        />
      </div>
    </div>
  );
}
