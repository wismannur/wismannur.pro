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
  Search,
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
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import { CmsPageHeader } from "@/components/cms/cms-page-header";
import { CmsMetricCards } from "@/components/cms/cms-metric-cards";

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

  const [prevFilters, setPrevFilters] = useState({ searchQuery, filterStatus });
  if (prevFilters.searchQuery !== searchQuery || prevFilters.filterStatus !== filterStatus) {
    setPrevFilters({ searchQuery, filterStatus });
    setCurrentPage(1);
  }

  const stats = useMemo(() => {
    const list = data ?? [];
    const total = list.length;
    const published = list.filter((f) => f.isPublished).length;
    const hidden = list.filter((f) => !f.isPublished).length;
    return { total, published, hidden };
  }, [data]);

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

  useRegisterCmsPageContext({
    pageTitle: "FAQs",
    summary: `Managing ${stats.total} FAQs (${stats.published} published). Page ${currentPage}.`,
    activeItems: filteredFaqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      isPublished: f.isPublished,
      sortOrder: f.sortOrder,
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

  const handlePublishToggle = async (faqId: string, currentStatus: boolean) => {
    try {
      await faqsService.update(faqId, { isPublished: !currentStatus });

      refetch();
      toast.success(currentStatus ? "FAQ hidden from public pages" : "FAQ published");
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
      header: "Question & Answer",
      cell: (faq) => (
        <div className="flex flex-col gap-1 py-1">
          <div className="font-semibold text-slate-100">{faq.question}</div>
          <div className="text-xs text-slate-400 line-clamp-2 max-w-xl">{faq.answer}</div>
        </div>
      ),
      className: "w-[420px]",
    },
    {
      header: "Status",
      cell: (faq) => (
        <div className="flex flex-col items-start gap-1">
          <Badge
            className={
              faq.isPublished
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }
          >
            {faq.isPublished ? "Published" : "Hidden"}
          </Badge>
          {faq.sortOrder !== 0 && (
            <span className="text-[10px] text-slate-500">Order: {faq.sortOrder}</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell w-[110px]",
    },
    {
      header: "Updated",
      cell: (faq) => (
        <div className="flex items-center text-slate-400 text-xs">
          <CalendarCog className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
          {formatDate(faq.updatedAt)}
        </div>
      ),
      className: "hidden lg:table-cell w-[140px]",
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
                  onClick={() => router.push("/services")}
                  className="hover:bg-white/[0.06] cursor-pointer"
                >
                  <Eye className="h-4 w-4 mr-2 text-indigo-400" />
                  View on Services
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/cms/faqs/form/${faq.id}`)}
                  className="hover:bg-white/[0.06] cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2 text-amber-400" />
                  Edit FAQ
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(faq.id, faq.isPublished)}
                  className={
                    faq.isPublished
                      ? "text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                      : "text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                  }
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
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => setFaqToDelete(faq.id)}
                  className="text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete FAQ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-100">Delete FAQ?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete &quot;{faq.question}
                  &quot; from your FAQ sections.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
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
      <CmsPageHeader
        icon={HelpCircle}
        title="Frequently Asked Questions"
        description="Manage inquiries and clarifications displayed on /services and /hire-me"
        badge={stats.total > 0 ? `${stats.total} total` : undefined}
        onRefresh={() => refetch()}
        isRefreshing={isLoading || isRefetching}
        action={
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-semibold"
          >
            <Link href="/cms/faqs/form">
              <Plus className="mr-2 h-4 w-4" />
              New FAQ
            </Link>
          </Button>
        }
      />

      {/* Metrics Row */}
      <CmsMetricCards
        gridCols="grid-cols-1 sm:grid-cols-3"
        metrics={[
          {
            id: "total",
            label: "Total Questions",
            value: stats.total,
            icon: HelpCircle,
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
            onClick: () => handleFilterChange(filterStatus === "published" ? "all" : "published"),
          },
          {
            id: "draft",
            label: "Hidden",
            value: stats.hidden,
            icon: Eye,
            color: "amber",
            active: filterStatus === "draft",
            onClick: () => handleFilterChange(filterStatus === "draft" ? "all" : "draft"),
          },
        ]}
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40 text-xs h-10"
          />
        </form>

        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40 text-xs h-10">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <SelectItem value="all">All FAQs</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredFaqs}
          isLoading={isLoading}
          keyField="id"
          emptyState={{
            icon: <HelpCircle className="h-8 w-8 mb-2 text-slate-500" />,
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
          rowClassName={(faq) =>
            !faq.isPublished ? "bg-white/[0.01]" : "hover:bg-white/[0.02] transition-colors"
          }
        />
      </div>
    </div>
  );
}
