"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarCog,
  Check,
  Eye,
  Filter,
  LayoutGrid,
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
import { getContentIcon } from "@/lib/icon-registry";
import { formatDate } from "@/lib/utils";
import { serviceCatalogService, type ServiceItem } from "@/services";

// Number of entries to display per page (in-memory pagination)
const ENTRIES_PER_PAGE = 10;

export default function CmsServiceCatalogPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cmsServiceCatalog"],
    queryFn: () => serviceCatalogService.getAllForCms(),
  });

  // Reset to first page when the search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const list = data ?? [];
    const total = list.length;
    const published = list.filter((s) => s.isPublished).length;
    const homeCount = list.filter((s) => s.showOnHome).length;
    const hireMeCount = list.filter((s) => s.showOnHireMe).length;
    return { total, published, homeCount, hireMeCount };
  }, [data]);

  // Apply status filter + search filtering in memory
  const matchedServices = useMemo(() => {
    let list = data ?? [];

    if (filterStatus && filterStatus !== "all") {
      const isPublished = filterStatus === "published";
      list = list.filter((service) => Boolean(service.isPublished) === isPublished);
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(
        (service) =>
          service.title.toLowerCase().includes(term) ||
          service.slug.toLowerCase().includes(term) ||
          service.description.toLowerCase().includes(term) ||
          service.priceLabel.toLowerCase().includes(term)
      );
    }

    return list;
  }, [data, filterStatus, searchQuery]);

  // In-memory pagination (no cursor)
  const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
  const filteredServices = matchedServices.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
  const hasMore = pageStart + ENTRIES_PER_PAGE < matchedServices.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handlePublishToggle = async (serviceId: string, currentStatus: boolean) => {
    try {
      await serviceCatalogService.update(serviceId, { isPublished: !currentStatus });

      refetch();
      toast.success(currentStatus ? "Service hidden from public pages" : "Service published");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update service status");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await serviceCatalogService.delete(serviceId);

      refetch();
      setServiceToDelete(null);
      toast.success("Service deleted successfully");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<ServiceItem>[] = [
    {
      header: "Service",
      cell: (service) => {
        const Icon = getContentIcon(service.icon);
        return (
          <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="font-semibold text-slate-100">{service.title}</div>
              <div className="text-xs text-slate-400 font-mono">/{service.slug}</div>
            </div>
          </div>
        );
      },
      className: "w-[300px]",
    },
    {
      header: "Price Tier",
      cell: (service) => (
        <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
          {service.priceLabel}
        </span>
      ),
      className: "hidden md:table-cell w-[130px]",
    },
    {
      header: "Placements",
      cell: (service) => (
        <div className="flex flex-wrap gap-1">
          {service.showOnHome && (
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px]">
              Home
            </Badge>
          )}
          {service.showOnHireMe && (
            <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
              Hire Me
            </Badge>
          )}
          {!service.showOnHome && !service.showOnHireMe && (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell w-[150px]",
    },
    {
      header: "Status",
      cell: (service) => (
        <div className="flex flex-col items-start gap-1">
          <Badge
            className={
              service.isPublished
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }
          >
            {service.isPublished ? "Published" : "Hidden"}
          </Badge>
          {service.sortOrder !== 0 && (
            <span className="text-[10px] text-slate-500">Order: {service.sortOrder}</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell w-[110px]",
    },
    {
      header: "Updated",
      cell: (service) => (
        <div className="flex items-center text-slate-400 text-xs">
          <CalendarCog className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
          {formatDate(service.updatedAt)}
        </div>
      ),
      className: "hidden lg:table-cell w-[140px]",
    },
    {
      header: "Actions",
      cell: (service) => (
        <div className="flex justify-end">
          <AlertDialog
            open={serviceToDelete === service.id}
            onOpenChange={(open) => !open && setServiceToDelete(null)}
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
                  onClick={() => router.push(`/cms/service-catalog/form/${service.id}`)}
                  className="hover:bg-white/[0.06] cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2 text-amber-400" />
                  Edit Service
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(service.id, service.isPublished)}
                  className={service.isPublished ? "text-amber-400 hover:bg-amber-500/10 cursor-pointer" : "text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"}
                >
                  {service.isPublished ? (
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
                  onClick={() => setServiceToDelete(service.id)}
                  className="text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Service
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-100">Delete Service?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete &quot;{service.title}&quot; from
                  your public service offerings and catalog.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                  onClick={() => handleDeleteService(service.id)}
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Service Catalog</h1>
          <p className="text-sm text-slate-400">
            Manage offerings shown on home, /services, and /hire-me
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-semibold"
          >
            <Link href="/cms/service-catalog/form">
              <Plus className="mr-2 h-4 w-4" />
              New Service
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400">Total Services</div>
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
            <div className="text-xs font-medium text-slate-400">Home Showcase</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">{stats.homeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-400">Hire Me Tab</div>
            <div className="text-2xl font-bold text-violet-400 mt-1">{stats.hireMeCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search services..."
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
              <SelectItem value="all">All Services</SelectItem>
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
          data={filteredServices}
          isLoading={isLoading}
          keyField="id"
          emptyState={{
            icon: <LayoutGrid className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No services found",
            description: searchQuery
              ? "Try adjusting your search query"
              : filterStatus && filterStatus !== "all"
                ? `No ${filterStatus} services found`
                : "Get started by adding your first service",
          }}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: handlePageChange,
          }}
          rowClassName={(service) => (!service.isPublished ? "bg-white/[0.01]" : "hover:bg-white/[0.02] transition-colors")}
        />
      </div>
    </div>
  );
}

