"use client";

import { useState } from "react";
import { Sparkles, Loader2, Link2, FileText, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jobTrackerService } from "@/services";
import type {
	JobEmploymentType,
	JobPlatform,
	NewJobApplication,
	WorkplaceType,
} from "@/services/job-tracker/types";

interface SmartJobImporterDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function SmartJobImporterDialog({
	open,
	onOpenChange,
	onSuccess,
}: SmartJobImporterDialogProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"ai_import" | "manual">("ai_import");
	const [isExtracting, setIsExtracting] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Raw input for AI
	const [rawContent, setRawContent] = useState("");
	const [jobUrl, setJobUrl] = useState("");

	// Form state
	const [formData, setFormData] = useState<NewJobApplication>({
		companyName: "",
		jobTitle: "",
		platform: "linkedin",
		jobUrl: "",
		companyWebsite: "",
		location: "",
		workplaceType: "remote",
		jobType: "full_time",
		salaryMin: undefined,
		salaryMax: undefined,
		salaryCurrency: "IDR",
		salaryPeriod: "monthly",
		jobDescriptionRaw: "",
		requirements: [],
		status: "wishlist",
		sortOrder: 0,
		notes: "",
	});

	const [requirementsInput, setRequirementsInput] = useState("");

	const handleAiExtract = async () => {
		const contentToAnalyze = rawContent.trim() || jobUrl.trim();
		if (!contentToAnalyze) {
			toast.error("Please paste the job description text or job posting URL first.");
			return;
		}

		setIsExtracting(true);
		try {
			const promptPayload = jobUrl.trim()
				? `Job Posting URL: ${jobUrl}\n\nContent:\n${rawContent}`
				: rawContent;

			const parsed = await jobTrackerService.aiParseJob(promptPayload);

			setFormData((prev) => ({
				...prev,
				companyName: parsed.companyName || prev.companyName,
				jobTitle: parsed.jobTitle || prev.jobTitle,
				platform: parsed.platform || prev.platform,
				jobUrl: jobUrl || prev.jobUrl,
				companyWebsite: parsed.companyWebsite || prev.companyWebsite,
				location: parsed.location || prev.location,
				workplaceType: parsed.workplaceType || prev.workplaceType,
				jobType: parsed.jobType || prev.jobType,
				salaryMin: parsed.salaryMin ?? prev.salaryMin,
				salaryMax: parsed.salaryMax ?? prev.salaryMax,
				salaryCurrency: parsed.salaryCurrency || prev.salaryCurrency,
				salaryPeriod: parsed.salaryPeriod || prev.salaryPeriod,
				jobDescriptionRaw: parsed.jobDescriptionRaw || prev.jobDescriptionRaw,
				requirements: parsed.requirements || prev.requirements,
				contactName: parsed.contactName || prev.contactName,
				contactEmail: parsed.contactEmail || prev.contactEmail,
			}));

			setRequirementsInput(
				(parsed.requirements || []).join("\n"),
			);

			toast.success("Job details extracted successfully with Gemini AI! Review and save.");
			setActiveTab("manual");
		} catch (error: unknown) {
			console.error("AI extraction error:", error);
			toast.error((error as Error).message || "Failed to extract job details with AI. Please check your Gemini API key or fill manually.");
		} finally {
			setIsExtracting(false);
		}
	};

	const handleSave = async (openTailorAfterSave = false) => {
		if (!formData.companyName.trim() || !formData.jobTitle.trim()) {
			toast.error("Company name and Job title are required.");
			return;
		}

		setIsSaving(true);
		try {
			const reqs = requirementsInput
				.split("\n")
				.map((r) => r.trim())
				.filter(Boolean);

			const newId = await jobTrackerService.create({
				...formData,
				requirements: reqs.length > 0 ? reqs : formData.requirements,
			});

			toast.success("Job application saved to tracker!");
			onOpenChange(false);
			if (onSuccess) onSuccess();

			if (openTailorAfterSave) {
				router.push(`/cms/job-tracker/${newId}?tab=tailor`);
			}
		} catch (error: unknown) {
			console.error("Save job error:", error);
			toast.error("Failed to save job application.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<div className="p-2 rounded-lg bg-primary/10 text-primary">
							<Sparkles className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-xl">Add & Track Job Opportunity</DialogTitle>
							<DialogDescription>
								Import with Gemini AI or enter the job vacancy details manually
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-2">
					<TabsList className="grid grid-cols-2 w-full">
						<TabsTrigger value="ai_import" className="flex items-center gap-2">
							<Sparkles className="w-4 h-4 text-primary" />
							Smart AI Importer
						</TabsTrigger>
						<TabsTrigger value="manual" className="flex items-center gap-2">
							<FileText className="w-4 h-4" />
							Job Form Details
						</TabsTrigger>
					</TabsList>

					<TabsContent value="ai_import" className="space-y-4 pt-3">
						<div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm space-y-2">
							<div className="font-semibold flex items-center gap-1.5 text-primary">
								<Sparkles className="w-4 h-4" />
								Gemini AI Quick Extractor
							</div>
							<p className="text-muted-foreground text-xs leading-relaxed">
								Copy & paste the entire job post (from LinkedIn, Jobstreet, Glints, Tech in Asia, or Career Portal) or paste the job link. Gemini AI will automatically structure the role, company, salary, tech requirements, and workplace setting.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="jobUrl" className="flex items-center gap-1.5">
								<Link2 className="w-3.5 h-3.5" />
								Job Posting URL (Optional)
							</Label>
							<Input
								id="jobUrl"
								placeholder="https://www.linkedin.com/jobs/view/..."
								value={jobUrl}
								onChange={(e) => setJobUrl(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="rawContent">Job Description Text / Vacancy Content</Label>
							<Textarea
								id="rawContent"
								placeholder="Paste the full job description text, requirements, responsibilities, and company details here..."
								rows={8}
								value={rawContent}
								onChange={(e) => setRawContent(e.target.value)}
								className="resize-none text-xs font-mono"
							/>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setActiveTab("manual")}
							>
								Fill Form Manually
							</Button>
							<Button
								type="button"
								onClick={handleAiExtract}
								disabled={isExtracting || (!rawContent.trim() && !jobUrl.trim())}
								className="gap-2"
							>
								{isExtracting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Extracting with Gemini AI...
									</>
								) : (
									<>
										<Sparkles className="w-4 h-4" />
										Extract & Autofill
									</>
								)}
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="manual" className="space-y-4 pt-3">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="jobTitle">Job Title / Role *</Label>
								<Input
									id="jobTitle"
									placeholder="e.g. Senior Frontend Engineer"
									value={formData.jobTitle}
									onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="companyName">Company Name *</Label>
								<Input
									id="companyName"
									placeholder="e.g. Google / GoTo / Tech Corp"
									value={formData.companyName}
									onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="platform">Source Platform</Label>
								<Select
									value={formData.platform}
									onValueChange={(v) => setFormData({ ...formData, platform: v as JobPlatform })}
								>
									<SelectTrigger id="platform">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="linkedin">LinkedIn</SelectItem>
										<SelectItem value="jobstreet">Jobstreet</SelectItem>
										<SelectItem value="glints">Glints</SelectItem>
										<SelectItem value="techinasia">Tech in Asia</SelectItem>
										<SelectItem value="indeed">Indeed</SelectItem>
										<SelectItem value="company_website">Company Website</SelectItem>
										<SelectItem value="referral">Referral</SelectItem>
										<SelectItem value="other">Other</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="workplaceType">Workplace Setting</Label>
								<Select
									value={formData.workplaceType}
									onValueChange={(v) => setFormData({ ...formData, workplaceType: v as WorkplaceType })}
								>
									<SelectTrigger id="workplaceType">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="remote">Remote 🌐</SelectItem>
										<SelectItem value="hybrid">Hybrid 🏢</SelectItem>
										<SelectItem value="onsite">On-site 📍</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="jobType">Employment Type</Label>
								<Select
									value={formData.jobType}
									onValueChange={(v) => setFormData({ ...formData, jobType: v as JobEmploymentType })}
								>
									<SelectTrigger id="jobType">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="full_time">Full-time</SelectItem>
										<SelectItem value="contract">Contract</SelectItem>
										<SelectItem value="part_time">Part-time</SelectItem>
										<SelectItem value="freelance">Freelance</SelectItem>
										<SelectItem value="internship">Internship</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="location">Location</Label>
								<Input
									id="location"
									placeholder="e.g. Jakarta, Indonesia (or Worldwide)"
									value={formData.location || ""}
									onChange={(e) => setFormData({ ...formData, location: e.target.value })}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="status">Initial Status</Label>
								<Select
									value={formData.status}
									onValueChange={(v) => setFormData({ ...formData, status: v as any })}
								>
									<SelectTrigger id="status">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="wishlist">Wishlist / Sourced</SelectItem>
										<SelectItem value="applied">Applied (Submit Today)</SelectItem>
										<SelectItem value="screening">Screening / OA</SelectItem>
										<SelectItem value="interview_hr">HR Interview</SelectItem>
										<SelectItem value="interview_tech">Technical Interview</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="salaryMin">Min Salary</Label>
								<Input
									id="salaryMin"
									type="number"
									placeholder="e.g. 15000000"
									value={formData.salaryMin || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											salaryMin: e.target.value ? parseInt(e.target.value) : undefined,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="salaryMax">Max Salary</Label>
								<Input
									id="salaryMax"
									type="number"
									placeholder="e.g. 25000000"
									value={formData.salaryMax || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											salaryMax: e.target.value ? parseInt(e.target.value) : undefined,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="salaryCurrency">Currency</Label>
								<Input
									id="salaryCurrency"
									placeholder="IDR / USD"
									value={formData.salaryCurrency}
									onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="requirements">Key Requirements / Tech Stack (1 per line)</Label>
							<Textarea
								id="requirements"
								placeholder="React / Next.js&#10;TypeScript&#10;Tailwind CSS&#10;State Management (Zustand/Redux)"
								rows={4}
								value={requirementsInput}
								onChange={(e) => setRequirementsInput(e.target.value)}
								className="text-xs"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="jobDescriptionRaw">Job Description Summary (Markdown)</Label>
							<Textarea
								id="jobDescriptionRaw"
								placeholder="Role summary, responsibilities, and about the team..."
								rows={4}
								value={formData.jobDescriptionRaw || ""}
								onChange={(e) => setFormData({ ...formData, jobDescriptionRaw: e.target.value })}
								className="text-xs"
							/>
						</div>

						<DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSaving}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="secondary"
								onClick={() => handleSave(true)}
								disabled={isSaving}
								className="gap-1.5"
							>
								Save & Open AI Tailor
								<ArrowRight className="w-4 h-4" />
							</Button>
							<Button
								type="button"
								onClick={() => handleSave(false)}
								disabled={isSaving}
								className="gap-1.5"
							>
								{isSaving ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Check className="w-4 h-4" />
								)}
								Save Job
							</Button>
						</DialogFooter>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
