"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Globe,
  Laptop,
  Linkedin,
  Loader2,
  Mail,
  Plus,
  Save,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

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
import { createProspect } from "@/services/project-finder/actions";
import type { ProspectIndustry, ProjectProspectStatus } from "@/services/project-finder/types";

export default function NewProspectPage() {
  const router = useRouter();

  // Company info
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [industry, setIndustry] = useState<ProspectIndustry>("home_living");
  const [country, setCountry] = useState("Netherlands");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("Europe/Amsterdam");
  const [status, setStatus] = useState<ProjectProspectStatus>("sourced");
  const [estimatedRevenueTier, setEstimatedRevenueTier] = useState("");

  // Contact info
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactLinkedin, setContactLinkedin] = useState("");

  // Assets & Notes
  const [mvpDemoUrl, setMvpDemoUrl] = useState("");
  const [loomVideoUrl, setLoomVideoUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Company name is required.");
      return;
    }
    if (!companyWebsite.trim()) {
      toast.error("Storefront website is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanWebsite = companyWebsite.trim().startsWith("http")
        ? companyWebsite.trim()
        : `https://${companyWebsite.trim()}`;

      const newProspect = await createProspect({
        companyName: companyName.trim(),
        companyWebsite: cleanWebsite,
        industry,
        country: country.trim() || "Netherlands",
        city: city.trim() || undefined,
        timezone,
        status,
        estimatedRevenueTier: estimatedRevenueTier.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactRole: contactRole.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactLinkedin: contactLinkedin.trim() || undefined,
        mvpDemoUrl: mvpDemoUrl.trim() || undefined,
        loomVideoUrl: loomVideoUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success(`${newProspect.companyName} added to pipeline!`);
      router.push(`/cms/project-tracker/${newProspect.id}`);
    } catch (error) {
      console.error("Failed to create prospect:", error);
      toast.error("Failed to add prospect to pipeline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 text-slate-100 max-w-5xl mx-auto">
      {/* Top Header Command Center Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-[450px] h-[220px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-1/3 w-[250px] h-[130px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/cms/project-tracker"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Pipeline</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <Briefcase size={13} className="text-primary" />
                <span>CLIENT PIPELINE CRM</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles size={12} className="text-emerald-400" />
                <span>Modernization Intake</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Add Modernization{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-primary">
                Prospect
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
              Register an e-commerce brand for storefront performance auditing, rapid Nuxt 4 / Next.js 16 MVP prototyping, and value-first outreach.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Link href="/cms/project-tracker">
              <Button
                variant="outline"
                className="rounded-xl border-white/[0.1] bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] text-xs h-10"
              >
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl gap-2 px-5 h-10 bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Prospect</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Single-Column Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: COMPANY & STOREFRONT INTELLIGENCE */}
        <Card className="rounded-2xl border-white/[0.08] bg-[#0C0E18] shadow-xl overflow-hidden backdrop-blur-md">
          <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 bg-white/[0.01]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-white">
                  Company &amp; Storefront Profile
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Target storefront details, business classification, and location coordinates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">
                  Company Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Maxaro"
                  required
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">
                  Storefront Website URL <span className="text-rose-400">*</span>
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://www.maxaro.nl"
                    required
                    className="pl-10 bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">Industry Vertical</Label>
                <Select
                  value={industry}
                  onValueChange={(val) => setIndustry(val as ProspectIndustry)}
                >
                  <SelectTrigger className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                    <SelectItem value="home_living">Home &amp; Sanitary</SelectItem>
                    <SelectItem value="outdoor_mobility">Outdoor &amp; Mobility</SelectItem>
                    <SelectItem value="d2c_luxury">D2C Luxury</SelectItem>
                    <SelectItem value="b2b_wholesale">B2B Wholesale</SelectItem>
                    <SelectItem value="specialty_food">Specialty Food</SelectItem>
                    <SelectItem value="other">Other / General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">Pipeline Stage</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as ProjectProspectStatus)}
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

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">Est. Revenue Tier</Label>
                <Input
                  value={estimatedRevenueTier}
                  onChange={(e) => setEstimatedRevenueTier(e.target.value)}
                  placeholder="e.g. €20M - €50M"
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">Country</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Netherlands"
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Rotterdam"
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
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
          </CardContent>
        </Card>

        {/* SECTION 2: KEY DECISION MAKER / CONTACT DETAILS */}
        <Card className="rounded-2xl border-white/[0.08] bg-[#0C0E18] shadow-xl overflow-hidden backdrop-blur-md">
          <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 bg-white/[0.01]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-white">
                  Decision Maker &amp; Contact Details
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Leadership contact for sending personalized performance audits &amp; prototype demos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">Contact Person Name</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Lennard Bakhuys"
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">Role / Title</Label>
                <Input
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="e.g. Projectmanager E-commerce / CTO"
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">Direct Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="lennard@maxaro.nl"
                    type="email"
                    className="pl-10 bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">LinkedIn Profile URL</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={contactLinkedin}
                    onChange={(e) => setContactLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/lennard-bakhuys"
                    className="pl-10 bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: MODERNIZATION PROTOTYPE & OBSERVATIONS */}
        <Card className="rounded-2xl border-white/[0.08] bg-[#0C0E18] shadow-xl overflow-hidden backdrop-blur-md">
          <CardHeader className="border-b border-white/[0.06] p-5 sm:p-6 bg-white/[0.01]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-white">
                  Modernization Prototype &amp; Internal Notes
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Optional MVP prototype URLs and initial performance observations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">Live Nuxt 4 / Next.js MVP Demo URL</Label>
                <Input
                  value={mvpDemoUrl}
                  onChange={(e) => setMvpDemoUrl(e.target.value)}
                  placeholder="https://wismannur.pro/showcase/maxaro"
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300">90-Second Loom Walkthrough URL</Label>
                <Input
                  value={loomVideoUrl}
                  onChange={(e) => setLoomVideoUrl(e.target.value)}
                  placeholder="https://www.loom.com/share/..."
                  className="bg-[#131726] border-white/[0.08] text-xs h-10 rounded-xl text-white placeholder:text-gray-500 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold text-gray-300">Initial Storefront Bottlenecks &amp; Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="e.g. Trustpilot score 4.7 with 34k reviews. Mobile checkout is slow due to bloated monolithic scripts. High interest in headless Nuxt 4 storefront..."
                className="bg-[#131726] border-white/[0.08] text-xs text-white placeholder:text-gray-500 rounded-xl focus:border-primary resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* BOTTOM STICKY ACTION BAR */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 rounded-2xl border border-white/[0.1] bg-[#0C0E18]/90 backdrop-blur-xl shadow-2xl">
          <Link href="/cms/project-tracker">
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-xl h-10"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Discard &amp; Return
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl gap-2 px-6 h-10 bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Prospect...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Add Prospect to Pipeline</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
