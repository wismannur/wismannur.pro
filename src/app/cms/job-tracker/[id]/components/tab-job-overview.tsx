"use client";

import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import type {
  JobApplication,
  JobEmploymentType,
  JobPlatform,
  WorkplaceType,
} from "@/services/job-tracker/types";

interface TabJobOverviewProps {
  application: JobApplication;
  formData: Partial<JobApplication>;
  isSaving: boolean;
  onFormChange: (data: Partial<JobApplication>) => void;
  onSave: () => Promise<void>;
}

export function TabJobOverview({
  application,
  formData,
  isSaving,
  onFormChange,
  onSave,
}: TabJobOverviewProps) {
  return (
    <Card className="bg-[#0C0E18]/80 backdrop-blur-md border border-white/[0.08] shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-white/[0.06] bg-[#131726]/40 px-6 py-4">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          Job Vacancy Information
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Edit core job specifications, platform source, salary brackets, and recruiter notes.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle" className="text-xs font-semibold text-slate-300">
              Job Title
            </Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle ?? application.jobTitle}
              onChange={(e) => onFormChange({ ...formData, jobTitle: e.target.value })}
              className="text-xs bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-white placeholder:text-muted-foreground/60 h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-xs font-semibold text-slate-300">
              Company Name
            </Label>
            <Input
              id="companyName"
              value={formData.companyName ?? application.companyName}
              onChange={(e) => onFormChange({ ...formData, companyName: e.target.value })}
              className="text-xs bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-white placeholder:text-muted-foreground/60 h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="platform" className="text-xs font-semibold text-slate-300">
              Platform Source
            </Label>
            <Select
              value={formData.platform ?? application.platform}
              onValueChange={(v) => onFormChange({ ...formData, platform: v as JobPlatform })}
            >
              <SelectTrigger className="text-xs h-9 bg-[#131726] border-white/[0.08] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0C0E18] border-white/[0.12] text-slate-200">
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="jobstreet">Jobstreet</SelectItem>
                <SelectItem value="glints">Glints</SelectItem>
                <SelectItem value="techinasia">Tech in Asia</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="company_website">Company Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workplaceType" className="text-xs font-semibold text-slate-300">
              Workplace Setting
            </Label>
            <Select
              value={formData.workplaceType ?? application.workplaceType}
              onValueChange={(v) =>
                onFormChange({ ...formData, workplaceType: v as WorkplaceType })
              }
            >
              <SelectTrigger className="text-xs h-9 bg-[#131726] border-white/[0.08] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0C0E18] border-white/[0.12] text-slate-200">
                <SelectItem value="remote">Remote 🌐</SelectItem>
                <SelectItem value="hybrid">Hybrid 🏢</SelectItem>
                <SelectItem value="onsite">On-site 📍</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jobType" className="text-xs font-semibold text-slate-300">
              Employment Type
            </Label>
            <Select
              value={formData.jobType ?? application.jobType}
              onValueChange={(v) => onFormChange({ ...formData, jobType: v as JobEmploymentType })}
            >
              <SelectTrigger className="text-xs h-9 bg-[#131726] border-white/[0.08] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0C0E18] border-white/[0.12] text-slate-200">
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="salaryMin" className="text-xs font-semibold text-slate-300">
              Min Salary Range
            </Label>
            <Input
              id="salaryMin"
              type="number"
              value={formData.salaryMin ?? application.salaryMin ?? ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  salaryMin: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="text-xs bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-white placeholder:text-muted-foreground/60 h-9 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salaryMax" className="text-xs font-semibold text-slate-300">
              Max Salary Range
            </Label>
            <Input
              id="salaryMax"
              type="number"
              value={formData.salaryMax ?? application.salaryMax ?? ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  salaryMax: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="text-xs bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-white placeholder:text-muted-foreground/60 h-9 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salaryCurrency" className="text-xs font-semibold text-slate-300">
              Currency Code
            </Label>
            <Input
              id="salaryCurrency"
              value={formData.salaryCurrency ?? application.salaryCurrency}
              onChange={(e) => onFormChange({ ...formData, salaryCurrency: e.target.value })}
              className="text-xs bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-white placeholder:text-muted-foreground/60 h-9 font-mono uppercase"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jobDescriptionRaw" className="text-xs font-semibold text-slate-300">
            Raw Job Description
          </Label>
          <Textarea
            id="jobDescriptionRaw"
            rows={8}
            value={formData.jobDescriptionRaw ?? application.jobDescriptionRaw ?? ""}
            onChange={(e) => onFormChange({ ...formData, jobDescriptionRaw: e.target.value })}
            className="text-xs font-mono bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-slate-200 leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs font-semibold text-slate-300">
            Personal Application Notes & Context
          </Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Any personal thoughts, notes from recruiter chats, interview insights, or reminders..."
            value={formData.notes ?? application.notes ?? ""}
            onChange={(e) => onFormChange({ ...formData, notes: e.target.value })}
            className="text-xs bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-slate-200 leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-white/[0.08]">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="gap-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-xs px-5 shadow-lg shadow-indigo-500/25 transition-all duration-200"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
