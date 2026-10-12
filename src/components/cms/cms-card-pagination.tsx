"use client";

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export interface CmsCardPaginationProps {
  currentPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export function CmsCardPagination({
  currentPage,
  hasMore,
  onPageChange,
  className,
}: CmsCardPaginationProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl flex items-center justify-center shadow-lg",
        className
      )}
    >
      <Pagination className="justify-center">
        <PaginationContent className="gap-1.5">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={cn(
                "h-8 px-3 rounded-xl text-xs border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all",
                currentPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"
              )}
            />
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              isActive={currentPage === 1}
              onClick={() => onPageChange(1)}
              className={cn(
                "h-8 w-8 rounded-xl text-xs font-semibold cursor-pointer transition-all",
                currentPage === 1
                  ? "bg-primary text-white font-bold shadow-md shadow-primary/30 border border-primary/40 pointer-events-none"
                  : "border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              1
            </PaginationLink>
          </PaginationItem>

          {currentPage > 3 && (
            <PaginationItem>
              <PaginationEllipsis className="text-gray-500" />
            </PaginationItem>
          )}

          {currentPage > 2 && (
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(currentPage - 1)}
                className="h-8 w-8 rounded-xl text-xs font-semibold cursor-pointer border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white"
              >
                {currentPage - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {currentPage > 1 && currentPage < 10 && (
            <PaginationItem>
              <PaginationLink
                isActive
                className="h-8 w-8 rounded-xl text-xs font-semibold bg-primary text-white font-bold shadow-md shadow-primary/30 border border-primary/40 pointer-events-none"
              >
                {currentPage}
              </PaginationLink>
            </PaginationItem>
          )}

          {hasMore && (
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(currentPage + 1)}
                className="h-8 w-8 rounded-xl text-xs font-semibold cursor-pointer border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white"
              >
                {currentPage + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {hasMore && currentPage < 9 && (
            <PaginationItem>
              <PaginationEllipsis className="text-gray-500" />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => hasMore && onPageChange(currentPage + 1)}
              className={cn(
                "h-8 px-3 rounded-xl text-xs border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all",
                !hasMore ? "pointer-events-none opacity-40" : "cursor-pointer"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
