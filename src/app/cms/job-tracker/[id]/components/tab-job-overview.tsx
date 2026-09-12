"use client";

import { useRef, useState } from "react";
import { GripHorizontal, Loader2, Maximize2, Minimize2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CompanyIntelligenceCard } from "./company-intelligence-card";
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
  onDirectUpdate?: (data: Partial<JobApplication>) => Promise<void>;
}

export function TabJobOverview({
  application,
  formData,
  isSaving,
  onFormChange,
  onSave,
  onDirectUpdate,
}: TabJobOverviewProps) {
  // Resizable state & handlers for Raw Job Description
  const [jobDescHeight, setJobDescHeight] = useState<number>(180);
  const isDraggingJobDescRef = useRef(false);
  const dragJobDescStartYRef = useRef(0);
  const startJobDescHeightRef = useRef(180);

  const handleMouseDownJobDescResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingJobDescRef.current = true;
    dragJobDescStartYRef.current = e.clientY;
    startJobDescHeightRef.current = jobDescHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingJobDescRef.current) return;
      const deltaY = moveEvent.clientY - dragJobDescStartYRef.current;
      const maxHeight = Math.min(800, Math.floor(window.innerHeight * 0.85));
      const newHeight = Math.min(Math.max(startJobDescHeightRef.current + deltaY, 100), maxHeight);
      setJobDescHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingJobDescRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartJobDescResize = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingJobDescRef.current = true;
    dragJobDescStartYRef.current = e.touches[0].clientY;
    startJobDescHeightRef.current = jobDescHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingJobDescRef.current || moveEvent.touches.length !== 1) return;
      const deltaY = moveEvent.touches[0].clientY - dragJobDescStartYRef.current;
      const maxHeight = Math.min(800, Math.floor(window.innerHeight * 0.85));
      const newHeight = Math.min(Math.max(startJobDescHeightRef.current + deltaY, 100), maxHeight);
      setJobDescHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingJobDescRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Resizable state & handlers for Personal Application Notes & Context
  const [notesHeight, setNotesHeight] = useState<number>(90);
  const isDraggingNotesRef = useRef(false);
  const dragNotesStartYRef = useRef(0);
  const startNotesHeightRef = useRef(90);

  const handleMouseDownNotesResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingNotesRef.current = true;
    dragNotesStartYRef.current = e.clientY;
    startNotesHeightRef.current = notesHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingNotesRef.current) return;
      const deltaY = moveEvent.clientY - dragNotesStartYRef.current;
      const maxHeight = Math.min(600, Math.floor(window.innerHeight * 0.75));
      const newHeight = Math.min(Math.max(startNotesHeightRef.current + deltaY, 70), maxHeight);
      setNotesHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingNotesRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartNotesResize = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingNotesRef.current = true;
    dragNotesStartYRef.current = e.touches[0].clientY;
    startNotesHeightRef.current = notesHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingNotesRef.current || moveEvent.touches.length !== 1) return;
      const deltaY = moveEvent.touches[0].clientY - dragNotesStartYRef.current;
      const maxHeight = Math.min(600, Math.floor(window.innerHeight * 0.75));
      const newHeight = Math.min(Math.max(startNotesHeightRef.current + deltaY, 70), maxHeight);
      setNotesHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingNotesRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };
  return (
    <div className="space-y-6">
      {/* Company Intelligence & Reputation Dossier */}
      <CompanyIntelligenceCard
        application={application}
        onUpdate={async (updated) => {
          if (onDirectUpdate) {
            await onDirectUpdate(updated);
          } else {
            onFormChange({ ...formData, ...updated });
            await onSave();
          }
        }}
      />

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
          <div className="flex items-center justify-between">
            <Label htmlFor="jobDescriptionRaw" className="text-xs font-semibold text-slate-300">
              Raw Job Description
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1 font-mono">
                <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (jobDescHeight > 220) {
                    setJobDescHeight(180);
                  } else {
                    setJobDescHeight(380);
                  }
                }}
                className="h-6 w-6 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06]"
                title={jobDescHeight > 220 ? "Perkecil input" : "Perbesar input"}
              >
                {jobDescHeight > 220 ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-inner">
            <Textarea
              id="jobDescriptionRaw"
              value={formData.jobDescriptionRaw ?? application.jobDescriptionRaw ?? ""}
              onChange={(e) => onFormChange({ ...formData, jobDescriptionRaw: e.target.value })}
              style={{ height: `${jobDescHeight}px` }}
              className="w-full text-xs font-mono resize-none rounded-none border-0 bg-transparent text-slate-200 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto scrollbar-thin"
            />
            {/* Bottom Drag Handle Bar to Resize */}
            <div
              onMouseDown={handleMouseDownJobDescResize}
              onTouchStart={handleTouchStartJobDescResize}
              className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
              title="Drag handle to resize job description"
            >
              <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-16 transition-all duration-200" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="notes" className="text-xs font-semibold text-slate-300">
              Personal Application Notes & Context
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1 font-mono">
                <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (notesHeight > 130) {
                    setNotesHeight(90);
                  } else {
                    setNotesHeight(220);
                  }
                }}
                className="h-6 w-6 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06]"
                title={notesHeight > 130 ? "Perkecil input" : "Perbesar input"}
              >
                {notesHeight > 130 ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-inner">
            <Textarea
              id="notes"
              placeholder="Any personal thoughts, notes from recruiter chats, interview insights, or reminders..."
              value={formData.notes ?? application.notes ?? ""}
              onChange={(e) => onFormChange({ ...formData, notes: e.target.value })}
              style={{ height: `${notesHeight}px` }}
              className="w-full text-xs resize-none rounded-none border-0 bg-transparent text-slate-200 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto scrollbar-thin"
            />
            {/* Bottom Drag Handle Bar to Resize */}
            <div
              onMouseDown={handleMouseDownNotesResize}
              onTouchStart={handleTouchStartNotesResize}
              className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
              title="Drag handle to resize application notes"
            >
              <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-16 transition-all duration-200" />
            </div>
          </div>
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
    </div>
  );
}
