"use client";

import { useMemo } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Gift,
  LineChart,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { JOB_PLATFORM_CONFIG } from "@/lib/job-tracker";
import type { JobApplication, JobTrackerAnalytics } from "@/services/job-tracker/types";

interface AnalyticsDashboardProps {
  analytics?: JobTrackerAnalytics;
  applications: JobApplication[];
}

const PLATFORM_COLORS = [
  "#0284c7", // LinkedIn (sky)
  "#9333ea", // Jobstreet (purple)
  "#dc2626", // Glints (red)
  "#d97706", // Tech in Asia (amber)
  "#2563eb", // Indeed (blue)
  "#059669", // Company website (emerald)
  "#0d9488", // Referral (teal)
  "#71717a", // Other (zinc)
];

export function AnalyticsDashboard({ analytics, applications }: AnalyticsDashboardProps) {
  const platformChartData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.platformCounts)
      .map(([key, count]) => {
        const cfg = JOB_PLATFORM_CONFIG[key as keyof typeof JOB_PLATFORM_CONFIG] || {
          label: key,
        };
        return {
          name: cfg.label,
          count,
        };
      })
      .filter((p) => p.count > 0);
  }, [analytics]);

  const activityData = useMemo(() => {
    if (!analytics) return [];
    return (analytics.recentActivity || []).map((item) => {
      const date = new Date(item.date);
      const label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return {
        date: label,
        applications: item.count,
      };
    });
  }, [analytics]);

  const pendingFollowUps = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return applications.filter((app) => {
      if (app.status !== "applied") return false;
      if (!app.appliedAt) return false;
      return new Date(app.appliedAt) <= sevenDaysAgo;
    });
  }, [applications]);

  const conversionAnalytics = useMemo(() => {
    const isConverted = (app: JobApplication) =>
      ["screening", "interview_hr", "interview_tech", "interview_user", "offering", "accepted"].includes(
        app.status
      ) || ((app.interviews?.length ?? 0) > 0);

    const isOffered = (app: JobApplication) =>
      ["offering", "accepted"].includes(app.status);

    // By Platform
    const platformStats: Record<string, { total: number; interviews: number; offers: number }> = {};
    // By ATS Score Band
    const atsStats = {
      high: { label: "High Match (≥ 80%)", total: 0, interviews: 0 },
      mid: { label: "Medium Match (60-79%)", total: 0, interviews: 0 },
      low: { label: "Low Match (< 60% or Untailored)", total: 0, interviews: 0 },
    };
    // By Workplace Type
    const workplaceStats: Record<string, { label: string; total: number; interviews: number }> = {
      remote: { label: "Remote", total: 0, interviews: 0 },
      hybrid: { label: "Hybrid", total: 0, interviews: 0 },
      onsite: { label: "Onsite", total: 0, interviews: 0 },
    };

    applications.forEach((app) => {
      // Platform
      const p = app.platform || "other";
      if (!platformStats[p]) {
        platformStats[p] = { total: 0, interviews: 0, offers: 0 };
      }
      platformStats[p].total += 1;
      if (isConverted(app)) platformStats[p].interviews += 1;
      if (isOffered(app)) platformStats[p].offers += 1;

      // ATS
      if (app.atsScore && app.atsScore >= 80) {
        atsStats.high.total += 1;
        if (isConverted(app)) atsStats.high.interviews += 1;
      } else if (app.atsScore && app.atsScore >= 60) {
        atsStats.mid.total += 1;
        if (isConverted(app)) atsStats.mid.interviews += 1;
      } else {
        atsStats.low.total += 1;
        if (isConverted(app)) atsStats.low.interviews += 1;
      }

      // Workplace
      const w = app.workplaceType || "remote";
      if (workplaceStats[w]) {
        workplaceStats[w].total += 1;
        if (isConverted(app)) workplaceStats[w].interviews += 1;
      }
    });

    return {
      platformStats,
      atsStats,
      workplaceStats,
    };
  }, [applications]);

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Applied Today / Week</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Send className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {analytics.appliedToday}{" "}
            <span className="text-xs font-normal text-gray-400">
              / {analytics.appliedThisWeek} this week
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            {analytics.appliedThisMonth} apps this month
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Active Interviews</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-3">
            {analytics.activeInterviews}
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">HR, Tech, and Final stages</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Response Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-3">
            {analytics.responseRate}%
          </div>
          <Progress value={analytics.responseRate} className="h-1.5 mt-3 bg-white/[0.05]" />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Offering Rate</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-3">
            {analytics.totalOffers}{" "}
            <span className="text-xs font-normal text-gray-400">
              ({analytics.offerRate}%)
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            From {analytics.totalApplications} opportunities
          </p>
        </div>
      </div>

      {/* Middle Row: Funnel Pipeline & Activity Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-white">Application Pipeline Funnel</h3>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Conversion rate progression across recruitment milestones
          </p>

          <div className="space-y-4">
            {(analytics.funnel || []).map((step, idx) => (
              <div key={step.stage} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-2 text-gray-200">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] flex items-center justify-center font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-semibold">{step.stage}</span>
                  </span>
                  <span className="text-gray-400 font-mono">
                    <strong className="text-white">{step.count}</strong> ({step.percentage}%)
                  </span>
                </div>
                <Progress value={step.percentage} className="h-2 bg-white/[0.05]" />
              </div>
            ))}
          </div>
        </div>

        {/* 14-Day Activity Trend */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <LineChart className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-white">Application Activity (Last 14 Days)</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Daily volume of jobs applied and submitted
          </p>

          <div className="w-full min-w-0 pt-2">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} stroke="rgba(255,255,255,0.08)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} stroke="rgba(255,255,255,0.08)" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    backgroundColor: "#0C0E18",
                    borderColor: "rgba(255,255,255,0.12)",
                    fontSize: "12px",
                    color: "#ffffff",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ color: "#818CF8" }}
                />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorApp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Platforms & Actionable Follow-up List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Applications by Sourcing Platform</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Distribution of where you find and submit jobs
          </p>

          <div className="w-full min-w-0">
            {platformChartData.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-gray-500 text-xs">
                No platform data recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <BarChart
                  data={platformChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} stroke="rgba(255,255,255,0.08)" />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#94A3B8" }} stroke="rgba(255,255,255,0.08)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      backgroundColor: "#0C0E18",
                      borderColor: "rgba(255,255,255,0.12)",
                      fontSize: "12px",
                      color: "#ffffff",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {platformChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Follow-Up Radar (&gt; 7 Days Without Reply)</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Applications submitted over a week ago that may need a gentle check-in
          </p>

          <div>
            {pendingFollowUps.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center text-center text-gray-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2 opacity-80 animate-pulse" />
                <span className="text-gray-300 font-medium">All active applications are up-to-date! No pending follow-ups.</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                {pendingFollowUps.slice(0, 6).map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl border border-white/[0.06] bg-[#131726] flex items-center justify-between text-xs hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{app.jobTitle}</div>
                      <div className="text-gray-400 text-[11px] truncate mt-0.5">
                        {app.companyName} • Applied{" "}
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 border-amber-500/30 text-amber-400 bg-amber-500/10 font-semibold"
                    >
                      Ready to Follow up
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* A/B Testing & Channel Conversion Intelligence */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0C0E18] via-[#0E1222] to-[#08090C] p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Channel & ATS Tailoring Conversion Intelligence
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Analyze how different sourcing channels and ATS tailoring scores correlate with interview invitations and offers
            </p>
          </div>
          <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20 w-fit font-bold">
            A/B Channel Analytics
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Sourcing Channel Conversion Table */}
          <div className="space-y-3 p-4 rounded-xl border border-white/[0.06] bg-[#131726]">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span>By Sourcing Platform</span>
            </div>
            <div className="space-y-2 text-xs">
              {Object.entries(conversionAnalytics.platformStats).length === 0 ? (
                <span className="text-gray-500 italic text-xs">No platform data yet</span>
              ) : (
                Object.entries(conversionAnalytics.platformStats).map(([platform, stats]) => {
                  const cfg = JOB_PLATFORM_CONFIG[platform as keyof typeof JOB_PLATFORM_CONFIG] || {
                    label: platform,
                  };
                  const convRate = stats.total > 0 ? ((stats.interviews / stats.total) * 100).toFixed(0) : "0";
                  return (
                    <div key={platform} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                      <div className="flex justify-between font-semibold">
                        <span className="text-white">{cfg.label}</span>
                        <span className="text-emerald-400 font-bold">{convRate}% Conv.</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>{stats.total} applied • {stats.interviews} interviewed</span>
                        {stats.offers > 0 && <span className="text-purple-400 font-bold">{stats.offers} offered 🚀</span>}
                      </div>
                      <Progress value={parseFloat(convRate)} className="h-1 bg-white/[0.05]" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. ATS Score Band Conversion Impact */}
          <div className="space-y-3 p-4 rounded-xl border border-white/[0.06] bg-[#131726]">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ATS Match Score Impact</span>
            </div>
            <div className="space-y-2.5 text-xs">
              {Object.entries(conversionAnalytics.atsStats).map(([key, item]) => {
                const rate = item.total > 0 ? ((item.interviews / item.total) * 100).toFixed(0) : "0";
                return (
                  <div key={key} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white text-xs">{item.label}</span>
                      <Badge variant="outline" className={`text-[10px] font-bold ${key === "high" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : key === "mid" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"}`}>
                        {rate}% Conv.
                      </Badge>
                    </div>
                    <div className="text-[11px] text-gray-400 flex justify-between">
                      <span>{item.total} applications</span>
                      <span>{item.interviews} interviews</span>
                    </div>
                    <Progress value={parseFloat(rate)} className="h-1 bg-white/[0.05]" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Workplace Type Conversion */}
          <div className="space-y-3 p-4 rounded-xl border border-white/[0.06] bg-[#131726]">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>Workplace Model Success</span>
            </div>
            <div className="space-y-2.5 text-xs">
              {Object.entries(conversionAnalytics.workplaceStats).map(([key, item]) => {
                const rate = item.total > 0 ? ((item.interviews / item.total) * 100).toFixed(0) : "0";
                return (
                  <div key={key} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white text-xs">{item.label}</span>
                      <span className="font-bold text-primary">{rate}% Conv.</span>
                    </div>
                    <div className="text-[11px] text-gray-400 flex justify-between">
                      <span>{item.total} applications</span>
                      <span>{item.interviews} interviews</span>
                    </div>
                    <Progress value={parseFloat(rate)} className="h-1 bg-white/[0.05]" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
