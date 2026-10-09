"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { MonthPicker } from "@/components/ui/month-picker";
import type { ResumeFormValues } from "../resume-form-schema";

interface ResumeClassificationCardProps {
  form: UseFormReturn<ResumeFormValues>;
  isExperience: boolean;
  isCurrent: boolean;
  startMonth: string;
  periodPreview: string;
}

export function ResumeClassificationCard({
  form,
  isExperience,
  isCurrent,
  startMonth,
  periodPreview,
}: ResumeClassificationCardProps) {
  return (
    <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-visible">
      <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span>Classification & Chronological Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Row 1: Entry Type, Publication Switch & Custom Weight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Entry Type */}
          <FormField
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-slate-200 text-xs font-semibold">
                  Entry Category *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 bg-[#131726] border-white/[0.08] text-slate-100 rounded-xl focus:ring-primary/40 text-xs">
                      <SelectValue placeholder="Select entry type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200 text-xs">
                    <SelectItem value="experience">Work Experience</SelectItem>
                    <SelectItem value="education">Education & Credential</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-slate-500">
                  {isExperience
                    ? "Displays month & year with location on timeline"
                    : "Displays graduation year only on timeline"}
                </div>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          {/* Publication Status Switch */}
          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between rounded-xl bg-[#131726] border border-white/[0.06] p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Visibility Status</span>
                    </FormLabel>
                    <div className="text-[11px] text-slate-400">
                      {field.value ? "Public on profile" : "Hidden draft mode"}
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Toggle whether to showcase on public /about & CV pages.
                </div>
              </FormItem>
            )}
          />

          {/* Custom Sort Weight */}
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-slate-200 text-xs font-semibold">
                    Custom Sort Weight
                  </FormLabel>
                  <span className="text-[10px] text-slate-500 font-mono">0 = Chronological</span>
                </div>
                <FormControl>
                  <Input
                    type="number"
                    className="h-10 bg-[#131726] border-white/[0.08] text-slate-100 rounded-xl focus-visible:ring-primary/40 text-xs"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                </FormControl>
                <div className="text-[11px] text-slate-500">
                  Default is 0. Higher positive values pin this item higher on timeline.
                </div>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Timeline Sub-Panel */}
        <div className="rounded-2xl bg-[#131726]/60 border border-white/[0.06] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.04] pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Timeline Period Coordinates</span>
            </div>
            {periodPreview && (
              <Badge
                variant="secondary"
                className="w-fit text-[11px] bg-primary/10 border border-primary/25 text-primary font-mono px-3 py-1 rounded-lg"
              >
                Formatted: {periodPreview}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Start Month */}
            <FormField
              control={form.control}
              name="startMonth"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-slate-200 text-xs font-semibold">
                    Start Month *
                  </FormLabel>
                  <FormControl>
                    <MonthPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select start month"
                    />
                  </FormControl>
                  <div className="text-[11px] text-slate-500">Pick starting year and month.</div>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            {/* Ongoing Role Switch */}
            <FormField
              control={form.control}
              name="isCurrent"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-between rounded-xl bg-[#0C0E18] border border-white/[0.06] p-3.5 h-[76px]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs font-bold text-white">
                        {isExperience ? "Ongoing Position" : "Currently Enrolled"}
                      </FormLabel>
                      <div className="text-[11px] text-slate-400">
                        {field.value
                          ? isExperience
                            ? 'Active ("Present")'
                            : 'Enrolled ("Present")'
                          : "Completed period"}
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* End Month */}
            <FormField
              control={form.control}
              name="endMonth"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-slate-200 text-xs font-semibold">
                    End Month {!isCurrent && "*"}
                  </FormLabel>
                  <FormControl>
                    <MonthPicker
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isCurrent}
                      minDate={startMonth || undefined}
                      placeholder="Select end month"
                    />
                  </FormControl>
                  <div className="text-[11px] text-slate-500">
                    {isCurrent
                      ? 'Disabled for active positions (renders as "Present").'
                      : "Leave empty if still actively ongoing."}
                  </div>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
