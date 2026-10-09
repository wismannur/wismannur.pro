"use client";

import React from "react";
import {
  Mail,
  Sparkles,
  FileText,
  Check,
  StickyNote,
  Minimize2,
  Maximize2,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { useTextareaResize } from "@/hooks/use-textarea-resize";
import type { JobApplication } from "@/services";

interface OutreachEmailComposerProps {
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  selectedApp?: JobApplication;
  isSubmitting: boolean;
  isGeneratingAi: boolean;
  onSubmit: (sendImmediately: boolean) => void;
}

export function OutreachEmailComposer({
  subject,
  setSubject,
  body,
  setBody,
  notes,
  setNotes,
  selectedApp,
  isSubmitting,
  isGeneratingAi,
  onSubmit,
}: OutreachEmailComposerProps) {
  const {
    height: bodyHeight,
    setHeight: setBodyHeight,
    handleMouseDownResize: handleMouseDownBodyResize,
    handleTouchStartResize: handleTouchStartBodyResize,
  } = useTextareaResize({ initialHeight: 320, minHeight: 160 });

  const {
    height: notesHeight,
    setHeight: setNotesHeight,
    handleMouseDownResize: handleMouseDownNotesResize,
    handleTouchStartResize: handleTouchStartNotesResize,
  } = useTextareaResize({ initialHeight: 84, minHeight: 60 });

  return (
    <div className="space-y-6">
      {/* Composer Card */}
      <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
        <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <Mail className="h-4 w-4 text-indigo-400" />
              Email Composer
            </CardTitle>
            <span className="text-[11px] text-slate-400 font-mono px-2.5 py-0.5 rounded-full bg-[#131726] border border-white/[0.06]">
              From:{" "}
              <span className="text-indigo-300 font-semibold">
                Wisman Nur &lt;{PUBLIC_SUPPORT_EMAIL}&gt;
              </span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs font-semibold text-slate-300">
              Subject Line *
            </Label>
            <Input
              id="subject"
              placeholder="e.g. Application: Senior Frontend Engineer - Wisman Nur"
              className="font-medium text-sm bg-[#131726] border-white/[0.08] text-white placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="body" className="text-xs font-semibold text-slate-300">
                Email Body *
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  {body.length} karakter
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setBodyHeight(bodyHeight > 350 ? 320 : 560);
                  }}
                  className="h-6 w-6 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  title={bodyHeight > 350 ? "Perkecil area email body" : "Perbesar area email body"}
                >
                  {bodyHeight > 350 ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {selectedApp && (selectedApp.coverLetter || selectedApp.tailoredSummary) && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                <span className="font-semibold text-indigo-300 flex items-center gap-1.5 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  From Job Tracker:
                </span>
                {selectedApp.coverLetter && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBody(selectedApp.coverLetter!);
                      toast.success("Cover letter loaded into email body!");
                    }}
                    className="h-7 text-xs gap-1.5 px-2.5 rounded-lg border-indigo-500/30 text-indigo-200 bg-[#131726] hover:bg-indigo-500/20 hover:text-white"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Load Tailored Cover Letter
                  </Button>
                )}
                {selectedApp.tailoredSummary && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const pitch = `Dear ${selectedApp.contactName || "Hiring Team"},\n\nI am writing to express my strong interest in the ${selectedApp.jobTitle} position at ${selectedApp.companyName}.\n\n${selectedApp.tailoredSummary}\n\nLooking forward to discussing how my experience can deliver immediate impact for ${selectedApp.companyName}.\n\nBest regards,\nWisman Nur\nhttps://wismannur.pro`;
                      setBody(pitch);
                      toast.success("Tailored pitch loaded into email body!");
                    }}
                    className="h-7 text-xs gap-1.5 px-2.5 rounded-lg border-purple-500/30 text-purple-200 bg-[#131726] hover:bg-purple-500/20 hover:text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Load Tailored Pitch
                  </Button>
                )}
              </div>
            )}

            <div className="relative flex flex-col">
              <Textarea
                id="body"
                style={{ height: `${bodyHeight}px` }}
                placeholder="Write your message here or click 'Auto-Draft with AI' above..."
                className="font-sans text-sm leading-relaxed bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-400 resize-none focus-visible:ring-indigo-500/30"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div
                onMouseDown={handleMouseDownBodyResize}
                onTouchStart={handleTouchStartBodyResize}
                className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none mt-1 z-10"
                title="Drag down to resize email body"
              >
                <div className="w-12 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-20 transition-all duration-200" />
              </div>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Replies from recruiter will automatically sync to this CMS timeline.</span>
          </div>
        </CardContent>
      </Card>

      {/* Dedicated Private Internal Notes Card */}
      <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
        <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <StickyNote className="h-4 w-4 text-amber-400" />
              Private Internal Notes
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-amber-300 font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                CMS Only
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setNotesHeight(notesHeight > 100 ? 84 : 200);
                }}
                className="h-6 w-6 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06]"
                title={notesHeight > 100 ? "Perkecil area catatan" : "Perbesar area catatan"}
              >
                {notesHeight > 100 ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs text-slate-400 pt-1">
            Catatan internal hanya terlihat di dashboard CMS Anda, tidak akan dikirimkan ke email recruiter. Dapat Anda edit kembali kapan saja setelah tersimpan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-2.5">
          <div className="relative flex flex-col">
            <Textarea
              id="notes"
              style={{ height: `${notesHeight}px` }}
              placeholder="e.g. Referred by John Doe / Rekomendasi salary $120k / Catatan strategi follow-up..."
              className="text-xs font-sans leading-relaxed bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-500 resize-none focus-visible:ring-indigo-500/30"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div
              onMouseDown={handleMouseDownNotesResize}
              onTouchStart={handleTouchStartNotesResize}
              className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none mt-1 z-10"
              title="Drag down to resize internal notes"
            >
              <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-amber-400 group-hover:w-16 transition-all duration-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Submission Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#0C0E18] border border-white/[0.08] shadow-md">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Draf atau email yang terkirim akan otomatis tercatat di CMS timeline.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSubmit(false)}
            disabled={isSubmitting || isGeneratingAi}
            className="w-full sm:w-auto rounded-xl border-white/[0.08] bg-[#131726] hover:bg-[#1C2237] text-slate-300"
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit(true)}
            disabled={isSubmitting || isGeneratingAi}
            className="w-full sm:w-auto gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-md shadow-indigo-500/20 border border-indigo-400/30"
          >
            {isSubmitting ? (
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
      </div>
    </div>
  );
}
