"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  SendHorizontal,
  Copy,
  Sparkles,
  Check,
  Mail,
  Clock,
  Briefcase,
  ExternalLink,
  MessageSquare,
  Loader2,
  RefreshCw,
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
  const [contactName, setContactName] = useState(application.contactName || "Hiring Team");
  const [contactEmail, setContactEmail] = useState(application.contactEmail || "");
  const [customNotes, setCustomNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
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

  // Sync preset when scenario changes
  useMemo(() => {
    const preset = getPresetTemplate(scenario, contactName);
    setSubject(preset.subject);
    setBody(preset.body);
  }, [scenario, contactName]);

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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/70 bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <DialogTitle className="text-lg flex items-center gap-2">
                <SendHorizontal className="w-5 h-5 text-primary" />
                One-Click Follow-Up & Email Generator
              </DialogTitle>
              <DialogDescription className="text-xs">
                Generate high-converting recruiter communication for{" "}
                <strong>{application.companyName}</strong>.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs w-fit">
              {application.jobTitle}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Scenario Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Scenario</Label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select email scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thank_you">🤝 Post-Interview Thank You (Within 24h)</SelectItem>
                  <SelectItem value="status_check">⏳ Status Check-In / Follow-up (1 Week)</SelectItem>
                  <SelectItem value="portfolio_update">🚀 Relevant Case Study / Work Sample</SelectItem>
                  <SelectItem value="negotiation">💰 Offer Consideration & Terms Discussion</SelectItem>
                  <SelectItem value="acceptance">🎉 Offer Acceptance Confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Recipient Name / Role</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Sarah / Hiring Manager"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* AI Customization input */}
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini AI Personalization
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAiRegenerate}
                disabled={isGeneratingAi}
                className="h-7 text-xs border-primary/30 hover:bg-primary/10 gap-1.5"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-primary" />
                    Tailor with AI
                  </>
                )}
              </Button>
            </div>
            <Input
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Optional: e.g., 'Mention our talk about Next.js 16 cache and our upcoming Q4 launch'"
              className="h-8 text-xs bg-background/80"
            />
          </div>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Subject Line</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(subject);
                  toast.success("Subject copied!");
                }}
                className="h-6 text-[11px] gap-1 px-2 text-muted-foreground"
              >
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-xs font-medium"
            />
          </div>

          {/* Email Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Email Body</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(body);
                  toast.success("Body copied!");
                }}
                className="h-6 text-[11px] gap-1 px-2 text-muted-foreground"
              >
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="text-xs leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/20 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBoth}
            className="w-full sm:w-auto text-xs gap-1.5 h-8"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied All!" : "Copy Subject & Body"}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleOpenInOutreach}
              className="text-xs h-8 gap-1.5 bg-primary shadow-sm"
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
