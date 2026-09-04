"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  SendHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jobTrackerService, jobOutreachService } from "@/services";
import {
  JOB_PLATFORM_CONFIG,
  JOB_STATUS_CONFIG,
  WORKPLACE_CONFIG,
  formatSalary,
  getAtsScoreColor,
} from "@/lib/job-tracker";

import type {
  InterviewStatus,
  JobApplication,
  JobApplicationStatus,
  NewJobInterview,
} from "@/services/job-tracker/types";

import { TabCvTailoring } from "./components/tab-cv-tailoring";
import { TabInterviewPrep } from "./components/tab-interview-prep";
import { TabJobOverview } from "./components/tab-job-overview";
import { TabOfferingPackage } from "./components/tab-offering-package";
import { TabOutreachThread } from "./components/tab-outreach-thread";
import { PostMortemDialog, type PostMortemData } from "./components/post-mortem-dialog";

const STAGE_STEPPER: { status: JobApplicationStatus; label: string }[] = [
  { status: "wishlist", label: "Wishlist" },
  { status: "applied", label: "Applied" },
  { status: "screening", label: "Screening" },
  { status: "interview_hr", label: "HR Interview" },
  { status: "interview_tech", label: "Tech Interview" },
  { status: "interview_user", label: "Final Interview" },
  { status: "offering", label: "Offering" },
  { status: "accepted", label: "Accepted" },
];

