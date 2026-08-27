"use client";

import { useMemo } from "react";
import {
	BarChart3,
	Briefcase,
	Calendar,
	CheckCircle2,
	Clock,
	Gift,
	LineChart,
	PieChart,
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
	if (!analytics) return null;

	const platformChartData = useMemo(() => {
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
	}, [analytics.platformCounts]);

	const activityData = useMemo(() => {
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
	}, [analytics.recentActivity]);

	const pendingFollowUps = useMemo(() => {
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		return applications.filter((app) => {
			if (app.status !== "applied") return false;
			if (!app.appliedAt) return false;
			return new Date(app.appliedAt) <= sevenDaysAgo;
		});
	}, [applications]);

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
						<p className="text-xs text-muted-foreground mt-1">
							HR, Tech, and Final stages
						</p>
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
										<strong className="text-foreground">{step.count}</strong> (
										{step.percentage}%)
									</span>
								</div>
								<Progress
									value={step.percentage}
									className="h-2 bg-muted transition-all"
								/>
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
												{app.appliedAt
													? new Date(app.appliedAt).toLocaleDateString()
													: "N/A"}
											</div>
										</div>
										<Badge variant="outline" className="text-[10px] shrink-0 border-amber-500/30 text-amber-600 bg-amber-500/10">
											Ready to Follow up
										</Badge>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
