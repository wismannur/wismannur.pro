"use client";

import React, { useState } from "react";
import {
  Building2,
  Sparkles,
  Star,
  ExternalLink,
  Layers,
  ShoppingBag,
  Lightbulb,
  Edit3,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { jobTrackerService } from "@/services";
import type { CompanyIntelligence, JobApplication } from "@/services/job-tracker/types";

interface CompanyIntelligenceCardProps {
  application: JobApplication;
  onUpdate: (updated: Partial<JobApplication>) => Promise<void>;
}

export function CompanyIntelligenceCard({ application, onUpdate }: CompanyIntelligenceCardProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const intelligence: CompanyIntelligence = application.companyIntelligence || {};
  const reputation = intelligence.reputation || {};

  // Form state for manual editing
  const [editForm, setEditForm] = useState<CompanyIntelligence>(intelligence);

  const handleEnrichWithAI = async () => {
    setIsEnriching(true);
    try {
      toast.info(`Gathering intelligence on ${application.companyName}...`);
      const enriched = await jobTrackerService.aiEnrichCompanyIntelligence({
        companyName: application.companyName,
        companyWebsite: application.companyWebsite,
        jobTitle: application.jobTitle,
        location: application.location,
        jobDescriptionRaw: application.jobDescriptionRaw,
      });

      // Preserve existing manual Trustpilot score if present
      const merged: CompanyIntelligence = {
        ...enriched,
        reputation: {
          ...enriched.reputation,
          ...(intelligence.reputation?.trustpilotScore
            ? {
                trustpilotScore: intelligence.reputation.trustpilotScore,
                trustpilotReviewsCount: intelligence.reputation.trustpilotReviewsCount,
                trustpilotUrl: intelligence.reputation.trustpilotUrl,
              }
            : {}),
        },
      };

      await onUpdate({
        companyIntelligence: merged,
      });

      toast.success("Company Intelligence updated with AI insights!");
    } catch (err) {
      console.error("Failed to enrich company intelligence:", err);
      toast.error("Failed to enrich company data. Please try again or edit manually.");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSaveManualEdit = async () => {
    try {
      await onUpdate({
        companyIntelligence: editForm,
      });
      setIsEditDialogOpen(false);
      toast.success("Company dossier updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    }
  };

  return (
    <>
      <Card className="border border-white/[0.08] bg-[#0C0E18]/85 backdrop-blur-xl shadow-xl">
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  Company Intelligence & Reputation Dossier
                  {reputation.trustpilotScore && (
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] px-2 py-0.5">
                      <Star className="w-3 h-3 fill-emerald-400 text-emerald-400 mr-1 inline" />
                      {reputation.trustpilotScore} / 5 Trustpilot
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Strategic reconnaissance, customer trust benchmarks, and interview talking points
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditForm(intelligence);
                setIsEditDialogOpen(true);
              }}
              className="h-8 text-xs border-white/[0.08] hover:bg-white/[0.05] text-slate-300"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              Edit Dossier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnrichWithAI}
              disabled={isEnriching}
              className="h-8 text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
            >
              {isEnriching ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              )}
              {intelligence.businessModel ? "Refresh AI Recon" : "Auto-Enrich with AI"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Top Banner: Reputation & Business Model */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Reputation Box */}
            <div className="md:col-span-4 rounded-2xl bg-gradient-to-br from-[#121526] to-[#0D101E] border border-white/[0.08] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Customer & Brand Trust
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {reputation.trustpilotScore ? reputation.trustpilotScore : "—"}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                  {reputation.ratingLabel && (
                    <Badge variant="outline" className="text-[10px] ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      {reputation.ratingLabel}
                    </Badge>
                  )}
                </div>
                {reputation.trustpilotReviewsCount && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Based on{" "}
                    <strong className="text-slate-200">
                      {reputation.trustpilotReviewsCount.toLocaleString()}+ verified reviews
                    </strong>
                  </p>
                )}
                {reputation.notes && (
                  <p className="text-xs text-slate-300 mt-3 pt-2.5 border-t border-white/[0.06] italic">
                    &ldquo;{reputation.notes}&rdquo;
                  </p>
                )}
              </div>

              {reputation.trustpilotUrl && (
                <a
                  href={reputation.trustpilotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium transition-colors"
                >
                  View live reviews on Trustpilot <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Business Model & Core Offerings */}
            <div className="md:col-span-8 rounded-2xl bg-[#121526]/70 border border-white/[0.08] p-4 space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Business Model & Operations
                </div>
                <p className="text-sm text-slate-200 mt-2 font-medium leading-relaxed">
                  {intelligence.businessModel ||
                    "No business model description yet. Click 'Auto-Enrich with AI' to analyze their business & storefront operations."}
                </p>
              </div>

              {intelligence.coreOfferings && intelligence.coreOfferings.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <ShoppingBag className="w-3 h-3 text-indigo-400" /> Core Offerings & Catalog
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {intelligence.coreOfferings.map((offering, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] text-xs font-normal"
                      >
                        {offering}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detected Tech Stack */}
          {intelligence.detectedTechStack && intelligence.detectedTechStack.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1120] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> Detected Live Storefront Tech Stack
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Storefront & Infrastructure</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {intelligence.detectedTechStack.map((tech, idx) => (
                  <Badge
                    key={idx}
                    className="bg-indigo-500/10 text-indigo-300 border-indigo-500/25 px-2.5 py-1 text-xs font-mono"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Talking Points (Interview Cheat-Sheet) */}
          {intelligence.strategicTalkingPoints && intelligence.strategicTalkingPoints.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-amber-400" /> Strategic Interview Talking Points (&ldquo;Cheat-Sheet&rdquo;)
              </div>
              <div className="space-y-2">
                {intelligence.strategicTalkingPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl bg-[#0F111D] border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Company Dossier</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Refine intelligence, reputation benchmarks, and talking points for {application.companyName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Trustpilot Rating</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 4.6"
                  value={editForm.reputation?.trustpilotScore || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      reputation: {
                        ...editForm.reputation,
                        trustpilotScore: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  className="bg-black/30 border-slate-700 h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reviews Count</Label>
                <Input
                  type="number"
                  placeholder="e.g. 24000"
                  value={editForm.reputation?.trustpilotReviewsCount || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      reputation: {
                        ...editForm.reputation,
                        trustpilotReviewsCount: parseInt(e.target.value, 10) || undefined,
                      },
                    })
                  }
                  className="bg-black/30 border-slate-700 h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Trustpilot URL</Label>
              <Input
                placeholder="https://www.trustpilot.com/review/..."
                value={editForm.reputation?.trustpilotUrl || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    reputation: {
                      ...editForm.reputation,
                      trustpilotUrl: e.target.value,
                    },
                  })
                }
                className="bg-black/30 border-slate-700 h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reputation Summary / Sentiment Note</Label>
              <Input
                placeholder="e.g. Known for top-tier customer service and direct stock delivery."
                value={editForm.reputation?.notes || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    reputation: {
                      ...editForm.reputation,
                      notes: e.target.value,
                    },
                  })
                }
                className="bg-black/30 border-slate-700 h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Business Model</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Omnichannel retailer specializing in sanitary ware and tiles with large showrooms."
                value={editForm.businessModel || ""}
                onChange={(e) => setEditForm({ ...editForm, businessModel: e.target.value })}
                className="bg-black/30 border-slate-700 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Detected Tech Stack (comma separated)</Label>
              <Input
                placeholder="Vue.js, Nuxt 4, Nitro, Tailwind CSS, TypeScript"
                value={(editForm.detectedTechStack || []).join(", ")}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    detectedTechStack: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                className="bg-black/30 border-slate-700 h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Core Offerings (comma separated)</Label>
              <Input
                placeholder="Complete Bathrooms, Walk-in Showers, Bathtubs, Ceramic Tiles"
                value={(editForm.coreOfferings || []).join(", ")}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    coreOfferings: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                className="bg-black/30 border-slate-700 h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Headquarters Timezone (IANA)</Label>
              <Input
                placeholder="Europe/Amsterdam"
                value={editForm.timezone || ""}
                onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                className="bg-black/30 border-slate-700 h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Strategic Talking Points (1 per line)</Label>
              <Textarea
                rows={4}
                placeholder="Paste talking points, 1 per line..."
                value={(editForm.strategicTalkingPoints || []).join("\n")}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    strategicTalkingPoints: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="bg-black/30 border-slate-700 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveManualEdit} className="bg-indigo-600 hover:bg-indigo-500">
              Save Dossier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
