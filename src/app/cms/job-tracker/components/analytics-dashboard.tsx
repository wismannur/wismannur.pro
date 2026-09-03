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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Applied Today / Week
            </CardTitle>
            <Send className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.appliedToday}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {analytics.appliedThisWeek} this week
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.appliedThisMonth} applications this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Interviews
            </CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {analytics.activeInterviews}
            </div>
            <p className="text-xs text-muted-foreground mt-1">HR, Tech, and Final stages</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Response Rate
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {analytics.responseRate}%
            </div>
            <Progress value={analytics.responseRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Offering Rate
            </CardTitle>
            <Gift className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {analytics.totalOffers}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({analytics.offerRate}%)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Offers from {analytics.totalApplications} opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Funnel Pipeline & Activity Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Application Pipeline Funnel
            </CardTitle>
            <CardDescription className="text-xs">
              Conversion rate progression across recruitment milestones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {(analytics.funnel || []).map((step, idx) => (
              <div key={step.stage} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {step.stage}
                  </span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{step.count}</strong> ({step.percentage}%)
                  </span>
                </div>
                <Progress value={step.percentage} className="h-2 bg-muted transition-all" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 14-Day Activity Trend */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LineChart className="w-4 h-4 text-blue-500" />
              Application Activity (Last 14 Days)
            </CardTitle>
            <CardDescription className="text-xs">
              Daily volume of jobs applied and submitted
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full min-w-0 pt-4">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorApp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Platforms & Actionable Follow-up List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Applications by Sourcing Platform
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of where you find and submit jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full min-w-0">
            {platformChartData.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-xs">
                No platform data recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <BarChart
                  data={platformChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      fontSize: "12px",
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
          </CardContent>
        </Card>

        {/* Pending Follow-ups */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Follow-Up Radar (&gt; 7 Days Without Reply)
            </CardTitle>
            <CardDescription className="text-xs">
              Applications submitted over a week ago that may need a gentle check-in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingFollowUps.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                <span>All active applications are up-to-date! No pending follow-ups.</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {pendingFollowUps.slice(0, 6).map((app) => (
                  <div
                    key={app.id}
                    className="p-2.5 rounded-lg border border-border/70 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{app.jobTitle}</div>
                      <div className="text-muted-foreground text-[11px] truncate">
                        {app.companyName} • Applied{" "}
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 border-amber-500/30 text-amber-600 bg-amber-500/10"
                    >
                      Ready to Follow up
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* A/B Testing & Channel Conversion Intelligence */}
      <Card className="border-border/80 shadow-sm bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Channel & ATS Tailoring Conversion Intelligence
              </CardTitle>
              <CardDescription className="text-xs">
                Analyze how different sourcing channels and ATS tailoring scores correlate with interview invitations and offers
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20 w-fit">
              A/B Channel Analytics
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Sourcing Channel Conversion Table */}
            <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-card">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                By Sourcing Platform
              </div>
              <div className="space-y-2 text-xs">
                {Object.entries(conversionAnalytics.platformStats).length === 0 ? (
                  <span className="text-muted-foreground italic text-xs">No platform data yet</span>
                ) : (
                  Object.entries(conversionAnalytics.platformStats).map(([platform, stats]) => {
                    const cfg = JOB_PLATFORM_CONFIG[platform as keyof typeof JOB_PLATFORM_CONFIG] || {
                      label: platform,
                    };
                    const convRate = stats.total > 0 ? ((stats.interviews / stats.total) * 100).toFixed(0) : "0";
                    return (
                      <div key={platform} className="p-2 rounded-lg bg-muted/20 border border-border/40 space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span>{cfg.label}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{convRate}% Interview Rate</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{stats.total} applied • {stats.interviews} interviewed</span>
                          {stats.offers > 0 && <span className="text-purple-600 font-bold">{stats.offers} offered 🚀</span>}
                        </div>
                        <Progress value={parseFloat(convRate)} className="h-1 bg-muted" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. ATS Score Band Conversion Impact */}
            <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-card">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                ATS Match Score Impact
              </div>
              <div className="space-y-2.5 text-xs">
                {Object.entries(conversionAnalytics.atsStats).map(([key, item]) => {
                  const rate = item.total > 0 ? ((item.interviews / item.total) * 100).toFixed(0) : "0";
                  return (
                    <div key={key} className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground text-xs">{item.label}</span>
                        <Badge variant="outline" className={`text-[10px] font-bold ${key === "high" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : key === "mid" ? "bg-blue-500/10 text-blue-600 border-blue-500/30" : "bg-zinc-500/10 text-zinc-500"}`}>
                          {rate}% Conv.
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex justify-between">
                        <span>{item.total} applications</span>
                        <span>{item.interviews} interviews</span>
                      </div>
                      <Progress value={parseFloat(rate)} className="h-1 bg-muted" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Workplace Type Conversion */}
            <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-card">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                Workplace Model Success
              </div>
              <div className="space-y-2.5 text-xs">
                {Object.entries(conversionAnalytics.workplaceStats).map(([key, item]) => {
                  const rate = item.total > 0 ? ((item.interviews / item.total) * 100).toFixed(0) : "0";
                  return (
                    <div key={key} className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground text-xs">{item.label}</span>
                        <span className="font-bold text-primary">{rate}% Interview Rate</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex justify-between">
                        <span>{item.total} applications</span>
                        <span>{item.interviews} interviews</span>
                      </div>
                      <Progress value={parseFloat(rate)} className="h-1 bg-muted" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
