"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getCmsCopilotSessions,
  getCmsCopilotSessionMessages,
  deleteCmsCopilotSession,
  updateCmsCopilotSessionTitle,
} from "@/services/cms-copilot/actions";
import type { CmsCopilotSessionRow } from "@/db/schema";
import type { ToolCallInfo, ToolResultInfo } from "@/services/cms-copilot/types";
import { getCmsPageContext } from "@/lib/cms-page-context";
import { useCopilotDraft, getInitialDraft, INPUT_HEIGHT_KEY } from "@/hooks/use-copilot-draft";
import { buildMarkdownFromSession, triggerFileDownload } from "./copilot-export";
import { streamCopilotChat } from "./copilot-stream";
import { getContextualPrompts } from "./copilot-prompts";
import { CopilotHeader } from "./copilot-header";
import { CopilotChatMessages, type MessageUI } from "./copilot-chat-messages";
import { CopilotChatInput } from "./copilot-chat-input";
import { CopilotHistoryView } from "./copilot-history-view";
import { CopilotSessionDialogs } from "./copilot-session-dialogs";

const INITIAL_GREETING: MessageUI = {
  id: "copilot-welcome",
  role: "assistant",
  content:
    "Halo Wisman! 👋 Saya adalah **CMS Executive Copilot** Anda yang ditenagai oleh **Gemini 3.8 Flash**.\n\nSaya terintegrasi penuh ke database Anda dengan kapabilitas **Query, Analisis, Mutasi, & Hapus Data** di seluruh menu CMS kita:\n- 📊 **General**: Dashboard KPI metrik situs & **My Second Brain** (Central SSOT Persona Engine untuk AI CV Tailor, Resume Google XYZ, Blog MDX & Project Case Study Generator)\n- 🎯 **Career Hub**: Job Hunter (ATS Feeds & Target Companies), Job Tracker (Pipeline, Interviews, & AI CV Tailor), Job Outreaches (Cold Pitches & Threads), Frontend Mastery (Big Tech Interview Gym & Curriculum)\n- 🚀 **Finder Project Hub**: Project Hunter (Site Audits), Project Tracker (Prospect Pipeline), Project Outreaches (Modernization Pitches)\n- 🧠 **AI Assistant**: AI English Fluency Hub (Habit Streak, Speech drills, Vocab decks), AI Chat Logs (Monitoring interaksi visitor)\n- 📬 **Inbox & Leads**: Contacts, Service Orders & Consulting Inquiries, Recruiter Hire Requests\n- 🌐 **Site Architecture**: Site Settings, Page Copy, Legal Pages\n- 📁 **Content & Catalog**: Blog Posts (Drafting & Sync via Second Brain), Projects (Case Study Generator & Sync), Resume (Google XYZ Polish & Sync), Skills, Service Catalog, FAQs, Process Steps, Testimonials, Availability\n- ⚙️ **Account & System**: Admin Profile & Preferences Settings\n\nAda modul yang ingin Anda query, kelola, atau perbarui sekarang?",
  status: "done",
};

