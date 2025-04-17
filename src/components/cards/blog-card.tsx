import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { Blog } from "@/services";
import { ArrowRight, Calendar, Clock, Eye } from "lucide-react";
import type React from "react";
import { memo } from "react";
import { Link } from "react-router-dom";

interface BlogCardProps {
	blog: Blog;
	className?: string;
	style?: React.CSSProperties;
	variant?: "default" | "compact";
}

export const BlogCard = memo(
	({ blog, className, style, variant = "default" }: BlogCardProps) => {
		// Default reading time if not provided
		const readingTime = `${blog.readingTime ?? 10} min read`;

		if (variant === "compact") {
			return (
				<Link
					to={`/blog/${blog.slug}`}
					className={cn(
						"group flex gap-4 p-4 rounded-xl border border-border/40 bg-background hover:border-primary/30 hover:shadow-md transition-all duration-300",
						className,
					)}
					style={style}
				>
					<div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
						<img
							src={blog.image || "/placeholder.svg"}
							alt={blog.title}
							className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					</div>
					<div className="flex flex-col justify-between flex-1">
						<div>
							<h3 className="font-bold line-clamp-2 group-hover:text-primary transition-colors">
								{blog.title}
							</h3>
							<p className="text-xs text-muted-foreground mt-1 line-clamp-2">{blog.summary}</p>
						</div>
						<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
							<span className="flex items-center">
								<Calendar size={12} className="mr-1" />
								{formatDate(blog.publishedDate)}
							</span>
							<span className="mx-1">•</span>
							<span className="flex items-center">
								<Clock size={12} className="mr-1" />
								{readingTime}
							</span>
							<span className="mx-1">•</span>
							<span className="flex items-center">
								<Eye size={12} className="mr-1" />
								{blog.views} views
							</span>
						</div>
					</div>
				</Link>
			);
		}

		return (
			<div
				className={cn(
					"group overflow-hidden rounded-xl border border-border/40 bg-background hover:border-primary/30 hover:shadow-lg transition-all duration-300",
					className,
				)}
				style={style}
			>
				<Link to={`/blog/${blog.slug}`} className="block">
					<div className="aspect-video overflow-hidden">
						<img
							src={blog.image || "/placeholder.svg"}
							alt={blog.title}
							className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					</div>
				</Link>

				<div className="flex flex-col h-full max-h-64 p-5">
					<div className="flex flex-wrap gap-2 mb-3">
						{blog.tags.slice(0, 3).map((tag) => (
							<Link
								key={tag}
								to={`/blog?tag=${tag}`}
								className="px-2.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
								onClick={(e) => e.stopPropagation()}
							>
								{tag}
							</Link>
						))}
						{blog.tags.length > 3 && (
							<span className="px-2.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
								+{blog.tags.length - 3}
							</span>
						)}
					</div>

					<Link to={`/blog/${blog.slug}`} className="block">
						<h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
							{blog.title}
						</h3>
					</Link>

					<p className="text-muted-foreground mb-4 line-clamp-3">{blog.summary}</p>

					<div className="flex flex-col items-end justify-between mt-auto">
						<div className="w-full text-xs text-muted-foreground flex justify-between items-center mb-4">
							<span>
								<Calendar size={14} className="inline-block mr-1.5 -mt-0.5" />
								{formatDate(blog.publishedDate)}
							</span>
							<span className="mx-1">•</span>
							<span>
								<Clock size={14} className="inline-block mr-1.5 -mt-0.5" />
								{readingTime}
							</span>
							<span className="mx-1">•</span>
							<span>
								<Eye size={14} className="inline-block mr-1.5 -mt-0.5" />
								{blog.views} views
							</span>
						</div>

						<Button
							variant="ghost"
							size="sm"
							className="p-0 h-auto text-primary font-medium hover:bg-transparent hover:text-primary/80 group-hover:translate-x-1 transition-transform"
							asChild
						>
							<Link to={`/blog/${blog.slug}`}>
								Read more
								<ArrowRight size={14} className="ml-1" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.blog.id === nextProps.blog.id && prevProps.variant === nextProps.variant;
	},
);
