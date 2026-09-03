"use client";

import Link from "next/link";
import {
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  Users,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  JOB_PLATFORM_CONFIG,
  JOB_STATUS_CONFIG,
  WORKPLACE_CONFIG,
  formatSalary,
  getAtsScoreColor,
} from "@/lib/job-tracker";
import { formatDate } from "@/lib/utils";
import type { JobApplication, JobApplicationStatus } from "@/services/job-tracker/types";

interface ApplicationCardProps {
  application: JobApplication;
  onStatusChange: (id: string, newStatus: JobApplicationStatus) => void;
  onDelete: (id: string) => void;
}

export function ApplicationCard({ application, onStatusChange, onDelete }: ApplicationCardProps) {
  const platformCfg = JOB_PLATFORM_CONFIG[application.platform] || JOB_PLATFORM_CONFIG.other;
  const atsConfig = getAtsScoreColor(application.atsScore);
  const hasInterviews = (application.interviews?.length ?? 0) > 0;
  const upcomingInterview = application.interviews?.find(
    (i) => i.status === "scheduled" && new Date(i.scheduledAt) >= new Date()
  );

  return (
    <div className="group relative rounded-xl border border-border/70 bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col gap-3">
      {/* Top row: Company & Action menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {application.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm leading-tight text-foreground truncate group-hover:text-primary transition-colors">
              <Link href={`/cms/job-tracker/${application.id}`}>{application.jobTitle}</Link>
            </h4>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3" />
              {application.companyName}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href={`/cms/job-tracker/${application.id}`}>
                <Pencil className="h-4 w-4 mr-2" />
                Open Workspace
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={`/cms/job-tracker/${application.id}?tab=tailor`}>
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                AI CV Matcher & Tailor
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={`/cms/job-tracker/${application.id}?tab=interview`}>
                <Users className="h-4 w-4 mr-2 text-purple-500" />
                Interview Copilot
              </Link>
            </DropdownMenuItem>

            {application.jobUrl && (
              <DropdownMenuItem asChild>
                <a href={application.jobUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original Job
                </a>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRight className="h-4 w-4 mr-2" />
                Move Stage
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
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
                    "ghosted",
                  ] as JobApplicationStatus[]
                ).map((st) => (
                  <DropdownMenuItem
                    key={st}
                    onClick={() => onStatusChange(application.id, st)}
                    className={application.status === st ? "font-bold text-primary" : ""}
                  >
                    {JOB_STATUS_CONFIG[st].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onDelete(application.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Application
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Middle row: Badges (Platform, Workplace, Salary) */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 font-medium ${platformCfg.color}`}
        >
          {platformCfg.label}
        </Badge>

        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-muted-foreground">
          {WORKPLACE_CONFIG[application.workplaceType]}
        </Badge>

        {(application.salaryMin || application.salaryMax) && (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {formatSalary(
              application.salaryMin,
              application.salaryMax,
              application.salaryCurrency,
              application.salaryPeriod
            )}
          </span>
        )}
      </div>

      {/* ATS score gauge / recommendation tag */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
        {application.atsScore !== undefined && application.atsScore !== null ? (
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${atsConfig.bgColor} ${atsConfig.color} ${atsConfig.borderColor}`}
          >
            <Sparkles className="w-3 h-3" />
            <span>ATS {application.atsScore}%</span>
          </div>
        ) : (
          <Link
            href={`/cms/job-tracker/${application.id}?tab=tailor`}
            className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-primary/70" />
            <span>Check ATS Fit</span>
          </Link>
        )}

        {application.appliedAt ? (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDate(application.appliedAt)}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground/80 italic">Not applied yet</span>
        )}
      </div>

      {/* Upcoming Interview alert banner */}
      {upcomingInterview && (
        <div className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2.5 py-1.5 text-xs text-purple-700 dark:text-purple-300 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-medium">{upcomingInterview.title}</span>
          </div>
          <Link
            href={`/cms/job-tracker/${application.id}?tab=interview`}
            className="text-[10px] underline font-semibold shrink-0 hover:text-purple-900 dark:hover:text-purple-100"
          >
            Prep
          </Link>
        </div>
      )}
    </div>
  );
}
