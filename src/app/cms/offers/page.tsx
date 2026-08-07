"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
	CalendarCog,
	Check,
	Eye,
	Filter,
	MoreHorizontal,
	Package,
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
import { offersService } from "@/services";
import type { Offer } from "@/services/offers/types";

// Number of offers to display per page (in-memory pagination)
const OFFERS_PER_PAGE = 10;

// Prices are integer IDR, shown without decimals: "Rp5.000.000".
const idrFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

export default function CmsOffersPage() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["cmsOffers"],
		queryFn: () => offersService.getAllForCms(),
	});

	// Reset to first page when the search query or filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, filterStatus]);

	// Apply status filter + search filtering in memory
	const matchedOffers = useMemo(() => {
		let list = data ?? [];

		if (filterStatus && filterStatus !== "all") {
			const isPublished = filterStatus === "published";
			list = list.filter((offer) => Boolean(offer.isPublished) === isPublished);
		}

		if (searchQuery) {
			const term = searchQuery.toLowerCase();
			list = list.filter(
				(offer) =>
					offer.title.toLowerCase().includes(term) ||
					offer.slug.toLowerCase().includes(term) ||
					offer.description.toLowerCase().includes(term) ||
					offer.forWho.toLowerCase().includes(term),
			);
		}

		return list;
	}, [data, filterStatus, searchQuery]);

	// In-memory pagination (no cursor)
	const pageStart = (currentPage - 1) * OFFERS_PER_PAGE;
	const filteredOffers = matchedOffers.slice(pageStart, pageStart + OFFERS_PER_PAGE);
	const hasMore = pageStart + OFFERS_PER_PAGE < matchedOffers.length;

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

	const handlePublishToggle = async (offerId: string, currentStatus: boolean) => {
		try {
			await offersService.update(offerId, { isPublished: !currentStatus });

			refetch();
			toast.success(currentStatus ? "Offer hidden from /offers" : "Offer published");
		} catch (error) {
			console.error("Error toggling publish status:", error);
			toast.error("Failed to update offer status");
		}
	};

	const handleDeleteOffer = async (offerId: string) => {
		try {
			await offersService.delete(offerId);

			refetch();
			setOfferToDelete(null);
			toast.success("Offer deleted successfully");
		} catch (error) {
			console.error("Error deleting offer:", error);
			toast.error("Failed to delete offer");
		}
	};

	// Define columns for DataTable
	const columns: ColumnDef<Offer>[] = [
		{
			header: "Offer",
			cell: (offer) => {
				const Icon = getContentIcon(offer.icon);
				return (
					<div className="flex items-start gap-3">
						<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
							<Icon className="h-4 w-4 text-primary" />
						</div>
						<div className="flex flex-col">
							<div className="font-medium flex items-center gap-2">
								{offer.title}
								{offer.isPopular && (
									<Badge variant="outline" className="text-primary border-primary">
										Popular
									</Badge>
								)}
							</div>
							<div className="text-sm text-muted-foreground">{offer.slug}</div>
						</div>
					</div>
				);
			},
			className: "w-[320px]",
		},
		{
			header: "Price",
			cell: (offer) => <span className="text-sm font-medium">{idrFormatter.format(offer.price)}</span>,
			className: "hidden sm:table-cell",
		},
		{
			header: "Status",
			cell: (offer) => (
				<div className="flex flex-col items-start gap-1">
					<Badge variant={offer.isPublished ? "default" : "secondary"}>
						{offer.isPublished ? "Published" : "Hidden"}
					</Badge>
					{offer.sortOrder !== 0 && (
						<span className="text-xs text-muted-foreground">Order: {offer.sortOrder}</span>
					)}
				</div>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Updated",
			cell: (offer) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<CalendarCog className="w-4 h-4 mr-1.5" />
					{formatDate(offer.updatedAt)}
				</div>
			),
			className: "hidden lg:table-cell",
		},
		{
			header: "Actions",
			cell: (offer) => (
				<div className="flex justify-end">
					<AlertDialog
						open={offerToDelete === offer.id}
						onOpenChange={(open) => !open && setOfferToDelete(null)}
					>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => router.push("/offers")}>
									<Eye className="h-4 w-4 mr-2" />
									View on Offers
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => router.push(`/cms/offers/form/${offer.id}`)}>
									<Pencil className="h-4 w-4 mr-2" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handlePublishToggle(offer.id, offer.isPublished)}
									className={offer.isPublished ? "text-destructive" : ""}
								>
									{offer.isPublished ? (
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
									onClick={() => setOfferToDelete(offer.id)}
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
									This action cannot be undone. This will permanently delete "{offer.title}" from
									your offers page.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									onClick={() => handleDeleteOffer(offer.id)}
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
					<h1 className="text-2xl font-bold tracking-tight">Offers</h1>
					<p className="text-muted-foreground">Manage the fixed-price packages on /offers</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
					<Button asChild>
						<Link href="/cms/offers/form">
							<Plus className="mr-2 h-4 w-4" />
							New Offer
						</Link>
					</Button>
				</div>
			</div>

			<div className="flex flex-col md:flex-row justify-between gap-4">
				<form onSubmit={handleSearch} className="relative w-full md:w-auto">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search offers..."
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
							<SelectItem value="all">All Offers</SelectItem>
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
				data={filteredOffers}
				isLoading={isLoading}
				keyField="id"
				emptyState={{
					icon: <Package className="h-8 w-8 mb-2" />,
					title: "No offers found",
					description: searchQuery
						? "Try adjusting your search query"
						: filterStatus && filterStatus !== "all"
							? `No ${filterStatus} offers found`
							: "Get started by adding your first offer",
				}}
				pagination={{
					currentPage,
					hasMore,
					onPageChange: handlePageChange,
				}}
				rowClassName={(offer) => (!offer.isPublished ? "bg-muted/30" : "")}
			/>
		</div>
	);
}