export function JobApplicationDetail({ initialId }: { initialId: string }) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "tailor";

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzingATS, setIsAnalyzingATS] = useState(false);
  const [isParsingInvite, setIsParsingInvite] = useState(false);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState<string | null>(null);

  // Post-Mortem state
  const [isPostMortemOpen, setIsPostMortemOpen] = useState(false);
  const [pendingOutcomeStatus, setPendingOutcomeStatus] = useState<JobApplicationStatus | null>(
    null
  );

  const [formData, setFormData] = useState<Partial<JobApplication>>({});

  const {
    data: application,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["jobApplication", initialId],
    queryFn: () => jobTrackerService.getById(initialId),
  });

  const { data: linkedOutreaches = [] } = useQuery({
    queryKey: ["jobOutreachesForApp", initialId],
    queryFn: () => jobOutreachService.getAll({ jobApplicationId: initialId }),
    enabled: Boolean(initialId),
  });

  const currentApp = application ? { ...application, ...formData } : null;

  const handleCopyText = (text?: string, label = "Content") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleStatusAdvance = async (newStatus: JobApplicationStatus) => {
    if (!application) return;

    // If transitioning to rejected or ghosted, prompt post-mortem reflection dialog
    if (newStatus === "rejected" || newStatus === "ghosted") {
      setPendingOutcomeStatus(newStatus);
      setIsPostMortemOpen(true);
      return;
    }

    try {
      await jobTrackerService.updateStatus(application.id, newStatus);
      refetch();
      toast.success(`Status updated to ${JOB_STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleSavePostMortem = async (data: PostMortemData) => {
    if (!application) return;
    try {
      const targetStatus = pendingOutcomeStatus || application.status;
      const reflectionNote = `\n\n### 📝 Application Reflection (${new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}):\n- Final Stage: ${data.stageFailedAt}\n- Primary Factor: ${data.primaryReason}\n- Feedback: ${data.recruiterFeedback || "N/A"}\n- Lessons Learned: ${data.lessonsLearned || "N/A"}`;
      const updatedNotes =
        (application.notes ? application.notes.trim() + "\n" : "") + reflectionNote;

      await jobTrackerService.update(application.id, {
        status: targetStatus,
        notes: updatedNotes,
      });
      refetch();
      toast.success(
        `Post-mortem saved and status updated to ${JOB_STATUS_CONFIG[targetStatus].label}`
      );
    } catch (error) {
      console.error("Failed to save post-mortem:", error);
      toast.error("Failed to save post-mortem reflection");
    } finally {
      setPendingOutcomeStatus(null);
    }
  };

  const handleSaveOverview = async () => {
    if (!application) return;
    setIsSaving(true);
    try {
      await jobTrackerService.update(application.id, formData);
      setFormData({});
      refetch();
      toast.success("Job application updated successfully!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunATSAnalysis = async () => {
    if (!application) return;
    setIsAnalyzingATS(true);
    try {
      await jobTrackerService.aiAnalyzeResumeMatch(application.id);
      refetch();
      toast.success("Gemini AI analysis and CV tailoring complete!");
    } catch (error: unknown) {
      console.error("ATS analysis error:", error);
      toast.error((error as Error).message || "Failed to run AI resume analysis");
    } finally {
      setIsAnalyzingATS(false);
    }
  };

  const handleParseInviteSubmit = async (rawInviteText: string) => {
    if (!rawInviteText.trim() || !application) {
      toast.error("Please paste the invitation text first.");
      return;
    }

    setIsParsingInvite(true);
    try {
      const parsed = await jobTrackerService.aiParseInvitation(rawInviteText);

      const newIntId = await jobTrackerService.createInterview({
        applicationId: application.id,
        stageType: parsed.stageType,
        title: parsed.title,
        scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : new Date(),
        interviewers: parsed.interviewers,
        meetingLink: parsed.meetingLink,
        rawInvitation: rawInviteText,
        aiSummary: parsed.aiSummary,
        status: "scheduled",
      });

      refetch();
      toast.success("Interview invitation parsed and added!");
      handleGeneratePrep(newIntId);
    } catch (error: unknown) {
      console.error("Parse invitation error:", error);
      toast.error((error as Error).message || "Failed to parse interview invitation.");
    } finally {
      setIsParsingInvite(false);
    }
  };

  const handleCreateInterviewManual = async (form: NewJobInterview) => {
    if (!application || !form.title.trim()) {
      toast.error("Please provide an interview title.");
      return;
    }

    try {
      await jobTrackerService.createInterview({
        ...form,
        applicationId: application.id,
      });
      refetch();
      toast.success("Interview stage scheduled!");
    } catch (error) {
      console.error("Create interview error:", error);
      toast.error("Failed to add interview session.");
    }
  };

  const handleGeneratePrep = async (interviewId: string) => {
    setIsGeneratingPrep(interviewId);
    try {
      await jobTrackerService.aiGenerateInterviewPrep(interviewId);
      refetch();
      toast.success("AI interview questions and simulator generated!");
    } catch (error: unknown) {
      console.error("Prep error:", error);
      toast.error((error as Error).message || "Failed to generate interview preparation.");
    } finally {
      setIsGeneratingPrep(null);
    }
  };

  const handleUpdateInterviewStatus = async (interviewId: string, status: InterviewStatus) => {
    try {
      await jobTrackerService.updateInterview(interviewId, { status });
      refetch();
      toast.success("Interview status updated");
    } catch {
      toast.error("Failed to update interview status");
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    try {
      await jobTrackerService.deleteInterview(interviewId);
      refetch();
      toast.success("Interview session removed");
    } catch {
      toast.error("Failed to delete interview");
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">Loading job workspace...</span>
      </div>
    );
  }

  if (!application || !currentApp) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Job Application Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/cms/job-tracker">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Tracker
          </Link>
        </Button>
      </div>
    );
  }

  const platformCfg = JOB_PLATFORM_CONFIG[currentApp.platform] || JOB_PLATFORM_CONFIG.other;
  const atsColor = getAtsScoreColor(currentApp.atsScore);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-xl">
          <Link href="/cms/job-tracker">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Job Tracker</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {currentApp.jobUrl && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl border-white/[0.1] bg-white/[0.04] text-gray-300 hover:text-white">
              <a href={currentApp.jobUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Original Job Post</span>
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary font-extrabold text-2xl shrink-0 shadow-inner">
              {currentApp.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {currentApp.jobTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  <span>{currentApp.companyName}</span>
                </span>
                {currentApp.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{currentApp.location}</span>
                    </span>
                  </>
                )}
                <span>•</span>
                <Badge variant="outline" className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${platformCfg.color}`}>
                  {platformCfg.label}
                </Badge>
                <Badge variant="secondary" className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.05] text-gray-300 border border-white/[0.05]">
                  {WORKPLACE_CONFIG[currentApp.workplaceType]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Salary & ATS Badge */}
          <div className="flex flex-col md:items-end gap-2 shrink-0">
            <div className="text-lg font-bold text-emerald-400">
              {formatSalary(
                currentApp.salaryMin,
                currentApp.salaryMax,
                currentApp.salaryCurrency,
                currentApp.salaryPeriod
              )}
            </div>
            {currentApp.atsScore !== undefined && currentApp.atsScore !== null ? (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${atsColor.bgColor} ${atsColor.color} ${atsColor.borderColor}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ATS Match: {currentApp.atsScore}%</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10 rounded-xl"
                onClick={handleRunATSAnalysis}
                disabled={isAnalyzingATS}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzingATS ? "Analyzing..." : "Analyze ATS Match"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Lifecycle Pipeline Stepper */}
        <div className="pt-5 border-t border-white/[0.08] space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Application Pipeline Stage
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleStatusAdvance("rejected")}
                className={`h-7 text-[11px] font-semibold rounded-lg border-rose-500/30 text-rose-400 hover:bg-rose-500/10 ${
                  currentApp.status === "rejected"
                    ? "bg-rose-500/20 border-rose-500/60 ring-1 ring-rose-500/40 text-rose-300"
                    : "bg-transparent"
                }`}
              >
                ❌ Mark Rejected
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleStatusAdvance("ghosted")}
                className={`h-7 text-[11px] font-semibold rounded-lg border-orange-500/30 text-orange-400 hover:bg-orange-500/10 ${
                  currentApp.status === "ghosted"
                    ? "bg-orange-500/20 border-orange-500/60 ring-1 ring-orange-500/40 text-orange-300"
                    : "bg-transparent"
                }`}
              >
                👻 Mark Ghosted
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {STAGE_STEPPER.map((step) => {
              const isActive = currentApp.status === step.status;
              return (
                <button
                  key={step.status}
                  type="button"
                  onClick={() => handleStatusAdvance(step.status)}
                  className={`py-2 px-1.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 font-bold"
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-gray-400 hover:text-white"
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* Post-Mortem Alert Banner when status is rejected or ghosted */}
          {(currentApp.status === "rejected" || currentApp.status === "ghosted") && (
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <span>Application Marked as {JOB_STATUS_CONFIG[currentApp.status].label}</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Keep track of what went well, interviewer feedback, and improvement areas to refine your career strategy.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPostMortemOpen(true)}
                className="h-8 text-xs font-bold rounded-xl shrink-0 border-rose-500/40 hover:bg-rose-500/20 text-rose-300"
              >
                📝 View / Edit Reflection
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full md:w-auto h-auto sm:h-12 p-1 bg-[#0C0E18] border border-white/[0.08] rounded-2xl gap-1">
          <TabsTrigger
            value="tailor"
            className="flex items-center gap-2 text-xs md:text-sm py-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI CV Tailor & ATS</span>
          </TabsTrigger>
          <TabsTrigger
            value="outreach"
            className="flex items-center gap-2 text-xs md:text-sm py-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all"
          >
            <SendHorizontal className="w-4 h-4 text-sky-400" />
            <span>Outreach & Emails</span>
            {linkedOutreaches.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] h-4 px-1.5 ml-0.5 bg-sky-500/20 text-sky-300 font-mono"
              >
                {linkedOutreaches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="interview"
            className="flex items-center gap-2 text-xs md:text-sm py-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Interview Copilot</span>
            {(currentApp.interviews?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5 bg-purple-500/20 text-purple-300 font-mono">
                {currentApp.interviews?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 text-xs md:text-sm py-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Job Overview & JD</span>
          </TabsTrigger>
          <TabsTrigger
            value="offering"
            className="flex items-center gap-2 text-xs md:text-sm py-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Offering & Package</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AI RESUME TAILOR & ATS MATCHER */}
        <TabsContent value="tailor" className="space-y-6">
          <TabCvTailoring
            application={currentApp}
            isAnalyzingATS={isAnalyzingATS}
            onRunATSAnalysis={handleRunATSAnalysis}
            onCopyText={handleCopyText}
          />
        </TabsContent>

        {/* TAB 2: OUTREACH & EMAILS */}
        <TabsContent value="outreach" className="space-y-6">
          <TabOutreachThread application={currentApp} linkedOutreaches={linkedOutreaches} />
        </TabsContent>

        {/* TAB 3: INTERVIEW COPILOT & SIMULATOR */}
        <TabsContent value="interview" className="space-y-6">
          <TabInterviewPrep
            application={currentApp}
            isGeneratingPrep={isGeneratingPrep}
            isParsingInvite={isParsingInvite}
            onGeneratePrep={handleGeneratePrep}
            onParseInviteSubmit={handleParseInviteSubmit}
            onCreateInterviewManual={handleCreateInterviewManual}
            onUpdateInterviewStatus={handleUpdateInterviewStatus}
            onDeleteInterview={handleDeleteInterview}
            onCopyText={handleCopyText}
          />
        </TabsContent>

        {/* TAB 4: OVERVIEW & JOB DESCRIPTION */}
        <TabsContent value="overview" className="space-y-6">
          <TabJobOverview
            application={currentApp}
            formData={formData}
            isSaving={isSaving}
            onFormChange={setFormData}
            onSave={handleSaveOverview}
          />
        </TabsContent>

        {/* TAB 5: OFFERING & NEGOTIATION */}
        <TabsContent value="offering" className="space-y-6">
          <TabOfferingPackage
            application={currentApp}
            formData={formData}
            isSaving={isSaving}
            onFormChange={setFormData}
            onSave={handleSaveOverview}
            onStatusAdvance={handleStatusAdvance}
          />
        </TabsContent>
      </Tabs>

      {/* Post-Mortem Reflection Dialog */}
      <PostMortemDialog
        isOpen={isPostMortemOpen}
        companyName={currentApp.companyName}
        jobTitle={currentApp.jobTitle}
        onClose={() => {
          setIsPostMortemOpen(false);
          setPendingOutcomeStatus(null);
        }}
        onSave={handleSavePostMortem}
      />
    </div>
  );
}
