"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Briefcase,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Linkedin,
  Link2,
  Loader2,
  Mail,
  Minimize2,
  Maximize2,
  Paperclip,
  Pencil,
  Sparkles,
  StickyNote,
  Unlink,
  User,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toCustomAttachmentUrl } from "@/lib/attachment-url";
import { useTextareaResize } from "@/hooks/use-textarea-resize";
import type { JobApplication, JobOutreach } from "@/services";

interface OutreachDetailSidebarProps {
  outreach: JobOutreach;
  jobApplications: JobApplication[];
  selectedExistingAppId: string;
  setSelectedExistingAppId: (v: string) => void;
  isLinkingApp: boolean;
  onLinkExistingApp: () => void;
  isUnlinkingApp: boolean;
  onUnlinkApp: () => void;
  isConverting: boolean;
  onConvertToJobTracker: () => void;
  onSaveNotes: (notes: string) => Promise<void>;
}

export function OutreachDetailSidebar({
  outreach,
  jobApplications,
  selectedExistingAppId,
  setSelectedExistingAppId,
  isLinkingApp,
  onLinkExistingApp,
  isUnlinkingApp,
  onUnlinkApp,
  isConverting,
  onConvertToJobTracker,
  onSaveNotes,
}: OutreachDetailSidebarProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(outreach.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const {
    height: detailNotesHeight,
    setHeight: setDetailNotesHeight,
    handleMouseDownResize,
    handleTouchStartResize,
  } = useTextareaResize({ initialHeight: 96, minHeight: 60 });

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setIsCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveNotesClick = async () => {
    setIsSavingNotes(true);
    try {
      await onSaveNotes(editedNotes);
      setIsEditingNotes(false);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelEditNotes = () => {
    setEditedNotes(outreach.notes || "");
    setIsEditingNotes(false);
  };

  return (
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

      {/* Private Internal Notes Card (Editable) */}
      <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
        <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-amber-400" />
              Private Internal Notes
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-amber-300 font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                CMS Only
              </span>
              {isEditingNotes ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDetailNotesHeight(detailNotesHeight > 110 ? 96 : 220);
                  }}
                  className="h-6 w-6 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  title={detailNotesHeight > 110 ? "Perkecil area catatan" : "Perbesar area catatan"}
                >
                  {detailNotesHeight > 110 ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditedNotes(outreach.notes || "");
                    setIsEditingNotes(true);
                  }}
                  className="h-6 px-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1 rounded-lg"
                >
                  <Pencil className="h-3 w-3" />
                  <span>{outreach.notes ? "Edit" : "Tambah"}</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3 text-xs">
          {isEditingNotes ? (
            <div className="space-y-2.5">
              <div className="relative flex flex-col">
                <Textarea
                  style={{ height: `${detailNotesHeight}px` }}
                  placeholder="Tulis catatan internal di sini (mis: info referal kenalan, poin negosiasi, catatan interview)..."
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="font-sans text-xs leading-relaxed bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-500 resize-none focus-visible:ring-indigo-500/30"
                  disabled={isSavingNotes}
                />
                <div
                  onMouseDown={handleMouseDownResize}
                  onTouchStart={handleTouchStartResize}
                  className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none mt-1 z-10"
                  title="Drag down to resize internal notes"
                >
                  <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-amber-400 group-hover:w-16 transition-all duration-200" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEditNotes}
                  disabled={isSavingNotes}
                  className="h-7 text-xs px-2.5 rounded-lg border-white/[0.08] bg-[#131726] hover:bg-[#1C2237] text-slate-300"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveNotesClick}
                  disabled={isSavingNotes}
                  className="h-7 text-xs px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium gap-1.5 shadow-sm"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3" /> Simpan
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : outreach.notes ? (
            <div className="p-3 rounded-xl bg-[#131726] border border-white/[0.06] text-slate-200 whitespace-pre-wrap leading-relaxed text-xs">
              {outreach.notes}
            </div>
          ) : (
            <div
              onClick={() => {
                setEditedNotes("");
                setIsEditingNotes(true);
              }}
              className="p-3.5 rounded-xl border border-dashed border-white/[0.1] bg-[#131726]/40 hover:bg-[#131726] text-center cursor-pointer transition-colors group"
            >
              <p className="text-slate-400 group-hover:text-slate-300">
                Belum ada catatan internal.
              </p>
              <span className="text-[11px] text-indigo-400 font-medium inline-block mt-1">
                + Klik untuk menambahkan catatan
              </span>
            </div>
          )}
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

              <div className="flex items-center gap-2 mt-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8 gap-1.5 rounded-lg border-white/[0.08] bg-[#0C0E18] hover:bg-[#1C2237] text-slate-200"
                >
                  <Link href={`/cms/job-tracker/${outreach.jobApplication.id}`}>
                    <Briefcase className="h-3.5 w-3.5 text-indigo-400" /> Open Tracker
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onUnlinkApp}
                  disabled={isUnlinkingApp}
                  title="Unlink from this application"
                  className="h-8 px-2 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg"
                >
                  {isUnlinkingApp ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Unlink className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 text-xs">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Link2 className="h-3 w-3 text-indigo-400" />
                  Link to Existing Application:
                </label>
                <Select
                  value={selectedExistingAppId}
                  onValueChange={setSelectedExistingAppId}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#131726] border-white/[0.08] text-slate-200">
                    <SelectValue placeholder="Select from Job Tracker..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200 max-h-56">
                    {jobApplications.map((app) => (
                      <SelectItem key={app.id} value={app.id} className="text-xs">
                        {app.companyName} — {app.jobTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  onClick={onLinkExistingApp}
                  disabled={isLinkingApp || !selectedExistingAppId}
                  className="w-full text-xs h-7.5 gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  {isLinkingApp ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Linking...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-3 w-3" /> Connect to Selected Application
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                <div className="h-px bg-white/[0.06] flex-1" />
                <span>OR</span>
                <div className="h-px bg-white/[0.06] flex-1" />
              </div>

              <div className="space-y-2">
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Create a fresh application entry in your Job Tracker pipeline initialized with this role.
                </p>
                <Button
                  onClick={onConvertToJobTracker}
                  disabled={isConverting}
                  className="w-full text-xs h-8 gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-md border border-indigo-400/30"
                >
                  {isConverting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Create as New in Job Tracker
                </Button>
              </div>
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
            {outreach.attachments.map((att, idx) => {
              const brandedUrl = toCustomAttachmentUrl(att.url);
              return (
                <a
                  key={idx}
                  href={brandedUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={brandedUrl}
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
              );
            })}
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
  );
}
