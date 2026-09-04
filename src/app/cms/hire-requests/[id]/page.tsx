"use client";

import type React from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  hireRequestService,
  inquiryMessagesService,
  type HireRequestStatus,
  type InquiryMessage,
} from "@/services";

const EMPLOYMENT_CONFIG: Record<string, { label: string; className: string }> = {
  full_time: {
    label: "Full-time Employee",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  contract: {
    label: "Long-term Contract",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  advisory: {
    label: "Advisory / Fractional",
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  other: {
    label: "Other Opportunity",
    className: "bg-white/[0.04] text-slate-400 border-white/[0.08]",
  },
};

const WORKPLACE_CONFIG: Record<string, { label: string; className: string }> = {
  remote: {
    label: "Remote",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  hybrid: {
    label: "Hybrid",
    className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  onsite: {
    label: "On-site",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

export default function HireRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const requestId = params.id;

  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const {
    data: request,
    isLoading: isRequestLoading,
    refetch: refetchRequest,
  } = useQuery({
    queryKey: ["hireRequest", requestId],
    queryFn: async () => {
      const data = await hireRequestService.getById(requestId);
      if (!data) throw new Error("Hire inquiry not found");
      if (data.status === "new") {
        await hireRequestService.updateStatus(requestId, "reviewed");
      }
      return data;
    },
    enabled: Boolean(requestId),
  });

  const {
    data: threadMessages = [],
    isLoading: isThreadLoading,
    refetch: refetchThread,
  } = useQuery({
    queryKey: ["hireRequestThread", requestId],
    queryFn: () => inquiryMessagesService.getThreadMessages(requestId),
    enabled: Boolean(requestId),
  });

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setIsCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendReply = async () => {
    if (!request || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      await inquiryMessagesService.sendAdminReply({
        inquiryId: request.id,
        inquiryType: "hire_request",
        toEmail: request.email,
        toName: request.name,
        subject: `Response: ${request.roleTitle} @ ${request.company}`,
        message: replyMessage.trim(),
        originalMessageSnippet: request.message,
      });

      toast.success("Email reply successfully sent to recruiter!");
      setReplyMessage("");
      refetchThread();
      refetchRequest();
      queryClient.invalidateQueries({ queryKey: ["hireRequests"] });
    } catch (error) {
      console.error("Error sending reply:", error);
      const msg = error instanceof Error ? error.message : "Failed to send email reply";
      toast.error(msg);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: HireRequestStatus) => {
    if (!request) return;
    try {
      await hireRequestService.updateStatus(request.id, status);
      toast.success(`Status updated to ${status}`);
      refetchRequest();
      queryClient.invalidateQueries({ queryKey: ["hireRequests"] });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!request) return;
    setIsDeleting(true);
    try {
      await hireRequestService.delete(request.id);
      toast.success("Hire inquiry successfully deleted");
      queryClient.invalidateQueries({ queryKey: ["hireRequests"] });
      router.push("/cms/hire-requests");
    } catch (error) {
      console.error("Error deleting hire request:", error);
      toast.error("Failed to delete hire inquiry");
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "HR";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            New Inquiry
          </span>
        );
      case "reviewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap shadow-xs">
            <Clock className="w-3.5 h-3.5" />
            Reviewed
          </span>
        );
      case "interviewing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap shadow-xs">
            <Users className="w-3.5 h-3.5" />
            Interviewing
          </span>
        );
      case "offered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Offered
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap shadow-xs">
            <XCircle className="w-3.5 h-3.5" />
            Declined
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08] whitespace-nowrap">
            Archived
          </span>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  if (isRequestLoading) {
    return (
      <div className="space-y-6 max-w-6xl pb-12">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-36 rounded-xl bg-white/[0.05]" />
        </div>
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl bg-white/[0.05]" />
            <Skeleton className="h-4 w-48 rounded-lg bg-white/[0.05]" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl bg-white/[0.05]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-2xl bg-white/[0.05]" />
            <Skeleton className="h-96 rounded-2xl bg-white/[0.05]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-2xl bg-white/[0.05]" />
            <Skeleton className="h-48 rounded-2xl bg-white/[0.05]" />
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-[#0C0E18]/60 rounded-2xl border border-white/[0.08] p-8">
        <Inbox className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Inquiry Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
          The hire inquiry you are looking for does not exist or has been deleted.
        </p>
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-white/[0.08] bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/[0.08]"
        >
          <Link href="/cms/hire-requests">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hire Inquiries
          </Link>
        </Button>
      </div>
    );
  }

  const empConfig = EMPLOYMENT_CONFIG[request.employmentType] || EMPLOYMENT_CONFIG.full_time;
  const workConfig = WORKPLACE_CONFIG[request.workplaceType] || WORKPLACE_CONFIG.remote;

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl"
        >
          <Link href="/cms/hire-requests">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hire Inquiries
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchRequest();
              refetchThread();
            }}
            className="h-8 gap-1.5 rounded-xl border-white/[0.08] bg-[#0C0E18]/80 text-slate-300 hover:text-white hover:bg-white/[0.06]"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="h-8 text-xs rounded-xl border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Details & Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Inquiry Overview & Conversation Thread */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Title Card */}
          <Card className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-indigo-400" />
                      <span className="font-bold text-xs text-indigo-400 uppercase tracking-wider">
                        {request.company}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
                      <span>{request.id}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(request.id);
                          toast.success("Reference ID copied to clipboard!");
                        }}
                        className="hover:text-white transition-colors"
                        title="Copy Reference ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-black tracking-tight text-white">
                    {request.roleTitle}
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Received on {format(
                      new Date(request.createdAt),
                      "EEEE, dd MMMM yyyy · HH:mm"
                    )}{" "}
                    WIB
                  </p>
                </div>
                <div>{getStatusBadge(request.status)}</div>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2">
              {/* Scope Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#131726]/70 border border-white/[0.06]">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Employment</span>
                  <span className="font-semibold text-xs text-slate-200">{empConfig.label}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Workplace</span>
                  <span className="font-semibold text-xs text-slate-200">{workConfig.label}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">
                    Compensation
                  </span>
                  <span className="font-semibold text-xs text-emerald-400">
                    {request.salaryRange || "Negotiable"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Location</span>
                  <span className="font-semibold text-xs text-slate-200">
                    {request.location || "Remote / Worldwide"}
                  </span>
                </div>
              </div>

              {/* Opportunity Details & Message */}
              <div className="mt-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Opportunity Details & Message:
                </h3>
                <div className="p-4 rounded-xl bg-[#131726]/70 border border-white/[0.06] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
                  {request.message}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation Thread */}
          <Card className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Email Thread History
                </span>
                <Badge variant="outline" className="text-xs font-semibold bg-white/[0.04] text-slate-300 border-white/[0.08]">
                  {threadMessages.length} Messages
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {isThreadLoading ? (
                <div className="py-8 flex justify-center items-center text-slate-400 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  Loading thread messages...
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#131726]/40 border border-dashed border-white/[0.08] text-xs text-slate-400">
                  No email replies sent yet. Send the first reply below to start the conversation
                  with the recruiter.
                </div>
              ) : (
                <div className="space-y-4">
                  {threadMessages.map((msg: InquiryMessage) => {
                    const isAdmin = msg.senderType === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-4 rounded-2xl border transition-all text-xs space-y-2",
                          isAdmin
                            ? "bg-indigo-500/10 border-indigo-500/25 ml-4 md:ml-10 text-slate-200"
                            : "bg-[#131726]/80 border-white/[0.08] mr-4 md:mr-10 text-slate-200"
                        )}
                      >
                        <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/[0.06]">
                          <div className="flex items-center gap-2 font-medium">
                            <span
                              className={
                                isAdmin
                                  ? "text-indigo-400 font-bold"
                                  : "text-white font-bold"
                              }
                            >
                              {msg.senderName} {isAdmin && "(You)"}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400 text-[11px]">{msg.senderEmail}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{format(new Date(msg.createdAt), "dd MMM, HH:mm")} WIB</span>
                        </div>
                        <div className="text-slate-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Reply Form */}
              <div className="pt-4 border-t border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    Reply directly via email (to {request.email}):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Recruiter can reply directly via their inbox.
                  </span>
                </div>

                <Textarea
                  placeholder="Write your email response to the recruiter / company..."
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 resize-none text-xs sm:text-sm leading-relaxed focus-visible:ring-indigo-500/40"
                />

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyMessage.trim()}
                    className="rounded-xl px-5 h-9 text-xs font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Reply Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Contact & Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Recruiter Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-white/[0.08] bg-[#131726]">
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-300 font-bold text-sm">
                    {getInitials(request.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white truncate">{request.name}</p>
                  <p className="text-slate-400 truncate">{request.company}</p>
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1 font-medium">Work Email:</span>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#131726]/70 border border-white/[0.06]">
                    <span className="font-mono text-xs text-indigo-400 truncate mr-2">{request.email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-slate-400 hover:text-white hover:bg-white/[0.08]"
                      onClick={() => handleCopyEmail(request.email)}
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {request.location && (
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">
                      Location:
                    </span>
                    <span className="font-medium text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      {request.location}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">
                    Inquiry ID:
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">#{request.id}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]"
                  asChild
                >
                  <a
                    href={`mailto:${request.email}?subject=Re: ${encodeURIComponent(request.roleTitle)} - Wisman Nur`}
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    Open in Mail App
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Controller Card */}
          <Card className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Inquiry Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              <p className="text-xs text-slate-400 mb-3">
                Update status to track your recruitment progress:
              </p>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={request.status === "new" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-9 rounded-xl",
                    request.status === "new"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                  onClick={() => handleUpdateStatus("new")}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-blue-400" />
                  New Inquiry
                </Button>
                <Button
                  variant={request.status === "reviewed" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-9 rounded-xl",
                    request.status === "reviewed"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                  onClick={() => handleUpdateStatus("reviewed")}
                >
                  <Clock className="w-3.5 h-3.5 mr-2 text-amber-400" />
                  Reviewed
                </Button>
                <Button
                  variant={request.status === "interviewing" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-9 rounded-xl",
                    request.status === "interviewing"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                  onClick={() => handleUpdateStatus("interviewing")}
                >
                  <Users className="w-3.5 h-3.5 mr-2 text-purple-400" />
                  Interviewing
                </Button>
                <Button
                  variant={request.status === "offered" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-9 rounded-xl",
                    request.status === "offered"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                  onClick={() => handleUpdateStatus("offered")}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                  Offered
                </Button>
                <Button
                  variant={request.status === "rejected" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-9 rounded-xl",
                    request.status === "rejected"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                  onClick={() => handleUpdateStatus("rejected")}
                >
                  <XCircle className="w-3.5 h-3.5 mr-2 text-rose-400" />
                  Declined
                </Button>
                <Button
                  variant={request.status === "archived" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-9 rounded-xl",
                    request.status === "archived"
                      ? "bg-white/[0.08] text-white border-white/[0.16]"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                  )}
                  onClick={() => handleUpdateStatus("archived")}
                >
                  <Inbox className="w-3.5 h-3.5 mr-2" />
                  Archived
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg font-bold">Delete Hire Inquiry</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              Are you sure you want to delete this hire inquiry from <strong className="text-white">{request.name}</strong>{" "}
              ({request.company})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
