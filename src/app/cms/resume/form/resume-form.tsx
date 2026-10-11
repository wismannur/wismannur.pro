"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Check, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { formatResumePeriod } from "@/lib/resume";
import { resumeService, type PolishResumeResult, type ResumeKind } from "@/services";
import { useTextareaResize } from "@/hooks/use-textarea-resize";
import { ResumePolishDialog } from "./resume-polish-dialog";
import {
  toIsoDay,
  toMonthInput,
  resumeSchema,
  MONTH_PATTERN,
  type ResumeFormValues,
} from "./resume-form-schema";
import { ResumeHeroBanner } from "./components/resume-hero-banner";
import { ResumeClassificationCard } from "./components/resume-classification-card";
import { ResumeRoleCard } from "./components/resume-role-card";
import { ResumeAccomplishmentsCard } from "./components/resume-accomplishments-card";

export function ResumeForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Resize state & handlers for Description textarea
  const {
    height: descriptionHeight,
    setHeight: setDescriptionHeight,
    handleMouseDownResize: handleMouseDownDescriptionResize,
    handleTouchStartResize: handleTouchStartDescriptionResize,
  } = useTextareaResize({ initialHeight: 140, minHeight: 80 });

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
      employmentType: "",
      locationType: "",
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
  const watchedLocation = useWatch({ control: form.control, name: "location" }) ?? "";
  const watchedEmploymentType = useWatch({ control: form.control, name: "employmentType" }) ?? "";
  const watchedLocationType = useWatch({ control: form.control, name: "locationType" }) ?? "";
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
    : "";

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
            employmentType: entry.employmentType ?? "",
            locationType: entry.locationType ?? "",
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
        location: data.kind === "experience" ? data.location?.trim() || undefined : undefined,
        employmentType: data.kind === "experience" ? data.employmentType?.trim() || undefined : undefined,
        locationType: data.kind === "experience" ? data.locationType?.trim() || undefined : undefined,
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

  // Second Brain Polish & Sync states
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishResult, setPolishResult] = useState<PolishResumeResult | null>(null);
  const [showPolishDialog, setShowPolishDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handlePolish = async () => {
    const currentTitle = form.getValues("title")?.trim();
    const currentOrg = form.getValues("organization")?.trim();
    const currentDesc = form.getValues("description")?.trim();

    if (!currentTitle || !currentOrg) {
      toast.error("Please enter Job Title and Organization first so Second Brain knows what experience to synthesize.");
      return;
    }

    setIsPolishing(true);
    try {
      const result = await resumeService.polishWithSecondBrain({
        title: currentTitle,
        organization: currentOrg,
        location: form.getValues("location")?.trim() || undefined,
        employmentType: form.getValues("employmentType")?.trim() || undefined,
        locationType: form.getValues("locationType")?.trim() || undefined,
        currentDescription: currentDesc,
        period: periodPreview || undefined,
      });
      setPolishResult(result);
      setShowPolishDialog(true);
      toast.success("Synthesized accomplishments with My Second Brain!");
    } catch (error) {
      console.error("Error polishing resume:", error);
      toast.error(error instanceof Error ? error.message : "Failed to polish resume entry.");
    } finally {
      setIsPolishing(false);
    }
  };

  const handleApplyPolish = (mode: "replace" | "append") => {
    if (!polishResult) return;
    const current = form.getValues("description") || "";
    if (mode === "replace") {
      form.setValue("description", polishResult.polishedDescription, { shouldDirty: true });
      toast.success("Applied Second Brain polished bullets!");
    } else {
      const merged = current.trim()
        ? `${current.trim()}\n\n${polishResult.polishedDescription}`
        : polishResult.polishedDescription;
      form.setValue("description", merged, { shouldDirty: true });
      toast.success("Appended Second Brain polished bullets!");
    }
    setShowPolishDialog(false);
  };

  const handleSyncToSecondBrain = async () => {
    const currentTitle = form.getValues("title")?.trim();
    const currentOrg = form.getValues("organization")?.trim();
    const currentDesc = form.getValues("description")?.trim();

    if (!currentTitle || !currentOrg || !currentDesc) {
      toast.error("Please fill in Job Title, Organization, and Accomplishments Description before syncing.");
      return;
    }

    setIsSyncing(true);
    try {
      await resumeService.syncToSecondBrain({
        title: currentTitle,
        organization: currentOrg,
        description: currentDesc,
        category: "career-impact",
        tags: ["resume", "career-impact", currentOrg.toLowerCase().replace(/[^a-z0-9]/g, "-")],
      });
      queryClient.invalidateQueries({ queryKey: ["aiKnowledgeItems"] });
      toast.success("Synced to My Second Brain as a Career Impact item!", {
        action: {
          label: "Open Brain",
          onClick: () => router.push("/cms/ai-knowledge"),
        },
      });
    } catch (error) {
      console.error("Error syncing to Second Brain:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync to Second Brain.");
    } finally {
      setIsSyncing(false);
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

      {/* Hero Banner */}
      <ResumeHeroBanner
        isExperience={isExperience}
        isPublished={watchedIsPublished}
        periodPreview={periodPreview}
        watchedSortOrder={watchedSortOrder}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/cms/resume")}
        onSubmit={form.handleSubmit(onSubmit)}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card 1: Entry Classification & Chronology */}
          <ResumeClassificationCard
            form={form}
            isExperience={isExperience}
            isCurrent={isCurrent}
            startMonth={startMonth}
            periodPreview={periodPreview}
          />

          {/* Card 2: Role & Organization Details */}
          <ResumeRoleCard
            form={form}
            isExperience={isExperience}
            watchedLocation={watchedLocation}
            watchedEmploymentType={watchedEmploymentType}
            watchedLocationType={watchedLocationType}
          />

          {/* Card 3: Accomplishments & Impact */}
          <ResumeAccomplishmentsCard
            form={form}
            isExperience={isExperience}
            isSyncing={isSyncing}
            isPolishing={isPolishing}
            onSyncToSecondBrain={handleSyncToSecondBrain}
            onPolish={handlePolish}
            descriptionHeight={descriptionHeight}
            setDescriptionHeight={setDescriptionHeight}
            handleMouseDownDescriptionResize={handleMouseDownDescriptionResize}
            handleTouchStartDescriptionResize={handleTouchStartDescriptionResize}
          />

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

      {/* Polish with Second Brain Preview Dialog */}
      <ResumePolishDialog
        open={showPolishDialog}
        onOpenChange={setShowPolishDialog}
        polishResult={polishResult}
        hasExistingDescription={Boolean(form.getValues("description")?.trim())}
        onApply={handleApplyPolish}
      />
    </div>
  );
}
