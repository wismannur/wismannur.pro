"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  GraduationCap,
  Info,
  Loader2,
  MapPin,
  Save,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

  const kind = form.watch("kind");
  const isExperience = kind === "experience";
  const isCurrent = form.watch("isCurrent");
  const startMonth = form.watch("startMonth");
  const endMonth = form.watch("endMonth");

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
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading entry...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Resume Entry" : "Add Resume Entry"}
        </h1>
        {periodPreview && (
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Shown as: {periodPreview}</span>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-x-0 border-b-0 sm:border-border/50 shadow-none sm:shadow-md rounded-none sm:rounded-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/30 px-0 py-4 sm:p-6">
                  <CardTitle className="flex items-center">
                    {isExperience ? (
                      <Briefcase className="h-5 w-5 mr-2 text-primary" />
                    ) : (
                      <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                    )}
                    {isExperience ? "Work Experience" : "Education & Certification"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 px-0 py-4 sm:p-6">
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publication Status</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            {field.value
                              ? "This entry appears on your about page"
                              : "This entry stays hidden from your about page"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="kind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">Entry Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg border-border/50">
                              <SelectValue placeholder="Select entry type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="experience">Work Experience</SelectItem>
                            <SelectItem value="education">Education & Certification</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground mt-1">
                          Experience entries show the month and year; education entries show the
                          year only.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">
                          {isExperience ? "Job Title" : "Degree / Certification"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              isExperience ? "Frontend Engineer" : "Responsive Web Design"
                            }
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">
                          {isExperience ? "Company" : "Institution"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isExperience ? "Rumah Siap Kerja" : "Freecodecamp.org"}
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isExperience && (
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">Location</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="South Jakarta, Indonesia."
                                className="pl-10 rounded-lg border-border/50 focus-visible:ring-primary/30"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              isExperience
                                ? "Problem: … Role: … Action: … Quantifiable results: …"
                                : "Intensive FullStack Developer BootCamp for 3 Months."
                            }
                            className="min-h-32 rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Optional. Leave empty to show only the title, organization and period.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="space-y-6 sticky top-24">
                <Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/30 py-4">
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <FormField
                      control={form.control}
                      name="startMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">
                            Start Month
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="month"
                              className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isCurrent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ongoing</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              {isExperience ? "I currently work here" : "Still studying here"}
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">
                            End Month
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="month"
                              disabled={isCurrent}
                              className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                              {...field}
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground mt-1">
                            {isCurrent
                              ? 'Not needed — the period will read "Present".'
                              : periodPreview
                                ? `Preview: ${periodPreview}`
                                : "Pick a start and end month to preview the label."}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">
                            Display Order
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground mt-1">
                            Leave at 0 for newest first. A higher number pins the entry above the
                            rest.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="px-6 py-4 bg-muted/20 border-t border-border/30">
                    <Button
                      type="submit"
                      className="w-full rounded-lg group relative overflow-hidden"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="flex items-center group-hover:-translate-x-1 transition-transform duration-300">
                            {form.getValues("isPublished") ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Publish Entry
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save as Hidden
                              </>
                            )}
                          </span>
                          <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-300" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/30 py-3">
                    <CardTitle className="text-sm flex items-center">
                      <Info className="h-4 w-4 mr-2 text-primary" />
                      Resume Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <p>
                        <span className="font-semibold">PRAQ:</span> Start sentences with
                        "Problem:", "Role:", "Action:" or "Quantifiable results:" and the about page
                        highlights them automatically
                      </p>
                      <p>
                        <span className="font-semibold">Order:</span> Entries sort newest first from
                        the start month — no manual ordering needed
                      </p>
                      <p>
                        <span className="font-semibold">Education:</span> Only the year is shown, so
                        any month within the right year works
                      </p>
                      <p>
                        <span className="font-semibold">Hidden:</span> Use the publication toggle to
                        keep an entry out of the public page without deleting it
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
