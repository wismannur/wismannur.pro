"use client";

import React from "react";
import { format } from "date-fns";
import {
  Mail,
  Send,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { LinkifiedText } from "@/components/cms/linkified-text";
import type { JobOutreach } from "@/services";

interface OutreachThreadCardProps {
  outreach: JobOutreach;
  followUpMessage: string;
  setFollowUpMessage: (v: string) => void;
  isSendingFollowUp: boolean;
  isGeneratingAiFollowUp: boolean;
  isSendingDraft: boolean;
  onSendDraft: () => void;
  onGenerateAiFollowUp: () => void;
  onSendFollowUp: () => void;
}

export function OutreachThreadCard({
  outreach,
  followUpMessage,
  setFollowUpMessage,
  isSendingFollowUp,
  isGeneratingAiFollowUp,
  isSendingDraft,
  onSendDraft,
  onGenerateAiFollowUp,
  onSendFollowUp,
}: OutreachThreadCardProps) {
  return (
    <div className="space-y-6">
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
            onClick={onSendDraft}
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
                <Mail className="h-5 w-5 text-indigo-400 shrink-0" />
                Email Thread: &ldquo;{outreach.subject}&rdquo;
              </CardTitle>

              <CardDescription className="text-xs text-slate-400">
                Ref ID:{" "}
                <span className="font-mono text-slate-200 font-semibold">#{outreach.id}</span> ·
                Sent from{" "}
                <span className="text-indigo-300 font-mono">{PUBLIC_SUPPORT_EMAIL}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Message Timeline */}
          {!outreach.messages || outreach.messages.length === 0 ? (
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

                    <div className="text-sm leading-relaxed pl-8 text-slate-200 font-sans">
                      <LinkifiedText text={msg.message} />
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
                onClick={onGenerateAiFollowUp}
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

            {/* Follow-up Playbook Presets */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[#131726]/60 border border-white/[0.06] text-xs">
              <span className="font-semibold text-slate-400 text-[11px] flex items-center gap-1 px-1">
                ⚡ Playbook:
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFollowUpMessage(
                    `Hi ${outreach.contactName},\n\nI hope you're having a productive week! Just following up on my previous note regarding the ${outreach.jobTitle} opportunity at ${outreach.companyName}.\n\nI understand your schedule is packed, so just wanted to check if there is an update on the hiring timeline or if any extra details are needed from my side.\n\nBest regards,\nWisman Nur\nhttps://wismannur.pro`
                  );
                  toast.info("Playbook 1: Gentle Nudge loaded");
                }}
                className="h-6 text-[11px] px-2 rounded-md bg-white/[0.04] border-white/[0.08] hover:bg-indigo-500/20 text-slate-300 hover:text-white"
              >
                1️⃣ Gentle Nudge (3-5d)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFollowUpMessage(
                    `Hi ${outreach.contactName},\n\nFollowing up on my previous email regarding the ${outreach.jobTitle} position at ${outreach.companyName}.\n\nI recently published some deep-dive architectural work on resilient Next.js / TypeScript frontend systems (accessible at https://wismannur.pro), which directly maps to the challenges your team solves. I would love 15 minutes to share how I can hit the ground running.\n\nBest regards,\nWisman Nur`
                  );
                  toast.info("Playbook 2: Value-Add & Portfolio loaded");
                }}
                className="h-6 text-[11px] px-2 rounded-md bg-white/[0.04] border-white/[0.08] hover:bg-purple-500/20 text-slate-300 hover:text-white"
              >
                2️⃣ Value-Add & Work (7-10d)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFollowUpMessage(
                    `Hi ${outreach.contactName},\n\nSince I haven't heard back, I assume priorities have shifted or the ${outreach.jobTitle} role has been filled. No worries at all!\n\nI will continue following ${outreach.companyName}'s engineering milestones from afar. If our paths cross in the future, please feel free to reconnect anytime on LinkedIn or via email.\n\nWishing you and the team continued success,\nWisman Nur\nhttps://wismannur.pro`
                  );
                  toast.info("Playbook 3: Graceful Breakup loaded");
                }}
                className="h-6 text-[11px] px-2 rounded-md bg-white/[0.04] border-white/[0.08] hover:bg-rose-500/20 text-slate-300 hover:text-white"
              >
                3️⃣ Graceful Breakup (14d+)
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
                onClick={onSendFollowUp}
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
  );
}
