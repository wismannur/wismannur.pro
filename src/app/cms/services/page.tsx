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
import { serviceRequestService, type ServiceRequest } from "@/services";

const SERVICE_TYPE_CONFIG: Record<
	string,
	{ label: string; icon: React.ElementType; className: string }
> = {
	frontend: {
		label: "Frontend Development",
		icon: Code2,
		className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
	},
	"ui-ux": {
		label: "UI/UX Implementation",
		icon: Layout,
		className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
	},
	performance: {
		label: "Performance Optimization",
		icon: Zap,
		className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
	},
	api: {
		label: "API Integration",
		icon: Network,
		className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
	},
	animation: {
		label: "Web Animation",
		icon: Sparkles,
		className: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
	},
	leadership: {
		label: "Technical Leadership",
		icon: Users,
		className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
	},
};

const TIMEFRAME_CONFIG: Record<
	string,
	{ label: string; icon: React.ElementType; className: string }
> = {
	asap: {
		label: "As soon as possible",
		icon: Flame,
		className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
	},
	"1-2-weeks": {
		label: "Within 1-2 weeks",
		icon: Timer,
		className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
	},
	"1-month": {
		label: "Within a month",
		icon: Calendar,
		className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
	},
	flexible: {
		label: "Flexible / Not urgent",
		icon: Clock,
		className: "bg-muted/50 text-muted-foreground border-border/50",
	},
};

