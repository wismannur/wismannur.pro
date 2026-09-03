"use client";

import React from "react";
import { Search } from "lucide-react";
import { ProjectCard } from "@/components/cards/project-card";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import type { Project } from "@/services";

interface ProjectGridProps {
  isLoading: boolean;
  paginatedProjects: Project[];
  filteredProjects: Project[];
  clearFilters: () => void;
}

const ProjectGrid = ({
  isLoading,
  paginatedProjects,
  filteredProjects,
  clearFilters,
}: ProjectGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#0C0E18]/60 border border-white/[0.06] h-[380px] rounded-3xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (paginatedProjects.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProjects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          />
        ))}
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <SpotlightCard className="text-center py-16 px-6 bg-[#0C0E18]/85 border border-white/[0.08] rounded-3xl shadow-xl">
        <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
          <Search size={24} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No case studies found</h3>
        <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
          Try selecting another technology stack or clearing your search filter.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="rounded-full px-5 h-10 text-xs border-white/[0.12] bg-white/[0.04] text-white hover:bg-primary/10 hover:border-primary/40"
        >
          Clear All Filters
        </Button>
      </SpotlightCard>
    );
  }

  return null;
};

export default ProjectGrid;
