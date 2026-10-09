"use client";

import React from "react";
import {
  Building2,
  Globe,
  Link2,
  Briefcase,
  MapPin,
  Coins,
  User,
  Mail,
  Phone,
  FileText,
  GripHorizontal,
  Minimize2,
  Maximize2,
  Loader2,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JobDescriptionMarkdownEditor } from "../../components/job-description-markdown-editor";
import { useTextareaResize } from "@/hooks/use-textarea-resize";
import type {
  JobApplicationStatus,
  JobEmploymentType,
  JobPlatform,
  NewJobApplication,
  WorkplaceType,
} from "@/services/job-tracker/types";

interface TabManualEntryProps {
  formData: NewJobApplication;
  setFormData: React.Dispatch<React.SetStateAction<NewJobApplication>>;
  requirementsInput: string;
  setRequirementsInput: (val: string) => void;
  isSaving: boolean;
  onSave: (openTailorAfterSave?: boolean) => void;
  onCancel: () => void;
}

export function TabManualEntry({
  formData,
  setFormData,
  requirementsInput,
  setRequirementsInput,
  isSaving,
  onSave,
  onCancel,
}: TabManualEntryProps) {
  const {
    height: requirementsHeight,
    setHeight: setRequirementsHeight,
    handleMouseDownResize: handleMouseDownReqsResize,
    handleTouchStartResize: handleTouchStartReqsResize,
  } = useTextareaResize({ initialHeight: 120, minHeight: 70 });

  const {
    height: notesHeight,
    setHeight: setNotesHeight,
    handleMouseDownResize: handleMouseDownNotesResize,
    handleTouchStartResize: handleTouchStartNotesResize,
  } = useTextareaResize({ initialHeight: 90, minHeight: 60 });

  return (
    <div className="space-y-6">
      {/* Section 1: Core Company & Role Info */}
      <Card className="bg-[#0C0E18] border-white/[0.08] text-white shadow-xl rounded-2xl">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm sm:text-base font-bold text-white">
              1. Role & Company Overview
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-xs text-gray-300 font-semibold">
                Job Title / Role *
              </Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Senior Frontend Engineer"
                value={formData.jobTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-xs text-gray-300 font-semibold">
                Company Name *
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. Google, GoTo, ByteDance"
                value={formData.companyName}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyWebsite" className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>Company Website</span>
              </Label>
              <Input
                id="companyWebsite"
                placeholder="https://company.com"
                value={formData.companyWebsite || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyWebsite: e.target.value }))}
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="formJobUrl" className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Link2 className="w-3.5 h-3.5 text-primary" />
                <span>Job Vacancy URL</span>
              </Label>
              <Input
                id="formJobUrl"
                placeholder="https://..."
                value={formData.jobUrl || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, jobUrl: e.target.value }))}
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Pipeline Classification & Logistics */}
      <Card className="bg-[#0C0E18] border-white/[0.08] text-white shadow-xl rounded-2xl">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-sm sm:text-base font-bold text-white">
              2. Classification & Workplace Logistics
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-xs text-gray-300 font-semibold">
                Source Platform
              </Label>
              <Select
                value={formData.platform}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, platform: v as JobPlatform }))}
              >
                <SelectTrigger id="platform" className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-xs">
                  <SelectGroup>
                    <SelectLabel className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider px-2 py-1">
                      Direct ATS Hub
                    </SelectLabel>
                    <SelectItem value="ashby">Ashby</SelectItem>
                    <SelectItem value="greenhouse">Greenhouse</SelectItem>
                    <SelectItem value="lever">Lever</SelectItem>
                  </SelectGroup>
                  <SelectSeparator className="bg-white/[0.08]" />

                  <SelectGroup>
                    <SelectLabel className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider px-2 py-1">
                      Global Feeds
                    </SelectLabel>
                    <SelectItem value="arbeitnow">Arbeitnow</SelectItem>
                    <SelectItem value="remoteok">RemoteOK</SelectItem>
                    <SelectItem value="remotive">Remotive</SelectItem>
                    <SelectItem value="jobicy">Jobicy</SelectItem>
                  </SelectGroup>
                  <SelectSeparator className="bg-white/[0.08]" />

                  <SelectGroup>
                    <SelectLabel className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider px-2 py-1">
                      Job Portals
                    </SelectLabel>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="jobstreet">Jobstreet</SelectItem>
                    <SelectItem value="glints">Glints</SelectItem>
                    <SelectItem value="techinasia">Tech in Asia</SelectItem>
                    <SelectItem value="indeed">Indeed</SelectItem>
                    <SelectItem value="company_website">Company Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workplaceType" className="text-xs text-gray-300 font-semibold">
                Workplace Setting
              </Label>
              <Select
                value={formData.workplaceType}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, workplaceType: v as WorkplaceType }))
                }
              >
                <SelectTrigger id="workplaceType" className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-xs">
                  <SelectItem value="remote">Remote 🌐</SelectItem>
                  <SelectItem value="hybrid">Hybrid 🏢</SelectItem>
                  <SelectItem value="onsite">On-site 📍</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobType" className="text-xs text-gray-300 font-semibold">
                Employment Type
              </Label>
              <Select
                value={formData.jobType}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, jobType: v as JobEmploymentType }))
                }
              >
                <SelectTrigger id="jobType" className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-xs">
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs text-gray-300 font-semibold">
                Initial Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, status: v as JobApplicationStatus }))
                }
              >
                <SelectTrigger id="status" className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-xs">
                  <SelectItem value="wishlist">Wishlist / Sourced</SelectItem>
                  <SelectItem value="applied">Applied (Submit Today)</SelectItem>
                  <SelectItem value="screening">Screening / OA</SelectItem>
                  <SelectItem value="interview_hr">HR Interview</SelectItem>
                  <SelectItem value="interview_tech">Technical Interview</SelectItem>
                  <SelectItem value="interview_user">User / Final Interview</SelectItem>
                  <SelectItem value="offering">Offering Stage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Location / Geographic Scope</span>
            </Label>
            <Input
              id="location"
              placeholder="e.g. Jakarta, Indonesia / Singapore / Worldwide Remote"
              value={formData.location || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Compensation Benchmarking */}
      <Card className="bg-[#0C0E18] border-white/[0.08] text-white shadow-xl rounded-2xl">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Coins className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-sm sm:text-base font-bold text-white">
              3. Compensation Benchmarking
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin" className="text-xs text-gray-300 font-semibold">
                Min Salary
              </Label>
              <Input
                id="salaryMin"
                type="number"
                placeholder="e.g. 15000000"
                value={formData.salaryMin ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryMin: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMax" className="text-xs text-gray-300 font-semibold">
                Max Salary
              </Label>
              <Input
                id="salaryMax"
                type="number"
                placeholder="e.g. 25000000"
                value={formData.salaryMax ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryMax: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryCurrency" className="text-xs text-gray-300 font-semibold">
                Currency
              </Label>
              <Input
                id="salaryCurrency"
                placeholder="IDR / USD / SGD / EUR"
                value={formData.salaryCurrency}
                onChange={(e) => setFormData((prev) => ({ ...prev, salaryCurrency: e.target.value }))}
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryPeriod" className="text-xs text-gray-300 font-semibold">
                Period
              </Label>
              <Select
                value={formData.salaryPeriod}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, salaryPeriod: v }))}
              >
                <SelectTrigger id="salaryPeriod" className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-xs">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Recruiter & Contact Information */}
      <Card className="bg-[#0C0E18] border-white/[0.08] text-white shadow-xl rounded-2xl">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-purple-400" />
            <CardTitle className="text-sm sm:text-base font-bold text-white">
              4. Recruiter & Key Contact (Optional)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName" className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Recruiter / Contact Name</span>
              </Label>
              <Input
                id="contactName"
                placeholder="e.g. Sarah Jenkins (Talent Partner)"
                value={formData.contactName || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Contact Email</span>
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="sarah.jenkins@company.com"
                value={formData.contactEmail || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Contact Phone / WhatsApp</span>
              </Label>
              <Input
                id="contactPhone"
                placeholder="+62 812..."
                value={formData.contactPhone || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Technical Requirements & Vacancy Context */}
      <Card className="bg-[#0C0E18] border-white/[0.08] text-white shadow-xl rounded-2xl">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            <CardTitle className="text-sm sm:text-base font-bold text-white">
              5. Job Description & Technical Requirements
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {/* 1st: Job Description Summary with Monaco Editor & Flexible Markdown Preview */}
          <div className="space-y-2">
            <Label htmlFor="jobDescriptionRaw" className="text-xs text-gray-300 font-semibold flex items-center justify-between">
              <span>Job Description Summary (Markdown)</span>
              <span className="text-[11px] text-gray-400 font-normal">
                Supports full Markdown formatting & live preview
              </span>
            </Label>
            <JobDescriptionMarkdownEditor
              value={formData.jobDescriptionRaw || ""}
              onChange={(val) => setFormData((prev) => ({ ...prev, jobDescriptionRaw: val }))}
              defaultHeight={380}
            />
          </div>

          {/* 2nd: Key Requirements / Tech Stack */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="requirements" className="text-xs text-gray-300 font-semibold">
                Key Requirements / Tech Stack (1 per line)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 hidden sm:flex items-center gap-1 font-mono">
                  <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setRequirementsHeight(requirementsHeight > 140 ? 100 : 220);
                  }}
                  className="h-6 w-6 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  title={requirementsHeight > 140 ? "Collapse height" : "Expand height"}
                >
                  {requirementsHeight > 140 ? (
                    <Minimize2 className="h-3 w-3" />
                  ) : (
                    <Maximize2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-inner">
              <Textarea
                id="requirements"
                style={{ height: `${requirementsHeight}px` }}
                placeholder="React / Next.js&#10;TypeScript&#10;Tailwind CSS&#10;State Management (Zustand/Redux)&#10;GraphQL & REST API"
                value={requirementsInput}
                onChange={(e) => setRequirementsInput(e.target.value)}
                className="w-full text-xs font-mono resize-none rounded-none border-0 bg-transparent text-slate-200 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto custom-scrollbar"
              />
              <div
                onMouseDown={handleMouseDownReqsResize}
                onTouchStart={handleTouchStartReqsResize}
                className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
                title="Drag handle to resize key requirements"
              >
                <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-16 transition-all duration-200" />
              </div>
            </div>
          </div>

          {/* 3rd: Personal Strategic Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes" className="text-xs text-gray-300 font-semibold">
                Personal Strategic Notes / Referrer
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 hidden sm:flex items-center gap-1 font-mono">
                  <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setNotesHeight(notesHeight > 130 ? 84 : 200);
                  }}
                  className="h-6 w-6 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  title={notesHeight > 130 ? "Collapse height" : "Expand height"}
                >
                  {notesHeight > 130 ? (
                    <Minimize2 className="h-3 w-3" />
                  ) : (
                    <Maximize2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-inner">
              <Textarea
                id="notes"
                style={{ height: `${notesHeight}px` }}
                placeholder="Internal notes, employee referral details, interview tips, or target milestones..."
                value={formData.notes || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full text-xs resize-none rounded-none border-0 bg-transparent text-slate-200 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto custom-scrollbar"
              />
              <div
                onMouseDown={handleMouseDownNotesResize}
                onTouchStart={handleTouchStartNotesResize}
                className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
                title="Drag handle to resize strategic notes"
              >
                <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-16 transition-all duration-200" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 rounded-2xl bg-[#0C0E18] border border-white/[0.08] shadow-xl">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full sm:w-auto text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
        >
          Cancel
        </Button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onSave(true)}
            disabled={isSaving}
            className="w-full sm:w-auto gap-1.5 rounded-xl border-white/[0.08] bg-white/[0.08] text-white hover:bg-white/[0.12] font-semibold text-xs h-10 px-5"
          >
            <span>Save & Open AI Tailor</span>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Button>

          <Button
            type="button"
            onClick={() => onSave(false)}
            disabled={isSaving}
            className="w-full sm:w-auto gap-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 text-xs h-10 px-6"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Save Opportunity</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
