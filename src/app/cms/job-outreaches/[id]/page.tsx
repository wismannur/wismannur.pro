"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Linkedin,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { jobOutreachService, type OutreachStatus } from "@/services";

const STATUS_CONFIG: Record<OutreachStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-500/10 text-slate-300 border-slate-700/50",
  },
  sent: {
    label: "Awaiting Reply",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  follow_up_due: {
    label: "Follow-up Due ⚠️",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold animate-pulse",
  },
  replied: {
    label: "Replied 🎉",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold",
  },
  converted: {
    label: "Converted to Job Interview 🚀",
    className: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-bold",
  },
  closed: {
    label: "Closed / No Fit",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-700/40",
  },
};

export default function JobOutreachDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const outreachId = params.id;

  const [followUpMessage, setFollowUpMessage] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isGeneratingAiFollowUp, setIsGeneratingAiFollowUp] = useState(false);
  const [isSendingDraft, setIsSendingDraft] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const {
    data: outreach,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["jobOutreachDetail", outreachId],
    queryFn: async () => {
      const res = await jobOutreachService.getById(outreachId);
      if (!res) throw new Error("Outreach not found");
      return res;
    },
    enabled: Boolean(outreachId),
  });

  const handleSendDraft = async () => {
    if (!outreach) return;
    setIsSendingDraft(true);
    try {
      await jobOutreachService.sendEmail(outreach.id);
      toast.success(
        `Email successfully sent to ${outreach.contactEmail} via ${PUBLIC_SUPPORT_EMAIL}!`
      );
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
    } catch (err) {
      console.error("Send draft error:", err);
      toast.error("Failed to send draft email.");
    } finally {
      setIsSendingDraft(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setIsCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: OutreachStatus) => {
    if (!outreach) return;
    try {
      await jobOutreachService.update(outreach.id, { status: newStatus });
      toast.success(`Status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      queryClient.invalidateQueries({ queryKey: ["jobOutreachDetail", outreachId] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update status.");
    }
  };

  const handleGenerateAiFollowUp = async () => {
    if (!outreach) return;
    setIsGeneratingAiFollowUp(true);
    try {
      const res = await jobOutreachService.generateAiDraft({
        type: "follow_up",
        companyName: outreach.companyName,
        jobTitle: outreach.jobTitle,
        contactName: outreach.contactName,
        contactRole: outreach.contactRole,
        customInstructions: `This is a follow up email. Previous message: "${outreach.body.slice(0, 300)}..."`,
      });

      setFollowUpMessage(res.body);
      toast.success("AI follow-up draft generated successfully!");
    } catch (err) {
      console.error("AI Follow-up error:", err);
      toast.error("Failed to generate AI follow-up.");
    } finally {
      setIsGeneratingAiFollowUp(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!outreach || !followUpMessage.trim()) return;
    setIsSendingFollowUp(true);
    try {
      await jobOutreachService.sendFollowUp(outreach.id, followUpMessage.trim());
      toast.success(`Follow-up successfully sent to ${outreach.contactEmail}!`);
      setFollowUpMessage("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
    } catch (err) {
      console.error("Send follow-up error:", err);
      toast.error("Failed to send follow-up email.");
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const handleConvertToJobTracker = async () => {
    if (!outreach) return;
    setIsConverting(true);
    try {
      const result = await jobOutreachService.convertToJobApplication(outreach.id);
      toast.success("Successfully connected to Job Tracker!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobTrackerApplications"] });
      router.push(`/cms/job-tracker/${result.applicationId}`);
    } catch (err) {
      console.error("Convert to job tracker error:", err);
      toast.error("Failed to convert to Job Tracker.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!outreach) return;
    setIsDeleting(true);
    try {
      await jobOutreachService.delete(outreach.id);
      toast.success("Outreach successfully deleted.");
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
      router.push("/cms/job-outreaches");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete outreach.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!outreach) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Outreach Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/cms/job-outreaches">Back to Outreach List</Link>
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[outreach.status] || STATUS_CONFIG.sent;

  return (
    <div className="space-y-6 pb-14 text-slate-100 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-slate-400 hover:text-white hover:bg-[#131726] text-xs font-medium rounded-lg"
        >
          <Link href="/cms/job-outreaches">
            <ArrowLeft className="h-4 w-4" /> Back to Job Outreaches
          </Link>
        </Button>
      </div>

      {/* Top Action Bar / Workspace Header */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-[#0C0E18] border border-white/[0.08] shadow-xl">
        <div className="absolute -top-10 right-10 h-40 w-80 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Monogram Company Avatar */}
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-300 shrink-0 shadow-inner">
              {outreach.companyName ? outreach.companyName[0].toUpperCase() : "C"}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Building2 className="h-3.5 w-3.5" />
                <span>{outreach.companyName}</span>
                {outreach.companyWebsite && (
                  <a
                    href={outreach.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-indigo-300 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {outreach.jobTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Selector */}
            <Select
              value={outreach.status}
              onValueChange={(val) => handleStatusChange(val as OutreachStatus)}
            >
              <SelectTrigger
                className={cn(
                  "h-9 text-xs font-medium w-[190px] bg-[#131726] border-white/[0.08]",
                  statusInfo.className
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Awaiting Reply</SelectItem>
                <SelectItem value="follow_up_due">Follow-up Due</SelectItem>
                <SelectItem value="replied">Replied 🎉</SelectItem>
                <SelectItem value="converted">Converted to Interview 🚀</SelectItem>
                <SelectItem value="closed">Closed / No Fit</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-9 w-9 rounded-xl border-white/[0.08] bg-[#131726] hover:bg-[#1C2237] text-slate-300"
              title="Refresh Thread"
            >
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin text-indigo-400")} />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-9 w-9 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30"
              title="Delete Outreach"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Thread on Left (2 cols), Details on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Email Thread Messages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Draft Banner if status is draft */}
          {outreach.status === "draft" && (
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  <Send className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">This outreach is still a draft</div>
                  <p className="text-xs text-slate-300">
                    Email has not been sent to{" "}
                    <strong className="text-white">{outreach.contactName}</strong> (
                    {outreach.contactEmail}) yet. Click the button to send it directly via{" "}
                    <strong className="text-indigo-300 font-mono">{PUBLIC_SUPPORT_EMAIL}</strong>.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSendDraft}
                disabled={isSendingDraft}
                className="gap-2 shrink-0 font-semibold w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-md"
              >
                {isSendingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Email Now
                  </>
                )}
              </Button>
            </div>
          )}

          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 sm:p-5 border-b border-white/[0.06] bg-[#131726]/40">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                    <Mail className="h-4 w-4 text-indigo-400" />
                    Email Thread: &ldquo;{outreach.subject}&rdquo;
                  </CardTitle>

                  <CardDescription className="text-xs text-slate-400">
                    Ref ID:{" "}
                    <span className="font-mono text-slate-200 font-semibold">#{outreach.id}</span>{" "}
                    · Sent from{" "}
                    <span className="text-indigo-300 font-mono">{PUBLIC_SUPPORT_EMAIL}</span>
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-semibold rounded-md", statusInfo.className)}
                >
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Message Timeline */}
              {!outreach.messages || outreach.messages.length === 0 ? (
                /* Fallback if no messages array yet, show initial body */
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#131726] space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                          WN
                        </AvatarFallback>
                      </Avatar>
                      <span>Wisman Nur (You)</span>
                    </div>
                    <span>
                      {outreach.sentAt
                        ? format(new Date(outreach.sentAt), "dd MMM yyyy, HH:mm")
                        : "Draft"}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed text-slate-200 pl-8 font-sans">
                    {outreach.body}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {outreach.messages.map((msg, index) => {
                    const isAdmin = msg.senderType === "admin";
                    return (
                      <div
                        key={msg.id || index}
                        className={cn(
                          "p-4 rounded-xl border transition-all text-sm space-y-2.5",
                          isAdmin
                            ? "bg-[#131726] border-white/[0.08] ml-0 sm:ml-4 shadow-sm"
                            : "bg-emerald-950/20 border-emerald-500/30 mr-0 sm:mr-4 shadow-lg shadow-emerald-950/20"
                        )}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback
                                className={cn(
                                  "text-[10px] font-bold",
                                  isAdmin
                                    ? "bg-indigo-500/20 text-indigo-300"
                                    : "bg-emerald-600 text-white"
                                )}
                              >
                                {isAdmin ? "WN" : msg.senderName[0] || "R"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{msg.senderName}</span>
                              <span className="text-[11px] font-normal text-slate-400 font-mono">
                                &lt;{msg.senderEmail}&gt;
                              </span>
                              {!isAdmin && (
                                <Badge className="bg-emerald-600 text-white text-[10px] py-0 h-4 font-semibold">
                                  Recruiter Reply
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            {format(new Date(msg.createdAt), "dd MMM yyyy, HH:mm")}
                          </span>
                        </div>

                        <div className="text-sm whitespace-pre-wrap leading-relaxed pl-8 text-slate-200 font-sans">
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator className="bg-white/[0.06]" />

              {/* Follow-up / Reply Composer */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-sm font-bold flex items-center gap-2 text-white">
                    <Send className="h-4 w-4 text-indigo-400" />
                    Send Follow-up / Reply
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAiFollowUp}
                    disabled={isGeneratingAiFollowUp || isSendingFollowUp}
                    className="h-8 gap-1.5 text-xs rounded-lg border-indigo-500/30 text-indigo-300 bg-[#131726] hover:bg-indigo-500/20 hover:text-white"
                  >
                    {isGeneratingAiFollowUp ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> AI Follow-up Draft
                      </>
                    )}
                  </Button>
                </div>

                <Textarea
                  rows={5}
                  placeholder={`Write a reply or follow-up message for ${outreach.contactName}...`}
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                  className="text-sm leading-relaxed bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">
                    Sending from{" "}
                    <strong className="text-slate-200 font-mono">{PUBLIC_SUPPORT_EMAIL}</strong>
                  </span>
                  <Button
                    onClick={handleSendFollowUp}
                    disabled={isSendingFollowUp || !followUpMessage.trim()}
                    className="gap-2 font-semibold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 border border-indigo-400/30"
                  >
                    {isSendingFollowUp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send via Resend
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Contact & Job Tracker Info */}
        <div className="space-y-6">
          {/* Target Recruiter Card */}
          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-400" />
                Target Recruiter
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border border-indigo-500/30">
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-300 font-bold">
                    {outreach.contactName[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5 overflow-hidden">
                  <div className="font-bold text-white truncate">{outreach.contactName}</div>
                  {outreach.contactRole && (
                    <div className="text-xs text-slate-400 truncate">{outreach.contactRole}</div>
                  )}
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#131726] border border-white/[0.06]">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono text-slate-200">
                      {outreach.contactEmail}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    onClick={() => handleCopyEmail(outreach.contactEmail)}
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {outreach.contactLinkedin && (
                  <a
                    href={outreach.contactLinkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-[#131726] border border-white/[0.06] hover:bg-[#1C2237] transition-colors text-sky-400 font-medium"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Linkedin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">LinkedIn Profile</span>
                    </div>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linked Job Tracker Card */}
          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-400" />
                Job Tracker Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-sm">
              {outreach.jobApplication ? (
                <div className="p-3 bg-[#131726] border border-indigo-500/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300">
                      Linked Application
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    >
                      {outreach.jobApplication.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="font-bold text-sm text-white">
                    {outreach.jobApplication.companyName}
                  </div>
                  <div className="text-xs text-slate-400">{outreach.jobApplication.jobTitle}</div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5 mt-2 rounded-lg border-white/[0.08] bg-[#0C0E18] hover:bg-[#1C2237] text-slate-200"
                  >
                    <Link href={`/cms/job-tracker/${outreach.jobApplication.id}`}>
                      <Briefcase className="h-3.5 w-3.5 text-indigo-400" /> Open in Job Tracker
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-slate-400">
                  <p>
                    This outreach is not linked to Job Tracker yet. If the recruiter responds
                    positively, you can convert it directly to an active job application or
                    interview.
                  </p>
                  <Button
                    onClick={handleConvertToJobTracker}
                    disabled={isConverting}
                    className="w-full text-xs h-9 gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-md border border-indigo-400/30"
                  >
                    {isConverting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Convert / Create in Job Tracker
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attached Documents Card */}
          {outreach.attachments && outreach.attachments.length > 0 && (
            <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
              <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-indigo-400" />
                  Attachments ({outreach.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {outreach.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.08] bg-[#131726] hover:bg-[#1C2237] transition-colors text-slate-200 group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span className="font-medium truncate group-hover:text-indigo-300">
                        {att.name}
                      </span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-300" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Delivery & Follow-up Metadata */}
          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                Timeline & Cadence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs text-slate-400">
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span>Created Date:</span>
                <span className="font-medium text-slate-200">
                  {format(new Date(outreach.createdAt), "dd MMM yyyy")}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span>Initial Email Sent:</span>
                <span className="font-medium text-slate-200">
                  {outreach.sentAt ? format(new Date(outreach.sentAt), "dd MMM yyyy, HH:mm") : "-"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span>Follow-up Due:</span>
                <span
                  className={cn(
                    "font-medium",
                    outreach.followUpDueDate &&
                      new Date(outreach.followUpDueDate) < new Date() &&
                      !outreach.lastRepliedAt
                      ? "text-amber-400 font-bold"
                      : "text-slate-200"
                  )}
                >
                  {outreach.followUpDueDate
                    ? format(new Date(outreach.followUpDueDate), "dd MMM yyyy")
                    : "-"}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span>Last Reply:</span>
                <span className="font-medium text-emerald-400">
                  {outreach.lastRepliedAt
                    ? format(new Date(outreach.lastRepliedAt), "dd MMM yyyy, HH:mm")
                    : "No replies yet"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete This Outreach?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              This action is permanent and will delete the entire email draft along with all
              associated replies.
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
