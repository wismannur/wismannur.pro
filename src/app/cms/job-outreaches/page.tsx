"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
	AlertCircle,
	Briefcase,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	ExternalLink,
	Eye,
	Linkedin,
	Mail,
	MessageSquare,
	MoreVertical,
	Plus,
	RefreshCw,
	Search,
	Send,
	SendHorizontal,
	Sparkles,
	Trash2,
	User,
} from "lucide-react";
import Link from "next/link";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
	jobOutreachService,
	type OutreachStatus,
	type OutreachType,
} from "@/services";


const STATUS_CONFIG: Record<
	OutreachStatus,
	{ label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
	draft: {
		label: "Draft",
		className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
		icon: Clock,
	},
	sent: {
		label: "Awaiting Reply",
		className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
		icon: Send,
	},
	follow_up_due: {
		label: "Follow-up Due ⚠️",
		className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse font-semibold",
		icon: AlertCircle,
	},
	replied: {
		label: "Replied 🎉",
		className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold",
		icon: CheckCircle2,
	},
	converted: {
		label: "Converted (Interview) 🚀",
		className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold",
		icon: Sparkles,
	},
	closed: {
		label: "Closed / No Fit",
		className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
		icon: Clock,
	},
};

const TYPE_CONFIG: Record<OutreachType, { label: string; color: string }> = {
	cold_pitch: {
		label: "Cold Pitch / Proactive",
		color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
	},
	direct_apply: {
		label: "Direct Apply via Email",
		color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
	},
	follow_up: {
		label: "Follow-up Cadence",
		color: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20",
	},
};

