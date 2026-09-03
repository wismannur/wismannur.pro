"use client";

import type React from "react";

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
import Chip from "@/components/ui/chip";
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
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Number of blogs to show per page (in-memory pagination)
const BLOGS_PER_PAGE = 10;

const CmsBlogs = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch ALL blogs (incl. drafts), newest-first, from the mock service.
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

  // Reset to first page when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is applied in-memory via useMemo
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
      header: "Title",
      cell: (blog) => (
        <div className="flex flex-col">
          <div className="font-medium">{blog.title}</div>
          <div className="text-sm text-muted-foreground truncate max-w-lg">{blog.summary}</div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
            {blog.tags && blog.tags.slice(0, 3).map((tag) => <Chip key={tag}>{tag}</Chip>)}
            {blog.tags && blog.tags.length > 3 && <Chip>+{blog.tags.length - 3}</Chip>}
          </div>
        </div>
      ),
      className: "w-[350px]",
    },
    {
      header: "Status",
      cell: (blog) => (
        <Badge variant={blog.isPublished ? "default" : "secondary"}>
          {blog.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
      className: "hidden w-8 md:table-cell",
    },
    {
      header: "Date",
      cell: (blog) => (
        <div className="flex flex-col gap-y-1">
          <div className="flex items-center text-muted-foreground text-sm">
            <CalendarArrowUp className="w-4 h-4 mr-1.5" />
            {formatDate(blog.publishedDate)}
          </div>
          <div className="flex items-center text-muted-foreground text-sm">
            <CalendarCog className="w-4 h-4 mr-1.5" />
            {formatDate(blog.updatedAt)}
          </div>
          <div className="flex items-center text-muted-foreground text-sm">
            <CalendarPlus className="w-4 h-4 mr-1.5" />
            {formatDate(blog.createdAt)}
          </div>
        </div>
      ),
      className: "hidden !w-[170px] md:table-cell",
    },
    {
      header: "Stats",
      cell: (blog) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>{blog.views || 0} views</span>
          </div>
        </div>
      ),
      className: "hidden w-[130px] md:table-cell",
    },
    {
      header: "Actions",
      cell: (blog) => (
        <div className="flex justify-end">
          <AlertDialog
            open={blogToDelete === blog.id}
            onOpenChange={(open) => !open && setBlogToDelete(null)}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/blog/${blog.slug}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/cms/blogs/form/${blog.id}`)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(blog.id, blog.isPublished)}
                  className={blog.isPublished ? "text-destructive" : ""}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setBlogToDelete(blog.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the blog post "
                  {blog.title}" and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handleDeleteBlog(blog.id)}
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
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">Manage and publish your blog content</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button asChild>
            <Link href="/cms/blogs/form">
              <FilePlus className="mr-2 h-4 w-4" />
              New Blog Post
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full md:w-[250px] rounded-lg"
          />
        </form>

        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pagedBlogs}
        isLoading={isLoading}
        keyField="id"
        emptyState={{
          icon: <FileText className="h-8 w-8 mb-2" />,
          title: "No blog posts found",
          description: searchQuery
            ? "Try adjusting your search query"
            : filterStatus && filterStatus !== "all"
              ? `No ${filterStatus} blog posts found`
              : "Get started by creating your first blog post",
        }}
        pagination={{
          currentPage,
          hasMore,
          onPageChange: handlePageChange,
        }}
        rowClassName={(blog) => (!blog.isPublished ? "bg-muted/30" : "")}
      />
    </div>
  );
};

export default CmsBlogs;
