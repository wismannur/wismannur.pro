"use client";

import React from "react";
import { Search } from "lucide-react";
import { BlogCard } from "@/components/cards/blog-card";
import { EmptyState } from "@/components/ui/empty-state";
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
            className="h-[400px] rounded-3xl bg-[#0C0E18]/60 border border-white/[0.06] animate-pulse"
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
    <EmptyState
      icon={Search}
      title="No Articles Found"
      description="No published essays or notes match your current search criteria. Try adjusting your search query or topic filter."
      action={{
        label: "Clear All Filters",
        onClick: clearFilters,
        variant: "outline",
      }}
    />
  );
};

export default BlogGrid;
