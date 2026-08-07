"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
	Briefcase,
	CalendarCog,
	Check,
	Eye,
	Filter,
	GraduationCap,
	MapPin,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatResumePeriod } from "@/lib/resume";
import { formatDate } from "@/lib/utils";
import { resumeService, type ResumeEntry, type ResumeKind } from "@/services";

// Number of entries to display per page (in-memory pagination)
const ENTRIES_PER_PAGE = 10;

export default function CmsResumePage() {
	const router = useRouter();
	const [activeKind, setActiveKind] = useState<ResumeKind>("experience");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["resumeEntries"],
		queryFn: () => resumeService.getAllForCms(),
	});

	// Reset to first page when the tab, search query or filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [activeKind, searchQuery, filterStatus]);

	// Apply kind tab + status filter + search filtering in memory
	const matchedEntries = useMemo(() => {
		let list = (data ?? []).filter((entry) => entry.kind === activeKind);

		if (filterStatus && filterStatus !== "all") {
			const isPublished = filterStatus === "published";
			list = list.filter((entry) => Boolean(entry.isPublished) === isPublished);
		}

		if (searchQuery) {
			const term = searchQuery.toLowerCase();
			list = list.filter(
				(entry) =>
					entry.title.toLowerCase().includes(term) ||
					entry.organization.toLowerCase().includes(term) ||
					(entry.location ?? "").toLowerCase().includes(term) ||
					entry.description.toLowerCase().includes(term),
			);
		}

		return list;
	}, [data, activeKind, filterStatus, searchQuery]);

	// In-memory pagination (no cursor)
	const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
	const filteredEntries = matchedEntries.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
	const hasMore = pageStart + ENTRIES_PER_PAGE < matchedEntries.length;

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

	const handlePublishToggle = async (entryId: string, currentStatus: boolean) => {
		try {
			await resumeService.update(entryId, { isPublished: !currentStatus });

			refetch();
			toast.success(currentStatus ? "Entry hidden from /about" : "Entry published");
		} catch (error) {
			console.error("Error toggling publish status:", error);
			toast.error("Failed to update entry status");
		}
	};

	const handleDeleteEntry = async (entryId: string) => {
		try {
			await resumeService.delete(entryId);

			refetch();
			setEntryToDelete(null);
			toast.success("Entry deleted successfully");
		} catch (error) {
			console.error("Error deleting entry:", error);
			toast.error("Failed to delete entry");
		}
	};

	// Define columns for DataTable
	const columns: ColumnDef<ResumeEntry>[] = [
		{
			header: activeKind === "experience" ? "Role" : "Degree",
			cell: (entry) => (
				<div className="flex flex-col">
					<div className="font-medium">{entry.title}</div>
					<div className="text-sm text-muted-foreground">{entry.organization}</div>
					{entry.location && (
						<div className="text-xs text-muted-foreground mt-1 flex items-center">
							<MapPin className="w-3 h-3 mr-1" />
							{entry.location}
						</div>
					)}
				</div>
			),
			className: "w-[320px]",
		},
		{
			header: "Period",
			cell: (entry) => (
				<div className="flex flex-col gap-1">
					<span className="text-sm">{formatResumePeriod(entry)}</span>
					{entry.isCurrent && (
						<Badge variant="outline" className="w-fit text-primary border-primary">
							Ongoing
						</Badge>
					)}
				</div>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Status",
			cell: (entry) => (
				<div className="flex flex-col items-start gap-1">
					<Badge variant={entry.isPublished ? "default" : "secondary"}>
						{entry.isPublished ? "Published" : "Hidden"}
					</Badge>
					{entry.sortOrder !== 0 && (
						<span className="text-xs text-muted-foreground">Order: {entry.sortOrder}</span>
					)}
				</div>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Updated",
			cell: (entry) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<CalendarCog className="w-4 h-4 mr-1.5" />
					{formatDate(entry.updatedAt)}
				</div>
			),
			className: "hidden lg:table-cell",
		},
		{
			header: "Actions",
			cell: (entry) => (
				<div className="flex justify-end">
					<AlertDialog
						open={entryToDelete === entry.id}
						onOpenChange={(open) => !open && setEntryToDelete(null)}
					>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => router.push("/about")}>
									<Eye className="h-4 w-4 mr-2" />
									View on About
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => router.push(`/cms/resume/form/${entry.id}`)}>
									<Pencil className="h-4 w-4 mr-2" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handlePublishToggle(entry.id, entry.isPublished)}
									className={entry.isPublished ? "text-destructive" : ""}
								>
									{entry.isPublished ? (
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
									onClick={() => setEntryToDelete(entry.id)}
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
									This action cannot be undone. This will permanently delete "{entry.title}" at{" "}
									{entry.organization} from your about page.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									onClick={() => handleDeleteEntry(entry.id)}
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
					<h1 className="text-2xl font-bold tracking-tight">Resume</h1>
					<p className="text-muted-foreground">
						Manage the work experience and education shown on your about page
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
					<Button asChild>
						<Link href={`/cms/resume/form?kind=${activeKind}`}>
							<Plus className="mr-2 h-4 w-4" />
							New Entry
						</Link>
					</Button>
				</div>
			</div>

			<Tabs value={activeKind} onValueChange={(value) => setActiveKind(value as ResumeKind)}>
				<TabsList>
					<TabsTrigger value="experience">
						<Briefcase className="mr-2 h-4 w-4" />
						Experience
					</TabsTrigger>
					<TabsTrigger value="education">
						<GraduationCap className="mr-2 h-4 w-4" />
						Education
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<div className="flex flex-col md:flex-row justify-between gap-4">
				<form onSubmit={handleSearch} className="relative w-full md:w-auto">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search entries..."
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
							<SelectItem value="all">All Entries</SelectItem>
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
				data={filteredEntries}
				isLoading={isLoading}
				keyField="id"
				emptyState={{
					icon:
						activeKind === "experience" ? (
							<Briefcase className="h-8 w-8 mb-2" />
						) : (
							<GraduationCap className="h-8 w-8 mb-2" />
						),
					title: `No ${activeKind} entries found`,
					description: searchQuery
						? "Try adjusting your search query"
						: filterStatus && filterStatus !== "all"
							? `No ${filterStatus} entries found`
							: `Get started by adding your first ${activeKind} entry`,
				}}
				pagination={{
					currentPage,
					hasMore,
					onPageChange: handlePageChange,
				}}
				rowClassName={(entry) => (!entry.isPublished ? "bg-muted/30" : "")}
			/>
		</div>
	);
}
