"use client";

import { useMemo } from "react";
import { Plus, Inbox, Send, Search, Users, Gift, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationCard } from "./application-card";
import type { JobApplication, JobApplicationStatus } from "@/services/job-tracker/types";

interface KanbanColumnConfig {
  id: string;
  title: string;
  statuses: JobApplicationStatus[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeColor: string;
  topGlow: string;
  defaultStatus: JobApplicationStatus;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "wishlist",
    title: "Wishlist / Sourced",
    statuses: ["wishlist"],
    icon: Inbox,
    accentColor: "border-slate-500/30 bg-slate-500/5",
    badgeColor: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    topGlow: "from-slate-500/20 to-transparent",
    defaultStatus: "wishlist",
  },
  {
    id: "applied",
    title: "Applied",
    statuses: ["applied"],
    icon: Send,
    accentColor: "border-blue-500/30 bg-blue-500/5",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    topGlow: "from-blue-500/20 to-transparent",
    defaultStatus: "applied",
  },
  {
    id: "screening",
    title: "Screening / OA",
    statuses: ["screening"],
    icon: Search,
    accentColor: "border-amber-500/30 bg-amber-500/5",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    topGlow: "from-amber-500/20 to-transparent",
    defaultStatus: "screening",
  },
  {
    id: "interviews",
    title: "Interview Stages",
    statuses: ["interview_hr", "interview_tech", "interview_user"],
    icon: Users,
    accentColor: "border-purple-500/30 bg-purple-500/5",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    topGlow: "from-purple-500/20 to-transparent",
    defaultStatus: "interview_hr",
  },
  {
    id: "offering",
    title: "Offering Letter 🎉",
    statuses: ["offering"],
    icon: Gift,
    accentColor: "border-emerald-500/30 bg-emerald-500/5",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    topGlow: "from-emerald-500/20 to-transparent",
    defaultStatus: "offering",
  },
  {
    id: "archive",
    title: "Outcome / Archived",
    statuses: ["accepted", "rejected", "withdrawn", "ghosted"],
    icon: Archive,
    accentColor: "border-zinc-500/30 bg-zinc-500/5",
    badgeColor: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    topGlow: "from-zinc-500/20 to-transparent",
    defaultStatus: "accepted",
  },
];

interface KanbanBoardProps {
  applications: JobApplication[];
  onStatusChange: (id: string, newStatus: JobApplicationStatus) => void;
  onDelete: (id: string) => void;
  onAddNew: (status?: JobApplicationStatus) => void;
}

export function KanbanBoard({
  applications,
  onStatusChange,
  onDelete,
  onAddNew,
}: KanbanBoardProps) {
  const groupedApps = useMemo(() => {
    const map = new Map<string, JobApplication[]>();
    for (const col of KANBAN_COLUMNS) {
      map.set(col.id, []);
    }

    for (const app of applications) {
      for (const col of KANBAN_COLUMNS) {
        if (col.statuses.includes(app.status)) {
          map.get(col.id)?.push(app);
          break;
        }
      }
    }

    return map;
  }, [applications]);

  return (
    <div className="flex items-start gap-5 overflow-x-auto pb-6 pt-1 px-0.5 scroll-smooth custom-scrollbar">
      {KANBAN_COLUMNS.map((col) => {
        const items = groupedApps.get(col.id) || [];
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className="relative flex flex-col w-[340px] min-w-[340px] max-w-[340px] shrink-0 rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-4 min-h-[580px] max-h-[calc(100vh-220px)] shadow-xl overflow-hidden backdrop-blur-md"
          >
            {/* Top ambient highlight header */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${col.topGlow}`} />

            {/* Column Header */}
            <div className="flex items-center justify-between mb-3.5 px-0.5 pt-0.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <Icon className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white">
                  {col.title}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] h-5 px-1.5 font-mono font-bold ${col.badgeColor}`}
                >
                  {items.length}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                onClick={() => onAddNew(col.defaultStatus)}
                title={`Add new to ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Card List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
              {items.length === 0 ? (
                <div className="h-48 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] flex flex-col items-center justify-center p-4 text-center text-gray-400 text-xs">
                  <span className="text-gray-400 font-medium">No jobs in this stage</span>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]">
                    Track new applications or drag cards here
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-[11px] h-auto p-0 mt-3 text-primary hover:text-primary/80 font-semibold"
                    onClick={() => onAddNew(col.defaultStatus)}
                  >
                    + Add Job Opportunity
                  </Button>
                </div>
              ) : (
                items.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onStatusChange={onStatusChange}
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
