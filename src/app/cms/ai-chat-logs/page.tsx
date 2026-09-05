"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Bot,
  User,
  Search,
  RefreshCw,
  MessageSquare,
  MessagesSquare,
  Trash2,
  Clock,
  CheckCircle2,
  Inbox,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  getAiChatSessions,
  getAiChatSessionDetails,
  deleteAiChatSession,
} from "@/services/ai-chat/actions";
import { getSiteSettings, updateSiteSettings } from "@/services/site-settings/actions";
import type { AiChatSessionRow, AiChatMessageRow } from "@/db/schema";

export default function CmsAiChatLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<AiChatSessionRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch all chat sessions
  const {
    data: sessions = [],
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
    isRefetching: isSessionsRefetching,
  } = useQuery({
    queryKey: ["cms-ai-chat-sessions", searchQuery],
    queryFn: () => getAiChatSessions(searchQuery || undefined),
  });

  // Fetch Site Settings for public visibility toggle
  const {
    data: settings,
    isLoading: isSettingsLoading,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["cms-site-settings"],
    queryFn: () => getSiteSettings(),
  });

  // Derive the active selected session ID
  const activeSessionId = selectedSessionId || sessions[0]?.id || null;

  // Fetch active conversation details
  const {
    data: activeSessionDetails,
    isLoading: isDetailsLoading,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ["cms-ai-chat-details", activeSessionId],
    queryFn: () => (activeSessionId ? getAiChatSessionDetails(activeSessionId) : null),
    enabled: Boolean(activeSessionId),
  });

  const handleToggleAiChat = async (enabled: boolean) => {
    setIsToggling(true);
    try {
      await updateSiteSettings({ enableAiChat: enabled });
      toast.success(
        enabled
          ? "AI Assistant widget is now visible on public pages."
          : "AI Assistant widget is now hidden from public pages."
      );
      refetchSettings();
    } catch (error) {
      console.error("Failed to toggle AI chat visibility:", error);
      toast.error("Failed to update AI chat visibility.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAiChatSession(sessionToDelete.id);
      toast.success("Chat session deleted successfully.");
      if (selectedSessionId === sessionToDelete.id) {
        setSelectedSessionId(null);
      }
      setSessionToDelete(null);
      refetchSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete chat session.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalMessagesCount = sessions.reduce((sum, s) => sum + (s.messageCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">AI Chat Logs</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold text-xs">
              24/7 Digital Assistant
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor and review conversations between visitors, recruiters, and Wisman&apos;s AI
            Assistant
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Public Visibility Toggle Card */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-border/70 bg-card/60 shadow-xs">
            <div className="flex items-center gap-1.5">
              {settings?.enableAiChat ? (
                <Eye className="w-4 h-4 text-emerald-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground leading-tight">
                  Public Widget
                </span>
                <span className="text-[10px] text-muted-foreground leading-none">
                  {settings?.enableAiChat ? "Visible to Visitors" : "Hidden (Testing Mode)"}
                </span>
              </div>
            </div>
            <Switch
              checked={settings?.enableAiChat ?? false}
              onCheckedChange={handleToggleAiChat}
              disabled={isSettingsLoading || isToggling}
              aria-label="Toggle AI Assistant on public pages"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchSessions();
              refetchSettings();
              if (activeSessionId) refetchDetails();
            }}
            disabled={isSessionsRefetching}
            className="rounded-lg gap-1.5 text-xs h-9"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isSessionsRefetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Conversations</span>
            <MessagesSquare className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <div className="text-2xl font-bold mt-1.5 tracking-tight">{sessions.length}</div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Messages</span>
            <MessageSquare className="h-4 w-4 text-primary/60" />
          </div>
          <div className="text-2xl font-bold mt-1.5 tracking-tight text-primary">
            {totalMessagesCount}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Public Status</span>
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                settings?.enableAiChat ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )}
            />
          </div>
          <div
            className={cn(
              "text-sm font-semibold mt-2.5 flex items-center gap-1.5",
              settings?.enableAiChat
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            <Bot className="h-4 w-4" />{" "}
            {settings?.enableAiChat ? "Live (Public)" : "Hidden (Testing)"}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">AI Model</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-sm font-semibold mt-2.5 text-foreground truncate">
            Gemini 3.8 / 2.5 Flash
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-[360px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by topic, question, or IP address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full rounded-lg text-xs"
        />
      </div>

      {/* Main Split Layout: Sessions List (Left) & Chat Transcript (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sessions List */}
        <div className="lg:col-span-5 rounded-2xl border border-border/70 bg-card/40 overflow-hidden shadow-xs">
          <div className="p-3.5 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Conversations ({sessions.length})
            </span>
          </div>

          <div className="divide-y divide-border/40 max-h-[600px] overflow-y-auto">
            {isSessionsLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Loading conversations...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Visitor conversations from public pages will appear here automatically.
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const isSelected = activeSessionId === session.id;
                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:bg-muted/40 relative group",
                      isSelected && "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4
                          className={cn(
                            "font-semibold text-sm truncate",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {session.title || "New Conversation"}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {session.lastMessage || "No messages."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                        {format(new Date(session.updatedAt), "dd MMM, HH:mm")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-muted-foreground/70" />
                        {session.messageCount} messages
                      </span>
                      {session.ipAddress && (
                        <span className="hidden sm:inline-block font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {session.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Transcript View (Right) */}
        <div className="lg:col-span-7 rounded-2xl border border-border/70 bg-card/60 overflow-hidden shadow-xs min-h-[500px] flex flex-col">
          {activeSessionId && activeSessionDetails ? (
            <>
              {/* Transcript Header */}
              <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {activeSessionDetails.session.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span>
                      {format(
                        new Date(activeSessionDetails.session.createdAt),
                        "dd MMMM yyyy, HH:mm"
                      )}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">
                      ID: {activeSessionDetails.session.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSessionToDelete(activeSessionDetails.session)}
                  className="text-destructive hover:bg-destructive/10 text-xs h-8 gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>

              {/* Transcript Messages Feed */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[520px]">
                {activeSessionDetails.messages.map((msg: AiChatMessageRow, idx: number) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id || idx}
                      className={cn(
                        "flex gap-3 max-w-[90%]",
                        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5",
                          isUser
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "bg-muted border border-border text-foreground"
                        )}
                      >
                        {isUser ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4 text-primary" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1.5">
                        <div
                          className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xs",
                            isUser
                              ? "bg-primary text-primary-foreground rounded-tr-xs"
                              : "bg-muted/70 dark:bg-muted/30 border border-border/60 text-foreground rounded-tl-xs"
                          )}
                        >
                          {msg.content}
                        </div>

                        {/* Tool Call Info */}
                        {msg.toolCallName && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span>Tool Executed: {msg.toolCallName}</span>
                            </div>
                            {msg.toolCallArgs && (
                              <pre className="text-[11px] font-mono bg-background/50 p-2 rounded overflow-x-auto text-foreground mt-1">
                                {JSON.stringify(msg.toolCallArgs, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}

                        <span className="text-[10px] text-muted-foreground px-1">
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : isDetailsLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-sm text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Loading conversation...</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <MessagesSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground text-sm">Select a Conversation</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Choose a conversation session from the left list to view the complete transcript.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The conversation session &quot;
              <strong>{sessionToDelete?.title}</strong>&quot; and all associated messages will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSession}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
