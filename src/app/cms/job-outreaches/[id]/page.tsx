"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	AlertCircle,
	ArrowLeft,
	Briefcase,
	Building2,
	Check,
	Clock,
	Copy,
	ExternalLink,
	FileText,
	Linkedin,
	Loader2,
	Mail,
	Paperclip,
	RefreshCw,
	Send,
	Sparkles,
	Trash2,
	User,
} from "lucide-react";


import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	jobOutreachService,
	type JobOutreach,
	type OutreachStatus,
	type OutreachType,
} from "@/services";

const STATUS_CONFIG: Record<
	OutreachStatus,
	{ label: string; className: string }
> = {
	draft: {
		label: "Draft",
		className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
	},
	sent: {
		label: "Awaiting Reply",
		className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
	},
	follow_up_due: {
		label: "Follow-up Due ⚠️",
		className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold",
	},
	replied: {
		label: "Replied 🎉",
		className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold",
	},
	converted: {
		label: "Converted to Job Interview 🚀",
		className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold",
	},
	closed: {
		label: "Closed / No Fit",
		className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
	},
};

export default function JobOutreachDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();
	const outreachId = params.id;

	const [followUpMessage, setFollowUpMessage] = useState("");
	const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
	const [isGeneratingAiFollowUp, setIsGeneratingAiFollowUp] = useState(false);
	const [isSendingDraft, setIsSendingDraft] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const [isConverting, setIsConverting] = useState(false);

	const {
		data: outreach,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery({
		queryKey: ["jobOutreachDetail", outreachId],
		queryFn: async () => {
			const res = await jobOutreachService.getById(outreachId);
			if (!res) throw new Error("Outreach not found");
			return res;
		},
		enabled: Boolean(outreachId),
	});

	const handleSendDraft = async () => {
		if (!outreach) return;
		setIsSendingDraft(true);
		try {
			await jobOutreachService.sendEmail(outreach.id);
			toast.success(`Email berhasil dikirim ke ${outreach.contactEmail} via hi@wismannur.pro!`);
			refetch();
			queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
			queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
		} catch (err) {
			console.error("Send draft error:", err);
			toast.error("Gagal mengirim email draf.");
		} finally {
			setIsSendingDraft(false);
		}
	};


	const handleCopyEmail = (email: string) => {
		navigator.clipboard.writeText(email);
		setIsCopied(true);
		toast.success("Email copied to clipboard");
		setTimeout(() => setIsCopied(false), 2000);
	};

	const handleStatusChange = async (newStatus: OutreachStatus) => {
		if (!outreach) return;
		try {
			await jobOutreachService.update(outreach.id, { status: newStatus });
			toast.success(`Status diubah menjadi ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
			queryClient.invalidateQueries({ queryKey: ["jobOutreachDetail", outreachId] });
			queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
			queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
		} catch (err) {
			console.error("Status update error:", err);
			toast.error("Gagal mengubah status.");
		}
	};

	const handleGenerateAiFollowUp = async () => {
		if (!outreach) return;
		setIsGeneratingAiFollowUp(true);
		try {
			const res = await jobOutreachService.generateAiDraft({
				type: "follow_up",
				companyName: outreach.companyName,
				jobTitle: outreach.jobTitle,
				contactName: outreach.contactName,
				contactRole: outreach.contactRole,
				customInstructions: `This is a follow up email. Previous message: "${outreach.body.slice(0, 300)}..."`,
			});

			setFollowUpMessage(res.body);
			toast.success("Draf follow-up berhasil dibuat oleh AI!");
		} catch (err) {
			console.error("AI Follow-up error:", err);
			toast.error("Gagal men-generate follow up AI.");
		} finally {
			setIsGeneratingAiFollowUp(false);
		}
	};

	const handleSendFollowUp = async () => {
		if (!outreach || !followUpMessage.trim()) return;
		setIsSendingFollowUp(true);
		try {
			await jobOutreachService.sendFollowUp(outreach.id, followUpMessage.trim());
			toast.success(`Follow-up berhasil dikirim ke ${outreach.contactEmail}!`);
			setFollowUpMessage("");
			refetch();
			queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
			queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
		} catch (err) {
			console.error("Send follow-up error:", err);
			toast.error("Gagal mengirim email follow-up.");
		} finally {
			setIsSendingFollowUp(false);
		}
	};

	const handleConvertToJobTracker = async () => {
		if (!outreach) return;
		setIsConverting(true);
		try {
			const result = await jobOutreachService.convertToJobApplication(outreach.id);
			toast.success("Berhasil dihubungkan ke Job Tracker!");
			refetch();
			queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
			queryClient.invalidateQueries({ queryKey: ["jobTrackerApplications"] });
			router.push(`/cms/job-tracker/${result.applicationId}`);
		} catch (err) {
			console.error("Convert to job tracker error:", err);
			toast.error("Gagal mengonversi ke Job Tracker.");
		} finally {
			setIsConverting(false);
		}
	};

	const handleDelete = async () => {
		if (!outreach) return;
		setIsDeleting(true);
		try {
			await jobOutreachService.delete(outreach.id);
			toast.success("Outreach berhasil dihapus.");
			queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
			queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
			router.push("/cms/job-outreaches");
		} catch (err) {
			console.error("Delete error:", err);
			toast.error("Gagal menghapus outreach.");
		} finally {
			setIsDeleting(false);
		}
	};


	if (isLoading) {
		return (
			<div className="space-y-6 pb-12">
				<div className="flex items-center gap-3">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-48" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-4">
						<Skeleton className="h-64 w-full" />
						<Skeleton className="h-48 w-full" />
					</div>
					<div>
						<Skeleton className="h-80 w-full" />
					</div>
				</div>
			</div>
		);
	}

	if (!outreach) {
		return (
			<div className="text-center py-16 space-y-4">
				<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
				<h2 className="text-xl font-bold">Outreach tidak ditemukan</h2>
				<Button asChild variant="outline">
					<Link href="/cms/job-outreaches">Kembali ke Daftar Outreach</Link>
				</Button>
			</div>
		);
	}

	const statusInfo = STATUS_CONFIG[outreach.status] || STATUS_CONFIG.sent;

	return (
		<div className="space-y-6 pb-12">
			{/* Top Navigation */}
			<div className="flex items-center justify-between">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="gap-2 -ml-2 text-muted-foreground hover:text-foreground text-xs font-medium"
				>
					<Link href="/cms/job-outreaches">
						<ArrowLeft className="h-4 w-4" /> Kembali ke Job Outreaches
					</Link>
				</Button>
			</div>

			{/* Top Action Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
				<div>
					<div className="flex items-center gap-2 text-xs font-semibold text-primary">
						<Building2 className="h-3.5 w-3.5" />
						<span>{outreach.companyName}</span>
						{outreach.companyWebsite && (
							<a
								href={outreach.companyWebsite}
								target="_blank"
								rel="noreferrer"
								className="text-muted-foreground hover:text-primary"
							>
								<ExternalLink className="h-3 w-3" />
							</a>
						)}
					</div>
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
						{outreach.jobTitle}
					</h1>
				</div>

				<div className="flex items-center gap-2.5 flex-wrap">

					{/* Status Selector */}
					<Select
						value={outreach.status}
						onValueChange={(val) => handleStatusChange(val as OutreachStatus)}
					>
						<SelectTrigger className={cn("h-9 text-xs font-medium w-[180px]", statusInfo.className)}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="sent">Awaiting Reply</SelectItem>
							<SelectItem value="follow_up_due">Follow-up Due</SelectItem>
							<SelectItem value="replied">Replied 🎉</SelectItem>
							<SelectItem value="converted">Converted to Interview 🚀</SelectItem>
							<SelectItem value="closed">Closed / No Fit</SelectItem>
						</SelectContent>
					</Select>

					<Button
						variant="outline"
						size="icon"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="h-9 w-9 rounded-lg"
						title="Refresh Thread"
					>
						<RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
					</Button>

					<Button
						variant="destructive"
						size="icon"
						onClick={() => setIsDeleteDialogOpen(true)}
						className="h-9 w-9 rounded-lg"
						title="Hapus Outreach"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Main Grid: Thread on Left (2 cols), Details on Right (1 col) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left: Email Thread Messages */}
				<div className="lg:col-span-2 space-y-6">
					{/* Draft Banner if status is draft */}
					{outreach.status === "draft" && (
						<div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
									<Send className="h-5 w-5" />
								</div>
								<div className="space-y-0.5">
									<div className="text-sm font-bold text-foreground">
										Outreach ini masih berstatus Draf
									</div>
									<p className="text-xs text-muted-foreground">
										Email belum dikirimkan ke <strong className="text-foreground">{outreach.contactName}</strong> ({outreach.contactEmail}). Klik tombol di samping untuk mengirimkannya langsung via <strong className="text-primary font-mono">hi@wismannur.pro</strong>.
									</p>
								</div>
							</div>
							<Button
								onClick={handleSendDraft}
								disabled={isSendingDraft}
								className="gap-2 shrink-0 font-semibold w-full sm:w-auto"
							>
								{isSendingDraft ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
									</>
								) : (
									<>
										<Send className="h-4 w-4" /> Kirim Email Sekarang
									</>
								)}
							</Button>
						</div>
					)}

					<Card className="border-border/60 shadow-sm">
						<CardHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20">

							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<CardTitle className="text-base font-bold flex items-center gap-2">
										<Mail className="h-4 w-4 text-primary" />
										Email Thread: &ldquo;{outreach.subject}&rdquo;
									</CardTitle>

									<CardDescription className="text-xs">
										Ref ID: <span className="font-mono text-foreground font-semibold">#{outreach.id}</span> · Pengiriman dari <span className="text-primary font-mono">hi@wismannur.pro</span>
									</CardDescription>
								</div>
								<Badge variant="outline" className={cn("text-xs font-semibold", statusInfo.className)}>
									{statusInfo.label}
								</Badge>
							</div>
						</CardHeader>

						<CardContent className="p-4 sm:p-6 space-y-6">
							{/* Message Timeline */}
							{(!outreach.messages || outreach.messages.length === 0) ? (
								/* Fallback if no messages array yet, show initial body */
								<div className="p-4 rounded-xl border bg-muted/30 space-y-3">
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<div className="flex items-center gap-2 font-medium text-foreground">
											<Avatar className="h-6 w-6">
												<AvatarFallback className="bg-primary/10 text-primary text-[10px]">
													WN
												</AvatarFallback>
											</Avatar>
											<span>Wisman Nur (Anda)</span>
										</div>
										<span>{outreach.sentAt ? format(new Date(outreach.sentAt), "dd MMM yyyy, HH:mm") : "Draft"}</span>
									</div>
									<div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 pl-8">
										{outreach.body}
									</div>
								</div>
							) : (
								<div className="space-y-4">
									{outreach.messages.map((msg, index) => {
										const isAdmin = msg.senderType === "admin";
										return (
											<div
												key={msg.id || index}
												className={cn(
													"p-4 rounded-xl border transition-all text-sm space-y-2.5",
													isAdmin
														? "bg-muted/30 border-border/60 ml-0 sm:ml-4"
														: "bg-emerald-500/10 border-emerald-500/30 mr-0 sm:mr-4 shadow-sm",
												)}
											>
												<div className="flex items-center justify-between text-xs">
													<div className="flex items-center gap-2">
														<Avatar className="h-6 w-6">
															<AvatarFallback
																className={cn(
																	"text-[10px] font-bold",
																	isAdmin
																		? "bg-primary/20 text-primary"
																		: "bg-emerald-600 text-white",
																)}
															>
																{isAdmin ? "WN" : msg.senderName[0] || "R"}
															</AvatarFallback>
														</Avatar>
														<div className="font-semibold text-foreground flex items-center gap-1.5">
															<span>{msg.senderName}</span>
															<span className="text-[11px] font-normal text-muted-foreground">
																&lt;{msg.senderEmail}&gt;
															</span>
															{!isAdmin && (
																<Badge className="bg-emerald-600 text-[10px] py-0 h-4">
																	Recruiter Reply
																</Badge>
															)}
														</div>
													</div>
													<span className="text-muted-foreground text-[11px]">
														{format(new Date(msg.createdAt), "dd MMM yyyy, HH:mm")}
													</span>
												</div>

												<div className="text-sm whitespace-pre-wrap leading-relaxed pl-8 text-foreground/90 font-sans">
													{msg.message}
												</div>
											</div>
										);
									})}
								</div>
							)}

							<Separator />

							{/* Follow-up / Reply Composer */}
							<div className="space-y-3 pt-2">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
									<div className="text-sm font-bold flex items-center gap-2">
										<Send className="h-4 w-4 text-primary" />
										Send Follow-up / Reply
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleGenerateAiFollowUp}
										disabled={isGeneratingAiFollowUp || isSendingFollowUp}
										className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
									>
										{isGeneratingAiFollowUp ? (
											<>
												<Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting...
											</>
										) : (
											<>
												<Sparkles className="h-3.5 w-3.5" /> AI Follow-up Draft
											</>
										)}
									</Button>
								</div>

								<Textarea
									rows={5}
									placeholder={`Tulis pesan balasan atau follow-up untuk ${outreach.contactName}...`}
									value={followUpMessage}
									onChange={(e) => setFollowUpMessage(e.target.value)}
									className="text-sm leading-relaxed"
								/>

								<div className="flex items-center justify-between pt-1">
									<span className="text-xs text-muted-foreground">
										Mengirim dari <strong className="text-foreground">hi@wismannur.pro</strong>
									</span>
									<Button
										onClick={handleSendFollowUp}
										disabled={isSendingFollowUp || !followUpMessage.trim()}
										className="gap-2 font-medium"
									>
										{isSendingFollowUp ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
											</>
										) : (
											<>
												<Send className="h-4 w-4" /> Kirim via Resend
											</>
										)}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Contact & Job Tracker Info */}
				<div className="space-y-6">
					{/* Target Recruiter Card */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="p-4 pb-3">
							<CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<User className="h-4 w-4 text-primary" />
								Target Recruiter
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-0 space-y-3.5 text-sm">
							<div className="flex items-start gap-3">
								<Avatar className="h-10 w-10 border border-primary/20">
									<AvatarFallback className="bg-primary/10 text-primary font-bold">
										{outreach.contactName[0] || "U"}
									</AvatarFallback>
								</Avatar>
								<div className="space-y-0.5 overflow-hidden">
									<div className="font-bold text-foreground truncate">
										{outreach.contactName}
									</div>
									{outreach.contactRole && (
										<div className="text-xs text-muted-foreground truncate">
											{outreach.contactRole}
										</div>
									)}
								</div>
							</div>

							<Separator />

							<div className="space-y-2 text-xs">
								<div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
									<div className="flex items-center gap-2 truncate">
										<Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
										<span className="truncate font-mono">{outreach.contactEmail}</span>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6"
										onClick={() => handleCopyEmail(outreach.contactEmail)}
									>
										{isCopied ? (
											<Check className="h-3 w-3 text-emerald-500" />
										) : (
											<Copy className="h-3 w-3" />
										)}
									</Button>
								</div>

								{outreach.contactLinkedin && (
									<a
										href={outreach.contactLinkedin}
										target="_blank"
										rel="noreferrer"
										className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-blue-600 dark:text-blue-400 font-medium"
									>
										<div className="flex items-center gap-2 truncate">
											<Linkedin className="h-3.5 w-3.5 shrink-0" />
											<span className="truncate">LinkedIn Profile</span>
										</div>
										<ExternalLink className="h-3 w-3" />
									</a>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Linked Job Tracker Card */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="p-4 pb-3">
							<CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<Briefcase className="h-4 w-4 text-primary" />
								Job Tracker Integration
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-0 space-y-3.5 text-sm">
							{outreach.jobApplication ? (
								<div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-xs font-semibold text-primary">
											Linked Application
										</span>
										<Badge variant="outline" className="text-[10px] capitalize">
											{outreach.jobApplication.status.replace("_", " ")}
										</Badge>
									</div>
									<div className="font-bold text-sm">
										{outreach.jobApplication.companyName}
									</div>
									<div className="text-xs text-muted-foreground">
										{outreach.jobApplication.jobTitle}
									</div>

									<Button
										asChild
										variant="outline"
										size="sm"
										className="w-full text-xs h-8 gap-1.5 mt-2"
									>
										<Link href={`/cms/job-tracker/${outreach.jobApplication.id}`}>
											<Briefcase className="h-3.5 w-3.5" /> Buka di Job Tracker
										</Link>
									</Button>
								</div>
							) : (
								<div className="space-y-3 text-xs text-muted-foreground">
									<p>
										Outreach ini belum terhubung dengan data di Job Tracker. Jika recruiter membalas positif, Anda dapat langsung mengonversinya menjadi aplikasi/interview aktif.
									</p>
									<Button
										onClick={handleConvertToJobTracker}
										disabled={isConverting}
										className="w-full text-xs h-9 gap-2"
									>
										{isConverting ? (
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
										) : (
											<Sparkles className="h-3.5 w-3.5" />
										)}
										Convert / Create in Job Tracker
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Attached Documents Card */}
					{outreach.attachments && outreach.attachments.length > 0 && (
						<Card className="border-border/60 shadow-sm">
							<CardHeader className="p-4 pb-3">
								<CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
									<Paperclip className="h-4 w-4 text-primary" />
									Lampiran File ({outreach.attachments.length})
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0 space-y-2 text-xs">
								{outreach.attachments.map((att, idx) => (
									<a
										key={idx}
										href={att.url}
										target="_blank"
										rel="noreferrer"
										className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors text-foreground group"
									>
										<div className="flex items-center gap-2 truncate">
											<FileText className="h-4 w-4 text-primary shrink-0" />
											<span className="font-medium truncate group-hover:underline">{att.name}</span>
										</div>
										<ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
									</a>
								))}
							</CardContent>
						</Card>
					)}

					{/* Delivery & Follow-up Metadata */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="p-4 pb-3">
							<CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<Clock className="h-4 w-4 text-primary" />
								Timeline & Cadence
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-0 space-y-2.5 text-xs text-muted-foreground">
							<div className="flex justify-between py-1 border-b border-border/40">
								<span>Tanggal Dibuat:</span>
								<span className="font-medium text-foreground">
									{format(new Date(outreach.createdAt), "dd MMM yyyy")}
								</span>
							</div>

							<div className="flex justify-between py-1 border-b border-border/40">
								<span>Email Pertama Dikirim:</span>
								<span className="font-medium text-foreground">
									{outreach.sentAt ? format(new Date(outreach.sentAt), "dd MMM yyyy, HH:mm") : "-"}
								</span>
							</div>

							<div className="flex justify-between py-1 border-b border-border/40">
								<span>Follow-up Due:</span>
								<span className={cn(
									"font-medium",
									outreach.followUpDueDate && new Date(outreach.followUpDueDate) < new Date() && !outreach.lastRepliedAt
										? "text-amber-500 font-bold"
										: "text-foreground",
								)}>
									{outreach.followUpDueDate ? format(new Date(outreach.followUpDueDate), "dd MMM yyyy") : "-"}
								</span>
							</div>

							<div className="flex justify-between py-1">
								<span>Balasan Terakhir:</span>
								<span className="font-medium text-emerald-500">
									{outreach.lastRepliedAt ? format(new Date(outreach.lastRepliedAt), "dd MMM yyyy, HH:mm") : "Belum ada balasan"}
								</span>
							</div>
						</CardContent>
					</Card>

				</div>
			</div>

			{/* Delete Confirmation Alert Dialog */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Outreach Ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini permanen dan akan menghapus seluruh rekaman draf email beserta balasan yang terkait.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Menghapus..." : "Hapus Outreach"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
