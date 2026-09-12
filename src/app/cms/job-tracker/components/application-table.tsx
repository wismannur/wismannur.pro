"use client";

import Link from "next/link";
import {
  Building2,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  JOB_PLATFORM_CONFIG,
  JOB_STATUS_CONFIG,
  WORKPLACE_CONFIG,
  formatSalary,
  getAtsScoreColor,
} from "@/lib/job-tracker";
import { formatDate } from "@/lib/utils";
import type { JobApplication, JobApplicationStatus } from "@/services/job-tracker/types";

interface ApplicationTableProps {
  applications: JobApplication[];
  isLoading: boolean;
  onStatusChange: (id: string, newStatus: JobApplicationStatus) => void;
  onDelete: (id: string) => void;
}

export function ApplicationTable({
  applications,
  isLoading,
  onStatusChange,
  onDelete,
}: ApplicationTableProps) {
  const columns: ColumnDef<JobApplication>[] = [
    {
      header: "Role & Company",
      cell: (app) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary font-extrabold text-xs shrink-0 shadow-inner">
            {app.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              href={`/cms/job-tracker/${app.id}`}
              className="font-bold text-sm text-white hover:text-primary transition-colors truncate"
            >
              {app.jobTitle}
            </Link>
            <span className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-gray-400" />
              {app.companyName}
              {app.location && ` • ${app.location}`}
            </span>
          </div>
        </div>
      ),
      className: "w-[320px]",
    },
    {
      header: "Platform & Setting",
      cell: (app) => {
        const pCfg = JOB_PLATFORM_CONFIG[app.platform] || JOB_PLATFORM_CONFIG.other;
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 rounded-md font-medium border ${pCfg.color}`}>
              {pCfg.label}
            </Badge>
            <span className="text-xs text-gray-400">
              {WORKPLACE_CONFIG[app.workplaceType]}
            </span>
          </div>
        );
      },
      className: "hidden md:table-cell",
    },
    {
      header: "Salary Range",
      cell: (app) => (
        <div className="text-xs font-bold text-emerald-400">
          {formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency, app.salaryPeriod)}
        </div>
      ),
      className: "hidden lg:table-cell",
    },
    {
      header: "ATS Match",
      cell: (app) => {
        const ats = getAtsScoreColor(app.atsScore);
        if (app.atsScore !== undefined && app.atsScore !== null) {
          return (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${ats.bgColor} ${ats.color} ${ats.borderColor}`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{app.atsScore}%</span>
            </div>
          );
        }
        return (
          <Link
            href={`/cms/job-tracker/${app.id}?tab=tailor`}
            className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 font-medium transition-colors"
          >
            <Sparkles className="w-3 h-3 text-primary/80" />
            <span>Analyze Fit</span>
          </Link>
        );
      },
      className: "hidden sm:table-cell",
    },
    {
      header: "Stage / Status",
      cell: (app) => (
        <Select
          value={app.status}
          onValueChange={(val) => onStatusChange(app.id, val as JobApplicationStatus)}
        >
          <SelectTrigger className="h-8 text-xs w-[160px] bg-[#131726] border-white/[0.08] rounded-lg text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-xs">
            {(
              [
                "wishlist",
                "applied",
                "screening",
                "interview_hr",
                "interview_tech",
                "interview_user",
                "offering",
                "accepted",
                "rejected",
                "withdrawn",
                "ghosted",
              ] as JobApplicationStatus[]
            ).map((st) => (
              <SelectItem key={st} value={st} className="text-xs">
                {JOB_STATUS_CONFIG[st].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      header: "Applied Date",
      cell: (app) => (
        <div className="text-xs text-gray-400 font-mono">
          {app.appliedAt ? formatDate(app.appliedAt) : "Not applied"}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      cell: (app) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[#0C0E18] border-white/[0.1] text-white">
              <DropdownMenuItem asChild>
                <Link href={`/cms/job-tracker/${app.id}`} className="flex items-center gap-2 cursor-pointer">
                  <Pencil className="h-4 w-4 text-primary" />
                  <span>Open Workspace</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/cms/job-tracker/${app.id}?tab=tailor`} className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>AI Resume Tailor</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/cms/job-tracker/${app.id}?tab=interview`} className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span>Interview Copilot</span>
                </Link>
              </DropdownMenuItem>
              {app.jobUrl && (
                <DropdownMenuItem asChild>
                  <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                    <span>Original Link</span>
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem
                onClick={() => onDelete(app.id)}
                className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2 text-rose-400" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: "w-[50px]",
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-3 shadow-xl overflow-hidden backdrop-blur-md">
      <DataTable
        columns={columns}
        data={applications}
        isLoading={isLoading}
        keyField="id"
        emptyState={{
          icon: <Building2 className="h-8 w-8 mb-2 text-gray-400" />,
          title: "No job applications found",
          description: "Start by importing or creating your first job opportunity",
        }}
      />
    </div>
  );
}
