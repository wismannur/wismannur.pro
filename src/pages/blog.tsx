import { usePagination } from "@/hooks/use-pagination";
import { blogService } from "@/services";
import { Blog } from "@/services/blog/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import Pagination from "@/components/common/pagination";
import { SEO } from "@/components/common/seo";
import { Skeleton } from "@/components/ui/skeleton";
import BlogFilters from "@/features/blog/blog-filters";
import BlogGrid from "@/features/blog/blog-grid";
import BlogHeader from "@/features/blog/blog-header";
import BlogResultsInfo from "@/features/blog/blog-results-info";

const ITEMS_PER_PAGE = 9;

const BlogPage = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedTag, setSelectedTag] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	// Fetch paginated blogs
	const { data: blogData, isLoading: isBlogsLoading } = useQuery<{
		blogs: Blog[];
		totalPages: number;
		currentPage: number;
	}>({
		queryKey: ["blogs", currentPage],
		queryFn: () => blogService.getByPage(currentPage, ITEMS_PER_PAGE),
	});

	// Fetch tags separately
	const { data: tagsData } = useQuery({
		queryKey: ["blogTags"],
		queryFn: () => blogService.getAllTags(),
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
	});

	// Memoize filtered blogs to prevent unnecessary recalculations
	const filteredBlogs = useMemo(() => {
		const blogs = (blogData?.blogs as Blog[]) || [];
		return blogs.filter((blog: Blog) => {
			const matchesSearch =
				!searchTerm ||
				blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				blog.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
				blog.content.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesTag = !selectedTag || blog.tags.includes(selectedTag);

			return matchesSearch && matchesTag;
		});
	}, [blogData?.blogs, searchTerm, selectedTag]);

	// Reset pagination when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, selectedTag]);

	// Clear all filters
	const clearFilters = () => {
		setSearchTerm("");
		setSelectedTag("");
		setCurrentPage(1);
	};

	const totalPages = blogData?.totalPages || 1;
	const pageNumbers = usePagination(currentPage, totalPages);

	// Skeleton loader for regular projects grid
	const BlogGridSkeleton = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="border border-border/40 rounded-lg p-4 space-y-4">
					<Skeleton className="h-48 w-full rounded-lg" />
					<Skeleton className="h-6 w-3/4" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<div className="flex gap-2">
						{Array.from({ length: 3 }).map((_, j) => (
							<Skeleton key={j} className="h-5 w-14 rounded-full" />
						))}
					</div>
				</div>
			))}
		</div>
	);

	return (
		<>
			<SEO
				title="Blog"
				description="Read my latest articles about web development, frontend engineering, and software development best practices"
				type="website"
			/>
			<div className="py-12 md:py-20">
				<div className="container px-4 max-w-6xl mx-auto">
					<BlogHeader />

					{/* Blog Filters and Results Info */}
					{isBlogsLoading ? (
						<div className="border border-border/40 rounded-lg p-4 space-y-4 mb-6">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : (
						<BlogFilters
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							selectedTag={selectedTag}
							setSelectedTag={setSelectedTag}
							allTags={tagsData?.tags || []}
						/>
					)}
					<BlogResultsInfo
						currentPage={currentPage}
						itemsPerPage={ITEMS_PER_PAGE}
						filteredCount={filteredBlogs.length}
						totalPages={totalPages}
						isLoading={isBlogsLoading}
					/>

					{isBlogsLoading ? (
						<BlogGridSkeleton />
					) : (
						<BlogGrid
							isLoading={isBlogsLoading}
							paginatedBlogs={filteredBlogs}
							filteredBlogs={filteredBlogs}
							clearFilters={clearFilters}
						/>
					)}

					{totalPages > 1 && (
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							pageNumbers={pageNumbers}
							setCurrentPage={setCurrentPage}
						/>
					)}
				</div>
			</div>
		</>
	);
};

export default BlogPage;
