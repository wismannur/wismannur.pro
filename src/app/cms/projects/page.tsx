"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarArrowUp,
  CalendarCog,
  Check,
  ExternalLink,
  Eye,
  Filter,
  Folder,
  FolderPlus,
  Github,
  Globe,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
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
import Chip from "@/components/ui/chip";
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
import { projectService, type Project } from "@/services";

// Number of projects to display per page (in-memory pagination)
const PROJECTS_PER_PAGE = 10;

export default function CmsProjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getAllForCms(),
  });

  // Reset to first page when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const list = data ?? [];
    const total = list.length;
    const published = list.filter((p) => p.isPublished).length;
    const featured = list.filter((p) => p.isFeatured).length;
    const totalViews = list.reduce((acc, p) => acc + (p.views || 0), 0);
    return { total, published, featured, totalViews };
  }, [data]);

  // Apply status filter + search filtering in memory
  const matchedProjects = useMemo(() => {
    let list = data ?? [];

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((project) => Boolean(project.isPublished) === isPublished);
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(
        (project) =>
          project.title.toLowerCase().includes(term) ||
          project.summary.toLowerCase().includes(term) ||
          (project.technologies &&
            project.technologies.some((tech) => tech.toLowerCase().includes(term)))
      );
    }

    return list;
  }, [data, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * PROJECTS_PER_PAGE;
  const filteredProjects = matchedProjects.slice(pageStart, pageStart + PROJECTS_PER_PAGE);
  const hasMore = pageStart + PROJECTS_PER_PAGE < matchedProjects.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handlePublishToggle = async (projectId: string, currentStatus: boolean) => {
    try {
      const next = !currentStatus;
      await projectService.update(projectId, {
        isPublished: next,
        publishedDate: next ? new Date() : null,
      });

      refetch();
      toast.success(currentStatus ? "Project unpublished" : "Project published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update project status");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectService.delete(projectId);

      refetch();
      setProjectToDelete(null);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<Project>[] = [
    {
      header: "Project Details",
      cell: (project) => (
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100">{project.title}</span>
            {project.isFeatured && (
              <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] px-1.5 py-0">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          <div className="text-xs text-slate-400 line-clamp-1 max-w-md">{project.summary}</div>
          <div className="text-xs text-slate-500 flex flex-wrap gap-1 mt-0.5">
            {project.technologies &&
              project.technologies.slice(0, 3).map((tech) => (
                <Chip key={tech} className="text-[10px] py-0 px-2 bg-white/[0.04] text-slate-300 border-white/[0.06]">
                  {tech}
                </Chip>
              ))}
            {project.technologies && project.technologies.length > 3 && (
              <Chip className="text-[10px] py-0 px-1.5 bg-white/[0.04] text-slate-400 border-white/[0.06]">
                +{project.technologies.length - 3}
              </Chip>
            )}
          </div>
        </div>
      ),
      className: "w-[350px]",
    },
    {
      header: "Status",
      cell: (project) => (
        <div className="flex flex-col items-start gap-1">
          <Badge
            className={
              project.isPublished
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }
          >
            {project.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
      ),
      className: "hidden md:table-cell w-[110px]",
    },
    {
      header: "Timestamps",
      cell: (project) => (
        <div className="flex flex-col gap-y-1 text-xs text-slate-400">
          <div className="flex items-center">
            <CalendarArrowUp className="w-3.5 h-3.5 mr-1.5 text-indigo-400 shrink-0" />
            <span>Pub: {formatDate(project.publishedDate)}</span>
          </div>
          <div className="flex items-center text-slate-500">
            <CalendarCog className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
            <span>Upd: {formatDate(project.updatedAt)}</span>
          </div>
        </div>
      ),
      className: "hidden md:table-cell w-[160px]",
    },
    {
      header: "Links",
      cell: (project) => (
        <div className="flex space-x-2">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/[0.03] text-slate-400 hover:text-indigo-400 hover:bg-white/[0.08] transition-all border border-white/[0.06]"
              title="View Demo"
            >
              <Globe className="h-3.5 w-3.5" />
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/[0.03] text-slate-400 hover:text-indigo-400 hover:bg-white/[0.08] transition-all border border-white/[0.06]"
              title="View Repository"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ),
      className: "hidden md:table-cell w-[90px]",
    },
    {
      header: "Stats",
      cell: (project) => (
        <div className="text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span>{project.views || 0}</span>
          </div>
        </div>
      ),
      className: "hidden md:table-cell w-[80px]",
    },
    {
      header: "Actions",
      cell: (project) => (
        <div className="flex justify-end">
          <AlertDialog
            open={projectToDelete === project.id}
            onOpenChange={(open) => !open && setProjectToDelete(null)}
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
                  onClick={() => router.push(`/projects/${project.slug}`)}
                  className="hover:bg-white/[0.06] cursor-pointer"
                >
                  <Eye className="h-4 w-4 mr-2 text-indigo-400" />
                  View Live
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/cms/projects/form/${project.id}`)}
                  className="hover:bg-white/[0.06] cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2 text-amber-400" />
                  Edit Project
                </DropdownMenuItem>
                {project.demoUrl && (
                  <DropdownMenuItem asChild className="hover:bg-white/[0.06] cursor-pointer">
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2 text-emerald-400" />
                      Open Demo
                    </a>
                  </DropdownMenuItem>
                )}
                {project.repoUrl && (
                  <DropdownMenuItem asChild className="hover:bg-white/[0.06] cursor-pointer">
                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2 text-violet-400" />
                      View Code
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(project.id, project.isPublished)}
                  className={project.isPublished ? "text-amber-400 hover:bg-amber-500/10 cursor-pointer" : "text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"}
                >
                  {project.isPublished ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Unpublish
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
                  onClick={() => setProjectToDelete(project.id)}
                  className="text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-100">Delete Project?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete the project &quot;
                  {project.title}&quot; and remove it from your portfolio.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                  onClick={() => handleDeleteProject(project.id)}
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Projects</h1>
          <p className="text-sm text-slate-400">Manage and showcase your engineering portfolio</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-semibold"
          >
            <Link href="/cms/projects/form">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400">Total Projects</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{stats.total}</div>
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
            <div className="text-xs font-medium text-slate-400">Featured</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">{stats.featured}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400">Total Views</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{stats.totalViews}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search projects..."
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
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
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
          data={filteredProjects}
          isLoading={isLoading}
          keyField="id"
          emptyState={{
            icon: <Folder className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No projects found",
            description: searchQuery
              ? "Try adjusting your search query"
              : filterStatus && filterStatus !== "all"
                ? `No ${filterStatus} projects found`
                : "Get started by creating your first project",
          }}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: handlePageChange,
          }}
          rowClassName={(project) =>
            !project.isPublished ? "bg-white/[0.01]" : "hover:bg-white/[0.02] transition-colors"
          }
        />
      </div>
    </div>
  );
}
