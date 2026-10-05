"use client";

import { useMemo } from "react";
import {
  Clock,
  ExternalLink,
  FileText,
  Laptop,
  MoreHorizontal,
  Trash2,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectProspect, ProjectProspectStatus } from "@/services/project-finder/types";

interface ProspectTableProps {
  prospects: ProjectProspect[];
  isLoading?: boolean;
  onOpenDetail: (prospect: ProjectProspect) => void;
  onUpdateStatus: (id: string, status: ProjectProspectStatus) => void;
  onDelete: (id: string) => void;
}

const getCompanyInitials = (name: string) => {
  const clean = name.trim();
  if (!clean) return "CO";
  const parts = clean.split(" ");
  if (parts.length > 1 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

const getLocalTime = (timezone?: string) => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone || "Europe/Amsterdam",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return "--:--";
  }
};

const getScoreColor = (score?: number) => {
  if ((score ?? 0) >= 80) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if ((score ?? 0) >= 60) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-rose-500/15 text-rose-300 border-rose-500/30";
};

export function ProspectTable({
  prospects,
  isLoading = false,
  onOpenDetail,
  onUpdateStatus,
  onDelete,
}: ProspectTableProps) {
  return (
    <>
      {/* Mobile Cards View (Screen <= 768px) */}
      <div className="block min-[769px]:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`prospect-skeleton-${idx}`}
                className="rounded-2xl border border-white/[0.08] bg-[#131726] p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl bg-white/[0.06]" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32 bg-white/[0.06] rounded-md" />
                      <Skeleton className="h-3 w-20 bg-white/[0.06] rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="w-7 h-7 rounded-lg bg-white/[0.06]" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 bg-white/[0.06] rounded-md" />
                  <Skeleton className="h-5 w-16 bg-white/[0.06] rounded-md" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                  <Skeleton className="h-7 w-28 bg-white/[0.06] rounded-md" />
                  <Skeleton className="h-7 w-20 bg-white/[0.06] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : prospects.length === 0 ? (
          <EmptyState
            icon={<Laptop className="h-8 w-8 text-primary" />}
            title="No prospects found"
            description="Start auditing websites or adding new client opportunities to your pipeline."
            variant="card"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {prospects.map((prospect) => {
              const localTime = getLocalTime(prospect.timezone);
              const scoreColor = getScoreColor(prospect.auditScore);
              const initials = getCompanyInitials(prospect.companyName);

              return (
                <div
                  key={prospect.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#131726] p-4 shadow-lg hover:border-primary/40 transition-all space-y-3"
                >
                  {/* Top: Avatar, Company Name, External Link & Actions */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary font-mono font-bold text-xs shrink-0 shadow-inner">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(prospect)}
                            className="font-bold text-sm text-white hover:text-primary transition-colors truncate text-left"
                          >
                            {prospect.companyName}
                          </button>
                          {prospect.companyWebsite && (
                            <a
                              href={prospect.companyWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-white transition-colors shrink-0"
                              title="Visit website"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{prospect.city ? `${prospect.city}, ` : ""}{prospect.country}</span>
                          <span className="text-gray-500">•</span>
                          <span className="font-mono text-gray-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-400" />
                            {localTime}
                          </span>
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
                      <DropdownMenuContent align="end" className="w-48 bg-[#0C0E18] border-white/[0.1] text-white">
                        <DropdownMenuItem
                          onClick={() => onOpenDetail(prospect)}
                          className="cursor-pointer gap-2"
                        >
                          <FileText className="h-4 w-4 text-primary" />
                          <span>Open Dossier</span>
                        </DropdownMenuItem>
                        {prospect.companyWebsite && (
                          <DropdownMenuItem asChild>
                            <a
                              href={prospect.companyWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                              <span>Visit Website</span>
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-white/[0.08]" />
                        <DropdownMenuItem
                          onClick={() => onDelete(prospect.id)}
                          className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer gap-2"
                        >
                          <Trash2 className="h-4 w-4 text-rose-400" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Badges: Industry, Audit Score, Proof Assets */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-white/[0.04] text-gray-300 border-white/[0.08] capitalize"
                    >
                      {prospect.industry.replace("_", " ")}
                    </Badge>

                    {prospect.auditScore !== undefined ? (
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono px-2 py-0.5 ${scoreColor}`}
                      >
                        Audit: {prospect.auditScore}/100
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic">Audit pending</span>
                    )}

                    {prospect.mvpDemoUrl && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-primary/15 text-primary border-primary/30 gap-1"
                      >
                        <Laptop className="w-2.5 h-2.5" />
                        MVP Ready
                      </Badge>
                    )}

                    {prospect.loomVideoUrl && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-purple-500/15 text-purple-300 border-purple-500/30 gap-1"
                      >
                        <Video className="w-2.5 h-2.5" />
                        Loom Ready
                      </Badge>
                    )}
                  </div>

                  {/* Contact info if available */}
                  {prospect.contactName && (
                    <div className="text-xs text-gray-300 flex items-center gap-1.5 pt-1">
                      <span className="text-gray-500 text-[11px]">Contact:</span>
                      <span className="font-medium text-white">{prospect.contactName}</span>
                      {prospect.contactRole && (
                        <span className="text-gray-400 text-[10px]">({prospect.contactRole})</span>
                      )}
                    </div>
                  )}

                  {/* Footer: Stage Selector & Dossier Button */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                    <Select
                      value={prospect.status}
                      onValueChange={(val) => onUpdateStatus(prospect.id, val as ProjectProspectStatus)}
                    >
                      <SelectTrigger className="h-7 text-xs w-[130px] bg-[#0C0E18] border-white/[0.1] rounded-lg text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                        <SelectItem value="sourced">Sourced</SelectItem>
                        <SelectItem value="audited">Audited</SelectItem>
                        <SelectItem value="building_mvp">Building MVP</SelectItem>
                        <SelectItem value="pitch_ready">Pitch Ready</SelectItem>
                        <SelectItem value="outreach_sent">Outreach Sent</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="won">Won 🚀</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenDetail(prospect)}
                      className="h-7 px-2.5 text-xs text-gray-300 hover:text-white border-white/[0.1] bg-white/[0.02] gap-1 rounded-lg"
                    >
                      <FileText className="w-3 h-3 text-primary" />
                      <span>Dossier</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View (Screen > 768px) */}
      <div className="hidden min-[769px]:block rounded-2xl border border-white/[0.08] bg-[#0C0E18] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 border-b border-white/[0.08] text-gray-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Industry &amp; Assets</th>
                <th className="py-3 px-4">Location &amp; Time</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {prospects.map((prospect) => {
                const localTime = getLocalTime(prospect.timezone);
                const scoreColor = getScoreColor(prospect.auditScore);

                return (
                  <tr
                    key={prospect.id}
                    onClick={() => onOpenDetail(prospect)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{prospect.companyName}</span>
                        {prospect.companyWebsite && (
                          <a
                            href={prospect.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Unified Industry & Proof Assets */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white/[0.04] text-gray-300 border-white/[0.08] capitalize"
                        >
                          {prospect.industry.replace("_", " ")}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          {prospect.mvpDemoUrl && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-primary/15 text-primary border-primary/30 gap-1"
                            >
                              <Laptop className="w-2.5 h-2.5" />
                              MVP
                            </Badge>
                          )}
                          {prospect.loomVideoUrl && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-purple-500/15 text-purple-300 border-purple-500/30 gap-1"
                            >
                              <Video className="w-2.5 h-2.5" />
                              Loom
                            </Badge>
                          )}
                          {!prospect.mvpDemoUrl && !prospect.loomVideoUrl && (
                            <span className="text-gray-500 text-[10px] italic">No proof assets</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Location & Local Time */}
                    <td className="py-3 px-4 text-gray-400">
                      <div className="flex flex-col gap-0.5">
                        <span>{prospect.city ? `${prospect.city}, ` : ""}{prospect.country}</span>
                        <span className="font-mono text-gray-300 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-sky-400" />
                          {localTime}
                        </span>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4 text-center">
                      {prospect.auditScore !== undefined ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono px-2 py-0.5 ${scoreColor}`}
                        >
                          {prospect.auditScore}/100
                        </Badge>
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </td>

                    {/* Stage */}
                    <td
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={prospect.status}
                        onValueChange={(val) => onUpdateStatus(prospect.id, val as ProjectProspectStatus)}
                      >
                        <SelectTrigger className="h-7 w-32 text-[11px] bg-black/40 border-white/[0.1] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                          <SelectItem value="sourced">Sourced</SelectItem>
                          <SelectItem value="audited">Audited</SelectItem>
                          <SelectItem value="building_mvp">Building MVP</SelectItem>
                          <SelectItem value="pitch_ready">Pitch Ready</SelectItem>
                          <SelectItem value="outreach_sent">Outreach Sent</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="won">Won 🚀</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-gray-300">
                      {prospect.contactName ? (
                        <div>
                          <div className="font-medium">{prospect.contactName}</div>
                          <div className="text-[10px] text-gray-400">{prospect.contactRole}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenDetail(prospect)}
                          className="text-xs h-7 px-2 text-gray-300 hover:text-white"
                        >
                          Dossier
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(prospect.id)}
                          className="h-7 w-7 text-gray-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {prospects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No prospects found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
