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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
};

export type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  loadingRows?: number;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick?: () => void;
      href?: string;
    };
  };
  pagination?: {
    currentPage: number;
    hasMore: boolean;
    onPageChange: (page: number) => void;
  };
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  keyField: keyof T;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  loadingRows = 5,
  emptyState = {
    title: "No data found",
    description: "There are no items to display at the moment.",
  },
  pagination,
  rowClassName,
  onRowClick,
  keyField,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="overflow-x-auto w-full">
        <Table className="w-full">
          <TableHeader className="bg-white/[0.02] border-b border-white/[0.08]">
            <TableRow className="border-b border-white/[0.08] hover:bg-transparent">
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider text-gray-400 py-3.5",
                    column.className
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: loadingRows }).map((_, index) => (
                <TableRow
                  key={`loading-${index}`}
                  className="border-b border-white/[0.04] hover:bg-transparent"
                >
                  {columns.map((column, cellIndex) => (
                    <TableCell key={`loading-cell-${cellIndex}`} className="py-4">
                      <div className="h-5 bg-white/[0.04] rounded-lg animate-pulse w-full max-w-[200px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <TableRow
                  key={String(item[keyField])}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]",
                    onRowClick && "cursor-pointer",
                    rowClassName ? rowClassName(item, index) : undefined
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column, cellIndex) => (
                    <TableCell
                      key={`${String(item[keyField])}-${cellIndex}`}
                      className={cn("py-3.5 text-xs text-gray-300", column.className)}
                    >
                      {column.cell
                        ? column.cell(item)
                        : column.accessorKey
                          ? String(item[column.accessorKey] || "")
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="py-12 text-center">
                  <EmptyState
                    variant="inline"
                    icon={emptyState.icon || <Inbox className="h-6 w-6 text-primary" />}
                    title={emptyState.title}
                    description={emptyState.description}
                    action={emptyState.action}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && !isLoading && data.length > 0 && (
        <div className="p-4 border-t border-white/[0.06] flex items-center justify-center">
          <Pagination className="justify-center">
            <PaginationContent className="gap-1.5">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                  className={cn(
                    "h-8 px-3 rounded-xl text-xs border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all",
                    pagination.currentPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"
                  )}
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationLink
                  isActive={pagination.currentPage === 1}
                  onClick={() => pagination.onPageChange(1)}
                  className={cn(
                    "h-8 w-8 rounded-xl text-xs font-semibold cursor-pointer transition-all",
                    pagination.currentPage === 1
                      ? "bg-primary text-white font-bold shadow-md shadow-primary/30 border border-primary/40 pointer-events-none"
                      : "border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  1
                </PaginationLink>
              </PaginationItem>

              {pagination.currentPage > 3 && (
                <PaginationItem>
                  <PaginationEllipsis className="text-gray-500" />
                </PaginationItem>
              )}

              {pagination.currentPage > 2 && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                    className="h-8 w-8 rounded-xl text-xs font-semibold cursor-pointer border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    {pagination.currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              {pagination.currentPage > 1 && pagination.currentPage < 10 && (
                <PaginationItem>
                  <PaginationLink
                    isActive
                    className="h-8 w-8 rounded-xl text-xs font-semibold bg-primary text-white font-bold shadow-md shadow-primary/30 border border-primary/40 pointer-events-none"
                  >
                    {pagination.currentPage}
                  </PaginationLink>
                </PaginationItem>
              )}

              {pagination.hasMore && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                    className="h-8 w-8 rounded-xl text-xs font-semibold cursor-pointer border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    {pagination.currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              {pagination.hasMore && pagination.currentPage < 9 && (
                <PaginationItem>
                  <PaginationEllipsis className="text-gray-500" />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    pagination.hasMore && pagination.onPageChange(pagination.currentPage + 1)
                  }
                  className={cn(
                    "h-8 px-3 rounded-xl text-xs border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all",
                    !pagination.hasMore ? "pointer-events-none opacity-40" : "cursor-pointer"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
