"use client";

import React from "react";
import { ResultsInfo } from "@/components/common/results-info";

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
  const startItem = Math.min(filteredCount, (currentPage - 1) * itemsPerPage + 1);
  const endItem = Math.min(filteredCount, currentPage * itemsPerPage);

  return (
    <ResultsInfo
      startItem={startItem}
      endItem={endItem}
      totalCount={filteredCount}
      itemLabel="articles"
      currentPage={currentPage}
      totalPages={totalPages}
      isLoading={isLoading}
    />
  );
};

export default BlogResultsInfo;
