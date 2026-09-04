"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  Filter,
  Inbox,
  Loader2,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
  XCircle,
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
import { hireRequestService, type HireRequest, type HireRequestStatus } from "@/services";

const EMPLOYMENT_CONFIG: Record<string, { label: string; className: string }> = {
  full_time: {
    label: "Full-time",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  contract: {
    label: "Contract",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  advisory: {
    label: "Advisory / Lead",
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  other: {
    label: "Other",
    className: "bg-white/[0.04] text-slate-400 border-white/[0.08]",
  },
};

const WORKPLACE_CONFIG: Record<string, { label: string; className: string }> = {
  remote: {
    label: "Remote",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  hybrid: {
    label: "Hybrid",
    className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  onsite: {
    label: "On-site",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

export default function CmsHireRequestsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [requestToDelete, setRequestToDelete] = useState<HireRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["hireRequests", currentPage, filterStatus],
    queryFn: () =>
      hireRequestService.getRequests(
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
        request.company.toLowerCase().includes(query) ||
        request.roleTitle.toLowerCase().includes(query) ||
        request.message.toLowerCase().includes(query) ||
        (request.location && request.location.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  const stats = useMemo(() => {
    const requests = data?.requests || [];
    return {
      total: requests.length,
      new: requests.filter((r) => r.status === "new").length,
      reviewed: requests.filter((r) => r.status === "reviewed").length,
      interviewing: requests.filter((r) => r.status === "interviewing").length,
      offered: requests.filter((r) => r.status === "offered").length,
      archived: requests.filter((r) => r.status === "archived").length,
    };
  }, [data]);

  const handleViewRequest = (id: string) => {
    router.push(`/cms/hire-requests/${id}`);
  };

  const handleUpdateStatus = async (id: string, status: HireRequestStatus) => {
    try {
      await hireRequestService.updateStatus(id, status);
      toast.success(`Status updated to ${status}`);
      refetch();
    } catch (error) {
      console.error("Error updating hire request status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    setIsDeleting(true);
    try {
      await hireRequestService.delete(requestToDelete.id);
      toast.success("Hire inquiry deleted successfully");
      setRequestToDelete(null);
      refetch();
    } catch (error) {
      console.error("Error deleting hire request:", error);
      toast.error("Failed to delete hire inquiry");
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "HR";
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
      case "reviewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap shadow-xs">
            <Clock className="w-3 h-3" />
            Reviewed
          </span>
        );
      case "interviewing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap shadow-xs">
            <Users className="w-3 h-3" />
            Interviewing
          </span>
        );
      case "offered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-xs">
            <CheckCircle2 className="w-3 h-3" />
            Offered
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap shadow-xs">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08] whitespace-nowrap">
            Archived
          </span>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  const columns: ColumnDef<HireRequest>[] = [
    {
      header: "Recruiter / Contact",
      cell: (row) => (
        <div className="flex items-center gap-3 min-w-[200px] py-1 group/recruiter">
          <Avatar className="h-9 w-9 border border-white/[0.08] bg-[#131726] shrink-0 group-hover/recruiter:border-indigo-500/40 transition-colors">
            <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
              {getInitials(row.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-slate-100 truncate group-hover/recruiter:text-indigo-400 transition-colors">
              {row.name}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20 shrink-0">
                {row.id}
              </span>
              <span className="text-slate-600">•</span>
              <span className="truncate max-w-[130px]">{row.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Company & Role",
      cell: (row) => (
        <div className="flex flex-col gap-1 min-w-[180px] py-1">
          <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-100">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{row.company}</span>
          </div>
          <span className="text-xs text-slate-400 truncate font-medium">
            {row.roleTitle}
          </span>
        </div>
      ),
    },
    {
      header: "Type & Policy",
      cell: (row) => {
        const empConfig = EMPLOYMENT_CONFIG[row.employmentType] || EMPLOYMENT_CONFIG.full_time;
        const workConfig = WORKPLACE_CONFIG[row.workplaceType] || WORKPLACE_CONFIG.remote;
        return (
          <div className="flex flex-wrap gap-1.5 items-center min-w-[150px]">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                empConfig.className
              )}
            >
              {empConfig.label}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                workConfig.className
              )}
            >
              {workConfig.label}
            </span>
          </div>
        );
      },
    },
    {
      header: "Compensation / Location",
      cell: (row) => (
        <div className="flex flex-col gap-1 min-w-[160px] text-xs">
          {row.salaryRange ? (
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span className="text-slate-200">{row.salaryRange}</span>
            </span>
          ) : (
            <span className="text-slate-500 italic">Negotiable / Unspecified</span>
          )}
          {row.location && (
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              {row.location}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Date",
      cell: (row) => (
        <div className="flex flex-col text-xs text-slate-400 min-w-[100px]">
          <span className="font-medium text-slate-200">
            {format(new Date(row.createdAt), "dd MMM yyyy")}
          </span>
          <span className="text-[11px] text-slate-500">{format(new Date(row.createdAt), "HH:mm")} WIB</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => getStatusBadge(row.status),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewRequest(row.id)}
            className="h-8 px-2.5 text-xs font-semibold text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-lg"
          >
            <Eye className="w-3.5 h-3.5 mr-1 text-indigo-400" />
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <DropdownMenuItem
                onClick={() => handleViewRequest(row.id)}
                className="focus:bg-indigo-500/10 focus:text-indigo-300"
              >
                <Eye className="w-4 h-4 mr-2 text-indigo-400" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(row.id, "new")}
                className="focus:bg-blue-500/10 focus:text-blue-300"
              >
                <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
                Mark as New
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(row.id, "reviewed")}
                className="focus:bg-amber-500/10 focus:text-amber-300"
              >
                <Clock className="w-4 h-4 mr-2 text-amber-400" />
                Mark as Reviewed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(row.id, "interviewing")}
                className="focus:bg-purple-500/10 focus:text-purple-300"
              >
                <Users className="w-4 h-4 mr-2 text-purple-400" />
                Mark as Interviewing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(row.id, "offered")}
                className="focus:bg-emerald-500/10 focus:text-emerald-300"
              >
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                Mark as Offered
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(row.id, "rejected")}
                className="focus:bg-rose-500/10 focus:text-rose-300"
              >
                <XCircle className="w-4 h-4 mr-2 text-rose-400" />
                Mark as Declined
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem
                className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
                onClick={() => setRequestToDelete(row)}
              >
                <Trash2 className="h-4 w-4 mr-2 text-rose-400" />
                Delete Inquiry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </span>
            Hire Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Recruitment messages, full-time offers, and direct hiring proposals from /hire-me.
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0C0E18]/70 backdrop-blur-xl hover:border-white/[0.16] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Inquiries</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0C0E18]/70 backdrop-blur-xl hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">New / Unread</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight text-blue-400">{stats.new}</p>
        </div>
        <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0C0E18]/70 backdrop-blur-xl hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Interviewing</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight text-purple-400">
            {stats.interviewing}
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0C0E18]/70 backdrop-blur-xl hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Offered</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight text-emerald-400">
            {stats.offered}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, company, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/30"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val)}>
            <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-200 text-xs focus:ring-indigo-500/30">
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <SelectItem value="all" className="text-xs focus:bg-indigo-500/10 focus:text-indigo-300">All Status</SelectItem>
              <SelectItem value="new" className="text-xs focus:bg-blue-500/10 focus:text-blue-300">New</SelectItem>
              <SelectItem value="reviewed" className="text-xs focus:bg-amber-500/10 focus:text-amber-300">Reviewed</SelectItem>
              <SelectItem value="interviewing" className="text-xs focus:bg-purple-500/10 focus:text-purple-300">Interviewing</SelectItem>
              <SelectItem value="offered" className="text-xs focus:bg-emerald-500/10 focus:text-emerald-300">Offered</SelectItem>
              <SelectItem value="rejected" className="text-xs focus:bg-rose-500/10 focus:text-rose-300">Declined</SelectItem>
              <SelectItem value="archived" className="text-xs focus:bg-white/[0.06] focus:text-slate-300">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DataTable */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={filteredRequests}
          isLoading={isLoading}
          loadingRows={5}
          onRowClick={(row) => handleViewRequest(row.id)}
          emptyState={{
            icon: <Inbox className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No hire inquiries found",
            description:
              searchQuery || filterStatus
                ? "Try adjusting your search query or status filter."
                : "Recruiter proposals and job opportunities from /hire-me will appear here.",
          }}
          pagination={{
            currentPage,
            hasMore,
            onPageChange: (page) => setCurrentPage(page),
          }}
          rowClassName={(row) =>
            cn(
              "transition-colors hover:bg-white/[0.03] cursor-pointer border-b border-white/[0.04]",
              row.status === "new" && "bg-blue-500/[0.03]"
            )
          }
          keyField="id"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={Boolean(requestToDelete)} onOpenChange={() => setRequestToDelete(null)}>
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg font-bold">Delete Hire Inquiry</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              Are you sure you want to delete the inquiry from{" "}
              <strong className="text-white">{requestToDelete?.name}</strong> at{" "}
              <strong className="text-white">{requestToDelete?.company}</strong>? This action cannot be undone.
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
              onClick={handleDeleteRequest}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
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
