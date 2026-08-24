"use client";

import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn, formatDate } from "@/lib/utils";
import type { Blog } from "@/services";
import { ArrowRight, Calendar, Clock, Eye } from "lucide-react";
import type React from "react";
import { memo } from "react";
import Link from "next/link";

interface BlogCardProps {
	blog: Blog;
	className?: string;
	style?: React.CSSProperties;
	variant?: "default" | "compact";
}

export const BlogCard = memo(
	({ blog, className, style, variant = "default" }: BlogCardProps) => {
		const readingTime = `${blog.readingTime ?? 10} min read`;

		if (variant === "compact") {
			return (
				<SpotlightCard
					className={cn(
						"group flex gap-4 p-4 rounded-2xl border border-border/40 bg-card/60 hover:border-primary/40 hover:shadow-lg transition-all duration-300",
						className,
					)}
					style={style}
				>
					<Link
						href={`/blog/${blog.slug}`}
						data-umami-event="blog-card-compact-click"
						data-umami-event-slug={blog.slug}
						className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted/40"
					>
						<img
							src={blog.image || "/placeholder.svg"}
							alt={blog.title}
							className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					</Link>
					<div className="flex flex-col justify-between flex-1">
						<div>
							<Link
								href={`/blog/${blog.slug}`}
								data-umami-event="blog-card-compact-click"
								data-umami-event-slug={blog.slug}
							>
								<h3 className="font-bold line-clamp-2 group-hover:text-primary transition-colors">
									{blog.title}
								</h3>
							</Link>
							<p className="text-xs text-muted-foreground mt-1 line-clamp-2">{blog.summary}</p>
						</div>
						<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
							<span className="flex items-center">
								<Calendar size={12} className="mr-1 text-primary/70" />
								{formatDate(blog.publishedDate)}
							</span>
							<span>•</span>
							<span className="flex items-center">
								<Clock size={12} className="mr-1 text-primary/70" />
								{readingTime}
							</span>
						</div>
					</div>
				</SpotlightCard>
			);
		}

		return (
			<SpotlightCard
				className={cn(
					"group flex flex-col h-full overflow-hidden rounded-2xl border border-border/40 bg-card/60 hover:border-primary/40 hover:shadow-xl transition-all duration-300",
					className,
				)}
				style={style}
			>
				<Link
					href={`/blog/${blog.slug}`}
					data-umami-event="blog-card-image-click"
					data-umami-event-slug={blog.slug}
					className="block aspect-video overflow-hidden bg-muted/30 relative"
				>
					<img
						src={blog.image || "/placeholder.svg"}
						alt={blog.title}
						className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
				</Link>

				<div className="flex flex-col flex-1 justify-between p-6">
					<div>
						<div className="flex flex-wrap gap-1.5 mb-3">
							{blog.tags.slice(0, 3).map((tag) => (
								<Link
									key={tag}
									href={`/blog?tag=${tag}`}
									data-umami-event="blog-card-tag-click"
									data-umami-event-tag={tag}
									className="px-2.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
									onClick={(e) => e.stopPropagation()}
								>
									{tag}
								</Link>
							))}
							{blog.tags.length > 3 && (
								<span className="px-2.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground border border-border/50">
									+{blog.tags.length - 3}
								</span>
							)}
						</div>

						<Link
							href={`/blog/${blog.slug}`}
							data-umami-event="blog-card-title-click"
							data-umami-event-slug={blog.slug}
							className="block group/title"
						>
							<h3 className="text-xl font-bold tracking-tight mb-2 line-clamp-2 text-foreground group-hover/title:text-primary transition-colors">
								{blog.title}
							</h3>
						</Link>

						<p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed mb-4">
							{blog.summary}
						</p>
					</div>

					<div className="pt-4 border-t border-border/40 mt-auto">
						<div className="w-full text-xs text-muted-foreground flex justify-between items-center mb-3">
							<span className="flex items-center">
								<Calendar size={12} className="mr-1 text-primary/70" />
								{formatDate(blog.publishedDate)}
							</span>
							<span>•</span>
							<span className="flex items-center">
								<Clock size={12} className="mr-1 text-primary/70" />
								{readingTime}
							</span>
							<span>•</span>
							<span className="flex items-center">
								<Eye size={12} className="mr-1 text-primary/70" />
								{blog.views.toLocaleString()}
							</span>
						</div>

						<div className="flex justify-end">
							<Button
								variant="ghost"
								size="sm"
								className="text-xs text-primary font-medium p-0 hover:bg-transparent hover:text-primary/80 group-hover:translate-x-1 transition-transform"
								asChild
							>
								<Link
									href={`/blog/${blog.slug}`}
									data-umami-event="blog-card-readmore-click"
									data-umami-event-slug={blog.slug}
								>
									Read Article
									<ArrowRight size={13} className="ml-1" />
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</SpotlightCard>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.blog.id === nextProps.blog.id && prevProps.variant === nextProps.variant;
	},
);

BlogCard.displayName = "BlogCard";
