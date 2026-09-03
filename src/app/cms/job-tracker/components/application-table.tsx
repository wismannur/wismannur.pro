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
  DropdownMenuLabel,
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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {app.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              href={`/cms/job-tracker/${app.id}`}
              className="font-semibold text-sm hover:text-primary transition-colors truncate"
            >
              {app.jobTitle}
            </Link>
            <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {app.companyName}
              {app.location && ` • ${app.location}`}
            </span>
          </div>
        </div>
      ),
      className: "w-[300px]",
    },
    {
      header: "Platform & Setting",
      cell: (app) => {
        const pCfg = JOB_PLATFORM_CONFIG[app.platform] || JOB_PLATFORM_CONFIG.other;
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant="outline" className={`text-xs px-2 py-0 font-medium ${pCfg.color}`}>
              {pCfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
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
        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
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
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ats.bgColor} ${ats.color} ${ats.borderColor}`}
            >
              <Sparkles className="w-3 h-3" />
              {app.atsScore}%
            </div>
          );
        }
        return (
          <Link
            href={`/cms/job-tracker/${app.id}?tab=tailor`}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-primary/70" />
            Analyze
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
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
        <div className="text-xs text-muted-foreground">
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/cms/job-tracker/${app.id}`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Open Workspace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/cms/job-tracker/${app.id}?tab=tailor`}>
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  AI Resume Tailor
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/cms/job-tracker/${app.id}?tab=interview`}>
                  <Users className="h-4 w-4 mr-2 text-purple-500" />
                  Interview Copilot
                </Link>
              </DropdownMenuItem>
              {app.jobUrl && (
                <DropdownMenuItem asChild>
                  <a href={app.jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Original Link
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(app.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: "w-[50px]",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={applications}
      isLoading={isLoading}
      keyField="id"
      emptyState={{
        icon: <Building2 className="h-8 w-8 mb-2" />,
        title: "No job applications found",
        description: "Start by importing or creating your first job opportunity",
      }}
    />
  );
}
