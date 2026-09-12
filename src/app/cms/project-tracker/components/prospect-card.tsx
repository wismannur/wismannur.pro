"use client";

import { useMemo } from "react";
import {
  Clock,
  ExternalLink,
  Laptop,
  MoreVertical,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectProspect, ProjectProspectStatus } from "@/services/project-finder/types";

interface ProspectCardProps {
  prospect: ProjectProspect;
  onOpenDetail: (prospect: ProjectProspect) => void;
  onUpdateStatus: (id: string, status: ProjectProspectStatus) => void;
  onDelete: (id: string) => void;
}

export function ProspectCard({
  prospect,
  onOpenDetail,
  onUpdateStatus,
  onDelete,
}: ProspectCardProps) {
  // Format local time for company timezone
  const localTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: prospect.timezone || "Europe/Amsterdam",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());
    } catch {
      return "--:--";
    }
  }, [prospect.timezone]);

  const scoreColor = useMemo(() => {
    const score = prospect.auditScore ?? 0;
    if (score >= 80) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (score >= 60) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  }, [prospect.auditScore]);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", prospect.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onOpenDetail(prospect)}
      className="group relative rounded-xl border border-white/[0.08] bg-[#0C0E18] p-4 hover:border-primary/40 hover:bg-white/[0.02] transition-all duration-200 cursor-grab active:cursor-grabbing shadow-md space-y-3"
    >
      {/* Top Row: Company & Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
              {prospect.companyName}
            </h4>
            <a
              href={prospect.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span>{prospect.city ? `${prospect.city}, ` : ""}{prospect.country}</span>
            <span>•</span>
            <span className="font-mono flex items-center gap-1 text-gray-300">
              <Clock className="w-3 h-3 text-sky-400" />
              {localTime}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            asChild
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-white -mr-1"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-[#0C0E18] border-white/[0.1] text-white text-xs"
          >
            <DropdownMenuItem onClick={() => onOpenDetail(prospect)}>
              Open Full Dossier
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem onClick={() => onUpdateStatus(prospect.id, "audited")}>
              Mark as Audited
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(prospect.id, "building_mvp")}>
              Mark as Building MVP
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(prospect.id, "pitch_ready")}>
              Mark as Pitch Ready
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(prospect.id, "outreach_sent")}>
              Mark as Outreach Sent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(prospect.id, "negotiation")}>
              Mark as In Negotiation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(prospect.id, "won")}>
              Mark as Won 🚀
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem
              onClick={() => onDelete(prospect.id)}
              className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
            >
              Delete Prospect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Middle Row: Industry & Audit Score */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <Badge
          variant="outline"
          className="text-[10px] bg-white/[0.04] text-gray-300 border-white/[0.08] font-normal"
        >
          {prospect.industry.replace("_", " ")}
        </Badge>

        {prospect.auditScore !== undefined ? (
          <Badge
            variant="outline"
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 ${scoreColor}`}
          >
            Score {prospect.auditScore}/100
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] font-mono text-gray-400 border-white/[0.08]"
          >
            Audit Pending
          </Badge>
        )}
      </div>

      {/* Assets Badges: MVP Demo & Loom */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {prospect.mvpDemoUrl ? (
          <Badge
            variant="outline"
            className="text-[10px] bg-primary/15 text-primary border-primary/30 flex items-center gap-1"
          >
            <Laptop className="w-2.5 h-2.5" />
            Modern MVP Ready
          </Badge>
        ) : (
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            No MVP Demo
          </span>
        )}

        {prospect.loomVideoUrl ? (
          <Badge
            variant="outline"
            className="text-[10px] bg-purple-500/15 text-purple-300 border-purple-500/30 flex items-center gap-1"
          >
            <Video className="w-2.5 h-2.5" />
            Loom Walkthrough
          </Badge>
        ) : (
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            No Loom
          </span>
        )}
      </div>

      {/* Contact Snippet if available */}
      {prospect.contactName && (
        <div className="text-[11px] text-gray-400 border-t border-white/[0.04] pt-2 flex items-center justify-between">
          <span className="truncate">
            Contact: <span className="text-gray-200">{prospect.contactName}</span>
          </span>
          {prospect.contactRole && (
            <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
              {prospect.contactRole}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
