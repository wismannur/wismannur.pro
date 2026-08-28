"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Briefcase,
	Calendar,
	CheckCircle,
	Clock,
	CornerDownRight,
	DollarSign,
	Eye,
	Filter,
	Loader2,
	Mail,
	MessageSquare,
	RefreshCw,
	Search,
	Send,
	User,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useLoadingState } from "@/hooks/use-loading-state";
import { serviceRequestService, inquiryMessagesService, type ServiceRequest, type InquiryMessage } from "@/services";

export default function CmsServicesPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
	const [threadMessages, setThreadMessages] = useState<InquiryMessage[]>([]);
	const [replyMessage, setReplyMessage] = useState("");
	const [isSendingReply, setIsSendingReply] = useState(false);
	const { withLoading } = useLoadingState();

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["serviceRequests", currentPage, filterStatus],
		queryFn: () => serviceRequestService.getRequests(currentPage, null, filterStatus || undefined),
	});

	const loadThread = async (requestId: string) => {
		try {
			const messages = await inquiryMessagesService.getThreadMessages(requestId);
			setThreadMessages(messages);
		} catch (err) {
			console.error("Failed to load service request thread:", err);
		}
	};

	useEffect(() => {
		if (data) {
			setHasMore(data.hasMore);

			// Apply client-side search filtering
			if (searchQuery) {
				const filtered = data.requests.filter(
					(request) =>
						request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
						request.serviceType.toLowerCase().includes(searchQuery.toLowerCase()),
				);
				setFilteredRequests(filtered);
			} else {
				setFilteredRequests(data.requests);
			}
		}
	}, [data, searchQuery]);

	const handleViewRequest = async (id: string) => {
		try {
			// Start loading state
			const request = await withLoading(
				async () => {
					const result = await serviceRequestService.getById(id);
					return result;
				},
				{ loadingText: "Loading service request details..." },
			);

			if (request) {
				setSelectedRequest(request);
				setReplyMessage("");
				loadThread(id);
				setIsDetailOpen(true);

				// Mark as in-progress if it's new
				if (request.status === "new") {
					await serviceRequestService.updateStatus(id, "in-progress");
					refetch();
				}
			}
		} catch (error) {
			console.error("Error fetching service request details:", error);
			toast.error("Failed to load service request details");
		}
	};

	const handleSendReply = async () => {
		if (!selectedRequest || !replyMessage.trim()) return;

		setIsSendingReply(true);
		try {
			await inquiryMessagesService.sendAdminReply({
				inquiryId: selectedRequest.id,
				inquiryType: "service_request",
				toEmail: selectedRequest.email,
				toName: selectedRequest.name,
				subject: selectedRequest.serviceType,
				message: replyMessage.trim(),
				originalMessageSnippet: selectedRequest.projectDetails,
			});

			toast.success("Balasan email berhasil dikirim ke klien!");
			setReplyMessage("");
			loadThread(selectedRequest.id);
			setSelectedRequest({ ...selectedRequest, status: "in-progress" });
			refetch();
		} catch (error) {
			console.error("Error sending reply:", error);
			const msg = error instanceof Error ? error.message : "Gagal mengirim balasan email";
			toast.error(msg);
		} finally {
			setIsSendingReply(false);
		}
	};

	const handleUpdateStatus = async (
		id: string,
		status: "new" | "in-progress" | "completed" | "cancelled",
	) => {
		try {
			await serviceRequestService.updateStatus(id, status);
			toast.success(`Service request marked as ${status}`);
			refetch();
			if (selectedRequest?.id === id) {
				setSelectedRequest({ ...selectedRequest, status });
			}
		} catch (error) {
			console.error("Error updating service request status:", error);
			toast.error("Failed to update service request status");
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		// Search is applied client-side in the useEffect
	};

	const handleFilterChange = (value: string) => {
		setFilterStatus(value);
		setCurrentPage(1); // Reset to first page when filter changes
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "new":
				return <Badge variant="default">New</Badge>;
			case "in-progress":
				return <Badge variant="secondary">In Progress</Badge>;
			case "completed":
				return (
					<Badge variant="default" className="bg-green-500">
						Completed
					</Badge>
				);
			case "cancelled":
				return <Badge variant="destructive">Cancelled</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const formatDate = (date: Date) => {
		return format(date, "dd MMM yyyy HH:mm");
	};

	const getServiceTypeLabel = (serviceType: string) => {
		const serviceTypes: Record<string, string> = {
			frontend: "Frontend Development",
			"ui-ux": "UI/UX Implementation",
			performance: "Performance Optimization",
			api: "API Integration",
			animation: "Web Animation",
			leadership: "Technical Leadership",
		};

		return serviceTypes[serviceType] || serviceType;
	};

	const getBudgetLabel = (budget: string) => {
		const budgets: Record<string, string> = {
			"under-1000": "Under $1,000",
			"1000-5000": "$1,000 - $5,000",
			"5000-10000": "$5,000 - $10,000",
			"10000-plus": "$10,000+",
			hourly: "Hourly rate",
		};

		return budgets[budget] || budget;
	};

	const getTimeframeLabel = (timeframe: string) => {
		const timeframes: Record<string, string> = {
			asap: "As soon as possible",
			"1-2-weeks": "Within 1-2 weeks",
			"1-month": "Within a month",
			flexible: "Flexible / Not urgent",
		};

		return timeframes[timeframe] || timeframe;
	};

	// Define columns for the DataTable
	const columns: ColumnDef<ServiceRequest>[] = [
		{
			header: "Client",
			cell: (request) => (
				<div className="flex items-start gap-2">
					<Briefcase
						className={`h-4 w-4 mt-1 ${
							request.status === "new" ? "text-primary" : "text-muted-foreground"
						}`}
					/>
					<div>
						<div>{request.name}</div>
						<div className="text-sm text-muted-foreground">{request.email}</div>
						{request.company && (
							<div className="text-xs text-muted-foreground">{request.company}</div>
						)}
					</div>
				</div>
			),
			className: "w-[250px]",
		},
		{
			header: "Service",
			cell: (request) => (
				<div className="max-w-xs truncate">{getServiceTypeLabel(request.serviceType)}</div>
			),
		},
		{
			header: "Budget",
			cell: (request) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<DollarSign className="h-3.5 w-3.5 mr-1.5" />
					{getBudgetLabel(request.budget)}
				</div>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Timeframe",
			cell: (request) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<Clock className="h-3.5 w-3.5 mr-1.5" />
					{getTimeframeLabel(request.timeframe)}
				</div>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Date",
			cell: (request) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<Calendar className="h-3.5 w-3.5 mr-1.5" />
					{formatDate(request.createdAt)}
				</div>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Status",
			cell: (request) => getStatusBadge(request.status),
			className: "hidden md:table-cell",
		},
		{
			header: "Actions",
			cell: (request) => (
				<div className="flex justify-end gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleViewRequest(request.id)}
						className="h-8 px-2"
					>
						<Eye className="h-4 w-4 mr-1" />
						View
					</Button>
				</div>
			),
			className: "text-right",
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Service Requests</h1>
					<p className="text-muted-foreground">
						Manage and respond to service requests from clients
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
					<form onSubmit={handleSearch} className="relative w-full sm:w-auto">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search requests..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 w-full sm:w-[250px] rounded-lg"
						/>
					</form>

					<Select value={filterStatus} onValueChange={handleFilterChange}>
						<SelectTrigger className="w-full sm:w-[180px] rounded-lg">
							<div className="flex items-center">
								<Filter className="mr-2 h-4 w-4" />
								<SelectValue placeholder="Filter by status" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Requests</SelectItem>
							<SelectItem value="new">New</SelectItem>
							<SelectItem value="in-progress">In Progress</SelectItem>
							<SelectItem value="completed">Completed</SelectItem>
							<SelectItem value="cancelled">Cancelled</SelectItem>
						</SelectContent>
					</Select>

					<Button
						variant="outline"
						size="icon"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="rounded-lg"
					>
						<RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
						<span className="sr-only">Refresh</span>
					</Button>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={filteredRequests}
				isLoading={isLoading}
				loadingRows={5}
				emptyState={{
					icon: <Briefcase className="h-8 w-8 mb-2" />,
					title: "No service requests found",
					description: searchQuery
						? "Try adjusting your search query"
						: filterStatus
							? `No ${filterStatus} requests found`
							: "No service requests yet",
				}}
				pagination={{
					currentPage,
					hasMore,
					onPageChange: handlePageChange,
				}}
				rowClassName={(request) => (request.status === "new" ? "bg-primary/5" : "")}
				keyField="id"
			/>

			{/* Service Request Detail & Conversation Thread Dialog */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
					<DialogHeader className="px-6 pt-6 pb-2">
						<DialogTitle className="flex items-center gap-2">
							<MessageSquare className="h-5 w-5 text-primary" />
							<span>Project Request & Conversation</span>
						</DialogTitle>
						<DialogDescription>
							Thread percakapan dengan {selectedRequest?.name} ({selectedRequest?.email})
						</DialogDescription>
					</DialogHeader>

					{selectedRequest && (
						<div className="flex-1 overflow-y-auto px-6 py-2 space-y-5">
							{/* Status & Date bar */}
							<div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-border/40">
								<div className="text-xs text-muted-foreground flex items-center gap-1.5">
									<Calendar className="h-3.5 w-3.5" />
									<span>Diajukan: {formatDate(selectedRequest.createdAt)}</span>
								</div>
								{getStatusBadge(selectedRequest.status)}
							</div>

							{/* Client & Project Overview Cards */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="border border-border/60 rounded-xl p-3.5 bg-card/60 space-y-2">
									<div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
										<Briefcase className="h-3.5 w-3.5 text-primary" />
										<span>Detail Layanan</span>
									</div>
									<div className="space-y-1.5 text-xs">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Layanan:</span>
											<span className="font-medium text-foreground">
												{getServiceTypeLabel(selectedRequest.serviceType)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Estimasi Budget:</span>
											<span className="font-medium text-foreground">
												{getBudgetLabel(selectedRequest.budget)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Target Waktu:</span>
											<span className="font-medium text-foreground">
												{getTimeframeLabel(selectedRequest.timeframe)}
											</span>
										</div>
									</div>
								</div>

								<div className="border border-border/60 rounded-xl p-3.5 bg-card/60 space-y-2">
									<div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
										<User className="h-3.5 w-3.5 text-primary" />
										<span>Informasi Klien</span>
									</div>
									<div className="space-y-1.5 text-xs">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Nama:</span>
											<span className="font-medium text-foreground">{selectedRequest.name}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Email:</span>
											<a
												href={`mailto:${selectedRequest.email}`}
												className="text-primary hover:underline"
											>
												{selectedRequest.email}
											</a>
										</div>
										{selectedRequest.company && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Perusahaan:</span>
												<span className="font-medium text-foreground">
													{selectedRequest.company}
												</span>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Original Project Details */}
							<div className="border border-border/60 rounded-xl p-4 bg-card/60 shadow-sm space-y-2">
								<div className="flex items-center justify-between">
									<span className="font-semibold text-xs text-foreground">
										Rincian Kebutuhan Proyek:
									</span>
									<Badge variant="outline" className="text-[10px]">
										Inquiry Awal
									</Badge>
								</div>
								<div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 p-3 rounded-lg border border-border/30">
									{selectedRequest.projectDetails}
								</div>
							</div>

							{/* Thread Conversation History */}
							{threadMessages.length > 0 && (
								<div className="space-y-3 pt-2">
									<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
										<CornerDownRight className="h-3.5 w-3.5 text-primary" />
										<span>Riwayat Balasan ({threadMessages.length})</span>
									</div>

									<div className="space-y-3">
										{threadMessages.map((msg) => {
											const isAdmin = msg.senderType === "admin";
											return (
												<div
													key={msg.id}
													className={`rounded-xl p-4 text-xs transition-all border ${
														isAdmin
															? "bg-primary/5 border-primary/20 ml-6 md:ml-12"
															: "bg-muted/40 border-border/50 mr-6 md:mr-12"
													}`}
												>
													<div className="flex justify-between items-center mb-1.5">
														<div className="flex items-center gap-1.5 font-semibold">
															<span className={isAdmin ? "text-primary" : "text-foreground"}>
																{isAdmin ? "Wisman Nur (Admin)" : msg.senderName}
															</span>
															<span className="text-[10px] text-muted-foreground font-normal">
																({msg.senderEmail})
															</span>
														</div>
														<span className="text-[10px] text-muted-foreground">
															{formatDate(msg.createdAt)}
														</span>
													</div>
													<div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
														{msg.message}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{/* Reply Box */}
							<div className="border border-border/60 rounded-xl p-4 bg-muted/10 space-y-3">
								<div className="flex justify-between items-center">
									<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
										<Mail className="h-3.5 w-3.5 text-primary" />
										<span>Kirim Balasan Email ke Klien</span>
									</label>
									<span className="text-[11px] text-muted-foreground">
										Dikirim dari: <strong className="text-primary">hi@wismannur.pro</strong>
									</span>
								</div>

								<Textarea
									placeholder={`Tulis estimasi, pertanyaan, atau tawaran kerja sama untuk ${selectedRequest.name}... (Akan dikirimkan ke ${selectedRequest.email})`}
									value={replyMessage}
									onChange={(e) => setReplyMessage(e.target.value)}
									rows={4}
									className="text-xs resize-none rounded-lg border-border/60 focus-visible:ring-primary/30"
								/>

								<div className="flex justify-between items-center">
									<span className="text-[11px] text-muted-foreground">
										Klien dapat langsung membalas email Anda via inbox mereka.
									</span>
									<Button
										size="sm"
										onClick={handleSendReply}
										disabled={isSendingReply || !replyMessage.trim()}
										className="rounded-lg text-xs"
									>
										{isSendingReply ? (
											<>
												<Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
												Mengirim...
											</>
										) : (
											<>
												<Send className="h-3.5 w-3.5 mr-1.5" />
												Kirim Balasan Email
											</>
										)}
									</Button>
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="px-6 py-3 border-t border-border/40 bg-muted/10 flex-col sm:flex-row gap-2 justify-between">
						<div className="flex gap-2 w-full sm:w-auto">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									selectedRequest && handleUpdateStatus(selectedRequest.id, "in-progress")
								}
								disabled={selectedRequest?.status === "in-progress"}
								className="flex-1 text-xs"
							>
								<Clock className="h-3.5 w-3.5 mr-1.5" />
								In Progress
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									selectedRequest && handleUpdateStatus(selectedRequest.id, "completed")
								}
								disabled={selectedRequest?.status === "completed"}
								className="flex-1 text-xs"
							>
								<CheckCircle className="h-3.5 w-3.5 mr-1.5" />
								Completed
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									selectedRequest && handleUpdateStatus(selectedRequest.id, "cancelled")
								}
								disabled={selectedRequest?.status === "cancelled"}
								className="flex-1 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
							>
								<XCircle className="h-3.5 w-3.5 mr-1.5" />
								Cancel
							</Button>
						</div>

						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsDetailOpen(false)}
							className="text-xs"
						>
							Tutup
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
