import React from "react";

interface BlogResultsInfoProps {
  currentPage: number;
  itemsPerPage: number;
  filteredCount: number;
  totalPages: number;
  isLoading: boolean;
}

const BlogResultsInfo = ({
  currentPage,
  itemsPerPage,
  filteredCount,
  totalPages,
  isLoading,
}: BlogResultsInfoProps) => {
  if (isLoading) return null;

  const startItem = Math.min(filteredCount, (currentPage - 1) * itemsPerPage + 1);
  const endItem = Math.min(filteredCount, currentPage * itemsPerPage);

  return (
    <div className="mb-6 text-gray-400 text-xs flex justify-between items-center px-1">
      <p>
        Showing{" "}
        <span className="font-semibold text-white">
          {filteredCount > 0 ? `${startItem}–${endItem}` : "0"}
        </span>{" "}
        of <span className="font-semibold text-white">{filteredCount}</span> articles
      </p>
      {totalPages > 1 && (
        <div className="text-xs font-mono text-gray-400">
          Page <span className="text-white font-semibold">{currentPage}</span> of {totalPages}
        </div>
      )}
    </div>
  );
};

export default BlogResultsInfo;
