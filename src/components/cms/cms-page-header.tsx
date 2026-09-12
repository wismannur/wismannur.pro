"use client";

import React from "react";
import { LucideIcon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CmsPageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  action?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function CmsPageHeader({
  icon: Icon,
  title,
  description,
  badge,
  actions,
  action,
  onRefresh,
  isRefreshing,
  className,
}: CmsPageHeaderProps) {
  const actionSlot = actions ?? action;
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row justify-between gap-4 items-start md:items-center pb-1",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-gradient-to-br from-primary/20 via-indigo-500/15 to-purple-500/10 border border-primary/30 text-primary shadow-md shadow-primary/20 shrink-0">
            <Icon className="w-5 h-5" />
          </span>
          <span className="truncate">{title}</span>
          {badge && (
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border-primary/30 font-semibold"
            >
              {badge}
            </Badge>
          )}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-10 px-3.5 gap-1.5 rounded-xl border-white/[0.08] bg-[#0C0E18]/80 text-gray-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 text-primary", isRefreshing && "animate-spin")}
            />
            <span>Refresh</span>
          </Button>
        )}

        {actionSlot}
      </div>
    </div>
  );
}

export default CmsPageHeader;
