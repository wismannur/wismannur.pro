"use client";

import { useState } from "react";
import {
	Calendar,
	CalendarPlus,
	Copy,
	Download,
	ExternalLink,
	HelpCircle,
	Loader2,
	Plus,
	Sparkles,
	Trash2,
	Users,
	Video,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	INTERVIEW_STAGE_CONFIG,
	INTERVIEW_STATUS_CONFIG,
	downloadIcsFile,
	generateGoogleCalendarUrl,
} from "@/lib/job-tracker";
import type {
	InterviewStageType,
	InterviewStatus,
	JobApplication,
	NewJobInterview,
} from "@/services/job-tracker/types";

interface TabInterviewPrepProps {
	application: JobApplication;
	isGeneratingPrep: string | null;
	isParsingInvite: boolean;
	onGeneratePrep: (interviewId: string) => Promise<void>;
	onParseInviteSubmit: (rawText: string) => Promise<void>;
	onCreateInterviewManual: (form: NewJobInterview) => Promise<void>;
	onUpdateInterviewStatus: (interviewId: string, status: InterviewStatus) => Promise<void>;
	onDeleteInterview: (interviewId: string) => Promise<void>;
	onCopyText: (text?: string, label?: string) => void;
}

export function TabInterviewPrep({
	application,
	isGeneratingPrep,
	isParsingInvite,
	onGeneratePrep,
	onParseInviteSubmit,
	onCreateInterviewManual,
	onUpdateInterviewStatus,
	onDeleteInterview,
	onCopyText,
}: TabInterviewPrepProps) {
	const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
	const [rawInviteText, setRawInviteText] = useState("");
	const [isAddInterviewDialogOpen, setIsAddInterviewDialogOpen] = useState(false);

	const [newInterviewForm, setNewInterviewForm] = useState<NewJobInterview>({
		applicationId: application.id,
		stageType: "hr_screening",
		title: "HR Initial Screening",
		scheduledAt: new Date(),
		interviewers: "",
		meetingLink: "",
		notes: "",
		status: "scheduled",
	});

	const handleParseSubmit = async () => {
		await onParseInviteSubmit(rawInviteText);
		setIsInviteDialogOpen(false);
		setRawInviteText("");
	};

	const handleCreateManual = async () => {
		await onCreateInterviewManual(newInterviewForm);
		setIsAddInterviewDialogOpen(false);
	};

	return (
		<div className="space-y-6">
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
			{(application.interviews?.length ?? 0) === 0 ? (
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
					{application.interviews?.map((interview) => {
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
													onUpdateInterviewStatus(interview.id, v as InterviewStatus)
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
												onClick={() => onDeleteInterview(interview.id)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</div>

									{/* Metadata & Quick Calendar Sync row */}
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground pt-2">
										<div className="flex flex-wrap items-center gap-4">
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

										<div className="flex items-center gap-1.5 shrink-0">
											<Button
												asChild
												variant="outline"
												size="sm"
												className="h-7 text-[11px] gap-1 px-2 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
											>
												<a
													href={generateGoogleCalendarUrl({
														title: interview.title,
														companyName: application.companyName,
														jobTitle: application.jobTitle,
														scheduledAt: interview.scheduledAt,
														meetingLink: interview.meetingLink,
														interviewers: interview.interviewers,
														aiSummary: interview.aiSummary,
													})}
													target="_blank"
													rel="noopener noreferrer"
												>
													<CalendarPlus className="w-3 h-3 text-blue-500" />
													Google Calendar
													<ExternalLink className="w-2.5 h-2.5 opacity-60" />
												</a>
											</Button>

											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													downloadIcsFile({
														title: interview.title,
														companyName: application.companyName,
														jobTitle: application.jobTitle,
														scheduledAt: interview.scheduledAt,
														meetingLink: interview.meetingLink,
														interviewers: interview.interviewers,
														aiSummary: interview.aiSummary,
													})
												}
												className="h-7 text-[11px] gap-1 px-2"
												title="Download .ics for Apple Calendar / Outlook"
											>
												<Download className="w-3 h-3 text-muted-foreground" />
												.ICS
											</Button>
										</div>
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
												onClick={() => onGeneratePrep(interview.id)}
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
																		onClick={() => onCopyText(q.sampleAnswer, "Answer")}
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
												Click &quot;Generate Q&amp;A&quot; to simulate questions tailored to this role and stage.
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

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
							onClick={handleParseSubmit}
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
						<Button onClick={handleCreateManual}>
							Save Interview
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
