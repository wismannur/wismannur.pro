import React from "react";

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
  if (isLoading) return null;

  const startItem = filteredProjects.length > 0 ? (currentPage - 1) * 6 + 1 : 0;
  const endItem = Math.min(filteredProjects.length, startItem + paginatedProjects.length - 1);

  return (
    <div className="mb-6 text-gray-400 text-xs flex justify-between items-center px-1">
      <p>
        Showing{" "}
        <span className="font-semibold text-white">
          {filteredProjects.length > 0 ? `${startItem}–${endItem}` : "0"}
        </span>{" "}
        of <span className="font-semibold text-white">{filteredProjects.length}</span> case studies
      </p>
      {totalPages > 1 && (
        <div className="text-xs font-mono text-gray-400">
          Page <span className="text-white font-semibold">{currentPage}</span> of {totalPages}
        </div>
      )}
    </div>
  );
};

export default ProjectResultsInfo;
