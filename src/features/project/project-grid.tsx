"use client";

import React from "react";
import { Search } from "lucide-react";
import { ProjectCard } from "@/components/cards/project-card";
import { EmptyState } from "@/components/ui/empty-state";
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#0C0E18]/60 border border-white/[0.06] h-[400px] rounded-3xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (paginatedProjects.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
      <EmptyState
        icon={Search}
        title="No Case Studies Found"
        description="No production architectures match your active technology stack or search query. Try clearing your filters."
        action={{
          label: "Clear All Filters",
          onClick: clearFilters,
          variant: "outline",
        }}
      />
    );
  }

  return null;
};

export default ProjectGrid;
