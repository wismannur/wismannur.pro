"use client";

import React, { useState, useRef } from "react";
import {
  Inbox,
  Sparkles,
  Copy,
  Check,
  Send,
  Loader2,
  Linkedin,
  Mail,
  MessageSquare,
  Zap,
  GripHorizontal,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jobTrackerService } from "@/services";
import type {
  InboundReachout,
  InboundReachoutReplyDraft,
  JobApplication,
} from "@/services/job-tracker/types";

interface TabInboundReachoutProps {
  application: JobApplication;
  onUpdate: (updated: Partial<JobApplication>) => Promise<void>;
}

export function TabInboundReachout({ application, onUpdate }: TabInboundReachoutProps) {
  const reachout: InboundReachout = application.inboundReachout || {};

  const [messageRaw, setMessageRaw] = useState(reachout.messageRaw || "");
  const [recruiterName, setRecruiterName] = useState(
    reachout.recruiterName || application.contactName || ""
  );
  const [recruiterRole, setRecruiterRole] = useState(reachout.recruiterRole || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);

  // Resizable state & handlers for Recruiter's Original Message
  const [messageHeight, setMessageHeight] = useState<number>(140);
  const isDraggingMessageRef = useRef(false);
  const dragMessageStartYRef = useRef(0);
  const startMessageHeightRef = useRef(140);

  const handleMouseDownMessageResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingMessageRef.current = true;
    dragMessageStartYRef.current = e.clientY;
    startMessageHeightRef.current = messageHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingMessageRef.current) return;
      const deltaY = moveEvent.clientY - dragMessageStartYRef.current;
      const maxHeight = Math.min(800, Math.floor(window.innerHeight * 0.85));
      const newHeight = Math.min(Math.max(startMessageHeightRef.current + deltaY, 90), maxHeight);
      setMessageHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingMessageRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartMessageResize = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingMessageRef.current = true;
    dragMessageStartYRef.current = e.touches[0].clientY;
    startMessageHeightRef.current = messageHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingMessageRef.current || moveEvent.touches.length !== 1) return;
      const deltaY = moveEvent.touches[0].clientY - dragMessageStartYRef.current;
      const maxHeight = Math.min(800, Math.floor(window.innerHeight * 0.85));
      const newHeight = Math.min(Math.max(startMessageHeightRef.current + deltaY, 90), maxHeight);
      setMessageHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingMessageRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const drafts: InboundReachoutReplyDraft[] = reachout.replyDrafts || [];
  const keyInsights: string[] = reachout.keyInsights || [];

  const handleGenerateReply = async () => {
    if (!messageRaw.trim()) {
      toast.error("Please paste the recruiter's message first.");
      return;
    }

    setIsGenerating(true);
    try {
      toast.info("Analyzing recruiter message & drafting high-converting responses...");

      const result = await jobTrackerService.aiGenerateInboundReply({
        recruiterMessage: messageRaw,
        recruiterName: recruiterName || undefined,
        recruiterRole: recruiterRole || undefined,
        companyName: application.companyName,
        jobTitle: application.jobTitle,
      });

      const updatedReachout: InboundReachout = {
        ...reachout,
        messageRaw,
        recruiterName,
        recruiterRole,
        keyInsights: result.keyInsights,
        replyDrafts: result.replyDrafts,
        receivedAt: reachout.receivedAt || new Date().toISOString(),
      };

      await onUpdate({
        inboundReachout: updatedReachout,
        contactName: recruiterName || application.contactName,
      });

      toast.success("Generated 3 tailored reply drafts!");
    } catch (err) {
      console.error("Error generating reply:", err);
      toast.error("Failed to generate replies. Please verify your Gemini API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyDraft = (draft: InboundReachoutReplyDraft) => {
    navigator.clipboard.writeText(draft.content);
    setCopiedDraftId(draft.id);
    toast.success(`Copied ${draft.title} to clipboard!`);
    setTimeout(() => setCopiedDraftId(null), 2500);
  };

  const handleMarkAsSent = async (draftContent: string) => {
    try {
      const updatedReachout: InboundReachout = {
        ...reachout,
        sentReplyContent: draftContent,
        sentAt: new Date().toISOString(),
      };

      await onUpdate({
        inboundReachout: updatedReachout,
      });

      toast.success("Marked reply as sent! Saved to activity history.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as sent.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Input / Message Inspector Card */}
      <Card className="border border-white/[0.08] bg-[#0C0E18]/85 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  Inbound Recruiter Reachout & InMail Drafter
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-[10px]">
                    LinkedIn InMail
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Analyze recruiter intent and craft high-converting replies highlighting your relevant experience
                </CardDescription>
              </div>
            </div>

            {reachout.sentAt && (
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-1">
                <Check className="w-3 h-3 mr-1 inline" /> Replied on{" "}
                {new Date(reachout.sentAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Recruiter / Sender Name</Label>
              <Input
                placeholder="e.g. Lennard Bakhuys"
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
                className="bg-black/30 border-slate-700 h-8 text-xs text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Recruiter Role / Title</Label>
              <Input
                placeholder="e.g. Projectmanager E-commerce"
                value={recruiterRole}
                onChange={(e) => setRecruiterRole(e.target.value)}
                className="bg-black/30 border-slate-700 h-8 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="recruiterOriginalMessage" className="text-xs text-slate-300">
                Recruiter&apos;s Original Message
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1 font-mono">
                  <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessageHeight((prev) => (prev > 200 ? 140 : 320))}
                  className="h-6 px-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] text-[11px]"
                  title={messageHeight > 200 ? "Perkecil input" : "Perbesar input"}
                >
                  {messageHeight > 200 ? (
                    <Minimize2 className="h-3 w-3" />
                  ) : (
                    <Maximize2 className="h-3 w-3" />
                  )}
                </Button>
                <span className="text-[11px] text-slate-500">Paste raw text or OCR capture</span>
              </div>
            </div>

            <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-inner">
              <Textarea
                id="recruiterOriginalMessage"
                placeholder="Paste the recruiter's reachout message here..."
                value={messageRaw}
                onChange={(e) => setMessageRaw(e.target.value)}
                style={{ height: `${messageHeight}px` }}
                className="w-full text-xs font-mono resize-none rounded-none border-0 bg-transparent text-slate-200 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto scrollbar-thin"
              />
              {/* Bottom Drag Handle Bar to Resize */}
              <div
                onMouseDown={handleMouseDownMessageResize}
                onTouchStart={handleTouchStartMessageResize}
                className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
                title="Drag handle to resize recruiter message"
              >
                <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-16 transition-all duration-200" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              onClick={handleGenerateReply}
              disabled={isGenerating || !messageRaw.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9 px-4 shadow-lg shadow-indigo-500/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Analyzing & Generating Replies...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-indigo-300" />
                  Generate AI Reply Options
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Strategic Insights */}
      {keyInsights.length > 0 && (
        <Card className="border border-indigo-500/20 bg-indigo-950/20 backdrop-blur-xl">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" /> Strategic Analysis of Recruiter Intent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {keyInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reply Drafts Section */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Tailored Reply Variations ({drafts.length})
            </h3>
            <span className="text-xs text-slate-400">Choose the best fit for the communication channel</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {drafts.map((draft) => {
              const isCopied = copiedDraftId === draft.id;
              const isSent = reachout.sentReplyContent === draft.content;

              return (
                <Card
                  key={draft.id}
                  className={`border transition-all duration-200 bg-[#0C0E18]/90 ${
                    isSent
                      ? "border-emerald-500/40 bg-emerald-950/10 shadow-emerald-500/10"
                      : "border-white/[0.08] hover:border-indigo-500/30"
                  }`}
                >
                  <CardHeader className="pb-2 pt-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          draft.style === "crisp_linkedin"
                            ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                            : draft.style === "formal_email"
                            ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {draft.style === "crisp_linkedin" && <Linkedin className="w-3 h-3 mr-1 inline" />}
                        {draft.style === "formal_email" && <Mail className="w-3 h-3 mr-1 inline" />}
                        {draft.title}
                      </Badge>
                      {isSent && (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                          Currently Marked as Sent
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyDraft(draft)}
                        className="h-8 text-xs border-white/[0.08] hover:bg-white/[0.06] text-slate-300"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy Draft
                          </>
                        )}
                      </Button>

                      {!isSent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsSent(draft.content)}
                          className="h-8 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Mark Sent
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2 pb-4">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-slate-200 whitespace-pre-line leading-relaxed selection:bg-indigo-500 selection:text-white">
                      {draft.content}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
