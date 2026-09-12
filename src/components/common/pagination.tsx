"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: (number | string)[];
  setCurrentPage: (page: number) => void;
  className?: string;
}

export const Pagination = ({
  currentPage,
  totalPages,
  pageNumbers,
  setCurrentPage,
  className,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn("flex justify-center items-center gap-2", className)}
    >
      <Button
        variant="outline"
        size="icon"
        aria-label="Go to previous page"
        className="h-9 w-9 rounded-xl border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
      </Button>

      {pageNumbers.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-xs font-mono text-gray-500 select-none">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
            className={cn(
              "h-9 w-9 rounded-xl text-xs font-semibold transition-all",
              currentPage === page
                ? "bg-primary text-white font-bold shadow-md shadow-primary/30 border border-primary/40 pointer-events-none"
                : "border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] hover:text-white"
            )}
            onClick={() => setCurrentPage(page as number)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        aria-label="Go to next page"
        className="h-9 w-9 rounded-xl border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
        onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={16} />
      </Button>
    </nav>
  );
};

export default Pagination;
