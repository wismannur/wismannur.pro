"use client";

import { useMemo, useState } from "react";
import {
  Inbox,
  Sparkles,
  Laptop,
  CheckCircle2,
  Send,
  Trophy,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDragToScroll } from "@/hooks/use-drag-to-scroll";
import { ProspectCard } from "./prospect-card";
import type { ProjectProspect, ProjectProspectStatus } from "@/services/project-finder/types";

interface KanbanColumnConfig {
  id: string;
  title: string;
  statuses: ProjectProspectStatus[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeColor: string;
  topGlow: string;
  defaultStatus: ProjectProspectStatus;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "sourced",
    title: "Sourced",
    statuses: ["sourced"],
    icon: Inbox,
    accentColor: "border-slate-500/30 bg-slate-500/5",
    badgeColor: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    topGlow: "from-slate-500/30 via-slate-400/10 to-transparent",
    defaultStatus: "sourced",
  },
  {
    id: "audited",
    title: "Audited",
    statuses: ["audited"],
    icon: Sparkles,
    accentColor: "border-blue-500/30 bg-blue-500/5",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    topGlow: "from-blue-500/30 via-blue-400/10 to-transparent",
    defaultStatus: "audited",
  },
  {
    id: "building_mvp",
    title: "Building MVP",
    statuses: ["building_mvp"],
    icon: Laptop,
    accentColor: "border-amber-500/30 bg-amber-500/5",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    topGlow: "from-amber-500/30 via-amber-400/10 to-transparent",
    defaultStatus: "building_mvp",
  },
  {
    id: "pitch_ready",
    title: "Pitch Ready",
    statuses: ["pitch_ready"],
    icon: CheckCircle2,
    accentColor: "border-purple-500/30 bg-purple-500/5",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    topGlow: "from-purple-500/30 via-purple-400/10 to-transparent",
    defaultStatus: "pitch_ready",
  },
  {
    id: "outreach_sent",
    title: "Outreach Sent",
    statuses: ["outreach_sent"],
    icon: Send,
    accentColor: "border-cyan-500/30 bg-cyan-500/5",
    badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    topGlow: "from-cyan-500/30 via-cyan-400/10 to-transparent",
    defaultStatus: "outreach_sent",
  },
  {
    id: "closed",
    title: "Negotiation / Won",
    statuses: ["negotiation", "won"],
    icon: Trophy,
    accentColor: "border-emerald-500/30 bg-emerald-500/5",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    topGlow: "from-emerald-500/30 via-emerald-400/10 to-transparent",
    defaultStatus: "negotiation",
  },
];

interface KanbanBoardProps {
  prospects: ProjectProspect[];
  onOpenDetail: (prospect: ProjectProspect) => void;
  onUpdateStatus: (id: string, status: ProjectProspectStatus) => void;
  onDelete: (id: string) => void;
  onNewProspect: () => void;
}

export function KanbanBoard({
  prospects,
  onOpenDetail,
  onUpdateStatus,
  onDelete,
  onNewProspect,
}: KanbanBoardProps) {
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const { containerRef, isDragging, events } = useDragToScroll<HTMLDivElement>();

  const columnData = useMemo(() => {
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      items: prospects.filter((p) => col.statuses.includes(p.status)),
    }));
  }, [prospects]);

  return (
    <div
      ref={containerRef}
      {...events}
      className={`flex items-start gap-5 overflow-x-auto pb-8 pt-1 px-1 scroll-smooth no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {columnData.map((col) => {
        const IconComponent = col.icon;
        const isDragOver = dragOverColId === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverColId !== col.id) {
                setDragOverColId(col.id);
              }
            }}
            onDragLeave={(e) => {
              // Prevent flickering when hovering over children
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOverColId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColId(null);
              const prospectId = e.dataTransfer.getData("text/plain");
              if (prospectId) {
                onUpdateStatus(prospectId, col.defaultStatus);
              }
            }}
            className={`relative flex flex-col w-[340px] min-w-[340px] max-w-[340px] shrink-0 rounded-2xl border transition-all duration-200 p-4 min-h-[580px] max-h-[calc(100vh-220px)] shadow-xl overflow-hidden backdrop-blur-md ${
              isDragOver
                ? "border-primary ring-2 ring-primary/40 bg-[#0C0E18] scale-[1.01] shadow-2xl shadow-primary/20"
                : "border-white/[0.08] bg-[#0C0E18]"
            }`}
          >
            {/* Top ambient highlight header */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${col.topGlow}`} />

            {/* Column Header */}
            <div className="flex items-center justify-between mb-3.5 px-0.5 pt-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0">
                  <IconComponent className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white truncate">
                  {col.title}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] h-5 px-1.5 font-mono font-bold shrink-0 ${col.badgeColor}`}
                >
                  {col.items.length}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
                onClick={onNewProspect}
                title={`Add new prospect to ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Column Cards Container (Vertical Scrollable, hidden scrollbar) */}
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-3.5 no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-text">
              {col.items.length === 0 ? (
                <div
                  className={`h-48 rounded-xl border border-dashed flex flex-col items-center justify-center p-4 text-center text-xs transition-colors ${
                    isDragOver
                      ? "border-primary/60 bg-primary/5 text-primary"
                      : "border-white/[0.08] bg-white/[0.01] text-gray-400"
                  }`}
                >
                  <span className="font-medium text-gray-300">
                    {isDragOver ? "Drop prospect here" : "No prospects in this stage"}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]">
                    {isDragOver ? "Release to update stage" : "Drag prospect cards here or add new"}
                  </p>
                  {col.id === "sourced" && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-[11px] h-auto p-0 mt-3 text-primary hover:text-primary/80 font-semibold"
                      onClick={onNewProspect}
                    >
                      + Add Prospect
                    </Button>
                  )}
                </div>
              ) : (
                col.items.map((prospect) => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    onOpenDetail={onOpenDetail}
                    onUpdateStatus={onUpdateStatus}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

