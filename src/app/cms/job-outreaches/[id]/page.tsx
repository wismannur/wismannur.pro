"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { jobOutreachService, jobTrackerService, type OutreachStatus } from "@/services";
import {
  OutreachDetailHeader,
  STATUS_CONFIG,
} from "./components/outreach-detail-header";
import { OutreachThreadCard } from "./components/outreach-thread-card";
import { OutreachDetailSidebar } from "./components/outreach-detail-sidebar";

export default function JobOutreachDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const outreachId = params.id;

  const [followUpMessage, setFollowUpMessage] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isGeneratingAiFollowUp, setIsGeneratingAiFollowUp] = useState(false);
  const [isSendingDraft, setIsSendingDraft] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedExistingAppId, setSelectedExistingAppId] = useState<string>("");
  const [isLinkingApp, setIsLinkingApp] = useState(false);
  const [isUnlinkingApp, setIsUnlinkingApp] = useState(false);

  // Fetch existing job applications to allow linking
  const { data: jobApplications = [] } = useQuery({
    queryKey: ["jobApplicationsForOutreachDetail"],
    queryFn: () => jobTrackerService.getAll(),
  });

  const {
    data: outreach,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["jobOutreachDetail", outreachId],
    queryFn: async () => {
      const res = await jobOutreachService.getById(outreachId);
      if (!res) throw new Error("Outreach not found");
      return res;
    },
    enabled: Boolean(outreachId),
  });

  const handleSaveNotes = async (notes: string) => {
    if (!outreach) return;
    try {
      await jobOutreachService.update(outreach.id, { notes: notes.trim() });
      toast.success("Catatan internal berhasil disimpan!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobOutreachDetail", outreachId] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
    } catch (err) {
      console.error("Save notes error:", err);
      toast.error("Gagal menyimpan catatan internal.");
    }
  };

  const handleSendDraft = async () => {
    if (!outreach) return;
    setIsSendingDraft(true);
    try {
      await jobOutreachService.sendEmail(outreach.id);
      toast.success(
        `Email successfully sent to ${outreach.contactEmail} via ${PUBLIC_SUPPORT_EMAIL}!`
      );
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
    } catch (err) {
      console.error("Send draft error:", err);
      toast.error("Failed to send draft email.");
    } finally {
      setIsSendingDraft(false);
    }
  };

  const handleStatusChange = async (newStatus: OutreachStatus) => {
    if (!outreach) return;
    try {
      await jobOutreachService.update(outreach.id, { status: newStatus });
      toast.success(`Status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      queryClient.invalidateQueries({ queryKey: ["jobOutreachDetail", outreachId] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update status.");
    }
  };

  const handleGenerateAiFollowUp = async () => {
    if (!outreach) return;
    setIsGeneratingAiFollowUp(true);
    try {
      const res = await jobOutreachService.generateAiDraft({
        type: "follow_up",
        companyName: outreach.companyName,
        jobTitle: outreach.jobTitle,
        contactName: outreach.contactName,
        contactRole: outreach.contactRole,
        customInstructions: `This is a follow up email. Previous message: "${outreach.body.slice(0, 300)}..."`,
      });

      setFollowUpMessage(res.body);
      toast.success("AI follow-up draft generated successfully!");
    } catch (err) {
      console.error("AI Follow-up error:", err);
      toast.error("Failed to generate AI follow-up.");
    } finally {
      setIsGeneratingAiFollowUp(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!outreach || !followUpMessage.trim()) return;
    setIsSendingFollowUp(true);
    try {
      await jobOutreachService.sendFollowUp(outreach.id, followUpMessage.trim());
      toast.success(`Follow-up successfully sent to ${outreach.contactEmail}!`);
      setFollowUpMessage("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
    } catch (err) {
      console.error("Send follow-up error:", err);
      toast.error("Failed to send follow-up email.");
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const handleConvertToJobTracker = async () => {
    if (!outreach) return;
    setIsConverting(true);
    try {
      const result = await jobOutreachService.convertToJobApplication(outreach.id);
      toast.success("Successfully connected to Job Tracker!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobTrackerApplications"] });
      router.push(`/cms/job-tracker/${result.applicationId}`);
    } catch (err) {
      console.error("Convert to job tracker error:", err);
      toast.error("Failed to convert to Job Tracker.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleLinkExistingApp = async () => {
    if (!outreach || !selectedExistingAppId) return;
    setIsLinkingApp(true);
    try {
      await jobOutreachService.convertToJobApplication(outreach.id, selectedExistingAppId);
      toast.success("Successfully linked outreach to existing Job Application!");
      setSelectedExistingAppId("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachDetail", outreachId] });
      queryClient.invalidateQueries({ queryKey: ["jobTrackerApplications"] });
    } catch (err) {
      console.error("Link application error:", err);
      toast.error("Failed to link application.");
    } finally {
      setIsLinkingApp(false);
    }
  };

  const handleUnlinkApp = async () => {
    if (!outreach) return;
    setIsUnlinkingApp(true);
    try {
      await jobOutreachService.update(outreach.id, { jobApplicationId: null });
      toast.success("Outreach unlinked from Job Application.");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachDetail", outreachId] });
      queryClient.invalidateQueries({ queryKey: ["jobTrackerApplications"] });
    } catch (err) {
      console.error("Unlink application error:", err);
      toast.error("Failed to unlink application.");
    } finally {
      setIsUnlinkingApp(false);
    }
  };

  const handleDelete = async () => {
    if (!outreach) return;
    await jobOutreachService.delete(outreach.id);
    toast.success("Outreach successfully deleted.");
    queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
    queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
    router.push("/cms/job-outreaches");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!outreach) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Outreach Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/cms/job-outreaches">Back to Outreach List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14 text-slate-100 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-slate-400 hover:text-white hover:bg-[#131726] text-xs font-medium rounded-lg"
        >
          <Link href="/cms/job-outreaches">
            <ArrowLeft className="h-4 w-4" /> Back to Job Outreaches
          </Link>
        </Button>
      </div>

      {/* Top Action Bar / Workspace Header */}
      <OutreachDetailHeader
        outreach={outreach}
        onStatusChange={handleStatusChange}
        onConvertToJobTracker={handleConvertToJobTracker}
        isConverting={isConverting}
        onDelete={handleDelete}
      />

      {/* Main Grid: Thread on Left (2 cols), Details on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Email Thread Messages */}
        <div className="lg:col-span-2 space-y-6">
          <OutreachThreadCard
            outreach={outreach}
            followUpMessage={followUpMessage}
            setFollowUpMessage={setFollowUpMessage}
            isSendingFollowUp={isSendingFollowUp}
            isGeneratingAiFollowUp={isGeneratingAiFollowUp}
            isSendingDraft={isSendingDraft}
            onSendDraft={handleSendDraft}
            onGenerateAiFollowUp={handleGenerateAiFollowUp}
            onSendFollowUp={handleSendFollowUp}
          />
        </div>

        {/* Right Column: Contact & Job Tracker Info */}
        <div className="space-y-6">
          <OutreachDetailSidebar
            outreach={outreach}
            jobApplications={jobApplications}
            selectedExistingAppId={selectedExistingAppId}
            setSelectedExistingAppId={setSelectedExistingAppId}
            isLinkingApp={isLinkingApp}
            onLinkExistingApp={handleLinkExistingApp}
            isUnlinkingApp={isUnlinkingApp}
            onUnlinkApp={handleUnlinkApp}
            isConverting={isConverting}
            onConvertToJobTracker={handleConvertToJobTracker}
            onSaveNotes={handleSaveNotes}
          />
        </div>
      </div>
    </div>
  );
}
