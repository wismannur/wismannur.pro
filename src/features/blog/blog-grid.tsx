"use client";

import React from "react";
import { SearchIcon } from "lucide-react";
import { BlogCard } from "@/components/cards/blog-card";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import type { Blog } from "@/services";

interface BlogGridProps {
  isLoading: boolean;
  paginatedBlogs: Blog[];
  filteredBlogs: Blog[];
  clearFilters: () => void;
}

const BlogGrid = ({ isLoading, paginatedBlogs, clearFilters }: BlogGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[420px] rounded-3xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (paginatedBlogs.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {paginatedBlogs.map((blog, index) => (
          <BlogCard
            key={blog.id}
            blog={blog}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <SpotlightCard className="p-10 md:p-14 text-center rounded-3xl bg-[#0C0E18]/85 border border-white/[0.08] shadow-2xl backdrop-blur-xl">
      <div className="w-14 h-14 bg-primary/10 border border-primary/25 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary shadow-lg shadow-primary/20">
        <SearchIcon size={24} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No Articles Found</h3>
      <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
        No published essays or notes match your current search criteria. Try adjusting your search
        query or topic filter.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={clearFilters}
        className="rounded-full px-6 h-10 text-xs font-semibold border-white/[0.12] bg-white/[0.04] text-white hover:bg-primary/10 hover:border-primary/40"
      >
        Clear All Filters
      </Button>
    </SpotlightCard>
  );
};

export default BlogGrid;
