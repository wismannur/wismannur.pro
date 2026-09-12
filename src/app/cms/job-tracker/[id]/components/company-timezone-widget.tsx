"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Clock, Globe2, Sun, Moon, Briefcase, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompanyTimezoneWidgetProps {
  timezone?: string;
  location?: string;
  className?: string;
}

// Fallback inference of IANA timezone from common country/city keywords in location
function inferTimezoneFromLocation(loc?: string): string {
  if (!loc) return "UTC";
  const lower = loc.toLowerCase();
  if (lower.includes("netherlands") || lower.includes("dutch") || lower.includes("amsterdam") || lower.includes("roosendaal") || lower.includes("utrecht") || lower.includes("rotterdam")) {
    return "Europe/Amsterdam";
  }
  if (lower.includes("germany") || lower.includes("berlin") || lower.includes("munich")) {
    return "Europe/Berlin";
  }
  if (lower.includes("uk") || lower.includes("united kingdom") || lower.includes("london")) {
    return "Europe/London";
  }
  if (lower.includes("france") || lower.includes("paris")) {
    return "Europe/Paris";
  }
  if (lower.includes("singapore")) {
    return "Asia/Singapore";
  }
  if (lower.includes("indonesia") || lower.includes("jakarta") || lower.includes("bandung")) {
    return "Asia/Jakarta";
  }
  if (lower.includes("new york") || lower.includes("est") || lower.includes("boston")) {
    return "America/New_York";
  }
  if (lower.includes("san francisco") || lower.includes("california") || lower.includes("seattle") || lower.includes("pst")) {
    return "America/Los_Angeles";
  }
  if (lower.includes("chicago") || lower.includes("cst")) {
    return "America/Chicago";
  }
  if (lower.includes("australia") || lower.includes("sydney")) {
    return "Australia/Sydney";
  }
  return "Europe/Amsterdam"; // Default sensible European tech hub fallback
}

export function CompanyTimezoneWidget({ timezone, location, className }: CompanyTimezoneWidgetProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const activeTimezone = useMemo(() => {
    return timezone || inferTimezoneFromLocation(location);
  }, [timezone, location]);

  const timezoneInfo = useMemo(() => {
    try {
      const formatterTime = new Intl.DateTimeFormat("en-US", {
        timeZone: activeTimezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const formatterHour24 = new Intl.DateTimeFormat("en-US", {
        timeZone: activeTimezone,
        hour: "numeric",
        hourCycle: "h23",
      });

      const formatterDay = new Intl.DateTimeFormat("en-US", {
        timeZone: activeTimezone,
        weekday: "short",
      });

      const timeString = formatterTime.format(currentTime);
      const dayString = formatterDay.format(currentTime);
      const hour24 = parseInt(formatterHour24.format(currentTime), 10);

      // User's reference timezone: Asia/Jakarta (WIB = UTC+7)
      const userDateStr = currentTime.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
      const targetDateStr = currentTime.toLocaleString("en-US", { timeZone: activeTimezone });
      const userDate = new Date(userDateStr);
      const targetDate = new Date(targetDateStr);
      const diffHours = Math.round((targetDate.getTime() - userDate.getTime()) / (1000 * 60 * 60));

      const isWorkHours = hour24 >= 9 && hour24 < 17;
      const isMorningPrep = hour24 >= 8 && hour24 < 9;
      const isEvening = hour24 >= 17 && hour24 < 22;

      let statusBadge = {
        label: "Office Hours",
        color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        icon: Briefcase,
        description: "Recruiter / hiring team is actively at their desks.",
      };

      if (isMorningPrep) {
        statusBadge = {
          label: "Starting Workday",
          color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
          icon: Sun,
          description: "Workday is just starting. Inbox check begins soon.",
        };
      } else if (isEvening) {
        statusBadge = {
          label: "After Hours",
          color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          icon: Moon,
          description: "Evening time. Replies likely tomorrow morning.",
        };
      } else if (!isWorkHours) {
        statusBadge = {
          label: "Off Hours / Night",
          color: "bg-slate-500/15 text-slate-300 border-slate-500/30",
          icon: Moon,
          description: "Office is closed. Schedule follow-ups for tomorrow morning.",
        };
      }

      // Golden window in WIB
      // 09:00 target = (9 - diffHours) in WIB
      const goldenStartWib = (9 - diffHours + 24) % 24;
      const goldenEndWib = (13 - diffHours + 24) % 24;

      const diffLabel =
        diffHours === 0
          ? "Same as WIB"
          : diffHours < 0
          ? `${Math.abs(diffHours)}h behind WIB`
          : `${diffHours}h ahead of WIB`;

      return {
        timeString,
        dayString,
        diffLabel,
        isWorkHours,
        statusBadge,
        goldenWindow: `${goldenStartWib}:00 – ${goldenEndWib}:00 WIB`,
        tzShort: activeTimezone.split("/")[1]?.replace(/_/g, " ") || activeTimezone,
      };
    } catch {
      return null;
    }
  }, [activeTimezone, currentTime]);

  if (!timezoneInfo) return null;

  const StatusIcon = timezoneInfo.statusBadge.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#0C0E18]/85 backdrop-blur-md hover:border-indigo-500/40 transition-colors cursor-default text-xs ${
              className || ""
            }`}
          >
            <div className="flex items-center gap-1.5 text-slate-300">
              <Globe2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="font-semibold text-white">{timezoneInfo.tzShort}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {timezoneInfo.dayString} {timezoneInfo.timeString}
              </span>
            </div>

            <span className="text-slate-600">•</span>

            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-normal ${timezoneInfo.statusBadge.color}`}>
              <StatusIcon className="w-2.5 h-2.5 mr-1 inline" />
              {timezoneInfo.statusBadge.label}
            </Badge>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              ({timezoneInfo.diffLabel})
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs bg-[#121526] border-slate-700/60 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
            <span className="font-semibold text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> HQ Timezone
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{activeTimezone}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {timezoneInfo.statusBadge.description}
          </p>
          <div className="rounded-lg bg-indigo-950/40 border border-indigo-500/20 p-2 space-y-1">
            <div className="flex items-center gap-1 text-indigo-300 font-semibold text-[11px]">
              <Zap className="w-3 h-3 text-indigo-400" /> Golden Contact Window
            </div>
            <p className="text-[11px] text-slate-300">
              <strong className="text-emerald-400">{timezoneInfo.goldenWindow}</strong> matches their 09:00–13:00 morning inbox peak.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
