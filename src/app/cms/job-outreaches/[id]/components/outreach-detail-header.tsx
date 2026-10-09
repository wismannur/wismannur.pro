"use client";

import React, { useState } from "react";
import {
  Building2,
  ExternalLink,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { JobOutreach, OutreachStatus } from "@/services";

export const STATUS_CONFIG: Record<OutreachStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-500/10 text-slate-300 border-slate-700/50",
  },
  sent: {
    label: "Awaiting Reply",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  follow_up_due: {
    label: "Follow-up Due ⚠️",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold animate-pulse",
  },
  replied: {
    label: "Replied 🎉",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold",
  },
  converted: {
    label: "Converted to Job Interview 🚀",
    className: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-bold",
  },
  closed: {
    label: "Closed / No Fit",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-700/40",
  },
};

interface OutreachDetailHeaderProps {
  outreach: JobOutreach;
  onStatusChange: (status: OutreachStatus) => void;
  onConvertToJobTracker: () => void;
  isConverting: boolean;
  onDelete: () => Promise<void>;
}

export function OutreachDetailHeader({
  outreach,
  onStatusChange,
  onConvertToJobTracker,
  isConverting,
  onDelete,
}: OutreachDetailHeaderProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusInfo = STATUS_CONFIG[outreach.status] || STATUS_CONFIG.sent;

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden p-6 rounded-2xl bg-[#0C0E18] border border-white/[0.08] shadow-xl">
        <div className="absolute -top-10 right-10 h-40 w-80 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Monogram Company Avatar */}
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-300 shrink-0 shadow-inner">
              {outreach.companyName ? outreach.companyName[0].toUpperCase() : "C"}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Building2 className="h-3.5 w-3.5" />
                <span>{outreach.companyName}</span>
                {outreach.companyWebsite && (
                  <a
                    href={outreach.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-indigo-300 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {outreach.jobTitle}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Select Box */}
            <Select value={outreach.status} onValueChange={(val) => onStatusChange(val as OutreachStatus)}>
              <SelectTrigger
                className={cn(
                  "h-9 px-3 text-xs font-semibold rounded-xl border transition-all w-[170px]",
                  statusInfo.className
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Awaiting Reply</SelectItem>
                <SelectItem value="follow_up_due">Follow-up Due ⚠️</SelectItem>
                <SelectItem value="replied">Replied 🎉</SelectItem>
                <SelectItem value="converted">Converted to Interview 🚀</SelectItem>
                <SelectItem value="closed">Closed / No Fit</SelectItem>
              </SelectContent>
            </Select>

            {/* Convert to Job Application Button */}
            {!outreach.jobApplication && (
              <Button
                variant="outline"
                size="sm"
                onClick={onConvertToJobTracker}
                disabled={isConverting}
                className="h-9 gap-2 text-xs font-semibold rounded-xl border-indigo-500/30 bg-[#131726] hover:bg-indigo-500/10 text-indigo-300"
              >
                {isConverting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>Convert to Interview</span>
              </Button>
            )}

            {/* Delete Outreach Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
              title="Delete Outreach"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete This Outreach?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              This action is permanent and will delete the entire email draft along with all associated replies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-white/[0.08] bg-[#131726] text-slate-300 hover:bg-[#1C2237]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              {isDeleting ? "Deleting..." : "Delete Outreach"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
