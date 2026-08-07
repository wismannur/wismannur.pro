"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
	CalendarCog,
	CalendarDays,
	Check,
	Eye,
	Filter,
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
import { availabilityService } from "@/services";
import type { AvailabilitySlot, AvailabilityStatus } from "@/services/availability/types";

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

const STATUS_BADGE_VARIANT: Record<AvailabilityStatus, "default" | "secondary" | "outline"> = {
	available: "default",
	limited: "secondary",
	booked: "outline",
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

	// Reset to first page when the search query or filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, filterStatus]);

	// Apply status filter + search filtering in memory
	const matchedSlots = useMemo(() => {
		let list = data ?? [];

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
					String(slot.year).includes(term),
			);
		}

		return list;
	}, [data, filterStatus, searchQuery]);

	// In-memory pagination (no cursor)
	const pageStart = (currentPage - 1) * SLOTS_PER_PAGE;
	const filteredSlots = matchedSlots.slice(pageStart, pageStart + SLOTS_PER_PAGE);
	const hasMore = pageStart + SLOTS_PER_PAGE < matchedSlots.length;

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
			header: "Month",
			cell: (slot) => (
				<div className="flex flex-col">
					<div className="font-medium">{formatMonth(slot)}</div>
					{slot.sortOrder !== 0 && (
						<span className="text-xs text-muted-foreground mt-1">Order: {slot.sortOrder}</span>
					)}
				</div>
			),
			className: "w-[200px]",
		},
		{
			header: "Status",
			cell: (slot) => (
				<Badge variant={STATUS_BADGE_VARIANT[slot.status] ?? "outline"}>{slot.label}</Badge>
			),
		},
		{
			header: "Published",
			cell: (slot) => (
				<Badge variant={slot.isPublished ? "default" : "secondary"}>
					{slot.isPublished ? "Published" : "Hidden"}
				</Badge>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Updated",
			cell: (slot) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<CalendarCog className="w-4 h-4 mr-1.5" />
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
									onClick={() => router.push(`/cms/availability/form/${slot.id}`)}
								>
									<Pencil className="h-4 w-4 mr-2" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handlePublishToggle(slot.id, slot.isPublished)}
									className={slot.isPublished ? "text-destructive" : ""}
								>
									{slot.isPublished ? (
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
									onClick={() => setSlotToDelete(slot.id)}
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
									This action cannot be undone. This will permanently delete the "
									{formatMonth(slot)}" slot from your hire-me page.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
			<div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Availability</h1>
					<p className="text-muted-foreground">
						Manage the availability slots shown on /hire-me
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
					<Button asChild>
						<Link href="/cms/availability/form">
							<Plus className="mr-2 h-4 w-4" />
							New Slot
						</Link>
					</Button>
				</div>
			</div>

			<div className="flex flex-col md:flex-row justify-between gap-4">
				<form onSubmit={handleSearch} className="relative w-full md:w-auto">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search slots..."
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
							<SelectItem value="all">All Slots</SelectItem>
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
				data={filteredSlots}
				isLoading={isLoading}
				keyField="id"
				emptyState={{
					icon: <CalendarDays className="h-8 w-8 mb-2" />,
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
				rowClassName={(slot) => (!slot.isPublished ? "bg-muted/30" : "")}
			/>
		</div>
	);
}
