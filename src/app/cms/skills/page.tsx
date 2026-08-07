"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
	CalendarCog,
	Check,
	Eye,
	Filter,
	MoreHorizontal,
	Pencil,
	Plus,
	RefreshCw,
	Search,
	Trash2,
	Wrench,
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
import { skillsService, type Skill } from "@/services";

// Number of entries to display per page (in-memory pagination)
const ENTRIES_PER_PAGE = 10;

export default function CmsSkillsPage() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["cmsSkills"],
		queryFn: () => skillsService.getAllForCms(),
	});

	// Reset to first page when the search query or filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, filterStatus]);

	// Apply status filter + search filtering in memory
	const matchedSkills = useMemo(() => {
		let list = data ?? [];

		if (filterStatus && filterStatus !== "all") {
			const isPublished = filterStatus === "published";
			list = list.filter((skill) => Boolean(skill.isPublished) === isPublished);
		}

		if (searchQuery) {
			const term = searchQuery.toLowerCase();
			list = list.filter((skill) => skill.name.toLowerCase().includes(term));
		}

		return list;
	}, [data, filterStatus, searchQuery]);

	// In-memory pagination (no cursor)
	const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
	const filteredSkills = matchedSkills.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
	const hasMore = pageStart + ENTRIES_PER_PAGE < matchedSkills.length;

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

	const handlePublishToggle = async (skillId: string, currentStatus: boolean) => {
		try {
			await skillsService.update(skillId, { isPublished: !currentStatus });

			refetch();
			toast.success(currentStatus ? "Skill hidden from /about" : "Skill published");
		} catch (error) {
			console.error("Error toggling publish status:", error);
			toast.error("Failed to update skill status");
		}
	};

	const handleDeleteSkill = async (skillId: string) => {
		try {
			await skillsService.delete(skillId);

			refetch();
			setSkillToDelete(null);
			toast.success("Skill deleted successfully");
		} catch (error) {
			console.error("Error deleting skill:", error);
			toast.error("Failed to delete skill");
		}
	};

	// Define columns for DataTable
	const columns: ColumnDef<Skill>[] = [
		{
			header: "Name",
			cell: (skill) => (
				<div className="flex flex-col">
					<div className="font-medium">{skill.name}</div>
					<div className="text-sm text-muted-foreground">Order: {skill.sortOrder}</div>
				</div>
			),
			className: "w-[320px]",
		},
		{
			header: "Status",
			cell: (skill) => (
				<Badge variant={skill.isPublished ? "default" : "secondary"}>
					{skill.isPublished ? "Published" : "Hidden"}
				</Badge>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Updated",
			cell: (skill) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<CalendarCog className="w-4 h-4 mr-1.5" />
					{formatDate(skill.updatedAt)}
				</div>
			),
			className: "hidden lg:table-cell",
		},
		{
			header: "Actions",
			cell: (skill) => (
				<div className="flex justify-end">
					<AlertDialog
						open={skillToDelete === skill.id}
						onOpenChange={(open) => !open && setSkillToDelete(null)}
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
								<DropdownMenuItem onClick={() => router.push(`/cms/skills/form/${skill.id}`)}>
									<Pencil className="h-4 w-4 mr-2" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handlePublishToggle(skill.id, skill.isPublished)}
									className={skill.isPublished ? "text-destructive" : ""}
								>
									{skill.isPublished ? (
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
									onClick={() => setSkillToDelete(skill.id)}
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
									This action cannot be undone. This will permanently delete "{skill.name}" from
									your about page.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									onClick={() => handleDeleteSkill(skill.id)}
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
					<h1 className="text-2xl font-bold tracking-tight">Skills</h1>
					<p className="text-muted-foreground">
						Manage the skills grid shown on your about page
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
					<Button asChild>
						<Link href="/cms/skills/form">
							<Plus className="mr-2 h-4 w-4" />
							New Skill
						</Link>
					</Button>
				</div>
			</div>

			<div className="flex flex-col md:flex-row justify-between gap-4">
				<form onSubmit={handleSearch} className="relative w-full md:w-auto">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search skills..."
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
							<SelectItem value="all">All Skills</SelectItem>
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
				data={filteredSkills}
				isLoading={isLoading}
				keyField="id"
				emptyState={{
					icon: <Wrench className="h-8 w-8 mb-2" />,
					title: "No skills found",
					description: searchQuery
						? "Try adjusting your search query"
						: filterStatus && filterStatus !== "all"
							? `No ${filterStatus} skills found`
							: "Get started by adding your first skill",
				}}
				pagination={{
					currentPage,
					hasMore,
					onPageChange: handlePageChange,
				}}
				rowClassName={(skill) => (!skill.isPublished ? "bg-muted/30" : "")}
			/>
		</div>
	);
}
