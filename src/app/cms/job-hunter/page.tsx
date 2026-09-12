"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Compass,
  Globe2,
  Zap,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DirectAtsFeed } from "./components/direct-ats-feed";
import { JobDiscoveryFeed } from "../job-tracker/components/job-discovery-feed";

export default function JobHunterPage() {
  const [activeTab, setActiveTab] = useState<"ats" | "global">("ats");

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Job Hunter
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                AI Discovery
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
            Sourcing & discovery engine for high-signal tech roles. Find positions directly on company ATS feeds or explore worldwide remote opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/cms/job-tracker">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs h-9 bg-[#0C0E18] border-white/[0.1] hover:bg-white/[0.06] text-gray-300"
            >
              <Briefcase className="w-4 h-4 text-primary" />
              Open Job Tracker
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "ats" | "global")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-2 w-full sm:w-auto p-1 bg-[#0C0E18] border border-white/[0.08] rounded-2xl h-auto">
            <TabsTrigger
              value="ats"
              className="flex items-center gap-2 text-xs py-2 px-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Direct ATS Hub</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.1] text-gray-300 font-mono">
                Ashby • GH • Lever
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="global"
              className="flex items-center gap-2 text-xs py-2 px-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold"
            >
              <Globe2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Global Feeds</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.1] text-gray-300 font-mono">
                LinkedIn • Arbeitnow
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Contents */}
      {activeTab === "ats" && (
        <DirectAtsFeed />
      )}

      {activeTab === "global" && (
        <JobDiscoveryFeed />
      )}
    </div>
  );
}
