"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Code2,
  Compass,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CAREER_HUB_MODULES = [
  {
    title: "Job Hunter",
    subtitle: "Sourcing & ATS Feeds",
    href: "/cms/job-hunter",
    icon: Compass,
    badge: "1. Sourcing",
    activePattern: /^\/cms\/job-hunter/,
  },
  {
    title: "Job Tracker",
    subtitle: "Kanban & Pipeline",
    href: "/cms/job-tracker",
    icon: Briefcase,
    badge: "2. Pipeline",
    activePattern: /^\/cms\/job-tracker/,
  },
  {
    title: "Job Outreaches",
    subtitle: "Cold Pitch & Follow-up",
    href: "/cms/job-outreaches",
    icon: SendHorizontal,
    badge: "3. Outreach",
    activePattern: /^\/cms\/job-outreaches/,
  },
  {
    title: "Frontend Mastery",
    subtitle: "Interview Sim Arena",
    href: "/cms/frontend-mastery",
    icon: Code2,
    badge: "4. Prep Arena",
    activePattern: /^\/cms\/frontend-mastery/,
  },
] as const;

export interface CareerHubNavProps {
  className?: string;
}

export function CareerHubNav({ className }: CareerHubNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Career Hub Navigation"
      className={cn(
        "relative rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 p-1.5 backdrop-blur-md shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max p-0.5">
          {CAREER_HUB_MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = module.activePattern.test(pathname);

            return (
              <Link
                key={module.href}
                href={module.href}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 outline-none select-none",
                  isActive
                    ? "bg-gradient-to-r from-primary/20 via-primary/10 to-indigo-500/10 text-white border border-primary/30 shadow-sm shadow-primary/20"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-white shadow-sm shadow-primary/40"
                      : "bg-white/[0.06] text-gray-400 group-hover:text-white group-hover:bg-white/[0.1]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold leading-tight">{module.title}</span>
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded-full font-mono uppercase tracking-wider font-semibold",
                        isActive
                          ? "bg-primary/25 text-primary border border-primary/30"
                          : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"
                      )}
                    >
                      {module.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-normal leading-tight hidden sm:inline">
                    {module.subtitle}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Global Career Hub Indicator Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 shrink-0 border-l border-white/[0.08] text-[11px] text-gray-400">
          <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="font-medium text-gray-300">Career Hub Suite</span>
        </div>
      </div>
    </nav>
  );
}

export default CareerHubNav;
