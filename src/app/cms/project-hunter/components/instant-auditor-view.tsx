"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Globe,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aiRunInstantHunterAudit, createProspect } from "@/services/project-finder/actions";
import type { ProjectAuditAnalysis, ProspectIndustry } from "@/services/project-finder/types";

export function InstantAuditorView() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState<ProspectIndustry>("home_living");
  const [country, setCountry] = useState("Netherlands");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("Europe/Amsterdam");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [auditResult, setAuditResult] = useState<ProjectAuditAnalysis | null>(null);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a valid website URL");
      return;
    }

    try {
      setIsLoading(true);
      setAuditResult(null);

      const result = await aiRunInstantHunterAudit(
        url.trim(),
        companyName.trim() || undefined,
        industry,
      );

      setAuditResult(result);
      toast.success("Modernization audit completed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to run website audit. Please verify the URL.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToTracker = async () => {
    if (!url.trim()) return;

    try {
      setIsSaving(true);
      const newProspect = await createProspect({
        companyName: companyName.trim() || new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", ""),
        companyWebsite: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`,
        industry,
        country,
        city: city.trim() || undefined,
        timezone,
        status: auditResult ? "audited" : "sourced",
        auditScore: auditResult?.modernizationOpportunityScore || 75,
        auditAnalysis: auditResult || undefined,
        notes: auditResult?.executiveSummary,
      });

      toast.success(`${newProspect.companyName} added to Project Tracker!`);
      router.push("/cms/project-tracker");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save prospect to tracker.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search / Audit Input Form */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 sm:p-6">
        <form onSubmit={handleRunAudit} className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Deep Storefront Modernization Auditor
              </h3>
            </div>
            <span className="text-[11px] font-mono text-gray-400">
              Powered by Gemini AI + Live Scraping
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">
                Storefront Website URL <span className="text-rose-400">*</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.company.nl"
                  required
                  className="pl-9 bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">Company Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Maxaro"
                className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">Industry Niche</Label>
              <Select
                value={industry}
                onValueChange={(val) => setIndustry(val as ProspectIndustry)}
              >
                <SelectTrigger className="bg-black/40 border-white/[0.1] text-xs h-9 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                  <SelectItem value="home_living">Home, Sanitary & Living</SelectItem>
                  <SelectItem value="outdoor_mobility">Outdoor & Mobility</SelectItem>
                  <SelectItem value="d2c_luxury">D2C Luxury Goods</SelectItem>
                  <SelectItem value="b2b_wholesale">B2B Wholesale Trade</SelectItem>
                  <SelectItem value="specialty_food">Specialty Food & Beverage</SelectItem>
                  <SelectItem value="other">Other High-Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Netherlands"
                className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">City / Headquarter</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Roosendaal"
                className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">Target Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
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

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-gray-400">
              Audits LCP, layout shifts, mobile touch friction, and legacy tech detection.
            </p>
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2 text-xs h-9 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditing Storefront...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  Run Deep Modernization Audit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Audit Result Display */}
      {auditResult && (
        <div className="rounded-2xl border border-primary/30 bg-[#0C0E18] p-5 sm:p-6 space-y-6 shadow-2xl">
          {/* Header Score & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  Audit Completed
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {url}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Modernization Potential Analysis
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-black text-white font-mono flex items-center justify-end gap-1">
                  <span className="text-emerald-400">{auditResult.modernizationOpportunityScore}</span>
                  <span className="text-gray-500 text-sm font-normal">/100</span>
                </div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">
                  Opportunity Score
                </div>
              </div>

              <Button
                onClick={handleSaveToTracker}
                disabled={isSaving}
                className="gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Save to Project Tracker
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
              <div className="text-[11px] text-gray-400">Mobile Speed Estimate</div>
              <div className="text-xl font-bold font-mono text-amber-400">
                {auditResult.performanceScore ?? 45}/100
              </div>
              <div className="text-[10px] text-gray-400">Noticeable LCP & hydration delays</div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
              <div className="text-[11px] text-gray-400">Mobile Friction Level</div>
              <div className="text-xl font-bold font-mono text-rose-400">
                {auditResult.mobileFrictionScore ?? 75}/100
              </div>
              <div className="text-[10px] text-gray-400">High checkout & filter drop-off</div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
              <div className="text-[11px] text-gray-400">Potential Conversion Lift</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {auditResult.estimatedConversionLift || "+18% to +26%"}
              </div>
              <div className="text-[10px] text-gray-400">By moving to instant Next.js 16 / Nuxt 4 SSR</div>
            </div>
          </div>

          {/* Technical Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Detected Legacy Stack */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Cpu className="w-4 h-4 text-amber-400" />
                Detected Legacy Architecture
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(auditResult.detectedStack || []).map((stack, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs bg-amber-500/10 text-amber-300 border-amber-500/25 py-1 px-2.5"
                  >
                    {stack}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
                Monolithic architecture requires heavy full-page reloads and creates server-side rendering lag on mobile devices.
              </p>
            </div>

            {/* Recommended Modern Stack */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Zap className="w-4 h-4 text-emerald-400" />
                Recommended Modern Stack (Next.js 16 / Nuxt 4 & Tailwind)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(auditResult.recommendedModernization || []).map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/25 py-1 px-2.5"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
                Edge SSR/ISR caching, Tailwind CSS, sub-second route transitions, and optimistic cart state ensure zero-friction checkout.
              </p>
            </div>
          </div>

          {/* Core Web Vitals & Mobile UX Friction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Core Web Vitals Pain Points
              </h4>
              <ul className="space-y-1.5">
                {(auditResult.coreWebVitalIssues || []).map((issue, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-gray-300 p-2.5 rounded-lg bg-black/30 border border-white/[0.04]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Mobile UX Friction Bottlenecks
              </h4>
              <ul className="space-y-1.5">
                {(auditResult.mobileUxPainPoints || []).map((pt, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-gray-300 p-2.5 rounded-lg bg-black/30 border border-white/[0.04]"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Executive Summary */}
          {auditResult.executiveSummary && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5">
              <div className="text-xs font-semibold text-primary">
                Executive Pitch Angle & Summary
              </div>
              <p className="text-xs text-gray-200 leading-relaxed">
                {auditResult.executiveSummary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