export default function CmsServicesPage() {
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [requestToDelete, setRequestToDelete] = useState<ServiceRequest | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["serviceRequests", currentPage, filterStatus],
		queryFn: () =>
			serviceRequestService.getRequests(
				currentPage,
				null,
				filterStatus === "all" ? undefined : filterStatus || undefined,
			),
	});

	useEffect(() => {
		if (data) {
			setHasMore(data.hasMore);

			// Apply client-side search filtering
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const filtered = data.requests.filter(
					(request) =>
						request.name.toLowerCase().includes(query) ||
						request.email.toLowerCase().includes(query) ||
						request.serviceType.toLowerCase().includes(query) ||
						(request.company && request.company.toLowerCase().includes(query)) ||
						request.projectDetails.toLowerCase().includes(query),
				);
				setFilteredRequests(filtered);
			} else {
				setFilteredRequests(data.requests);
			}
		}
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
		status: "new" | "in-progress" | "completed" | "cancelled",
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
			toast.success("Service request berhasil dihapus");
			setRequestToDelete(null);
			refetch();
		} catch (error) {
			console.error("Error deleting service request:", error);
			toast.error("Gagal menghapus service request");
		} finally {
			setIsDeleting(false);
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
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
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
						<span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
						New
					</span>
				);
			case "in-progress":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
						<span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
						In Progress
					</span>
				);
			case "completed":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
						Completed
					</span>
				);
			case "cancelled":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
						<span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
						Cancelled
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
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
						<Avatar className="h-9 w-9 shrink-0 border border-border/60 bg-muted/60 group-hover/client:border-primary/40 transition-colors">
							<AvatarFallback
								className={cn(
									"font-semibold text-xs transition-colors",
									isNew
										? "bg-primary/15 text-primary group-hover/client:bg-primary/25"
										: "bg-muted text-muted-foreground group-hover/client:text-foreground",
								)}
							>
								{getInitials(request.name)}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col min-w-0">
							<div className="flex items-center gap-1.5">
								<span className="font-semibold text-foreground text-sm truncate max-w-[170px] group-hover/client:text-primary transition-colors">
									{request.name}
								</span>
								{isNew && (
									<span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-500 dark:text-blue-400">
										NEW
									</span>
								)}
							</div>
							<span
								onClick={(e) => {
									e.stopPropagation();
									window.open(`mailto:${request.email}`, "_self");
								}}
								className="text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-[180px]"
								title={request.email}
							>
								{request.email}
							</span>
							{request.company && (
								<div
									className="flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-0.5 truncate max-w-[180px]"
									title={request.company}
								>
									<Building2 className="h-3 w-3 shrink-0 text-muted-foreground/60" />
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
					className: "bg-primary/10 text-primary border-primary/20",
				};
				const Icon = config.icon;
				return (
					<div className="flex flex-col gap-1 py-1 min-w-0">
						<div className="flex items-center">
							<Badge
								variant="outline"
								className={cn(
									"text-xs font-medium px-2 py-0.5 inline-flex items-center gap-1.5 rounded-md",
									config.className,
								)}
							>
								<Icon className="h-3 w-3 shrink-0" />
								<span className="truncate max-w-[170px]">{config.label}</span>
							</Badge>
						</div>
						{request.projectDetails && (
							<p
								className="text-xs text-muted-foreground/80 line-clamp-1 max-w-[240px]"
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
					className: "bg-muted/40 text-muted-foreground border-border/50",
				};
				const TimeframeIcon = timeframeConfig.icon;

				return (
					<div className="flex flex-col gap-1 py-0.5 min-w-0">
						<div className="inline-flex items-center gap-1 text-xs font-semibold text-foreground whitespace-nowrap">
							<DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0 -mr-0.5" />
							<span className="tabular-nums">{getBudgetLabel(request.budget)}</span>
						</div>
						<div className="flex items-center">
							<Badge
								variant="outline"
								className={cn(
									"text-[11px] font-medium px-1.5 py-0 inline-flex items-center gap-1 rounded whitespace-nowrap",
									timeframeConfig.className,
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
						<span className="font-medium text-foreground whitespace-nowrap">
							{format(createdDate, "dd MMM yyyy")}
						</span>
						<span className="text-[11px] text-muted-foreground flex items-center gap-1 whitespace-nowrap mt-0.5">
							<Clock className="h-3 w-3 text-muted-foreground/60" />
							{format(createdDate, "HH:mm")}
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
				<div
					className="flex items-center justify-end"
					onClick={(e) => e.stopPropagation()}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
							>
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem onClick={() => handleViewRequest(request.id)}>
								<Eye className="h-4 w-4 mr-2" />
								View Details & Thread
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => handleUpdateStatus(request.id, "in-progress")}
								disabled={request.status === "in-progress"}
							>
								<Clock className="h-4 w-4 mr-2 text-purple-500" />
								Set In Progress
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleUpdateStatus(request.id, "completed")}
								disabled={request.status === "completed"}
							>
								<CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
								Mark Completed
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleUpdateStatus(request.id, "cancelled")}
								disabled={request.status === "cancelled"}
							>
								<XCircle className="h-4 w-4 mr-2 text-rose-500" />
								Cancel Request
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setRequestToDelete(request)}
								className="text-destructive focus:text-destructive focus:bg-destructive/10"
							>
								<Trash2 className="h-4 w-4 mr-2" />
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
					<h1 className="text-2xl font-bold tracking-tight">Service Requests</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Manage, review, and respond to incoming service inquiries from clients
					</p>
				</div>
			</div>

			{/* Metric Overview Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<button
					type="button"
					onClick={() => handleFilterChange("all")}
					className={cn(
						"cursor-pointer rounded-xl border p-3.5 text-left transition-all bg-card/50 hover:bg-card hover:border-border",
						filterStatus === "all" || !filterStatus
							? "ring-1 ring-primary/40 border-primary/40 shadow-xs"
							: "border-border/60",
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Total Requests</span>
						<Briefcase className="h-4 w-4 text-muted-foreground/60" />
					</div>
					<div className="text-2xl font-bold mt-1.5 tracking-tight">{stats.total}</div>
				</button>

				<button
					type="button"
					onClick={() => handleFilterChange("new")}
					className={cn(
						"cursor-pointer rounded-xl border p-3.5 text-left transition-all bg-card/50 hover:bg-card hover:border-blue-500/40",
						filterStatus === "new"
							? "ring-1 ring-blue-500/40 border-blue-500/40 bg-blue-500/5 shadow-xs"
							: "border-border/60",
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">New Requests</span>
						<span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
					</div>
					<div className="text-2xl font-bold mt-1.5 tracking-tight text-blue-500">
						{stats.new}
					</div>
				</button>

				<button
					type="button"
					onClick={() => handleFilterChange("in-progress")}
					className={cn(
						"cursor-pointer rounded-xl border p-3.5 text-left transition-all bg-card/50 hover:bg-card hover:border-purple-500/40",
						filterStatus === "in-progress"
							? "ring-1 ring-purple-500/40 border-purple-500/40 bg-purple-500/5 shadow-xs"
							: "border-border/60",
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">In Progress</span>
						<Clock className="h-4 w-4 text-purple-500" />
					</div>
					<div className="text-2xl font-bold mt-1.5 tracking-tight text-purple-500">
						{stats.inProgress}
					</div>
				</button>

				<button
					type="button"
					onClick={() => handleFilterChange("completed")}
					className={cn(
						"cursor-pointer rounded-xl border p-3.5 text-left transition-all bg-card/50 hover:bg-card hover:border-emerald-500/40",
						filterStatus === "completed"
							? "ring-1 ring-emerald-500/40 border-emerald-500/40 bg-emerald-500/5 shadow-xs"
							: "border-border/60",
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Completed</span>
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
					</div>
					<div className="text-2xl font-bold mt-1.5 tracking-tight text-emerald-500">
						{stats.completed}
					</div>
				</button>
			</div>

			{/* Search & Filter Bar */}
			<div className="flex flex-col sm:flex-row justify-between gap-3">
				<form onSubmit={handleSearch} className="relative w-full sm:w-[320px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by client, service, company..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 w-full rounded-lg text-xs"
					/>
				</form>

				<div className="flex items-center gap-2.5">
					<Select value={filterStatus} onValueChange={handleFilterChange}>
						<SelectTrigger className="w-full sm:w-[170px] rounded-lg text-xs">
							<div className="flex items-center gap-1.5 truncate">
								<Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
								<SelectValue placeholder="All Statuses" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all" className="text-xs">
								All Requests
							</SelectItem>
							<SelectItem value="new" className="text-xs">
								New
							</SelectItem>
							<SelectItem value="in-progress" className="text-xs">
								In Progress
							</SelectItem>
							<SelectItem value="completed" className="text-xs">
								Completed
							</SelectItem>
							<SelectItem value="cancelled" className="text-xs">
								Cancelled
							</SelectItem>
						</SelectContent>
					</Select>

					<Button
						variant="outline"
						size="icon"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="rounded-lg shrink-0"
						title="Refresh Table"
					>
						<RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
						<span className="sr-only">Refresh</span>
					</Button>
				</div>
			</div>

			{/* Data Table */}
			<DataTable
				columns={columns}
				data={filteredRequests}
				isLoading={isLoading}
				loadingRows={5}
				emptyState={{
					icon: <Inbox className="h-8 w-8 mb-2 text-muted-foreground/60" />,
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
						"transition-colors hover:bg-muted/50 cursor-pointer",
						request.status === "new" && "bg-blue-500/[0.03] dark:bg-blue-500/[0.04]",
					)
				}
				keyField="id"
			/>

			{/* Delete Confirmation Alert Dialog */}
			<AlertDialog
				open={Boolean(requestToDelete)}
				onOpenChange={(open) => !open && setRequestToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Service Request?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Permintaan layanan dari{" "}
							<strong className="text-foreground">{requestToDelete?.name}</strong> (
							{requestToDelete?.email}) untuk layanan{" "}
							<strong className="text-foreground">{requestToDelete?.serviceType}</strong>{" "}
							beserta seluruh riwayat balasan email akan dihapus secara permanen.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDeleteRequest}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Menghapus...
								</>
							) : (
								"Hapus"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
