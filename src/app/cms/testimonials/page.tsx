"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
  Search,
  Sparkles,
  Star,
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
import { testimonialsService, type Testimonial } from "@/services";

// Number of entries to display per page (in-memory pagination)
const ENTRIES_PER_PAGE = 10;

export default function CmsTestimonialsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cmsTestimonials"],
    queryFn: () => testimonialsService.getAllForCms(),
  });

  const allTestimonials = useMemo(() => data ?? [], [data]);

  // Metric counts
  const stats = useMemo(() => {
    const total = allTestimonials.length;
    const publishedCount = allTestimonials.filter((t) => t.isPublished).length;
    const hiddenCount = total - publishedCount;
    const avgRating =
      total > 0
        ? (allTestimonials.reduce((acc, curr) => acc + (curr.rating || 5), 0) / total).toFixed(1)
        : "5.0";
    return { total, publishedCount, hiddenCount, avgRating };
  }, [allTestimonials]);

  // Apply status filter + search filtering in memory
  const matchedTestimonials = useMemo(() => {
    let list = allTestimonials;

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((testimonial) => Boolean(testimonial.isPublished) === isPublished);
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(
        (testimonial) =>
          testimonial.authorName.toLowerCase().includes(term) ||
          testimonial.authorRole.toLowerCase().includes(term) ||
          testimonial.quote.toLowerCase().includes(term)
      );
    }

    return list;
  }, [allTestimonials, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
  const filteredTestimonials = matchedTestimonials.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
  const hasMore = pageStart + ENTRIES_PER_PAGE < matchedTestimonials.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  const handlePublishToggle = async (testimonialId: string, currentStatus: boolean) => {
    try {
      await testimonialsService.update(testimonialId, { isPublished: !currentStatus });

      refetch();
      toast.success(currentStatus ? "Testimonial hidden from /hire-me" : "Testimonial published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update testimonial status");
    }
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    try {
      await testimonialsService.delete(testimonialId);

      refetch();
      setTestimonialToDelete(null);
      toast.success("Testimonial deleted successfully");
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<Testimonial>[] = [
    {
      header: "Author",
      cell: (testimonial) => (
        <div className="flex items-center gap-3 py-1">
          {testimonial.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={testimonial.avatarUrl}
              alt={testimonial.authorName}
              className="h-9 w-9 rounded-full object-cover border border-white/[0.1]"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-[#131726] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-indigo-400">
              {testimonial.authorName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <div className="font-semibold text-slate-100">{testimonial.authorName}</div>
            <div className="text-xs text-slate-400">{testimonial.authorRole}</div>
          </div>
        </div>
      ),
      className: "w-[260px]",
    },
    {
      header: "Quote",
      cell: (testimonial) => (
        <div className="text-xs text-slate-400 line-clamp-2 italic max-w-[340px]">
          &ldquo;{testimonial.quote}&rdquo;
        </div>
      ),
      className: "hidden md:table-cell max-w-[340px]",
    },
    {
      header: "Rating",
      cell: (testimonial) => (
        <div className="flex items-center text-xs font-semibold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
          <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-400" />
          {testimonial.rating}/5
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Status",
      cell: (testimonial) => (
        <div className="flex flex-col items-start gap-1">
          <Badge
            variant="outline"
            className={
              testimonial.isPublished
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }
          >
            {testimonial.isPublished ? "Published" : "Hidden"}
          </Badge>
          {testimonial.sortOrder !== 0 && (
            <span className="text-[10px] text-slate-500 font-mono">
              Order: {testimonial.sortOrder}
            </span>
          )}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      cell: (testimonial) => (
        <div className="flex justify-end">
          <AlertDialog
            open={testimonialToDelete === testimonial.id}
            onOpenChange={(open) => !open && setTestimonialToDelete(null)}
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
                  onClick={() => router.push("/hire-me")}
                  className="cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                >
                  <Eye className="h-4 w-4 mr-2 text-indigo-400" />
                  View on Hire Me
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/cms/testimonials/form/${testimonial.id}`)}
                  className="cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                >
                  <Pencil className="h-4 w-4 mr-2 text-amber-400" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(testimonial.id, testimonial.isPublished)}
                  className="cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                >
                  {testimonial.isPublished ? (
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
                  onClick={() => setTestimonialToDelete(testimonial.id)}
                  className="text-rose-400 cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Testimonial
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="bg-[#0C0E18] border border-white/[0.08] text-slate-100">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete the testimonial from &ldquo;
                  {testimonial.authorName}&rdquo; on your hire-me page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-slate-300 hover:bg-white/[0.1]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 hover:bg-rose-700 text-white border-0"
                  onClick={() => handleDeleteTestimonial(testimonial.id)}
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
              <Quote className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Testimonials
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Manage client testimonials on /hire-me — the section hides automatically when none are published
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-medium"
          >
            <Link href="/cms/testimonials/form">
              <Plus className="mr-2 h-4 w-4" />
              New Testimonial
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-lg rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Quote className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Reviews</p>
              <p className="text-xl font-bold text-slate-100">{stats.total}</p>
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
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-lg rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Hidden / Draft</p>
              <p className="text-xl font-bold text-amber-400">{stats.hiddenCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-lg rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Star className="h-4 w-4 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Avg Rating</p>
              <p className="text-xl font-bold text-slate-100">{stats.avgRating} / 5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search testimonials..."
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
              <SelectItem value="all">All Testimonials</SelectItem>
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
          data={filteredTestimonials}
          isLoading={isLoading}
          keyField="id"
          emptyState={{
            icon: <Quote className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No testimonials found",
            description: searchQuery
              ? "Try adjusting your search query"
              : filterStatus && filterStatus !== "all"
                ? `No ${filterStatus} testimonials found`
                : "Get started by adding your first testimonial",
          }}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: handlePageChange,
          }}
          rowClassName={(testimonial) => (!testimonial.isPublished ? "opacity-60 bg-white/[0.01]" : "")}
        />
      </div>
    </div>
  );
}
