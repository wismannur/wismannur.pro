"use client";

import type React from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	ArrowLeft,
	Briefcase,
	Building2,
	Calendar,
	Check,
	CheckCircle2,
	Clock,
	Code2,
	Copy,
	DollarSign,
	Flame,
	Inbox,
	Layout,
	Loader2,
	Mail,
	MessageSquare,
	Network,
	RefreshCw,
	Send,
	Sparkles,
	Timer,
	Trash2,
	User,
	Users,
	XCircle,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	serviceRequestService,
	inquiryMessagesService,
	type ServiceRequest,
	type InquiryMessage,
} from "@/services";

const SERVICE_TYPE_CONFIG: Record<
	string,
	{ label: string; icon: React.ElementType; className: string }
> = {
	frontend: {
		label: "Frontend Development",
		icon: Code2,
		className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
	},
	"ui-ux": {
		label: "UI/UX Implementation",
		icon: Layout,
		className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
	},
	performance: {
		label: "Performance Optimization",
		icon: Zap,
		className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
	},
	api: {
		label: "API Integration",
		icon: Network,
		className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
	},
	animation: {
		label: "Web Animation",
		icon: Sparkles,
		className: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
	},
	leadership: {
		label: "Technical Leadership",
		icon: Users,
		className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
	},
};

const TIMEFRAME_CONFIG: Record<
	string,
	{ label: string; icon: React.ElementType; className: string }
> = {
	asap: {
		label: "As soon as possible",
		icon: Flame,
		className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
	},
	"1-2-weeks": {
		label: "Within 1-2 weeks",
		icon: Timer,
		className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
	},
	"1-month": {
		label: "Within a month",
		icon: Calendar,
		className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
	},
	flexible: {
		label: "Flexible / Not urgent",
		icon: Clock,
		className: "bg-muted/50 text-muted-foreground border-border/50",
	},
};

