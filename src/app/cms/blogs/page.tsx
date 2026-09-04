"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarArrowUp,
  CalendarCog,
  CalendarPlus,
  Check,
  Eye,
  FilePlus,
  FileText,
  Filter,
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
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
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
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { type Blog, blogService } from "@/services";

// Number of blogs to show per page (in-memory pagination)
const BLOGS_PER_PAGE = 10;

export default function CmsBlogs() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch ALL blogs (incl. drafts), newest-first, from the service.
  const {
    data: allBlogs = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => blogService.getAllForCms(),
    enabled: !!user,
  });

  // Apply status filter + search entirely in memory.
  const filteredBlogs = useMemo(() => {
    let list = allBlogs;

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((blog) => blog.isPublished === isPublished);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (blog) =>
          blog.title.toLowerCase().includes(q) ||
          blog.summary.toLowerCase().includes(q) ||
          (blog.tags && blog.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [allBlogs, filterStatus, searchQuery]);

  // In-memory pagination: slice the filtered array by page.
  const totalFiltered = filteredBlogs.length;
  const hasMore = currentPage * BLOGS_PER_PAGE < totalFiltered;
  const pagedBlogs = useMemo(() => {
    const start = (currentPage - 1) * BLOGS_PER_PAGE;
    return filteredBlogs.slice(start, start + BLOGS_PER_PAGE);
  }, [filteredBlogs, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handlePublishToggle = async (blogId: string, currentStatus: boolean) => {
    try {
      const next = !currentStatus;
      await blogService.update(blogId, {
        isPublished: next,
        publishedDate: next ? new Date() : null,
      });

      refetch();
      toast.success(currentStatus ? "Blog unpublished" : "Blog published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update blog status");
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    try {
      await blogService.delete(blogId);
      refetch();
      setBlogToDelete(null);
      toast.success("Blog deleted successfully");
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<Blog>[] = [
    {
      header: "Article",
      cell: (blog) => (
        <div className="flex flex-col py-1">
          <div className="font-bold text-sm text-slate-100">{blog.title}</div>
          <div className="text-xs text-slate-400 truncate max-w-lg mt-0.5">{blog.summary}</div>
          <div className="text-xs text-slate-400 mt-1.5 flex flex-wrap gap-1">
            {blog.tags &&
              blog.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium"
                >
                  #{tag}
                </span>
              ))}
            {blog.tags && blog.tags.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.08] text-[10px]">
                +{blog.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      ),
      className: "min-w-[320px]",
    },
    {
      header: "Status",
      cell: (blog) =>
        blog.isPublished ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Draft
          </span>
        ),
      className: "hidden md:table-cell min-w-[120px]",
    },
    {
      header: "Timeline",
      cell: (blog) => (
        <div className="flex flex-col gap-y-1 text-xs text-slate-400">
          {blog.publishedDate && (
            <div className="flex items-center text-slate-200">
              <CalendarArrowUp className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0" />
              <span>Pub: {formatDate(blog.publishedDate)}</span>
            </div>
          )}
          <div className="flex items-center text-slate-400">
            <CalendarCog className="w-3.5 h-3.5 mr-1.5 text-indigo-400 shrink-0" />
            <span>Upd: {formatDate(blog.updatedAt)}</span>
          </div>
        </div>
      ),
      className: "hidden md:table-cell min-w-[170px]",
    },
    {
      header: "Views",
      cell: (blog) => (
        <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="tabular-nums font-mono">{blog.views || 0}</span>
        </div>
      ),
      className: "hidden md:table-cell min-w-[90px]",
    },
    {
      header: "Actions",
      cell: (blog) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <AlertDialog
            open={blogToDelete === blog.id}
            onOpenChange={(open) => !open && setBlogToDelete(null)}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-[#0C0E18] border-white/[0.08] text-slate-200">
                <DropdownMenuItem onClick={() => router.push(`/blog/${blog.slug}`)} className="focus:bg-indigo-500/10 focus:text-indigo-300">
                  <Eye className="h-4 w-4 mr-2 text-indigo-400" />
                  View Public
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/cms/blogs/form/${blog.id}`)} className="focus:bg-indigo-500/10 focus:text-indigo-300">
                  <Pencil className="h-4 w-4 mr-2 text-indigo-400" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(blog.id, blog.isPublished)}
                  className={blog.isPublished ? "text-amber-400 focus:bg-amber-500/10" : "text-emerald-400 focus:bg-emerald-500/10"}
                >
                  {blog.isPublished ? (
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
                  onClick={() => setBlogToDelete(blog.id)}
                  className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2 text-rose-400" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white text-lg font-bold">Delete Blog Post?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400 text-xs">
                  This action cannot be undone. The article will be permanently removed from your site and CMS.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteBlog(blog.id)}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                >
                  Delete Post
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
      className: "w-[80px]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <FileText className="w-5 h-5" />
            </span>
            Blog Posts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Write, publish, and manage engineering articles, tutorials, and thought leadership.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-10 px-3 gap-1.5 rounded-xl border-white/[0.08] bg-[#0C0E18]/80 text-slate-300 hover:text-white hover:bg-white/[0.06]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-indigo-400 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button asChild className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <Link href="/cms/blogs/form">
              <FilePlus className="h-4 w-4" />
              New Blog Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by title, summary, tag..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-200 text-xs focus:ring-indigo-500/30">
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <SelectValue placeholder="All Posts" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <SelectItem value="all" className="text-xs focus:bg-indigo-500/10 focus:text-indigo-300">All Posts</SelectItem>
              <SelectItem value="published" className="text-xs focus:bg-emerald-500/10 focus:text-emerald-300">Published</SelectItem>
              <SelectItem value="draft" className="text-xs focus:bg-amber-500/10 focus:text-amber-300">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={pagedBlogs}
          isLoading={isLoading}
          keyField="id"
          rowClassName={() => "transition-colors hover:bg-white/[0.03] border-b border-white/[0.04]"}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: handlePageChange,
          }}
          emptyState={{
            icon: <FileText className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No blog posts found",
            description: searchQuery
              ? "Try adjusting your search query"
              : filterStatus && filterStatus !== "all"
                ? `No ${filterStatus} blog posts found`
                : "Create your first blog post using the button above",
          }}
        />
      </div>
    </div>
  );
}
