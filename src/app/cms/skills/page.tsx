"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CalendarCog,
  Check,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CmsPageHeader } from "@/components/cms/cms-page-header";
import { CmsMetricCards } from "@/components/cms/cms-metric-cards";

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
import { formatDate } from "@/lib/utils";
import { skillsService, type Skill } from "@/services";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";

// Number of entries to display per page (in-memory pagination)
const ENTRIES_PER_PAGE = 10;

export default function CmsSkillsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cmsSkills"],
    queryFn: () => skillsService.getAllForCms(),
  });

  const [prevFilters, setPrevFilters] = useState({ searchQuery, filterStatus });
  if (prevFilters.searchQuery !== searchQuery || prevFilters.filterStatus !== filterStatus) {
    setPrevFilters({ searchQuery, filterStatus });
    setCurrentPage(1);
  }

  const stats = useMemo(() => {
    const list = data ?? [];
    const total = list.length;
    const published = list.filter((s) => s.isPublished).length;
    const hidden = list.filter((s) => !s.isPublished).length;
    return { total, published, hidden };
  }, [data]);

  // Apply status filter + search filtering in memory
  const matchedSkills = useMemo(() => {
    let list = data ?? [];

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((skill) => Boolean(skill.isPublished) === isPublished);
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter((skill) => skill.name.toLowerCase().includes(term));
    }

    return list;
  }, [data, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
  const filteredSkills = matchedSkills.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
  const hasMore = pageStart + ENTRIES_PER_PAGE < matchedSkills.length;

  useRegisterCmsPageContext({
    pageTitle: "Skills Matrix",
    summary: `Managing ${stats.total} skills (${stats.published} published, ${stats.hidden} hidden). Page ${currentPage}.`,
    activeItems: filteredSkills.map((s) => ({
      id: s.id,
      name: s.name,
      sortOrder: s.sortOrder,
      isPublished: s.isPublished,
    })),
    filters: {
      searchQuery,
      filterStatus,
      currentPage,
    },
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handlePublishToggle = async (skillId: string, currentStatus: boolean) => {
    try {
      await skillsService.update(skillId, { isPublished: !currentStatus });

      refetch();
      toast.success(currentStatus ? "Skill hidden from /about" : "Skill published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update skill status");
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      await skillsService.delete(skillId);

      refetch();
      setSkillToDelete(null);
      toast.success("Skill deleted successfully");
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error("Failed to delete skill");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<Skill>[] = [
    {
      header: "Skill Name",
      cell: (skill) => (
        <div className="flex flex-col gap-0.5 py-1">
          <div className="font-semibold text-slate-100">{skill.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Order Weight: {skill.sortOrder}
          </div>
        </div>
      ),
      className: "w-[320px]",
    },
    {
      header: "Status",
      cell: (skill) => (
        <Badge
          className={
            skill.isPublished
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }
        >
          {skill.isPublished ? "Published" : "Hidden"}
        </Badge>
      ),
      className: "hidden md:table-cell w-[120px]",
    },
    {
      header: "Updated",
      cell: (skill) => (
        <div className="flex items-center text-slate-400 text-xs">
          <CalendarCog className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
          {formatDate(skill.updatedAt)}
        </div>
      ),
      className: "hidden lg:table-cell w-[140px]",
    },
    {
      header: "Actions",
      cell: (skill) => (
        <div className="flex justify-end">
          <AlertDialog
            open={skillToDelete === skill.id}
            onOpenChange={(open) => !open && setSkillToDelete(null)}
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
                  onClick={() => router.push(`/cms/skills/form/${skill.id}`)}
                  className="hover:bg-white/[0.06] cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2 text-amber-400" />
                  Edit Skill
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(skill.id, skill.isPublished)}
                  className={
                    skill.isPublished
                      ? "text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                      : "text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                  }
                >
                  {skill.isPublished ? (
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
                  onClick={() => setSkillToDelete(skill.id)}
                  className="text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Skill
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-100">Delete Skill?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete &quot;{skill.name}
                  &quot; from your skills catalog.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                  onClick={() => handleDeleteSkill(skill.id)}
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
      {/* Unified Page Header */}
      <CmsPageHeader
        icon={Award}
        title="Skills Catalog"
        description="Manage tech stack badges, proficiencies, and categories displayed on your profile."
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
        actions={
          <Button
            asChild
            className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
          >
            <Link href="/cms/skills/form">
              <Plus className="h-4 w-4" />
              New Skill
            </Link>
          </Button>
        }
      />

      {/* Interactive Metric Cards */}
      <CmsMetricCards
        gridCols="grid-cols-1 sm:grid-cols-3"
        metrics={[
          {
            id: "all",
            label: "Total Skills",
            value: stats.total,
            icon: Award,
            color: "default",
            active: filterStatus === "all" || !filterStatus,
            onClick: () => handleFilterChange("all"),
          },
          {
            id: "published",
            label: "Published",
            value: stats.published,
            icon: Check,
            color: "emerald",
            active: filterStatus === "published",
            onClick: () => handleFilterChange("published"),
          },
          {
            id: "draft",
            label: "Hidden",
            value: stats.hidden,
            icon: Eye,
            color: "amber",
            active: filterStatus === "draft",
            onClick: () => handleFilterChange("draft"),
          },
        ]}
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search skills by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/30"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-200 text-xs focus:ring-indigo-500/30">
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <SelectValue placeholder="All Skills" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <SelectItem value="all" className="text-xs focus:bg-indigo-500/10 focus:text-indigo-300">All Skills</SelectItem>
              <SelectItem value="published" className="text-xs focus:bg-emerald-500/10 focus:text-emerald-300">Published</SelectItem>
              <SelectItem value="draft" className="text-xs focus:bg-amber-500/10 focus:text-amber-300">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredSkills}
          isLoading={isLoading}
          keyField="id"
          emptyState={{
            icon: <Wrench className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No skills found",
            description: searchQuery
              ? "Try adjusting your search query"
              : filterStatus && filterStatus !== "all"
                ? `No ${filterStatus} skills found`
                : "Get started by adding your first skill",
          }}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: handlePageChange,
          }}
          rowClassName={(skill) =>
            !skill.isPublished ? "bg-white/[0.01]" : "hover:bg-white/[0.02] transition-colors"
          }
        />
      </div>
    </div>
  );
}
