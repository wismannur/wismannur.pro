"use client";

import React from "react";
import { SearchIcon, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { trackEvent } from "@/lib/umami";

interface BlogFiltersProps {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	selectedTag: string | null;
	setSelectedTag: (tag: string | null) => void;
	allTags: string[];
}

const BlogFilters = ({
	searchTerm,
	setSearchTerm,
	selectedTag,
	setSelectedTag,
	allTags,
}: BlogFiltersProps) => {
	const handleTagClick = (tag: string | null) => {
		setSelectedTag(tag);
		trackEvent("blog-filter-tag", { tag: tag ?? "all" });
	};

	return (
		<SpotlightCard className="p-5 md:p-6 mb-12 rounded-2xl bg-card/60 border border-border/50 shadow-sm">
			<div className="flex flex-col justify-between gap-5">
				<div className="relative w-full">
					<div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
						<SearchIcon size={16} />
					</div>
					<Input
						placeholder="Search articles by title, topic, or keyword..."
						className="pl-10 rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<button
							type="button"
							onClick={() => setSearchTerm("")}
							data-umami-event="blog-filter-clear-search"
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label="Clear search"
						>
							<X size={16} />
						</button>
					)}
				</div>

				<div className="flex items-center flex-wrap gap-2">
					<div className="flex items-center mr-2 text-foreground font-medium text-xs md:text-sm">
						<Filter size={15} className="mr-1.5 text-primary" />
						<span>Topics:</span>
					</div>
					<Button
						variant={selectedTag === null ? "default" : "outline"}
						size="sm"
						onClick={() => handleTagClick(null)}
						data-umami-event="blog-filter-all"
						className="rounded-full px-3.5 h-8 text-xs font-semibold"
					>
						All Topics
					</Button>
					{allTags.map((tag) => (
						<Button
							key={tag}
							variant={selectedTag === tag ? "default" : "outline"}
							size="sm"
							onClick={() => handleTagClick(tag === selectedTag ? null : tag)}
							data-umami-event="blog-filter-tag-click"
							data-umami-event-tag={tag}
							className="rounded-full px-3.5 h-8 text-xs font-medium group border-border/60"
						>
							<span>{tag}</span>
							{selectedTag === tag && (
								<X size={13} className="ml-1.5 group-hover:text-red-500" />
							)}
						</Button>
					))}
				</div>
			</div>

			{/* Active filters display */}
			{(searchTerm || selectedTag) && (
				<div className="mt-4 pt-4 border-t border-border/40 flex items-center flex-wrap gap-2 text-xs">
					<span className="text-muted-foreground">Active filters:</span>
					{searchTerm && (
						<div className="bg-primary/10 border border-primary/20 text-primary rounded-full px-3 py-1 flex items-center font-medium">
							<span className="mr-1">Search: &ldquo;{searchTerm}&rdquo;</span>
							<button
								type="button"
								onClick={() => setSearchTerm("")}
								data-umami-event="blog-filter-clear-search-chip"
								className="ml-1.5 hover:text-red-500"
								aria-label="Clear search filter"
							>
								<X size={12} />
							</button>
						</div>
					)}
					{selectedTag && (
						<div className="bg-primary/10 border border-primary/20 text-primary rounded-full px-3 py-1 flex items-center font-medium">
							<span className="mr-1">Tag: {selectedTag}</span>
							<button
								type="button"
								onClick={() => setSelectedTag(null)}
								data-umami-event="blog-filter-clear-tag-chip"
								data-umami-event-tag={selectedTag}
								className="ml-1.5 hover:text-red-500"
								aria-label="Clear tag filter"
							>
								<X size={12} />
							</button>
						</div>
					)}
					<button
						type="button"
						onClick={() => {
							setSearchTerm("");
							setSelectedTag(null);
						}}
						data-umami-event="blog-filter-clear-all"
						className="text-primary hover:underline ml-2 font-medium"
					>
						Clear all
					</button>
				</div>
			)}
		</SpotlightCard>
	);
};

export default BlogFilters;
