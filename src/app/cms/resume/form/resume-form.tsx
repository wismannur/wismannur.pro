"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Check,
  GraduationCap,
  GripHorizontal,
  Info,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
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
import { Textarea } from "@/components/ui/textarea";
import { MonthPicker } from "@/components/ui/month-picker";
import { formatResumePeriod } from "@/lib/resume";
import { resumeService, type ResumeKind } from "@/services";

// The `date` columns hold ISO days; the month inputs speak "YYYY-MM".
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const toIsoDay = (month: string) => `${month}-01`;
const toMonthInput = (isoDay?: string) => (isoDay ? isoDay.slice(0, 7) : "");

const resumeSchema = z
  .object({
    kind: z.enum(["experience", "education"]),
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    organization: z.string().min(2, { message: "Organization must be at least 2 characters" }),
    location: z.string().optional(),
    startMonth: z.string().regex(MONTH_PATTERN, { message: "Pick a start month" }),
    endMonth: z.string().optional(),
    isCurrent: z.boolean().default(false),
    description: z.string().optional(),
    sortOrder: z.number().int(),
    isPublished: z.boolean().default(true),
  })
  .refine((data) => data.isCurrent || MONTH_PATTERN.test(data.endMonth ?? ""), {
    message: "Pick an end month, or mark this entry as ongoing",
    path: ["endMonth"],
  })
  .refine((data) => data.isCurrent || !data.endMonth || data.endMonth >= data.startMonth, {
    message: "End month cannot be earlier than the start month",
    path: ["endMonth"],
  });

type ResumeFormValues = z.infer<typeof resumeSchema>;

