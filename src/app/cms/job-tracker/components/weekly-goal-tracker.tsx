"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Flame,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { JobApplication } from "@/services/job-tracker/types";

interface WeeklyGoalTrackerProps {
  applications: JobApplication[];
  onAddJobClick: () => void;
}

const STORAGE_KEY = "career_hub_weekly_target";

export function WeeklyGoalTracker({ applications, onAddJobClick }: WeeklyGoalTrackerProps) {
  const [targetApplications, setTargetApplications] = useState(5);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) setTargetApplications(parsed);
    }
  }, []);

  const handleSetTarget = (newTarget: number) => {
    setTargetApplications(newTarget);
    localStorage.setItem(STORAGE_KEY, newTarget.toString());
  };

  // Calculate applications submitted in the current calendar week (Monday-Sunday)
  const currentWeekStats = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const thisWeekApps = applications.filter((app) => {
      const date = app.appliedAt ? new Date(app.appliedAt) : new Date(app.createdAt);
      return date >= monday;
    });

    const inInterview = applications.filter((app) =>
      ["screening", "interview_hr", "interview_tech", "interview_user", "offering"].includes(
        app.status
      )
    ).length;

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
        label: "🔥 Weekly Goal Crushed!",
        color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    if (currentWeekStats.progressPercent >= 60) {
      return {
        label: "⚡ Strong Momentum",
        color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    }
    return {
      label: `🎯 ${Math.max(0, targetApplications - currentWeekStats.submittedCount)} more to target`,
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  };

  const status = getStatusBadge();

  return (
    <Card className="border-border/80 shadow-sm bg-gradient-to-r from-card via-card to-primary/5 overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          {/* Left: Goal & Current Progress */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Target className="w-4 h-4 text-primary" />
                <span>Weekly Job-Search Target:</span>
              </div>
              <Badge variant="outline" className={`text-xs font-bold ${status.color}`}>
                {status.label}
              </Badge>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto lg:ml-2">
                <span>Target:</span>
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleSetTarget(num)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      targetApplications === num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Bar & Numeric Indicator */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {currentWeekStats.submittedCount} of {targetApplications} applications logged this week
                </span>
                <span className="font-mono text-muted-foreground">
                  {currentWeekStats.progressPercent}%
                </span>
              </div>
              <Progress value={currentWeekStats.progressPercent} className="h-2" />
            </div>
          </div>

          {/* Right: Quick Pipeline Pulse */}
          <div className="flex items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-6 border-border/60 shrink-0">
            <div className="text-left">
              <div className="text-[11px] text-muted-foreground">Active in Funnel</div>
              <div className="text-sm font-bold text-primary flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {currentWeekStats.inInterview} in Interview / Offer
              </div>
            </div>

            <Button
              size="sm"
              onClick={onAddJobClick}
              className="gap-1.5 text-xs h-8 shadow-sm bg-primary hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Opportunity
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
