"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import {
  jobOutreachService,
  jobTrackerService,
  type JobOutreachAttachment,
  type NewJobOutreach,
  type OutreachType,
} from "@/services";
import { OutreachTargetSidebar } from "./components/outreach-target-sidebar";
import { OutreachAiAssistant } from "./components/outreach-ai-assistant";
import { OutreachEmailComposer } from "./components/outreach-email-composer";

export default function NewOutreachPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const prefilledJobAppId = searchParams.get("jobAppId") || "none";

  const hasAutoFilledRef = useRef(false);

  const queryCompany = searchParams.get("company") || "";
  const queryRole = searchParams.get("role") || searchParams.get("title") || "";
  const querySubject = searchParams.get("subject") || "";
  const queryMessage = searchParams.get("message") || searchParams.get("body") || "";
  const queryContactName = searchParams.get("contactName") || searchParams.get("recipientName") || "";
  const queryContactEmail = searchParams.get("contactEmail") || searchParams.get("recipientEmail") || "";
  const queryType = (searchParams.get("type") as OutreachType) || (searchParams.get("purpose") === "follow_up" || searchParams.get("purpose") === "rejection_closure" ? "follow_up" : "cold_pitch");

  const [companyName, setCompanyName] = useState(queryCompany);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [jobTitle, setJobTitle] = useState(queryRole);
  const [contactName, setContactName] = useState(queryContactName);
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState(queryContactEmail);
  const [contactLinkedin, setContactLinkedin] = useState("");
  const [outreachType, setOutreachType] = useState<OutreachType>(queryType);
  const [selectedJobAppId, setSelectedJobAppId] = useState<string>(prefilledJobAppId);

  const [subject, setSubject] = useState(querySubject);
  const [body, setBody] = useState(queryMessage);
  const [notes, setNotes] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const [attachments, setAttachments] = useState<JobOutreachAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing job applications for dropdown
  const { data: jobApplications = [] } = useQuery({
    queryKey: ["jobApplicationsForOutreachNew"],
    queryFn: () => jobTrackerService.getAll(),
  });

  const selectedApp =
    selectedJobAppId !== "none"
      ? jobApplications.find((a) => a.id === selectedJobAppId)
      : undefined;

  // Pre-fill fields if linked to a job application
  useEffect(() => {
    if (
      !hasAutoFilledRef.current &&
      selectedJobAppId &&
      selectedJobAppId !== "none" &&
      jobApplications.length > 0
    ) {
      const app = jobApplications.find((a) => a.id === selectedJobAppId);
      if (app) {
        hasAutoFilledRef.current = true;
        const timer = setTimeout(() => {
          setCompanyName((prev) => prev || app.companyName);
          setJobTitle((prev) => prev || app.jobTitle);
          if (app.companyWebsite) setCompanyWebsite((prev) => prev || app.companyWebsite || "");
          if (app.contactName) setContactName((prev) => prev || app.contactName || "");
          if (app.contactEmail) setContactEmail((prev) => prev || app.contactEmail || "");
          setSubject((prev) => prev || `Application: ${app.jobTitle} - Wisman Nur`);
          if (app.coverLetter) {
            setBody((prev) => prev || app.coverLetter!);
          } else if (app.tailoredSummary) {
            setBody(
              (prev) =>
                prev ||
                `Dear ${app.contactName || "Hiring Team"},\n\nI am writing to express my strong interest in the ${app.jobTitle} position at ${app.companyName}.\n\n${app.tailoredSummary}\n\nLooking forward to discussing how my experience can deliver immediate impact for ${app.companyName}.\n\nBest regards,\nWisman Nur\nhttps://wismannur.pro`
            );
          }
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedJobAppId, jobApplications]);

  const handleSelectJobApp = (appId: string) => {
    setSelectedJobAppId(appId);
    if (appId !== "none") {
      const app = jobApplications.find((a) => a.id === appId);
      if (app) {
        setCompanyName(app.companyName);
        setJobTitle(app.jobTitle);
        if (app.companyWebsite) setCompanyWebsite(app.companyWebsite);
        if (app.contactName) setContactName(app.contactName);
        if (app.contactEmail) setContactEmail(app.contactEmail);
        if (!subject.trim()) {
          setSubject(`Application: ${app.jobTitle} - Wisman Nur`);
        }
        if (!body.trim()) {
          if (app.coverLetter) {
            setBody(app.coverLetter);
          } else if (app.tailoredSummary) {
            setBody(
              `Dear ${app.contactName || "Hiring Team"},\n\nI am writing to express my strong interest in the ${app.jobTitle} position at ${app.companyName}.\n\n${app.tailoredSummary}\n\nLooking forward to discussing how my experience can deliver immediate impact for ${app.companyName}.\n\nBest regards,\nWisman Nur\nhttps://wismannur.pro`
            );
          }
        }
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploaded = await jobOutreachService.uploadAttachment(formData);
      setAttachments((prev) => [...prev, uploaded]);
      toast.success(`File "${file.name}" uploaded successfully!`);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload attachment file.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleGenerateAi = async () => {
    if (!companyName.trim() || !jobTitle.trim()) {
      toast.error("Please fill in Company Name and Job Title first.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const matchedApp =
        selectedJobAppId !== "none"
          ? jobApplications.find((a) => a.id === selectedJobAppId)
          : undefined;

      const result = await jobOutreachService.generateAiDraft({
        type: outreachType,
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim(),
        contactName: contactName.trim() || "Hiring Team",
        contactRole: contactRole.trim() || undefined,
        companyWebsite: companyWebsite.trim() || undefined,
        jobDescriptionSnippet: matchedApp?.jobDescriptionRaw || undefined,
        customInstructions: customPrompt.trim() || undefined,
      });

      setSubject(result.subject);
      setBody(result.body);
      toast.success("AI email draft generated successfully!");
    } catch (err) {
      console.error("AI Generation Error:", err);
      toast.error("Failed to generate AI draft. Please try again.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (sendImmediately: boolean) => {
    if (!companyName.trim() || !jobTitle.trim() || !contactName.trim() || !contactEmail.trim()) {
      toast.error("Company Name, Job Title, Contact Name, and Contact Email are required.");
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast.error("Subject line and email body are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: NewJobOutreach = {
        jobApplicationId: selectedJobAppId !== "none" ? selectedJobAppId : undefined,
        companyName: companyName.trim(),
        companyWebsite: companyWebsite.trim() || undefined,
        jobTitle: jobTitle.trim(),
        contactName: contactName.trim(),
        contactRole: contactRole.trim() || undefined,
        contactEmail: contactEmail.trim().toLowerCase(),
        contactLinkedin: contactLinkedin.trim() || undefined,
        outreachType,
        status: sendImmediately ? "sent" : "draft",
        subject: subject.trim(),
        body: body.trim(),
        notes: notes.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const created = await jobOutreachService.create(payload, sendImmediately);

      toast.success(
        sendImmediately
          ? `Email successfully sent to ${contactEmail} via ${PUBLIC_SUPPORT_EMAIL}!`
          : "Outreach draft saved successfully."
      );

      queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
      queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });

      router.push(`/cms/job-outreaches/${created.id}`);
    } catch (err) {
      console.error("Submit outreach error:", err);
      toast.error("Failed to save or send outreach.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto text-slate-100">
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

      {/* Top Header Card */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-[#0C0E18] border border-white/[0.08] shadow-xl">
        <div className="absolute -top-10 right-10 h-40 w-80 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  New Job Outreach & Cold Pitch
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Send a personalized cold email or application via{" "}
                  <strong className="text-slate-200 font-mono">{PUBLIC_SUPPORT_EMAIL}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || isGeneratingAi}
              className="h-9 font-medium rounded-xl border-white/[0.08] bg-[#131726] hover:bg-[#1C2237] text-slate-300"
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || isGeneratingAi}
              className="h-9 gap-2 font-semibold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send Email via Resend
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target & Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <OutreachTargetSidebar
            selectedJobAppId={selectedJobAppId}
            onSelectJobApp={handleSelectJobApp}
            jobApplications={jobApplications}
            companyName={companyName}
            setCompanyName={setCompanyName}
            jobTitle={jobTitle}
            setJobTitle={setJobTitle}
            companyWebsite={companyWebsite}
            setCompanyWebsite={setCompanyWebsite}
            outreachType={outreachType}
            setOutreachType={setOutreachType}
            contactName={contactName}
            setContactName={setContactName}
            contactRole={contactRole}
            setContactRole={setContactRole}
            contactEmail={contactEmail}
            setContactEmail={setContactEmail}
            contactLinkedin={contactLinkedin}
            setContactLinkedin={setContactLinkedin}
            attachments={attachments}
            isUploading={isUploading}
            onFileUpload={handleFileUpload}
            onRemoveAttachment={handleRemoveAttachment}
          />
        </div>

        {/* Right Column: AI Assistant & Email Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <OutreachAiAssistant
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            isGeneratingAi={isGeneratingAi}
            onGenerateAi={handleGenerateAi}
          />

          <OutreachEmailComposer
            subject={subject}
            setSubject={setSubject}
            body={body}
            setBody={setBody}
            notes={notes}
            setNotes={setNotes}
            selectedApp={selectedApp}
            isSubmitting={isSubmitting}
            isGeneratingAi={isGeneratingAi}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
