"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	Building2,
	Calendar,
	Check,
	CheckCircle2,
	Clock,
	Copy,
	ExternalLink,
	FileText,
	HelpCircle,
	Lightbulb,
	Loader2,
	MapPin,
	MessageSquare,
	Pencil,
	Plus,
	Save,
	Send,
	SendHorizontal,
	Sparkles,
	Trash2,
	Users,
	Video,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { jobTrackerService, jobOutreachService } from "@/services";
import {

	JOB_PLATFORM_CONFIG,
	JOB_STATUS_CONFIG,
	WORKPLACE_CONFIG,
	EMPLOYMENT_TYPE_CONFIG,
	INTERVIEW_STAGE_CONFIG,
	INTERVIEW_STATUS_CONFIG,
	formatSalary,
	getAtsScoreColor,
} from "@/lib/job-tracker";

import { formatDate, cn } from "@/lib/utils";

import type {
	InterviewStageType,
	InterviewStatus,
	JobApplication,
	JobApplicationStatus,
	JobEmploymentType,
	JobPlatform,
	NewJobInterview,
	WorkplaceType,
} from "@/services/job-tracker/types";

const STAGE_STEPPER: { status: JobApplicationStatus; label: string }[] = [
	{ status: "wishlist", label: "Wishlist" },
	{ status: "applied", label: "Applied" },
	{ status: "screening", label: "Screening" },
	{ status: "interview_hr", label: "HR Interview" },
	{ status: "interview_tech", label: "Tech Interview" },
	{ status: "interview_user", label: "Final Interview" },
	{ status: "offering", label: "Offering" },
	{ status: "accepted", label: "Accepted" },
];

