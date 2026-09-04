"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCog, Pencil, Scale } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { sitePagesService } from "@/services";
import type { SitePage } from "@/services/site-pages/types";

export default function CmsLegalPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["cmsSitePages"],
    queryFn: () => sitePagesService.getAllForCms(),
  });

  const columns: ColumnDef<SitePage>[] = [
    {
      header: "Legal Document",
      cell: (page) => (
        <div className="flex flex-col py-1">
          <div className="font-bold text-sm text-slate-100">{page.title}</div>
          <div className="text-xs text-indigo-400 font-mono mt-0.5">/{page.slug}</div>
        </div>
      ),
      className: "min-w-[200px]",
    },
    {
      header: "Publication Status",
      cell: (page) => (
        page.isPublished ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08]">
            Hidden / Draft
          </span>
        )
      ),
      className: "hidden md:table-cell min-w-[140px]",
    },
    {
      header: "Last Updated",
      cell: (page) => (
        <div className="flex items-center text-slate-400 text-xs font-medium">
          <CalendarCog className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          {formatDate(page.updatedAt)}
        </div>
      ),
      className: "hidden lg:table-cell min-w-[140px]",
    },
    {
      header: "Actions",
      cell: (page) => (
        <div className="flex justify-end">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-semibold rounded-xl border-white/[0.08] bg-[#0C0E18]/80 text-slate-200 hover:text-white hover:bg-white/[0.08] hover:border-indigo-500/30 gap-1.5"
          >
            <Link href={`/cms/legal/${page.id}`}>
              <Pencil className="h-3.5 w-3.5 text-indigo-400" />
              Edit MDX
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
              <Scale className="w-5 h-5" />
            </span>
            Legal Pages
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Privacy policy, terms of service, and disclaimer documents written in MDX.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          keyField="id"
          rowClassName={() => "transition-colors hover:bg-white/[0.03] border-b border-white/[0.04]"}
          emptyState={{
            icon: <Scale className="h-8 w-8 mb-2 text-slate-500" />,
            title: "No legal pages found",
            description: "The site_pages table appears to be empty",
          }}
        />
      </div>
    </div>
  );
}