export default function ServiceRequestDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();
	const requestId = params.id;

	const [replyMessage, setReplyMessage] = useState("");
	const [isSendingReply, setIsSendingReply] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isCopied, setIsCopied] = useState(false);

	// Fetch service request details
	const {
		data: request,
		isLoading: isRequestLoading,
		refetch: refetchRequest,
	} = useQuery({
		queryKey: ["serviceRequest", requestId],
		queryFn: async () => {
			const data = await serviceRequestService.getById(requestId);
			if (!data) throw new Error("Service request not found");
			// Auto mark as in-progress if new
			if (data.status === "new") {
				await serviceRequestService.updateStatus(requestId, "in-progress");
			}
			return data;
		},
		enabled: Boolean(requestId),
	});

	// Fetch thread messages
	const {
		data: threadMessages = [],
		isLoading: isThreadLoading,
		refetch: refetchThread,
	} = useQuery({
		queryKey: ["serviceRequestThread", requestId],
		queryFn: () => inquiryMessagesService.getThreadMessages(requestId),
		enabled: Boolean(requestId),
	});

	const handleCopyEmail = (email: string) => {
		navigator.clipboard.writeText(email);
		setIsCopied(true);
		toast.success("Email copied to clipboard");
		setTimeout(() => setIsCopied(false), 2000);
	};

	const handleSendReply = async () => {
		if (!request || !replyMessage.trim()) return;

		setIsSendingReply(true);
		try {
			await inquiryMessagesService.sendAdminReply({
				inquiryId: request.id,
				inquiryType: "service_request",
				toEmail: request.email,
				toName: request.name,
				subject: request.serviceType,
				message: replyMessage.trim(),
				originalMessageSnippet: request.projectDetails,
			});

			toast.success("Balasan email berhasil dikirim ke klien!");
			setReplyMessage("");
			refetchThread();
			refetchRequest();
			queryClient.invalidateQueries({ queryKey: ["serviceRequests"] });
		} catch (error) {
			console.error("Error sending reply:", error);
			const msg = error instanceof Error ? error.message : "Gagal mengirim balasan email";
			toast.error(msg);
		} finally {
			setIsSendingReply(false);
		}
	};

	const handleUpdateStatus = async (status: "new" | "in-progress" | "completed" | "cancelled") => {
		if (!request) return;
		try {
			await serviceRequestService.updateStatus(request.id, status);
			toast.success(`Status updated to ${status}`);
			refetchRequest();
			queryClient.invalidateQueries({ queryKey: ["serviceRequests"] });
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error("Failed to update status");
		}
	};

	const handleDelete = async () => {
		if (!request) return;
		setIsDeleting(true);
		try {
			await serviceRequestService.delete(request.id);
			toast.success("Service request berhasil dihapus");
			queryClient.invalidateQueries({ queryKey: ["serviceRequests"] });
			router.push("/cms/services");
		} catch (error) {
			console.error("Error deleting service request:", error);
			toast.error("Gagal menghapus service request");
		} finally {
			setIsDeleting(false);
		}
	};

	const getInitials = (name: string) => {
		if (!name) return "CL";
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "new":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
						<span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-500 animate-pulse" />
						New Request
					</span>
				);
			case "in-progress":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
						<span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-purple-500" />
						In Progress
					</span>
				);
			case "completed":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
						<span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500" />
						Completed
					</span>
				);
			case "cancelled":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
						<span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-rose-500" />
						Cancelled
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
						{status}
					</span>
				);
		}
	};

	const getBudgetLabel = (budget: string) => {
		const budgets: Record<string, string> = {
			"under-1000": "< $1,000",
			"1000-5000": "$1,000 - $5,000",
			"5000-10000": "$5,000 - $10,000",
			"10000-plus": "$10,000+",
			hourly: "Hourly rate",
		};
		return budgets[budget] || budget;
	};

	if (isRequestLoading) {
		return (
			<div className="space-y-6 max-w-6xl pb-12">
				<div className="flex items-center gap-3">
					<Skeleton className="h-9 w-36 rounded-lg" />
				</div>
				<div className="flex justify-between items-center border-b pb-4">
					<div className="space-y-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-48" />
					</div>
					<Skeleton className="h-9 w-32 rounded-lg" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					<div className="lg:col-span-8 space-y-6">
						<Skeleton className="h-48 w-full rounded-xl" />
						<Skeleton className="h-64 w-full rounded-xl" />
					</div>
					<div className="lg:col-span-4 space-y-4">
						<Skeleton className="h-48 w-full rounded-xl" />
						<Skeleton className="h-40 w-full rounded-xl" />
					</div>
				</div>
			</div>
		);
	}

	if (!request) {
		return (
			<div className="text-center py-16 space-y-4">
				<Inbox className="w-12 h-12 text-muted-foreground mx-auto" />
				<h2 className="text-xl font-semibold">Service Request Not Found</h2>
				<p className="text-sm text-muted-foreground">
					Permintaan layanan yang Anda cari tidak ditemukan atau telah dihapus.
				</p>
				<Button asChild variant="outline">
					<Link href="/cms/services">Kembali ke Daftar</Link>
				</Button>
			</div>
		);
	}

	const serviceConfig = SERVICE_TYPE_CONFIG[request.serviceType] || {
		label: request.serviceType,
		icon: Briefcase,
		className: "bg-primary/10 text-primary border-primary/20",
	};
	const ServiceIcon = serviceConfig.icon;

	const timeframeConfig = TIMEFRAME_CONFIG[request.timeframe] || {
		label: request.timeframe,
		icon: Clock,
		className: "bg-muted/40 text-muted-foreground border-border/50",
	};
	const TimeframeIcon = timeframeConfig.icon;

	return (
		<div className="space-y-6 max-w-6xl pb-12">
			{/* Top Bar Navigation & Status Controls */}
			<div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
				<Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
					<Link href="/cms/services">
						<ArrowLeft className="w-4 h-4" />
						<span>Kembali ke Service Requests</span>
					</Link>
				</Button>

				<div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleUpdateStatus("in-progress")}
						disabled={request.status === "in-progress"}
						className="text-xs flex-1 sm:flex-none"
					>
						<Clock className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
						In Progress
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleUpdateStatus("completed")}
						disabled={request.status === "completed"}
						className="text-xs flex-1 sm:flex-none"
					>
						<CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
						Completed
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleUpdateStatus("cancelled")}
						disabled={request.status === "cancelled"}
						className="text-xs flex-1 sm:flex-none hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
					>
						<XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
						Cancel
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsDeleteDialogOpen(true)}
						className="text-xs flex-1 sm:flex-none text-destructive hover:bg-destructive/10 hover:border-destructive/30"
					>
						<Trash2 className="w-3.5 h-3.5 mr-1.5" />
						Delete
					</Button>
				</div>
			</div>

			{/* Page Header Info */}
			<div className="flex flex-col md:flex-row justify-between gap-3 items-start md:items-center border-b pb-4">
				<div className="space-y-1 w-full md:w-auto">
					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						<h1 className="text-xl sm:text-2xl font-bold tracking-tight">{request.name}</h1>
						{getStatusBadge(request.status)}
					</div>
					<p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-1.5 sm:gap-2">
						<span>Permintaan layanan</span>
						<span>•</span>
						<span className="font-medium text-foreground">{serviceConfig.label}</span>
						<span>•</span>
						<span>Diajukan {format(new Date(request.createdAt), "dd MMM yyyy, HH:mm")}</span>
					</p>
				</div>
			</div>

			{/* Main Grid Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* Left / Main Column (70%) */}
				<div className="lg:col-span-8 space-y-6">
					{/* Project Requirements Card */}
					<Card className="rounded-xl border-border/60 shadow-xs">
						<CardHeader className="p-4 sm:p-6 pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<Briefcase className="w-4 h-4 text-primary" />
									<span>Rincian Kebutuhan Proyek</span>
								</CardTitle>
								<Badge variant="outline" className="text-[10px]">
									Inquiry Awal
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-4 sm:p-6 pt-0">
							<div className="bg-muted/30 border border-border/40 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
								{request.projectDetails}
							</div>
						</CardContent>
					</Card>

					{/* Conversation Thread Card */}
					<Card className="rounded-xl border-border/60 shadow-xs">
						<CardHeader className="p-4 sm:p-6 pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-semibold flex items-center gap-2">
									<MessageSquare className="w-4 h-4 text-primary" />
									<span>Riwayat Percakapan ({threadMessages.length})</span>
								</CardTitle>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => refetchThread()}
									className="h-7 w-7 text-muted-foreground"
									title="Refresh thread"
								>
									<RefreshCw className="h-3.5 w-3.5" />
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-4 sm:p-6 pt-0 space-y-4">
							{threadMessages.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground text-xs bg-muted/10 rounded-xl border border-dashed border-border/60">
									Belum ada balasan email terkirim. Tulis pesan di bawah untuk memulai komunikasi.
								</div>
							) : (
								<div className="space-y-3">
									{threadMessages.map((msg) => {
										const isAdmin = msg.senderType === "admin";
										return (
											<div
												key={msg.id}
												className={cn(
													"rounded-xl p-3.5 sm:p-4 text-xs transition-all border",
													isAdmin
														? "bg-primary/5 border-primary/20 ml-2 sm:ml-6 md:ml-12"
														: "bg-muted/40 border-border/50 mr-2 sm:mr-6 md:mr-12",
												)}
											>
												<div className="flex flex-wrap justify-between items-center gap-1 mb-1.5">
													<div className="flex flex-wrap items-center gap-1.5 font-semibold">
														<span className={isAdmin ? "text-primary" : "text-foreground"}>
															{isAdmin ? "Wisman Nur (Admin)" : msg.senderName}
														</span>
														<span className="text-[10px] text-muted-foreground font-normal truncate max-w-[160px] sm:max-w-none">
															({msg.senderEmail})
														</span>
													</div>
													<span className="text-[10px] text-muted-foreground whitespace-nowrap">
														{format(new Date(msg.createdAt), "dd MMM yyyy, HH:mm")}
													</span>
												</div>
												<div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-xs break-words">
													{msg.message}
												</div>
											</div>
										);
									})}
								</div>
							)}

							{/* Reply Composer */}
							<div className="pt-4 border-t space-y-3">
								<div className="flex flex-wrap justify-between items-center gap-1">
									<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
										<Mail className="h-4 w-4 text-primary" />
										<span>Kirim Balasan Email ke Klien</span>
									</label>
									<span className="text-[11px] text-muted-foreground">
										Pengirim: <strong className="text-primary font-medium">{PUBLIC_SUPPORT_EMAIL}</strong>
									</span>
								</div>

								<Textarea
									placeholder={`Tulis estimasi, penawaran harga, atau pertanyaan detail untuk ${request.name}... (Akan langsung dikirimkan ke ${request.email})`}
									value={replyMessage}
									onChange={(e) => setReplyMessage(e.target.value)}
									rows={5}
									className="text-xs leading-relaxed resize-none rounded-xl border-border/60 focus-visible:ring-primary/30"
								/>

								<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
									<span className="text-[11px] text-muted-foreground">
										Klien dapat langsung membalas email Anda via inbox email mereka.
									</span>
									<Button
										size="sm"
										onClick={handleSendReply}
										disabled={isSendingReply || !replyMessage.trim()}
										className="w-full sm:w-auto rounded-lg text-xs gap-1.5"
									>
										{isSendingReply ? (
											<>
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
												<span>Mengirim...</span>
											</>
										) : (
											<>
												<Send className="h-3.5 w-3.5" />
												<span>Kirim Balasan Email</span>
											</>
										)}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Sidebar Column (30%) */}
				<div className="lg:col-span-4 space-y-4">
					{/* Client Information Card */}
					<Card className="rounded-xl border-border/60 shadow-xs">
						<CardHeader className="p-4 sm:p-5 pb-3">
							<CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
								<User className="h-3.5 w-3.5 text-primary" />
								<span>Informasi Klien</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 sm:p-5 pt-0 space-y-4">
							<div className="flex items-center gap-3">
								<Avatar className="h-10 sm:h-11 w-10 sm:w-11 shrink-0 border border-border/60 bg-muted/60">
									<AvatarFallback className="font-bold text-sm bg-primary/15 text-primary">
										{getInitials(request.name)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<div className="font-semibold text-sm truncate">{request.name}</div>
									<div className="text-xs text-muted-foreground truncate">{request.email}</div>
								</div>
							</div>

							<Separator />

							<div className="space-y-2.5 text-xs">
								<div>
									<div className="text-muted-foreground mb-0.5">Email:</div>
									<div className="flex items-center justify-between gap-2 bg-muted/30 p-2 rounded-lg border border-border/40 min-w-0">
										<a
											href={`mailto:${request.email}`}
											className="text-primary font-medium hover:underline truncate text-xs"
										>
											{request.email}
										</a>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleCopyEmail(request.email)}
											className="h-6 w-6 shrink-0"
											title="Copy Email"
										>
											{isCopied ? (
												<Check className="h-3 w-3 text-emerald-500" />
											) : (
												<Copy className="h-3 w-3 text-muted-foreground" />
											)}
										</Button>
									</div>
								</div>

								{request.company && (
									<div>
										<div className="text-muted-foreground mb-0.5">Perusahaan / Brand:</div>
										<div className="flex items-center gap-1.5 font-medium text-foreground bg-muted/30 p-2 rounded-lg border border-border/40 truncate">
											<Building2 className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
											<span className="truncate">{request.company}</span>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Service & Scope Parameters Card */}
					<Card className="rounded-xl border-border/60 shadow-xs">
						<CardHeader className="p-4 sm:p-5 pb-3">
							<CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
								<Briefcase className="h-3.5 w-3.5 text-primary" />
								<span>Parameter Layanan</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 sm:p-5 pt-0 space-y-3 text-xs">
							<div className="flex justify-between items-center py-1 border-b border-border/40 gap-2">
								<span className="text-muted-foreground shrink-0">Tipe Layanan:</span>
								<Badge variant="outline" className={cn("gap-1.5 text-xs font-medium truncate", serviceConfig.className)}>
									<ServiceIcon className="h-3 w-3 shrink-0" />
									<span className="truncate max-w-[140px] sm:max-w-none">{serviceConfig.label}</span>
								</Badge>
							</div>

							<div className="flex justify-between items-center py-1 border-b border-border/40 gap-2">
								<span className="text-muted-foreground shrink-0">Estimasi Budget:</span>
								<div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted/40 border border-border/50 font-semibold tabular-nums text-foreground">
									<DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0 -mr-0.5" />
									<span>{getBudgetLabel(request.budget)}</span>
								</div>
							</div>

							<div className="flex justify-between items-center py-1 gap-2">
								<span className="text-muted-foreground shrink-0">Target Waktu:</span>
								<Badge variant="outline" className={cn("gap-1 text-xs font-medium truncate", timeframeConfig.className)}>
									<TimeframeIcon className="h-3 w-3 shrink-0" />
									<span className="truncate max-w-[140px] sm:max-w-none">{timeframeConfig.label}</span>
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Metadata Card */}
					<Card className="rounded-xl border-border/60 shadow-xs">
						<CardContent className="p-4 sm:p-5 space-y-2 text-[11px] text-muted-foreground">
							<div className="flex justify-between gap-2">
								<span>Request ID:</span>
								<span className="font-mono text-foreground/80 truncate max-w-[160px]">{request.id}</span>
							</div>
							<div className="flex justify-between gap-2">
								<span>Tanggal Pengajuan:</span>
								<span className="text-foreground/80 whitespace-nowrap">
									{format(new Date(request.createdAt), "dd MMM yyyy HH:mm")}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Delete Alert Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Service Request?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Permintaan layanan dari{" "}
							<strong className="text-foreground">{request.name}</strong> ({request.email}) beserta
							seluruh riwayat percakapan email akan dihapus secara permanen.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Menghapus...
								</>
							) : (
								"Hapus Permanen"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
