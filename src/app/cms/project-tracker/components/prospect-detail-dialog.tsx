"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  ExternalLink,
  Laptop,
  Linkedin,
  Loader2,
  Mail,
  Save,
  Send,
  Sparkles,
  User,
  Video,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyTimezoneWidget } from "../../job-tracker/[id]/components/company-timezone-widget";
import {
  aiGeneratePitch,
  aiRunProspectAudit,
  updateProspect,
} from "@/services/project-finder/actions";
import type {
  ModernizationPitchResult,
  ProjectProspect,
  ProjectProspectStatus,
} from "@/services/project-finder/types";

interface ProspectDetailDialogProps {
  prospect: ProjectProspect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProspectUpdated: (updated: ProjectProspect) => void;
}

export function ProspectDetailDialog({
  prospect,
  open,
  onOpenChange,
  onProspectUpdated,
}: ProspectDetailDialogProps) {
  if (!prospect) return null;

  return (
    <ProspectDetailDialogInner
      key={prospect.id}
      prospect={prospect}
      open={open}
      onOpenChange={onOpenChange}
      onProspectUpdated={onProspectUpdated}
    />
  );
}

function ProspectDetailDialogInner({
  prospect,
  open,
  onOpenChange,
  onProspectUpdated,
}: {
  prospect: ProjectProspect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProspectUpdated: (updated: ProjectProspect) => void;
}) {
  const [formData, setFormData] = useState<ProjectProspect>(prospect);
  const [activeTab, setActiveTab] = useState("audit");
  const [isSaving, setIsSaving] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState<ModernizationPitchResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await updateProspect(formData.id, {
        companyName: formData.companyName,
        companyWebsite: formData.companyWebsite,
        industry: formData.industry,
        country: formData.country,
        city: formData.city,
        timezone: formData.timezone,
        status: formData.status,
        estimatedRevenueTier: formData.estimatedRevenueTier,
        auditScore: formData.auditScore,
        auditAnalysis: formData.auditAnalysis,
        mvpDemoUrl: formData.mvpDemoUrl,
        loomVideoUrl: formData.loomVideoUrl,
        pitchScript: formData.pitchScript,
        contactName: formData.contactName,
        contactRole: formData.contactRole,
        contactEmail: formData.contactEmail,
        contactLinkedin: formData.contactLinkedin,
        outreachStatus: formData.outreachStatus,
        notes: formData.notes,
      });

      setFormData(updated);
      onProspectUpdated(updated);
      toast.success("Prospect changes saved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save prospect changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunAudit = async () => {
    try {
      setIsAuditing(true);
      const updated = await aiRunProspectAudit(formData.id);
      setFormData(updated);
      onProspectUpdated(updated);
      toast.success("Storefront audit completed!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to run AI audit.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleGeneratePitch = async () => {
    try {
      setIsGeneratingPitch(true);
      const result = await aiGeneratePitch(formData.id);
      setPitchResult(result);
      setFormData((prev) => ({
        ...prev,
        status: prev.status === "sourced" || prev.status === "audited" || prev.status === "building_mvp" ? "pitch_ready" : prev.status,
      }));
      toast.success("AI Modernization Pitch generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI pitch.");
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const audit = formData.auditAnalysis;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#08090C] border-white/[0.1] text-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-5 border-b border-white/[0.08] bg-[#0C0E18] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  {formData.companyName}
                  <a
                    href={formData.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-primary/10 text-primary border-primary/25 font-mono"
                >
                  {formData.industry.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                {formData.companyWebsite}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData((p) => ({ ...p, status: val as ProjectProspectStatus }))}
              >
                <SelectTrigger className="h-8 text-xs bg-black/40 border-white/[0.1] text-white w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                  <SelectItem value="sourced">Sourced</SelectItem>
                  <SelectItem value="audited">Audited</SelectItem>
                  <SelectItem value="building_mvp">Building MVP</SelectItem>
                  <SelectItem value="pitch_ready">Pitch Ready</SelectItem>
                  <SelectItem value="outreach_sent">Outreach Sent</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won 🚀</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Timezone Intelligence Bar */}
          <CompanyTimezoneWidget
            timezone={formData.timezone}
            location={`${formData.city ? `${formData.city}, ` : ""}${formData.country}`}
          />
        </div>

        {/* Modal Body with Tabs */}
        <div className="flex-1 overflow-y-auto p-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <TabsList className="grid grid-cols-4 bg-[#0C0E18] border border-white/[0.08] p-1 rounded-xl h-auto">
              <TabsTrigger
                value="audit"
                className="text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-white font-medium gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Audit & CWV</span>
              </TabsTrigger>
              <TabsTrigger
                value="assets"
                className="text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-white font-medium gap-1.5"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>MVP & Loom</span>
              </TabsTrigger>
              <TabsTrigger
                value="pitch"
                className="text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-white font-medium gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>AI Pitch Crafter</span>
              </TabsTrigger>
              <TabsTrigger
                value="outreach"
                className="text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-white font-medium gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Contact & CRM</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: AUDIT & CORE WEB VITALS */}
            <TabsContent value="audit" className="space-y-5 m-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {formData.auditScore ?? "—"}/100
                  </div>
                  <span className="text-xs text-gray-400">Opportunity Score</span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="gap-1.5 text-xs h-8 bg-[#0C0E18] border-white/[0.1] hover:bg-white/[0.06] text-gray-300"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Auditing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {audit ? "Re-run AI Audit" : "Run Deep AI Audit"}
                    </>
                  )}
                </Button>
              </div>

              {audit ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                      <span className="text-[11px] text-gray-400">Mobile Speed Estimate</span>
                      <div className="text-lg font-bold font-mono text-amber-400">
                        {audit.performanceScore ?? 45}/100
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                      <span className="text-[11px] text-gray-400">Mobile Friction Score</span>
                      <div className="text-lg font-bold font-mono text-rose-400">
                        {audit.mobileFrictionScore ?? 72}/100
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                      <span className="text-[11px] text-gray-400">Est. Conversion Lift</span>
                      <div className="text-lg font-bold font-mono text-emerald-400">
                        {audit.estimatedConversionLift || "+18% to +26%"}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      Detected Legacy Architecture
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(audit.detectedStack || []).map((tech, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-amber-500/10 text-amber-300 border-amber-500/25">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      Recommended Modern Stack (Next.js 16 / Nuxt 4 & Tailwind)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(audit.recommendedModernization || []).map((mod, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/25">
                          {mod}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                      <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Core Web Vitals Issues
                      </div>
                      <ul className="space-y-1 text-xs text-gray-300">
                        {(audit.coreWebVitalIssues || []).map((issue, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-400 mt-0.5">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                      <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mobile UX Bottlenecks
                      </div>
                      <ul className="space-y-1 text-xs text-gray-300">
                        {(audit.mobileUxPainPoints || []).map((pt, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {audit.executiveSummary && (
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                      <div className="text-xs font-semibold text-primary">Executive Summary</div>
                      <p className="text-xs text-gray-300 leading-relaxed">{audit.executiveSummary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-dashed border-white/[0.08] space-y-3">
                  <Sparkles className="w-6 h-6 text-primary mx-auto" />
                  <p className="text-xs text-gray-400">
                    No audit generated yet. Click &quot;Run Deep AI Audit&quot; to analyze tech stack, CWV metrics, and modernization potential.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: MVP DEMO & LOOM ASSETS */}
            <TabsContent value="assets" className="space-y-4 m-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-300 font-medium flex items-center justify-between">
                    <span>Live Modern MVP Demo URL (Next.js 16 / Nuxt 4)</span>
                    {formData.mvpDemoUrl && (
                      <a
                        href={formData.mvpDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Launch Demo <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </Label>
                  <Input
                    value={formData.mvpDemoUrl || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, mvpDemoUrl: e.target.value }))}
                    placeholder="https://wismannur.pro/showcase/maxaro or custom deployment URL"
                    className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                  />
                  <p className="text-[11px] text-gray-500">
                    A lightweight, ultra-fast mobile storefront prototype (Next.js 16 / Nuxt 4) highlighting instant category filters and optimistic cart state.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-300 font-medium flex items-center justify-between">
                    <span>90-Second Loom Walkthrough Video URL</span>
                    {formData.loomVideoUrl && (
                      <a
                        href={formData.loomVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                      >
                        Watch Loom <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </Label>
                  <Input
                    value={formData.loomVideoUrl || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, loomVideoUrl: e.target.value }))}
                    placeholder="https://www.loom.com/share/..."
                    className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                  />
                  <p className="text-[11px] text-gray-500">
                    A 90-120 second video comparing their live mobile storefront vs. the Nuxt 4 MVP with zero pitch or pressure.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-gray-300 font-medium">Internal Notes & Observations</Label>
                  <Textarea
                    value={formData.notes || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    rows={4}
                    placeholder="e.g. Maxaro has 34,000 reviews on Trustpilot. Lennard mentioned they want to modernize storefronts into a headless architecture..."
                    className="bg-black/40 border-white/[0.1] text-xs text-white focus:border-primary resize-none"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: AI PITCH CRAFTER */}
            <TabsContent value="pitch" className="space-y-4 m-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Value-First Modernization Pitch Deliverables
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Generates tailored Cold Email, LinkedIn InMail, and a 4-part 90s Loom Walkthrough Script.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={handleGeneratePitch}
                  disabled={isGeneratingPitch}
                  className="gap-1.5 text-xs h-8 bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-950"
                >
                  {isGeneratingPitch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Crafting Pitch...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate AI Pitch Pack
                    </>
                  )}
                </Button>
              </div>

              {pitchResult ? (
                <div className="space-y-4">
                  {/* Cold Email Section */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-400" />
                        Tailored Cold Email
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(`Subject: ${pitchResult.coldEmailSubject}\n\n${pitchResult.coldEmailBody}`, "email")}
                        className="text-xs h-7 px-2 text-gray-400 hover:text-white"
                      >
                        {copiedKey === "email" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy Email
                      </Button>
                    </div>
                    <div className="text-xs font-mono text-gray-300 p-2 rounded bg-black/60 border border-white/[0.04]">
                      <span className="text-gray-500">Subject:</span> {pitchResult.coldEmailSubject}
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed p-3 rounded bg-black/40 border border-white/[0.04]">
                      {pitchResult.coldEmailBody}
                    </pre>
                  </div>

                  {/* LinkedIn InMail Section */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                        LinkedIn Peer-to-Peer Message
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(pitchResult.linkedInMessage, "linkedin")}
                        className="text-xs h-7 px-2 text-gray-400 hover:text-white"
                      >
                        {copiedKey === "linkedin" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy Message
                      </Button>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed p-3 rounded bg-black/40 border border-white/[0.04]">
                      {pitchResult.linkedInMessage}
                    </pre>
                  </div>

                  {/* Loom Walkthrough Script */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-purple-400" />
                        90-Second Loom Walkthrough Script
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(pitchResult.loomVideoScript, "loom")}
                        className="text-xs h-7 px-2 text-gray-400 hover:text-white"
                      >
                        {copiedKey === "loom" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy Script
                      </Button>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed p-3 rounded bg-black/40 border border-white/[0.04]">
                      {pitchResult.loomVideoScript}
                    </pre>
                  </div>
                </div>
              ) : formData.pitchScript ? (
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Saved Pitch Script</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(formData.pitchScript || "", "saved-pitch")}
                      className="text-xs h-7 px-2 text-gray-400 hover:text-white"
                    >
                      {copiedKey === "saved-pitch" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy Script
                    </Button>
                  </div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed p-3 rounded bg-black/60 border border-white/[0.04]">
                    {formData.pitchScript}
                  </pre>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-dashed border-white/[0.08] space-y-3">
                  <Sparkles className="w-6 h-6 text-purple-400 mx-auto" />
                  <p className="text-xs text-gray-400">
                    Click &quot;Generate AI Pitch Pack&quot; to synthesize your audit data, MVP link, and company profile into an irresistible outreach package.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB 4: CONTACT & CRM */}
            <TabsContent value="outreach" className="space-y-4 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">Contact Person Name</Label>
                  <Input
                    value={formData.contactName || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, contactName: e.target.value }))}
                    placeholder="e.g. Lennard Bakhuys"
                    className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">Contact Role / Title</Label>
                  <Input
                    value={formData.contactRole || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, contactRole: e.target.value }))}
                    placeholder="e.g. Projectmanager E-commerce"
                    className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">Direct Email</Label>
                  <Input
                    value={formData.contactEmail || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                    placeholder="lennard@company.nl"
                    className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">LinkedIn Profile URL</Label>
                  <Input
                    value={formData.contactLinkedin || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, contactLinkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">Country</Label>
                  <Input
                    value={formData.country || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                    placeholder="e.g. Netherlands, United States, Canada"
                    className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">City</Label>
                  <Input
                    value={formData.city || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Amsterdam, New York, Toronto"
                    className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(val) => setFormData((p) => ({ ...p, timezone: val }))}
                  >
                    <SelectTrigger className="bg-black/40 border-white/[0.1] text-xs h-9 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                      <SelectItem value="Europe/Amsterdam">Europe/Amsterdam (CET / CEST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT / BST)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET / CEST)</SelectItem>
                      <SelectItem value="Europe/Berlin">Europe/Berlin (CET / CEST)</SelectItem>
                      <SelectItem value="Europe/Stockholm">Europe/Stockholm (CET / CEST)</SelectItem>
                      <SelectItem value="Europe/Rome">Europe/Rome (CET / CEST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (US Eastern - EST/EDT)</SelectItem>
                      <SelectItem value="America/Chicago">America/Chicago (US Central - CST/CDT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (US Pacific - PST/PDT)</SelectItem>
                      <SelectItem value="America/Toronto">America/Toronto (Canada Eastern)</SelectItem>
                      <SelectItem value="America/Vancouver">America/Vancouver (Canada Pacific)</SelectItem>
                      <SelectItem value="Australia/Sydney">Australia/Sydney (AEST / AEDT)</SelectItem>
                      <SelectItem value="Australia/Perth">Australia/Perth (AWST)</SelectItem>
                      <SelectItem value="Pacific/Auckland">Pacific/Auckland (NZST / NZDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">Outreach Status</Label>
                  <Select
                    value={formData.outreachStatus || "not_started"}
                    onValueChange={(val) => setFormData((p) => ({ ...p, outreachStatus: val }))}
                  >
                    <SelectTrigger className="bg-black/40 border-white/[0.1] text-xs h-9 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="inmail_sent">LinkedIn InMail Sent</SelectItem>
                      <SelectItem value="email_sent">Cold Email Sent</SelectItem>
                      <SelectItem value="follow_up_1">Follow-up 1 Sent</SelectItem>
                      <SelectItem value="follow_up_2">Follow-up 2 Sent</SelectItem>
                      <SelectItem value="meeting_booked">Meeting Booked 🎉</SelectItem>
                      <SelectItem value="replied">Replied (Chatting)</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">Estimated Revenue Tier</Label>
                  <Input
                    value={formData.estimatedRevenueTier || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, estimatedRevenueTier: e.target.value }))}
                    placeholder="e.g. €20M - €50M"
                    className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-300 font-medium">Pipeline Stage</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData((p) => ({ ...p, status: val as ProjectProspectStatus }))}
                  >
                    <SelectTrigger className="bg-black/40 border-white/[0.1] text-xs h-9 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                      <SelectItem value="sourced">Sourced</SelectItem>
                      <SelectItem value="audited">Audited</SelectItem>
                      <SelectItem value="building_mvp">Building MVP</SelectItem>
                      <SelectItem value="pitch_ready">Pitch Ready</SelectItem>
                      <SelectItem value="outreach_sent">Outreach Sent</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="won">Won 🚀</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
