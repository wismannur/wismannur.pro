"use client";

import type React from "react";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Archive,
	CheckCircle,
	CheckCircle2,
	Clock,
	Eye,
	Filter,
	Inbox,
	Loader2,
	Mail,
	MoreHorizontal,
	RefreshCw,
	Search,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
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
import { cn } from "@/lib/utils";
import { contactService, type Contact } from "@/services";

export default function CmsContactsPage() {
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["contacts", currentPage, filterStatus],
		queryFn: () =>
			contactService.getContacts(
				currentPage,
				null,
				filterStatus === "all" ? undefined : filterStatus || undefined,
			),
	});

	useEffect(() => {
		if (data) {
			setHasMore(data.hasMore);

			// Apply client-side search filtering
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const filtered = data.contacts.filter(
					(contact) =>
						contact.name.toLowerCase().includes(query) ||
						contact.email.toLowerCase().includes(query) ||
						contact.subject.toLowerCase().includes(query) ||
						contact.message.toLowerCase().includes(query),
				);
				setFilteredContacts(filtered);
			} else {
				setFilteredContacts(data.contacts);
			}
		}
	}, [data, searchQuery]);

	// Overview metrics
	const stats = useMemo(() => {
		const contacts = data?.contacts || [];
		return {
			total: contacts.length,
			new: contacts.filter((c) => c.status === "new").length,
			read: contacts.filter((c) => c.status === "read").length,
			replied: contacts.filter((c) => c.status === "replied").length,
			archived: contacts.filter((c) => c.status === "archived").length,
		};
	}, [data]);

	const handleViewContact = (id: string) => {
		router.push(`/cms/contacts/${id}`);
	};

	const handleUpdateStatus = async (
		id: string,
		status: "new" | "read" | "replied" | "archived",
	) => {
		try {
			await contactService.updateStatus(id, status);
			toast.success(`Status updated to ${status}`);
			refetch();
		} catch (error) {
			console.error("Error updating contact status:", error);
			toast.error("Failed to update contact status");
		}
	};

	const handleDeleteContact = async () => {
		if (!contactToDelete) return;
		setIsDeleting(true);
		try {
			await contactService.delete(contactToDelete.id);
			toast.success("Pesan kontak berhasil dihapus");
			setContactToDelete(null);
			refetch();
		} catch (error) {
			console.error("Error deleting contact:", error);
			toast.error("Gagal menghapus pesan kontak");
		} finally {
			setIsDeleting(false);
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
	};

	const handleFilterChange = (value: string) => {
		setFilterStatus(value);
		setCurrentPage(1);
	};

	const getInitials = (name: string) => {
		if (!name) return "CT";
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "new":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
						<span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
						New
					</span>
				);
			case "read":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 whitespace-nowrap">
						<span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
						Read
					</span>
				);
			case "replied":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
						Replied
					</span>
				);
			case "archived":
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
						Archived
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
						{status}
					</span>
				);
		}
	};

	// Define columns for the DataTable
	const columns: ColumnDef<Contact>[] = [
		{
			header: "Contact",
			cell: (contact) => {
				const isNew = contact.status === "new";
				return (
					<div className="flex items-center gap-3 py-1 group/contact">
						<Avatar className="h-9 w-9 shrink-0 border border-border/60 bg-muted/60 group-hover/contact:border-primary/40 transition-colors">
							<AvatarFallback
								className={cn(
									"font-semibold text-xs transition-colors",
									isNew
										? "bg-primary/15 text-primary group-hover/contact:bg-primary/25"
										: "bg-muted text-muted-foreground group-hover/contact:text-foreground",
								)}
							>
								{getInitials(contact.name)}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col min-w-0">
							<div className="flex items-center gap-1.5">
								<span className="font-semibold text-foreground text-sm truncate max-w-[170px] group-hover/contact:text-primary transition-colors">
									{contact.name}
								</span>
								{isNew && (
									<span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-500 dark:text-blue-400">
										NEW
									</span>
								)}
							</div>
							<span
								onClick={(e) => {
									e.stopPropagation();
									window.open(`mailto:${contact.email}`, "_self");
								}}
								className="text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-[180px]"
								title={contact.email}
							>
								{contact.email}
							</span>
						</div>
					</div>
				);
			},
			className: "min-w-[230px]",
		},
		{
			header: "Subject & Message",
			cell: (contact) => (
				<div className="flex flex-col gap-1 py-1 min-w-0">
					<div className="font-medium text-xs text-foreground truncate max-w-[280px]">
						{contact.subject}
					</div>
					{contact.message && (
						<p
							className="text-xs text-muted-foreground/80 line-clamp-1 max-w-[320px]"
							title={contact.message}
						>
							{contact.message}
						</p>
					)}
				</div>
			),
			className: "min-w-[260px]",
		},
		{
			header: "Date",
			cell: (contact) => {
				const createdDate = new Date(contact.createdAt);
				return (
					<div className="flex flex-col text-xs">
						<span className="font-medium text-foreground whitespace-nowrap">
							{format(createdDate, "dd MMM yyyy")}
						</span>
						<span className="text-[11px] text-muted-foreground flex items-center gap-1 whitespace-nowrap mt-0.5">
							<Clock className="h-3 w-3 text-muted-foreground/60" />
							{format(createdDate, "HH:mm")}
						</span>
					</div>
				);
			},
			className: "hidden md:table-cell min-w-[120px] whitespace-nowrap",
		},
		{
			header: "Status",
			cell: (contact) => getStatusBadge(contact.status),
			className: "hidden sm:table-cell min-w-[110px] whitespace-nowrap",
		},
		{
			header: "",
			cell: (contact) => (
				<div
					className="flex items-center justify-end"
					onClick={(e) => e.stopPropagation()}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
							>
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem onClick={() => handleViewContact(contact.id)}>
								<Eye className="h-4 w-4 mr-2" />
								View Details & Thread
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => handleUpdateStatus(contact.id, "read")}
								disabled={contact.status === "read"}
							>
								<Eye className="h-4 w-4 mr-2 text-slate-400" />
								Mark as Read
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleUpdateStatus(contact.id, "replied")}
								disabled={contact.status === "replied"}
							>
								<CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
								Mark as Replied
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleUpdateStatus(contact.id, "archived")}
								disabled={contact.status === "archived"}
							>
								<Archive className="h-4 w-4 mr-2 text-muted-foreground" />
								Archive Message
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setContactToDelete(contact)}
								className="text-destructive focus:text-destructive focus:bg-destructive/10"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Message
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
			className: "text-right w-[60px] whitespace-nowrap",
		},
	];

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Contact Messages</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Manage, review, and respond to incoming inquiries from your contact form
					</p>
				</div>
			</div>

			{/* Metric Overview Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<button
					type="button"
					onClick={() => handleFilterChange("all")}
					className={cn(
						"cursor-pointer rounded-xl border p-3.5 text-left transition-all bg-card/50 hover:bg-card hover:border-border",
						filterStatus === "all" || !filterStatus
							? "ring-1 ring-primary/40 border-primary/40 shadow-xs"
							: "border-border/60",
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Total Messages</span>
						<Mail className="h-4 w-4 text-muted-foreground/60" />
					</div>
					<div className="text-2xl font-bold mt-1.5 tracking-tight">{stats.total}</div>
				</button>

				<button
					type="button"
					onClick={() => handleFilterChange("new")}
					className={cn(
						"cursor-pointer rounded-xl border p-3.5 text-left transition-all bg-card/50 hover:bg-card hover:border-blue-500/40",
						filterStatus === "new"
							? "ring-1 ring-blue-500/40 border-blue-500/40 bg-blue-500/5 shadow-xs"
							: "border-border/60",
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">New</span>
						<span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
					</div>
					<div className="text-2xl font-bold mt-1.5 tracking-tight text-blue-500">
						{stats.new}
					</div>
				</button>

				<button
					type="button"
					onClick={() => handleFilterChange("read")}
					className={cn(
						"cursor-pointer rounded-xl border p-3.5 text-left transition-all bg-card/50 hover:bg-card hover:border-slate-500/40",
						filterStatus === "read"
							? "ring-1 ring-slate-500/40 border-slate-500/40 bg-slate-500/5 shadow-xs"
							: "border-border/60",
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Read</span>
						<Eye className="h-4 w-4 text-slate-400" />
					</div>
					<div className="text-2xl font-bold mt-1.5 tracking-tight text-slate-400">
						{stats.read}
					</div>
				</button>

				<button
					type="button"
					onClick={() => handleFilterChange("replied")}
					className={cn(
						"cursor-pointer rounded-xl border p-3.5 text-left transition-all bg-card/50 hover:bg-card hover:border-emerald-500/40",
						filterStatus === "replied"
							? "ring-1 ring-emerald-500/40 border-emerald-500/40 bg-emerald-500/5 shadow-xs"
							: "border-border/60",
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Replied</span>
						<CheckCircle2 className="h-4 w-4 text-emerald-500" />
					</div>
					<div className="text-2xl font-bold mt-1.5 tracking-tight text-emerald-500">
						{stats.replied}
					</div>
				</button>
			</div>

			{/* Search & Filter Bar */}
			<div className="flex flex-col sm:flex-row justify-between gap-3">
				<form onSubmit={handleSearch} className="relative w-full sm:w-[320px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by name, email, subject..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 w-full rounded-lg text-xs"
					/>
				</form>

				<div className="flex items-center gap-2.5">
					<Select value={filterStatus} onValueChange={handleFilterChange}>
						<SelectTrigger className="w-full sm:w-[170px] rounded-lg text-xs">
							<div className="flex items-center gap-1.5 truncate">
								<Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
								<SelectValue placeholder="All Statuses" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all" className="text-xs">
								All Messages
							</SelectItem>
							<SelectItem value="new" className="text-xs">
								New
							</SelectItem>
							<SelectItem value="read" className="text-xs">
								Read
							</SelectItem>
							<SelectItem value="replied" className="text-xs">
								Replied
							</SelectItem>
							<SelectItem value="archived" className="text-xs">
								Archived
							</SelectItem>
						</SelectContent>
					</Select>

					<Button
						variant="outline"
						size="icon"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="rounded-lg shrink-0"
						title="Refresh Table"
					>
						<RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
						<span className="sr-only">Refresh</span>
					</Button>
				</div>
			</div>

			{/* Data Table */}
			<DataTable
				columns={columns}
				data={filteredContacts}
				isLoading={isLoading}
				loadingRows={5}
				emptyState={{
					icon: <Inbox className="h-8 w-8 mb-2 text-muted-foreground/60" />,
					title: "No contacts found",
					description: searchQuery
						? "Try adjusting your search query"
						: filterStatus && filterStatus !== "all"
							? `No ${filterStatus} messages found`
							: "No contact messages yet",
				}}
				pagination={{
					currentPage,
					hasMore,
					onPageChange: handlePageChange,
				}}
				onRowClick={(contact) => handleViewContact(contact.id)}
				rowClassName={(contact) =>
					cn(
						"transition-colors hover:bg-muted/50 cursor-pointer",
						contact.status === "new" && "bg-blue-500/[0.03] dark:bg-blue-500/[0.04]",
					)
				}
				keyField="id"
			/>

			{/* Delete Confirmation Alert Dialog */}
			<AlertDialog
				open={Boolean(contactToDelete)}
				onOpenChange={(open) => !open && setContactToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Pesan Kontak?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Pesan kontak dari{" "}
							<strong className="text-foreground">{contactToDelete?.name}</strong> (
							{contactToDelete?.email}) beserta seluruh riwayat balasan email akan dihapus secara permanen.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDeleteContact}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Menghapus...
								</>
							) : (
								"Hapus"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
