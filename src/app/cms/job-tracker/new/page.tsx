"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  Check,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jobTrackerService } from "@/services";
import type {
  JobApplicationStatus,
  NewJobApplication,
} from "@/services/job-tracker/types";
import { TabBookmarklet } from "./components/tab-bookmarklet";
import { TabAiImport } from "./components/tab-ai-import";
import { TabManualEntry } from "./components/tab-manual-entry";

function NewJobTrackerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryTab = searchParams.get("tab") as "ai_import" | "manual" | "bookmarklet" | null;
  const queryStatus = searchParams.get("status") as JobApplicationStatus | null;
  const queryUrl = searchParams.get("url") || searchParams.get("jobUrl") || "";
  const queryCompany = searchParams.get("company") || "";
  const queryRole = searchParams.get("role") || searchParams.get("title") || "";

  const [activeTab, setActiveTab] = useState<"ai_import" | "manual" | "bookmarklet">(
    queryTab || (queryCompany || queryRole ? "manual" : "ai_import")
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Raw input for AI
  const [rawContent, setRawContent] = useState("");
  const [jobUrl, setJobUrl] = useState(queryUrl);

  // Form state
  const [formData, setFormData] = useState<NewJobApplication>({
    companyName: queryCompany,
    jobTitle: queryRole,
    platform: "linkedin",
    jobUrl: queryUrl,
    companyWebsite: "",
    location: "",
    workplaceType: "remote",
    jobType: "full_time",
    salaryMin: undefined,
    salaryMax: undefined,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    status: queryStatus || "wishlist",
    jobDescriptionRaw: "",
    requirements: [],
    notes: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    sortOrder: 0,
  });

  const [requirementsInput, setRequirementsInput] = useState("");

  const handleAiExtract = async () => {
    if (!rawContent.trim() && !jobUrl.trim()) {
      toast.error("Please provide either job description text or a URL.");
      return;
    }

    setIsExtracting(true);
    try {
      let promptPayload = rawContent;
      if (jobUrl && !rawContent.includes(jobUrl)) {
        promptPayload = `Job URL: ${jobUrl}\n\nJob Content:\n${rawContent}`;
      }

      const parsed = await jobTrackerService.aiParseJob(promptPayload);

      setFormData((prev) => ({
        ...prev,
        companyName: parsed.companyName || prev.companyName,
        jobTitle: parsed.jobTitle || prev.jobTitle,
        platform: parsed.platform || prev.platform,
        jobUrl: jobUrl || prev.jobUrl,
        companyWebsite: parsed.companyWebsite || prev.companyWebsite,
        location: parsed.location || prev.location,
        workplaceType: parsed.workplaceType || prev.workplaceType,
        jobType: parsed.jobType || prev.jobType,
        salaryMin: parsed.salaryMin ?? prev.salaryMin,
        salaryMax: parsed.salaryMax ?? prev.salaryMax,
        salaryCurrency: parsed.salaryCurrency || prev.salaryCurrency,
        salaryPeriod: parsed.salaryPeriod || prev.salaryPeriod,
        jobDescriptionRaw: parsed.jobDescriptionRaw || prev.jobDescriptionRaw,
        requirements: parsed.requirements || prev.requirements,
        contactName: parsed.contactName || prev.contactName,
        contactEmail: parsed.contactEmail || prev.contactEmail,
      }));

      setRequirementsInput((parsed.requirements || []).join("\n"));

      toast.success("Job details extracted successfully with Gemini AI! Review and complete below.");
      setActiveTab("manual");
    } catch (error: unknown) {
      console.error("AI extraction error:", error);
      toast.error(
        (error as Error).message ||
          "Failed to extract job details with AI. Please check your Gemini API key or fill manually."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async (openTailorAfterSave = false) => {
    if (!formData.companyName.trim() || !formData.jobTitle.trim()) {
      toast.error("Company name and Job title are required.");
      if (activeTab !== "manual") {
        setActiveTab("manual");
      }
      return;
    }

    setIsSaving(true);
    try {
      const reqs = requirementsInput
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const { id: newId, isDuplicate } = await jobTrackerService.create({
        ...formData,
        requirements: reqs.length > 0 ? reqs : formData.requirements,
      });

      if (isDuplicate) {
        toast.info("Aplikasi serupa sudah ada di tracker. Mengalihkan ke data yang sudah tersimpan...");
      } else {
        toast.success("Job application saved to tracker!");
      }

      if (openTailorAfterSave) {
        router.push(`/cms/job-tracker/${newId}?tab=tailor`);
      } else {
        router.push(`/cms/job-tracker/${newId}`);
      }
    } catch (error: unknown) {
      console.error("Save job error:", error);
      toast.error("Failed to save job application.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto text-slate-100 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-slate-400 hover:text-white hover:bg-[#131726] text-xs font-medium rounded-lg"
        >
          <Link href="/cms/job-tracker">
            <ArrowLeft className="h-4 w-4" /> Back to Job Tracker
          </Link>
        </Button>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] border border-white/[0.08] shadow-2xl">
        <div className="absolute top-0 right-0 w-[450px] h-[240px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[280px] h-[140px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <Briefcase size={13} className="text-primary" />
                <span>CAREER PIPELINE ORCHESTRATOR</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Gemini AI Engine Ready</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Add & Track{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-primary">
                Job Opportunity
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Import job postings instantly using Gemini AI extraction, or manually log new roles with structured classification, compensation benchmarks, and direct ATS tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/cms/job-tracker")}
              disabled={isSaving}
              className="text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="gap-1.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 text-xs"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Save Job</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Orchestrator */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "ai_import" | "manual" | "bookmarklet")}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full p-1.5 bg-[#0C0E18] border border-white/[0.08] rounded-2xl h-auto">
          <TabsTrigger
            value="ai_import"
            className="flex items-center justify-center gap-2 text-xs py-2.5 px-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-semibold transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Smart AI Importer</span>
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="flex items-center justify-center gap-2 text-xs py-2.5 px-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-semibold transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Job Form Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="bookmarklet"
            className="flex items-center justify-center gap-2 text-xs py-2.5 px-4 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-semibold transition-all"
          >
            <Bookmark className="w-4 h-4 text-purple-400" />
            <span>1-Click Bookmarklet</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SMART AI IMPORTER */}
        <TabsContent value="ai_import" className="space-y-6">
          <TabAiImport
            jobUrl={jobUrl}
            setJobUrl={setJobUrl}
            rawContent={rawContent}
            setRawContent={setRawContent}
            isExtracting={isExtracting}
            onExtract={handleAiExtract}
            onSkipToManual={() => setActiveTab("manual")}
          />
        </TabsContent>

        {/* TAB 2: MANUAL JOB FORM DETAILS */}
        <TabsContent value="manual" className="space-y-6">
          <TabManualEntry
            formData={formData}
            setFormData={setFormData}
            requirementsInput={requirementsInput}
            setRequirementsInput={setRequirementsInput}
            isSaving={isSaving}
            onSave={handleSave}
            onCancel={() => router.push("/cms/job-tracker")}
          />
        </TabsContent>

        {/* TAB 3: BROWSER BOOKMARKLET */}
        <TabsContent value="bookmarklet" className="space-y-6">
          <TabBookmarklet />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NewJobTrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-gray-400">Loading Job Opportunity Form...</p>
        </div>
      }
    >
      <NewJobTrackerForm />
    </Suspense>
  );
}
