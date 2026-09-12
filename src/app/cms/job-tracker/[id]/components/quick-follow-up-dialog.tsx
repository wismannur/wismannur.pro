"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SendHorizontal,
  Copy,
  Sparkles,
  Check,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jobOutreachService } from "@/services";
import type { JobApplication } from "@/services/job-tracker/types";

interface QuickFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication;
  defaultScenario?: "thank_you" | "status_check" | "portfolio_update" | "negotiation" | "acceptance";
}

export function QuickFollowUpDialog({
  open,
  onOpenChange,
  application,
  defaultScenario = "thank_you",
}: QuickFollowUpDialogProps) {
  const router = useRouter();
  const [scenario, setScenario] = useState<string>(defaultScenario);

  // Resizable state & handlers for Email Body textarea
  const [emailBodyHeight, setEmailBodyHeight] = useState<number>(180);
  const isDraggingBodyRef = useRef(false);
  const dragBodyStartYRef = useRef(0);
  const startBodyHeightRef = useRef(180);

  const handleMouseDownBodyResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingBodyRef.current = true;
    dragBodyStartYRef.current = e.clientY;
    startBodyHeightRef.current = emailBodyHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingBodyRef.current) return;
      const deltaY = moveEvent.clientY - dragBodyStartYRef.current;
      const maxHeight = Math.min(600, Math.floor(window.innerHeight * 0.65));
      const newHeight = Math.min(Math.max(startBodyHeightRef.current + deltaY, 100), maxHeight);
      setEmailBodyHeight(newHeight);
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
    if (e.touches.length !== 1) return;
    isDraggingBodyRef.current = true;
    dragBodyStartYRef.current = e.touches[0].clientY;
    startBodyHeightRef.current = emailBodyHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingBodyRef.current || moveEvent.touches.length !== 1) return;
      const deltaY = moveEvent.touches[0].clientY - dragBodyStartYRef.current;
      const maxHeight = Math.min(600, Math.floor(window.innerHeight * 0.65));
      const newHeight = Math.min(Math.max(startBodyHeightRef.current + deltaY, 100), maxHeight);
      setEmailBodyHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingBodyRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };
  const [contactName, setContactName] = useState(application.contactName || "Hiring Team");
  const contactEmail = application.contactEmail || "";
  const [customNotes, setCustomNotes] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  // Preset templates generator
  const getPresetTemplate = (type: string, name: string) => {
    const greeting = name ? `Hi ${name}` : "Hi Hiring Team";
    switch (type) {
      case "thank_you":
        return {
          subject: `Thank you for the conversation — ${application.jobTitle} (${application.companyName})`,
          body: `${greeting},

Thank you for taking the time to speak with me today about the ${application.jobTitle} opportunity at ${application.companyName}. I really enjoyed learning more about the team's roadmap and current engineering priorities.

Our discussion reinforced my enthusiasm for the role. I am confident that my background in building scalable fullstack systems, high-performance web applications, and AI integrations will enable me to deliver immediate value to your team.

Please let me know if you need any further work samples or references. Looking forward to hearing about the next steps.

Best regards,
Wisman Nur
https://wismannur.pro`,
        };

      case "status_check":
        return {
          subject: `Checking in regarding ${application.jobTitle} application — Wisman Nur`,
          body: `${greeting},

I hope you're having a great week!

I am following up regarding my recent application and interview for the ${application.jobTitle} position at ${application.companyName}. I remain very enthusiastic about the opportunity to contribute to your team.

Could you please share any updates on the hiring timeline or next steps in the process?

Thank you for your time and guidance.

Warm regards,
Wisman Nur
https://wismannur.pro`,
        };

      case "portfolio_update":
        return {
          subject: `Relevant case study & work sample for ${application.jobTitle} — Wisman Nur`,
          body: `${greeting},

Following our recent discussion regarding ${application.jobTitle} at ${application.companyName}, I wanted to quickly share a relevant case study from my recent work that closely mirrors the challenges we touched on:

🔗 Portfolio Case Study: https://wismannur.pro/projects

I'd be glad to discuss how similar architecture and performance optimizations can be applied directly to ${application.companyName}'s product goals.

Best regards,
Wisman Nur`,
        };

      case "negotiation":
        return {
          subject: `Offer Discussion & Compensation Review — ${application.jobTitle} (Wisman Nur)`,
          body: `${greeting},

Thank you very much for extending the offer for the ${application.jobTitle} role at ${application.companyName}! I am thrilled about the prospect of joining the team and contributing to your upcoming milestones.

After carefully reviewing the offer package and considering the scope of responsibilities, I would love to schedule a brief 10-15 minute sync to discuss a few specific components of the compensation structure and start date.

Please let me know a convenient time for a quick call.

Best regards,
Wisman Nur`,
        };

      case "acceptance":
        return {
          subject: `Offer Acceptance — ${application.jobTitle} (Wisman Nur)`,
          body: `${greeting},

I am excited to formally accept the offer for the ${application.jobTitle} position at ${application.companyName}! 

I look forward to working with everyone on the team and hitting the ground running. Please send over the formal paperwork, onboarding details, and any preparatory steps needed prior to my start date.

Thank you once again for this wonderful opportunity.

Warm regards,
Wisman Nur`,
        };

      default:
        return {
          subject: `Regarding ${application.jobTitle} at ${application.companyName}`,
          body: `${greeting},\n\nI am writing to follow up regarding the ${application.jobTitle} role.\n\nBest regards,\nWisman Nur`,
        };
    }
  };

  const initialPreset = getPresetTemplate(defaultScenario, application.contactName || "Hiring Team");
  const [subject, setSubject] = useState(initialPreset.subject);
  const [body, setBody] = useState(initialPreset.body);

  const handleScenarioChange = (newScenario: string) => {
    setScenario(newScenario);
    const preset = getPresetTemplate(newScenario, contactName);
    setSubject(preset.subject);
    setBody(preset.body);
  };

  const handleContactNameChange = (newName: string) => {
    setContactName(newName);
    const preset = getPresetTemplate(scenario, newName);
    setSubject(preset.subject);
    setBody(preset.body);
  };

  const handleAiRegenerate = async () => {
    setIsGeneratingAi(true);
    try {
      const draft = await jobOutreachService.generateAiDraft({
        type: scenario === "status_check" || scenario === "thank_you" ? "follow_up" : "cold_pitch",
        companyName: application.companyName,
        jobTitle: application.jobTitle,
        contactName: contactName || "Hiring Manager",
        contactRole: "Hiring Team",
        companyWebsite: application.companyWebsite || undefined,
        jobDescriptionSnippet: application.jobDescriptionRaw || undefined,
        customInstructions: `Template Goal: ${scenario.replace("_", " ")}. Custom note: ${customNotes || "Make it punchy, senior, and respectful."}`,
      });

      setSubject(draft.subject);
      setBody(draft.body);
      toast.success("AI email customized with Gemini!");
    } catch (err: unknown) {
      console.error("AI draft error:", err);
      toast.error((err as Error).message || "Failed to generate AI follow-up draft.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyBoth = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Email Subject & Body copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInOutreach = () => {
    const params = new URLSearchParams({
      jobAppId: application.id,
      company: application.companyName,
      title: application.jobTitle,
      recipientName: contactName,
      recipientEmail: contactEmail,
      subject: subject,
    });
    onOpenChange(false);
    router.push(`/cms/job-outreaches/new?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#0C0E18] border border-white/[0.12] text-foreground shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-white/[0.08] bg-[#131726]/60">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <SendHorizontal className="w-5 h-5 text-indigo-400" />
                One-Click Follow-Up & Email Generator
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Generate high-converting recruiter communication for{" "}
                <strong className="text-white">{application.companyName}</strong>.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs w-fit bg-white/[0.04] text-indigo-300 border-white/[0.1]">
              {application.jobTitle}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Scenario Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Email Scenario</Label>
              <Select value={scenario} onValueChange={handleScenarioChange}>
                <SelectTrigger className="h-9 text-xs bg-[#131726] border-white/[0.08] text-white">
                  <SelectValue placeholder="Select email scenario" />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.12] text-slate-200">
                  <SelectItem value="thank_you">🤝 Post-Interview Thank You (Within 24h)</SelectItem>
                  <SelectItem value="status_check">⏳ Status Check-In / Follow-up (1 Week)</SelectItem>
                  <SelectItem value="portfolio_update">🚀 Relevant Case Study / Work Sample</SelectItem>
                  <SelectItem value="negotiation">💰 Offer Consideration & Terms Discussion</SelectItem>
                  <SelectItem value="acceptance">🎉 Offer Acceptance Confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Recipient Name / Role</Label>
              <Input
                value={contactName}
                onChange={(e) => handleContactNameChange(e.target.value)}
                placeholder="e.g. Sarah / Hiring Manager"
                className="h-9 text-xs bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-white"
              />
            </div>
          </div>

          {/* AI Customization input */}
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Gemini AI Personalization
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAiRegenerate}
                disabled={isGeneratingAi}
                className="h-7 text-xs bg-[#0C0E18] border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Tailor with AI
                  </>
                )}
              </Button>
            </div>
            <Input
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Optional: e.g., 'Mention our talk about Next.js 16 cache and our upcoming Q4 launch'"
              className="h-8 text-xs bg-[#0C0E18] border-white/[0.08] text-slate-200"
            />
          </div>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-300">Subject Line</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(subject);
                  toast.success("Subject copied!");
                }}
                className="h-6 text-[11px] gap-1 px-2 text-slate-400 hover:text-white"
              >
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-xs font-medium bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-white"
            />
          </div>

          {/* Email Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-300">Email Body</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  Drag to resize
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (emailBodyHeight > 220) {
                      setEmailBodyHeight(180);
                    } else {
                      setEmailBodyHeight(340);
                    }
                  }}
                  className="h-6 w-6 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] p-0"
                  title={emailBodyHeight > 220 ? "Perkecil input" : "Perbesar input"}
                >
                  {emailBodyHeight > 220 ? (
                    <Minimize2 className="h-3 w-3" />
                  ) : (
                    <Maximize2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(body);
                    toast.success("Body copied!");
                  }}
                  className="h-6 text-[11px] gap-1 px-2 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
            </div>

            <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-inner">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ height: `${emailBodyHeight}px` }}
                className="w-full text-xs leading-relaxed font-sans resize-none rounded-none border-0 bg-transparent text-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto scrollbar-thin"
              />

              {/* Bottom Drag Handle Bar to Resize */}
              <div
                onMouseDown={handleMouseDownBodyResize}
                onTouchStart={handleTouchStartBodyResize}
                className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
                title="Drag handle to resize email area"
              >
                <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-16 transition-all duration-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#131726]/60 border-t border-white/[0.08] flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBoth}
            className="w-full sm:w-auto text-xs gap-1.5 h-8 bg-[#0C0E18] border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied All!" : "Copy Subject & Body"}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 text-slate-400 hover:text-white"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleOpenInOutreach}
              className="text-xs h-8 gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20"
            >
              <SendHorizontal className="w-3.5 h-3.5" />
              Open in Outreach CRM
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
