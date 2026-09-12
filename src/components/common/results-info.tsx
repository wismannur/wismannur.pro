"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ResultsInfoProps {
  currentCount?: number;
  startItem?: number;
  endItem?: number;
  totalCount: number;
  itemLabel: string;
  currentPage?: number;
  totalPages?: number;
  isLoading?: boolean;
  className?: string;
}

export function ResultsInfo({
  currentCount,
  startItem,
  endItem,
  totalCount,
  itemLabel,
  currentPage,
  totalPages,
  isLoading,
  className,
}: ResultsInfoProps) {
  if (isLoading) return null;

  const computedStart =
    startItem !== undefined
      ? startItem
      : totalCount > 0 && currentPage && currentCount !== undefined
        ? (currentPage - 1) * currentCount + 1
        : totalCount > 0
          ? 1
          : 0;

  const computedEnd =
    endItem !== undefined
      ? endItem
      : currentCount !== undefined
        ? Math.min(totalCount, computedStart + currentCount - 1)
        : totalCount;

  return (
    <div
      className={cn(
        "mb-6 text-gray-400 text-xs flex justify-between items-center px-1 font-sans",
        className
      )}
    >
      <p>
        Showing{" "}
        <span className="font-semibold text-white">
          {totalCount > 0 ? `${computedStart}–${computedEnd}` : "0"}
        </span>{" "}
        of <span className="font-semibold text-white">{totalCount}</span> {itemLabel}
      </p>

      {totalPages !== undefined && totalPages > 1 && currentPage !== undefined && (
        <div className="text-xs font-mono text-gray-400">
          Page <span className="text-white font-semibold">{currentPage}</span> of {totalPages}
        </div>
      )}
    </div>
  );
}

export default ResultsInfo;
