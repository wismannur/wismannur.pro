"use client";

import { useState, useMemo } from "react";
import {
  Banknote,
  Calculator,
  CheckCircle2,
  DollarSign,
  Loader2,
  Mail,
  Receipt,
  Save,
  ShieldCheck,
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
      <Card className="bg-gradient-to-br from-emerald-950/40 via-[#0C0E18] to-[#0C0E18] border border-emerald-500/30 shadow-2xl shadow-emerald-500/5 overflow-hidden">
        <CardHeader className="pb-4 pt-5 px-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Executive Offer & Compensation Package
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
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
                className="text-xs font-semibold bg-[#131726] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 gap-1.5 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                Draft Negotiation Email
              </Button>

              {application.status === "accepted" ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-3 py-1 font-bold">
                  🚀 Offer Accepted
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onStatusAdvance("accepted")}
                  className="text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Offer as Accepted 🚀
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Quick Annual Value & Net Take-Home Grid */}
        <CardContent className="pt-0 pb-5 px-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-500/20">
            <div className="p-3.5 rounded-xl bg-[#131726]/80 border border-white/[0.08]">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                Offered Gross Base
              </div>
              <div className="text-base font-bold text-white mt-1">
                {formatSalary(
                  formData.salaryMin ?? application.salaryMin,
                  formData.salaryMax ?? application.salaryMax,
                  currentCurrency,
                  currentPeriod
                )}
              </div>
              {currentCurrency !== "IDR" && (
                <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  ≈ {formatIdrMillion(compMetrics.monthlyBaseIdr)}/mo
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#131726]/80 border border-emerald-500/20">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                Estimated Net Take-Home (Gaji Bersih)
              </div>
              <div className="text-base font-black text-emerald-400 mt-1">
                {formatIdrMillion(compMetrics.netMonthlyIdr)}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5 font-mono">
                After ~{compMetrics.effectiveDeductionPct}% tax & deductions
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#131726]/80 border border-white/[0.08]">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Calculator className="w-3.5 h-3.5 text-sky-400" />
                Total Annual Comp (Base+THR+Bonus+Equity)
              </div>
              <div className="text-base font-bold text-sky-400 mt-1">
                {formatIdrMillion(compMetrics.totalAnnualCompIdr)}
                <span className="text-xs font-normal text-muted-foreground">/yr</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#131726]/80 border border-white/[0.08]">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                Target Role
              </div>
              <div className="text-base font-bold text-white mt-1 truncate">
                {application.jobTitle}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Compensation Elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Financial & Equity Package */}
        <Card className="bg-[#0C0E18]/80 backdrop-blur-md border border-white/[0.08] shadow-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-white/[0.06] bg-[#131726]/40 px-6 py-4">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Base Salary & Direct Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="offeredMin" className="text-xs font-semibold text-slate-300">
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
                  className="text-xs bg-[#131726] border-white/[0.08] focus:border-emerald-500/50 text-white font-mono h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offeredMax" className="text-xs font-semibold text-slate-300">
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
                  className="text-xs bg-[#131726] border-white/[0.08] focus:border-emerald-500/50 text-white font-mono h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="offerCurrency" className="text-xs font-semibold text-slate-300">
                  Currency Code
                </Label>
                <Input
                  id="offerCurrency"
                  placeholder="IDR / USD / SGD"
                  value={formData.salaryCurrency ?? application.salaryCurrency}
                  onChange={(e) => onFormChange({ ...formData, salaryCurrency: e.target.value })}
                  className="text-xs bg-[#131726] border-white/[0.08] focus:border-emerald-500/50 text-white uppercase font-mono h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offerPeriod" className="text-xs font-semibold text-slate-300">
                  Compensation Period
                </Label>
                <Input
                  id="offerPeriod"
                  placeholder="monthly / yearly"
                  value={formData.salaryPeriod ?? application.salaryPeriod}
                  onChange={(e) => onFormChange({ ...formData, salaryPeriod: e.target.value })}
                  className="text-xs bg-[#131726] border-white/[0.08] focus:border-emerald-500/50 text-white h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Interactive Tax & Take-Home Pay Simulator */}
        <Card className="bg-[#0C0E18]/80 backdrop-blur-md border border-white/[0.08] shadow-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-white/[0.06] bg-[#131726]/40 px-6 py-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Tax & Net Take-Home Estimator (Indonesian PPh 21 / Remote)
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                Live Simulator
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Employment Type & BPJS Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-300">Employment Model</Label>
                <Select
                  value={contractType}
                  onValueChange={(v) => setContractType(v as "permanent" | "contractor")}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#131726] border-white/[0.08] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C0E18] border-white/[0.12] text-slate-200">
                    <SelectItem value="permanent">🏢 Full-Time (PPh 21 + THR)</SelectItem>
                    <SelectItem value="contractor">🌐 Remote Contractor (NPPN Norma)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-300">Performance Bonus Target</Label>
                <Select
                  value={bonusMonths.toString()}
                  onValueChange={(v) => setBonusMonths(parseFloat(v))}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#131726] border-white/[0.08] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C0E18] border-white/[0.12] text-slate-200">
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
                <Label className="text-[11px] font-semibold text-slate-300">Annual RSU / Equity Grant ($ USD)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={annualEquityUsd || ""}
                  onChange={(e) => setAnnualEquityUsd(e.target.value ? parseInt(e.target.value) : 0)}
                  className="h-8 text-xs bg-[#131726] border-white/[0.08] focus:border-emerald-500/50 text-white font-mono"
                />
              </div>

              {contractType === "permanent" && (
                <div className="flex items-center gap-2 pt-5">
                  <Checkbox
                    id="includeBpjs"
                    checked={includeBpjs}
                    onCheckedChange={(c) => setIncludeBpjs(Boolean(c))}
                    className="border-white/[0.2]"
                  />
                  <Label htmlFor="includeBpjs" className="text-xs text-slate-300 cursor-pointer">
                    Deduct BPJS TK & Kes (3%)
                  </Label>
                </div>
              )}
            </div>

            {/* Deductions Breakdown Table */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#131726] space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground font-mono">
                <span>Gross Monthly Income ({currentCurrency}):</span>
                <span className="font-semibold text-white">{formatIdrMillion(compMetrics.monthlyBaseIdr)}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-mono">
                <span>Est. Monthly Tax ({contractType === "permanent" ? "PPh 21" : "NPPN Norma 50%"}):</span>
                <span className="font-semibold">- {formatIdrMillion(compMetrics.monthlyTaxIdr)}</span>
              </div>
              {contractType === "permanent" && includeBpjs && (
                <div className="flex justify-between text-amber-400 font-mono">
                  <span>Est. Monthly BPJS Karyawan (JHT/JP/Kes):</span>
                  <span className="font-semibold">- {formatIdrMillion(compMetrics.monthlyBpjsIdr)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-white/[0.08] flex justify-between items-baseline font-bold">
                <span className="text-emerald-400 font-sans">Net Take-Home Pay (Gaji Bersih):</span>
                <span className="text-base text-emerald-400 font-mono">
                  {formatIdrMillion(compMetrics.netMonthlyIdr)}/mo
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Offer Specifications & Negotiation Log */}
      <Card className="bg-[#0C0E18]/80 backdrop-blur-md border border-white/[0.08] shadow-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/[0.06] bg-[#131726]/40 px-6 py-4">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Offer Letter Details & Negotiation Log
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Detail formal offer points: start date, expiry deadline, bonus structure, benefits, and counter points.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
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
            className="text-xs font-mono leading-relaxed bg-[#131726] border-white/[0.08] focus:border-indigo-500/50 text-slate-200"
          />

          <div className="flex justify-end pt-3 border-t border-white/[0.08]">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-xs shadow-lg shadow-indigo-500/25"
            >
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
