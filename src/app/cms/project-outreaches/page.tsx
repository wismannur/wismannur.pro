"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Kanban,
  Laptop,
  Linkedin,
  Mail,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectFinderService } from "@/services/project-finder";
import type { ProjectProspect } from "@/services/project-finder/types";
import { ProspectDetailDialog } from "../project-tracker/components/prospect-detail-dialog";
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";

export default function ProjectOutreachesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProspect, setSelectedProspect] = useState<ProjectProspect | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multi-market clocks
  const [marketTimes, setMarketTimes] = useState<{
    cet: string;
    isCetWorking: boolean;
    et: string;
    isEtWorking: boolean;
    pt: string;
    isPtWorking: boolean;
    aest: string;
    isAestWorking: boolean;
  }>({
    cet: "--:--",
    isCetWorking: false,
    et: "--:--",
    isEtWorking: false,
    pt: "--:--",
    isPtWorking: false,
    aest: "--:--",
    isAestWorking: false,
  });

  useEffect(() => {
    const updateClocks = () => {
      try {
        const now = new Date();
        const getTimeInTz = (tz: string) => {
          const formatted = new Intl.DateTimeFormat("en-GB", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(now);
          const hour = parseInt(formatted.split(":")[0], 10);
          return {
            time: formatted,
            isWorking: hour >= 9 && hour < 18,
          };
        };

        const cetData = getTimeInTz("Europe/Amsterdam");
        const etData = getTimeInTz("America/New_York");
        const ptData = getTimeInTz("America/Los_Angeles");
        const aestData = getTimeInTz("Australia/Sydney");

        setMarketTimes({
          cet: cetData.time,
          isCetWorking: cetData.isWorking,
          et: etData.time,
          isEtWorking: etData.isWorking,
          pt: ptData.time,
          isPtWorking: ptData.isWorking,
          aest: aestData.time,
          isAestWorking: aestData.isWorking,
        });
      } catch {
        // ignore
      }
    };
    updateClocks();
    const interval = setInterval(updateClocks, 30000);
    return () => clearInterval(interval);
  }, []);

  const {
    data: prospects = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["projectProspects"],
    queryFn: () => projectFinderService.getAll(),
  });

  const outreachProspects = useMemo(() => {
    // Prospects that are either ready to pitch, sent, in negotiation, or won
    return prospects.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.contactName && p.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [prospects, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const pitchReady = prospects.filter((p) => p.status === "pitch_ready").length;
    const outreachSent = prospects.filter((p) => p.status === "outreach_sent").length;
    const negotiation = prospects.filter((p) => p.status === "negotiation").length;
    const won = prospects.filter((p) => p.status === "won").length;

    return {
      pitchReady,
      outreachSent,
      negotiation,
      won,
      totalActive: pitchReady + outreachSent + negotiation,
    };
  }, [prospects]);

  useRegisterCmsPageContext({
    pageTitle: "Project Outreaches",
    summary: `Active pipeline: ${stats.totalActive} prospects (${stats.pitchReady} pitch ready, ${stats.outreachSent} sent, ${stats.negotiation} in negotiation, ${stats.won} won).`,
    activeItems: outreachProspects.slice(0, 20).map((p) => ({
      id: p.id,
      companyName: p.companyName,
      status: p.status,
      country: p.country,
      contactName: p.contactName,
      contactEmail: p.contactEmail,
      estimatedRevenueTier: p.estimatedRevenueTier,
      auditScore: p.auditScore,
    })),
    filters: { searchQuery, statusFilter },
  });

  const handleMarkAsSent = async (prospect: ProjectProspect) => {
    try {
      await projectFinderService.update(prospect.id, {
        status: "outreach_sent",
        outreachStatus: "inmail_sent",
        outreachSentAt: new Date(),
      });
      toast.success(`Outreach marked as sent for ${prospect.companyName}!`);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  const handleCopyPitch = (prospect: ProjectProspect) => {
    if (!prospect.pitchScript) {
      toast.error("No pitch script generated yet. Open dossier to generate one.");
      return;
    }
    navigator.clipboard.writeText(prospect.pitchScript);
    setCopiedId(prospect.id);
    toast.success("Pitch script copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Rocket className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Project Outreaches
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                Dispatch Hub
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
            Dispatch hyper-personalized pitches (Live Nuxt 4 MVP + 90s Loom Walkthrough) to European digital directors at the optimal local business hours.
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
              Open Pipeline CRM
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-9 w-9 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Global Timezone Dispatch Banner */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0C0E18] via-primary/5 to-black p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          {/* Europe */}
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border shrink-0 ${marketTimes.isCetWorking ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">Europe (CET):</span>
                <span className="text-xs font-mono font-bold text-white">{marketTimes.cet}</span>
              </div>
              <div className="text-[10px] text-gray-400">
                {marketTimes.isCetWorking ? "🟢 Active Hours (09:00-18:00)" : "🌙 Outside Hours"}
              </div>
            </div>
          </div>

          {/* US / CA Eastern */}
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border shrink-0 ${marketTimes.isEtWorking ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">US / CA East (ET):</span>
                <span className="text-xs font-mono font-bold text-white">{marketTimes.et}</span>
              </div>
              <div className="text-[10px] text-gray-400">
                {marketTimes.isEtWorking ? "🟢 Active Hours (09:00-18:00)" : "🌙 Outside Hours"}
              </div>
            </div>
          </div>

          {/* US / CA Pacific */}
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border shrink-0 ${marketTimes.isPtWorking ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">US / CA West (PT):</span>
                <span className="text-xs font-mono font-bold text-white">{marketTimes.pt}</span>
              </div>
              <div className="text-[10px] text-gray-400">
                {marketTimes.isPtWorking ? "🟢 Active Hours (09:00-18:00)" : "🌙 Outside Hours"}
              </div>
            </div>
          </div>

          {/* Australia & NZ */}
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border shrink-0 ${marketTimes.isAestWorking ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">Australia / NZ:</span>
                <span className="text-xs font-mono font-bold text-white">{marketTimes.aest}</span>
              </div>
              <div className="text-[10px] text-gray-400">
                {marketTimes.isAestWorking ? "🟢 Active Hours (09:00-18:00)" : "🌙 Outside Hours"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-300 shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08]">
            Markets: Europe 🇪🇺 • USA 🇺🇸 • Canada 🇨🇦 • Australia 🇦🇺 • NZ 🇳🇿
          </span>
        </div>
      </div>

      {/* Outreach Pipeline Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0C0E18] border border-white/[0.08] space-y-1">
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Pitch Ready</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">{stats.pitchReady}</div>
          <div className="text-[10px] text-gray-500">MVP & script prepared</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0E18] border border-white/[0.08] space-y-1">
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Dispatched</span>
            <Send className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">{stats.outreachSent}</div>
          <div className="text-[10px] text-gray-500">Awaiting executive reply</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0E18] border border-white/[0.08] space-y-1">
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>In Negotiation</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{stats.negotiation}</div>
          <div className="text-[10px] text-gray-500">Active dialogue with leads</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0E18] border border-white/[0.08] space-y-1">
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Contracts Won</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{stats.won}</div>
          <div className="text-[10px] text-gray-500">Modernization retainers 🚀</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, decision makers..."
              className="pl-8 bg-[#0C0E18] border-white/[0.08] text-xs h-9 text-white focus:border-primary"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px] text-xs bg-[#0C0E18] border-white/[0.08] text-white">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
              <SelectItem value="all">All Outreach Stages</SelectItem>
              <SelectItem value="pitch_ready">Pitch Ready</SelectItem>
              <SelectItem value="outreach_sent">Outreach Sent</SelectItem>
              <SelectItem value="negotiation">In Negotiation</SelectItem>
              <SelectItem value="won">Won Deals</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Outreaches List Cards */}
      <div className="space-y-3">
        {outreachProspects.map((prospect) => {
          const localTime = (() => {
            try {
              return new Intl.DateTimeFormat("en-GB", {
                timeZone: prospect.timezone || "Europe/Amsterdam",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }).format(new Date());
            } catch {
              return "--:--";
            }
          })();

          return (
            <div
              key={prospect.id}
              className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 hover:border-primary/30 transition-all duration-200 shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      {prospect.companyName}
                      <a
                        href={prospect.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono bg-white/[0.04] text-gray-300 border-white/[0.08]"
                    >
                      {prospect.country}
                    </Badge>
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      {localTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {prospect.contactName ? (
                      <span>
                        Target: <span className="text-white font-medium">{prospect.contactName}</span> ({prospect.contactRole || "Decision Maker"})
                      </span>
                    ) : (
                      <span className="text-gray-500">No contact person identified yet</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono px-2.5 py-1 ${
                      prospect.status === "won"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : prospect.status === "negotiation"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : prospect.status === "outreach_sent"
                        ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                        : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                    }`}
                  >
                    {prospect.status.replace("_", " ").toUpperCase()}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProspect(prospect);
                      setIsDetailOpen(true);
                    }}
                    className="text-xs h-8 bg-black/40 border-white/[0.1] text-gray-300 hover:text-white"
                  >
                    Open Dossier
                  </Button>
                </div>
              </div>

              {/* Proof Assets Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/[0.04] text-xs">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-primary shrink-0" />
                  <div className="truncate">
                    <span className="text-gray-500">Live Modern MVP: </span>
                    {prospect.mvpDemoUrl ? (
                      <a
                        href={prospect.mvpDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Ready to Demo
                      </a>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-gray-500">90s Loom Walkthrough: </span>
                    {prospect.loomVideoUrl ? (
                      <a
                        href={prospect.loomVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline"
                      >
                        Recorded
                      </a>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-gray-500">Opportunity Score: </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {prospect.auditScore ? `${prospect.auditScore}/100` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Dispatch Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  {prospect.contactLinkedin && (
                    <a
                      href={prospect.contactLinkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8 bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        Open LinkedIn Profile
                      </Button>
                    </a>
                  )}

                  {prospect.contactEmail && (
                    <a href={`mailto:${prospect.contactEmail}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8 bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-white"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Send Email
                      </Button>
                    </a>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyPitch(prospect)}
                    className="gap-1.5 text-xs h-8 text-gray-400 hover:text-white"
                  >
                    {copiedId === prospect.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied Pitch
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Pitch Script
                      </>
                    )}
                  </Button>
                </div>

                {prospect.status === "pitch_ready" && (
                  <Button
                    size="sm"
                    onClick={() => handleMarkAsSent(prospect)}
                    className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Mark Outreach as Dispatched
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {outreachProspects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/[0.08] p-12 text-center space-y-3">
            <Rocket className="w-8 h-8 text-gray-500 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No active outreaches found</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Source mid-market targets in Project Hunter and prepare modernization pitches in Project Tracker to see them here.
            </p>
            <div className="pt-2">
              <Link href="/cms/project-hunter">
                <Button size="sm" className="gap-2 text-xs bg-primary text-white">
                  Launch Project Hunter
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Prospect Detail Modal */}
      <ProspectDetailDialog
        prospect={selectedProspect}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onProspectUpdated={(updated) => {
          setSelectedProspect(updated);
          refetch();
        }}
      />
    </div>
  );
}
