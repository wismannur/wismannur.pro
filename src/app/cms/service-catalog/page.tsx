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
    // Search is applied in memory
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
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <div className="font-medium">{service.title}</div>
              <div className="text-sm text-muted-foreground">{service.slug}</div>
            </div>
          </div>
        );
      },
      className: "w-[320px]",
    },
    {
      header: "Price",
      cell: (service) => <span className="text-sm">{service.priceLabel}</span>,
      className: "hidden md:table-cell",
    },
    {
      header: "Visibility",
      cell: (service) => (
        <div className="flex flex-wrap gap-1">
          {service.showOnHome && (
            <Badge variant="outline" className="text-xs">
              Home
            </Badge>
          )}
          {service.showOnHireMe && (
            <Badge variant="outline" className="text-xs">
              Hire Me
            </Badge>
          )}
          {!service.showOnHome && !service.showOnHireMe && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Status",
      cell: (service) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={service.isPublished ? "default" : "secondary"}>
            {service.isPublished ? "Published" : "Hidden"}
          </Badge>
          {service.sortOrder !== 0 && (
            <span className="text-xs text-muted-foreground">Order: {service.sortOrder}</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Updated",
      cell: (service) => (
        <div className="flex items-center text-muted-foreground text-sm">
          <CalendarCog className="w-4 h-4 mr-1.5" />
          {formatDate(service.updatedAt)}
        </div>
      ),
      className: "hidden lg:table-cell",
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
                <DropdownMenuItem
                  onClick={() => router.push(`/cms/service-catalog/form/${service.id}`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handlePublishToggle(service.id, service.isPublished)}
                  className={service.isPublished ? "text-destructive" : ""}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setServiceToDelete(service.id)}
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
                  This action cannot be undone. This will permanently delete "{service.title}" from
                  the home page, /services, and /hire-me.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
          <h1 className="text-2xl font-bold tracking-tight">Service Catalog</h1>
          <p className="text-muted-foreground">
            Manage the services shown on the home page, /services, and /hire-me
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button asChild>
            <Link href="/cms/service-catalog/form">
              <Plus className="mr-2 h-4 w-4" />
              New Service
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
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
            className="rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredServices}
        isLoading={isLoading}
        keyField="id"
        emptyState={{
          icon: <LayoutGrid className="h-8 w-8 mb-2" />,
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
        rowClassName={(service) => (!service.isPublished ? "bg-muted/30" : "")}
      />
    </div>
  );
}