export function JobApplicationDetail({ initialId }: { initialId: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const defaultTab = searchParams.get("tab") || "tailor";

	const [activeTab, setActiveTab] = useState(defaultTab);
	const [isSaving, setIsSaving] = useState(false);
	const [isAnalyzingATS, setIsAnalyzingATS] = useState(false);
	const [isParsingInvite, setIsParsingInvite] = useState(false);
	const [isGeneratingPrep, setIsGeneratingPrep] = useState<string | null>(null);

	// Dialog states
	const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
	const [rawInviteText, setRawInviteText] = useState("");
	const [isAddInterviewDialogOpen, setIsAddInterviewDialogOpen] = useState(false);

	const [newInterviewForm, setNewInterviewForm] = useState<NewJobInterview>({
		applicationId: initialId,
		stageType: "hr_screening",
		title: "HR Initial Screening",
		scheduledAt: new Date(),
		interviewers: "",
		meetingLink: "",
		notes: "",
		status: "scheduled",
	});

	const {
		data: application,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["jobApplication", initialId],
		queryFn: () => jobTrackerService.getById(initialId),
	});

	const {
		data: linkedOutreaches = [],
		refetch: refetchOutreaches,
	} = useQuery({
		queryKey: ["jobOutreachesForApp", initialId],
		queryFn: () => jobOutreachService.getAll({ jobApplicationId: initialId }),
		enabled: Boolean(initialId),
	});


	// Form editing state
	const [formData, setFormData] = useState<Partial<JobApplication>>({});

	// Initialize form data when application is loaded
	const currentApp = application ? { ...application, ...formData } : null;

	const handleCopyText = (text?: string, label = "Content") => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard!`);
	};

	const handleStatusAdvance = async (newStatus: JobApplicationStatus) => {
		if (!application) return;
		try {
			await jobTrackerService.updateStatus(application.id, newStatus);
			refetch();
			toast.success(`Status updated to ${JOB_STATUS_CONFIG[newStatus].label}`);
		} catch (error) {
			console.error("Failed to update status:", error);
			toast.error("Failed to update status");
		}
	};

	const handleSaveOverview = async () => {
		if (!application) return;
		setIsSaving(true);
		try {
			await jobTrackerService.update(application.id, formData);
			setFormData({});
			refetch();
			toast.success("Job application updated successfully!");
		} catch (error) {
			console.error("Save error:", error);
			toast.error("Failed to save changes");
		} finally {
			setIsSaving(false);
		}
	};

	const handleRunATSAnalysis = async () => {
		if (!application) return;
		setIsAnalyzingATS(true);
		try {
			await jobTrackerService.aiAnalyzeResumeMatch(application.id);
			refetch();
			toast.success("Gemini AI analysis and CV tailoring complete!");
		} catch (error: unknown) {
			console.error("ATS analysis error:", error);
			toast.error((error as Error).message || "Failed to run AI resume analysis");
		} finally {
			setIsAnalyzingATS(false);
		}
	};

	const handleParseInviteSubmit = async () => {
		if (!rawInviteText.trim() || !application) {
			toast.error("Please paste the invitation text first.");
			return;
		}

		setIsParsingInvite(true);
		try {
			const parsed = await jobTrackerService.aiParseInvitation(rawInviteText);

			const newIntId = await jobTrackerService.createInterview({
				applicationId: application.id,
				stageType: parsed.stageType,
				title: parsed.title,
				scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : new Date(),
				interviewers: parsed.interviewers,
				meetingLink: parsed.meetingLink,
				rawInvitation: rawInviteText,
				aiSummary: parsed.aiSummary,
				status: "scheduled",
			});

			setIsInviteDialogOpen(false);
			setRawInviteText("");
			refetch();
			toast.success("Interview invitation parsed and added!");

			// Trigger prep generation
			handleGeneratePrep(newIntId);
		} catch (error: unknown) {
			console.error("Parse invitation error:", error);
			toast.error((error as Error).message || "Failed to parse interview invitation.");
		} finally {
			setIsParsingInvite(false);
		}
	};

	const handleCreateInterviewManual = async () => {
		if (!application || !newInterviewForm.title.trim()) {
			toast.error("Please provide an interview title.");
			return;
		}

		try {
			await jobTrackerService.createInterview({
				...newInterviewForm,
				applicationId: application.id,
			});
			setIsAddInterviewDialogOpen(false);
			refetch();
			toast.success("Interview stage scheduled!");
		} catch (error) {
			console.error("Create interview error:", error);
			toast.error("Failed to add interview session.");
		}
	};

	const handleGeneratePrep = async (interviewId: string) => {
		setIsGeneratingPrep(interviewId);
		try {
			await jobTrackerService.aiGenerateInterviewPrep(interviewId);
			refetch();
			toast.success("AI interview questions and simulator generated!");
		} catch (error: unknown) {
			console.error("Prep error:", error);
			toast.error((error as Error).message || "Failed to generate interview preparation.");
		} finally {
			setIsGeneratingPrep(null);
		}
	};

	const handleUpdateInterviewStatus = async (
		interviewId: string,
		status: InterviewStatus,
	) => {
		try {
			await jobTrackerService.updateInterview(interviewId, { status });
			refetch();
			toast.success("Interview status updated");
		} catch (error) {
			toast.error("Failed to update interview status");
		}
	};

	const handleDeleteInterview = async (interviewId: string) => {
		try {
			await jobTrackerService.deleteInterview(interviewId);
			refetch();
			toast.success("Interview session removed");
		} catch (error) {
			toast.error("Failed to delete interview");
		}
	};

	if (isLoading) {
		return (
			<div className="py-24 flex flex-col items-center justify-center text-muted-foreground gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
				<span className="text-sm">Loading job workspace...</span>
			</div>
		);
	}

	if (!application || !currentApp) {
		return (
			<div className="py-20 text-center space-y-4">
				<h2 className="text-xl font-bold">Job Application Not Found</h2>
				<Button asChild variant="outline">
					<Link href="/cms/job-tracker">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Job Tracker
					</Link>
				</Button>
			</div>
		);
	}

	const platformCfg =
		JOB_PLATFORM_CONFIG[currentApp.platform] || JOB_PLATFORM_CONFIG.other;
	const atsColor = getAtsScoreColor(currentApp.atsScore);

	return (
		<div className="space-y-6 max-w-6xl mx-auto pb-12">
			{/* Top Bar Navigation */}
			<div className="flex items-center justify-between">
				<Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
					<Link href="/cms/job-tracker">
						<ArrowLeft className="w-4 h-4" />
						Back to Job Tracker
					</Link>
				</Button>

				<div className="flex items-center gap-2">
					{currentApp.jobUrl && (
						<Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
							<a
								href={currentApp.jobUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink className="w-3.5 h-3.5" />
								Original Job Post
							</a>
						</Button>
					)}
				</div>
			</div>

			{/* Main Header Banner */}
			<div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div className="flex items-start gap-4">
						<div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
							{currentApp.companyName.slice(0, 2).toUpperCase()}
						</div>
						<div className="space-y-1">
							<h1 className="text-2xl font-bold tracking-tight text-foreground">
								{currentApp.jobTitle}
							</h1>
							<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								<span className="font-semibold text-foreground flex items-center gap-1">
									<Building2 className="w-3.5 h-3.5" />
									{currentApp.companyName}
								</span>
								{currentApp.location && (
									<>
										<span>•</span>
										<span className="flex items-center gap-1">
											<MapPin className="w-3.5 h-3.5" />
											{currentApp.location}
										</span>
									</>
								)}
								<span>•</span>
								<Badge variant="outline" className={`text-[11px] ${platformCfg.color}`}>
									{platformCfg.label}
								</Badge>
								<Badge variant="secondary" className="text-[11px]">
									{WORKPLACE_CONFIG[currentApp.workplaceType]}
								</Badge>
							</div>
						</div>
					</div>

					{/* Salary & ATS Badge */}
					<div className="flex flex-col md:items-end gap-1.5">
						<div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
							{formatSalary(
								currentApp.salaryMin,
								currentApp.salaryMax,
								currentApp.salaryCurrency,
								currentApp.salaryPeriod,
							)}
						</div>
						{currentApp.atsScore !== undefined && currentApp.atsScore !== null ? (
							<div
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${atsColor.bgColor} ${atsColor.color} ${atsColor.borderColor}`}
							>
								<Sparkles className="w-3.5 h-3.5" />
								<span>ATS Match: {currentApp.atsScore}%</span>
							</div>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
								onClick={handleRunATSAnalysis}
								disabled={isAnalyzingATS}
							>
								<Sparkles className="w-3.5 h-3.5" />
								{isAnalyzingATS ? "Analyzing..." : "Analyze ATS Match"}
							</Button>
						)}
					</div>
				</div>

				{/* Lifecycle Pipeline Stepper */}
				<div className="pt-4 border-t border-border/60">
					<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
						Application Stage
					</div>
					<div className="grid grid-cols-4 md:grid-cols-8 gap-2">
						{STAGE_STEPPER.map((step) => {
							const isActive = currentApp.status === step.status;
							return (
								<button
									key={step.status}
									type="button"
									onClick={() => handleStatusAdvance(step.status)}
									className={`py-2 px-1.5 rounded-lg border text-xs font-medium text-center transition-all ${
										isActive
											? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 font-bold"
											: "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground"
									}`}
								>
									{step.label}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Tabs Section */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full md:w-auto h-auto sm:h-11 p-1 bg-muted/80 gap-1">
					<TabsTrigger value="tailor" className="flex items-center gap-2 text-xs md:text-sm">
						<Sparkles className="w-4 h-4 text-amber-500" />
						AI CV Tailor & ATS
					</TabsTrigger>
					<TabsTrigger value="outreach" className="flex items-center gap-2 text-xs md:text-sm">
						<SendHorizontal className="w-4 h-4 text-sky-500" />
						Outreach & Emails
						{linkedOutreaches.length > 0 && (
							<Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5 bg-sky-500/20 text-sky-700 dark:text-sky-300">
								{linkedOutreaches.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="interview" className="flex items-center gap-2 text-xs md:text-sm">
						<Users className="w-4 h-4 text-purple-500" />
						Interview Copilot
						{(currentApp.interviews?.length ?? 0) > 0 && (
							<Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">
								{currentApp.interviews?.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="overview" className="flex items-center gap-2 text-xs md:text-sm">
						<FileText className="w-4 h-4 text-blue-500" />
						Job Overview & JD
					</TabsTrigger>
					<TabsTrigger value="offering" className="flex items-center gap-2 text-xs md:text-sm">
						<CheckCircle2 className="w-4 h-4 text-emerald-500" />
						Offering & Strategy
					</TabsTrigger>
				</TabsList>


				{/* TAB 1: AI RESUME TAILOR & ATS MATCHER */}
				<TabsContent value="tailor" className="space-y-6">
					<Card className="border-primary/30 shadow-sm bg-gradient-to-b from-primary/5 via-card to-card">
						<CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
							<div>
								<CardTitle className="text-lg flex items-center gap-2">
									<Sparkles className="w-5 h-5 text-primary" />
									Gemini AI Resume Matcher & ATS Optimizer
								</CardTitle>
								<CardDescription className="text-xs">
									Tailor your master experience to align with this job description
								</CardDescription>
							</div>

							<Button
								onClick={handleRunATSAnalysis}
								disabled={isAnalyzingATS}
								className="gap-2 shadow-sm"
							>
								{isAnalyzingATS ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Optimizing with Gemini AI...
									</>
								) : (
									<>
										<Sparkles className="w-4 h-4" />
										{currentApp.atsAnalysis ? "Re-Analyze & Re-Tailor" : "Analyze & Tailor CV"}
									</>
								)}
							</Button>
						</CardHeader>

						{currentApp.atsAnalysis ? (
							<CardContent className="space-y-6">
								{/* Score and Match Summary */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className={`p-4 rounded-xl border ${atsColor.bgColor} ${atsColor.borderColor} flex flex-col justify-center`}>
										<div className="text-xs text-muted-foreground font-medium">ATS Match Score</div>
										<div className={`text-4xl font-extrabold mt-1 ${atsColor.color}`}>
											{currentApp.atsScore}%
										</div>
										<div className="text-xs font-medium mt-1">{atsColor.label}</div>
									</div>

									<div className="p-4 rounded-xl border border-border/70 bg-card md:col-span-2 space-y-2">
										<div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											AI Match Summary
										</div>
										<p className="text-xs text-foreground leading-relaxed">
											{currentApp.atsAnalysis.summaryFeedback}
										</p>
									</div>
								</div>

								{/* Strengths & Missing Keywords */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2.5">
										<div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
											<CheckCircle2 className="w-4 h-4" />
											Matching Strengths in Your CV
										</div>
										<ul className="space-y-1.5 text-xs">
											{(currentApp.atsAnalysis.matchStrengths || []).map((str, idx) => (
												<li key={idx} className="flex items-start gap-2">
													<span className="text-emerald-500 font-bold">•</span>
													<span>{str}</span>
												</li>
											))}
										</ul>
									</div>

									<div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2.5">
										<div className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
											<XCircle className="w-4 h-4" />
											Missing Keywords & Skill Gaps
										</div>
										<div className="flex flex-wrap gap-1.5 pt-1">
											{(currentApp.atsAnalysis.missingKeywords || []).map((kw, idx) => (
												<Badge
													key={idx}
													variant="outline"
													className="text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
												>
													{kw}
												</Badge>
											))}
										</div>
									</div>
								</div>

								{/* Tailored Professional Summary */}
								{currentApp.tailoredSummary && (
									<div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
												<FileText className="w-4 h-4 text-primary" />
												Tailored Professional Summary (For this Application)
											</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleCopyText(currentApp.tailoredSummary, "Summary")}
												className="text-xs gap-1 h-7"
											>
												<Copy className="w-3.5 h-3.5" />
												Copy
											</Button>
										</div>
										<p className="text-xs leading-relaxed bg-muted/40 p-3 rounded-lg border border-border/40 font-mono">
											{currentApp.tailoredSummary}
										</p>
									</div>
								)}

								{/* Tailored Bullet Points (XYZ Method) */}
								{currentApp.tailoredBulletPoints && currentApp.tailoredBulletPoints.length > 0 && (
									<div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
													<Lightbulb className="w-4 h-4 text-amber-500" />
													High-Impact Bullet Points (XYZ Method)
												</div>
												<div className="text-[11px] text-muted-foreground">
													Accomplished [X] as measured by [Y] by doing [Z]
												</div>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleCopyText(
														currentApp.tailoredBulletPoints
															?.map((b) => `• ${b.tailored}`)
															.join("\n"),
														"Bullet points",
													)
												}
												className="text-xs gap-1 h-7"
											>
												<Copy className="w-3.5 h-3.5" />
												Copy All
											</Button>
										</div>

										<div className="space-y-2.5">
											{currentApp.tailoredBulletPoints.map((item, idx) => (
												<div
													key={idx}
													className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1 text-xs"
												>
													{item.roleContext && (
														<span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
															{item.roleContext}
														</span>
													)}
													<p className="font-medium text-foreground pt-1">
														• {item.tailored}
													</p>
													{item.rationale && (
														<p className="text-[11px] text-muted-foreground italic">
															💡 {item.rationale}
														</p>
													)}
												</div>
											))}
										</div>
									</div>
								)}

								{/* Tailored Cover Letter / Cold Message */}
								{currentApp.coverLetter && (
									<div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
												<Send className="w-4 h-4 text-emerald-500" />
												Tailored Cover Letter / Cold Outreach Message
											</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleCopyText(currentApp.coverLetter, "Cover letter")}
												className="text-xs gap-1 h-7"
											>
												<Copy className="w-3.5 h-3.5" />
												Copy Message
											</Button>
										</div>
										<pre className="text-xs leading-relaxed bg-muted/40 p-3.5 rounded-lg border border-border/40 font-mono whitespace-pre-wrap">
											{currentApp.coverLetter}
										</pre>
									</div>
								)}
							</CardContent>
						) : (
							<CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-3">
								<div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
									<Sparkles className="w-6 h-6" />
								</div>
								<h3 className="font-semibold text-base">No AI Match Analysis Yet</h3>
								<p className="text-xs text-muted-foreground max-w-md">
									Click the button below to compare your master CV with this job description. Gemini AI will compute your ATS score, reveal keyword gaps, and tailor your bullet points.
								</p>
								<Button
									onClick={handleRunATSAnalysis}
									disabled={isAnalyzingATS}
									className="gap-2 mt-2"
								>
									{isAnalyzingATS ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Running Gemini ATS Analysis...
										</>
									) : (
										<>
											<Sparkles className="w-4 h-4" />
											Run ATS Analysis & Tailor CV
										</>
									)}
								</Button>
							</CardContent>
						)}
					</Card>
				</TabsContent>

				{/* TAB 2: INTERVIEW COPILOT & SIMULATOR */}
				<TabsContent value="interview" className="space-y-6">
					{/* Interview Actions Bar */}
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/40 p-4 rounded-xl border border-border/60">
						<div>
							<h3 className="font-semibold text-sm">Interview Schedule & Preparation</h3>
							<p className="text-xs text-muted-foreground">
								Parse recruiter emails, track interview stages, and generate Q&A prep simulators
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsInviteDialogOpen(true)}
								className="gap-1.5 text-xs"
							>
								<Sparkles className="w-3.5 h-3.5 text-purple-500" />
								Paste Recruiter Invitation
							</Button>
							<Button
								size="sm"
								onClick={() => setIsAddInterviewDialogOpen(true)}
								className="gap-1.5 text-xs"
							>
								<Plus className="w-3.5 h-3.5" />
								Schedule Stage
							</Button>
						</div>
					</div>

					{/* Interview List */}
					{(currentApp.interviews?.length ?? 0) === 0 ? (
						<Card className="border-border/60">
							<CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-3">
								<Users className="w-10 h-10 text-muted-foreground/50" />
								<h4 className="font-semibold text-sm">No Interview Stages Scheduled</h4>
								<p className="text-xs text-muted-foreground max-w-sm">
									Got an invitation email from a recruiter? Paste it and Gemini AI will automatically extract the date, stage, and meeting link.
								</p>
								<Button
									variant="outline"
									onClick={() => setIsInviteDialogOpen(true)}
									className="gap-2 text-xs"
								>
									<Sparkles className="w-4 h-4 text-purple-500" />
									Paste Invitation Email
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-6">
							{currentApp.interviews?.map((interview) => {
								const stageCfg =
									INTERVIEW_STAGE_CONFIG[interview.stageType] ||
									INTERVIEW_STAGE_CONFIG.other;
								const statusCfg =
									INTERVIEW_STATUS_CONFIG[interview.status] ||
									INTERVIEW_STATUS_CONFIG.scheduled;

								return (
									<Card key={interview.id} className="border-border/80 shadow-sm overflow-hidden">
										{/* Interview Header */}
										<CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
											<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
												<div>
													<div className="flex items-center gap-2">
														<Badge variant="outline" className="text-xs">
															{stageCfg.label}
														</Badge>
														<span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${statusCfg.color}`}>
															{statusCfg.label}
														</span>
													</div>
													<CardTitle className="text-base mt-1.5">
														{interview.title}
													</CardTitle>
												</div>

												<div className="flex items-center gap-2">
													<Select
														value={interview.status}
														onValueChange={(v) =>
															handleUpdateInterviewStatus(interview.id, v as InterviewStatus)
														}
													>
														<SelectTrigger className="h-8 text-xs w-[130px]">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="scheduled">Scheduled</SelectItem>
															<SelectItem value="completed">Completed</SelectItem>
															<SelectItem value="passed">Passed ✅</SelectItem>
															<SelectItem value="failed">Did Not Pass ❌</SelectItem>
															<SelectItem value="cancelled">Cancelled</SelectItem>
														</SelectContent>
													</Select>

													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive"
														onClick={() => handleDeleteInterview(interview.id)}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</div>

											{/* Metadata row */}
											<div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
												<div className="flex items-center gap-1.5">
													<Calendar className="w-3.5 h-3.5 text-blue-500" />
													<span>
														{new Date(interview.scheduledAt).toLocaleString("en-US", {
															dateStyle: "medium",
															timeStyle: "short",
														})}
													</span>
												</div>

												{interview.interviewers && (
													<div className="flex items-center gap-1.5">
														<Users className="w-3.5 h-3.5 text-purple-500" />
														<span>{interview.interviewers}</span>
													</div>
												)}

												{interview.meetingLink && (
													<div className="flex items-center gap-1.5">
														<Video className="w-3.5 h-3.5 text-emerald-500" />
														<a
															href={interview.meetingLink}
															target="_blank"
															rel="noopener noreferrer"
															className="text-primary underline font-medium"
														>
															Meeting Link
														</a>
													</div>
												)}
											</div>
										</CardHeader>

										{/* Interview Body / AI Prep */}
										<CardContent className="p-6 space-y-5">
											{interview.aiSummary && (
												<div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1 text-xs">
													<div className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
														<Sparkles className="w-3.5 h-3.5" />
														AI Stage Strategy & Focus
													</div>
													<p className="text-foreground leading-relaxed">
														{interview.aiSummary}
													</p>
												</div>
											)}

											{/* AI Predicted Questions Accordion */}
											<div className="space-y-3">
												<div className="flex items-center justify-between">
													<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
														<HelpCircle className="w-4 h-4 text-primary" />
														Predicted Interview Questions & Answers
													</h4>

													<Button
														variant="outline"
														size="sm"
														onClick={() => handleGeneratePrep(interview.id)}
														disabled={isGeneratingPrep === interview.id}
														className="text-xs gap-1.5 h-7"
													>
														{isGeneratingPrep === interview.id ? (
															<>
																<Loader2 className="w-3.5 h-3.5 animate-spin" />
																Generating...
															</>
														) : (
															<>
																<Sparkles className="w-3.5 h-3.5 text-amber-500" />
																{interview.aiPredictedQuestions?.length ? "Regenerate Q&A" : "Generate Q&A"}
															</>
														)}
													</Button>
												</div>

												{interview.aiPredictedQuestions &&
												interview.aiPredictedQuestions.length > 0 ? (
													<Accordion type="single" collapsible className="w-full space-y-2">
														{interview.aiPredictedQuestions.map((q, qIdx) => (
															<AccordionItem
																key={qIdx}
																value={`q-${qIdx}`}
																className="border rounded-lg px-3.5 bg-muted/20"
															>
																<AccordionTrigger className="text-xs font-semibold text-left py-3 hover:no-underline">
																	<div className="flex items-center gap-2">
																		<Badge
																			variant="secondary"
																			className="text-[10px] uppercase font-bold"
																		>
																			{q.category}
																		</Badge>
																		<span>{q.question}</span>
																	</div>
																</AccordionTrigger>
																<AccordionContent className="space-y-3 text-xs pt-1 pb-3 text-foreground">
																	{q.tip && (
																		<div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
																			<strong>💡 Recruiter Intent:</strong> {q.tip}
																		</div>
																	)}
																	<div className="p-3 rounded-md bg-card border border-border/60 space-y-1">
																		<div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold">
																			<span>Recommended STAR Answer:</span>
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() => handleCopyText(q.sampleAnswer, "Answer")}
																				className="h-6 text-[10px] p-1"
																			>
																				<Copy className="w-3 h-3 mr-1" />
																				Copy
																			</Button>
																		</div>
																		<p className="leading-relaxed whitespace-pre-wrap font-sans text-xs">
																			{q.sampleAnswer}
																		</p>
																	</div>
																</AccordionContent>
															</AccordionItem>
														))}
													</Accordion>
												) : (
													<div className="p-6 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
														Click "Generate Q&A" to simulate questions tailored to this role and stage.
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</TabsContent>

				{/* TAB 3: OVERVIEW & JOB DESCRIPTION */}
				<TabsContent value="overview" className="space-y-6">
					<Card className="border-border/80 shadow-sm">
						<CardHeader>
							<CardTitle className="text-base">Job Vacancy Information</CardTitle>
							<CardDescription className="text-xs">
								Edit core job specifications and recruiter contact information
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<Label htmlFor="jobTitle" className="text-xs">Job Title</Label>
									<Input
										id="jobTitle"
										value={formData.jobTitle ?? currentApp.jobTitle}
										onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
										className="text-xs"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="companyName" className="text-xs">Company Name</Label>
									<Input
										id="companyName"
										value={formData.companyName ?? currentApp.companyName}
										onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
										className="text-xs"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-1.5">
									<Label htmlFor="platform" className="text-xs">Platform</Label>
									<Select
										value={formData.platform ?? currentApp.platform}
										onValueChange={(v) => setFormData({ ...formData, platform: v as JobPlatform })}
									>
										<SelectTrigger className="text-xs h-9">
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

								<div className="space-y-1.5">
									<Label htmlFor="workplaceType" className="text-xs">Workplace Setting</Label>
									<Select
										value={formData.workplaceType ?? currentApp.workplaceType}
										onValueChange={(v) => setFormData({ ...formData, workplaceType: v as WorkplaceType })}
									>
										<SelectTrigger className="text-xs h-9">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="remote">Remote 🌐</SelectItem>
											<SelectItem value="hybrid">Hybrid 🏢</SelectItem>
											<SelectItem value="onsite">On-site 📍</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="jobType" className="text-xs">Employment Type</Label>
									<Select
										value={formData.jobType ?? currentApp.jobType}
										onValueChange={(v) => setFormData({ ...formData, jobType: v as JobEmploymentType })}
									>
										<SelectTrigger className="text-xs h-9">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="full_time">Full-time</SelectItem>
											<SelectItem value="contract">Contract</SelectItem>
											<SelectItem value="part_time">Part-time</SelectItem>
											<SelectItem value="freelance">Freelance</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-1.5">
									<Label htmlFor="salaryMin" className="text-xs">Min Salary</Label>
									<Input
										id="salaryMin"
										type="number"
										value={formData.salaryMin ?? currentApp.salaryMin ?? ""}
										onChange={(e) =>
											setFormData({
												...formData,
												salaryMin: e.target.value ? parseInt(e.target.value) : undefined,
											})
										}
										className="text-xs"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="salaryMax" className="text-xs">Max Salary</Label>
									<Input
										id="salaryMax"
										type="number"
										value={formData.salaryMax ?? currentApp.salaryMax ?? ""}
										onChange={(e) =>
											setFormData({
												...formData,
												salaryMax: e.target.value ? parseInt(e.target.value) : undefined,
											})
										}
										className="text-xs"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="salaryCurrency" className="text-xs">Currency</Label>
									<Input
										id="salaryCurrency"
										value={formData.salaryCurrency ?? currentApp.salaryCurrency}
										onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
										className="text-xs"
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="jobDescriptionRaw" className="text-xs">Raw Job Description</Label>
								<Textarea
									id="jobDescriptionRaw"
									rows={8}
									value={formData.jobDescriptionRaw ?? currentApp.jobDescriptionRaw ?? ""}
									onChange={(e) => setFormData({ ...formData, jobDescriptionRaw: e.target.value })}
									className="text-xs font-mono"
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="notes" className="text-xs">Personal Application Notes</Label>
								<Textarea
									id="notes"
									rows={3}
									placeholder="Any personal thoughts, notes from recruiter chats, or reminders..."
									value={formData.notes ?? currentApp.notes ?? ""}
									onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
									className="text-xs"
								/>
							</div>

							<div className="flex justify-end pt-4 border-t">
								<Button onClick={handleSaveOverview} disabled={isSaving} className="gap-1.5">
									{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
									Save Changes
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* TAB 4: OFFERING & NEGOTIATION */}
				<TabsContent value="offering" className="space-y-6">
					<Card className="border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-card">
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
								<CheckCircle2 className="w-5 h-5" />
								Offering & Compensation Review
							</CardTitle>
							<CardDescription className="text-xs">
								Track and compare compensation packages, benefits, and negotiation notes
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs space-y-2">
								<div className="font-semibold text-emerald-800 dark:text-emerald-300">
									🎉 Congratulations on reaching the Offering stage!
								</div>
								<p className="text-muted-foreground leading-relaxed">
									Document the formal offer terms, compare with your target, and plan any counter-negotiation points.
								</p>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="offerNotes" className="text-xs">Offer Package & Benefits</Label>
								<Textarea
									id="offerNotes"
									rows={6}
									placeholder="e.g. Base: Rp 28,000,000/mo&#10;Bonus: 2x Annual performance bonus&#10;Health: Private Insurance with inpatient/dental&#10;Equipment: MacBook Pro 16&#10;Start Date: 1st of next month&#10;Offer Expiry: Friday, 5 PM"
									value={formData.notes ?? currentApp.notes ?? ""}
									onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
									className="text-xs font-mono"
								/>
							</div>

							<div className="flex justify-between items-center pt-4 border-t">
								<Button
									variant="outline"
									onClick={() => handleStatusAdvance("accepted")}
									className="text-xs font-bold border-green-500/40 text-green-600 hover:bg-green-500/10"
								>
									Mark as Accepted Offer 🚀
								</Button>

								<Button onClick={handleSaveOverview} disabled={isSaving} className="gap-1.5">
									{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
									Save Offer Notes
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* TAB: OUTREACH & COLD EMAILS */}
				<TabsContent value="outreach" className="space-y-6">
					<Card className="border-border/80 shadow-sm">
						<CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/50 bg-muted/20">
							<div>
								<CardTitle className="text-lg flex items-center gap-2">
									<SendHorizontal className="w-5 h-5 text-sky-500" />
									Outreach & Cold Email Communications
								</CardTitle>
								<CardDescription className="text-xs">
									Lacak direct applications, cold pitches, dan percakapan balasan dari recruiter untuk <strong>{currentApp.companyName}</strong> via <strong className="text-foreground">{PUBLIC_SUPPORT_EMAIL}</strong>.
								</CardDescription>
							</div>

							<Button asChild size="sm" className="gap-2 font-medium">
								<Link href={`/cms/job-outreaches/new?jobAppId=${currentApp.id}`}>
									<Plus className="w-4 h-4" /> New Email Outreach
								</Link>
							</Button>
						</CardHeader>

						<CardContent className="p-6">
							{linkedOutreaches.length === 0 ? (
								<div className="text-center py-10 border border-dashed rounded-xl bg-muted/10 space-y-3">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-600">
										<SendHorizontal className="w-6 h-6" />
									</div>
									<div className="space-y-1">
										<h4 className="font-semibold text-sm">Belum ada Outreach untuk Aplikasi ini</h4>
										<p className="text-xs text-muted-foreground max-w-sm mx-auto">
											Kirim cold email ke Hiring Manager atau email follow-up untuk menunjukkan keseriusan Anda.
										</p>
									</div>
									<div className="pt-2">
										<Button asChild size="sm" variant="outline" className="gap-2">
											<Link href={`/cms/job-outreaches/new?jobAppId=${currentApp.id}`}>
												<Plus className="w-4 h-4" /> Mulai Cold Outreach
											</Link>
										</Button>
									</div>
								</div>
							) : (

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{linkedOutreaches.map((outreach) => (
										<div
											key={outreach.id}
											className="p-4 rounded-xl border border-border/70 hover:border-primary/50 transition-all bg-card flex flex-col justify-between space-y-3 shadow-sm"
										>
											<div className="space-y-2">
												<div className="flex items-center justify-between gap-2">
													<span className="text-xs font-semibold text-primary truncate">
														To: {outreach.contactName}
													</span>
													<Badge
														variant="outline"
														className={cn(
															"text-[10px] capitalize font-medium",
															outreach.status === "replied" && "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
															outreach.status === "sent" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
															outreach.status === "draft" && "bg-slate-500/10 text-slate-600 border-slate-500/20",
														)}
													>
														{outreach.status.replace("_", " ")}
													</Badge>
												</div>

												<div className="text-xs font-bold text-foreground line-clamp-1">
													"{outreach.subject}"
												</div>

												<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
													{outreach.body}
												</p>
											</div>

											<div className="pt-2 border-t border-border/40 flex items-center justify-between">
												<span className="text-[11px] text-muted-foreground">
													{outreach.sentAt ? formatDate(outreach.sentAt) : "Draft"}
												</span>

												<Button asChild variant="outline" size="sm" className="text-xs h-7 gap-1">
													<Link href={`/cms/job-outreaches/${outreach.id}`}>
														<MessageSquare className="w-3 h-3" /> View Thread
													</Link>
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>


			{/* Modal Dialog: Parse Recruiter Invite */}
			<Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<div className="flex items-center gap-2">
							<div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
								<Sparkles className="w-5 h-5" />
							</div>
							<div>
								<DialogTitle className="text-lg">Paste Recruiter Invitation</DialogTitle>
								<DialogDescription>
									Paste email or chat from HR/Recruiter. Gemini AI will extract the time, stage, and Google Meet/Zoom link.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-3 pt-2">
						<Textarea
							placeholder="e.g. Hi Wisman, thank you for applying! We'd like to invite you for a Technical Interview with our Lead on Thursday at 2:00 PM WIB via Google Meet: https://meet.google.com/abc-xyz..."
							rows={8}
							value={rawInviteText}
							onChange={(e) => setRawInviteText(e.target.value)}
							className="text-xs font-mono"
						/>
					</div>

					<DialogFooter className="pt-3 border-t">
						<Button
							variant="outline"
							onClick={() => setIsInviteDialogOpen(false)}
							disabled={isParsingInvite}
						>
							Cancel
						</Button>
						<Button
							onClick={handleParseInviteSubmit}
							disabled={isParsingInvite || !rawInviteText.trim()}
							className="gap-2"
						>
							{isParsingInvite ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Parsing with Gemini AI...
								</>
							) : (
								<>
									<Sparkles className="w-4 h-4" />
									Parse & Schedule Stage
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal Dialog: Add Interview Manually */}
			<Dialog open={isAddInterviewDialogOpen} onOpenChange={setIsAddInterviewDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-lg">Schedule Interview Stage</DialogTitle>
						<DialogDescription>
							Manually log an upcoming interview round
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 pt-2">
						<div className="space-y-1.5">
							<Label htmlFor="stageType" className="text-xs">Stage Type</Label>
							<Select
								value={newInterviewForm.stageType}
								onValueChange={(v) =>
									setNewInterviewForm({
										...newInterviewForm,
										stageType: v as InterviewStageType,
										title:
											v === "hr_screening"
												? "HR Initial Screening"
												: v === "technical_interview"
													? "Technical Interview"
													: v === "user_interview"
														? "User / Team Lead Interview"
														: v === "system_design"
															? "System Design Session"
															: "Interview Session",
									})
								}
							>
								<SelectTrigger className="text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="hr_screening">HR Screening</SelectItem>
									<SelectItem value="technical_interview">Technical Interview</SelectItem>
									<SelectItem value="live_coding">Live Coding</SelectItem>
									<SelectItem value="take_home_test">Take-Home Test</SelectItem>
									<SelectItem value="user_interview">User / Lead Interview</SelectItem>
									<SelectItem value="system_design">System Design</SelectItem>
									<SelectItem value="final_leadership">Final Leadership</SelectItem>
									<SelectItem value="offering_discussion">Offering Call</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="intTitle" className="text-xs">Interview Title</Label>
							<Input
								id="intTitle"
								value={newInterviewForm.title}
								onChange={(e) =>
									setNewInterviewForm({ ...newInterviewForm, title: e.target.value })
								}
								className="text-xs"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="intDate" className="text-xs">Scheduled Date & Time</Label>
							<Input
								id="intDate"
								type="datetime-local"
								value={
									new Date(newInterviewForm.scheduledAt)
										.toISOString()
										.slice(0, 16)
								}
								onChange={(e) =>
									setNewInterviewForm({
										...newInterviewForm,
										scheduledAt: new Date(e.target.value),
									})
								}
								className="text-xs"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="intLink" className="text-xs">Meeting Link (Zoom / Meet)</Label>
							<Input
								id="intLink"
								placeholder="https://meet.google.com/..."
								value={newInterviewForm.meetingLink || ""}
								onChange={(e) =>
									setNewInterviewForm({
										...newInterviewForm,
										meetingLink: e.target.value,
									})
								}
								className="text-xs"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="interviewers" className="text-xs">Interviewer Names</Label>
							<Input
								id="interviewers"
								placeholder="e.g. Sarah (HR), John (Engineering Lead)"
								value={newInterviewForm.interviewers || ""}
								onChange={(e) =>
									setNewInterviewForm({
										...newInterviewForm,
										interviewers: e.target.value,
									})
								}
								className="text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="pt-3 border-t">
						<Button
							variant="outline"
							onClick={() => setIsAddInterviewDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleCreateInterviewManual}>
							Save Interview
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
