"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/hooks/use-pagination";
import { projectService } from "@/services";
import type { Project } from "@/services/project/types";
import type { ListHeaderCopy } from "@/services/page-copy/types";
import type { SiteSettings } from "@/services/site-settings/types";

import { ProjectCard } from "@/components/cards/project-card";
import Pagination from "@/components/common/pagination";
import { CtaV2 } from "@/components/home-v2/cta-v2";
import ProjectFilters from "@/features/project/project-filters";
import ProjectGrid from "@/features/project/project-grid";
import ProjectHeader from "@/features/project/project-header";
import ProjectResultsInfo from "@/features/project/project-results-info";

const ITEMS_PER_PAGE = 6;

interface ProjectsViewProps {
  copy: ListHeaderCopy | null;
  settings?: SiteSettings;
}

export const ProjectsView = ({ copy, settings }: ProjectsViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch featured projects
  const { data: featuredProjects = [], isLoading: isFeaturedLoading } = useQuery<Project[]>({
    queryKey: ["featuredProjects"],
    queryFn: () => projectService.getFeaturedProjects(),
  });

  // Fetch all technologies
  const { data: allTechnologies = [] } = useQuery<string[]>({
    queryKey: ["projectTechnologies"],
    queryFn: () => projectService.getAllTechnologies(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch paginated and filtered projects
  const {
    data: projectData = { projects: [], totalPages: 0, currentPage: 1 },
    isLoading: isFilteredLoading,
  } = useQuery<{
    projects: Project[];
    totalPages: number;
    currentPage: number;
  }>({
    queryKey: ["projects", currentPage, searchTerm, selectedTech],
    queryFn: () =>
      projectService.getByPage(currentPage, ITEMS_PER_PAGE, {
        searchTerm,
        technology: selectedTech,
      }),
  });

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleTechChange = (tech: string | null) => {
    setSelectedTech(tech);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTech(null);
    setCurrentPage(1);
  };

  const { projects: paginatedProjects, totalPages } = projectData;
  const pageNumbers = usePagination(currentPage, totalPages || 1);

  // Exclude featured project from general grid if it's already shown in featured section and on page 1 without filters
  const displayProjects = useMemo(() => {
    return paginatedProjects;
  }, [paginatedProjects]);

  return (
    <div className="space-y-16 md:space-y-24 pb-12">
      {/* 1. Hero & Featured Showcase */}
      <section className="relative overflow-hidden pt-4 sm:pt-8 md:pt-12">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/15 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/4 w-[450px] h-[250px] bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="container px-4 max-w-6xl mx-auto relative">
          {/* Header */}
          <ProjectHeader
            eyebrow={copy?.header?.eyebrow}
            title={copy?.header?.title}
            description={copy?.header?.description}
          />

          {/* Featured Projects Highlight */}
          {(featuredProjects.length > 0 || isFeaturedLoading) && (
            <div className="mb-16 md:mb-20">
              {isFeaturedLoading ? (
                <div className="h-[360px] rounded-3xl bg-[#0C0E18]/60 border border-white/[0.08] animate-pulse" />
              ) : (
                <div className="space-y-8">
                  {featuredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} variant="featured" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stack Filter Bar */}
          <div className="pt-4 border-t border-white/[0.08]">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                All Systems & Open-Source Tools
              </h3>
              <p className="text-xs text-gray-400">Filter by specific technology layer</p>
            </div>

            <ProjectFilters
              searchTerm={searchTerm}
              setSearchTerm={handleSearchChange}
              selectedTech={selectedTech}
              setSelectedTech={handleTechChange}
              allTechnologies={allTechnologies}
            />

            {/* Results Count Info */}
            <ProjectResultsInfo
              filteredProjects={displayProjects}
              paginatedProjects={displayProjects}
              isLoading={isFilteredLoading}
              currentPage={currentPage}
              totalPages={totalPages || 1}
            />

            {/* Grid */}
            <ProjectGrid
              isLoading={isFilteredLoading}
              paginatedProjects={displayProjects}
              filteredProjects={displayProjects}
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
        </div>
      </section>

      {/* Closing Conversion CTA */}
      <CtaV2 settings={settings} />
    </div>
  );
};
