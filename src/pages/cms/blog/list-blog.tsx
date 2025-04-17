"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	limit,
	orderBy,
	query,
	startAfter,
	updateDoc,
	where,
	type DocumentData,
	type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
	CalendarArrowUp,
	CalendarCog,
	CalendarPlus,
	Check,
	Eye,
	FilePlus,
	FileText,
	Filter,
	MoreHorizontal,
	Pencil,
	RefreshCw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { CmsLayout } from "@/components/layout/cms-layout";
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
import Chip from "@/components/ui/chip";
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
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { formatDate } from "@/lib/utils";
import { Blog } from "@/services";

// Number of blogs to fetch per page
const BLOGS_PER_PAGE = 10;

const CmsBlogs = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);

	const fetchBlogs = async () => {
		try {
			// Build the query
			let blogsQuery = query(collection(db, "blogs"), orderBy("createdAt", "desc"));

			// Add status filter if provided
			if (filterStatus && filterStatus !== "all") {
				const isPublished = filterStatus === "published";
				blogsQuery = query(blogsQuery, where("isPublished", "==", isPublished));
			}

			// Add pagination
			if (lastVisible && currentPage > 1) {
				blogsQuery = query(blogsQuery, startAfter(lastVisible), limit(BLOGS_PER_PAGE));
			} else {
				blogsQuery = query(blogsQuery, limit(BLOGS_PER_PAGE));
			}

			// Execute the query
			const snapshot = await getDocs(blogsQuery);

			// Get the last visible document for pagination
			const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

			// Check if there are more results
			let hasMoreResults = false;
			if (lastVisibleDoc) {
				const nextQuery = query(
					collection(db, "blogs"),
					orderBy("createdAt", "desc"),
					startAfter(lastVisibleDoc),
					limit(1),
				);
				const nextSnapshot = await getDocs(nextQuery);
				hasMoreResults = !nextSnapshot.empty;
			}

			// Convert the documents to Blog objects
			const blogs = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Blog[];

			return {
				blogs,
				lastVisible: lastVisibleDoc,
				hasMore: hasMoreResults,
			};
		} catch (error) {
			console.error("Error fetching blogs:", error);
			throw error;
		}
	};

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["blogs", currentPage, filterStatus],
		queryFn: fetchBlogs,
		enabled: !!user,
	});

	// Update state when data changes
	useEffect(() => {
		if (data) {
			setLastVisible(data.lastVisible);
			setHasMore(data.hasMore);
		}
	}, [data]);

	// Apply client-side search filtering
	useEffect(() => {
		if (data?.blogs) {
			if (searchQuery) {
				const filtered = data.blogs.filter(
					(blog) =>
						blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						blog.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(blog.tags &&
							blog.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))),
				);
				setFilteredBlogs(filtered);
			} else {
				setFilteredBlogs(data.blogs);
			}
		}
	}, [data?.blogs, searchQuery]);

	// Reset to first page when search query or filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, filterStatus]);

	if (!user) {
		return <Navigate to="/auth" />;
	}

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleFilterChange = (value: string) => {
		setFilterStatus(value);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		// Search is applied client-side in the useEffect
	};

	const handlePublishToggle = async (blogId: string, currentStatus: boolean) => {
		try {
			const blogRef = doc(db, "blogs", blogId);
			await updateDoc(blogRef, {
				isPublished: !currentStatus,
				...(currentStatus ? {} : { publishedDate: new Date() }),
			});

			refetch();
			toast.success(currentStatus ? "Blog unpublished" : "Blog published");
		} catch (error) {
			console.error("Error toggling publish status:", error);
			toast.error("Failed to update blog status");
		}
	};

	const handleDeleteBlog = async (blogId: string) => {
		try {
			const blogRef = doc(db, "blogs", blogId);
			await deleteDoc(blogRef);

			refetch();
			setBlogToDelete(null);
			toast.success("Blog deleted successfully");
		} catch (error) {
			console.error("Error deleting blog:", error);
			toast.error("Failed to delete blog");
		}
	};

	// Define columns for DataTable
	const columns: ColumnDef<Blog>[] = [
		{
			header: "Title",
			cell: (blog) => (
				<div className="flex flex-col">
					<div className="font-medium">{blog.title}</div>
					<div className="text-sm text-muted-foreground truncate max-w-lg">{blog.summary}</div>
					<div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
						{blog.tags && blog.tags.slice(0, 3).map((tag) => <Chip key={tag}>{tag}</Chip>)}
						{blog.tags && blog.tags.length > 3 && <Chip>+{blog.tags.length - 3}</Chip>}
					</div>
				</div>
			),
			className: "w-[350px]",
		},
		{
			header: "Status",
			cell: (blog) => (
				<Badge variant={blog.isPublished ? "default" : "secondary"}>
					{blog.isPublished ? "Published" : "Draft"}
				</Badge>
			),
			className: "hidden w-8 md:table-cell",
		},
		{
			header: "Date",
			cell: (blog) => (
				<div className="flex flex-col gap-y-1">
					<div className="flex items-center text-muted-foreground text-sm">
						<CalendarArrowUp className="w-4 h-4 mr-1.5" />
						{formatDate(blog.publishedDate)}
					</div>
					<div className="flex items-center text-muted-foreground text-sm">
						<CalendarCog className="w-4 h-4 mr-1.5" />
						{formatDate(blog.updatedAt)}
					</div>
					<div className="flex items-center text-muted-foreground text-sm">
						<CalendarPlus className="w-4 h-4 mr-1.5" />
						{formatDate(blog.createdAt)}
					</div>
				</div>
			),
			className: "hidden !w-[170px] md:table-cell",
		},
		{
			header: "Stats",
			cell: (blog) => (
				<div className="text-sm">
					<div className="flex items-center gap-1">
						<Eye className="h-3.5 w-3.5 shrink-0" />
						<span>{blog.views || 0} views</span>
					</div>
				</div>
			),
			className: "hidden w-[130px] md:table-cell",
		},
		{
			header: "Actions",
			cell: (blog) => (
				<div className="flex justify-end">
					<AlertDialog
						open={blogToDelete === blog.id}
						onOpenChange={(open) => !open && setBlogToDelete(null)}
					>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => navigate(`/blog/${blog.slug}`)}>
									<Eye className="h-4 w-4 mr-2" />
									View
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => navigate(`/blog/edit/${blog.id}`)}>
									<Pencil className="h-4 w-4 mr-2" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handlePublishToggle(blog.id, blog.isPublished)}
									className={blog.isPublished ? "text-destructive" : ""}
								>
									{blog.isPublished ? (
										<>
											<X className="h-4 w-4 mr-2" />
											Unpublish
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
									onClick={() => setBlogToDelete(blog.id)}
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
									This action cannot be undone. This will permanently delete the blog post "
									{blog.title}" and remove it from our servers.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									onClick={() => handleDeleteBlog(blog.id)}
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
		<CmsLayout>
			<div className="space-y-6">
				<div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
						<p className="text-muted-foreground">Manage and publish your blog content</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
						<Button asChild>
							<Link to="/blog/new">
								<FilePlus className="mr-2 h-4 w-4" />
								New Blog Post
							</Link>
						</Button>
					</div>
				</div>

				<div className="flex flex-col md:flex-row justify-between gap-4">
					<form onSubmit={handleSearch} className="relative w-full md:w-auto">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search blogs..."
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
								<SelectItem value="all">All Posts</SelectItem>
								<SelectItem value="published">Published</SelectItem>
								<SelectItem value="draft">Drafts</SelectItem>
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
					data={filteredBlogs}
					isLoading={isLoading}
					keyField="id"
					emptyState={{
						icon: <FileText className="h-8 w-8 mb-2" />,
						title: "No blog posts found",
						description: searchQuery
							? "Try adjusting your search query"
							: filterStatus && filterStatus !== "all"
								? `No ${filterStatus} blog posts found`
								: "Get started by creating your first blog post",
					}}
					pagination={{
						currentPage,
						hasMore,
						onPageChange: handlePageChange,
					}}
					rowClassName={(blog) => (!blog.isPublished ? "bg-muted/30" : "")}
				/>
			</div>
		</CmsLayout>
	);
};

export default CmsBlogs;
