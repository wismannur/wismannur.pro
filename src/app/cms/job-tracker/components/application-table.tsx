"use client";

import Link from "next/link";
import {
  AlertTriangle,
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
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
  checkIsStagnant,
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
  onAnalyzeAts?: (id: string) => Promise<void>;
  analyzingAppId?: string | null;
}

export function ApplicationTable({
  applications,
  isLoading,
  onStatusChange,
  onDelete,
  onAnalyzeAts,
  analyzingAppId,
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
      header: "Salary & Applied",
      cell: (app) => (
        <div className="flex flex-col gap-0.5 items-start">
          <span className="text-xs font-bold text-emerald-400">
            {formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency, app.salaryPeriod)}
          </span>
          <span className="text-[11px] text-gray-400 font-mono">
            {app.appliedAt ? formatDate(app.appliedAt) : "Not applied"}
          </span>
        </div>
      ),
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
        if (onAnalyzeAts) {
          const isAnalyzing = analyzingAppId === app.id;
          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isAnalyzing}
              onClick={() => onAnalyzeAts(app.id)}
              className="h-6 px-2 py-0 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-md border border-amber-500/30 gap-1 font-semibold transition-all"
              title="Quickly run AI ATS match with candidate master profile"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-400" />
              )}
              <span>{isAnalyzing ? "Matching..." : "⚡ Quick Fit"}</span>
            </Button>
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
      cell: (app) => {
        const upcoming = app.interviews?.some((i) => i.status === "scheduled" && new Date(i.scheduledAt) >= new Date());
        const { isStagnant, daysInactive: stagnantDays } = checkIsStagnant(
          app.status,
          app.appliedAt || app.createdAt,
          Boolean(upcoming)
        );

        return (
          <div className="flex flex-col items-start gap-1">
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
            {isStagnant && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono font-medium">
                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                Follow-up Due ({stagnantDays}d)
              </span>
            )}
          </div>
        );
      },
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
              {(() => {
                const upcoming = app.interviews?.some((i) => i.status === "scheduled" && new Date(i.scheduledAt) >= new Date());
                const { isStagnant } = checkIsStagnant(
                  app.status,
                  app.appliedAt || app.createdAt,
                  Boolean(upcoming)
                );

                if (!isStagnant) return null;
                return (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/cms/job-outreaches/new?company=${encodeURIComponent(app.companyName)}&role=${encodeURIComponent(app.jobTitle)}&purpose=follow_up&type=follow_up&jobAppId=${app.id}`}
                      className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-500/10 font-medium"
                    >
                      <Send className="h-4 w-4 text-amber-400" />
                      <span>⚡ Send Follow-Up Outreach</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })()}
              {onAnalyzeAts && (app.atsScore === undefined || app.atsScore === null) && (
                <DropdownMenuItem
                  onClick={() => onAnalyzeAts(app.id)}
                  disabled={analyzingAppId === app.id}
                  className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-500/10"
                >
                  {analyzingAppId === app.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  )}
                  <span>⚡ Quick ATS Match</span>
                </DropdownMenuItem>
              )}
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
    <>
      {/* Mobile Cards View (Screen <= 768px) */}
      <div className="block min-[769px]:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`job-skeleton-${idx}`}
                className="rounded-2xl border border-white/[0.08] bg-[#131726] p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl bg-white/[0.06]" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36 bg-white/[0.06] rounded-md" />
                      <Skeleton className="h-3 w-24 bg-white/[0.06] rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="w-7 h-7 rounded-lg bg-white/[0.06]" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 bg-white/[0.06] rounded-md" />
                  <Skeleton className="h-5 w-16 bg-white/[0.06] rounded-md" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                  <Skeleton className="h-5 w-20 bg-white/[0.06] rounded-md" />
                  <Skeleton className="h-8 w-28 bg-white/[0.06] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-primary" />}
            title="No job applications found"
            description="Start by importing or creating your first job opportunity."
            variant="card"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {applications.map((app) => {
              const platformCfg = JOB_PLATFORM_CONFIG[app.platform] || JOB_PLATFORM_CONFIG.other;
              const atsConfig = getAtsScoreColor(app.atsScore);
              const upcomingInterview = app.interviews?.find(
                (i) => i.status === "scheduled" && new Date(i.scheduledAt) >= new Date()
              );
              const { isStagnant, daysInactive: stagnantDays } = checkIsStagnant(
                app.status,
                app.appliedAt || app.createdAt,
                Boolean(upcomingInterview)
              );
              const isAnalyzing = analyzingAppId === app.id;

              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#131726] p-4 shadow-lg hover:border-primary/40 transition-all space-y-3"
                >
                  {/* Top: Avatar, Title, Company & Menu */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary font-extrabold text-xs shrink-0 shadow-inner">
                        {app.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/cms/job-tracker/${app.id}`}
                          className="font-bold text-sm text-white hover:text-primary transition-colors block line-clamp-1 leading-snug"
                        >
                          {app.jobTitle}
                        </Link>
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{app.companyName}</span>
                          {app.location && <span className="text-gray-500">• {app.location}</span>}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
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
                        {isStagnant && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/cms/job-outreaches/new?company=${encodeURIComponent(app.companyName)}&role=${encodeURIComponent(app.jobTitle)}&purpose=follow_up&type=follow_up&jobAppId=${app.id}`}
                              className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-500/10 font-medium"
                            >
                              <Send className="h-4 w-4 text-amber-400" />
                              <span>⚡ Send Follow-Up Outreach</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {onAnalyzeAts && (app.atsScore === undefined || app.atsScore === null) && (
                          <DropdownMenuItem
                            onClick={() => onAnalyzeAts(app.id)}
                            disabled={isAnalyzing}
                            className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-500/10"
                          >
                            {isAnalyzing ? (
                              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-amber-400" />
                            )}
                            <span>⚡ Quick ATS Match</span>
                          </DropdownMenuItem>
                        )}
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

                  {/* Badges: Platform, Workplace, Salary */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${platformCfg.color}`}
                    >
                      {platformCfg.label}
                    </Badge>

                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-gray-300 border border-white/[0.05]">
                      {WORKPLACE_CONFIG[app.workplaceType]}
                    </Badge>

                    {(app.salaryMin || app.salaryMax) && (
                      <span className="text-[11px] font-bold text-emerald-400 ml-auto">
                        {formatSalary(
                          app.salaryMin,
                          app.salaryMax,
                          app.salaryCurrency,
                          app.salaryPeriod
                        )}
                      </span>
                    )}
                  </div>

                  {/* ATS Match & Stage Selector Row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                    <div>
                      {app.atsScore !== undefined && app.atsScore !== null ? (
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${atsConfig.bgColor} ${atsConfig.color} ${atsConfig.borderColor}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>ATS {app.atsScore}%</span>
                        </div>
                      ) : onAnalyzeAts ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isAnalyzing}
                          onClick={() => onAnalyzeAts(app.id)}
                          className="h-7 px-2 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-md border border-amber-500/30 gap-1 font-semibold transition-all"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-amber-400" />
                          )}
                          <span>{isAnalyzing ? "Matching..." : "⚡ Quick Fit"}</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-gray-500 italic">No ATS fit</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Select
                        value={app.status}
                        onValueChange={(val) => onStatusChange(app.id, val as JobApplicationStatus)}
                      >
                        <SelectTrigger className="h-7 text-xs w-[135px] bg-[#0C0E18] border-white/[0.1] rounded-lg text-white">
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
                    </div>
                  </div>

                  {/* Alerts (Upcoming Interview or Stagnant) */}
                  {upcomingInterview && (
                    <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 text-xs text-purple-300 flex items-center justify-between gap-1 shadow-inner">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
                        <span className="truncate font-semibold">{upcomingInterview.title}</span>
                      </div>
                      <Link
                        href={`/cms/job-tracker/${app.id}?tab=interview`}
                        className="text-[10px] font-bold underline shrink-0 hover:text-white text-purple-300 transition-colors"
                      >
                        Prep Now
                      </Link>
                    </div>
                  )}

                  {isStagnant && !upcomingInterview && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs text-amber-300 flex items-center justify-between gap-1 shadow-inner">
                      <div className="flex items-center gap-1.5 truncate">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate font-semibold">Follow-up Due ({stagnantDays}d)</span>
                      </div>
                      <Link
                        href={`/cms/job-outreaches/new?company=${encodeURIComponent(app.companyName)}&role=${encodeURIComponent(app.jobTitle)}&purpose=follow_up&type=follow_up&jobAppId=${app.id}`}
                        className="text-[10px] font-bold underline shrink-0 hover:text-white text-amber-300 transition-colors"
                      >
                        Nudge ✉️
                      </Link>
                    </div>
                  )}

                  {/* Card Footer: Applied Date */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {app.appliedAt ? formatDate(app.appliedAt) : "Not applied yet"}
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-primary hover:text-primary-foreground hover:bg-primary/20 gap-1 rounded-md"
                    >
                      <Link href={`/cms/job-tracker/${app.id}`}>
                        <Pencil className="w-3 h-3" />
                        <span>Workspace</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View (Screen > 768px) */}
      <div className="hidden min-[769px]:block rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-3 shadow-xl overflow-hidden backdrop-blur-md">
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
    </>
  );
}
