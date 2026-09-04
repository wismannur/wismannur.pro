"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Code2,
  DollarSign,
  Eye,
  Filter,
  Flame,
  Inbox,
  Layout,
  Loader2,
  MoreHorizontal,
  Network,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Trash2,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";
import { serviceRequestService, type ServiceRequest } from "@/services";

const SERVICE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  frontend: {
    label: "Frontend Development",
    icon: Code2,
    className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  "ui-ux": {
    label: "UI/UX Implementation",
    icon: Layout,
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  performance: {
    label: "Performance Optimization",
    icon: Zap,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  api: {
    label: "API Integration",
    icon: Network,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  animation: {
    label: "Web Animation",
    icon: Sparkles,
    className: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  leadership: {
    label: "Technical Leadership",
    icon: Users,
    className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
};

const TIMEFRAME_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  asap: {
    label: "ASAP",
    icon: Flame,
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  "1-2-weeks": {
    label: "1-2 Weeks",
    icon: Timer,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  "1-month": {
    label: "Within 1 Month",
    icon: Calendar,
    className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  flexible: {
    label: "Flexible",
    icon: Clock,
    className: "bg-white/[0.04] text-slate-400 border-white/[0.08]",
  },
};

export default function CmsServicesPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [requestToDelete, setRequestToDelete] = useState<ServiceRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["serviceRequests", currentPage, filterStatus],
    queryFn: () =>
      serviceRequestService.getRequests(
        currentPage,
        null,
        filterStatus === "all" ? undefined : filterStatus || undefined
      ),
  });

  const hasMore = data?.hasMore ?? false;

  const filteredRequests = useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return data.requests;

    const query = searchQuery.toLowerCase();
    return data.requests.filter(
      (request) =>
        request.id.toLowerCase().includes(query) ||
        request.name.toLowerCase().includes(query) ||
        request.email.toLowerCase().includes(query) ||
        request.serviceType.toLowerCase().includes(query) ||
        (request.company && request.company.toLowerCase().includes(query)) ||
        request.projectDetails.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // Calculate overview metrics from current requests
  const stats = useMemo(() => {
    const requests = data?.requests || [];
    return {
      total: requests.length,
      new: requests.filter((r) => r.status === "new").length,
      inProgress: requests.filter((r) => r.status === "in-progress").length,
      completed: requests.filter((r) => r.status === "completed").length,
      cancelled: requests.filter((r) => r.status === "cancelled").length,
    };
  }, [data]);

  const handleViewRequest = (id: string) => {
    router.push(`/cms/services/${id}`);
  };

  const handleUpdateStatus = async (
    id: string,
    status: "new" | "in-progress" | "completed" | "cancelled"
  ) => {
    try {
      await serviceRequestService.updateStatus(id, status);
      toast.success(`Status updated to ${status}`);
      refetch();
    } catch (error) {
      console.error("Error updating service request status:", error);
      toast.error("Failed to update service request status");
    }
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    setIsDeleting(true);
    try {
      await serviceRequestService.delete(requestToDelete.id);
      toast.success("Service request successfully deleted");
      setRequestToDelete(null);
      refetch();
    } catch (error) {
      console.error("Error deleting service request:", error);
      toast.error("Failed to delete service request");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const getInitials = (name: string) => {
    if (!name) return "CL";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            New
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08] whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const getBudgetLabel = (budget: string) => {
    const budgets: Record<string, string> = {
      "under-1000": "< $1,000",
      "1000-5000": "$1,000 - $5,000",
      "5000-10000": "$5,000 - $10,000",
      "10000-plus": "$10,000+",
      hourly: "Hourly rate",
    };

    return budgets[budget] || budget;
  };

  // Define columns for the DataTable
  const columns: ColumnDef<ServiceRequest>[] = [
    {
      header: "Client",
      cell: (request) => {
        const isNew = request.status === "new";
        return (
          <div className="flex items-center gap-3 py-1 group/client">
            <Avatar className="h-9 w-9 shrink-0 border border-white/[0.08] bg-[#131726] group-hover/client:border-indigo-500/40 transition-colors">
              <AvatarFallback
                className={cn(
                  "font-semibold text-xs transition-colors",
                  isNew
                    ? "bg-indigo-500/20 text-indigo-300 group-hover/client:bg-indigo-500/30"
                    : "bg-white/[0.04] text-slate-300 group-hover/client:text-white"
                )}
              >
                {getInitials(request.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-100 text-sm truncate max-w-[170px] group-hover/client:text-indigo-400 transition-colors">
                  {request.name}
                </span>
                {isNew && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20 shrink-0">
                  {request.id}
                </span>
                <span className="text-slate-600">•</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`mailto:${request.email}`, "_self");
                  }}
                  className="hover:text-indigo-400 transition-colors truncate max-w-[140px]"
                  title={request.email}
                >
                  {request.email}
                </span>
              </div>
              {request.company && (
                <div
                  className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]"
                  title={request.company}
                >
                  <Building2 className="h-3 w-3 shrink-0 text-slate-500" />
                  <span className="truncate">{request.company}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
      className: "min-w-[240px]",
    },
    {
      header: "Service",
      cell: (request) => {
        const config = SERVICE_TYPE_CONFIG[request.serviceType] || {
          label: request.serviceType,
          icon: Briefcase,
          className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        };
        const Icon = config.icon;
        return (
          <div className="flex flex-col gap-1.5 py-1 min-w-0">
            <div className="flex items-center">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold px-2.5 py-0.5 inline-flex items-center gap-1.5 rounded-lg",
                  config.className
                )}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[170px]">{config.label}</span>
              </Badge>
            </div>
            {request.projectDetails && (
              <p
                className="text-xs text-slate-400 line-clamp-1 max-w-[240px]"
                title={request.projectDetails}
              >
                {request.projectDetails}
              </p>
            )}
          </div>
        );
      },
      className: "min-w-[220px]",
    },
    {
      header: "Budget & Timeline",
      cell: (request) => {
        const timeframeConfig = TIMEFRAME_CONFIG[request.timeframe] || {
          label: request.timeframe,
          icon: Clock,
          className: "bg-white/[0.04] text-slate-400 border-white/[0.08]",
        };
        const TimeframeIcon = timeframeConfig.icon;

        return (
          <div className="flex flex-col gap-1 py-0.5 min-w-0">
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 whitespace-nowrap">
              <DollarSign className="h-3.5 w-3.5 shrink-0 -mr-0.5" />
              <span className="tabular-nums text-slate-200">{getBudgetLabel(request.budget)}</span>
            </div>
            <div className="flex items-center">
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] font-medium px-2 py-0.2 inline-flex items-center gap-1 rounded-md whitespace-nowrap",
                  timeframeConfig.className
                )}
              >
                <TimeframeIcon className="h-2.5 w-2.5 shrink-0" />
                <span>{timeframeConfig.label}</span>
              </Badge>
            </div>
          </div>
        );
      },
      className: "hidden md:table-cell min-w-[150px] whitespace-nowrap",
    },
    {
      header: "Date",
      cell: (request) => {
        const createdDate = new Date(request.createdAt);
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-slate-200 whitespace-nowrap">
              {format(createdDate, "dd MMM yyyy")}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap mt-0.5">
              <Clock className="h-3 w-3 text-slate-500" />
              {format(createdDate, "HH:mm")} WIB
            </span>
          </div>
        );
      },
      className: "hidden md:table-cell min-w-[120px] whitespace-nowrap",
    },
    {
      header: "Status",
      cell: (request) => getStatusBadge(request.status),
      className: "hidden sm:table-cell min-w-[120px] whitespace-nowrap",
    },
    {
      header: "",
      cell: (request) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <DropdownMenuItem
                onClick={() => handleViewRequest(request.id)}
                className="focus:bg-indigo-500/10 focus:text-indigo-300"
              >
                <Eye className="h-4 w-4 mr-2 text-indigo-400" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(request.id, "in-progress")}
                disabled={request.status === "in-progress"}
                className="focus:bg-purple-500/10 focus:text-purple-300"
              >
                <Clock className="h-4 w-4 mr-2 text-purple-400" />
                Set In Progress
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(request.id, "completed")}
                disabled={request.status === "completed"}
                className="focus:bg-emerald-500/10 focus:text-emerald-300"
              >
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-400" />
                Mark Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(request.id, "cancelled")}
                disabled={request.status === "cancelled"}
                className="focus:bg-rose-500/10 focus:text-rose-300"
              >
                <XCircle className="h-4 w-4 mr-2 text-rose-400" />
                Cancel Request
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem
                onClick={() => setRequestToDelete(request)}
                className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2 text-rose-400" />
                Delete Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: "text-right w-[60px] whitespace-nowrap",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </span>
            Service Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage, review, and respond to incoming service inquiries and custom project proposals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-9 px-3 gap-1.5 rounded-xl border-white/[0.08] bg-[#0C0E18]/80 text-slate-300 hover:text-white hover:bg-white/[0.06]"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", (isLoading || isRefetching) && "animate-spin text-indigo-400")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => handleFilterChange("all")}
          className={cn(
            "cursor-pointer rounded-2xl border p-4 text-left transition-all duration-200 backdrop-blur-xl relative overflow-hidden group",
            filterStatus === "all" || !filterStatus
              ? "bg-[#0C0E18] border-indigo-500/40 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-500/10"
              : "bg-[#0C0E18]/70 border-white/[0.08] hover:border-white/[0.16] hover:bg-[#0C0E18]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Requests</span>
            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 group-hover:text-white group-hover:border-white/[0.12] transition-colors">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight text-white">{stats.total}</div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("new")}
          className={cn(
            "cursor-pointer rounded-2xl border p-4 text-left transition-all duration-200 backdrop-blur-xl relative overflow-hidden group",
            filterStatus === "new"
              ? "bg-[#0C0E18] border-blue-500/40 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/10"
              : "bg-[#0C0E18]/70 border-white/[0.08] hover:border-blue-500/30 hover:bg-[#0C0E18]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">New Requests</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight text-blue-400">{stats.new}</div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("in-progress")}
          className={cn(
            "cursor-pointer rounded-2xl border p-4 text-left transition-all duration-200 backdrop-blur-xl relative overflow-hidden group",
            filterStatus === "in-progress"
              ? "bg-[#0C0E18] border-purple-500/40 ring-1 ring-purple-500/40 shadow-lg shadow-purple-500/10"
              : "bg-[#0C0E18]/70 border-white/[0.08] hover:border-purple-500/30 hover:bg-[#0C0E18]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">In Progress</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight text-purple-400">
            {stats.inProgress}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("completed")}
          className={cn(
            "cursor-pointer rounded-2xl border p-4 text-left transition-all duration-200 backdrop-blur-xl relative overflow-hidden group",
            filterStatus === "completed"
              ? "bg-[#0C0E18] border-emerald-500/40 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10"
              : "bg-[#0C0E18]/70 border-white/[0.08] hover:border-emerald-500/30 hover:bg-[#0C0E18]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight text-emerald-400">
            {stats.completed}
          </div>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by client, service, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-200 text-xs focus:ring-indigo-500/30">
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <SelectValue placeholder="All Statuses" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <SelectItem value="all" className="text-xs focus:bg-indigo-500/10 focus:text-indigo-300">
                All Requests
              </SelectItem>
              <SelectItem value="new" className="text-xs focus:bg-blue-500/10 focus:text-blue-300">
                New
              </SelectItem>
              <SelectItem value="in-progress" className="text-xs focus:bg-purple-500/10 focus:text-purple-300">
                In Progress
              </SelectItem>
              <SelectItem value="completed" className="text-xs focus:bg-emerald-500/10 focus:text-emerald-300">
                Completed
              </SelectItem>
              <SelectItem value="cancelled" className="text-xs focus:bg-rose-500/10 focus:text-rose-300">
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={filteredRequests}
          isLoading={isLoading}
          loadingRows={5}
          emptyState={{
            icon: <Inbox className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No service requests found",
            description: searchQuery
              ? "Try adjusting your search query"
              : filterStatus && filterStatus !== "all"
                ? `No ${filterStatus} service requests found`
                : "No service requests submitted yet",
          }}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: handlePageChange,
          }}
          onRowClick={(request) => handleViewRequest(request.id)}
          rowClassName={(request) =>
            cn(
              "transition-colors hover:bg-white/[0.03] cursor-pointer border-b border-white/[0.04]",
              request.status === "new" && "bg-blue-500/[0.03]"
            )
          }
          keyField="id"
        />
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(requestToDelete)}
        onOpenChange={(open) => !open && setRequestToDelete(null)}
      >
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg font-bold">
              Delete Service Request?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              This action cannot be undone. The service request from{" "}
              <strong className="text-white">{requestToDelete?.name}</strong> (
              {requestToDelete?.email}) for service{" "}
              <strong className="text-white">{requestToDelete?.serviceType}</strong> and all
              related email thread history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
              onClick={handleDeleteRequest}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
