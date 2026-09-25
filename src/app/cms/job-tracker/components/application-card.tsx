"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  Users,
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
  checkIsStagnant,
  formatSalary,
  getAtsScoreColor,
} from "@/lib/job-tracker";
import { formatDate } from "@/lib/utils";
import type { JobApplication, JobApplicationStatus } from "@/services/job-tracker/types";

interface ApplicationCardProps {
  application: JobApplication;
  onStatusChange: (id: string, newStatus: JobApplicationStatus) => void;
  onDelete: (id: string) => void;
  onAnalyzeAts?: (id: string) => Promise<void>;
  isAnalyzingAts?: boolean;
}

export function ApplicationCard({
  application,
  onStatusChange,
  onDelete,
  onAnalyzeAts,
  isAnalyzingAts = false,
}: ApplicationCardProps) {
  const platformCfg = JOB_PLATFORM_CONFIG[application.platform] || JOB_PLATFORM_CONFIG.other;
  const atsConfig = getAtsScoreColor(application.atsScore);
  const upcomingInterview = application.interviews?.find(
    (i) => i.status === "scheduled" && new Date(i.scheduledAt) >= new Date()
  );

  const { isStagnant, daysInactive: stagnantDays } = checkIsStagnant(
    application.status,
    application.appliedAt || application.createdAt,
    Boolean(upcomingInterview)
  );

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", application.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="group relative rounded-2xl border border-white/[0.08] bg-[#131726] p-4 shadow-lg hover:shadow-xl hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing flex flex-col gap-3.5 select-none"
    >
      {/* Top row: Company & Action menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary font-extrabold text-xs shrink-0 shadow-inner">
            {application.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm leading-tight text-white truncate group-hover:text-primary transition-colors">
              <Link href={`/cms/job-tracker/${application.id}`}>{application.jobTitle}</Link>
            </h4>
            <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{application.companyName}</span>
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#0C0E18] border-white/[0.1] text-white">
            <DropdownMenuItem asChild>
              <Link href={`/cms/job-tracker/${application.id}`} className="flex items-center gap-2 cursor-pointer">
                <Pencil className="h-4 w-4 text-primary" />
                <span>Open Workspace</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={`/cms/job-tracker/${application.id}?tab=tailor`} className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>AI CV Matcher & Tailor</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={`/cms/job-tracker/${application.id}?tab=interview`} className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4 text-purple-400" />
                <span>Interview Copilot</span>
              </Link>
            </DropdownMenuItem>

            {isStagnant && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/cms/job-outreaches/new?company=${encodeURIComponent(application.companyName)}&role=${encodeURIComponent(application.jobTitle)}&purpose=follow_up&type=follow_up&jobAppId=${application.id}`}
                  className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-500/10 font-medium"
                >
                  <Send className="h-4 w-4 text-amber-400" />
                  <span>⚡ Send Follow-Up Outreach</span>
                </Link>
              </DropdownMenuItem>
            )}

            {onAnalyzeAts && (application.atsScore === undefined || application.atsScore === null) && (
              <DropdownMenuItem
                onClick={() => onAnalyzeAts(application.id)}
                disabled={isAnalyzingAts}
                className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-500/10"
              >
                {isAnalyzingAts ? (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-400" />
                )}
                <span>⚡ Run Quick ATS Match</span>
              </DropdownMenuItem>
            )}

            {application.jobUrl && (
              <DropdownMenuItem asChild>
                <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  <span>View Original Job</span>
                </a>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-white/[0.08]" />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <ArrowRight className="h-4 w-4 mr-2 text-primary" />
                <span>Move Stage</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 bg-[#0C0E18] border-white/[0.1] text-white">
                <DropdownMenuLabel className="text-gray-400 text-xs">Change Stage</DropdownMenuLabel>
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
                    className={application.status === st ? "font-bold text-primary bg-primary/10" : "cursor-pointer"}
                  >
                    {JOB_STATUS_CONFIG[st].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="bg-white/[0.08]" />

            <DropdownMenuItem
              onClick={() => onDelete(application.id)}
              className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2 text-rose-400" />
              <span>Delete Application</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Middle row: Badges (Platform, Workplace, Salary) */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <Badge
          variant="outline"
          className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${platformCfg.color}`}
        >
          {platformCfg.label}
        </Badge>

        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-gray-300 border border-white/[0.05]">
          {WORKPLACE_CONFIG[application.workplaceType]}
        </Badge>

        {(application.salaryMin || application.salaryMax) && (
          <span className="text-[11px] font-bold text-emerald-400 ml-auto">
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
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
        {application.atsScore !== undefined && application.atsScore !== null ? (
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${atsConfig.bgColor} ${atsConfig.color} ${atsConfig.borderColor}`}
          >
            <Sparkles className="w-3 h-3" />
            <span>ATS {application.atsScore}%</span>
          </div>
        ) : onAnalyzeAts ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyzeAts(application.id);
            }}
            disabled={isAnalyzingAts}
            className="h-6 px-2 py-0 text-[11px] text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 rounded-md border border-amber-500/30 gap-1 font-semibold transition-all"
            title="Analyze candidate master profile against this job description"
          >
            {isAnalyzingAts ? (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-400" />
            )}
            <span>{isAnalyzingAts ? "Matching..." : "⚡ Quick ATS Fit"}</span>
          </Button>
        ) : (
          <Link
            href={`/cms/job-tracker/${application.id}?tab=tailor`}
            className="text-[11px] text-gray-400 hover:text-primary flex items-center gap-1 transition-colors font-medium"
          >
            <Sparkles className="w-3 h-3 text-primary/80" />
            <span>Check ATS Fit</span>
          </Link>
        )}

        {application.appliedAt ? (
          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{formatDate(application.appliedAt)}</span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400 italic">Not applied yet</span>
        )}
      </div>

      {/* Upcoming Interview alert banner */}
      {upcomingInterview && (
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 text-xs text-purple-300 flex items-center justify-between gap-1 shadow-inner">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
            <span className="truncate font-semibold">{upcomingInterview.title}</span>
          </div>
          <Link
            href={`/cms/job-tracker/${application.id}?tab=interview`}
            className="text-[10px] font-bold underline shrink-0 hover:text-white text-purple-300 transition-colors"
          >
            Prep Now
          </Link>
        </div>
      )}

      {/* Ghosting / Stagnant Alert Banner */}
      {isStagnant && !upcomingInterview && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs text-amber-300 flex items-center justify-between gap-1 shadow-inner">
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate font-semibold">Follow-up Due ({stagnantDays}d inactive)</span>
          </div>
          <Link
            href={`/cms/job-outreaches/new?company=${encodeURIComponent(application.companyName)}&role=${encodeURIComponent(application.jobTitle)}&purpose=follow_up&type=follow_up&jobAppId=${application.id}`}
            className="text-[10px] font-bold underline shrink-0 hover:text-white text-amber-300 transition-colors"
          >
            Nudge ✉️
          </Link>
        </div>
      )}
    </div>
  );
}
