"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  Filter,
  Globe,
  Inbox,
  Loader2,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
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
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  contract: {
    label: "Contract",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  advisory: {
    label: "Advisory / Lead",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  other: {
    label: "Other",
    className: "bg-muted/50 text-muted-foreground border-border/50",
  },
};

const WORKPLACE_CONFIG: Record<string, { label: string; className: string }> = {
  remote: {
    label: "Remote",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  hybrid: {
    label: "Hybrid",
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  onsite: {
    label: "On-site",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

export default function CmsHireRequestsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [requestToDelete, setRequestToDelete] = useState<HireRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filteredRequests, setFilteredRequests] = useState<HireRequest[]>([]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["hireRequests", currentPage, filterStatus],
    queryFn: () =>
      hireRequestService.getRequests(
        currentPage,
        null,
        filterStatus === "all" ? undefined : filterStatus || undefined
      ),
  });

  useEffect(() => {
    if (data) {
      setHasMore(data.hasMore);

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const filtered = data.requests.filter(
          (request) =>
            request.name.toLowerCase().includes(query) ||
            request.email.toLowerCase().includes(query) ||
            request.company.toLowerCase().includes(query) ||
            request.roleTitle.toLowerCase().includes(query) ||
            request.message.toLowerCase().includes(query) ||
            (request.location && request.location.toLowerCase().includes(query))
        );
        setFilteredRequests(filtered);
      } else {
        setFilteredRequests(data.requests);
      }
    }
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            New
          </span>
        );
      case "reviewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <Clock className="w-3 h-3" />
            Reviewed
          </span>
        );
      case "interviewing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
            <Users className="w-3 h-3" />
            Interviewing
          </span>
        );
      case "offered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3" />
            Offered
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/50 whitespace-nowrap">
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
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar className="h-9 w-9 border border-border/50 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(row.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground truncate">{row.name}</span>
            <span className="text-xs text-muted-foreground truncate">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Company & Role",
      cell: (row) => (
        <div className="flex flex-col gap-1 min-w-[180px]">
          <div className="flex items-center gap-1.5 font-medium text-sm text-foreground">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{row.company}</span>
          </div>
          <span className="text-xs text-muted-foreground truncate font-medium">
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
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
                empConfig.className
              )}
            >
              {empConfig.label}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
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
            <span className="font-semibold text-foreground flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {row.salaryRange}
            </span>
          ) : (
            <span className="text-muted-foreground italic">Negotiable / Unspecified</span>
          )}
          {row.location && (
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {row.location}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Date",
      cell: (row) => (
        <div className="flex flex-col text-xs text-muted-foreground min-w-[100px]">
          <span className="font-medium text-foreground">
            {format(new Date(row.createdAt), "dd MMM yyyy")}
          </span>
          <span>{format(new Date(row.createdAt), "HH:mm")} WIB</span>
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
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewRequest(row.id);
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-primary/10 hover:text-primary"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleViewRequest(row.id)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleUpdateStatus(row.id, "new")}>
                <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                Mark as New
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus(row.id, "reviewed")}>
                <Clock className="w-4 h-4 mr-2 text-amber-500" />
                Mark as Reviewed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus(row.id, "interviewing")}>
                <Users className="w-4 h-4 mr-2 text-purple-500" />
                Mark as Interviewing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus(row.id, "offered")}>
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                Mark as Offered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus(row.id, "rejected")}>
                <XCircle className="w-4 h-4 mr-2 text-rose-500" />
                Mark as Declined
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                onClick={() => setRequestToDelete(row)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
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
          <h1 className="text-2xl font-bold tracking-tight">Hire Inquiries</h1>
          <p className="text-sm text-muted-foreground">
            Recruitment messages, full-time offers, and direct hiring proposals from /hire-me.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", (isLoading || isRefetching) && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/50 bg-card/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Inquiries</span>
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">New / Unread</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">{stats.new}</p>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Interviewing</span>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600 dark:text-purple-400">
            {stats.interviewing}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Offered</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            {stats.offered}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-card/60"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val)}>
            <SelectTrigger className="w-full sm:w-44 h-9 bg-card/60">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
              <SelectItem value="rejected">Declined</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DataTable */}
      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={filteredRequests}
          isLoading={isLoading}
          loadingRows={5}
          onRowClick={(row) => handleViewRequest(row.id)}
          emptyState={{
            icon: <Inbox className="h-8 w-8 mb-2 text-muted-foreground/60" />,
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
          keyField="id"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={Boolean(requestToDelete)} onOpenChange={() => setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hire Inquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the inquiry from{" "}
              <strong>{requestToDelete?.name}</strong> at{" "}
              <strong>{requestToDelete?.company}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRequest}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
