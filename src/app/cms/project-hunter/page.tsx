"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Crosshair,
  Globe2,
  Kanban,
  Zap,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { NicheHunterView } from "./components/niche-hunter-view";
import { InstantAuditorView } from "./components/instant-auditor-view";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";

export default function ProjectHunterPage() {
  const [activeTab, setActiveTab] = useState<"niches" | "auditor">("niches");

  useRegisterCmsPageContext({
    pageTitle: "Project Hunter",
    summary: `Active tab: ${activeTab}. Sourcing mid-market EU, NA & ANZ e-commerce modernization opportunities.`,
    filters: { activeTab },
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Crosshair className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Project Hunter
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                Modernization Engine
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
            Sourcing & discovery hub for mid-market European, North American & ANZ e-commerce brands with legacy tech stacks. Run instant audits and feed prospects directly into your modernizing pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/cms/project-tracker">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs h-9 bg-[#0C0E18] border-white/[0.1] hover:bg-white/[0.06] text-gray-300"
            >
              <Kanban className="w-4 h-4 text-primary" />
              Open Project Tracker
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "niches" | "auditor")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-2 w-full sm:w-auto p-1 bg-[#0C0E18] border border-white/[0.08] rounded-2xl h-auto">
            <TabsTrigger
              value="niches"
              className="flex items-center gap-2 text-xs py-2 px-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold"
            >
              <Globe2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Niche Discovery & Maps</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.1] text-gray-300 font-mono">
                6 High-Ticket Niches
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="auditor"
              className="flex items-center gap-2 text-xs py-2 px-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Storefront Auditor</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.1] text-gray-300 font-mono">
                AI + CWV
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Active Tab View */}
      {activeTab === "niches" ? <NicheHunterView /> : <InstantAuditorView />}
    </div>
  );
}
