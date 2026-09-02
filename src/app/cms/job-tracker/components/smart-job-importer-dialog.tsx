"use client";

import { useState } from "react";
import { Sparkles, Loader2, Link2, FileText, Check, ArrowRight, Bookmark, Copy } from "lucide-react";
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
	JobApplicationStatus,
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

const BOOKMARKLET_CODE = `javascript:(function(){const t=document.title||'',u=window.location.href,s=window.getSelection().toString().trim(),c=s||document.body.innerText.slice(0,15000);const p=JSON.stringify({url:u,title:t,content:c});navigator.clipboard.writeText(p).then(()=>{alert('✅ Job extracted to clipboard!\\n\\nOpen Career Hub and paste into Smart AI Importer.')}).catch(()=>{prompt('Copy this job data for Career Hub:',p)})})();`;

export function SmartJobImporterDialog({
	open,
	onOpenChange,
	onSuccess,
}: SmartJobImporterDialogProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"ai_import" | "manual" | "bookmarklet">("ai_import");
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

				<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ai_import" | "manual" | "bookmarklet")} className="mt-2">
					<TabsList className="grid grid-cols-3 w-full">
						<TabsTrigger value="ai_import" className="flex items-center gap-1.5 text-xs">
							<Sparkles className="w-4 h-4 text-primary" />
							Smart AI Importer
						</TabsTrigger>
						<TabsTrigger value="manual" className="flex items-center gap-1.5 text-xs">
							<FileText className="w-4 h-4" />
							Job Form Details
						</TabsTrigger>
						<TabsTrigger value="bookmarklet" className="flex items-center gap-1.5 text-xs">
							<Bookmark className="w-4 h-4 text-purple-500" />
							1-Click Bookmarklet
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
								placeholder="Paste the full job description text, requirements, responsibilities, and company details here (or paste bookmarklet output)..."
								rows={8}
								value={rawContent}
								onChange={(e) => {
									const text = e.target.value;
									setRawContent(text);
									if (text.trim().startsWith("{") && text.includes('"url"') && text.includes('"content"')) {
										try {
											const parsed = JSON.parse(text);
											if (parsed.url && !jobUrl) setJobUrl(parsed.url);
											if (parsed.content) {
												setRawContent(parsed.content);
												toast.success("Bookmarklet JSON detected! Autofilled URL and content.");
											}
										} catch {
											// Keep original text if parse fails
										}
									}
								}}
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

					{/* TAB 3: BROWSER BOOKMARKLET */}
					<TabsContent value="bookmarklet" className="space-y-4 pt-3 text-xs">
						<div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
							<div className="font-semibold text-sm text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
								<Bookmark className="w-4 h-4" />
								1-Click Job Scraping Bookmarklet
							</div>
							<p className="text-muted-foreground leading-relaxed">
								Drag this button to your browser’s Bookmarks Bar. When browsing any job vacancy on LinkedIn, Jobstreet, Glints, Greenhouse, or Lever, click the bookmark to grab the vacancy text and URL in 1 click!
							</p>
						</div>

						<div className="p-6 rounded-xl border border-border/80 bg-card flex flex-col items-center justify-center text-center space-y-4">
							<div className="text-xs text-muted-foreground font-medium">
								👇 Drag this button to your Bookmarks Bar (Ctrl/Cmd + Shift + B)
							</div>

							<a
								href={BOOKMARKLET_CODE}
								onClick={(e) => {
									e.preventDefault();
									toast.info("Drag this button up to your browser's Bookmarks Bar to install!");
								}}
								className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-grab select-none active:scale-95 transition-all"
								title="Drag me to your Bookmarks Bar"
							>
								<Bookmark className="w-4 h-4" />
								📌 Import to Career Hub
							</a>

							<div className="pt-2 flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										navigator.clipboard.writeText(BOOKMARKLET_CODE);
										toast.success("Bookmarklet code copied to clipboard!");
									}}
									className="gap-1.5 text-xs h-8"
								>
									<Copy className="w-3.5 h-3.5" />
									Copy Bookmarklet JavaScript
								</Button>
							</div>
						</div>

						<div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
							<div className="font-bold text-foreground">💡 How to use:</div>
							<ol className="list-decimal list-inside space-y-1 text-muted-foreground">
								<li>Open any job posting on <strong>LinkedIn, Jobstreet, Glints, Indeed, or Greenhouse</strong>.</li>
								<li>Click the <strong>📌 Import to Career Hub</strong> bookmark in your browser bar.</li>
								<li>It copies the job title, URL, and full vacancy description to your clipboard.</li>
								<li>Come back here, paste it into the <strong>Smart AI Importer</strong>, and click <strong>Extract & Autofill</strong>!</li>
							</ol>
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
									onValueChange={(v) => setFormData({ ...formData, status: v as JobApplicationStatus })}
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
