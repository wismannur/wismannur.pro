"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCog, FileText, Pencil } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { pageCopyService } from "@/services";
import type { PageCopyEntry } from "@/services/page-copy/types";

// Human labels + public paths for active public pages
const PAGE_INFO: Record<string, { label: string; path: string }> = {
  home: { label: "Home", path: "/" },
  about: { label: "About", path: "/about" },
  services: { label: "Services", path: "/services" },
  "hire-me": { label: "Hire Me", path: "/hire-me" },
  blog: { label: "Blog", path: "/blog" },
  projects: { label: "Projects", path: "/projects" },
  contact: { label: "Contact", path: "/contact" },
  "not-found": { label: "404 Page", path: "/404" },
  default: { label: "Default CTA", path: "Fallback across pages" },
};

export default function CmsPagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["cmsPageCopy"],
    queryFn: () => pageCopyService.getAllForCms(),
  });

  // Filter out any obsolete entries not corresponding to active public pages (e.g. legacy offers)
  const activeEntries = useMemo(() => {
    if (!data) return [];
    return data.filter((entry) => PAGE_INFO[entry.page] !== undefined);
  }, [data]);

  const columns: ColumnDef<PageCopyEntry>[] = [
    {
      header: "Page",
      cell: (entry) => (
        <div className="flex flex-col py-1">
          <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <span>{PAGE_INFO[entry.page]?.label ?? entry.page}</span>
            {entry.page === "home" && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                PRIMARY
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {PAGE_INFO[entry.page]?.path}
          </div>
        </div>
      ),
      className: "min-w-[180px]",
    },
    {
      header: "Editable Sections",
      cell: (entry) => (
        <div className="flex flex-wrap gap-1.5 py-1">
          {Object.keys(entry.content).map((key) => (
            <Badge
              key={key}
              variant="outline"
              className="text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border-indigo-500/20 rounded-md px-2 py-0.5"
            >
              {key}
            </Badge>
          ))}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Last Updated",
      cell: (entry) => (
        <div className="flex items-center text-slate-400 text-xs font-medium">
          <CalendarCog className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          {formatDate(entry.updatedAt)}
        </div>
      ),
      className: "hidden lg:table-cell min-w-[140px]",
    },
    {
      header: "Actions",
      cell: (entry) => (
        <div className="flex justify-end">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-semibold rounded-xl border-white/[0.08] bg-[#0C0E18]/80 text-slate-200 hover:text-white hover:bg-white/[0.08] hover:border-indigo-500/30 gap-1.5"
          >
            <Link href={`/cms/pages/${entry.page}`}>
              <Pencil className="h-3.5 w-3.5 text-indigo-400" />
              Edit Copy
            </Link>
          </Button>
        </div>
      ),
      className: "w-[120px]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <FileText className="w-5 h-5" />
            </span>
            Page Copy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Edit the hero copy, section headers, SEO meta, and CTA blocks for every active public page.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={activeEntries}
          isLoading={isLoading}
          keyField="page"
          rowClassName={() => "transition-colors hover:bg-white/[0.03] border-b border-white/[0.04]"}
          emptyState={{
            icon: <FileText className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No page copy found",
            description: "The page_copy table appears to be empty",
          }}
        />
      </div>
    </div>
  );
}
