"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Archive,
	Calendar,
	CheckCircle,
	CornerDownRight,
	Eye,
	Filter,
	Inbox,
	Loader2,
	Mail,
	MessageSquare,
	RefreshCw,
	Search,
	Send,
	User,
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
import { contactService, inquiryMessagesService, type Contact, type InquiryMessage } from "@/services";

export default function CmsContactsPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
	const [threadMessages, setThreadMessages] = useState<InquiryMessage[]>([]);
	const [replyMessage, setReplyMessage] = useState("");
	const [isSendingReply, setIsSendingReply] = useState(false);
	const { withLoading } = useLoadingState();

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["contacts", currentPage, filterStatus],
		queryFn: () => contactService.getContacts(currentPage, null, filterStatus || undefined),
	});

	const loadThread = async (contactId: string) => {
		try {
			const messages = await inquiryMessagesService.getThreadMessages(contactId);
			setThreadMessages(messages);
		} catch (err) {
			console.error("Failed to load thread messages:", err);
		}
	};

	useEffect(() => {
		if (data) {
			setHasMore(data.hasMore);

			// Apply client-side search filtering
			if (searchQuery) {
				const filtered = data.contacts.filter(
					(contact) =>
						contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
						contact.subject.toLowerCase().includes(searchQuery.toLowerCase()),
				);
				setFilteredContacts(filtered);
			} else {
				setFilteredContacts(data.contacts);
			}
		}
	}, [data, searchQuery]);

	const handleViewContact = async (id: string) => {
		try {
			// Start loading state
			const contact = await withLoading(
				async () => {
					const result = await contactService.getById(id);
					return result;
				},
				{ loadingText: "Loading contact details..." },
			);

			if (contact) {
				setSelectedContact(contact);
				setReplyMessage("");
				loadThread(id);
				setIsDetailOpen(true);

				// Mark as read if it's new
				if (contact.status === "new") {
					await contactService.updateStatus(id, "read");
					refetch();
				}
			}
		} catch (error) {
			console.error("Error fetching contact details:", error);
			toast.error("Failed to load contact details");
		}
	};

	const handleSendReply = async () => {
		if (!selectedContact || !replyMessage.trim()) return;

		setIsSendingReply(true);
		try {
			await inquiryMessagesService.sendAdminReply({
				inquiryId: selectedContact.id,
				inquiryType: "contact",
				toEmail: selectedContact.email,
				toName: selectedContact.name,
				subject: selectedContact.subject,
				message: replyMessage.trim(),
				originalMessageSnippet: selectedContact.message,
			});

			toast.success("Balasan email berhasil dikirim ke klien!");
			setReplyMessage("");
			loadThread(selectedContact.id);
			setSelectedContact({ ...selectedContact, status: "replied" });
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
		status: "new" | "read" | "replied" | "archived",
	) => {
		try {
			await contactService.updateStatus(id, status);
			toast.success(`Contact marked as ${status}`);
			refetch();
			if (selectedContact?.id === id) {
				setSelectedContact({ ...selectedContact, status });
			}
		} catch (error) {
			console.error("Error updating contact status:", error);
			toast.error("Failed to update contact status");
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
			case "read":
				return <Badge variant="secondary">Read</Badge>;
			case "replied":
				return (
					<Badge variant="default" className="bg-green-500">
						Replied
					</Badge>
				);
			case "archived":
				return <Badge variant="outline">Archived</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const formatDate = (date: Date) => {
		return format(date, "dd MMM yyyy HH:mm");
	};

	// Define columns for the DataTable
	const columns: ColumnDef<Contact>[] = [
		{
			header: "Name",
			cell: (contact) => (
				<div className="flex items-start gap-2">
					<Mail
						className={`h-4 w-4 mt-1 ${
							contact.status === "new" ? "text-primary" : "text-muted-foreground"
						}`}
					/>
					<div>
						<div>{contact.name}</div>
						<div className="text-sm text-muted-foreground">{contact.email}</div>
					</div>
				</div>
			),
			className: "w-[250px]",
		},
		{
			header: "Subject",
			cell: (contact) => <div className="max-w-xs truncate">{contact.subject}</div>,
		},
		{
			header: "Date",
			cell: (contact) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<Calendar className="h-3.5 w-3.5 mr-1.5" />
					{formatDate(contact.createdAt)}
				</div>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Status",
			cell: (contact) => getStatusBadge(contact.status),
			className: "hidden md:table-cell",
		},
		{
			header: "Actions",
			cell: (contact) => (
				<div className="flex justify-end gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleViewContact(contact.id)}
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
					<h1 className="text-2xl font-bold tracking-tight">Contact Messages</h1>
					<p className="text-muted-foreground">Manage and respond to contact form submissions</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
					<form onSubmit={handleSearch} className="relative w-full sm:w-auto">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search contacts..."
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
							<SelectItem value="all">All Messages</SelectItem>
							<SelectItem value="new">New</SelectItem>
							<SelectItem value="read">Read</SelectItem>
							<SelectItem value="replied">Replied</SelectItem>
							<SelectItem value="archived">Archived</SelectItem>
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
				data={filteredContacts}
				isLoading={isLoading}
				loadingRows={5}
				emptyState={{
					icon: <Inbox className="h-8 w-8 mb-2" />,
					title: "No contacts found",
					description: searchQuery
						? "Try adjusting your search query"
						: filterStatus
							? `No ${filterStatus} messages found`
							: "No contact messages yet",
				}}
				pagination={{
					currentPage,
					hasMore,
					onPageChange: handlePageChange,
				}}
				rowClassName={(contact) => (contact.status === "new" ? "bg-primary/5" : "")}
				keyField="id"
			/>

			{/* Contact Detail & Conversation Thread Dialog */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
					<DialogHeader className="px-6 pt-6 pb-2">
						<DialogTitle className="flex items-center gap-2">
							<MessageSquare className="h-5 w-5 text-primary" />
							<span>Contact Inquiry & Conversation</span>
						</DialogTitle>
						<DialogDescription>
							Thread percakapan dengan {selectedContact?.name} ({selectedContact?.email})
						</DialogDescription>
					</DialogHeader>

					{selectedContact && (
						<div className="flex-1 overflow-y-auto px-6 py-2 space-y-5">
							{/* Status & Date bar */}
							<div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-border/40">
								<div className="text-xs text-muted-foreground flex items-center gap-1.5">
									<Calendar className="h-3.5 w-3.5" />
									<span>Diterima: {formatDate(selectedContact.createdAt)}</span>
								</div>
								{getStatusBadge(selectedContact.status)}
							</div>

							{/* Original Client Inquiry */}
							<div className="border border-border/60 rounded-xl p-4 bg-card/60 shadow-sm space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="p-1.5 rounded-full bg-primary/10 text-primary">
											<User className="h-3.5 w-3.5" />
										</div>
										<span className="font-semibold text-sm">{selectedContact.name}</span>
										<span className="text-xs text-muted-foreground">({selectedContact.email})</span>
									</div>
									<Badge variant="outline" className="text-[10px]">
										Pesan Pertama
									</Badge>
								</div>
								<div className="font-medium text-sm text-foreground pt-1">
									{selectedContact.subject}
								</div>
								<div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 p-3 rounded-lg border border-border/30">
									{selectedContact.message}
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
									placeholder={`Tulis pesan balasan untuk ${selectedContact.name}... (Akan langsung dikirimkan ke ${selectedContact.email})`}
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
								onClick={() => selectedContact && handleUpdateStatus(selectedContact.id, "read")}
								disabled={selectedContact?.status === "read"}
								className="flex-1 text-xs"
							>
								<Eye className="h-3.5 w-3.5 mr-1.5" />
								Mark Read
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() => selectedContact && handleUpdateStatus(selectedContact.id, "replied")}
								disabled={selectedContact?.status === "replied"}
								className="flex-1 text-xs"
							>
								<CheckCircle className="h-3.5 w-3.5 mr-1.5" />
								Mark Replied
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() => selectedContact && handleUpdateStatus(selectedContact.id, "archived")}
								disabled={selectedContact?.status === "archived"}
								className="flex-1 text-xs"
							>
								<Archive className="h-3.5 w-3.5 mr-1.5" />
								Archive
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

