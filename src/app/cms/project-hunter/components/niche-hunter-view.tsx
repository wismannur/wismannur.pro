"use client";

import { useState } from "react";
import {
  ExternalLink,
  TrendingUp,
  Store,
  Compass,
  CheckCircle2,
  Euro,
  Lightbulb,
} from "lucide-react";
import { HUNTER_NICHES } from "@/services/project-finder/hunter-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function NicheHunterView() {
  const [selectedNicheId, setSelectedNicheId] = useState<string>(HUNTER_NICHES[0].id);
  const activeNiche = HUNTER_NICHES.find((n) => n.id === selectedNicheId) || HUNTER_NICHES[0];

  return (
    <div className="space-y-8">
      {/* Strategic Value Rationale Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-[#0C0E18] to-emerald-500/10 p-5 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-2.5 py-0.5">
                Modernization Hunter Strategy
              </Badge>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> High-Ticket AOV + Established Trust = High Pitch Approval
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Targeting Mid-Market European, North American & ANZ Giants with Aging Storefronts
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Across Europe, the US, Canada, Australia, and New Zealand, thousands of high-margin retail businesses have strong brand equity (€10M–€90M / $10M–$100M GMV) but run on legacy monolithic storefronts with mobile friction. Sourcing these businesses and pitching an MVP proof-of-concept (built with Next.js 16 / React 19 or Nuxt 4 + Tailwind CSS) delivers immediate proof-of-value.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-black/40 border border-white/[0.08] text-right">
              <div className="text-[11px] text-gray-400 font-medium">Sweet Spot Criteria</div>
              <div className="text-sm font-semibold text-white mt-0.5">4.2+ Stars • 100+ Reviews</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">€10M – €90M / $10M – $100M GMV</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step Sourcing Workflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            step: "01",
            title: "Source via Google Maps",
            desc: "Use local native keywords to locate showroom retailers with verified customer volume.",
          },
          {
            step: "02",
            title: "Instant Tech Stack Audit",
            desc: "Run their domain through our Gemini AI + PageSpeed auditor to isolate CWV latency & monolithic stacks.",
          },
          {
            step: "03",
            title: "Deploy Modern MVP Demo",
            desc: "Spin up a live Next.js 16 or Nuxt 4 mobile catalog with sub-500ms navigation and instant cart.",
          },
          {
            step: "04",
            title: "90s Loom Pitch Outreach",
            desc: "Send personalized video + live demo to their E-Commerce / Digital Director in local hours.",
          },
        ].map((item) => (
          <div
            key={item.step}
            className="p-4 rounded-xl border border-white/[0.06] bg-[#0C0E18]/80 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-primary">{item.step}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/60" />
            </div>
            <div className="text-sm font-semibold text-white">{item.title}</div>
            <p className="text-xs text-gray-400 leading-normal">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Curated Niches Selector & Query Generator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              Highest-Potential Industry Niches
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Ranked by deal size, customer trust levels, and likelihood of pitch approval.
            </p>
          </div>
        </div>

        {/* Niche Tabs / Pill Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HUNTER_NICHES.map((niche) => {
            const isSelected = selectedNicheId === niche.id;
            return (
              <button
                key={niche.id}
                onClick={() => setSelectedNicheId(niche.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-primary/15 border-primary shadow-lg shadow-primary/10"
                    : "bg-[#0C0E18] border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono uppercase tracking-wider ${
                      niche.pitchApprovalPotential === "very_high"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {niche.pitchApprovalPotential === "very_high" ? "🔥 Highest Approval" : "⚡ High Approval"}
                  </Badge>
                  <span className="text-[11px] font-mono text-gray-400 flex items-center gap-0.5">
                    <Euro className="w-3 h-3 text-emerald-400" />
                    {niche.estimatedRevenue}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mt-2 line-clamp-1">{niche.title}</h4>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  {niche.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Niche Details & Live Google Maps Launchers */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                  Target Niche Dossier
                </span>
                <span className="text-xs text-emerald-400 font-mono">
                  {activeNiche.estimatedRevenue}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1.5">{activeNiche.title}</h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-3xl">
                {activeNiche.description}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 max-w-sm">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Why Pitch Approval is High:
              </div>
              <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                {activeNiche.conversionRationale}
              </p>
            </div>
          </div>

          {/* Preset Google Maps Query Launchers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-primary" />
                1-Click Google Maps Search Presets by Country
              </h4>
              <span className="text-[11px] text-gray-400">
                Opens Google Maps with native local query terms
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeNiche.recommendedQueries.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-black/40 hover:border-primary/40 transition-colors group"
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.flag}</span>
                      <span className="text-xs font-semibold text-white">{item.country}</span>
                    </div>
                    <div className="text-xs font-mono text-gray-400 group-hover:text-primary transition-colors">
                      &quot;{item.query}&quot;
                    </div>
                  </div>
                  <a
                    href={item.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-8 bg-[#0C0E18] border-white/[0.1] hover:bg-primary hover:text-white hover:border-primary text-gray-300 shrink-0"
                    >
                      <span>Search Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
