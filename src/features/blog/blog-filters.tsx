"use client";

import React from "react";
import { SearchIcon, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";

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
    <SpotlightCard className="p-4 sm:p-5 md:p-6 mb-8 md:mb-10 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.08] shadow-2xl backdrop-blur-xl">
      <div className="space-y-4">
        <div className="relative w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <SearchIcon size={16} />
          </div>
          <Input
            placeholder="Search articles by title, topic, or keyword..."
            className="pl-10 rounded-xl bg-black/40 border-white/[0.1] text-white placeholder:text-gray-500 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 text-xs sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              data-umami-event="blog-filter-clear-search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2 pt-1">
          <div className="flex items-center mr-2 text-gray-300 font-semibold text-xs">
            <Filter size={14} className="mr-1.5 text-primary" />
            <span>Topics:</span>
          </div>
          <button
            type="button"
            onClick={() => handleTagClick(null)}
            data-umami-event="blog-filter-all"
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
              selectedTag === null || selectedTag === ""
                ? "bg-primary text-white border-primary shadow-md shadow-primary/25 font-semibold"
                : "bg-white/[0.03] text-gray-300 border-white/[0.08] hover:border-primary/40 hover:bg-white/[0.06]"
            )}
          >
            All Topics
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(isSelected ? null : tag)}
                data-umami-event="blog-filter-tag-click"
                data-umami-event-tag={tag}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border flex items-center gap-1.5",
                  isSelected
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/25 font-semibold"
                    : "bg-white/[0.03] text-gray-300 border-white/[0.08] hover:border-primary/40 hover:bg-white/[0.06]"
                )}
              >
                <span>{tag}</span>
                {isSelected && <X size={12} className="text-white" />}
              </button>
            );
          })}
        </div>

        {/* Active filters display */}
        {(searchTerm || (selectedTag && selectedTag !== "")) && (
          <div className="pt-3 border-t border-white/[0.08] flex items-center flex-wrap gap-2 text-xs">
            <span className="text-gray-400">Active filters:</span>
            {searchTerm && (
              <div className="bg-primary/10 border border-primary/25 text-primary rounded-full px-3 py-1 flex items-center font-semibold">
                <span className="mr-1">Search: &ldquo;{searchTerm}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  data-umami-event="blog-filter-clear-search-chip"
                  className="ml-1.5 hover:text-white"
                  aria-label="Clear search filter"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {selectedTag && selectedTag !== "" && (
              <div className="bg-primary/10 border border-primary/25 text-primary rounded-full px-3 py-1 flex items-center font-semibold">
                <span className="mr-1">Topic: {selectedTag}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  data-umami-event="blog-filter-clear-tag-chip"
                  data-umami-event-tag={selectedTag}
                  className="ml-1.5 hover:text-white"
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
      </div>
    </SpotlightCard>
  );
};

export default BlogFilters;
