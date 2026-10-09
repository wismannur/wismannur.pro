"use client";

import React, { useRef } from "react";
import {
  Briefcase,
  Building2,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  Paperclip,
  UploadCloud,
  User,
  X,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toCustomAttachmentUrl } from "@/lib/attachment-url";
import type { JobApplication, JobOutreachAttachment, OutreachType } from "@/services";

interface OutreachTargetSidebarProps {
  selectedJobAppId: string;
  onSelectJobApp: (id: string) => void;
  jobApplications: JobApplication[];
  companyName: string;
  setCompanyName: (v: string) => void;
  jobTitle: string;
  setJobTitle: (v: string) => void;
  companyWebsite: string;
  setCompanyWebsite: (v: string) => void;
  outreachType: OutreachType;
  setOutreachType: (v: OutreachType) => void;
  contactName: string;
  setContactName: (v: string) => void;
  contactRole: string;
  setContactRole: (v: string) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactLinkedin: string;
  setContactLinkedin: (v: string) => void;
  attachments: JobOutreachAttachment[];
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
}

export function OutreachTargetSidebar({
  selectedJobAppId,
  onSelectJobApp,
  jobApplications,
  companyName,
  setCompanyName,
  jobTitle,
  setJobTitle,
  companyWebsite,
  setCompanyWebsite,
  outreachType,
  setOutreachType,
  contactName,
  setContactName,
  contactRole,
  setContactRole,
  contactEmail,
  setContactEmail,
  contactLinkedin,
  setContactLinkedin,
  attachments,
  isUploading,
  onFileUpload,
  onRemoveAttachment,
}: OutreachTargetSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      {/* Link to Job Tracker Card */}
      <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
        <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
            <Briefcase className="h-4 w-4 text-indigo-400" />
            Link to Job Tracker
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Select an application tracked in Job Tracker to auto-fill information.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Select value={selectedJobAppId} onValueChange={onSelectJobApp}>
            <SelectTrigger className="w-full bg-[#131726] border-white/[0.08] text-slate-200 text-xs h-9">
              <SelectValue placeholder="Select application..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
              <SelectItem value="none">-- Standalone Outreach --</SelectItem>
              {jobApplications.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.companyName} - {app.jobTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Company & Role Details Card */}
      <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
        <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
            <Building2 className="h-4 w-4 text-indigo-400" />
            Target Company & Role
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-xs font-semibold text-slate-300">
              Company Name *
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="companyName"
                placeholder="e.g. Tokopedia / Google / Stripe"
                className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jobTitle" className="text-xs font-semibold text-slate-300">
              Job Title / Target Role *
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="jobTitle"
                placeholder="e.g. Senior Frontend Engineer"
                className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="companyWebsite" className="text-xs text-slate-400">
              Company Website (Optional)
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="companyWebsite"
                placeholder="https://company.com"
                className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300">Outreach Type</Label>
            <Select
              value={outreachType}
              onValueChange={(val) => setOutreachType(val as OutreachType)}
            >
              <SelectTrigger className="bg-[#131726] border-white/[0.08] text-slate-200 text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
                <SelectItem value="cold_pitch">
                  🚀 Cold Pitch to Hiring Manager / Lead
                </SelectItem>
                <SelectItem value="direct_apply">📄 Direct Application via Email</SelectItem>
                <SelectItem value="follow_up">🔄 Follow-up Cadence (Re-engagement)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recruiter Contact Card */}
      <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
        <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
            <User className="h-4 w-4 text-indigo-400" />
            Target Recruiter / Contact Person
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-xs font-semibold text-slate-300">
                Contact Name *
              </Label>
              <Input
                id="contactName"
                placeholder="e.g. Sarah Jenkins"
                className="text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactRole" className="text-xs text-slate-400">
                Role / Position (Optional)
              </Label>
              <Input
                id="contactRole"
                placeholder="e.g. Head of Engineering"
                className="text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactEmail" className="text-xs font-semibold text-slate-300">
              Recipient Email *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="contactEmail"
                type="email"
                placeholder="recruiter@company.com"
                className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactLinkedin" className="text-xs text-slate-400">
              LinkedIn Profile URL (Optional)
            </Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="contactLinkedin"
                placeholder="https://linkedin.com/in/..."
                className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                value={contactLinkedin}
                onChange={(e) => setContactLinkedin(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Attachments Card */}
      <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
        <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <Paperclip className="h-4 w-4 text-indigo-400" />
              Attachments (CV / Portfolio)
            </CardTitle>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#131726] border border-white/[0.08] text-indigo-300">
              {attachments.length} Attached
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Upload PDF CV, Portfolio, or supporting documents to automatically attach and send via Resend.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept=".pdf,.docx,.doc,.zip,.png,.jpg"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed border-white/[0.1] hover:border-indigo-500/50 rounded-xl p-4 text-center cursor-pointer transition-all bg-[#131726]/50 hover:bg-[#131726] flex flex-col items-center justify-center gap-2 group",
              isUploading && "pointer-events-none opacity-60"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                <span className="text-xs font-medium text-slate-300">
                  Uploading document...
                </span>
              </>
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-200">
                    Click to Upload File (PDF, DOCX, ZIP)
                  </div>
                  <div className="text-[11px] text-slate-400">Maximum 10MB per file</div>
                </div>
              </>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2 pt-1">
              {attachments.map((att, idx) => {
                const brandedUrl = toCustomAttachmentUrl(att.url);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.08] bg-[#131726] text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                      <a
                        href={brandedUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={brandedUrl}
                        className="font-medium text-slate-200 hover:text-indigo-300 hover:underline truncate"
                      >
                        {att.name}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
                      onClick={() => onRemoveAttachment(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
