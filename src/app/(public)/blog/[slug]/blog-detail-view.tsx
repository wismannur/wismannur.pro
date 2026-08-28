"use client";

import { BlogCard } from "@/components/cards/blog-card";
import { TableOfContents } from "@/components/cards/table-of-contents";
import AuthorBio from "@/components/detail/author-bio";
import ContentHeader from "@/components/detail/content-header";
import ContentSkeleton from "@/components/detail/content-skeleton";
import FeaturedImage from "@/components/detail/featured-image";
import ReadingProgress from "@/components/detail/reading-progress";
import SocialShareBar from "@/components/detail/social-share-bar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useReadingProgress } from "@/hooks/use-reading-progress";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import { blogService } from "@/services";
import { formatTimestamp } from "@/services/firebase";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MDXPreview = dynamic(() => import("@/components/mdx/mdx-preview"), {
	ssr: false,
	loading: () => <ContentSkeleton />,
});

export function BlogDetailView({ slug }: { slug: string }) {
	const router = useRouter();
	const contentRef = useRef<HTMLDivElement>(null);
	const { scrollToHash } = useScrollToHash();
	const [isLiked, setIsLiked] = useState(false);

	// Use custom hooks
	const readingProgress = useReadingProgress(contentRef);

	// Fetch blog details
	const {
		data: blog,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["blog", slug],
		queryFn: () => blogService.getBySlug(slug || ""),
		enabled: !!slug,
	});

	// Fetch related blogs (using latest blogs as a simple substitute)
	const { data: relatedBlogs = [] } = useQuery({
		queryKey: ["relatedBlogs"],
		queryFn: () => blogService.getLatest(3),
		enabled: !!blog?.id,
	});

	// Increment view count
	const viewMutation = useMutation({
		mutationFn: () => blogService.incrementView(blog?.id || ""),
		onError: (error) => {
			console.error("Failed to increment view count:", error);
		},
	});

	// Like blog mutation
	const likeMutation = useMutation({
		mutationFn: () => blogService.incrementLike(blog?.id || ""),
		onSuccess: () => {
			setIsLiked(true);
			toast({
				title: "Thanks for your feedback!",
				description: "You liked this article.",
			});
		},
	});

	// Handle like button click
	const handleLike = () => {
		if (blog && !isLiked) {
			likeMutation.mutate();
		}
	};

	// Increment view count on component mount
	useEffect(() => {
		if (blog) {
			viewMutation.mutate();
			setTimeout(scrollToHash, 100);
		}
	}, [blog]);

	// Redirect if blog not found
	useEffect(() => {
		if (isError) {
			console.error("Blog not found:", error);
			router.replace("/blog");
		}
	}, [isError, router]);

	if (isLoading) {
		return <ContentSkeleton />;
	}

	if (!blog) return null;

	// Default reading time if not provided
	const readingTime = `${blog.readingTime ?? 10} min read`;

	// The latest-blogs list includes the article being viewed, so drop it before
	// deciding whether the section has anything to show.
	const relatedArticles = relatedBlogs.filter((related) => related.id !== blog.id).slice(0, 2);

	return (
		<div className="py-10">
			<ReadingProgress value={readingProgress} />

			<div className="container max-w-6xl px-4">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8">
					{/* Main Content */}
					<main className="lg:col-span-9">
						<article>
							<ContentHeader
								title={blog.title}
								tags={blog.tags}
								publishedDate={formatTimestamp(blog.publishedDate)}
								views={blog.views}
								readingTime={readingTime}
							/>

							<FeaturedImage image={blog.image} alt={blog.title} />

							{/* Blog Summary */}
							<div className="prose prose-lg max-w-none mb-8 animate-fade-in">
								<p className="text-xl text-muted-foreground leading-relaxed border-l-4 border-primary/50 pl-4 italic">
									{blog.summary}
								</p>
								<TableOfContents
									containerRef={contentRef}
									className="block lg:hidden my-8 bg-muted/20 rounded-xl border border-border/40"
								/>
								<Separator className="my-8" />
							</div>

							{/* Blog Content */}
							<MDXPreview code={blog.content} innerRef={contentRef} />

							<SocialShareBar
								id={blog.id}
								likes={blog.likes}
								isLiked={isLiked}
								onLike={handleLike}
								contentType="blog"
							/>

							<AuthorBio />
						</article>

						{/* Related Articles */}
						{relatedArticles.length > 0 && (
							<div className="mt-16 pt-8 border-t border-border animate-fade-in">
								<h2 className="text-2xl font-bold mb-8">Related Articles</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{relatedArticles.map((relatedBlog) => (
										<BlogCard key={relatedBlog.id} blog={relatedBlog} variant="compact" />
									))}
								</div>
							</div>
						)}
					</main>

					{/* Sidebar */}
					<aside className="hidden lg:block lg:col-span-3">
						<div className="sticky top-20 space-y-6">
							<TableOfContents
								containerRef={contentRef}
								className="bg-background border border-border/40 rounded-xl shadow-sm"
							/>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
}
