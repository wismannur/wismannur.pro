"use client";

import { useState, useMemo } from "react";
import {
  ArrowRight,
  Banknote,
  Calculator,
  CheckCircle2,
  Coins,
  DollarSign,
  Gift,
  Globe,
  HeartPulse,
  Info,
  Laptop,
  Loader2,
  Mail,
  Percent,
  Receipt,
  Save,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { formatSalary } from "@/lib/job-tracker";
import type { JobApplication, JobApplicationStatus } from "@/services/job-tracker/types";
import { QuickFollowUpDialog } from "./quick-follow-up-dialog";

// Live benchmark FX rates to IDR
const FX_RATES: Record<string, { rate: number; symbol: string; label: string }> = {
  IDR: { rate: 1, symbol: "Rp", label: "Indonesian Rupiah (IDR)" },
  USD: { rate: 16300, symbol: "$", label: "US Dollar (USD)" },
  SGD: { rate: 12200, symbol: "S$", label: "Singapore Dollar (SGD)" },
  EUR: { rate: 17500, symbol: "€", label: "Euro (EUR)" },
  GBP: { rate: 20800, symbol: "£", label: "British Pound (GBP)" },
  AUD: { rate: 10600, symbol: "A$", label: "Australian Dollar (AUD)" },
};

interface TabOfferingPackageProps {
  application: JobApplication;
  formData: Partial<JobApplication>;
  isSaving: boolean;
  onFormChange: (data: Partial<JobApplication>) => void;
  onSave: () => Promise<void>;
  onStatusAdvance: (status: JobApplicationStatus) => Promise<void>;
}

export function TabOfferingPackage({
  application,
  formData,
  isSaving,
  onFormChange,
  onSave,
  onStatusAdvance,
}: TabOfferingPackageProps) {
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpScenario, setFollowUpScenario] = useState<"negotiation" | "acceptance">("negotiation");

  // Interactive Compensation & Tax states
  const [contractType, setContractType] = useState<"permanent" | "contractor">("permanent");
  const [includeBpjs, setIncludeBpjs] = useState(true);
  const [bonusMonths, setBonusMonths] = useState(1.5);
  const [annualEquityUsd, setAnnualEquityUsd] = useState(0);

  const currentSalary =
    formData.salaryMax ?? application.salaryMax ?? formData.salaryMin ?? application.salaryMin ?? 0;
  const currentCurrency = (formData.salaryCurrency ?? application.salaryCurrency ?? "IDR").toUpperCase();
  const currentPeriod = formData.salaryPeriod ?? application.salaryPeriod ?? "monthly";

  // Comprehensive Net Take-Home & Tax Calculation
  const compMetrics = useMemo(() => {
    const fx = FX_RATES[currentCurrency]?.rate || 1;
    let monthlyBaseIdr = currentSalary * fx;
    if (currentPeriod === "yearly") {
      monthlyBaseIdr = (currentSalary * fx) / 12;
    } else if (currentPeriod === "hourly") {
      monthlyBaseIdr = currentSalary * fx * 160;
    }

    const annualBaseIdr = monthlyBaseIdr * 12;
    const thrIdr = contractType === "permanent" ? monthlyBaseIdr : 0;
    const bonusIdr = monthlyBaseIdr * bonusMonths;
    const annualGrossIdr = annualBaseIdr + thrIdr + bonusIdr;
    const annualEquityIdr = annualEquityUsd * FX_RATES.USD.rate;

    let monthlyTaxIdr = 0;
    let monthlyBpjsIdr = 0;

    if (contractType === "permanent") {
      // Biaya Jabatan 5% max 500k/mo (6M/yr)
      const biayaJabatanYear = Math.min(annualGrossIdr * 0.05, 6_000_000);
      // BPJS Karyawan: JHT 2% + JP 1% (cap 10.042.300) + BPJS Kes 1% (cap 12.000.000)
      if (includeBpjs && currentCurrency === "IDR") {
        const jpBase = Math.min(monthlyBaseIdr, 10_042_300);
        const kesBase = Math.min(monthlyBaseIdr, 12_000_000);
        monthlyBpjsIdr = (monthlyBaseIdr * 0.02) + (jpBase * 0.01) + (kesBase * 0.01);
      }
      const annualBpjs = monthlyBpjsIdr * 12;
      const ptkp = 54_000_000; // TK/0
      const pkp = Math.max(0, annualGrossIdr - biayaJabatanYear - annualBpjs - ptkp);

      // Progressive Indonesian PPh 21
      let taxYear = 0;
      let rem = pkp;
      if (rem > 0) {
        const b1 = Math.min(rem, 60_000_000);
        taxYear += b1 * 0.05;
        rem -= b1;
      }
      if (rem > 0) {
        const b2 = Math.min(rem, 190_000_000);
        taxYear += b2 * 0.15;
        rem -= b2;
      }
      if (rem > 0) {
        const b3 = Math.min(rem, 250_000_000);
        taxYear += b3 * 0.25;
        rem -= b3;
      }
      if (rem > 0) {
        taxYear += rem * 0.30;
      }

      monthlyTaxIdr = taxYear / 12;
    } else {
      // Contractor / Remote Freelancer (NPPN 50% Norma for Software/IT consultants)
      const netIncomeYear = annualGrossIdr * 0.5;
      const ptkp = 54_000_000;
      const pkp = Math.max(0, netIncomeYear - ptkp);
      let taxYear = 0;
      let rem = pkp;
      if (rem > 0) {
        const b1 = Math.min(rem, 60_000_000);
        taxYear += b1 * 0.05;
        rem -= b1;
      }
      if (rem > 0) {
        const b2 = Math.min(rem, 190_000_000);
        taxYear += b2 * 0.15;
        rem -= b2;
      }
      if (rem > 0) {
        taxYear += rem * 0.25;
      }
      monthlyTaxIdr = taxYear / 12;
    }

    const netMonthlyIdr = Math.max(0, monthlyBaseIdr - monthlyTaxIdr - monthlyBpjsIdr);
    const totalAnnualCompIdr = annualGrossIdr + annualEquityIdr;

    return {
      monthlyBaseIdr,
      monthlyTaxIdr,
      monthlyBpjsIdr,
      netMonthlyIdr,
      annualBaseIdr,
      thrIdr,
      bonusIdr,
      annualEquityIdr,
      totalAnnualCompIdr,
      effectiveDeductionPct:
        monthlyBaseIdr > 0 ? (((monthlyTaxIdr + monthlyBpjsIdr) / monthlyBaseIdr) * 100).toFixed(1) : "0",
    };
  }, [currentSalary, currentCurrency, currentPeriod, contractType, includeBpjs, bonusMonths, annualEquityUsd]);

  const formatIdrMillion = (val: number) => {
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} Miliar`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Juta`;
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-6">
      {/* Celebration / Status Banner */}
      <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Executive Offer & Compensation Package
              </CardTitle>
              <CardDescription className="text-xs">
                Calculate net take-home pay, progressive tax (PPh 21 / Freelance), multi-currency conversions, and equity value.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFollowUpScenario("negotiation");
                  setIsFollowUpOpen(true);
                }}
                className="text-xs font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                Draft Negotiation / Counter Email
              </Button>

              {application.status === "accepted" ? (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-3 py-1 font-bold">
                  🚀 Offer Accepted
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusAdvance("accepted")}
                  className="text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Offer as Accepted 🚀
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Quick Annual Value & Net Take-Home Grid */}
        <CardContent className="pt-0 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-500/20">
            <div className="p-3 rounded-lg bg-card/80 border border-border/60">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                Offered Gross Base
              </div>
              <div className="text-base font-bold text-foreground mt-0.5">
                {formatSalary(
                  formData.salaryMin ?? application.salaryMin,
                  formData.salaryMax ?? application.salaryMax,
                  currentCurrency,
                  currentPeriod
                )}
              </div>
              {currentCurrency !== "IDR" && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  ≈ {formatIdrMillion(compMetrics.monthlyBaseIdr)}/mo
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-card/80 border border-border/60">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                Estimated Net Take-Home (Gaji Bersih)
              </div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatIdrMillion(compMetrics.netMonthlyIdr)}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                After ~{compMetrics.effectiveDeductionPct}% tax & deductions
              </div>
            </div>

            <div className="p-3 rounded-lg bg-card/80 border border-border/60">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-blue-500" />
                Total Annual Comp (Base+THR+Bonus+Equity)
              </div>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {formatIdrMillion(compMetrics.totalAnnualCompIdr)}
                <span className="text-xs font-normal text-muted-foreground">/yr</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-card/80 border border-border/60">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                Target Role
              </div>
              <div className="text-base font-bold text-foreground mt-0.5 truncate">
                {application.jobTitle}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Compensation Elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Financial & Equity Package */}
        <Card className="border-border/80 shadow-sm space-y-4">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Base Salary & Direct Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="offeredMin" className="text-xs">
                  Min / Initial Offer
                </Label>
                <Input
                  id="offeredMin"
                  type="number"
                  placeholder="e.g. 25000000"
                  value={formData.salaryMin ?? application.salaryMin ?? ""}
                  onChange={(e) =>
                    onFormChange({
                      ...formData,
                      salaryMin: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offeredMax" className="text-xs">
                  Max / Target Offer
                </Label>
                <Input
                  id="offeredMax"
                  type="number"
                  placeholder="e.g. 30000000"
                  value={formData.salaryMax ?? application.salaryMax ?? ""}
                  onChange={(e) =>
                    onFormChange({
                      ...formData,
                      salaryMax: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="offerCurrency" className="text-xs">
                  Currency
                </Label>
                <Input
                  id="offerCurrency"
                  placeholder="IDR / USD / SGD"
                  value={formData.salaryCurrency ?? application.salaryCurrency}
                  onChange={(e) => onFormChange({ ...formData, salaryCurrency: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offerPeriod" className="text-xs">
                  Period
                </Label>
                <Input
                  id="offerPeriod"
                  placeholder="monthly / yearly"
                  value={formData.salaryPeriod ?? application.salaryPeriod}
                  onChange={(e) => onFormChange({ ...formData, salaryPeriod: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Interactive Tax & Take-Home Pay Simulator */}
        <Card className="border-border/80 shadow-sm space-y-4">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                Tax & Net Take-Home Estimator (Indonesian PPh 21 / Remote)
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Live Simulator
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {/* Employment Type & BPJS Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Employment Model</Label>
                <Select
                  value={contractType}
                  onValueChange={(v) => setContractType(v as "permanent" | "contractor")}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">🏢 Full-Time (PPh 21 + THR)</SelectItem>
                    <SelectItem value="contractor">🌐 Remote Contractor (NPPN Norma)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Performance Bonus Target</Label>
                <Select
                  value={bonusMonths.toString()}
                  onValueChange={(v) => setBonusMonths(parseFloat(v))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Bonus (0 mo)</SelectItem>
                    <SelectItem value="1">1.0 Month Base</SelectItem>
                    <SelectItem value="1.5">1.5 Months Base (Target)</SelectItem>
                    <SelectItem value="2">2.0 Months Base (High)</SelectItem>
                    <SelectItem value="3">3.0 Months Base (Exceptional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Annual Equity / RSU grant */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Annual RSU / Equity Grant ($ USD)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={annualEquityUsd || ""}
                  onChange={(e) => setAnnualEquityUsd(e.target.value ? parseInt(e.target.value) : 0)}
                  className="h-8 text-xs"
                />
              </div>

              {contractType === "permanent" && (
                <div className="flex items-center gap-2 pt-5">
                  <Checkbox
                    id="includeBpjs"
                    checked={includeBpjs}
                    onCheckedChange={(c) => setIncludeBpjs(Boolean(c))}
                  />
                  <Label htmlFor="includeBpjs" className="text-xs cursor-pointer">
                    Deduct BPJS TK & Kes (3%)
                  </Label>
                </div>
              )}
            </div>

            {/* Deductions Breakdown Table */}
            <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Gross Monthly Income ({currentCurrency}):</span>
                <span className="font-semibold text-foreground">{formatIdrMillion(compMetrics.monthlyBaseIdr)}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Est. Monthly Tax ({contractType === "permanent" ? "PPh 21" : "NPPN Norma 50%"}):</span>
                <span className="font-semibold">- {formatIdrMillion(compMetrics.monthlyTaxIdr)}</span>
              </div>
              {contractType === "permanent" && includeBpjs && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Est. Monthly BPJS Karyawan (JHT/JP/Kes):</span>
                  <span className="font-semibold">- {formatIdrMillion(compMetrics.monthlyBpjsIdr)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border/60 flex justify-between items-baseline font-bold">
                <span className="text-emerald-700 dark:text-emerald-400">Net Take-Home Pay (Gaji Bersih):</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400">
                  {formatIdrMillion(compMetrics.netMonthlyIdr)}/mo
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Offer Specifications & Negotiation Log */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Offer Letter Details & Negotiation Log
          </CardTitle>
          <CardDescription className="text-xs">
            Detailkan seluruh poin penawaran formal: tanggal mulai kerja, batas kadaluarsa surat
            penawaran (*offer deadline*), skema bonus, dan poin tawar (*counter points*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            id="offerNotes"
            rows={8}
            placeholder={`## Formal Offer Summary:
- Base Salary: Rp 28,000,000 / month (Nett/Gross)
- Annual THR: 1x Base
- Variable Performance Bonus: 1.5 - 2.5x Base (Paid in March)
- Stock Options / RSUs: $12,000 USD (4 years vesting, 1 year cliff)
- Health Insurance: Prudential / AIA Private Insurance (covers employee + spouse + 2 kids)
- Equipment: Apple MacBook Pro 16" M3 Pro
- Work Mode: 100% Remote / Hybrid 2 days in office
- Start Date: 1st of next month
- Offer Expiry Deadline: Friday, 5:00 PM WIB

## Negotiation & Counter Strategy:
- Point 1: Ask for sign-on bonus Rp 15,000,000 to offset pending annual bonus.
- Point 2: Request 20 days annual leave instead of 12.`}
            value={formData.notes ?? application.notes ?? ""}
            onChange={(e) => onFormChange({ ...formData, notes: e.target.value })}
            className="text-xs font-mono leading-relaxed"
          />

          <div className="flex justify-end pt-3 border-t">
            <Button onClick={onSave} disabled={isSaving} className="gap-1.5">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Offer Specifications
            </Button>
          </div>
        </CardContent>
      </Card>

      <QuickFollowUpDialog
        open={isFollowUpOpen}
        onOpenChange={setIsFollowUpOpen}
        application={application}
        defaultScenario={followUpScenario}
      />
    </div>
  );
}
