"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Linkedin,
  Mail,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  SendHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { jobOutreachService, type OutreachStatus, type OutreachType } from "@/services";

const STATUS_CONFIG: Record<
  OutreachStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-500/10 text-slate-300 border-slate-700/50",
    icon: Clock,
  },
  sent: {
    label: "Awaiting Reply",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Send,
  },
  follow_up_due: {
    label: "Follow-up Due",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse font-semibold",
    icon: AlertCircle,
  },
  replied: {
    label: "Replied 🎉",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold",
    icon: CheckCircle2,
  },
  converted: {
    label: "Converted (Interview) 🚀",
    className: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-bold",
    icon: Sparkles,
  },
  closed: {
    label: "Closed / No Fit",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-700/40",
    icon: Clock,
  },
};

const TYPE_CONFIG: Record<OutreachType, { label: string; color: string }> = {
  cold_pitch: {
    label: "Cold Pitch / Proactive",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  direct_apply: {
    label: "Direct Apply via Email",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  follow_up: {
    label: "Follow-up Cadence",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
};

export default function JobOutreachesPage() {
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Outreaches
  const {
    data: outreaches = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["jobOutreaches", statusTab, typeFilter, searchQuery],
    queryFn: () =>
      jobOutreachService.getAll({
        status: statusTab as OutreachStatus | "all",
        type: typeFilter as OutreachType | "all",
        search: searchQuery || undefined,
      }),
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Fetch Analytics
  const { data: analytics } = useQuery({
    queryKey: ["jobOutreachesAnalytics"],
    queryFn: () => jobOutreachService.getAnalytics(),
    refetchOnMount: "always",
    staleTime: 0,
  });

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await jobOutreachService.delete(deleteTargetId);
      toast.success("Outreach successfully deleted.");
      setDeleteTargetId(null);
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
    } catch (err) {
      console.error("Delete outreach error:", err);
      toast.error("Failed to delete outreach.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendDraft = async (id: string, contactEmail: string) => {
    try {
      await jobOutreachService.sendEmail(id);
      toast.success(`Email successfully sent to ${contactEmail}!`);
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
    } catch (err) {
      console.error("Send email error:", err);
      toast.error("Failed to send email.");
    }
  };

  return (
    <div className="space-y-6 pb-14 text-slate-100">
      {/* Glow Backdrop */}
      <div className="relative">
        <div className="absolute -top-10 left-1/4 h-56 w-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -top-10 right-1/4 h-56 w-96 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

        {/* Hero Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0C0E18]/90 border border-white/[0.08] backdrop-blur-md shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                <SendHorizontal className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Job Outreaches & Cold Pitching
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                    Resend Sync
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Manage proactive cold emails, direct recruiter applications, and two-way inbox
                  threads via{" "}
                  <strong className="text-slate-200 font-mono">{PUBLIC_SUPPORT_EMAIL}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="rounded-xl border-white/[0.08] bg-[#131726] hover:bg-[#1C2237] text-slate-300"
              title="Refresh data"
            >
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin text-indigo-400")} />
            </Button>
            <Button
              asChild
              className="gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
            >
              <Link href="/cms/job-outreaches/new">
                <Plus className="h-4 w-4" /> New Outreach
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Analytics Cards (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Outreaches */}
        <Card className="relative overflow-hidden bg-[#0C0E18] border-white/[0.08] shadow-md hover:border-white/[0.15] transition-all">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-slate-400/40 to-transparent" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Total</span>
              <Send className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white">
              {analytics?.totalOutreaches ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-slate-400" />
              <span>All campaigns</span>
            </div>
          </CardContent>
        </Card>

        {/* Awaiting Reply */}
        <Card className="relative overflow-hidden bg-[#0C0E18] border-white/[0.08] shadow-md hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-xs font-medium uppercase tracking-wider">Awaiting Reply</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold mt-2 text-blue-300">
              {analytics?.awaitingReply ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Pending response</div>
          </CardContent>
        </Card>

        {/* Follow-up Due */}
        <Card className="relative overflow-hidden bg-[#0C0E18] border-white/[0.08] shadow-md hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-medium uppercase tracking-wider">Follow-up Due</span>
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold mt-2 text-amber-300">
              {analytics?.followUpDue ?? 0}
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1">Requires attention</div>
          </CardContent>
        </Card>

        {/* Replied */}
        <Card className="relative overflow-hidden bg-[#0C0E18] border-white/[0.08] shadow-md hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-medium uppercase tracking-wider">Replied</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold mt-2 text-emerald-300">
              {analytics?.replied ?? 0}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">Active recruiter chats</div>
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card className="relative overflow-hidden bg-[#0C0E18] border-white/[0.08] shadow-md hover:border-purple-500/30 transition-all col-span-2 sm:col-span-1">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-xs font-medium uppercase tracking-wider">Response Rate</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold mt-2 text-purple-300">
              {analytics?.responseRate ?? 0}%
            </div>
            <div className="text-[11px] text-purple-400/80 mt-1">Conversion velocity</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters, Search & Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-[#0C0E18] border border-white/[0.08]">
        <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-[#131726] border border-white/[0.06] rounded-lg">
            <TabsTrigger
              value="all"
              className="text-xs py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300"
            >
              All ({outreaches.length})
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className="text-xs py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300"
            >
              Awaiting
            </TabsTrigger>
            <TabsTrigger
              value="follow_up_due"
              className="text-xs py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300"
            >
              Follow-up Due
            </TabsTrigger>
            <TabsTrigger
              value="replied"
              className="text-xs py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300"
            >
              Replied
            </TabsTrigger>
            <TabsTrigger
              value="converted"
              className="text-xs py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300"
            >
              Converted
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="text-xs py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300"
            >
              Drafts
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search company, role, contact..."
              className="pl-9 h-9 text-xs bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-[#131726] border-white/[0.08] text-slate-200">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cold_pitch">Cold Pitch</SelectItem>
              <SelectItem value="direct_apply">Direct Apply</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 space-y-3 bg-[#0C0E18] border-white/[0.08]">
              <Skeleton className="h-6 w-3/4 bg-white/[0.06]" />
              <Skeleton className="h-4 w-1/2 bg-white/[0.06]" />
              <Skeleton className="h-16 w-full bg-white/[0.06]" />
              <Skeleton className="h-8 w-full bg-white/[0.06]" />
            </Card>
          ))}
        </div>
      ) : outreaches.length === 0 ? (
        <Card className="border-dashed border-white/[0.12] p-12 text-center bg-[#0C0E18]/60">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
            <SendHorizontal className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Job Outreaches Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-5">
            Start initiating cold emails or send direct job applications to your target recruiters
            using the AI generator.
          </p>
          <Button
            asChild
            className="gap-2 font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:from-indigo-500 hover:to-purple-500"
          >
            <Link href="/cms/job-outreaches/new">
              <Plus className="h-4 w-4" /> Start First Outreach
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outreaches.map((item) => {
            const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.sent;
            const typeInfo = TYPE_CONFIG[item.outreachType] || TYPE_CONFIG.cold_pitch;
            const StatusIcon = statusInfo.icon;

            const isFollowUpDue =
              item.status === "sent" &&
              item.followUpDueDate &&
              new Date(item.followUpDueDate) < new Date() &&
              !item.lastRepliedAt;

            const initialLetter = item.companyName ? item.companyName[0].toUpperCase() : "C";

            return (
              <Card
                key={item.id}
                className={cn(
                  "group relative overflow-hidden bg-[#0C0E18] border-white/[0.08] hover:border-indigo-500/40 transition-all duration-200 shadow-md hover:shadow-indigo-500/10 hover:-translate-y-0.5 flex flex-col justify-between",
                  item.status === "replied" && "border-emerald-500/30 bg-[#0C0E18]",
                  isFollowUpDue && "border-amber-500/40 bg-[#0C0E18]"
                )}
              >
                {/* Status indicator top strip */}
                <div
                  className={cn(
                    "absolute top-0 inset-x-0 h-0.5 opacity-60 group-hover:opacity-100 transition-opacity",
                    item.status === "replied"
                      ? "bg-emerald-500"
                      : isFollowUpDue
                        ? "bg-amber-500"
                        : item.status === "converted"
                          ? "bg-purple-500"
                          : "bg-indigo-500"
                  )}
                />

                <CardHeader className="p-4 pb-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {/* Monogram Initial Avatar */}
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0 shadow-inner">
                        {initialLetter}
                      </div>

                      <div className="space-y-0.5 overflow-hidden">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{item.companyName}</span>
                          {item.companyWebsite && (
                            <a
                              href={item.companyWebsite}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-indigo-300 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-white leading-snug line-clamp-1 group-hover:text-indigo-300 transition-colors">
                          <Link href={`/cms/job-outreaches/${item.id}`}>{item.jobTitle}</Link>
                        </h3>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#131726] opacity-70 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#0C0E18] border-white/[0.1] text-slate-200"
                      >
                        <DropdownMenuItem asChild className="hover:bg-[#131726] cursor-pointer">
                          <Link href={`/cms/job-outreaches/${item.id}`}>
                            <Eye className="h-4 w-4 mr-2 text-indigo-400" /> Open Conversation
                            Thread
                          </Link>
                        </DropdownMenuItem>
                        {item.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => handleSendDraft(item.id, item.contactEmail)}
                            className="hover:bg-[#131726] text-indigo-300 cursor-pointer"
                          >
                            <Send className="h-4 w-4 mr-2" /> Send Now (Resend)
                          </DropdownMenuItem>
                        )}
                        {item.jobApplicationId && (
                          <DropdownMenuItem asChild className="hover:bg-[#131726] cursor-pointer">
                            <Link href={`/cms/job-tracker/${item.jobApplicationId}`}>
                              <Briefcase className="h-4 w-4 mr-2 text-purple-400" /> View in Job
                              Tracker
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-white/[0.08]" />
                        <DropdownMenuItem
                          onClick={() => setDeleteTargetId(item.id)}
                          className="text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Outreach
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] font-medium border gap-1 py-0.5 rounded-md",
                        statusInfo.className
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-normal border py-0.5 rounded-md",
                        typeInfo.color
                      )}
                    >
                      {typeInfo.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3">
                  {/* Contact Info Card */}
                  <div className="p-2.5 bg-[#131726] rounded-xl border border-white/[0.06] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold flex items-center gap-1.5 text-slate-200 truncate">
                        <User className="h-3 w-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{item.contactName}</span>
                      </div>
                      {item.contactLinkedin && (
                        <a
                          href={item.contactLinkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-sky-400 transition-colors"
                        >
                          <Linkedin className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 truncate">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate font-mono text-[11px]">{item.contactEmail}</span>
                    </div>
                    {item.contactRole && (
                      <div className="text-[11px] text-slate-400 truncate pl-4">
                        {item.contactRole}
                      </div>
                    )}
                  </div>

                  {/* Subject & Preview */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                      &ldquo;{item.subject}&rdquo;
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {item.sentAt ? (
                        <span>
                          Sent {formatDistanceToNow(new Date(item.sentAt), { addSuffix: true })}
                        </span>
                      ) : (
                        <span>Draft: {format(new Date(item.createdAt), "dd MMM yyyy")}</span>
                      )}
                    </div>

                    {item.jobApplication && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-[#131726] border border-white/[0.06] text-purple-300 py-0 h-5"
                      >
                        Job Tracker 🔗
                      </Badge>
                    )}
                  </div>

                  {/* Quick Action Button */}
                  <div className="pt-1">
                    <Button
                      asChild
                      variant={item.status === "replied" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "w-full text-xs h-8 gap-1.5 font-medium rounded-lg transition-all",
                        item.status === "replied"
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                          : "border-white/[0.08] bg-[#131726] hover:bg-[#1C2237] text-slate-200"
                      )}
                    >
                      <Link href={`/cms/job-outreaches/${item.id}`}>
                        {item.status === "replied" ? (
                          <>
                            <MessageSquare className="h-3.5 w-3.5" /> View Recruiter Reply
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" /> Details & Follow-up
                          </>
                        )}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete This Outreach?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              This action will permanently delete the outreach record along with all associated email
              thread conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-white/[0.08] bg-[#131726] text-slate-300 hover:bg-[#1C2237]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              {isDeleting ? "Deleting..." : "Delete Outreach"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
