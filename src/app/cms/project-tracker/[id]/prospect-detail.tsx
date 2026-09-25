"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
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
  Trash2,
  User,
  Video,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyTimezoneWidget } from "../../job-tracker/[id]/components/company-timezone-widget";
import {
  aiGeneratePitch,
  aiRunProspectAudit,
  deleteProspect,
  updateProspect,
} from "@/services/project-finder/actions";
import type {
  ModernizationPitchResult,
  ProjectProspect,
  ProjectProspectStatus,
} from "@/services/project-finder/types";
import { cn } from "@/lib/utils";

const FUNNEL_STEPPER: { status: ProjectProspectStatus; label: string }[] = [
  { status: "sourced", label: "Sourced" },
  { status: "audited", label: "Audited" },
  { status: "building_mvp", label: "Building MVP" },
  { status: "pitch_ready", label: "Pitch Ready" },
  { status: "outreach_sent", label: "Outreach Sent" },
  { status: "negotiation", label: "Negotiation" },
  { status: "won", label: "Won Deals 🎉" },
];

export function ProspectDetail({ initialProspect }: { initialProspect: ProjectProspect }) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectProspect>(initialProspect);
  const [activeTab, setActiveTab] = useState("audit");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      toast.success("Prospect changes saved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save prospect changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProspect(formData.id);
      toast.success(`${formData.companyName} removed from pipeline.`);
      router.push("/cms/project-tracker");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete prospect.");
      setIsDeleting(false);
    }
  };

  const handleRunAudit = async () => {
    try {
      setIsAuditing(true);
      const updated = await aiRunProspectAudit(formData.id);
      setFormData(updated);
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
        status:
          prev.status === "sourced" || prev.status === "audited" || prev.status === "building_mvp"
            ? "pitch_ready"
            : prev.status,
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

  const companyInitials = formData.companyName.trim()
    ? formData.companyName
        .trim()
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CO";

  const currentStepIndex = FUNNEL_STEPPER.findIndex((s) => s.status === formData.status);

  return (
    <div className="space-y-8 animate-fade-in pb-20 text-slate-100 max-w-6xl mx-auto">
      {/* Top Header Command Center Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-[500px] h-[250px] bg-primary/10 rounded-full blur-[110px] pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[150px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none -z-0" />

        <div className="relative z-10 space-y-5">
          {/* Breadcrumb row */}
          <div className="flex items-center justify-between">
            <Link
              href="/cms/project-tracker"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Pipeline</span>
            </Link>

            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#0C0E18] border-white/[0.1] text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Prospect?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400 text-xs">
                      Are you sure you want to remove <strong>{formData.companyName}</strong> from the client pipeline? This will permanently delete audit records, prototypes, and pitches.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-white/[0.1] text-white hover:bg-white/[0.06]">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      {isDeleting ? "Deleting..." : "Delete Permanently"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5 text-xs h-9 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Main Title Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary font-mono font-bold text-lg shrink-0 shadow-inner">
                {companyInitials}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    {formData.companyName}
                  </h1>
                  {formData.companyWebsite && (
                    <a
                      href={formData.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white transition-colors"
                      title="Visit Storefront"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/10 text-primary border-primary/25 font-mono capitalize"
                  >
                    {formData.industry.replace("_", " ")}
                  </Badge>
                  {formData.auditScore !== undefined && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/25 font-mono"
                    >
                      Audit Score: {formData.auditScore}/100
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-gray-400 font-mono">
                  {formData.companyWebsite}
                </p>
              </div>
            </div>

            {/* Stage Quick Switcher */}
            <div className="flex items-center gap-2.5 bg-[#131726]/80 p-2 rounded-2xl border border-white/[0.08] self-start md:self-auto">
              <span className="text-xs text-gray-400 font-medium pl-1">Stage:</span>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData((p) => ({ ...p, status: val as ProjectProspectStatus }))}
              >
                <SelectTrigger className="h-8 text-xs bg-black/40 border-white/[0.1] text-white w-40 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                  <SelectItem value="sourced">Sourced</SelectItem>
                  <SelectItem value="audited">Audited</SelectItem>
                  <SelectItem value="building_mvp">Building MVP</SelectItem>
                  <SelectItem value="pitch_ready">Pitch Ready</SelectItem>
                  <SelectItem value="outreach_sent">Outreach Sent</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won Deals 🚀</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timezone Intelligence Widget Bar */}
          <CompanyTimezoneWidget
            timezone={formData.timezone}
            location={`${formData.city ? `${formData.city}, ` : ""}${formData.country}`}
          />

          {/* Interactive Pipeline Stepper */}
          <div className="pt-2">
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
              {FUNNEL_STEPPER.map((step, idx) => {
                const isCompleted = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <button
                    key={step.status}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, status: step.status }))}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all",
                      isCurrent
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/20 ring-1 ring-primary/40"
                        : isCompleted
                        ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                        : "bg-white/[0.02] text-gray-400 border-white/[0.06] hover:bg-white/[0.04]"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px] font-mono">
                        {idx + 1}
                      </span>
                    )}
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 bg-[#0C0E18] border border-white/[0.08] p-1.5 rounded-2xl h-auto gap-1">
          <TabsTrigger
            value="audit"
            className="text-xs py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Audit &amp; CWV</span>
          </TabsTrigger>
          <TabsTrigger
            value="assets"
            className="text-xs py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium gap-2 transition-all"
          >
            <Laptop className="w-4 h-4" />
            <span>MVP &amp; Loom</span>
          </TabsTrigger>
          <TabsTrigger
            value="pitch"
            className="text-xs py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>AI Pitch Crafter</span>
          </TabsTrigger>
          <TabsTrigger
            value="outreach"
            className="text-xs py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium gap-2 transition-all"
          >
            <User className="w-4 h-4" />
            <span>Contact &amp; CRM</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AUDIT & CORE WEB VITALS */}
        <TabsContent value="audit" className="space-y-6 m-0">
          <Card className="rounded-2xl border-white/[0.08] bg-[#0C0E18] shadow-xl overflow-hidden backdrop-blur-md">
            <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 bg-white/[0.01]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                    {formData.auditScore ?? "—"}/100
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-white">
                      Storefront Modernization Opportunity
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-400">
                      Automated audit of Core Web Vitals, mobile friction, and conversion uplift potential
                    </CardDescription>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="gap-2 text-xs h-10 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl self-start sm:self-auto shrink-0 shadow-lg shadow-primary/20"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Auditing Storefront...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>{audit ? "Re-run Deep AI Audit" : "Run Deep AI Audit"}</span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-6">
              {audit ? (
                <div className="space-y-6">
                  {/* KPI Triplets */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#131726] border border-white/[0.06] space-y-1">
                      <span className="text-xs text-gray-400">Mobile Speed Estimate</span>
                      <div className="text-2xl font-bold font-mono text-amber-400">
                        {audit.performanceScore ?? 45}/100
                      </div>
                      <p className="text-[11px] text-gray-500">Lighthouse simulated throttled mobile 4G</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#131726] border border-white/[0.06] space-y-1">
                      <span className="text-xs text-gray-400">Mobile Friction Score</span>
                      <div className="text-2xl font-bold font-mono text-rose-400">
                        {audit.mobileFrictionScore ?? 72}/100
                      </div>
                      <p className="text-[11px] text-gray-500">Cumulative Layout Shift &amp; tap delay rating</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#131726] border border-white/[0.06] space-y-1">
                      <span className="text-xs text-gray-400">Est. Conversion Lift</span>
                      <div className="text-2xl font-bold font-mono text-emerald-400">
                        {audit.estimatedConversionLift || "+18% to +26%"}
                      </div>
                      <p className="text-[11px] text-gray-500">Expected revenue lift upon headless upgrade</p>
                    </div>
                  </div>

                  {/* Architecture detection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#131726] border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <Cpu className="w-4 h-4 text-amber-400" />
                        <span>Detected Legacy Architecture</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(audit.detectedStack || []).map((tech, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs bg-amber-500/10 text-amber-300 border-amber-500/25 px-2.5 py-1"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#131726] border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span>Recommended Modern Stack</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(audit.recommendedModernization || []).map((mod, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/25 px-2.5 py-1"
                          >
                            {mod}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Core Web Vitals & UX Bottlenecks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#131726] border border-white/[0.06] space-y-3">
                      <div className="text-xs font-semibold text-rose-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Core Web Vitals Issues Identified</span>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-300">
                        {(audit.coreWebVitalIssues || []).map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-400 mt-0.5">•</span>
                            <span className="leading-relaxed">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-[#131726] border border-white/[0.06] space-y-3">
                      <div className="text-xs font-semibold text-primary flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mobile UX Bottlenecks</span>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-300">
                        {(audit.mobileUxPainPoints || []).map((pt, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="leading-relaxed">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  {audit.executiveSummary && (
                    <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5">
                      <div className="text-xs font-bold text-primary uppercase tracking-wider">
                        Executive Summary for Outreach
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                        {audit.executiveSummary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center rounded-xl border border-dashed border-white/[0.08] space-y-3">
                  <Sparkles className="w-8 h-8 text-primary mx-auto opacity-70" />
                  <p className="text-sm font-semibold text-white">No Audit Run Yet</p>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Click &quot;Run Deep AI Audit&quot; above to inspect {formData.companyName}&apos;s storefront with Gemini AI and uncover speed bottlenecks and modernization opportunities.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: MVP DEMO & LOOM ASSETS */}
        <TabsContent value="assets" className="space-y-6 m-0">
          <Card className="rounded-2xl border-white/[0.08] bg-[#0C0E18] shadow-xl overflow-hidden backdrop-blur-md">
            <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-white">
                    MVP Demonstration &amp; Loom Video Walkthrough
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400">
                    Host and share modern prototype links that prove 4x faster load speeds
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span>Live Modern MVP Demo URL (Next.js 16 / Nuxt 4)</span>
                  {formData.mvpDemoUrl && (
                    <a
                      href={formData.mvpDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      Launch Demo <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </Label>
                <Input
                  value={formData.mvpDemoUrl || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, mvpDemoUrl: e.target.value }))}
                  placeholder="https://wismannur.pro/showcase/maxaro"
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
                <p className="text-[11px] text-gray-500">
                  A lightweight prototype showcasing instantaneous category filtering and optimistic cart UX.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span>90-Second Loom Walkthrough Video URL</span>
                  {formData.loomVideoUrl && (
                    <a
                      href={formData.loomVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Watch Loom <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </Label>
                <Input
                  value={formData.loomVideoUrl || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, loomVideoUrl: e.target.value }))}
                  placeholder="https://www.loom.com/share/..."
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
                <p className="text-[11px] text-gray-500">
                  A side-by-side video comparing their production storefront with the modernized prototype.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-300">Internal Notes &amp; Observations</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  rows={5}
                  placeholder="e.g. Discussed headless migration timeline with Lennard. They currently run on Magento 2 with high hosting costs. Target MVP conversion lift is +22%."
                  className="bg-[#131726] border-white/[0.08] text-xs text-white placeholder:text-gray-500 rounded-xl focus:border-primary resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: AI PITCH CRAFTER */}
        <TabsContent value="pitch" className="space-y-6 m-0">
          <Card className="rounded-2xl border-white/[0.08] bg-[#0C0E18] shadow-xl overflow-hidden backdrop-blur-md">
            <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 bg-white/[0.01]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-white">
                      Value-First Modernization Pitch Deliverables
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-400">
                      Synthesize audit findings, MVP links, and company profile into persuasive outreach copy
                    </CardDescription>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleGeneratePitch}
                  disabled={isGeneratingPitch}
                  className="gap-2 text-xs h-10 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl self-start sm:self-auto shrink-0 shadow-lg shadow-purple-950"
                >
                  {isGeneratingPitch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Copy...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate AI Pitch Pack</span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-6">
              {pitchResult ? (
                <div className="space-y-6">
                  {/* Cold Email */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#131726] border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-sky-400" />
                        <span>Tailored Cold Email</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleCopy(`Subject: ${pitchResult.coldEmailSubject}\n\n${pitchResult.coldEmailBody}`, "email")
                        }
                        className="text-xs h-8 px-3 text-gray-300 hover:text-white rounded-lg bg-white/[0.04]"
                      >
                        {copiedKey === "email" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 mr-1" />
                        )}
                        Copy Email
                      </Button>
                    </div>
                    <div className="text-xs font-mono text-gray-300 p-2.5 rounded-lg bg-black/60 border border-white/[0.04]">
                      <span className="text-gray-500">Subject:</span> {pitchResult.coldEmailSubject}
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed p-4 rounded-lg bg-black/40 border border-white/[0.04]">
                      {pitchResult.coldEmailBody}
                    </pre>
                  </div>

                  {/* LinkedIn Message */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#131726] border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-2">
                        <Linkedin className="w-4 h-4 text-blue-400" />
                        <span>LinkedIn Peer-to-Peer Message</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(pitchResult.linkedInMessage, "linkedin")}
                        className="text-xs h-8 px-3 text-gray-300 hover:text-white rounded-lg bg-white/[0.04]"
                      >
                        {copiedKey === "linkedin" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 mr-1" />
                        )}
                        Copy Message
                      </Button>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed p-4 rounded-lg bg-black/40 border border-white/[0.04]">
                      {pitchResult.linkedInMessage}
                    </pre>
                  </div>

                  {/* Loom Walkthrough Script */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#131726] border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-400" />
                        <span>90-Second Loom Walkthrough Script</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(pitchResult.loomVideoScript, "loom")}
                        className="text-xs h-8 px-3 text-gray-300 hover:text-white rounded-lg bg-white/[0.04]"
                      >
                        {copiedKey === "loom" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 mr-1" />
                        )}
                        Copy Script
                      </Button>
                    </div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed p-4 rounded-lg bg-black/40 border border-white/[0.04]">
                      {pitchResult.loomVideoScript}
                    </pre>
                  </div>
                </div>
              ) : formData.pitchScript ? (
                <div className="p-4 sm:p-5 rounded-xl bg-[#131726] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Saved Pitch Script</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(formData.pitchScript || "", "saved-pitch")}
                      className="text-xs h-8 px-3 text-gray-300 hover:text-white rounded-lg bg-white/[0.04]"
                    >
                      {copiedKey === "saved-pitch" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 mr-1" />
                      )}
                      Copy Script
                    </Button>
                  </div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed p-4 rounded-lg bg-black/40 border border-white/[0.04]">
                    {formData.pitchScript}
                  </pre>
                </div>
              ) : (
                <div className="py-12 text-center rounded-xl border border-dashed border-white/[0.08] space-y-3">
                  <Sparkles className="w-8 h-8 text-purple-400 mx-auto opacity-70" />
                  <p className="text-sm font-semibold text-white">No AI Pitch Generated</p>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Click &quot;Generate AI Pitch Pack&quot; above to synthesize a personalized cold email, LinkedIn DM, and 90s video walkthrough script.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: CONTACT & CRM */}
        <TabsContent value="outreach" className="space-y-6 m-0">
          <Card className="rounded-2xl border-white/[0.08] bg-[#0C0E18] shadow-xl overflow-hidden backdrop-blur-md">
            <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-white">
                    Contact &amp; Pipeline Coordinates
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400">
                    Decision maker contacts, geographic location, and outreach progress tracking
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">Contact Person Name</Label>
                  <Input
                    value={formData.contactName || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, contactName: e.target.value }))}
                    placeholder="e.g. Lennard Bakhuys"
                    className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">Contact Role / Title</Label>
                  <Input
                    value={formData.contactRole || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, contactRole: e.target.value }))}
                    placeholder="e.g. Projectmanager E-commerce"
                    className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">Direct Email</Label>
                  <Input
                    value={formData.contactEmail || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                    placeholder="lennard@maxaro.nl"
                    className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">LinkedIn Profile URL</Label>
                  <Input
                    value={formData.contactLinkedin || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, contactLinkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/lennard-bakhuys"
                    className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">Country</Label>
                  <Input
                    value={formData.country || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                    placeholder="e.g. Netherlands"
                    className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">City</Label>
                  <Input
                    value={formData.city || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Rotterdam"
                    className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(val) => setFormData((p) => ({ ...p, timezone: val }))}
                  >
                    <SelectTrigger className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                      <SelectItem value="Europe/Amsterdam">Europe/Amsterdam (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                      <SelectItem value="Europe/Berlin">Europe/Berlin (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/Stockholm">Europe/Stockholm (CET/CEST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (US Eastern)</SelectItem>
                      <SelectItem value="America/Chicago">America/Chicago (US Central)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (US Pacific)</SelectItem>
                      <SelectItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</SelectItem>
                      <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">Outreach Status</Label>
                  <Select
                    value={formData.outreachStatus || "not_started"}
                    onValueChange={(val) => setFormData((p) => ({ ...p, outreachStatus: val }))}
                  >
                    <SelectTrigger className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white">
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

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">Estimated Revenue Tier</Label>
                  <Input
                    value={formData.estimatedRevenueTier || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, estimatedRevenueTier: e.target.value }))}
                    placeholder="e.g. €20M - €50M"
                    className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-300">Pipeline Stage</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData((p) => ({ ...p, status: val as ProjectProspectStatus }))}
                  >
                    <SelectTrigger className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                      <SelectItem value="sourced">Sourced</SelectItem>
                      <SelectItem value="audited">Audited</SelectItem>
                      <SelectItem value="building_mvp">Building MVP</SelectItem>
                      <SelectItem value="pitch_ready">Pitch Ready</SelectItem>
                      <SelectItem value="outreach_sent">Outreach Sent</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="won">Won Deals 🚀</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* BOTTOM STICKY ACTION BAR */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 rounded-2xl border border-white/[0.1] bg-[#0C0E18]/90 backdrop-blur-xl shadow-2xl">
        <Link href="/cms/project-tracker">
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-xl h-10"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Pipeline
          </Button>
        </Link>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl gap-2 px-6 h-10 bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
