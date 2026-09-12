"use client";

import React from "react";
import { ResultsInfo } from "@/components/common/results-info";

interface ProjectResultsInfoProps {
  filteredProjects: unknown[];
  paginatedProjects: unknown[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
}

const ProjectResultsInfo = ({
  filteredProjects,
  paginatedProjects,
  isLoading,
  currentPage,
  totalPages,
}: ProjectResultsInfoProps) => {
  const startItem = filteredProjects.length > 0 ? (currentPage - 1) * 6 + 1 : 0;
  const endItem = Math.min(filteredProjects.length, startItem + paginatedProjects.length - 1);

  return (
    <ResultsInfo
      startItem={startItem}
      endItem={endItem}
      totalCount={filteredProjects.length}
      itemLabel="case studies"
      currentPage={currentPage}
      totalPages={totalPages}
      isLoading={isLoading}
    />
  );
};

export default ProjectResultsInfo;
