"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/hooks/use-pagination";
import { blogService } from "@/services";
import type { Blog } from "@/services/blog/types";
import type { ListHeaderCopy } from "@/services/page-copy/types";
import type { SiteSettings } from "@/services/site-settings/types";

import Pagination from "@/components/common/pagination";
import { CtaV2 } from "@/components/home-v2/cta-v2";
import BlogFilters from "@/features/blog/blog-filters";
import BlogGrid from "@/features/blog/blog-grid";
import BlogHeader from "@/features/blog/blog-header";
import BlogResultsInfo from "@/features/blog/blog-results-info";

const ITEMS_PER_PAGE = 9;

interface BlogViewProps {
  copy: ListHeaderCopy | null;
  settings?: SiteSettings;
}

export const BlogView = ({ copy, settings }: BlogViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
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
    staleTime: 5 * 60 * 1000,
  });

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleTagChange = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  // Memoize filtered blogs to prevent unnecessary recalculations
  const filteredBlogs = useMemo(() => {
    const blogs = (blogData?.blogs as Blog[]) || [];
    return blogs.filter((blog: Blog) => {
      const matchesSearch =
        !searchTerm ||
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag = !selectedTag || (blog.tags && blog.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [blogData?.blogs, searchTerm, selectedTag]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTag(null);
    setCurrentPage(1);
  };

  const totalPages = blogData?.totalPages || 1;
  const pageNumbers = usePagination(currentPage, totalPages);

  return (
    <div className="space-y-16 md:space-y-24 pb-12">
      <section className="relative overflow-hidden pt-4 sm:pt-8 md:pt-12">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/15 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/4 w-[450px] h-[250px] bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="container px-4 max-w-6xl mx-auto relative">
          {/* Header */}
          <BlogHeader
            eyebrow={copy?.header.eyebrow}
            title={copy?.header.title}
            description={copy?.header.description}
          />

          {/* Search & Topic Filters */}
          <BlogFilters
            searchTerm={searchTerm}
            setSearchTerm={handleSearchChange}
            selectedTag={selectedTag}
            setSelectedTag={handleTagChange}
            allTags={tagsData || []}
          />

          {/* Results Count Info */}
          <BlogResultsInfo
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            filteredCount={filteredBlogs.length}
            totalPages={totalPages}
            isLoading={isBlogsLoading}
          />

          {/* Blog Cards Grid */}
          <BlogGrid
            isLoading={isBlogsLoading}
            paginatedBlogs={filteredBlogs}
            filteredBlogs={filteredBlogs}
            clearFilters={clearFilters}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageNumbers={pageNumbers}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}
        </div>
      </section>

      {/* Closing Conversion CTA */}
      <CtaV2 settings={settings} />
    </div>
  );
};
