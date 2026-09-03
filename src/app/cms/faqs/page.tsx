"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarCog,
  Check,
  Eye,
  Filter,
  HelpCircle,
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
import { faqsService, type Faq } from "@/services";

// Number of entries to display per page (in-memory pagination)
const ENTRIES_PER_PAGE = 10;

export default function CmsFaqsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cmsFaqs"],
    queryFn: () => faqsService.getAllForCms(),
  });

  // Reset to first page when the search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Apply status filter + search filtering in memory
  const matchedFaqs = useMemo(() => {
    let list = data ?? [];

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((faq) => Boolean(faq.isPublished) === isPublished);
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(
        (faq) =>
          faq.question.toLowerCase().includes(term) || faq.answer.toLowerCase().includes(term)
      );
    }

    return list;
  }, [data, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
  const filteredFaqs = matchedFaqs.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
  const hasMore = pageStart + ENTRIES_PER_PAGE < matchedFaqs.length;

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

  const handlePublishToggle = async (faqId: string, currentStatus: boolean) => {
    try {
      await faqsService.update(faqId, { isPublished: !currentStatus });

      refetch();
      toast.success(currentStatus ? "FAQ hidden from /services and /hire-me" : "FAQ published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update FAQ status");
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    try {
      await faqsService.delete(faqId);

      refetch();
      setFaqToDelete(null);
      toast.success("FAQ deleted successfully");
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<Faq>[] = [
    {
      header: "Question",
      cell: (faq) => (
        <div className="flex flex-col">
          <div className="font-medium">{faq.question}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</div>
        </div>
      ),
      className: "w-[420px]",
    },
    {
      header: "Status",
      cell: (faq) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={faq.isPublished ? "default" : "secondary"}>
            {faq.isPublished ? "Published" : "Hidden"}
          </Badge>
          {faq.sortOrder !== 0 && (
            <span className="text-xs text-muted-foreground">Order: {faq.sortOrder}</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Updated",
      cell: (faq) => (
        <div className="flex items-center text-muted-foreground text-sm">
          <CalendarCog className="w-4 h-4 mr-1.5" />
          {formatDate(faq.updatedAt)}
        </div>
      ),
      className: "hidden lg:table-cell",
    },
    {
      header: "Actions",
      cell: (faq) => (
        <div className="flex justify-end">
          <AlertDialog
            open={faqToDelete === faq.id}
            onOpenChange={(open) => !open && setFaqToDelete(null)}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/services")}>
                  <Eye className="h-4 w-4 mr-2" />
                  View on Services
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/cms/faqs/form/${faq.id}`)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(faq.id, faq.isPublished)}
                  className={faq.isPublished ? "text-destructive" : ""}
                >
                  {faq.isPublished ? (
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
                  onClick={() => setFaqToDelete(faq.id)}
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
                  This action cannot be undone. This will permanently delete "{faq.question}" from
                  your FAQ sections.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handleDeleteFaq(faq.id)}
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
          <h1 className="text-2xl font-bold tracking-tight">FAQs</h1>
          <p className="text-muted-foreground">
            Manage the FAQ entries shown on /services and /hire-me
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button asChild>
            <Link href="/cms/faqs/form">
              <Plus className="mr-2 h-4 w-4" />
              New FAQ
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs..."
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
              <SelectItem value="all">All FAQs</SelectItem>
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
        data={filteredFaqs}
        isLoading={isLoading}
        keyField="id"
        emptyState={{
          icon: <HelpCircle className="h-8 w-8 mb-2" />,
          title: "No FAQs found",
          description: searchQuery
            ? "Try adjusting your search query"
            : filterStatus && filterStatus !== "all"
              ? `No ${filterStatus} FAQs found`
              : "Get started by adding your first FAQ",
        }}
        pagination={{
          currentPage,
          hasMore,
          onPageChange: handlePageChange,
        }}
        rowClassName={(faq) => (!faq.isPublished ? "bg-muted/30" : "")}
      />
    </div>
  );
}
