"use client";

import { useMemo } from "react";
import {
	Banknote,
	Calculator,
	CheckCircle2,
	DollarSign,
	Gift,
	HeartPulse,
	Laptop,
	Loader2,
	Save,
	ShieldCheck,
	Sparkles,
	TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatSalary } from "@/lib/job-tracker";
import type { JobApplication, JobApplicationStatus } from "@/services/job-tracker/types";

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
	const currentSalary = formData.salaryMax ?? application.salaryMax ?? formData.salaryMin ?? application.salaryMin ?? 0;
	const currentCurrency = formData.salaryCurrency ?? application.salaryCurrency ?? "IDR";
	const currentPeriod = formData.salaryPeriod ?? application.salaryPeriod ?? "monthly";

	const estimatedAnnual = useMemo(() => {
		if (!currentSalary) return 0;
		if (currentPeriod === "yearly") return currentSalary;
		if (currentPeriod === "monthly") return currentSalary * 13; // 12 months + 1 month THR
		return currentSalary * 2080; // hourly to 40hrs/wk * 52 wks
	}, [currentSalary, currentPeriod]);

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
								Break down base compensation, performance bonuses, stock options, health benefits, and negotiation strategy.
							</CardDescription>
						</div>

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
				</CardHeader>

				{/* Quick Annual Value Estimator */}
				<CardContent className="pt-0 pb-4">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-500/20">
						<div className="p-3 rounded-lg bg-card/80 border border-border/60">
							<div className="text-[11px] text-muted-foreground flex items-center gap-1">
								<Banknote className="w-3.5 h-3.5 text-emerald-500" />
								Offered Base Compensation
							</div>
							<div className="text-base font-bold text-foreground mt-0.5">
								{formatSalary(
									formData.salaryMin ?? application.salaryMin,
									formData.salaryMax ?? application.salaryMax,
									currentCurrency,
									currentPeriod,
								)}
							</div>
						</div>

						<div className="p-3 rounded-lg bg-card/80 border border-border/60">
							<div className="text-[11px] text-muted-foreground flex items-center gap-1">
								<Calculator className="w-3.5 h-3.5 text-blue-500" />
								Est. Annual Value (Base + 13th THR)
							</div>
							<div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
								{estimatedAnnual > 0
									? `${currentCurrency} ${currentCurrency === "IDR" ? (estimatedAnnual >= 1_000_000 ? `${(estimatedAnnual / 1_000_000).toFixed(1)}jt` : estimatedAnnual.toLocaleString("id-ID")) : estimatedAnnual.toLocaleString()}/yr`
									: "Pending details"}
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
								<Label htmlFor="offeredMin" className="text-xs">Min / Initial Offer</Label>
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
								<Label htmlFor="offeredMax" className="text-xs">Max / Target Offer</Label>
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
								<Label htmlFor="offerCurrency" className="text-xs">Currency</Label>
								<Input
									id="offerCurrency"
									placeholder="IDR / USD / SGD"
									value={formData.salaryCurrency ?? application.salaryCurrency}
									onChange={(e) => onFormChange({ ...formData, salaryCurrency: e.target.value })}
									className="text-xs"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="offerPeriod" className="text-xs">Period</Label>
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

				{/* Column 2: Benefits & Perks Reference */}
				<Card className="border-border/80 shadow-sm space-y-4">
					<CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<Gift className="w-4 h-4 text-purple-500" />
							Standard Executive Benefit Checklist
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2.5 text-xs text-muted-foreground">
						<div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
							<HeartPulse className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold text-foreground">Health & Dental:</span> BPJS Ketenagakerjaan & Kesehatan + Private Inpatient/Outpatient/Dental.
							</div>
						</div>

						<div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
							<Laptop className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold text-foreground">Hardware & Remote:</span> High-tier Laptop (MacBook Pro / ThinkPad) + Home Office Setup allowance.
							</div>
						</div>

						<div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
							<Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
							<div>
								<span className="font-semibold text-foreground">Annual Bonus & THR:</span> 1 Month THR (Mandatory) + 1-3 Months KPI Performance Bonus.
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
						Detailkan seluruh poin penawaran formal: tanggal mulai kerja, batas kadaluarsa surat penawaran (*offer deadline*), skema bonus, dan poin tawar (*counter points*).
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
							{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
							Save Offer Specifications
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