export default function JobOutreachesPage() {
	const queryClient = useQueryClient();


	const [statusTab, setStatusTab] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Fetch Outreaches
	const {
		data: outreaches = [],
		isLoading,
		isRefetching,
		refetch,
	} = useQuery({
		queryKey: ["jobOutreaches", statusTab, typeFilter, searchQuery],
		queryFn: () =>
			jobOutreachService.getAll({
				status: statusTab as OutreachStatus | "all",
				type: typeFilter as OutreachType | "all",
				search: searchQuery || undefined,
			}),
		refetchOnMount: "always",
		staleTime: 0,
	});

	// Fetch Analytics
	const { data: analytics } = useQuery({
		queryKey: ["jobOutreachesAnalytics"],
		queryFn: () => jobOutreachService.getAnalytics(),
		refetchOnMount: "always",
		staleTime: 0,
	});


	const handleDelete = async () => {
		if (!deleteTargetId) return;
		setIsDeleting(true);
		try {
			await jobOutreachService.delete(deleteTargetId);
			toast.success("Outreach berhasil dihapus.");
			setDeleteTargetId(null);
			queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
			queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
		} catch (err) {
			console.error("Delete outreach error:", err);
			toast.error("Gagal menghapus outreach.");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleSendDraft = async (id: string, contactEmail: string) => {
		try {
			await jobOutreachService.sendEmail(id);
			toast.success(`Email berhasil dikirim ke ${contactEmail} via hi@wismannur.pro!`);
			queryClient.invalidateQueries({ queryKey: ["jobOutreaches"] });
			queryClient.invalidateQueries({ queryKey: ["jobOutreachesAnalytics"] });
		} catch (err) {
			console.error("Send draft error:", err);
			toast.error("Gagal mengirim email draf.");
		}
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
						<SendHorizontal className="h-7 w-7 text-primary" />
						Job Outreaches & Cold Emails
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Kelola cold outreach, direct application via email, dan pantau balasan dari recruiter secara terintegrasi melalui{" "}
						<strong className="text-foreground">hi@wismannur.pro</strong>.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<Button
						variant="outline"
						size="icon"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="rounded-lg"
						title="Refresh data"
					>
						<RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
					</Button>
					<Button asChild className="gap-2 shadow-sm font-medium">
						<Link href="/cms/job-outreaches/new">
							<Plus className="h-4 w-4" /> New Outreach
						</Link>
					</Button>
				</div>
			</div>


			{/* Metric Analytics Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
				<Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between text-muted-foreground">
							<span className="text-xs font-medium">Total Outreaches</span>
							<Send className="h-4 w-4" />
						</div>
						<div className="text-2xl font-bold mt-2">
							{analytics?.totalOutreaches ?? 0}
						</div>
					</CardContent>
				</Card>

				<Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
							<span className="text-xs font-medium">Awaiting Reply</span>
							<Clock className="h-4 w-4" />
						</div>
						<div className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">
							{analytics?.awaitingReply ?? 0}
						</div>
					</CardContent>
				</Card>

				<Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
							<span className="text-xs font-medium">Follow-up Due</span>
							<AlertCircle className="h-4 w-4" />
						</div>
						<div className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">
							{analytics?.followUpDue ?? 0}
						</div>
					</CardContent>
				</Card>

				<Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
							<span className="text-xs font-medium">Replied / Active</span>
							<CheckCircle2 className="h-4 w-4" />
						</div>
						<div className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
							{analytics?.replied ?? 0}
						</div>
					</CardContent>
				</Card>

				<Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm col-span-2 sm:col-span-1">
					<CardContent className="p-4">
						<div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
							<span className="text-xs font-medium">Response Rate</span>
							<Sparkles className="h-4 w-4" />
						</div>
						<div className="text-2xl font-bold mt-2 text-purple-600 dark:text-purple-400">
							{analytics?.responseRate ?? 0}%
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters, Search & Tabs */}
			<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
				<Tabs
					value={statusTab}
					onValueChange={setStatusTab}
					className="w-full md:w-auto"
				>
					<TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted/60">
						<TabsTrigger value="all" className="text-xs py-1.5">
							All ({outreaches.length})
						</TabsTrigger>
						<TabsTrigger value="sent" className="text-xs py-1.5">
							Awaiting
						</TabsTrigger>
						<TabsTrigger value="follow_up_due" className="text-xs py-1.5">
							Follow-up Due
						</TabsTrigger>
						<TabsTrigger value="replied" className="text-xs py-1.5">
							Replied
						</TabsTrigger>
						<TabsTrigger value="converted" className="text-xs py-1.5">
							Converted
						</TabsTrigger>
						<TabsTrigger value="draft" className="text-xs py-1.5">
							Drafts
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="flex items-center gap-2">
					<div className="relative flex-1 sm:w-64">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Cari perusahaan, posisi, nama kontak..."
							className="pl-9 h-9 text-xs"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<Select value={typeFilter} onValueChange={setTypeFilter}>
						<SelectTrigger className="w-[140px] h-9 text-xs">
							<SelectValue placeholder="All Types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							<SelectItem value="cold_pitch">Cold Pitch</SelectItem>
							<SelectItem value="direct_apply">Direct Apply</SelectItem>
							<SelectItem value="follow_up">Follow-up</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* List Content */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<Card key={i} className="p-5 space-y-3">
							<Skeleton className="h-6 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-8 w-full" />
						</Card>
					))}
				</div>
			) : outreaches.length === 0 ? (
				<Card className="border-dashed p-12 text-center bg-muted/10">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
						<SendHorizontal className="h-7 w-7" />
					</div>
					<h3 className="text-lg font-semibold mb-1">Belum ada Job Outreach</h3>
					<p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
						Mulai inisiasi cold email atau kirim direct job application ke recruiter target Anda menggunakan AI generator.
					</p>
					<Button asChild className="gap-2 font-medium">
						<Link href="/cms/job-outreaches/new">
							<Plus className="h-4 w-4" /> Mulai Outreach Pertama
						</Link>
					</Button>
				</Card>

			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{outreaches.map((item) => {
						const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.sent;
						const typeInfo = TYPE_CONFIG[item.outreachType] || TYPE_CONFIG.cold_pitch;
						const StatusIcon = statusInfo.icon;

						const isFollowUpDue =
							item.status === "sent" &&
							item.followUpDueDate &&
							new Date(item.followUpDueDate) < new Date() &&
							!item.lastRepliedAt;

						return (
							<Card
								key={item.id}
								className={cn(
									"group hover:border-primary/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between",
									item.status === "replied" && "border-emerald-500/30 bg-emerald-500/[0.02]",
									isFollowUpDue && "border-amber-500/40 bg-amber-500/[0.02]",
								)}
							>
								<CardHeader className="p-4 pb-3 space-y-2.5">
									<div className="flex items-start justify-between gap-2">
										<div className="space-y-1 overflow-hidden">
											<div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
												<Building2 className="h-3.5 w-3.5 shrink-0" />
												<span className="truncate">{item.companyName}</span>
												{item.companyWebsite && (
													<a
														href={item.companyWebsite}
														target="_blank"
														rel="noreferrer"
														className="text-muted-foreground hover:text-primary transition-colors"
													>
														<ExternalLink className="h-3 w-3" />
													</a>
												)}
											</div>
											<h3 className="font-bold text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
												<Link href={`/cms/job-outreaches/${item.id}`}>
													{item.jobTitle}
												</Link>
											</h3>
										</div>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-full opacity-60 group-hover:opacity-100"
												>
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem asChild>
													<Link href={`/cms/job-outreaches/${item.id}`}>
														<Eye className="h-4 w-4 mr-2" /> Buka Thread Percakapan
													</Link>
												</DropdownMenuItem>
												{item.status === "draft" && (
													<DropdownMenuItem
														onClick={() => handleSendDraft(item.id, item.contactEmail)}
													>
														<Send className="h-4 w-4 mr-2 text-primary" /> Kirim Sekarang (Resend)
													</DropdownMenuItem>
												)}
												{item.jobApplicationId && (
													<DropdownMenuItem asChild>
														<Link href={`/cms/job-tracker/${item.jobApplicationId}`}>
															<Briefcase className="h-4 w-4 mr-2" /> Lihat di Job Tracker
														</Link>
													</DropdownMenuItem>
												)}
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => setDeleteTargetId(item.id)}
													className="text-destructive focus:text-destructive"
												>
													<Trash2 className="h-4 w-4 mr-2" /> Hapus Outreach
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>

									{/* Badges */}
									<div className="flex flex-wrap items-center gap-1.5">
										<Badge
											variant="outline"
											className={cn("text-[11px] font-medium border gap-1 py-0.5", statusInfo.className)}
										>
											<StatusIcon className="h-3 w-3" />
											{statusInfo.label}
										</Badge>
										<Badge
											variant="outline"
											className={cn("text-[10px] font-normal border py-0.5", typeInfo.color)}
										>
											{typeInfo.label}
										</Badge>
									</div>
								</CardHeader>

								<CardContent className="p-4 pt-0 space-y-3">
									{/* Contact Info Card */}
									<div className="p-2.5 bg-muted/40 rounded-lg border border-border/40 text-xs space-y-1.5">
										<div className="flex items-center justify-between">
											<div className="font-semibold flex items-center gap-1 text-foreground truncate">
												<User className="h-3 w-3 text-muted-foreground shrink-0" />
												<span className="truncate">{item.contactName}</span>
											</div>
											{item.contactLinkedin && (
												<a
													href={item.contactLinkedin}
													target="_blank"
													rel="noreferrer"
													className="text-muted-foreground hover:text-blue-500"
												>
													<Linkedin className="h-3 w-3" />
												</a>
											)}
										</div>
										<div className="flex items-center gap-1 text-muted-foreground truncate">
											<Mail className="h-3 w-3 shrink-0" />
											<span className="truncate">{item.contactEmail}</span>
										</div>
										{item.contactRole && (
											<div className="text-[11px] text-muted-foreground/80 truncate">
												{item.contactRole}
											</div>
										)}
									</div>

									{/* Subject & Preview */}
									<div className="space-y-1">
										<div className="text-xs font-semibold text-foreground line-clamp-1">
											&ldquo;{item.subject}&rdquo;
										</div>
										<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
											{item.body}
										</p>
									</div>


									{/* Footer Meta */}
									<div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											{item.sentAt ? (
												<span>
													Dikirim {formatDistanceToNow(new Date(item.sentAt), { addSuffix: true })}
												</span>
											) : (
												<span>Draf dibuat {format(new Date(item.createdAt), "dd MMM yyyy")}</span>
											)}
										</div>

										{item.jobApplication && (
											<Badge
												variant="secondary"
												className="text-[10px] bg-muted py-0 h-5"
											>
												Linked to Job Tracker
											</Badge>
										)}
									</div>

									{/* Quick Action Button */}
									<div className="pt-1">
										<Button
											asChild
											variant={item.status === "replied" ? "default" : "outline"}
											size="sm"
											className="w-full text-xs h-8 gap-1.5 font-medium"
										>
											<Link href={`/cms/job-outreaches/${item.id}`}>
												{item.status === "replied" ? (
													<>
														<MessageSquare className="h-3.5 w-3.5" /> Lihat Balasan Recruiter
													</>
												) : (
													<>
														<Eye className="h-3.5 w-3.5" /> Detail & Follow-up
													</>
												)}
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* Delete Confirmation Alert Dialog */}
			<AlertDialog
				open={Boolean(deleteTargetId)}
				onOpenChange={(open) => !open && setDeleteTargetId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Outreach Ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini akan menghapus data outreach serta riwayat percakapan thread email yang terkait.
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
