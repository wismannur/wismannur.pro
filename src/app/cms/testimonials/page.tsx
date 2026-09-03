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
  Star,
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

  // Reset to first page when the search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Apply status filter + search filtering in memory
  const matchedTestimonials = useMemo(() => {
    let list = data ?? [];

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
  }, [data, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
  const filteredTestimonials = matchedTestimonials.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
  const hasMore = pageStart + ENTRIES_PER_PAGE < matchedTestimonials.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is applied in memory
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
        <div className="flex items-center gap-3">
          {testimonial.avatarUrl && (
            <img
              src={testimonial.avatarUrl}
              alt={testimonial.authorName}
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <div className="flex flex-col">
            <div className="font-medium">{testimonial.authorName}</div>
            <div className="text-sm text-muted-foreground">{testimonial.authorRole}</div>
          </div>
        </div>
      ),
      className: "w-[260px]",
    },
    {
      header: "Quote",
      cell: (testimonial) => (
        <div className="text-sm text-muted-foreground line-clamp-2">{testimonial.quote}</div>
      ),
      className: "hidden md:table-cell max-w-[320px]",
    },
    {
      header: "Rating",
      cell: (testimonial) => (
        <div className="flex items-center text-sm">
          <Star className="w-4 h-4 mr-1.5 text-primary" />
          {testimonial.rating}/5
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Status",
      cell: (testimonial) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={testimonial.isPublished ? "default" : "secondary"}>
            {testimonial.isPublished ? "Published" : "Hidden"}
          </Badge>
          {testimonial.sortOrder !== 0 && (
            <span className="text-xs text-muted-foreground">Order: {testimonial.sortOrder}</span>
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/hire-me")}>
                  <Eye className="h-4 w-4 mr-2" />
                  View on Hire Me
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/cms/testimonials/form/${testimonial.id}`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(testimonial.id, testimonial.isPublished)}
                  className={testimonial.isPublished ? "text-destructive" : ""}
                >
                  {testimonial.isPublished ? (
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTestimonialToDelete(testimonial.id)}
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
                  This action cannot be undone. This will permanently delete the testimonial from "
                  {testimonial.authorName}" on your hire-me page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">
            Manage client testimonials on /hire-me — the section hides when none are published
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button asChild>
            <Link href="/cms/testimonials/form">
              <Plus className="mr-2 h-4 w-4" />
              New Testimonial
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search testimonials..."
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
            className="rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTestimonials}
        isLoading={isLoading}
        keyField="id"
        emptyState={{
          icon: <Quote className="h-8 w-8 mb-2" />,
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
        rowClassName={(testimonial) => (!testimonial.isPublished ? "bg-muted/30" : "")}
      />
    </div>
  );
}
