"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { atsDirectService } from "@/services";
import type {
  AtsPlatform,
  AtsTargetCompany,
  AtsVerificationResult,
} from "@/services/job-discovery/ats-direct/types";

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: AtsTargetCompany[];
  onCompanyUpdated: () => void;
}

export function AddCompanyDialog({
  open,
  onOpenChange,
  companies,
  onCompanyUpdated,
}: AddCompanyDialogProps) {
  const [urlOrSlug, setUrlOrSlug] = useState("");
  const [platform, setPlatform] = useState<AtsPlatform>("ashby");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<AtsVerificationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auto-detect when URL or slug changes
  const handleInputChange = (val: string) => {
    setUrlOrSlug(val);
    setVerification(null);

    const input = val.trim();
    if (input.includes("ashbyhq.com")) {
      setPlatform("ashby");
      const match = input.match(/ashbyhq\.com\/([^/?#]+)/i);
      if (match && match[1]) {
        const slug = match[1];
        if (!companyName) {
          setCompanyName(slug.charAt(0).toUpperCase() + slug.slice(1));
        }
      }
    } else if (input.includes("greenhouse.io")) {
      setPlatform("greenhouse");
      const match = input.match(/greenhouse\.io\/(?:v1\/boards\/)?([^/?#]+)/i);
      if (match && match[1]) {
        const slug = match[1];
        if (!companyName) {
          setCompanyName(slug.charAt(0).toUpperCase() + slug.slice(1));
        }
      }
    } else if (input.includes("lever.co")) {
      setPlatform("lever");
      const match = input.match(/lever\.co\/([^/?#]+)/i);
      if (match && match[1]) {
        const slug = match[1];
        if (!companyName) {
          setCompanyName(slug.charAt(0).toUpperCase() + slug.slice(1));
        }
      }
    }
  };

  const handleVerify = async () => {
    if (!urlOrSlug.trim()) {
      toast.error("Please enter a company career URL or slug.");
      return;
    }

    setIsVerifying(true);
    setVerification(null);
    try {
      const res = await atsDirectService.verifyTarget(urlOrSlug, platform);
      setVerification(res);
      if (res.valid) {
        setPlatform(res.platform);
        if (!companyName) {
          setCompanyName(res.slug.charAt(0).toUpperCase() + res.slug.slice(1));
        }
        toast.success(`Connected! Found ${res.jobCount} open positions.`);
      } else {
        toast.error(res.error || "Unable to verify this company ATS.");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    const slug = verification?.slug || urlOrSlug.trim();
    if (!slug) {
      toast.error("Please provide a company slug.");
      return;
    }
    if (!companyName.trim()) {
      toast.error("Please provide a company name.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await atsDirectService.saveCompany({
        name: companyName.trim(),
        platform,
        slug,
        websiteUrl: websiteUrl.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to save company.");
        return;
      }

      toast.success(`Added "${companyName}" to your Direct ATS Hub!`);
      setUrlOrSlug("");
      setCompanyName("");
      setWebsiteUrl("");
      setVerification(null);
      onCompanyUpdated();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your target companies?`)) return;

    setDeletingId(id);
    try {
      const res = await atsDirectService.deleteCompany(id);
      if (res.success) {
        toast.success(`Removed ${name}.`);
        onCompanyUpdated();
      } else {
        toast.error(res.error || "Failed to remove.");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error removing company.");
    } finally {
      setDeletingId(null);
    }
  };

  const customCompanies = companies.filter((c) => c.isCustom);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Add Target Company
              </DialogTitle>
              <DialogDescription className="text-xs">
                Connect and sync high-growth tech companies directly from their public ATS feeds.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Step 1: Input URL / Slug */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Company Career URL or Slug</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. https://jobs.ashbyhq.com/ramp or ramp"
                value={urlOrSlug}
                onChange={(e) => handleInputChange(e.target.value)}
                className="text-xs h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleVerify}
                disabled={isVerifying || !urlOrSlug.trim()}
                className="shrink-0 text-xs h-9 gap-1.5"
              >
                {isVerifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                )}
                Verify Feed
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Paste any Ashby, Greenhouse, or Lever job board link. We&apos;ll auto-detect the engine!
            </p>
          </div>

          {/* Verification Status Banner */}
          {verification && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                verification.valid
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
              }`}
            >
              {verification.valid ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 flex-1">
                <p className="font-semibold">
                  {verification.valid ? "Feed Verified Successfully!" : "Verification Failed"}
                </p>
                <p className="text-[11px] opacity-90">
                  {verification.valid
                    ? `Found ${verification.jobCount} open roles on ${verification.platform.toUpperCase()} (${verification.slug}).`
                    : verification.error}
                </p>
                {verification.sampleTitle && (
                  <p className="text-[10px] opacity-75 italic">
                    Latest role: &ldquo;{verification.sampleTitle}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Company Name</Label>
              <Input
                placeholder="e.g. Ramp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ATS Platform</Label>
              <Select
                value={platform}
                onValueChange={(v) => {
                  setPlatform(v as AtsPlatform);
                  setVerification(null);
                }}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ashby">Ashby (api.ashbyhq.com)</SelectItem>
                  <SelectItem value="greenhouse">Greenhouse (greenhouse.io)</SelectItem>
                  <SelectItem value="lever">Lever (lever.co)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Website URL (Optional)</Label>
              <Input
                placeholder="e.g. https://ramp.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !companyName.trim() || (!verification && !urlOrSlug.trim())}
              className="text-xs h-8 gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Save Target Company
            </Button>
          </div>

          {/* Custom Companies list if any exist */}
          {customCompanies.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Your Added Companies ({customCompanies.length})
                </span>
              </div>
              <div className="divide-y divide-border/50 rounded-xl border border-border/50 overflow-hidden max-h-44 overflow-y-auto">
                {customCompanies.map((c) => (
                  <div key={c.id} className="p-2.5 flex items-center justify-between gap-3 bg-card/60">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">{c.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase">
                          {c.platform}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        slug: {c.slug}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {c.websiteUrl && (
                        <a
                          href={c.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                          title="Open Website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deletingId === c.id}
                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Delete Company"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
