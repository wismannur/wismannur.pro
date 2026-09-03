"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Eye,
  FolderPlus,
  Heart,
  Inbox,
  Info,
  Layers,
  MessageSquare,
  PenLine,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { dashboardService } from "@/services";
import type {
  DashboardAlert,
  DraftEntry,
  InboxEntry,
  TopContentEntry,
} from "@/services/dashboard/types";

const timeAgo = (date: Date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
};

const Dashboard = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => dashboardService.getSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const counts = data?.counts;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome & Command Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-[450px] h-[250px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles size={12} className="animate-pulse" />
                <span>WORKSPACE COMMAND CENTER</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Neon Cloud Active</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Welcome back,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-primary">
                {user?.displayName || "Wisman"}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Real-time monitoring of content pipelines, incoming recruiter outreach, service
              inquiries, and live production telemetry.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              asChild
              size="sm"
              className="rounded-full gap-1.5 px-4 h-9 bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Link href="/cms/blogs/form">
                <Plus size={14} />
                <span>New Post</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5 px-4 h-9 border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-primary/40 transition-all"
            >
              <Link href="/cms/projects/form">
                <FolderPlus size={14} className="text-primary" />
                <span>New Project</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5 px-4 h-9 border-white/[0.12] bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <Link href="/" target="_blank">
                <ArrowUpRight size={14} />
                <span>Live Site</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard
          title="Articles & Posts"
          value={counts?.blogs.total ?? 0}
          subtitle={`${counts?.blogs.published ?? 0} live`}
          icon={<BookOpen className="h-4 w-4 text-indigo-400" />}
          linkTo="/cms/blogs"
          loading={isLoading}
          accentColor="indigo"
        />

        <StatsCard
          title="Case Studies"
          value={counts?.projects.total ?? 0}
          subtitle={`${counts?.projects.published ?? 0} live`}
          icon={<Layers className="h-4 w-4 text-purple-400" />}
          linkTo="/cms/projects"
          loading={isLoading}
          accentColor="purple"
        />

        <StatsCard
          title="Inbound Messages"
          value={counts?.contacts.total ?? 0}
          subtitle={`${counts?.contacts.unread ?? 0} unread`}
          icon={<MessageSquare className="h-4 w-4 text-sky-400" />}
          linkTo="/cms/contacts"
          loading={isLoading}
          highlight={(counts?.contacts.unread ?? 0) > 0}
          accentColor="sky"
        />

        <StatsCard
          title="Client Inquiries"
          value={counts?.serviceRequests.total ?? 0}
          subtitle={`${counts?.serviceRequests.pending ?? 0} pending`}
          icon={<Briefcase className="h-4 w-4 text-emerald-400" />}
          linkTo="/cms/services"
          loading={isLoading}
          highlight={(counts?.serviceRequests.pending ?? 0) > 0}
          accentColor="emerald"
        />

        <StatsCard
          title="Total Impressions"
          value={counts?.totalViews ?? 0}
          subtitle="Total reader views"
          icon={<BarChart3 className="h-4 w-4 text-rose-400" />}
          linkTo="/cms/blogs"
          loading={isLoading}
          accentColor="rose"
        />
      </div>

      {/* Alerts & Operational Notices */}
      {!isLoading && (data?.alerts.length ?? 0) > 0 && (
        <div className="space-y-2">
          {data!.alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* 2-Column Activity Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbox Stream */}
        <Card className="border border-white/[0.08] bg-[#0C0E18]/85 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 flex flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Inbox className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-white">
                  Inbound Streams & Leads
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-400 mt-1">
                Latest client messages, hire inquiries, and service requests
              </CardDescription>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-primary hover:text-white hover:bg-primary/10 h-8 px-3"
            >
              <Link href="/cms/contacts">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {isLoading ? (
              <ListSkeleton />
            ) : (data?.inbox.length ?? 0) === 0 ? (
              <EmptyState message="No incoming messages yet — new inquiries will appear here automatically." />
            ) : (
              <div className="space-y-3">
                {data!.inbox.map((entry) => (
                  <InboxRow key={`${entry.kind}-${entry.id}`} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Draft Pipeline */}
        <Card className="border border-white/[0.08] bg-[#0C0E18]/85 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 flex flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <PenLine className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-white">
                  Draft Content Pipeline
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-400 mt-1">
                Unpublished articles and engineering case studies
              </CardDescription>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-purple-400 hover:text-white hover:bg-purple-500/10 h-8 px-3"
            >
              <Link href="/cms/blogs">View Content</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {isLoading ? (
              <ListSkeleton />
            ) : (data?.drafts.length ?? 0) === 0 ? (
              <EmptyState message="All drafts are published! Every article and project is live." />
            ) : (
              <div className="space-y-3">
                {data!.drafts.map((draft) => (
                  <DraftRow key={`${draft.kind}-${draft.id}`} draft={draft} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content Matrix */}
      <Card className="border border-white/[0.08] bg-[#0C0E18]/85 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-white">
                Top Performing Content
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-400 mt-1">
              Most visited case studies and technical articles ranked by reader engagement
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <span className="inline-flex items-center gap-1">
              <Eye size={13} className="text-primary" /> Impressions
            </span>
            <span className="text-gray-600">•</span>
            <span className="inline-flex items-center gap-1">
              <Heart size={13} className="text-rose-400" /> Reactions
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          {isLoading ? (
            <ListSkeleton />
          ) : (data?.topContent.length ?? 0) === 0 ? (
            <EmptyState message="No published content data available yet." />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {data!.topContent.map((item, index) => (
                <TopContentRow key={`${item.kind}-${item.id}`} item={item} rank={index + 1} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Stats Card Primitive
interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  linkTo: string;
  loading?: boolean;
  highlight?: boolean;
  accentColor?: "indigo" | "purple" | "sky" | "emerald" | "rose";
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  linkTo,
  loading = false,
  highlight = false,
}: StatsCardProps) {
  return (
    <Link href={linkTo} className="group block">
      <Card
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40",
          highlight && "border-primary/30 bg-primary/[0.03]"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
            {title}
          </span>
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:scale-110 group-hover:border-primary/30 transition-all">
            {icon}
          </div>
        </div>

        {loading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-16 bg-white/[0.06]" />
            <Skeleton className="h-3 w-24 bg-white/[0.04]" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white group-hover:text-primary transition-colors font-mono">
              {value.toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 font-medium">{subtitle}</p>
          </div>
        )}

        {/* Glow underline on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Card>
    </Link>
  );
}

function AlertRow({ alert }: { alert: DashboardAlert }) {
  const isWarning = alert.severity === "warning";
  return (
    <Link href={alert.href} className="block group">
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-200",
          isWarning
            ? "border-amber-500/30 bg-amber-500/[0.05] hover:bg-amber-500/[0.08] text-amber-200"
            : "border-primary/30 bg-primary/[0.05] hover:bg-primary/[0.08] text-gray-200"
        )}
      >
        {isWarning ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        ) : (
          <Info className="h-4 w-4 shrink-0 text-primary" />
        )}
        <span className="text-xs sm:text-sm font-medium flex-1">{alert.message}</span>
        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors shrink-0" />
      </div>
    </Link>
  );
}

function InboxRow({ entry }: { entry: InboxEntry }) {
  const isContact = entry.kind === "contact";
  const isHire = entry.kind === "hire-request";
  const href = isContact ? "/cms/contacts" : isHire ? "/cms/hire-requests" : "/cms/services";

  const icon = isContact ? (
    <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
  ) : isHire ? (
    <Building2 className="h-3.5 w-3.5 text-emerald-400" />
  ) : (
    <Briefcase className="h-3.5 w-3.5 text-purple-400" />
  );

  const containerBg = isContact
    ? "bg-sky-500/10 border-sky-500/20"
    : isHire
      ? "bg-emerald-500/10 border-emerald-500/20"
      : "bg-purple-500/10 border-purple-500/20";

  return (
    <Link href={href} className="block group">
      <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all">
        <div className={cn("p-2 rounded-xl border shrink-0", containerBg)}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-xs sm:text-sm text-white group-hover:text-primary transition-colors truncate">
            {entry.name}
          </p>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">{entry.subject}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize",
              entry.status === "new" || entry.status === "pending"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-white/[0.04] text-gray-400 border-white/[0.08]"
            )}
          >
            {entry.status}
          </Badge>
          <span className="text-[10px] font-mono text-gray-400">{timeAgo(entry.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function DraftRow({ draft }: { draft: DraftEntry }) {
  const editHref =
    draft.kind === "blog" ? `/cms/blogs/form/${draft.id}` : `/cms/projects/form/${draft.id}`;
  return (
    <Link href={editHref} className="block group">
      <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 shrink-0 text-purple-400">
          {draft.kind === "blog" ? (
            <BookOpen className="h-3.5 w-3.5" />
          ) : (
            <Layers className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-xs sm:text-sm text-white group-hover:text-purple-400 transition-colors truncate">
            {draft.title}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
            <span className="capitalize">{draft.kind === "blog" ? "Article" : "Case Study"}</span>
            <span className="text-gray-600">•</span>
            <span className="font-mono text-[10px]">Edited {timeAgo(draft.updatedAt)}</span>
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-purple-400 transition-colors shrink-0" />
      </div>
    </Link>
  );
}

function TopContentRow({ item, rank }: { item: TopContentEntry; rank: number }) {
  const publicHref = item.kind === "blog" ? `/blog/${item.slug}` : `/projects/${item.slug}`;
  return (
    <Link href={publicHref} target="_blank" className="block group">
      <div className="flex items-center gap-3.5 py-3 hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
        <span
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black shrink-0 font-mono",
            rank === 1
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : rank === 2
                ? "bg-gray-400/15 text-gray-300 border border-gray-400/30"
                : rank === 3
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                  : "text-gray-400 bg-white/[0.03]"
          )}
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-xs sm:text-sm text-white group-hover:text-primary transition-colors truncate">
            {item.title}
          </p>
          <p className="text-[10px] text-gray-400 capitalize mt-0.5">
            {item.kind === "blog" ? "Technical Article" : "Case Study"}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-300 font-mono shrink-0">
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>{item.views.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            <span>{item.likes.toLocaleString()}</span>
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-2xl bg-white/[0.04]" />
      <Skeleton className="h-16 w-full rounded-2xl bg-white/[0.04]" />
      <Skeleton className="h-16 w-full rounded-2xl bg-white/[0.04]" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center space-y-2">
      <CheckCircle2 className="h-7 w-7 text-gray-400 mx-auto" />
      <p className="text-xs text-gray-400 max-w-xs mx-auto">{message}</p>
    </div>
  );
}

export default Dashboard;
