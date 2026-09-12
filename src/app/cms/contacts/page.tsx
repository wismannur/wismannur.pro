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
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { useRegisterCmsPageContext } from "@/lib/cms-page-context";
import { contactService, type Contact } from "@/services";
import { CmsPageHeader } from "@/components/cms/cms-page-header";
import { CmsMetricCards } from "@/components/cms/cms-metric-cards";

export default function CmsContactsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["contacts", currentPage, filterStatus],
    queryFn: () =>
      contactService.getContacts(
        currentPage,
        null,
        filterStatus === "all" ? undefined : filterStatus || undefined
      ),
  });

  const hasMore = data?.hasMore ?? false;

  const filteredContacts = useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return data.contacts;

    const query = searchQuery.toLowerCase();
    return data.contacts.filter(
      (contact) =>
        contact.id.toLowerCase().includes(query) ||
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.subject.toLowerCase().includes(query) ||
        contact.message.toLowerCase().includes(query)
    );
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

  // Expose live rendered contacts to CMS Copilot
  useRegisterCmsPageContext(
    useMemo(() => {
      if (filteredContacts.length === 0) return null;
      return {
        pageTitle: "Inbox & Leads - Contacts",
        summary: `Loaded ${filteredContacts.length} contacts (New: ${stats.new}, Read: ${stats.read}, Replied: ${stats.replied}). Status filter: ${filterStatus || "all"}, search: "${searchQuery}"`,
        filters: { status: filterStatus, query: searchQuery, page: currentPage },
        activeItems: filteredContacts.slice(0, 15).map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          subject: c.subject,
          message: c.message.slice(0, 150),
          status: c.status,
          createdAt: c.createdAt,
        })),
      };
    }, [filteredContacts, stats, filterStatus, searchQuery, currentPage])
  );

  const handleViewContact = (id: string) => {
    router.push(`/cms/contacts/${id}`);
  };

  const handleUpdateStatus = async (
    id: string,
    status: "new" | "read" | "replied" | "archived"
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
      toast.success("Contact message successfully deleted");
      setContactToDelete(null);
      refetch();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact message");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            New
          </span>
        );
      case "read":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Read
          </span>
        );
      case "replied":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Replied
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08] whitespace-nowrap">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08] whitespace-nowrap">
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
            <Avatar className="h-9 w-9 shrink-0 border border-white/[0.08] bg-[#131726] group-hover/contact:border-indigo-500/40 transition-colors">
              <AvatarFallback
                className={cn(
                  "font-semibold text-xs transition-colors",
                  isNew
                    ? "bg-indigo-500/20 text-indigo-300 group-hover/contact:bg-indigo-500/30"
                    : "bg-white/[0.04] text-slate-300 group-hover/contact:text-white"
                )}
              >
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-100 text-sm truncate max-w-[170px] group-hover/contact:text-indigo-400 transition-colors">
                  {contact.name}
                </span>
                {isNew && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20 shrink-0">
                  {contact.id}
                </span>
                <span className="text-slate-600">•</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`mailto:${contact.email}`, "_self");
                  }}
                  className="hover:text-indigo-400 transition-colors truncate max-w-[140px]"
                  title={contact.email}
                >
                  {contact.email}
                </span>
              </div>
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
          <div className="font-semibold text-xs text-slate-200 truncate max-w-[280px]">
            {contact.subject}
          </div>
          {contact.message && (
            <p
              className="text-xs text-slate-400 line-clamp-1 max-w-[320px]"
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
            <span className="font-medium text-slate-200 whitespace-nowrap">
              {format(createdDate, "dd MMM yyyy")}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap mt-0.5">
              <Clock className="h-3 w-3 text-slate-500" />
              {format(createdDate, "HH:mm")} WIB
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
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <DropdownMenuItem
                onClick={() => handleViewContact(contact.id)}
                className="focus:bg-indigo-500/10 focus:text-indigo-300"
              >
                <Eye className="h-4 w-4 mr-2 text-indigo-400" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(contact.id, "read")}
                disabled={contact.status === "read"}
                className="focus:bg-slate-500/10 focus:text-slate-300"
              >
                <Eye className="h-4 w-4 mr-2 text-slate-400" />
                Mark as Read
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(contact.id, "replied")}
                disabled={contact.status === "replied"}
                className="focus:bg-emerald-500/10 focus:text-emerald-300"
              >
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-400" />
                Mark as Replied
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(contact.id, "archived")}
                disabled={contact.status === "archived"}
                className="focus:bg-white/[0.06] focus:text-slate-200"
              >
                <Archive className="h-4 w-4 mr-2 text-slate-400" />
                Archive Message
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem
                onClick={() => setContactToDelete(contact)}
                className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2 text-rose-400" />
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
      {/* Unified Page Header */}
      <CmsPageHeader
        icon={Mail}
        title="Contact Messages"
        description="Manage, review, and respond to incoming inquiries from your public contact form."
        onRefresh={() => refetch()}
        isRefreshing={isLoading || isRefetching}
      />

      {/* Interactive Metric Cards */}
      <CmsMetricCards
        gridCols="grid-cols-2 sm:grid-cols-4"
        metrics={[
          {
            id: "all",
            label: "Total Messages",
            value: stats.total,
            icon: Mail,
            color: "default",
            active: filterStatus === "all" || !filterStatus,
            onClick: () => handleFilterChange("all"),
          },
          {
            id: "new",
            label: "New Messages",
            value: stats.new,
            icon: Mail,
            color: "indigo",
            active: filterStatus === "new",
            onClick: () => handleFilterChange("new"),
          },
          {
            id: "read",
            label: "Read",
            value: stats.read,
            icon: Eye,
            color: "purple",
            active: filterStatus === "read",
            onClick: () => handleFilterChange("read"),
          },
          {
            id: "replied",
            label: "Replied",
            value: stats.replied,
            icon: CheckCircle2,
            color: "emerald",
            active: filterStatus === "replied",
            onClick: () => handleFilterChange("replied"),
          },
        ]}
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl bg-[#0C0E18]/80 border-white/[0.08] text-slate-200 text-xs focus:ring-indigo-500/30">
              <div className="flex items-center gap-2 truncate">
                <Filter className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <SelectValue placeholder="All Statuses" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
              <SelectItem value="all" className="text-xs focus:bg-indigo-500/10 focus:text-indigo-300">
                All Messages
              </SelectItem>
              <SelectItem value="new" className="text-xs focus:bg-blue-500/10 focus:text-blue-300">
                New Messages
              </SelectItem>
              <SelectItem value="read" className="text-xs focus:bg-purple-500/10 focus:text-purple-300">
                Read
              </SelectItem>
              <SelectItem value="replied" className="text-xs focus:bg-emerald-500/10 focus:text-emerald-300">
                Replied
              </SelectItem>
              <SelectItem value="archived" className="text-xs focus:bg-white/[0.06] focus:text-slate-300">
                Archived
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={filteredContacts}
          isLoading={isLoading}
          loadingRows={5}
          emptyState={{
            icon: <Inbox className="h-8 w-8 mb-2 text-slate-500" />,
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
              "transition-colors hover:bg-white/[0.03] cursor-pointer border-b border-white/[0.04]",
              contact.status === "new" && "bg-blue-500/[0.03]"
            )
          }
          keyField="id"
        />
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(contactToDelete)}
        onOpenChange={(open) => !open && setContactToDelete(null)}
      >
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg font-bold">
              Delete Contact Message?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              This action cannot be undone. The contact message from{" "}
              <strong className="text-white">{contactToDelete?.name}</strong> (
              {contactToDelete?.email}) and all related email thread history will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
              onClick={handleDeleteContact}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
