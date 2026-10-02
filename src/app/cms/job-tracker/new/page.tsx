"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Briefcase,
  Building2,
  Check,
  Coins,
  Copy,
  FileText,
  Globe,
  GripHorizontal,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Maximize2,
  Minimize2,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { JobDescriptionMarkdownEditor } from "../components/job-description-markdown-editor";
import { jobTrackerService } from "@/services";
import type {
  JobApplicationStatus,
  JobEmploymentType,
  JobPlatform,
  NewJobApplication,
  WorkplaceType,
} from "@/services/job-tracker/types";

const BOOKMARKLET_CODE = `javascript:(function(){const t=document.title||'',u=window.location.href,s=window.getSelection().toString().trim(),c=s||document.body.innerText.slice(0,15000);const p=JSON.stringify({url:u,title:t,content:c});navigator.clipboard.writeText(p).then(()=>{alert('✅ Job extracted to clipboard!\\n\\nOpen Career Hub and paste into Smart AI Importer.')}).catch(()=>{prompt('Copy this job data for Career Hub:',p)})})();`;

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
    jobDescriptionRaw: "",
    requirements: [],
    status: queryStatus || "wishlist",
    sortOrder: 0,
    notes: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [requirementsInput, setRequirementsInput] = useState("");

  // Resize states & handlers for Key Requirements textarea
  const [requirementsHeight, setRequirementsHeight] = useState<number>(100);
  const isDraggingReqsRef = useRef(false);
  const dragStartYReqsRef = useRef(0);
  const startHeightReqsRef = useRef(100);

  const handleMouseDownReqsResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingReqsRef.current = true;
    dragStartYReqsRef.current = e.clientY;
    startHeightReqsRef.current = requirementsHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingReqsRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYReqsRef.current;
      const maxHeight = Math.max(500, Math.floor(window.innerHeight * 0.7));
      const newHeight = Math.min(Math.max(startHeightReqsRef.current + deltaY, 60), maxHeight);
      setRequirementsHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingReqsRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartReqsResize = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingReqsRef.current = true;
    dragStartYReqsRef.current = touch.clientY;
    startHeightReqsRef.current = requirementsHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingReqsRef.current) return;
      const currentTouch = moveEvent.touches[0];
      if (!currentTouch) return;
      const deltaY = currentTouch.clientY - dragStartYReqsRef.current;
      const maxHeight = Math.max(500, Math.floor(window.innerHeight * 0.7));
      const newHeight = Math.min(Math.max(startHeightReqsRef.current + deltaY, 60), maxHeight);
      setRequirementsHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingReqsRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Resize states & handlers for Personal Strategic Notes textarea
  const [notesHeight, setNotesHeight] = useState<number>(84);
  const isDraggingNotesRef = useRef(false);
  const dragStartYNotesRef = useRef(0);
  const startHeightNotesRef = useRef(84);

  const handleMouseDownNotesResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingNotesRef.current = true;
    dragStartYNotesRef.current = e.clientY;
    startHeightNotesRef.current = notesHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingNotesRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYNotesRef.current;
      const maxHeight = Math.max(500, Math.floor(window.innerHeight * 0.7));
      const newHeight = Math.min(Math.max(startHeightNotesRef.current + deltaY, 60), maxHeight);
      setNotesHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingNotesRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartNotesResize = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingNotesRef.current = true;
    dragStartYNotesRef.current = touch.clientY;
    startHeightNotesRef.current = notesHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingNotesRef.current) return;
      const currentTouch = moveEvent.touches[0];
      if (!currentTouch) return;
      const deltaY = currentTouch.clientY - dragStartYNotesRef.current;
      const maxHeight = Math.max(500, Math.floor(window.innerHeight * 0.7));
      const newHeight = Math.min(Math.max(startHeightNotesRef.current + deltaY, 60), maxHeight);
      setNotesHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingNotesRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  const handleAiExtract = async () => {
    const contentToAnalyze = rawContent.trim() || jobUrl.trim();
    if (!contentToAnalyze) {
      toast.error("Please paste the job description text or job posting URL first.");
      return;
    }

    setIsExtracting(true);
    try {
      const promptPayload = jobUrl.trim()
        ? `Job Posting URL: ${jobUrl}\n\nContent:\n${rawContent}`
        : rawContent;

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

      const newId = await jobTrackerService.create({
        ...formData,
        requirements: reqs.length > 0 ? reqs : formData.requirements,
      });

      toast.success("Job application saved to tracker!");

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
          <Card className="bg-[#0C0E18] border-white/[0.08] text-white shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary shadow-inner">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-white">
                    Gemini AI Quick Extractor
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400 mt-0.5">
                    Paste the job vacancy content or target URL. Gemini AI will auto-extract company details, tech stack, salary range, and workplace settings.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2 text-gray-300 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-primary text-xs">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>How it works:</span>
                </div>
                <p>
                  Copy & paste any job post from LinkedIn, Jobstreet, Glints, Tech in Asia, Ashby, Greenhouse, or corporate career sites. You can also paste the URL directly. Once extracted, all fields in the Form tab will be automatically populated for your review.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobUrl" className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                  <span>Job Posting URL (Optional)</span>
                </Label>
                <Input
                  id="jobUrl"
                  placeholder="https://www.linkedin.com/jobs/view/... or https://boards.greenhouse.io/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="bg-[#131726] border-white/[0.08] text-xs h-11 rounded-xl text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rawContent" className="text-xs font-semibold text-gray-300">
                  Job Description Text / Vacancy Content
                </Label>
                <Textarea
                  id="rawContent"
                  placeholder="Paste the full job description text, requirements, responsibilities, and company details here (or paste bookmarklet output)..."
                  rows={10}
                  value={rawContent}
                  onChange={(e) => {
                    const text = e.target.value;
                    setRawContent(text);
                    if (
                      text.trim().startsWith("{") &&
                      text.includes('"url"') &&
                      text.includes('"content"')
                    ) {
                      try {
                        const parsed = JSON.parse(text);
                        if (parsed.url && !jobUrl) setJobUrl(parsed.url);
                        if (parsed.content) {
                          setRawContent(parsed.content);
                          toast.success("Bookmarklet JSON detected! Autofilled URL and content.");
                        }
                      } catch {
                        // Keep original text if parse fails
                      }
                    }
                  }}
                  className="resize-none text-xs font-mono bg-[#131726] border-white/[0.08] text-gray-200 rounded-xl custom-scrollbar"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("manual")}
                  className="w-full sm:w-auto text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
                >
                  Skip AI & Fill Form Manually
                </Button>

                <Button
                  type="button"
                  onClick={handleAiExtract}
                  disabled={isExtracting || (!rawContent.trim() && !jobUrl.trim())}
                  className="w-full sm:w-auto gap-2 text-xs rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 h-10 px-5"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Extract & Autofill</span>
                      <ArrowRight className="w-4 h-4 ml-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: MANUAL JOB FORM DETAILS */}
        <TabsContent value="manual" className="space-y-6">
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
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
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
                    onValueChange={(v) => setFormData({ ...formData, platform: v as JobPlatform })}
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
                      setFormData({ ...formData, workplaceType: v as WorkplaceType })
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
                      setFormData({ ...formData, jobType: v as JobEmploymentType })
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
                      setFormData({ ...formData, status: v as JobApplicationStatus })
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
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                      setFormData({
                        ...formData,
                        salaryMin: e.target.value ? parseInt(e.target.value) : undefined,
                      })
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
                      setFormData({
                        ...formData,
                        salaryMax: e.target.value ? parseInt(e.target.value) : undefined,
                      })
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
                    onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
                    className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryPeriod" className="text-xs text-gray-300 font-semibold">
                    Period
                  </Label>
                  <Select
                    value={formData.salaryPeriod}
                    onValueChange={(v) => setFormData({ ...formData, salaryPeriod: v })}
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
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
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
                        setRequirementsHeight((prev) => (prev > 140 ? 100 : 220));
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
                  {/* Bottom Drag Handle Bar to Resize Inside Field */}
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
                        setNotesHeight((prev) => (prev > 130 ? 84 : 200));
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
                  {/* Bottom Drag Handle Bar to Resize Inside Field */}
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
              onClick={() => router.push("/cms/job-tracker")}
              disabled={isSaving}
              className="w-full sm:w-auto text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
            >
              Cancel
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="w-full sm:w-auto gap-1.5 rounded-xl border-white/[0.08] bg-white/[0.08] text-white hover:bg-white/[0.12] font-semibold text-xs h-10 px-5"
              >
                <span>Save & Open AI Tailor</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </Button>

              <Button
                type="button"
                onClick={() => handleSave(false)}
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
        </TabsContent>

        {/* TAB 3: BROWSER BOOKMARKLET */}
        <TabsContent value="bookmarklet" className="space-y-6">
          <Card className="bg-[#0C0E18] border-white/[0.08] text-white shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 shadow-inner">
                  <Bookmark className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-white">
                    1-Click Job Scraping Bookmarklet
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400 mt-0.5">
                    Extract job postings directly from your browser with a single click and import into Career Hub.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-2xl border border-purple-500/25 bg-purple-500/5 space-y-1.5 text-xs">
                <div className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-purple-400" />
                  <span>How to install:</span>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  Drag the button below directly into your browser’s Bookmarks Bar. When browsing any job vacancy on
                  LinkedIn, Jobstreet, Glints, Greenhouse, Ashby, or Lever, click the bookmark to copy the
                  vacancy text and URL to your clipboard in 1 click!
                </p>
              </div>

              <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#131726] flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                <div className="text-xs text-gray-400 font-semibold">
                  👇 Drag this button to your Bookmarks Bar (Ctrl/Cmd + Shift + B)
                </div>

                <a
                  href={BOOKMARKLET_CODE}
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Drag this button up to your browser's Bookmarks Bar to install!");
                  }}
                  className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-grab select-none active:scale-95 transition-all"
                  title="Drag me to your Bookmarks Bar"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>📌 Import to Career Hub</span>
                </a>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(BOOKMARKLET_CODE);
                      toast.success("Bookmarklet JavaScript code copied to clipboard!");
                    }}
                    className="gap-1.5 text-xs h-9 rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Bookmarklet JavaScript Code</span>
                  </Button>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#090A10] space-y-3 text-xs">
                <div className="font-bold text-white text-sm">💡 Full Workflow Steps:</div>
                <ol className="list-decimal list-inside space-y-2 text-gray-400">
                  <li>
                    Open any job posting on{" "}
                    <strong className="text-gray-200">LinkedIn, Jobstreet, Glints, Indeed, Ashby, or Greenhouse</strong>.
                  </li>
                  <li>
                    Click the <strong className="text-purple-300">📌 Import to Career Hub</strong> bookmark in your browser bar.
                  </li>
                  <li>
                    The bookmark will capture the page URL, title, and selected/full job description directly to your clipboard.
                  </li>
                  <li>
                    Come back to this page, switch to the <strong className="text-primary">Smart AI Importer</strong> tab, paste into the text area, and click{" "}
                    <strong className="text-primary">Extract & Autofill</strong>.
                  </li>
                  <li>
                    Review the extracted role, benchmark salary, and requirements, then click <strong className="text-white">Save Opportunity</strong>!
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
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
