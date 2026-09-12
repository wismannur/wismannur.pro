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
import { ProspectCard } from "./prospect-card";
import type { ProjectProspect, ProjectProspectStatus } from "@/services/project-finder/types";

interface KanbanColumnConfig {
  id: string;
  title: string;
  statuses: ProjectProspectStatus[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeColor: string;
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
    defaultStatus: "sourced",
  },
  {
    id: "audited",
    title: "Audited",
    statuses: ["audited"],
    icon: Sparkles,
    accentColor: "border-blue-500/30 bg-blue-500/5",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    defaultStatus: "audited",
  },
  {
    id: "building_mvp",
    title: "Building MVP",
    statuses: ["building_mvp"],
    icon: Laptop,
    accentColor: "border-amber-500/30 bg-amber-500/5",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    defaultStatus: "building_mvp",
  },
  {
    id: "pitch_ready",
    title: "Pitch Ready",
    statuses: ["pitch_ready"],
    icon: CheckCircle2,
    accentColor: "border-purple-500/30 bg-purple-500/5",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    defaultStatus: "pitch_ready",
  },
  {
    id: "outreach_sent",
    title: "Outreach Sent",
    statuses: ["outreach_sent"],
    icon: Send,
    accentColor: "border-cyan-500/30 bg-cyan-500/5",
    badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    defaultStatus: "outreach_sent",
  },
  {
    id: "closed",
    title: "Negotiation / Won",
    statuses: ["negotiation", "won"],
    icon: Trophy,
    accentColor: "border-emerald-500/30 bg-emerald-500/5",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
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

  const columnData = useMemo(() => {
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      items: prospects.filter((p) => col.statuses.includes(p.status)),
    }));
  }, [prospects]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
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
            className={`rounded-2xl border transition-all duration-200 p-3 sm:p-3.5 space-y-3 min-h-[400px] flex flex-col ${
              isDragOver
                ? "border-primary ring-2 ring-primary/40 bg-primary/10 scale-[1.01] shadow-xl shadow-primary/10"
                : `${col.accentColor}`
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <IconComponent className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {col.title}
                </h3>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono px-1.5 py-0.2 ${col.badgeColor}`}
              >
                {col.items.length}
              </Badge>
            </div>

            {/* Column Cards Container */}
            <div className="space-y-2.5 flex-1">
              {col.items.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onOpenDetail={onOpenDetail}
                  onUpdateStatus={onUpdateStatus}
                  onDelete={onDelete}
                />
              ))}

              {col.items.length === 0 && (
                <div className={`h-28 border border-dashed rounded-xl flex flex-col items-center justify-center text-center p-3 transition-colors ${
                  isDragOver ? "border-primary/60 bg-primary/5 text-primary" : "border-white/[0.06] text-gray-500"
                }`}>
                  <span className="text-[11px] font-medium">
                    {isDragOver ? "Drop prospect here" : "No prospects here"}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    Drag & drop to move stage
                  </span>
                </div>
              )}
            </div>

            {/* Quick Add button at column bottom if sourced */}
            {col.id === "sourced" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewProspect}
                className="w-full text-xs text-gray-400 hover:text-white hover:bg-white/[0.04] border border-dashed border-white/[0.08] h-8 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Prospect
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
