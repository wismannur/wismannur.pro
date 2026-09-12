"use client";

import { useState } from "react";
import { Globe, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProspect } from "@/services/project-finder/actions";
import type { ProjectProspect, ProspectIndustry } from "@/services/project-finder/types";

interface NewProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProspectCreated: (created: ProjectProspect) => void;
}

export function NewProspectDialog({
  open,
  onOpenChange,
  onProspectCreated,
}: NewProspectDialogProps) {
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [industry, setIndustry] = useState<ProspectIndustry>("home_living");
  const [country, setCountry] = useState("Netherlands");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("Europe/Amsterdam");
  const [estimatedRevenueTier, setEstimatedRevenueTier] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactLinkedin, setContactLinkedin] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyWebsite.trim()) {
      toast.error("Company name and website are required.");
      return;
    }

    try {
      setIsLoading(true);
      const newProspect = await createProspect({
        companyName: companyName.trim(),
        companyWebsite: companyWebsite.trim().startsWith("http")
          ? companyWebsite.trim()
          : `https://${companyWebsite.trim()}`,
        industry,
        country: country.trim() || "Netherlands",
        city: city.trim() || undefined,
        timezone,
        status: "sourced",
        estimatedRevenueTier: estimatedRevenueTier.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactRole: contactRole.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactLinkedin: contactLinkedin.trim() || undefined,
      });

      onProspectCreated(newProspect);
      toast.success(`${newProspect.companyName} added to pipeline!`);
      onOpenChange(false);

      // Reset form
      setCompanyName("");
      setCompanyWebsite("");
      setCity("");
      setContactName("");
      setContactRole("");
      setContactEmail("");
      setContactLinkedin("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create prospect.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#08090C] border-white/[0.1] text-white p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="p-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Plus className="w-4 h-4" />
            </span>
            Add Modernization Prospect
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">
                Company Name <span className="text-rose-400">*</span>
              </Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Maxaro"
                required
                className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">
                Storefront Website <span className="text-rose-400">*</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <Input
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://www.company.nl"
                  required
                  className="pl-8 bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <SelectItem value="home_living">Home & Sanitary</SelectItem>
                  <SelectItem value="outdoor_mobility">Outdoor & Mobility</SelectItem>
                  <SelectItem value="d2c_luxury">D2C Luxury Goods</SelectItem>
                  <SelectItem value="b2b_wholesale">B2B Wholesale</SelectItem>
                  <SelectItem value="specialty_food">Specialty Food</SelectItem>
                  <SelectItem value="other">Other High-Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <Label className="text-xs text-gray-300 font-medium">City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Roosendaal"
                className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">Timezone</Label>
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

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-medium">Revenue Tier</Label>
              <Input
                value={estimatedRevenueTier}
                onChange={(e) => setEstimatedRevenueTier(e.target.value)}
                placeholder="e.g. €20M - €50M"
                className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
              />
            </div>
          </div>

          <div className="border-t border-white/[0.08] pt-3 space-y-3">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              Contact Details (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300 font-medium">Decision Maker Name</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Lennard Bakhuys"
                  className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300 font-medium">Role / Title</Label>
                <Input
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="e.g. Projectmanager E-commerce"
                  className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300 font-medium">Email</Label>
                <Input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@company.nl"
                  className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300 font-medium">LinkedIn URL</Label>
                <Input
                  value={contactLinkedin}
                  onChange={(e) => setContactLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="bg-black/40 border-white/[0.1] text-xs h-9 text-white focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 bg-[#0C0E18] border-white/[0.1] text-gray-300 hover:bg-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2 text-xs h-9 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Tracker
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