let uniqueCounter = 0;
function createUniqueId(prefix: string): string {
  uniqueCounter += 1;
  return `${prefix}_${uniqueCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

const LAST_SESSION_STORAGE_KEY = "cms_copilot_last_session_id";

export function CmsCopilotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<CmsCopilotSessionRow[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LAST_SESSION_STORAGE_KEY);
        if (saved && saved.trim()) return saved.trim();
      } catch {
        // ignore
      }
    }
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `copilot-${Date.now()}`;
  });
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("cms_copilot_show_quick_prompts");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const toggleQuickPrompts = () => {
    setShowQuickPrompts((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cms_copilot_show_quick_prompts", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [messages, setMessages] = useState<MessageUI[]>([INITIAL_GREETING]);
  const [input, setInput] = useState<string>(() => getInitialDraft());
  const [draftRestored, setDraftRestored] = useState<boolean>(() => Boolean(getInitialDraft()));
  const { saveDraft, clearDraft, getDraft } = useCopilotDraft(currentSessionId);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<{ id: string; title: string } | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState("");
  const [isRenamingSession, setIsRenamingSession] = useState(false);
  const [isExportingSession, setIsExportingSession] = useState(false);
  const [inputHeight, setInputHeight] = useState<number>(() => {
    if (typeof window === "undefined") return 64;
    try {
      const saved = localStorage.getItem(INPUT_HEIGHT_KEY);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 56 && val <= 400) return val;
      }
      const initDraft = getInitialDraft();
      if (initDraft && (initDraft.includes("\n") || initDraft.length > 80)) {
        return 96;
      }
    } catch {
      // ignore
    }
    return 64;
  });
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const startHeightRef = useRef(64);

  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const currentSessionIdRef = useRef(currentSessionId);
  const messagesRef = useRef(messages);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Handle panel width resizing
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 520;
    try {
      const saved = localStorage.getItem("cms_copilot_panel_width");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 380 && val <= 1200) return val;
      }
    } catch {
      // ignore
    }
    return 520;
  });
  const [isDraggingWidth, setIsDraggingWidth] = useState(false);
  const isDraggingWidthRef = useRef(false);

  const handleMouseDownOnWidthResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingWidthRef.current = true;
    setIsDraggingWidth(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingWidthRef.current) return;
      const newWidth = Math.min(
        Math.max(window.innerWidth - moveEvent.clientX, 380),
        Math.floor(window.innerWidth * 0.94)
      );
      setPanelWidth(newWidth);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (isDraggingWidthRef.current) {
        isDraggingWidthRef.current = false;
        setIsDraggingWidth(false);
        const finalWidth = Math.min(
          Math.max(window.innerWidth - upEvent.clientX, 380),
          Math.floor(window.innerWidth * 0.94)
        );
        try {
          localStorage.setItem("cms_copilot_panel_width", String(finalWidth));
        } catch {
          // Ignore
        }
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDownOnResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    startHeightRef.current = inputHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaY = dragStartYRef.current - moveEvent.clientY;
      const maxHeight = Math.floor(window.innerHeight * 0.65);
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 56), maxHeight);
      setInputHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setInputHeight((finalHeight) => {
        try {
          localStorage.setItem(INPUT_HEIGHT_KEY, String(finalHeight));
        } catch {}
        return finalHeight;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartOnResize = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingRef.current = true;
    dragStartYRef.current = e.touches[0].clientY;
    startHeightRef.current = inputHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingRef.current || moveEvent.touches.length !== 1) return;
      const deltaY = dragStartYRef.current - moveEvent.touches[0].clientY;
      const maxHeight = Math.floor(window.innerHeight * 0.55);
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 48), maxHeight);
      setInputHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      setInputHeight((finalHeight) => {
        try {
          localStorage.setItem(INPUT_HEIGHT_KEY, String(finalHeight));
        } catch {}
        return finalHeight;
      });
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Multi-Level History Controller for Mobile Hardware / Browser Back Navigation
  const pushedLevelRef = useRef<number>(0);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (!state || !state.cmsCopilot) {
        if (isOpen) {
          setIsOpen(false);
          setViewMode("chat");
        }
        pushedLevelRef.current = 0;
        return;
      }
      if (state.cmsCopilotLevel === 1) {
        setIsOpen(true);
        setViewMode("chat");
        pushedLevelRef.current = 1;
      } else if (state.cmsCopilotLevel === 2) {
        setIsOpen(true);
        setViewMode("history");
        pushedLevelRef.current = 2;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (pushedLevelRef.current === 0) {
        window.history.pushState({ cmsCopilot: true, cmsCopilotLevel: 1 }, "");
        pushedLevelRef.current = 1;
      }
    } else {
      if (pushedLevelRef.current > 0) {
        pushedLevelRef.current = 0;
        if (window.history.state?.cmsCopilot) {
          window.history.back();
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (viewMode === "history") {
      if (pushedLevelRef.current === 1) {
        window.history.pushState({ cmsCopilot: true, cmsCopilotLevel: 2 }, "");
        pushedLevelRef.current = 2;
      }
    } else if (viewMode === "chat") {
      if (pushedLevelRef.current === 2) {
        pushedLevelRef.current = 1;
        if (window.history.state?.cmsCopilotLevel === 2) {
          window.history.back();
        }
      }
    }
  }, [viewMode]);

  const handleBackToChat = () => {
    if (pushedLevelRef.current === 2) {
      window.history.back();
    } else {
      setViewMode("chat");
    }
  };

  // Keyboard shortcut listener for Cmd+J / Ctrl+J & custom event listeners from navbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    const handleToggleEvent = () => {
      setIsOpen((prev) => !prev);
    };

    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    const handleCloseEvent = () => {
      setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-cms-copilot", handleToggleEvent);
    window.addEventListener("open-cms-copilot", handleOpenEvent);
    window.addEventListener("close-cms-copilot", handleCloseEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-cms-copilot", handleToggleEvent);
      window.removeEventListener("open-cms-copilot", handleOpenEvent);
      window.removeEventListener("close-cms-copilot", handleCloseEvent);
    };
  }, [isOpen]);

  // Load sessions on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    getCmsCopilotSessions()
      .then(async (data) => {
        if (!isMounted) return;
        setSessions(data);

        if (data.length > 0) {
          const targetId = currentSessionIdRef.current || data[0].id;
          const found = data.some((s) => s.id === targetId);

          if (found && messagesRef.current.length <= 1) {
            try {
              const rows = await getCmsCopilotSessionMessages(targetId);
              if (isMounted && rows && rows.length > 0) {
                setCurrentSessionId(targetId);
                try {
                  localStorage.setItem(LAST_SESSION_STORAGE_KEY, targetId);
                } catch {}
                setMessages(
                  rows.map((r) => ({
                    id: r.id,
                    role: r.role === "assistant" ? "assistant" : "user",
                    content: r.content,
                    toolCalls: (r.toolCalls as ToolCallInfo[] | null) ?? undefined,
                    toolResults: (r.toolResults as ToolResultInfo[] | null) ?? undefined,
                    status: "done",
                    createdAt: r.createdAt,
                  }))
                );
              }
            } catch (loadErr) {
              console.error("Failed to auto-restore active session messages:", loadErr);
            }
          }
        }
      })
      .catch((err) => console.error("Failed to load sessions:", err));

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const reloadSessions = useCallback(() => {
    getCmsCopilotSessions()
      .then((data) => setSessions(data))
      .catch((err) => console.error("Failed to reload sessions:", err));
  }, []);

  const [isRefreshingSession, setIsRefreshingSession] = useState(false);

  const handleRefreshCurrentSession = useCallback(async () => {
    if (!currentSessionId || isRefreshingSession) return;
    setIsRefreshingSession(true);
    try {
      const rows = await getCmsCopilotSessionMessages(currentSessionId);
      if (rows && rows.length > 0) {
        setMessages(
          rows.map((r) => ({
            id: r.id,
            role: r.role === "assistant" ? "assistant" : "user",
            content: r.content,
            toolCalls: (r.toolCalls as ToolCallInfo[] | null) ?? undefined,
            toolResults: (r.toolResults as ToolResultInfo[] | null) ?? undefined,
            status: "done",
            createdAt: r.createdAt,
          }))
        );
        toast.success("Percakapan berhasil disinkronkan dari database.");
      } else {
        setMessages([INITIAL_GREETING]);
        toast.info("Tidak ada riwayat pesan tersimpan untuk sesi ini.");
      }
      reloadSessions();
    } catch (err) {
      console.error("Failed to refresh session messages:", err);
      toast.error("Gagal menyinkronkan pesan.");
    } finally {
      setIsRefreshingSession(false);
    }
  }, [currentSessionId, isRefreshingSession, reloadSessions]);

  const handleSelectSession = async (session: CmsCopilotSessionRow) => {
    try {
      setIsLoading(true);
      if (input.trim()) {
        saveDraft(input, currentSessionId);
      }
      setCurrentSessionId(session.id);
      try {
        localStorage.setItem(LAST_SESSION_STORAGE_KEY, session.id);
      } catch {}

      const targetDraft = getDraft(session.id);
      setInput(targetDraft || "");
      setDraftRestored(Boolean(targetDraft));
      if (targetDraft && (targetDraft.includes("\n") || targetDraft.length > 80)) {
        setInputHeight((prev) => Math.max(prev, 96));
      }

      if (pushedLevelRef.current === 2) {
        window.history.back();
      } else {
        setViewMode("chat");
      }

      const rows = await getCmsCopilotSessionMessages(session.id);
      if (rows && rows.length > 0) {
        setMessages(
          rows.map((r) => ({
            id: r.id,
            role: r.role === "assistant" ? "assistant" : "user",
            content: r.content,
            toolCalls: (r.toolCalls as ToolCallInfo[] | null) ?? undefined,
            toolResults: (r.toolResults as ToolResultInfo[] | null) ?? undefined,
            status: "done",
            createdAt: r.createdAt,
          }))
        );
      } else {
        setMessages([INITIAL_GREETING]);
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
      toast.error("Gagal memuat pesan riwayat.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySessionId = (sid: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      navigator.clipboard.writeText(sid);
      setCopiedSessionId(sid);
      toast.success("Session ID berhasil disalin");
      setTimeout(() => setCopiedSessionId(null), 2500);
    } catch {
      toast.error("Gagal menyalin ID sesi");
    }
  };

  const handleDownloadActiveSession = () => {
    if (isExportingSession) return;
    const active = sessions.find((s) => s.id === currentSessionId);
    const { markdown, filename } = buildMarkdownFromSession(
      {
        id: currentSessionId,
        title: active?.title || "CMS Copilot Session",
        currentPath: pathname,
        createdAt: active?.createdAt || new Date(),
        updatedAt: active?.updatedAt || new Date(),
        messageCount: messages.length,
      },
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        createdAt: m.createdAt,
      }))
    );
    triggerFileDownload(markdown, filename);
    toast.success(`Berhasil mengunduh ${filename}`);
  };

  const handleDownloadSessionById = async (sess: CmsCopilotSessionRow, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isExportingSession) return;

    if (sess.id === currentSessionId && messages.length > 1) {
      handleDownloadActiveSession();
      return;
    }

    try {
      setIsExportingSession(true);
      const messagesRows = await getCmsCopilotSessionMessages(sess.id);
      if (!messagesRows || messagesRows.length === 0) {
        toast.error("Tidak ada pesan tersimpan dalam sesi ini");
        return;
      }

      const { markdown, filename } = buildMarkdownFromSession(
        {
          id: sess.id,
          title: sess.title,
          currentPath: sess.currentPath,
          createdAt: sess.createdAt,
          updatedAt: sess.updatedAt,
          messageCount: messagesRows.length,
        },
        messagesRows.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          toolCalls: (m.toolCalls as ToolCallInfo[]) || undefined,
          createdAt: m.createdAt,
        }))
      );
      triggerFileDownload(markdown, filename);
      toast.success(`Berhasil mengunduh ${filename}`);
    } catch (err) {
      console.error("Failed to export session:", err);
      toast.error("Gagal mengekspor sesi ke Markdown");
    } finally {
      setIsExportingSession(false);
    }
  };

  const handleNewChat = () => {
    const freshId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `copilot-${Date.now()}`;
    setCurrentSessionId(freshId);
    try {
      localStorage.setItem(LAST_SESSION_STORAGE_KEY, freshId);
    } catch {}
    setMessages([INITIAL_GREETING]);
    setInput("");
    clearDraft();
    setDraftRestored(false);
    setActiveTool(null);
    if (pushedLevelRef.current === 2) {
      window.history.back();
    } else {
      setViewMode("chat");
    }
  };

  const handleRequestDeleteSession = (e: React.MouseEvent, sess: { id: string; title: string }) => {
    e.stopPropagation();
    e.preventDefault();
    setSessionToDelete(sess);
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const targetId = sessionToDelete.id;
    setIsDeletingSession(true);
    try {
      await deleteCmsCopilotSession(targetId);
      setSessions((prev) => prev.filter((s) => s.id !== targetId));
      if (currentSessionId === targetId) {
        handleNewChat();
      }
      toast.success("Sesi chat berhasil dihapus.");
    } catch {
      toast.error("Gagal menghapus sesi chat.");
    } finally {
      setIsDeletingSession(false);
      setSessionToDelete(null);
    }
  };

  const handleOpenRenameDialog = (sess: { id: string; title: string }, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSessionToRename(sess);
    setRenameTitleInput(sess.title);
  };

  const handleConfirmRenameSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sessionToRename) return;
    const newTitle = renameTitleInput.trim();
    if (!newTitle) {
      toast.error("Judul sesi tidak boleh kosong.");
      return;
    }

    if (newTitle === sessionToRename.title) {
      setSessionToRename(null);
      return;
    }

    const targetId = sessionToRename.id;
    setIsRenamingSession(true);
    try {
      await updateCmsCopilotSessionTitle(targetId, newTitle);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetId ? { ...s, title: newTitle, updatedAt: new Date() } : s
        )
      );
      toast.success("Judul sesi berhasil diperbarui.");
      setSessionToRename(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah judul sesi.";
      toast.error(msg);
    } finally {
      setIsRenamingSession(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isLoading) return;

    const userMessageText = promptToSend.trim();
    if (!customPrompt) {
      setInput("");
      clearDraft(currentSessionId);
      setDraftRestored(false);
    }

    const userMessageId = createUniqueId("user");
    const assistantMessageId = createUniqueId("asst");

    const newMessages: MessageUI[] = [
      ...messages,
      { id: userMessageId, role: "user", content: userMessageText, status: "done" },
      { id: assistantMessageId, role: "assistant", content: "", status: "streaming" },
    ];

    setMessages(newMessages);
    setIsLoading(true);
    setActiveTool(null);

    try {
      let streamError: string | null = null;
      const pageContext = getCmsPageContext();
      const finalAccumulated = await streamCopilotChat(
        {
          sessionId: currentSessionId || undefined,
          currentPath: pathname,
          pageContext,
          messages: newMessages
            .filter((m) => m.id !== assistantMessageId)
            .map((m) => ({ role: m.role, content: m.content })),
        },
        {
          onSessionId: (sid) => {
            setCurrentSessionId(sid);
            try {
              localStorage.setItem(LAST_SESSION_STORAGE_KEY, sid);
            } catch {}
          },
          onSkillActivated: (skillId) => {
            if (skillId === "my-second-brain") {
              setActiveTool("⚡ Skill: My Second Brain (Live Snapshot & Memory Aktif)");
            }
          },
          onToolCall: (name, args) => {
            setActiveTool(`Executing: ${name}`);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      toolCalls: [...(msg.toolCalls || []), { name, args }],
                    }
                  : msg
              )
            );
          },
          onToolResult: (name, result) => {
            setActiveTool(null);
            queryClient.invalidateQueries();
            router.refresh();
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("cms-data-mutated", { detail: { tool: name, result } })
              );
            }
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      toolResults: [...(msg.toolResults || []), { name, result }],
                    }
                  : msg
              )
            );
          },
          onTextChunk: (accumulated) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulated }
                  : msg
              )
            );
          },
          onError: (errMsg) => {
            streamError = errMsg;
            toast.error(errMsg);
          },
        }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                status: streamError && !finalAccumulated ? "error" : "done",
                content:
                  finalAccumulated ||
                  (streamError
                    ? `⚠️ Terjadi kendala saat memproses: ${streamError}`
                    : msg.toolCalls && msg.toolCalls.length > 0
                    ? "Operasi data berhasil dijalankan."
                    : "Tidak ada respon teks yang dihasilkan oleh asisten."),
              }
            : msg
        )
      );

      reloadSessions();
      queryClient.invalidateQueries();
      router.refresh();
    } catch (err: unknown) {
      console.error("Chat Error:", err);
      const errMsg = err instanceof Error ? err.message : "Terjadi kendala saat memproses percakapan.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                status: "error",
                content: `⚠️ Maaf, terjadi error: ${errMsg}`,
              }
            : msg
        )
      );
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
      setActiveTool(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const q = historySearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      (s.lastMessage && s.lastMessage.toLowerCase().includes(q)) ||
      (s.currentPath && s.currentPath.toLowerCase().includes(q))
    );
  });

  const contextualPrompts = getContextualPrompts(pathname);
  const hasValidMessages = messages.filter((m) => m.id !== "copilot-welcome").length > 0;

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Slide-over Panel */}
      <div
        style={{
          "--panel-width": `${panelWidth}px`,
        } as React.CSSProperties}
        className={cn(
          "fixed top-0 right-0 h-[100dvh] max-h-[100dvh] z-50",
          "w-full sm:w-[min(100vw,var(--panel-width))]",
          "bg-[#090A10]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.85)]",
          "flex flex-col overscroll-contain",
          !isDraggingWidth && "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
          isDraggingWidth && "select-none"
        )}
      >
        {/* Left Resize Drag Handle */}
        <div
          onMouseDown={handleMouseDownOnWidthResize}
          className="group absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-50 hidden sm:flex items-center justify-center hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-colors select-none"
          title="Drag left/right to resize panel width"
        >
          <div className="w-1 h-12 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:h-20 group-active:bg-indigo-300 transition-all duration-200" />
        </div>

        {/* Panel Header */}
        <CopilotHeader
          viewMode={viewMode}
          onBackToChat={handleBackToChat}
          sessions={sessions}
          pathname={pathname}
          currentSessionId={currentSessionId}
          copiedSessionId={copiedSessionId}
          onCopySessionId={handleCopySessionId}
          onOpenHistory={() => setViewMode("history")}
          onRefreshCurrentSession={handleRefreshCurrentSession}
          isRefreshingSession={isRefreshingSession}
          isLoading={isLoading}
          onDownloadActiveSession={handleDownloadActiveSession}
          isExportingSession={isExportingSession}
          hasValidMessages={hasValidMessages}
          onOpenRenameDialog={(sess) => handleOpenRenameDialog(sess)}
          onOpenDeleteDialog={(sess) => setSessionToDelete(sess)}
          onNewChat={handleNewChat}
          onClose={() => setIsOpen(false)}
        />

        {viewMode === "history" ? (
          <CopilotHistoryView
            sessions={filteredSessions}
            currentSessionId={currentSessionId}
            searchQuery={historySearchQuery}
            onSearchChange={setHistorySearchQuery}
            copiedSessionId={copiedSessionId}
            isExportingSession={isExportingSession}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onCopySessionId={handleCopySessionId}
            onDownloadSession={handleDownloadSessionById}
            onOpenRenameDialog={handleOpenRenameDialog}
            onRequestDeleteSession={handleRequestDeleteSession}
          />
        ) : (
          <>
            <CopilotChatMessages
              messages={messages}
              isLoading={isLoading}
              activeTool={activeTool}
              scrollViewportRef={scrollViewportRef}
            />

            <CopilotChatInput
              input={input}
              setInput={setInput}
              inputHeight={inputHeight}
              setInputHeight={setInputHeight}
              isLoading={isLoading}
              showQuickPrompts={showQuickPrompts}
              toggleQuickPrompts={toggleQuickPrompts}
              contextualPrompts={contextualPrompts}
              onSubmit={handleSubmit}
              onMouseDownResize={handleMouseDownOnResize}
              onTouchStartResize={handleTouchStartOnResize}
              currentSessionId={currentSessionId}
              saveDraft={saveDraft}
              clearDraft={clearDraft}
              setDraftRestored={setDraftRestored}
              draftRestored={draftRestored}
            />
          </>
        )}
      </div>

      <CopilotSessionDialogs
        sessionToDelete={sessionToDelete}
        isDeletingSession={isDeletingSession}
        onCancelDelete={() => setSessionToDelete(null)}
        onConfirmDelete={handleConfirmDeleteSession}
        sessionToRename={sessionToRename}
        renameTitleInput={renameTitleInput}
        isRenamingSession={isRenamingSession}
        onRenameTitleChange={setRenameTitleInput}
        onCancelRename={() => setSessionToRename(null)}
        onConfirmRename={handleConfirmRenameSession}
      />
    </>
  );
}
