"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CalendarCog,
  CalendarDays,
  Check,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
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
import { availabilityService } from "@/services";
import type { AvailabilitySlot, AvailabilityStatus } from "@/services/availability/types";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import { CmsPageHeader } from "@/components/cms/cms-page-header";
import { CmsMetricCards } from "@/components/cms/cms-metric-cards";

// Number of slots to display per page (in-memory pagination)
const SLOTS_PER_PAGE = 10;

// `month` is stored as 1-12; index month-1 to format e.g. "Sep 2026".
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatMonth = (slot: AvailabilitySlot) =>
  `${MONTH_LABELS[slot.month - 1] ?? slot.month} ${slot.year}`;

const STATUS_BADGE_STYLE: Record<AvailabilityStatus, string> = {
  available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  limited: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  booked: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function CmsAvailabilityPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cmsAvailability"],
    queryFn: () => availabilityService.getAllForCms(),
  });

  const allSlots = useMemo(() => data ?? [], [data]);

  // Metric counts
  const stats = useMemo(() => {
    const total = allSlots.length;
    const availableCount = allSlots.filter((s) => s.status === "available").length;
    const limitedCount = allSlots.filter((s) => s.status === "limited").length;
    const bookedCount = allSlots.filter((s) => s.status === "booked").length;
    const publishedCount = allSlots.filter((s) => s.isPublished).length;
    return { total, availableCount, limitedCount, bookedCount, publishedCount };
  }, [allSlots]);

  // Apply status filter + search filtering in memory
  const matchedSlots = useMemo(() => {
    let list = allSlots;

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((slot) => Boolean(slot.isPublished) === isPublished);
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(
        (slot) =>
          formatMonth(slot).toLowerCase().includes(term) ||
          slot.label.toLowerCase().includes(term) ||
          slot.status.toLowerCase().includes(term) ||
          String(slot.year).includes(term)
      );
    }

    return list;
  }, [allSlots, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * SLOTS_PER_PAGE;
  const filteredSlots = matchedSlots.slice(pageStart, pageStart + SLOTS_PER_PAGE);
  const hasMore = pageStart + SLOTS_PER_PAGE < matchedSlots.length;

  useRegisterCmsPageContext({
    pageTitle: "Availability Slots",
    summary: `Managing ${stats.total} availability slots (${stats.availableCount} available, ${stats.limitedCount} limited, ${stats.bookedCount} booked). Page ${currentPage}.`,
    activeItems: filteredSlots.map((s) => ({
      id: s.id,
      month: s.month,
      year: s.year,
      status: s.status,
      label: s.label,
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
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handlePublishToggle = async (slotId: string, currentStatus: boolean) => {
    try {
      await availabilityService.update(slotId, { isPublished: !currentStatus });

      refetch();
      toast.success(currentStatus ? "Slot hidden from /hire-me" : "Slot published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update slot status");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await availabilityService.delete(slotId);

      refetch();
      setSlotToDelete(null);
      toast.success("Slot deleted successfully");
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast.error("Failed to delete slot");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<AvailabilitySlot>[] = [
    {
      header: "Month / Period",
      cell: (slot) => (
        <div className="flex flex-col py-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100">{formatMonth(slot)}</span>
            {slot.sortOrder !== 0 && (
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-mono px-1.5 py-0 bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              >
                Order: {slot.sortOrder}
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Year {slot.year}, Month {slot.month}
          </span>
        </div>
      ),
      className: "w-[220px]",
    },
    {
      header: "Status & Label",
      cell: (slot) => (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={STATUS_BADGE_STYLE[slot.status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}
          >
            {slot.label}
          </Badge>
          <span className="text-xs font-mono text-slate-500">({slot.status})</span>
        </div>
      ),
    },
    {
      header: "Published",
      cell: (slot) => (
        <Badge
          variant="outline"
          className={
            slot.isPublished
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }
        >
          {slot.isPublished ? "Published" : "Hidden"}
        </Badge>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Last Updated",
      cell: (slot) => (
        <div className="flex items-center text-slate-400 text-xs font-mono">
          <CalendarCog className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          {formatDate(slot.updatedAt)}
        </div>
      ),
      className: "hidden lg:table-cell",
    },
    {
      header: "Actions",
      cell: (slot) => (
        <div className="flex justify-end">
          <AlertDialog
            open={slotToDelete === slot.id}
            onOpenChange={(open) => !open && setSlotToDelete(null)}
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
                  onClick={() => router.push(`/cms/availability/form/${slot.id}`)}
                  className="cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                >
                  <Pencil className="h-4 w-4 mr-2 text-amber-400" />
                  Edit Slot
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(slot.id, slot.isPublished)}
                  className="cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                >
                  {slot.isPublished ? (
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
                  onClick={() => setSlotToDelete(slot.id)}
                  className="text-rose-400 cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Slot
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="bg-[#0C0E18] border border-white/[0.08] text-slate-100">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete the &ldquo;
                  {formatMonth(slot)}&rdquo; slot from your hire-me page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-slate-300 hover:bg-white/[0.1]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 hover:bg-rose-700 text-white border-0"
                  onClick={() => handleDeleteSlot(slot.id)}
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
      <CmsPageHeader
        icon={CalendarDays}
        title="Availability Slots"
        description="Manage your project booking availability slots shown on the /hire-me calendar"
        badge={stats.total > 0 ? `${stats.total} total` : undefined}
        onRefresh={() => refetch()}
        isRefreshing={isLoading || isRefetching}
        action={
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-medium"
          >
            <Link href="/cms/availability/form">
              <Plus className="mr-2 h-4 w-4" />
              New Slot
            </Link>
          </Button>
        }
      />

      {/* Summary Metrics Cards */}
      <CmsMetricCards
        gridCols="grid-cols-2 sm:grid-cols-4"
        metrics={[
          {
            id: "total",
            label: "Total Slots",
            value: stats.total,
            icon: CalendarClock,
            color: "default",
          },
          {
            id: "available",
            label: "Available",
            value: stats.availableCount,
            icon: Sparkles,
            color: "emerald",
          },
          {
            id: "limited",
            label: "Limited",
            value: stats.limitedCount,
            icon: CalendarDays,
            color: "amber",
          },
          {
            id: "booked",
            label: "Booked",
            value: stats.bookedCount,
            icon: X,
            color: "rose",
          },
        ]}
      />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search slots..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 w-full bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl text-xs h-10"
          />
        </form>

        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40 text-xs h-10">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-indigo-400" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200">
              <SelectItem value="all">All Slots</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={filteredSlots}
          isLoading={isLoading}
          keyField="id"
          emptyState={{
            icon: <CalendarDays className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No availability slots found",
            description: searchQuery
              ? "Try adjusting your search query"
              : filterStatus && filterStatus !== "all"
                ? `No ${filterStatus} slots found`
                : "Get started by adding your first availability slot",
          }}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: handlePageChange,
          }}
          rowClassName={(slot) => (!slot.isPublished ? "opacity-60 bg-white/[0.01]" : "")}
        />
      </div>
    </div>
  );
}
