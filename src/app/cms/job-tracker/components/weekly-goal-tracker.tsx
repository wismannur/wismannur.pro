"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Target,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getStartOfIsoWeek, isApplicationInActiveInterview } from "@/lib/job-tracker";
import { userService } from "@/services";
import type { JobApplication } from "@/services/job-tracker/types";

interface WeeklyGoalTrackerProps {
  applications: JobApplication[];
  onAddJobClick?: () => void;
}

const STORAGE_KEY = "career_hub_weekly_target";

export function WeeklyGoalTracker({ applications, onAddJobClick: _onAddJobClick }: WeeklyGoalTrackerProps) {
  const queryClient = useQueryClient();

  const { data: userSettings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => userService.getSettings(),
  });

  const [localTarget, setLocalTarget] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return null;
  });

  const targetApplications =
    userSettings?.careerWeeklyTarget && userSettings.careerWeeklyTarget > 0
      ? userSettings.careerWeeklyTarget
      : (localTarget ?? 5);

  const handleSetTarget = async (newTarget: number) => {
    setLocalTarget(newTarget);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newTarget.toString());
    }
    try {
      await userService.updateSettings({ careerWeeklyTarget: newTarget });
      await queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    } catch {
      // Fallback already saved to local state and localStorage
    }
  };

  // Calculate applications submitted in the current calendar week (Monday-Sunday)
  const currentWeekStats = useMemo(() => {
    const now = new Date();
    const monday = getStartOfIsoWeek(now);

    const thisWeekApps = applications.filter((app) => {
      if (app.status === "wishlist") return false;
      const date = app.appliedAt ? new Date(app.appliedAt) : new Date(app.createdAt);
      return date >= monday;
    });

    const inInterview = applications.filter(isApplicationInActiveInterview).length;

    const submittedCount = thisWeekApps.length;
    const progressPercent = Math.min(100, Math.round((submittedCount / targetApplications) * 100));

    return {
      submittedCount,
      inInterview,
      progressPercent,
    };
  }, [applications, targetApplications]);

  const getStatusBadge = () => {
    if (currentWeekStats.progressPercent >= 100) {
      return {
        label: "Weekly Target Crushed! 🔥",
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      };
    }
    if (currentWeekStats.progressPercent >= 60) {
      return {
        label: "Strong Momentum ⚡",
        color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      };
    }
    return {
      label: `${Math.max(0, targetApplications - currentWeekStats.submittedCount)} more to weekly goal`,
      color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
  };

  const status = getStatusBadge();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0C0E18] via-[#0D101D] to-[#08090C] p-5 sm:p-6 shadow-xl backdrop-blur-xl">
      <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-5">
        {/* Left: Goal & Current Progress */}
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Target className="w-4 h-4 text-primary" />
              <span>Weekly Hunt Pace:</span>
            </div>
            <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </Badge>

            <div className="flex items-center gap-1 text-[11px] text-gray-400 ml-auto lg:ml-2">
              <span className="text-gray-400">Target:</span>
              {[3, 5, 8, 10, 15].map((num) => (
                <button
                  key={num}
                  onClick={() => handleSetTarget(num)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    targetApplications === num
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.05]"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar & Numeric Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-200">
                <strong className="text-white font-bold">{currentWeekStats.submittedCount}</strong> of {targetApplications} applications logged this week
              </span>
              <span className="font-mono text-primary font-bold">
                {currentWeekStats.progressPercent}%
              </span>
            </div>
            <Progress value={currentWeekStats.progressPercent} className="h-2 bg-white/[0.05]" />
          </div>
        </div>

        {/* Right: Quick Pipeline Pulse */}
        <div className="flex items-center gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-6 border-white/[0.08] shrink-0">
          <div className="text-left">
            <div className="text-[11px] text-gray-400">Active Funnel Pulse</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span><strong className="text-emerald-400">{currentWeekStats.inInterview}</strong> in Interview / Offer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
