"use client";

import type React from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Archive,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  User,
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
  contactService,
  inquiryMessagesService,
  type InquiryMessage,
} from "@/services";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contactId = params.id;

  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch contact inquiry details
  const {
    data: contact,
    isLoading: isContactLoading,
    refetch: refetchContact,
  } = useQuery({
    queryKey: ["contact", contactId],
    queryFn: async () => {
      const data = await contactService.getById(contactId);
      if (!data) throw new Error("Contact message not found");
      // Auto mark as read if new
      if (data.status === "new") {
        await contactService.updateStatus(contactId, "read");
      }
      return data;
    },
    enabled: Boolean(contactId),
  });

  // Fetch thread messages
  const {
    data: threadMessages = [],
    isLoading: isThreadLoading,
    refetch: refetchThread,
  } = useQuery({
    queryKey: ["contactThread", contactId],
    queryFn: () => inquiryMessagesService.getThreadMessages(contactId),
    enabled: Boolean(contactId),
  });

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setIsCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendReply = async () => {
    if (!contact || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      await inquiryMessagesService.sendAdminReply({
        inquiryId: contact.id,
        inquiryType: "contact",
        toEmail: contact.email,
        toName: contact.name,
        subject: contact.subject,
        message: replyMessage.trim(),
        originalMessageSnippet: contact.message,
      });

      toast.success("Email reply successfully sent to client!");
      setReplyMessage("");
      refetchThread();
      refetchContact();
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (error) {
      console.error("Error sending reply:", error);
      const msg = error instanceof Error ? error.message : "Failed to send email reply";
      toast.error(msg);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: "new" | "read" | "replied" | "archived") => {
    if (!contact) return;
    try {
      await contactService.updateStatus(contact.id, status);
      toast.success(`Status updated to ${status}`);
      refetchContact();
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    setIsDeleting(true);
    try {
      await contactService.delete(contact.id);
      toast.success("Contact message successfully deleted");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      router.push("/cms/contacts");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact message");
    } finally {
      setIsDeleting(false);
    }
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-400 animate-pulse" />
            New Message
          </span>
        );
      case "read":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-purple-400" />
            Read
          </span>
        );
      case "replied":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shadow-xs">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400" />
            Replied
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08] whitespace-nowrap">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08] whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  if (isContactLoading) {
    return (
      <div className="space-y-6 max-w-6xl pb-12">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-36 rounded-xl bg-white/[0.05]" />
        </div>
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl bg-white/[0.05]" />
            <Skeleton className="h-4 w-48 rounded-lg bg-white/[0.05]" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl bg-white/[0.05]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl bg-white/[0.05]" />
            <Skeleton className="h-64 w-full rounded-2xl bg-white/[0.05]" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl bg-white/[0.05]" />
            <Skeleton className="h-40 w-full rounded-2xl bg-white/[0.05]" />
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-16 space-y-4 bg-[#0C0E18]/60 rounded-2xl border border-white/[0.08] p-8">
        <Inbox className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Message Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          The contact message you are looking for was not found or has been deleted.
        </p>
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-white/[0.08] bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/[0.08]"
        >
          <Link href="/cms/contacts">Back to List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Bar Navigation & Status Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl"
        >
          <Link href="/cms/contacts">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Contact Messages</span>
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus("read")}
            disabled={contact.status === "read"}
            className="text-xs flex-1 sm:flex-none rounded-xl border-white/[0.08] bg-[#0C0E18]/80 text-slate-300 hover:text-white hover:bg-white/[0.06]"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            Mark Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus("replied")}
            disabled={contact.status === "replied"}
            className="text-xs flex-1 sm:flex-none rounded-xl border-white/[0.08] bg-[#0C0E18]/80 text-slate-300 hover:text-white hover:bg-white/[0.06]"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Mark Replied
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus("archived")}
            disabled={contact.status === "archived"}
            className="text-xs flex-1 sm:flex-none rounded-xl border-white/[0.08] bg-[#0C0E18]/80 text-slate-300 hover:text-white hover:bg-white/[0.06]"
          >
            <Archive className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-xs flex-1 sm:flex-none rounded-xl border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Page Header Info */}
      <div className="p-6 rounded-2xl bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {contact.name}
              </h1>
              {getStatusBadge(contact.status)}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
                <span>{contact.id}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(contact.id);
                    toast.success("Reference ID copied to clipboard!");
                  }}
                  className="hover:text-white transition-colors"
                  title="Copy Reference ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center gap-2 font-medium">
              <span className="text-slate-200 font-semibold">{contact.subject}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Received {format(new Date(contact.createdAt), "EEEE, dd MMMM yyyy · HH:mm")} WIB
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column (70%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Original Message Card */}
          <Card className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>Contact Message: {contact.subject}</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-white/[0.04] text-slate-400 border-white/[0.08]">
                  Original Inquiry
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="bg-[#131726]/70 border border-white/[0.06] rounded-xl p-4 text-xs sm:text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words font-normal">
                {contact.message}
              </div>
            </CardContent>
          </Card>

          {/* Conversation Thread Card */}
          <Card className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>Conversation Thread ({threadMessages.length})</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetchThread()}
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg"
                  title="Refresh thread"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isThreadLoading && "animate-spin text-indigo-400")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {threadMessages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-[#131726]/40 rounded-xl border border-dashed border-white/[0.08] p-6">
                  No email replies sent yet. Write a message below to reply to the client.
                </div>
              ) : (
                <div className="space-y-3">
                  {threadMessages.map((msg: InquiryMessage) => {
                    const isAdmin = msg.senderType === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "rounded-2xl p-4 text-xs transition-all border",
                          isAdmin
                            ? "bg-indigo-500/10 border-indigo-500/25 ml-2 sm:ml-6 md:ml-12 text-slate-200"
                            : "bg-[#131726]/80 border-white/[0.08] mr-2 sm:mr-6 md:mr-12 text-slate-200"
                        )}
                      >
                        <div className="flex flex-wrap justify-between items-center gap-1.5 mb-2 pb-2 border-b border-white/[0.06]">
                          <div className="flex flex-wrap items-center gap-2 font-semibold">
                            <span className={isAdmin ? "text-indigo-400 font-bold" : "text-white font-bold"}>
                              {isAdmin ? "Wisman Nur (Admin)" : msg.senderName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal truncate max-w-[180px]">
                              ({msg.senderEmail})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap">
                            {format(new Date(msg.createdAt), "dd MMM yyyy, HH:mm")} WIB
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-slate-200 leading-relaxed text-xs sm:text-sm break-words">
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reply Composer */}
              <div className="pt-4 border-t border-white/[0.06] space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-indigo-400" />
                    <span>Send Email Reply to Client</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Sender:{" "}
                    <strong className="text-indigo-400 font-semibold">{PUBLIC_SUPPORT_EMAIL}</strong>
                  </span>
                </div>

                <Textarea
                  placeholder={`Write an email reply for ${contact.name}... (Will be sent directly to ${contact.email})`}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={5}
                  className="text-xs sm:text-sm leading-relaxed resize-none rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40"
                />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="text-[11px] text-slate-400">
                    Client can reply directly to your email from their inbox.
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyMessage.trim()}
                    className="w-full sm:w-auto rounded-xl px-5 h-9 text-xs font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending Email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Send Email Reply</span>
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
          {/* Contact Info Card */}
          <Card className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-indigo-400" />
                <span>Sender Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 shrink-0 border border-white/[0.08] bg-[#131726]">
                  <AvatarFallback className="font-bold text-sm bg-indigo-500/20 text-indigo-300">
                    {getInitials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-white truncate">{contact.name}</div>
                  <div className="text-xs text-slate-400 truncate">{contact.email}</div>
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400 mb-1 text-[11px] font-medium">Work Email:</div>
                  <div className="flex items-center justify-between gap-2 bg-[#131726]/70 p-2.5 rounded-xl border border-white/[0.06] min-w-0">
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-indigo-400 font-medium hover:underline truncate text-xs"
                    >
                      {contact.email}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyEmail(contact.email)}
                      className="h-6 w-6 shrink-0 text-slate-400 hover:text-white hover:bg-white/[0.08]"
                      title="Copy Email"
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 mb-1 text-[11px] font-medium">Subject:</div>
                  <div className="font-medium text-slate-200 bg-[#131726]/70 p-2.5 rounded-xl border border-white/[0.06] text-xs break-words">
                    {contact.subject}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card className="rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-5 space-y-2.5 text-xs text-slate-400">
              <div className="flex justify-between gap-2">
                <span>Message ID:</span>
                <span className="font-mono text-slate-200 truncate max-w-[160px]">
                  {contact.id}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Received Date:</span>
                <span className="text-slate-200 whitespace-nowrap">
                  {format(new Date(contact.createdAt), "dd MMM yyyy HH:mm")} WIB
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg font-bold">
              Delete Contact Message?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              This action cannot be undone. The contact message from{" "}
              <strong className="text-white">{contact.name}</strong> ({contact.email}) and its
              entire email conversation history will be permanently deleted.
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
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
