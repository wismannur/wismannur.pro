"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  CalendarCog,
  Check,
  Eye,
  Filter,
  GraduationCap,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { formatResumePeriod } from "@/lib/resume";
import { formatDate } from "@/lib/utils";
import { resumeService, type ResumeEntry, type ResumeKind } from "@/services";

// Number of entries to display per page (in-memory pagination)
const ENTRIES_PER_PAGE = 10;

export default function CmsResumePage() {
  const router = useRouter();
  const [activeKind, setActiveKind] = useState<ResumeKind>("experience");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["resumeEntries"],
    queryFn: () => resumeService.getAllForCms(),
  });

  // Reset to first page when the tab, search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeKind, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const list = data ?? [];
    const expCount = list.filter((e) => e.kind === "experience").length;
    const eduCount = list.filter((e) => e.kind === "education").length;
    const published = list.filter((e) => e.isPublished).length;
    const hidden = list.filter((e) => !e.isPublished).length;
    return { expCount, eduCount, published, hidden };
  }, [data]);

  // Apply kind tab + status filter + search filtering in memory
  const matchedEntries = useMemo(() => {
    let list = (data ?? []).filter((entry) => entry.kind === activeKind);

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((entry) => Boolean(entry.isPublished) === isPublished);
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(
        (entry) =>
          entry.title.toLowerCase().includes(term) ||
          entry.organization.toLowerCase().includes(term) ||
          (entry.location ?? "").toLowerCase().includes(term) ||
          entry.description.toLowerCase().includes(term)
      );
    }

    return list;
  }, [data, activeKind, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
  const filteredEntries = matchedEntries.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
  const hasMore = pageStart + ENTRIES_PER_PAGE < matchedEntries.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handlePublishToggle = async (entryId: string, currentStatus: boolean) => {
    try {
      await resumeService.update(entryId, { isPublished: !currentStatus });

      refetch();
      toast.success(currentStatus ? "Entry hidden from /about" : "Entry published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update entry status");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await resumeService.delete(entryId);

      refetch();
      setEntryToDelete(null);
      toast.success("Entry deleted successfully");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<ResumeEntry>[] = [
    {
      header: activeKind === "experience" ? "Role & Organization" : "Degree & Institution",
      cell: (entry) => (
        <div className="flex flex-col gap-1 py-1">
          <div className="font-semibold text-slate-100">{entry.title}</div>
          <div className="text-xs text-slate-400">{entry.organization}</div>
          {entry.location && (
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-indigo-400 shrink-0" />
              {entry.location}
            </div>
          )}
        </div>
      ),
      className: "w-[320px]",
    },
    {
      header: "Period",
      cell: (entry) => (
        <div className="flex flex-col gap-1 text-xs">
          <span className="text-slate-300 font-medium">{formatResumePeriod(entry)}</span>
          {entry.isCurrent && (
            <Badge className="w-fit bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] px-1.5 py-0">
              Ongoing
            </Badge>
          )}
        </div>
      ),
      className: "hidden md:table-cell w-[160px]",
    },
    {
      header: "Status",
      cell: (entry) => (
        <div className="flex flex-col items-start gap-1">
          <Badge
            className={
              entry.isPublished
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }
          >
            {entry.isPublished ? "Published" : "Hidden"}
          </Badge>
          {entry.sortOrder !== 0 && (
            <span className="text-[10px] text-slate-500">Order: {entry.sortOrder}</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell w-[110px]",
    },
    {
      header: "Updated",
      cell: (entry) => (
        <div className="flex items-center text-slate-400 text-xs">
          <CalendarCog className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
          {formatDate(entry.updatedAt)}
        </div>
      ),
      className: "hidden lg:table-cell w-[140px]",
    },
    {
      header: "Actions",
      cell: (entry) => (
        <div className="flex justify-end">
          <AlertDialog
            open={entryToDelete === entry.id}
            onOpenChange={(open) => !open && setEntryToDelete(null)}
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
                  onClick={() => router.push("/about")}
                  className="hover:bg-white/[0.06] cursor-pointer"
                >
                  <Eye className="h-4 w-4 mr-2 text-indigo-400" />
                  View on About
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/cms/resume/form/${entry.id}`)}
                  className="hover:bg-white/[0.06] cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2 text-amber-400" />
                  Edit Entry
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(entry.id, entry.isPublished)}
                  className={entry.isPublished ? "text-amber-400 hover:bg-amber-500/10 cursor-pointer" : "text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"}
                >
                  {entry.isPublished ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => setEntryToDelete(entry.id)}
                  className="text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Entry
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-100">Delete Resume Entry?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete &quot;{entry.title}&quot; at{" "}
                  {entry.organization} from your about page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                  onClick={() => handleDeleteEntry(entry.id)}
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
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Resume & Credentials</h1>
          <p className="text-sm text-slate-400">
            Manage work experience and education shown on your public profile
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-semibold"
          >
            <Link href={`/cms/resume/form?kind=${activeKind}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400">Experience Entries</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{stats.expCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400">Education Entries</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{stats.eduCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400">Published</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.published}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400">Hidden / Draft</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats.hidden}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeKind} onValueChange={(value) => setActiveKind(value as ResumeKind)}>
        <TabsList className="bg-[#131726]/80 border border-white/[0.08] p-1 rounded-xl">
          <TabsTrigger
            value="experience"
            className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Experience ({stats.expCount})
          </TabsTrigger>
          <TabsTrigger
            value="education"
            className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
          >
            <GraduationCap className="mr-2 h-4 w-4" />
            Education ({stats.eduCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full md:w-[280px] bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
          />
        </form>

        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <SelectItem value="all">All Entries</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Hidden</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="bg-[#131726]/80 border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredEntries}
          isLoading={isLoading}
          keyField="id"
          emptyState={{
            icon:
              activeKind === "experience" ? (
                <Briefcase className="h-8 w-8 mb-2 text-slate-500" />
              ) : (
                <GraduationCap className="h-8 w-8 mb-2 text-slate-500" />
              ),
            title: `No ${activeKind} entries found`,
            description: searchQuery
              ? "Try adjusting your search query"
              : filterStatus && filterStatus !== "all"
                ? `No ${filterStatus} entries found`
                : `Get started by adding your first ${activeKind} entry`,
          }}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: handlePageChange,
          }}
          rowClassName={(entry) => (!entry.isPublished ? "bg-white/[0.01]" : "hover:bg-white/[0.02] transition-colors")}
        />
      </div>
    </div>
  );
}
