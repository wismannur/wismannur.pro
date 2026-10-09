"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Briefcase, GraduationCap, MapPin, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatExperienceMeta,
  EMPLOYMENT_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
} from "@/lib/resume";
import type { ResumeFormValues } from "../resume-form-schema";

interface ResumeRoleCardProps {
  form: UseFormReturn<ResumeFormValues>;
  isExperience: boolean;
  watchedLocation: string;
  watchedEmploymentType: string;
  watchedLocationType: string;
}

export function ResumeRoleCard({
  form,
  isExperience,
  watchedLocation,
  watchedEmploymentType,
  watchedLocationType,
}: ResumeRoleCardProps) {
  const metaPreview = formatExperienceMeta({
    location: watchedLocation,
    employmentType: watchedEmploymentType === "none" ? undefined : watchedEmploymentType,
    locationType: watchedLocationType === "none" ? undefined : watchedLocationType,
  });

  return (
    <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          {isExperience ? (
            <Briefcase className="h-4 w-4 text-primary" />
          ) : (
            <GraduationCap className="h-4 w-4 text-primary" />
          )}
          <span>Role & Organization Credentials</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title / Role / Degree */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-slate-200 text-xs font-semibold">
                  {isExperience ? "Job Title / Engineering Role *" : "Degree / Certification *"}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      isExperience
                        ? "e.g. Lead Full-Stack Engineer / Engineering Manager"
                        : "e.g. B.S. in Computer Science / AWS Solutions Architect"
                    }
                    className="h-11 rounded-xl bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-medium"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          {/* Organization / Company */}
          <FormField
            control={form.control}
            name="organization"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-slate-200 text-xs font-semibold">
                  {isExperience ? "Company / Organization *" : "Institution / University *"}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      isExperience
                        ? "e.g. Google DeepMind / Scale AI"
                        : "e.g. Massachusetts Institute of Technology (MIT)"
                    }
                    className="h-11 rounded-xl bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-medium"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Location, Work Type & Workplace Mode (only for experience) */}
        {isExperience && (
          <div className="space-y-4 pt-1 border-t border-white/[0.06]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Work Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>Work Location</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. West Jakarta, DKI Jakarta, Indonesia"
                        className="h-10 rounded-xl bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-medium"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-[11px] text-slate-500">City, region, or country.</div>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Work Type / Employment Type */}
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      <span>Work Type / Employment</span>
                    </FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 bg-[#131726] border-white/[0.08] text-slate-100 rounded-xl focus:ring-primary/40 text-xs">
                          <SelectValue placeholder="Select work type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200 text-xs">
                        <SelectItem value="none">Not Specified</SelectItem>
                        {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-[11px] text-slate-500">Contract, Full-time, Freelance, etc.</div>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Workplace / Location Type */}
              <FormField
                control={form.control}
                name="locationType"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span>Workplace Mode</span>
                    </FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 bg-[#131726] border-white/[0.08] text-slate-100 rounded-xl focus:ring-primary/40 text-xs">
                          <SelectValue placeholder="Select workplace mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200 text-xs">
                        <SelectItem value="none">Not Specified</SelectItem>
                        {LOCATION_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-[11px] text-slate-500">Remote, Hybrid, or On-site.</div>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Live Meta Preview */}
            {metaPreview && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#131726]/60 border border-white/[0.06] text-xs text-slate-300">
                <span className="text-slate-500 font-medium">CV Subtitle Preview:</span>
                <span className="text-primary font-medium">{metaPreview}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