export function ResumeForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Resize state & handlers for Description textarea
  const [descriptionHeight, setDescriptionHeight] = useState<number>(140);
  const isDraggingDescriptionRef = useRef(false);
  const dragStartYDescriptionRef = useRef(0);
  const startHeightDescriptionRef = useRef(140);

  const handleMouseDownDescriptionResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDescriptionRef.current = true;
    dragStartYDescriptionRef.current = e.clientY;
    startHeightDescriptionRef.current = descriptionHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingDescriptionRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYDescriptionRef.current;
      const maxHeight = Math.max(500, Math.floor(window.innerHeight * 0.7));
      const newHeight = Math.min(Math.max(startHeightDescriptionRef.current + deltaY, 80), maxHeight);
      setDescriptionHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingDescriptionRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartDescriptionResize = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingDescriptionRef.current = true;
    dragStartYDescriptionRef.current = touch.clientY;
    startHeightDescriptionRef.current = descriptionHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingDescriptionRef.current) return;
      const currentTouch = moveEvent.touches[0];
      if (!currentTouch) return;
      const deltaY = currentTouch.clientY - dragStartYDescriptionRef.current;
      const maxHeight = Math.max(500, Math.floor(window.innerHeight * 0.7));
      const newHeight = Math.min(Math.max(startHeightDescriptionRef.current + deltaY, 80), maxHeight);
      setDescriptionHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingDescriptionRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  // `/cms/resume` links here with the tab the owner was looking at.
  const initialKind: ResumeKind =
    searchParams.get("kind") === "education" ? "education" : "experience";

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      kind: initialKind,
      title: "",
      organization: "",
      location: "",
      startMonth: "",
      endMonth: "",
      isCurrent: false,
      description: "",
      sortOrder: 0,
      isPublished: true,
    },
  });

  const kind = useWatch({ control: form.control, name: "kind" }) ?? "experience";
  const isExperience = kind === "experience";
  const isCurrent = useWatch({ control: form.control, name: "isCurrent" }) ?? false;
  const startMonth = useWatch({ control: form.control, name: "startMonth" }) ?? "";
  const endMonth = useWatch({ control: form.control, name: "endMonth" });
  const watchedTitle = useWatch({ control: form.control, name: "title" }) ?? "";
  const watchedOrganization = useWatch({ control: form.control, name: "organization" }) ?? "";
  const watchedIsPublished = useWatch({ control: form.control, name: "isPublished" }) ?? true;
  const watchedSortOrder = useWatch({ control: form.control, name: "sortOrder" }) ?? 0;

  // Live version of what /about will show for this entry.
  const periodPreview = MONTH_PATTERN.test(startMonth)
    ? formatResumePeriod({
        kind,
        startDate: toIsoDay(startMonth),
        endDate: MONTH_PATTERN.test(endMonth ?? "") ? toIsoDay(endMonth!) : undefined,
        isCurrent,
      })
    : null;

  useEffect(() => {
    const fetchEntry = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const entry = await resumeService.getById(id);
        if (entry) {
          form.reset({
            kind: entry.kind,
            title: entry.title,
            organization: entry.organization,
            location: entry.location ?? "",
            startMonth: toMonthInput(entry.startDate),
            endMonth: toMonthInput(entry.endDate),
            isCurrent: entry.isCurrent,
            description: entry.description,
            sortOrder: entry.sortOrder,
            isPublished: entry.isPublished,
          });
        } else {
          toast.error("Entry not found");
          router.push("/cms/resume");
        }
      } catch (error) {
        console.error("Error loading resume entry:", error);
        toast.error("Failed to load entry");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntry();
  }, [id, form, router]);

  const onSubmit = async (data: ResumeFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        kind: data.kind,
        title: data.title.trim(),
        organization: data.organization.trim(),
        // Location only belongs to work experience.
        location: data.kind === "experience" ? data.location?.trim() || undefined : undefined,
        startDate: toIsoDay(data.startMonth),
        endDate: data.isCurrent || !data.endMonth ? undefined : toIsoDay(data.endMonth),
        isCurrent: data.isCurrent,
        description: data.description?.trim() ?? "",
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      };

      if (isEditMode && id) {
        await resumeService.update(id, payload);
        toast.success("Entry updated successfully!");
      } else {
        await resumeService.create(payload);
        toast.success("Entry created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["resumeEntries"] });
      router.push("/cms/resume");
    } catch (error) {
      console.error("Error saving resume entry:", error);
      toast.error("Failed to save entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <span className="text-xs text-slate-400 font-medium">Loading resume studio...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 text-slate-100 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-slate-400 hover:text-white hover:bg-[#131726] text-xs font-medium rounded-lg"
        >
          <Link href="/cms/resume">
            <ArrowLeft className="h-4 w-4" /> Back to Resume
          </Link>
        </Button>
      </div>

      {/* Electric Obsidian Command Center Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] border border-white/[0.08] shadow-2xl">
        <div className="absolute top-0 right-0 w-[450px] h-[240px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[280px] h-[140px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                {isExperience ? (
                  <Briefcase size={13} className="text-primary" />
                ) : (
                  <GraduationCap size={13} className="text-primary" />
                )}
                <span>CAREER TIMELINE ARCHITECT</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Chronology Engine Active</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                {isExperience ? "Work Experience" : "Education & Credential"}
              </span>
              {watchedIsPublished ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  Public / Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                  Hidden Draft
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isEditMode ? "Edit " : "Add "}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-primary">
                {isExperience ? "Career Experience" : "Education Milestone"}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Document leadership accomplishments, software engineering architecture impact, degrees, and academic milestones with structured impact framing.
            </p>

            {/* Quick KPI badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-gray-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>
                  Timeline:{" "}
                  <strong className="text-white font-bold">
                    {periodPreview || "Timeline not set"}
                  </strong>
                </span>
              </div>
              {watchedTitle && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <span>
                    Role: <strong className="text-white font-bold">{watchedTitle}</strong>
                  </span>
                </div>
              )}
              {watchedOrganization && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    Org: <strong className="text-white font-bold">{watchedOrganization}</strong>
                  </span>
                </div>
              )}
              {watchedSortOrder !== 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Pin Weight: <strong className="text-white font-bold">{watchedSortOrder}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons on Hero Header */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/cms/resume")}
              disabled={isSubmitting}
              className="text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="gap-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 text-xs px-5 h-10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  {watchedIsPublished ? (
                    <>
                      <Send className="w-4 h-4 text-emerald-300" />
                      <span>Publish Entry</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>Save as Hidden</span>
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card 1: Entry Classification & Chronology */}
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
                            : "Pick conclusion date."}
                        </div>
                        <FormMessage className="text-xs text-rose-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Role & Organization Details */}
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

              {/* Location (only for experience) */}
              {isExperience && (
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
                          placeholder="e.g. San Francisco, CA / Remote (Global)"
                          className="h-10 rounded-xl bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-rose-400" />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Card 3: Accomplishments & Impact (Spacious Textarea with Nested Resizer) */}
          <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Role Summary, Accomplishments & Quantifiable Impact</span>
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">
                  Structured impact framing with STAR statements or bullet achievements
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
                <Info className="h-3 w-3 text-primary" />
                <span>Problem &bull; Role &bull; Action &bull; Quantifiable results</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-200 text-xs font-semibold">
                        Accomplishments Details
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1 font-mono">
                          <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDescriptionHeight((prev) => (prev > 180 ? 140 : 280));
                          }}
                          className="h-6 w-6 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06]"
                          title={descriptionHeight > 180 ? "Collapse height" : "Expand height"}
                        >
                          {descriptionHeight > 180 ? (
                            <Minimize2 className="h-3 w-3" />
                          ) : (
                            <Maximize2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-inner">
                      <FormControl>
                        <Textarea
                          placeholder={
                            isExperience
                              ? "Problem: High p99 API latency across microservices.\nRole: Lead Backend & Distributed Systems Architect.\nAction: Re-architected data pipelines with Go microservices, Redis caching, and async job queues.\nQuantifiable results: 420% throughput gain and $18k/month cloud cost reduction."
                              : "Dean's Honor List (4 semesters), Focus in Distributed Systems and Compilers, Capstone Thesis: High-Throughput RAFT Consensus Engine."
                          }
                          style={{ height: `${descriptionHeight}px` }}
                          className="w-full text-xs resize-none rounded-none border-0 bg-transparent text-slate-100 placeholder:text-slate-500 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto custom-scrollbar font-mono sm:font-sans"
                          {...field}
                        />
                      </FormControl>
                      {/* Bottom Drag Handle Bar to Resize Inside Field */}
                      <div
                        onMouseDown={handleMouseDownDescriptionResize}
                        onTouchStart={handleTouchStartDescriptionResize}
                        className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
                        title="Drag handle to resize accomplishments"
                      >
                        <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-16 transition-all duration-200" />
                      </div>
                    </div>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Guide Note Box */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Sentences starting with <code className="text-slate-200 font-mono bg-white/[0.04] px-1 py-0.5 rounded">Problem:</code>, <code className="text-slate-200 font-mono bg-white/[0.04] px-1 py-0.5 rounded">Role:</code>, <code className="text-slate-200 font-mono bg-white/[0.04] px-1 py-0.5 rounded">Action:</code>, or <code className="text-slate-200 font-mono bg-white/[0.04] px-1 py-0.5 rounded">Quantifiable results:</code> automatically receive prominent visual badge styling on the public About page.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Action Footer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0E18] border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>
                {watchedIsPublished
                  ? "Entry is set to appear on your public profile, about page, and CV."
                  : "Entry will remain hidden as a private draft."}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/cms/resume")}
                disabled={isSubmitting}
                className="text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 text-xs px-6 h-10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Entry...</span>
                  </>
                ) : (
                  <>
                    {watchedIsPublished ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-300" />
                        <span>Publish Entry</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 text-amber-300" />
                        <span>Save as Hidden</span>
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
