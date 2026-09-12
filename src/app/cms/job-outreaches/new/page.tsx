"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  FileText,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  Maximize2,
  Minimize2,
  Paperclip,
  Send,
  Sparkles,
  StickyNote,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { toCustomAttachmentUrl } from "@/lib/attachment-url";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  jobOutreachService,
  jobTrackerService,
  type JobOutreachAttachment,
  type NewJobOutreach,
  type OutreachType,
} from "@/services";

export default function NewOutreachPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const prefilledJobAppId = searchParams.get("jobAppId") || "none";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoFilledRef = useRef(false);

  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactLinkedin, setContactLinkedin] = useState("");
  const [outreachType, setOutreachType] = useState<OutreachType>("cold_pitch");
  const [selectedJobAppId, setSelectedJobAppId] = useState<string>(prefilledJobAppId);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const [attachments, setAttachments] = useState<JobOutreachAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resize states & handlers for AI Cold Email Assistant textarea
  const [aiPromptHeight, setAiPromptHeight] = useState<number>(76);
  const isDraggingAiRef = useRef(false);
  const dragStartYAiRef = useRef(0);
  const startHeightAiRef = useRef(76);

  const handleMouseDownAiResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingAiRef.current = true;
    dragStartYAiRef.current = e.clientY;
    startHeightAiRef.current = aiPromptHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingAiRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYAiRef.current;
      const maxHeight = Math.max(480, Math.floor(window.innerHeight * 0.6));
      const newHeight = Math.min(Math.max(startHeightAiRef.current + deltaY, 64), maxHeight);
      setAiPromptHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingAiRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartAiResize = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingAiRef.current = true;
    dragStartYAiRef.current = touch.clientY;
    startHeightAiRef.current = aiPromptHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingAiRef.current) return;
      const currentTouch = moveEvent.touches[0];
      if (!currentTouch) return;
      const deltaY = currentTouch.clientY - dragStartYAiRef.current;
      const maxHeight = Math.max(480, Math.floor(window.innerHeight * 0.6));
      const newHeight = Math.min(Math.max(startHeightAiRef.current + deltaY, 64), maxHeight);
      setAiPromptHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingAiRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Resize states & handlers for Email Body textarea
  const [bodyHeight, setBodyHeight] = useState<number>(320);
  const isDraggingBodyRef = useRef(false);
  const dragStartYBodyRef = useRef(0);
  const startHeightBodyRef = useRef(320);

  const handleMouseDownBodyResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingBodyRef.current = true;
    dragStartYBodyRef.current = e.clientY;
    startHeightBodyRef.current = bodyHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingBodyRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYBodyRef.current;
      const maxHeight = Math.max(1200, Math.floor(window.innerHeight * 1.5));
      const newHeight = Math.min(Math.max(startHeightBodyRef.current + deltaY, 160), maxHeight);
      setBodyHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingBodyRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartBodyResize = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingBodyRef.current = true;
    dragStartYBodyRef.current = touch.clientY;
    startHeightBodyRef.current = bodyHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingBodyRef.current) return;
      const currentTouch = moveEvent.touches[0];
      if (!currentTouch) return;
      const deltaY = currentTouch.clientY - dragStartYBodyRef.current;
      const maxHeight = Math.max(1200, Math.floor(window.innerHeight * 1.5));
      const newHeight = Math.min(Math.max(startHeightBodyRef.current + deltaY, 160), maxHeight);
      setBodyHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingBodyRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Resize states & handlers for Private Internal Notes textarea
  const [notesHeight, setNotesHeight] = useState<number>(84);
  const isDraggingNotesRef = useRef(false);
  const dragStartYNotesRef = useRef(0);
  const startHeightNotesRef = useRef(84);

  const handleMouseDownNotesResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingNotesRef.current = true;
    dragStartYNotesRef.current = e.clientY;
    startHeightNotesRef.current = notesHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingNotesRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYNotesRef.current;
      const maxHeight = Math.max(500, Math.floor(window.innerHeight * 0.7));
      const newHeight = Math.min(Math.max(startHeightNotesRef.current + deltaY, 60), maxHeight);
      setNotesHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingNotesRef.current = false;
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

  // Fetch existing job applications for dropdown
  const { data: jobApplications = [] } = useQuery({
    queryKey: ["jobApplicationsForOutreachNew"],
    queryFn: () => jobTrackerService.getAll(),
  });

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
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      const selectedApp =
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
        jobDescriptionSnippet: selectedApp?.jobDescriptionRaw || undefined,
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
          {/* Link to Job Tracker Card */}
          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Briefcase className="h-4 w-4 text-indigo-400" />
                Link to Job Tracker
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Select an application tracked in Job Tracker to auto-fill information.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <Select value={selectedJobAppId} onValueChange={handleSelectJobApp}>
                <SelectTrigger className="w-full bg-[#131726] border-white/[0.08] text-slate-200 text-xs h-9">
                  <SelectValue placeholder="Select application..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
                  <SelectItem value="none">-- Standalone Outreach --</SelectItem>
                  {jobApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.companyName} - {app.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Company & Role Details Card */}
          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Building2 className="h-4 w-4 text-indigo-400" />
                Target Company & Role
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs font-semibold text-slate-300">
                  Company Name *
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="companyName"
                    placeholder="e.g. Tokopedia / Google / Stripe"
                    className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="jobTitle" className="text-xs font-semibold text-slate-300">
                  Job Title / Target Role *
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Senior Frontend Engineer"
                    className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyWebsite" className="text-xs text-slate-400">
                  Company Website (Optional)
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="companyWebsite"
                    placeholder="https://company.com"
                    className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Outreach Type</Label>
                <Select
                  value={outreachType}
                  onValueChange={(val) => setOutreachType(val as OutreachType)}
                >
                  <SelectTrigger className="bg-[#131726] border-white/[0.08] text-slate-200 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-slate-200">
                    <SelectItem value="cold_pitch">
                      🚀 Cold Pitch to Hiring Manager / Lead
                    </SelectItem>
                    <SelectItem value="direct_apply">📄 Direct Application via Email</SelectItem>
                    <SelectItem value="follow_up">🔄 Follow-up Cadence (Re-engagement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Recruiter Contact Card */}
          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <User className="h-4 w-4 text-indigo-400" />
                Target Recruiter / Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="contactName" className="text-xs font-semibold text-slate-300">
                    Contact Name *
                  </Label>
                  <Input
                    id="contactName"
                    placeholder="e.g. Sarah Jenkins"
                    className="text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contactRole" className="text-xs text-slate-400">
                    Role / Position (Optional)
                  </Label>
                  <Input
                    id="contactRole"
                    placeholder="e.g. Head of Engineering"
                    className="text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs font-semibold text-slate-300">
                  Recipient Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="recruiter@company.com"
                    className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactLinkedin" className="text-xs text-slate-400">
                  LinkedIn Profile URL (Optional)
                </Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="contactLinkedin"
                    placeholder="https://linkedin.com/in/..."
                    className="pl-9 text-xs h-9 bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                    value={contactLinkedin}
                    onChange={(e) => setContactLinkedin(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Attachments Card */}
          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                  <Paperclip className="h-4 w-4 text-indigo-400" />
                  Attachments (CV / Portfolio)
                </CardTitle>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#131726] border border-white/[0.08] text-indigo-300">
                  {attachments.length} Attached
                </span>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Upload PDF CV, Portfolio, or supporting documents to automatically attach and send
                via Resend.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Hidden input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.doc,.zip,.png,.jpg"
                className="hidden"
              />

              {/* Upload Button Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed border-white/[0.1] hover:border-indigo-500/50 rounded-xl p-4 text-center cursor-pointer transition-all bg-[#131726]/50 hover:bg-[#131726] flex flex-col items-center justify-center gap-2 group",
                  isUploading && "pointer-events-none opacity-60"
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                    <span className="text-xs font-medium text-slate-300">
                      Uploading document...
                    </span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200">
                        Click to Upload File (PDF, DOCX, ZIP)
                      </div>
                      <div className="text-[11px] text-slate-400">Maximum 10MB per file</div>
                    </div>
                  </>
                )}
              </div>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-1">
                  {attachments.map((att, idx) => {
                    const brandedUrl = toCustomAttachmentUrl(att.url);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.08] bg-[#131726] text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                          <a
                            href={brandedUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={brandedUrl}
                            className="font-medium text-slate-200 hover:text-indigo-300 hover:underline truncate"
                          >
                            {att.name}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
                          onClick={() => handleRemoveAttachment(idx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Assistant & Email Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Assistant Banner */}
          <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[#0C0E18] to-[#131726] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-5 space-y-3 relative z-10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                    <Sparkles className="size-4 lg:size-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sm text-white block">
                      AI Cold Email Assistant (Gemini)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tailors subject & body grounded in your tech stack & target role
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (aiPromptHeight > 100) {
                        setAiPromptHeight(76);
                      } else {
                        setAiPromptHeight(180);
                      }
                    }}
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    title={aiPromptHeight > 100 ? "Perkecil area instruksi AI" : "Perbesar area instruksi AI"}
                  >
                    {aiPromptHeight > 100 ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi}
                    className="gap-2 font-semibold h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md border border-indigo-400/30 shrink-0"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Auto-Draft with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative flex flex-col">
                <Textarea
                  style={{ height: `${aiPromptHeight}px` }}
                  placeholder="Optional custom instructions (e.g. 'Emphasize 8+ yrs React/Next.js experience, lead architecture for high-traffic apps, mention why I admire their product')..."
                  className="bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 text-xs leading-relaxed resize-none focus-visible:ring-indigo-500/30"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                {/* Bottom Drag Handle Bar to Resize Downwards */}
                <div
                  onMouseDown={handleMouseDownAiResize}
                  onTouchStart={handleTouchStartAiResize}
                  className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none mt-1 z-10"
                  title="Drag down to resize AI guidance"
                >
                  <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-16 transition-all duration-200" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Composer Card */}
          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                  <Mail className="h-4 w-4 text-indigo-400" />
                  Email Composer
                </CardTitle>
                <span className="text-[11px] text-slate-400 font-mono px-2.5 py-0.5 rounded-full bg-[#131726] border border-white/[0.06]">
                  From:{" "}
                  <span className="text-indigo-300 font-semibold">
                    Wisman Nur &lt;{PUBLIC_SUPPORT_EMAIL}&gt;
                  </span>
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-semibold text-slate-300">
                  Subject Line *
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g. Application: Senior Frontend Engineer - Wisman Nur"
                  className="font-medium text-sm bg-[#131726] border-white/[0.08] text-white placeholder:text-slate-400 focus-visible:ring-indigo-500/30"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body" className="text-xs font-semibold text-slate-300">
                    Email Body *
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      {body.length} karakter
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (bodyHeight > 350) {
                          setBodyHeight(320);
                        } else {
                          setBodyHeight(560);
                        }
                      }}
                      className="h-6 w-6 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06]"
                      title={bodyHeight > 350 ? "Perkecil area email body" : "Perbesar area email body"}
                    >
                      {bodyHeight > 350 ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="relative flex flex-col">
                  <Textarea
                    id="body"
                    style={{ height: `${bodyHeight}px` }}
                    placeholder="Write your message here or click 'Auto-Draft with AI' above..."
                    className="font-sans text-sm leading-relaxed bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-400 resize-none focus-visible:ring-indigo-500/30"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  {/* Bottom Drag Handle Bar to Resize Downwards */}
                  <div
                    onMouseDown={handleMouseDownBodyResize}
                    onTouchStart={handleTouchStartBodyResize}
                    className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none mt-1 z-10"
                    title="Drag down to resize email body"
                  >
                    <div className="w-12 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-20 transition-all duration-200" />
                  </div>
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Replies from recruiter will automatically sync to this CMS timeline.</span>
              </div>
            </CardContent>
          </Card>

          {/* Dedicated Private Internal Notes Card */}
          <Card className="bg-[#0C0E18] border-white/[0.08] shadow-md">
            <CardHeader className="p-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                  <StickyNote className="h-4 w-4 text-amber-400" />
                  Private Internal Notes
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-300 font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    CMS Only
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (notesHeight > 100) {
                        setNotesHeight(84);
                      } else {
                        setNotesHeight(200);
                      }
                    }}
                    className="h-6 w-6 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    title={notesHeight > 100 ? "Perkecil area catatan" : "Perbesar area catatan"}
                  >
                    {notesHeight > 100 ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs text-slate-400 pt-1">
                Catatan internal hanya terlihat di dashboard CMS Anda, tidak akan dikirimkan ke email recruiter. Dapat Anda edit kembali kapan saja setelah tersimpan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-2.5">
              <div className="relative flex flex-col">
                <Textarea
                  id="notes"
                  style={{ height: `${notesHeight}px` }}
                  placeholder="e.g. Referred by John Doe / Rekomendasi salary $120k / Catatan strategi follow-up..."
                  className="text-xs font-sans leading-relaxed bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-500 resize-none focus-visible:ring-indigo-500/30"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {/* Bottom Drag Handle Bar to Resize Downwards */}
                <div
                  onMouseDown={handleMouseDownNotesResize}
                  onTouchStart={handleTouchStartNotesResize}
                  className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none mt-1 z-10"
                  title="Drag down to resize internal notes"
                >
                  <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-amber-400 group-hover:w-16 transition-all duration-200" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Submission Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#0C0E18] border border-white/[0.08] shadow-md">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Draf atau email yang terkirim akan otomatis tercatat di CMS timeline.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || isGeneratingAi}
                className="w-full sm:w-auto rounded-xl border-white/[0.08] bg-[#131726] hover:bg-[#1C2237] text-slate-300"
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || isGeneratingAi}
                className="w-full sm:w-auto gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-md shadow-indigo-500/20 border border-indigo-400/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Email Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
