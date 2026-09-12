"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CmsMetricItem {
  id: string;
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: "default" | "emerald" | "amber" | "indigo" | "rose" | "purple";
  active?: boolean;
  onClick?: () => void;
}

export interface CmsMetricCardsProps {
  metrics: CmsMetricItem[];
  className?: string;
  gridCols?: string;
}

const colorMap = {
  default: {
    iconBg: "bg-white/[0.04] border-white/[0.06] text-gray-400 group-hover:text-white",
    activeBorder: "border-primary/40 ring-1 ring-primary/40 bg-[#0C0E18] shadow-primary/10",
    valueText: "text-white",
  },
  emerald: {
    iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    activeBorder: "border-emerald-500/40 ring-1 ring-emerald-500/40 bg-[#0C0E18] shadow-emerald-500/10",
    valueText: "text-emerald-400",
  },
  amber: {
    iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    activeBorder: "border-amber-500/40 ring-1 ring-amber-500/40 bg-[#0C0E18] shadow-amber-500/10",
    valueText: "text-amber-400",
  },
  indigo: {
    iconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    activeBorder: "border-indigo-500/40 ring-1 ring-indigo-500/40 bg-[#0C0E18] shadow-indigo-500/10",
    valueText: "text-indigo-400",
  },
  rose: {
    iconBg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    activeBorder: "border-rose-500/40 ring-1 ring-rose-500/40 bg-[#0C0E18] shadow-rose-500/10",
    valueText: "text-rose-400",
  },
  purple: {
    iconBg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    activeBorder: "border-purple-500/40 ring-1 ring-purple-500/40 bg-[#0C0E18] shadow-purple-500/10",
    valueText: "text-purple-400",
  },
};

export function CmsMetricCards({
  metrics,
  className,
  gridCols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
}: CmsMetricCardsProps) {
  return (
    <div className={cn("grid gap-3.5", gridCols, className)}>
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const color = colorMap[metric.color || "default"];
        const isClickable = Boolean(metric.onClick);

        const cardContent = (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">{metric.label}</span>
              <div
                className={cn(
                  "p-2 rounded-xl border transition-colors flex items-center justify-center shrink-0",
                  color.iconBg
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div
              className={cn(
                "text-2xl font-black mt-2 tracking-tight transition-colors",
                metric.active ? color.valueText : "text-white"
              )}
            >
              {metric.value}
            </div>
          </>
        );

        if (isClickable) {
          return (
            <button
              key={metric.id}
              type="button"
              onClick={metric.onClick}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 text-left transition-all duration-200 backdrop-blur-xl relative overflow-hidden group shadow-lg",
                metric.active
                  ? color.activeBorder
                  : "bg-[#0C0E18]/70 border-white/[0.08] hover:border-white/[0.16] hover:bg-[#0C0E18]"
              )}
            >
              {cardContent}
            </button>
          );
        }

        return (
          <div
            key={metric.id}
            className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/70 p-4 text-left backdrop-blur-xl shadow-lg"
          >
            {cardContent}
          </div>
        );
      })}
    </div>
  );
}

export default CmsMetricCards;
