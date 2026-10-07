"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  CheckCircle2,
  Loader2,
  Plus,
  History,
  MessageSquare,
  Trash2,
  GripHorizontal,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Search,
  Pencil,
  Check,
  Copy,
  Terminal,
  ChevronDown,
  MoreVertical,
  Clock,
  Compass,
  RefreshCw,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getCmsPageContext, type CmsActivePageContext } from "@/lib/cms-page-context";
import { useCopilotDraft, getInitialDraft, INPUT_HEIGHT_KEY } from "@/hooks/use-copilot-draft";
import {
  COPILOT_SKILLS,
  extractSkillFromPrompt,
  getSkillByCommand,
  type CopilotSkillDefinition,
} from "@/services/cms-copilot/skills";
import { CopilotSlashCommandMenu } from "./copilot-slash-command-menu";
import { CopilotMarkdown } from "./copilot-markdown";

interface MessageUI {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallInfo[];
  toolResults?: ToolResultInfo[];
  status?: "streaming" | "done" | "error";
  createdAt?: string | Date;
}

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

function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes}m yang lalu`;
  if (diffHours < 24) return `${diffHours}j yang lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatSessionPath(path?: string | null): string | null {
  if (!path) return null;
  const clean = path.replace(/^\/cms\/?/, "").replace(/\/+/g, " › ").trim();
  return clean || "dashboard";
}

interface StreamCallbacks {
  onSessionId: (id: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>) => void;
  onToolResult: (name: string, result: Record<string, unknown>) => void;
  onTextChunk: (chunk: string) => void;
  onError: (errMsg: string) => void;
  onSkillActivated?: (skillId: string) => void;
}

async function streamCopilotChat(
  payload: {
    sessionId?: string;
    currentPath: string;
    pageContext?: CmsActivePageContext | null;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  },
  callbacks: StreamCallbacks
): Promise<string> {
  const response = await fetch("/api/cms/copilot/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error || "Gagal menghubungi Gemini API");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const data = JSON.parse(jsonStr);

        if (data.type === "session_id" && data.sessionId) {
          callbacks.onSessionId(data.sessionId);
        } else if (data.type === "skill_activated" && typeof data.skillId === "string") {
          callbacks.onSkillActivated?.(data.skillId);
        } else if (data.type === "tool_call") {
          callbacks.onToolCall(data.toolName, data.args);
        } else if (data.type === "tool_result") {
          callbacks.onToolResult(data.toolName, data.result);
        } else if (data.type === "text" && typeof data.content === "string") {
          fullText += data.content;
          callbacks.onTextChunk(fullText);
        } else if (data.type === "error") {
          callbacks.onError(data.content || "Error from Copilot");
        }
      } catch (parseErr) {
        console.error("SSE parse error:", parseErr);
      }
    }
  }

  return fullText;
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

  // Slash Commands & Skills State
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [slashSearchQuery, setSlashSearchQuery] = useState("");
  const [highlightedSkillIndex, setHighlightedSkillIndex] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentSessionIdRef = useRef(currentSessionId);
  const messagesRef = useRef(messages);

  const filteredSkills = React.useMemo(() => {
    if (!slashSearchQuery) return COPILOT_SKILLS;
    const q = slashSearchQuery.toLowerCase();
    return COPILOT_SKILLS.filter(
      (s) =>
        s.command.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [slashSearchQuery]);

  const activeSkill = React.useMemo(() => {
    const match = input.trim().match(/^(\/[a-zA-Z0-9_-]+)/);
    if (match) {
      return getSkillByCommand(match[1]);
    }
    return undefined;
  }, [input]);

  const handleInputChange = (newVal: string) => {
    setInput(newVal);
    saveDraft(newVal, currentSessionId);
    if (draftRestored && !newVal.trim()) {
      setDraftRestored(false);
    }

    if (newVal.startsWith("/")) {
      const spaceIdx = newVal.indexOf(" ");
      if (spaceIdx === -1) {
        setSlashSearchQuery(newVal.slice(1).trim().toLowerCase());
        setIsSlashMenuOpen(true);
        setHighlightedSkillIndex(0);
      } else {
        setIsSlashMenuOpen(false);
      }
    } else {
      setIsSlashMenuOpen(false);
    }
  };

  const handleSelectSkill = (skill: CopilotSkillDefinition) => {
    const spaceIdx = input.indexOf(" ");
    const existingMessage = spaceIdx !== -1 ? input.slice(spaceIdx + 1) : "";
    const nextVal = `${skill.command} ${existingMessage}`.trimStart();
    setInput(nextVal);
    saveDraft(nextVal, currentSessionId);
    setIsSlashMenuOpen(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = nextVal.length;
        inputRef.current.selectionEnd = nextVal.length;
      }
    }, 50);

    if (skill.status === "planned") {
      toast.info(`Skill ${skill.label} akan segera aktif di fase berikutnya!`);
    }
  };

  useEffect(() => {
    if (!isSlashMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setIsSlashMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSlashMenuOpen]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Panel Width Resize (Left Drag Handle)
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 540;
    try {
      const saved = localStorage.getItem("cms_copilot_panel_width");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 380 && val <= window.innerWidth * 0.95) {
          return val;
        }
      }
    } catch {
      // Ignore storage access issues
    }
    return 540;
  });
  const [isDraggingWidth, setIsDraggingWidth] = useState(false);
  const isDraggingWidthRef = useRef(false);

  const handleMouseDownOnWidthResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingWidthRef.current = true;
    setIsDraggingWidth(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingWidthRef.current) return;
      const calculatedWidth = window.innerWidth - moveEvent.clientX;
      const minWidth = 380;
      const maxWidth = Math.floor(window.innerWidth * 0.94);
      const clamped = Math.min(Math.max(calculatedWidth, minWidth), maxWidth);
      setPanelWidth(clamped);
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
          // Ignore storage access issues
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
        } catch {
          // ignore
        }
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
        } catch {
          // ignore
        }
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
  // Level 0: Closed / Page level
  // Level 1: Open in "chat" mode
  // Level 2: In "history" mode
  const pushedLevelRef = useRef<number>(0);
  const isProgrammaticPopRef = useRef<boolean>(false);

  const handleBackToChat = useCallback(() => {
    if (pushedLevelRef.current === 2) {
      window.history.back();
    } else {
      setViewMode("chat");
    }
  }, []);

  // Global Keyboard Shortcut (Cmd+J / Ctrl+J, Esc) & Custom Event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        if (viewMode === "history") {
          handleBackToChat();
        } else {
          setIsOpen(false);
        }
      }
    };
    const handleCustomToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-cms-copilot", handleCustomToggle);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-cms-copilot", handleCustomToggle);
    };
  }, [isOpen, viewMode, handleBackToChat]);

  // Mobile Hardware / Browser Back Button Interceptor
  // Supports multi-level back navigation:
  // - In "history" mode -> hardware back returns to active chat session
  // - In "chat" mode -> hardware back dismisses Copilot drawer without navigating away from page!
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isOpen) {
      if (pushedLevelRef.current > 0) {
        const levelsToPop = pushedLevelRef.current;
        pushedLevelRef.current = 0;
        isProgrammaticPopRef.current = true;
        window.history.go(-levelsToPop);
        setTimeout(() => {
          isProgrammaticPopRef.current = false;
        }, 300);
      }
      return;
    }

    // Copilot is Open: synchronize pushedLevel with viewMode
    if (viewMode === "chat") {
      if (pushedLevelRef.current === 0) {
        const currentState = window.history.state || {};
        window.history.pushState(
          { ...currentState, __cmsCopilotLevel: 1 },
          "",
          window.location.href
        );
        pushedLevelRef.current = 1;
      } else if (pushedLevelRef.current === 2) {
        pushedLevelRef.current = 1;
      }
    } else if (viewMode === "history") {
      if (pushedLevelRef.current === 0) {
        const currentState = window.history.state || {};
        window.history.pushState(
          { ...currentState, __cmsCopilotLevel: 1 },
          "",
          window.location.href
        );
        window.history.pushState(
          { ...currentState, __cmsCopilotLevel: 2 },
          "",
          window.location.href
        );
        pushedLevelRef.current = 2;
      } else if (pushedLevelRef.current === 1) {
        const currentState = window.history.state || {};
        window.history.pushState(
          { ...currentState, __cmsCopilotLevel: 2 },
          "",
          window.location.href
        );
        pushedLevelRef.current = 2;
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (isProgrammaticPopRef.current) return;

      const targetLevel = (e.state?.__cmsCopilotLevel as number | undefined) ?? 0;

      if (targetLevel === 2) {
        pushedLevelRef.current = 2;
        setViewMode("history");
        setIsOpen(true);
      } else if (targetLevel === 1) {
        // Returning back from history to active chat session!
        pushedLevelRef.current = 1;
        setViewMode("chat");
        setIsOpen(true);
      } else {
        // Target level is 0 -> dismiss Copilot back to page
        pushedLevelRef.current = 0;
        setIsOpen(false);
        setViewMode("chat");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, viewMode]);

  // Fetch session history when panel opens & auto-restore active conversation if needed
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    getCmsCopilotSessions()
      .then(async (data) => {
        if (!isMounted) return;
        setSessions(data);

        // Auto-restore active session messages if panel currently only holds initial greeting
        const savedSessionId =
          typeof window !== "undefined"
            ? localStorage.getItem(LAST_SESSION_STORAGE_KEY)
            : null;
        let targetId = savedSessionId || currentSessionIdRef.current;
        if (!data.some((s) => s.id === targetId) && data.length > 0 && !savedSessionId) {
          targetId = data[0].id;
        }

        if (targetId && data.some((s) => s.id === targetId)) {
          const currentMsgs = messagesRef.current;
          if (currentMsgs.length <= 1 && currentMsgs[0]?.id === INITIAL_GREETING.id) {
            try {
              const rows = await getCmsCopilotSessionMessages(targetId);
              if (isMounted && rows && rows.length > 0) {
                setCurrentSessionId(targetId);
                try {
                  localStorage.setItem(LAST_SESSION_STORAGE_KEY, targetId);
                } catch {
                  // ignore
                }
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

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
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

  // Load selected session messages
  const handleSelectSession = async (session: CmsCopilotSessionRow) => {
    try {
      setIsLoading(true);
      // Save pending draft for current session before switching
      if (input.trim()) {
        saveDraft(input, currentSessionId);
      }
      setCurrentSessionId(session.id);
      try {
        localStorage.setItem(LAST_SESSION_STORAGE_KEY, session.id);
      } catch {
        // ignore
      }

      // Restore draft for target session (if any)
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
      toast.error("Failed to load conversation history.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySessionId = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
    }
    setCopiedSessionId(id);
    toast.success(`Session ID disalin: ${id.slice(0, 8)}... (siap ditempel ke sesi terminal)`);
    setTimeout(() => {
      setCopiedSessionId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleNewChat = () => {
    const freshId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `copilot-${Date.now()}`;
    setCurrentSessionId(freshId);
    try {
      localStorage.setItem(LAST_SESSION_STORAGE_KEY, freshId);
    } catch {
      // ignore
    }
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
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
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

  // Context-aware suggested prompts based on current CMS path
  const getContextualPrompts = () => {
    // 1. General & Dashboard
    if (pathname === "/cms/dashboard" || pathname === "/cms") {
      return [
        { label: "📊 Health Check", prompt: "Tampilkan ringkasan eksekutif performa dan kesehatan seluruh situs CMS saat ini" },
        { label: "📬 Inquiries & Leads", prompt: "Apakah ada contact, hire request, atau service request baru yang belum dibaca?" },
        { label: "📝 Content Drafts", prompt: "Berapa banyak draft blog dan portfolio project yang belum dipublish?" },
      ];
    }
    if (pathname.includes("/cms/ai-knowledge")) {
      return [
        { label: "⚡ Skill Second Brain", prompt: "/my-second-brain Cross-check wawasan persona yang ada di Second Brain dan rangkum benang merahnya" },
        { label: "🧠 My Second Brain", prompt: "Tampilkan ringkasan seluruh dokumen knowledge aktif di My Second Brain per kategori" },
        { label: "➕ Tambah Persona / Impact", prompt: "Bantu saya tambahkan knowledge item baru ke kategori 'career-impact' dengan metrik terukur" },
        { label: "🏷️ 10 Kategori Knowledge", prompt: "Apa saja 10 kategori knowledge yang tersedia di My Second Brain dan bagaimana penggunaannya?" },
      ];
    }

    // 2. Career Hub
    if (pathname.includes("/cms/job-hunter")) {
      return [
        { label: "👀 Layar Ini", prompt: "Analisis lowongan kerja yang sedang tampil di layar ini dan berikan rekomendasi top 3" },
        { label: "⚡ ATS Feeds", prompt: "Ada lowongan remote baru apa saja di feed Ashby atau Greenhouse?" },
        { label: "🏢 Target Companies", prompt: "Tampilkan daftar perusahaan target ATS yang sedang dilacak" },
      ];
    }
    if (pathname.includes("/cms/job-outreaches")) {
      return [
        { label: "📈 Outreach Stats", prompt: "Bagaimana performa dan metrik konversi campaign Job Outreaches saat ini?" },
        { label: "✉️ Follow-up Due", prompt: "Tampilkan outreach yang statusnya butuh follow-up segera" },
        { label: "✍️ Draft Pitch", prompt: "Bantu saya buatkan cold pitch email baru untuk posisi Engineering Manager" },
      ];
    }
    if (pathname.includes("/cms/job-tracker")) {
      return [
        { label: "📊 Analytics", prompt: "Tampilkan analytics ringkasan Career Hub dan status lamaran saya saat ini" },
        { label: "🎯 AI CV Tailor", prompt: "Jalankan AI CV Tailor untuk lamaran terbaru dan hitung ATS match score menggunakan Second Brain" },
        { label: "📅 Interviews", prompt: "Apakah ada interview yang terjadwal dalam waktu dekat?" },
      ];
    }
    if (pathname.includes("/cms/frontend-mastery")) {
      return [
        { label: "⚡ Quick Drill", prompt: "Pilihkan satu topik JavaScript atau React coding drill yang paling krusial untuk saya latih sekarang" },
        { label: "📊 Mastery Progress", prompt: "Bagaimana progress saya di Frontend Mastery Gym sejauh ini? Berapa topik yang sudah mastered?" },
        { label: "🎯 Mock Interview", prompt: "Buatkan skenario mock interview frontend tingkat Senior/Staff untuk topik System Design" },
      ];
    }

    // 3. Finder Project Hub
    if (pathname.includes("/cms/project-hunter")) {
      return [
        { label: "🎯 Instant Audit", prompt: "Bantu audit instan website prospect baru dan hitung modernization opportunity score-nya" },
        { label: "🔎 Sourced Leads", prompt: "Tampilkan daftar prospect yang berstatus 'sourced' dan siap untuk diaudit" },
        { label: "🏢 Add Prospect", prompt: "Bantu saya tambahkan target company prospect baru ke Project Tracker" },
      ];
    }
    if (pathname.includes("/cms/project-tracker")) {
      return [
        { label: "📊 Pipeline Stats", prompt: "Tampilkan breakdown status pipeline prospect di Project Tracker saat ini" },
        { label: "⭐ Top Audits", prompt: "Tampilkan prospect yang memiliki skor audit tertinggi dan butuh dibuatkan pitch" },
        { label: "⚡ Run AI Audit", prompt: "Jalankan AI audit teknis & UX untuk prospect yang statusnya masih 'sourced'" },
      ];
    }
    if (pathname.includes("/cms/project-outreaches")) {
      return [
        { label: "🚀 Pitch Packs", prompt: "Tampilkan prospect yang berstatus 'pitch_ready' dan siap untuk dikirimi outreach" },
        { label: "✍️ Generate Pitch", prompt: "Generate modernization pitch pack (email, LinkedIn InMail, script Loom) untuk prospect terpilih" },
        { label: "✉️ Outreach Pipeline", prompt: "Berapa banyak outreach project yang statusnya sudah 'outreach_sent' atau 'negotiation'?" },
      ];
    }

    // 4. AI Assistant
    if (pathname.includes("/cms/ai-english-gym") || pathname.includes("/cms/ai-english-fluency")) {
      return [
        { label: "🔥 Habit Streak", prompt: "Berapa hari streak latihan berbicara bahasa Inggris saya dan total menit latihan?" },
        { label: "🎙️ Sesi Terakhir", prompt: "Tampilkan ringkasan hasil latihan speaking terakhir dan skor evaluasinya" },
        { label: "🥊 Pushback Challenge", prompt: "Berikan saya skenario tech drill pushback tingkat Staff Engineer sekarang" },
      ];
    }
    if (pathname.includes("/cms/ai-english-academy")) {
      return [
        { label: "🎓 Career Tracks", prompt: "Bagaimana progres unit dan lesson kurikulum developer English saya?" },
        { label: "📚 Vocabulary Deck", prompt: "Tampilkan daftar kosakata executive & technical English yang sedang saya pelajari" },
        { label: "🎯 CEFR Diagnostics", prompt: "Analisis estimasi CEFR standing saya dan area grammar/fluency yang perlu ditingkatkan" },
      ];
    }
    if (pathname.includes("/cms/ai-chat-logs")) {
      return [
        { label: "💬 Visitor Chats", prompt: "Apa saja pertanyaan atau interaksi terbaru dari pengunjung di web portofolio?" },
        { label: "🔍 Pertanyaan Populer", prompt: "Topik apa yang paling sering ditanyakan pengunjung web kepada bot AI?" },
        { label: "🧹 Clean Chats", prompt: "Tampilkan sesi chat yang hanya berisi pesan testing atau spam" },
      ];
    }

    // 5. Inbox & Leads
    if (pathname.includes("/cms/contacts")) {
      return [
        { label: "📬 Unread Messages", prompt: "Tampilkan pesan contact form yang statusnya masih 'new' dan belum dibaca" },
        { label: "✉️ Recent Contacts", prompt: "Tampilkan 5 pesan contact form terbaru beserta isi pesannya" },
        { label: "✓ Mark as Read", prompt: "Tandai pesan contact terbaru sebagai 'read'" },
      ];
    }
    if (pathname.includes("/cms/services") && !pathname.includes("/cms/service-catalog")) {
      return [
        { label: "🛠️ Service Orders", prompt: "Tampilkan ringkasan pesanan jasa freelance & konsultasi teknis yang baru masuk" },
        { label: "📋 Active Projects", prompt: "Tampilkan daftar service request aktif yang berstatus 'in-progress'" },
        { label: "💰 Budget Breakdown", prompt: "Berapa rata-rata budget project service request yang masuk?" },
      ];
    }
    if (pathname.includes("/cms/hire-requests")) {
      return [
        { label: "🏢 Hire Inquiries", prompt: "Tampilkan daftar permohonan hire / penawaran kerja yang baru masuk" },
        { label: "💼 Roles Offered", prompt: "Posisi dan company apa saja yang menawarkan pekerjaan di hire requests?" },
        { label: "🎯 Pipeline Status", prompt: "Tampilkan breakdown status hire requests (reviewed, interviewing, offered)" },
      ];
    }

    // 6. Site Architecture
    if (pathname.includes("/cms/site")) {
      return [
        { label: "🌐 Site Settings", prompt: "Tampilkan ringkasan konfigurasi Site Settings saat ini (SEO, brand, fitur)" },
        { label: "⚙️ Toggle Features", prompt: "Apakah fitur enableBlog dan enableAiChat sedang aktif di site settings?" },
        { label: "🎨 Branding", prompt: "Apa warna themeColor dan tagline yang sedang digunakan di situs?" },
      ];
    }
    if (pathname.includes("/cms/pages")) {
      return [
        { label: "📄 Page Copy List", prompt: "Tampilkan daftar halaman yang copy text-nya sudah tersimpan di database" },
        { label: "🏠 Home Hero Copy", prompt: "Tampilkan teks hero section dan CTA untuk halaman 'home'" },
        { label: "✍️ Review Copy", prompt: "Review apakah ada copy text halaman yang perlu di-update" },
      ];
    }
    if (pathname.includes("/cms/legal")) {
      return [
        { label: "⚖️ Legal Pages", prompt: "Tampilkan daftar halaman legal & policy yang aktif (Privacy Policy, Terms, dll.)" },
        { label: "📜 Privacy Policy", prompt: "Tampilkan isi dan tanggal update terakhir untuk halaman Privacy Policy" },
        { label: "➕ Tambah Policy", prompt: "Bantu saya buatkan draft halaman legal baru (mis: Cookie Policy)" },
      ];
    }

    // 7. Content & Catalog
    if (pathname.includes("/cms/blogs")) {
      return [
        { label: "📝 Blog Articles", prompt: "Tampilkan daftar artikel blog, jumlah views, dan status publikasinya" },
        { label: "✍️ Draft via Second Brain", prompt: "Buatkan draft artikel blog MDX baru yang digrounding opini arsitektur di My Second Brain" },
        { label: "🔄 Sync ke Second Brain", prompt: "Sinkronkan wawasan dan opini teknis dari artikel blog terbaru ke My Second Brain" },
      ];
    }
    if (pathname.includes("/cms/projects")) {
      return [
        { label: "💼 Portfolio Projects", prompt: "Tampilkan daftar portfolio projects dan teknologi yang digunakan" },
        { label: "🚀 Draft Case Study", prompt: "Bantu buatkan case study arsitektur proyek MDX mendalam berdasarkan verified Second Brain" },
        { label: "🔄 Sync ke Second Brain", prompt: "Sinkronkan tantangan arsitektur dan trade-off project terpilih ke My Second Brain" },
      ];
    }
    if (pathname.includes("/cms/resume")) {
      return [
        { label: "🎓 Resume Timeline", prompt: "Tampilkan seluruh riwayat work experience dan education yang terdaftar" },
        { label: "✨ Polish via Second Brain", prompt: "Poles deskripsi pengalaman kerja terbaru saya menggunakan formula Google XYZ dan pencapaian Second Brain" },
        { label: "🔄 Sync ke Second Brain", prompt: "Sinkronkan pencapaian peran kerja saat ini ke My Second Brain kategori career-impact" },
      ];
    }
    if (pathname.includes("/cms/skills")) {
      return [
        { label: "⚡ Skills List", prompt: "Tampilkan seluruh technical skills yang terdaftar di database dan urutannya" },
        { label: "➕ Tambah Skill", prompt: "Tambahkan skill baru ke daftar portfolio (misal: 'Google Gemini AI')" },
        { label: "🧹 Clean Skills", prompt: "Cek apakah ada skill duplikat atau yang belum dipublish" },
      ];
    }
    if (pathname.includes("/cms/service-catalog")) {
      return [
        { label: "🛠️ Service Offerings", prompt: "Tampilkan daftar paket layanan yang ada di Service Catalog dan price label-nya" },
        { label: "🏠 Homepage Services", prompt: "Layanan apa saja yang diset tampil di homepage (showOnHome)?" },
        { label: "➕ Tambah Layanan", prompt: "Bantu saya buatkan paket layanan baru untuk konsultasi arsitektur cloud" },
      ];
    }
    if (pathname.includes("/cms/faqs")) {
      return [
        { label: "❓ FAQs List", prompt: "Tampilkan daftar seluruh pertanyaan dan jawaban FAQ yang aktif" },
        { label: "➕ Tambah FAQ", prompt: "Bantu saya tambahkan FAQ baru seputar proses kerja dan estimasi project" },
        { label: "✏️ Update FAQ", prompt: "Periksa apakah ada FAQ yang jawabannya perlu diperbarui" },
      ];
    }
    if (pathname.includes("/cms/process-steps")) {
      return [
        { label: "🔄 Process Steps", prompt: "Tampilkan tahapan proses kerja (Process Steps) untuk services dan hire-me" },
        { label: "🛠️ Services Steps", prompt: "Tampilkan urutan langkah kerja spesifik untuk layanan freelance/project" },
        { label: "➕ Tambah Step", prompt: "Bantu saya buatkan tahapan proses kerja baru" },
      ];
    }
    if (pathname.includes("/cms/testimonials")) {
      return [
        { label: "💬 Testimonials", prompt: "Tampilkan daftar testimoni klien yang sudah ada beserta rating dan author-nya" },
        { label: "⭐ Published Testimonials", prompt: "Testimoni mana saja yang sudah dipublish di halaman /hire-me?" },
        { label: "➕ Tambah Testimoni", prompt: "Bantu saya catat testimoni baru dari klien" },
      ];
    }
    if (pathname.includes("/cms/availability")) {
      return [
        { label: "📅 Availability Slots", prompt: "Tampilkan status ketersediaan booking slot bulanan untuk klien" },
        { label: "🟢 Open Slots", prompt: "Bulan apa saja yang saat ini statusnya masih 'available'?" },
        { label: "➕ Tambah Slot", prompt: "Tambahkan slot ketersediaan baru untuk kuartal mendatang" },
      ];
    }

    // 8. Account & System
    if (pathname.includes("/cms/profile")) {
      return [
        { label: "👤 Admin Profile", prompt: "Tampilkan data profil admin saya saat ini (display name, bio, social links)" },
        { label: "✏️ Update Bio", prompt: "Bantu perbarui ringkasan bio profil saya agar lebih profesional" },
        { label: "🔗 Social Links", prompt: "Periksa link GitHub, LinkedIn, dan Twitter yang tersimpan di profil" },
      ];
    }
    if (pathname.includes("/cms/settings")) {
      return [
        { label: "⚙️ System Preferences", prompt: "Tampilkan pengaturan preferensi CMS saya (theme, notifikasi, timezone)" },
        { label: "🔔 Notifikasi", prompt: "Apakah notifikasi email untuk lead baru saat ini aktif?" },
        { label: "🕒 Timezone & Format", prompt: "Format tanggal dan timezone apa yang sedang diterapkan di CMS?" },
      ];
    }

    return [
      { label: "📊 CMS Overview", prompt: "Tampilkan health check metrik dan ringkasan seluruh modul di CMS" },
      { label: "🧠 My Second Brain", prompt: "Tampilkan ringkasan status persona dan dokumen knowledge di My Second Brain" },
      { label: "🎯 Career Hub", prompt: "Berapa banyak total lamaran aktif dan status pipeline saya di Career Hub?" },
      { label: "🚀 Project Hub", prompt: "Tampilkan ringkasan prospect client di Finder Project Hub" },
      { label: "📬 Inbox Leads", prompt: "Cek apakah ada kontak atau hire request baru yang belum saya review?" },
    ];
  };

  // Submit message & handle SSE stream
  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    if (isSlashMenuOpen) {
      setIsSlashMenuOpen(false);
    }
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
            } catch {
              // ignore
            }
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
            // Real-time background sync: Invalidate active TanStack queries & refresh router
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
      // Ensure all background page queries are completely synchronized
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

  return (
    <>
      {/* Backdrop Overlay (focus & dismiss on tap) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Slide-over Panel (Right Drawer with Left Resize Handle) */}
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
        {/* Left Resize Drag Handle (Hidden on Mobile) */}
        <div
          onMouseDown={handleMouseDownOnWidthResize}
          className="group absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-50 hidden sm:flex items-center justify-center hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-colors select-none"
          title="Drag left/right to resize panel width"
        >
          <div className="w-1 h-12 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:h-20 group-active:bg-indigo-300 transition-all duration-200" />
        </div>
        {/* Panel Header */}
        <div className="p-3 sm:p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0C0E18]/85 backdrop-blur-md gap-2">
          {viewMode === "history" ? (
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToChat}
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] shrink-0"
                title="Kembali ke percakapan"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5 sm:gap-2 truncate">
                  <span>Riwayat Percakapan</span>
                  <Badge
                    variant="outline"
                    className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] sm:text-[10px] px-1.5 py-0 font-mono font-normal shrink-0"
                  >
                    {sessions.length} sesi
                  </Badge>
                </h3>
                <p className="text-[10px] sm:text-[11px] text-gray-400 font-mono mt-0.5 truncate">Pilih atau cari percakapan sebelumnya</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                    <span className="sm:hidden">Staff Copilot</span>
                    <span className="hidden sm:inline">CMS Staff Copilot</span>
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] sm:text-[10px] px-1.5 py-0 font-mono font-normal shrink-0"
                  >
                    <span className="sm:hidden">3.8 Flash</span>
                    <span className="hidden sm:inline">Gemini 3.8 Flash</span>
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-gray-400 font-mono mt-0.5 min-w-0">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <span className="text-indigo-400 shrink-0">Context:</span>
                    <span className="truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] text-gray-300">{pathname}</span>
                  </div>
                  {currentSessionId && (
                    <>
                      <span className="hidden sm:inline-flex text-white/20 shrink-0">•</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => handleCopySessionId(currentSessionId, e)}
                              className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-indigo-500/20 text-gray-300 hover:text-indigo-300 border border-white/[0.08] hover:border-indigo-500/30 transition-all text-[9.5px] sm:text-[10px] font-mono cursor-pointer shrink-0"
                            >
                              <Terminal className="h-2.5 w-2.5 text-indigo-400" />
                              <span>ref:{currentSessionId.slice(0, 6)}</span>
                              {copiedSessionId === currentSessionId ? (
                                <Check className="h-2.5 w-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-2.5 w-2.5 text-gray-400" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-[#0C0E18] text-white border-white/[0.1] text-xs font-mono">
                            Klik untuk salin Session ID ({currentSessionId})
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {viewMode === "chat" ? (
              <>
                {/* Desktop-only Direct Action Buttons (Riwayat, Rename, Delete, Chat Baru) */}
                <div className="hidden sm:flex items-center gap-1">
                  {/* Switch to History Screen */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewMode("history")}
                          className="h-8 px-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] text-xs font-mono gap-1.5"
                          title="Riwayat Percakapan"
                        >
                          <History className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Riwayat</span>
                          {sessions.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-white/[0.08] text-[10px] text-gray-300">
                              {sessions.length}
                            </span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                        Buka Riwayat Percakapan
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Sync / Refresh Active Session Messages */}
                  {currentSessionId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefreshCurrentSession}
                            disabled={isRefreshingSession || isLoading}
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-indigo-300 hover:bg-white/[0.06]"
                            title="Sinkronkan pesan dari database"
                          >
                            <RefreshCw
                              className={cn(
                                "h-3.5 w-3.5",
                                isRefreshingSession && "animate-spin text-indigo-400"
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                          Sinkronkan Pesan dari Database
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Rename & Delete for Active Session */}
                  {currentSessionId && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const active = sessions.find((s) => s.id === currentSessionId);
                                handleOpenRenameDialog({
                                  id: currentSessionId,
                                  title: active?.title || "Sesi saat ini",
                                });
                              }}
                              className="h-8 w-8 rounded-lg text-gray-400 hover:text-indigo-300 hover:bg-white/[0.06]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                            Ubah Judul Sesi
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const active = sessions.find((s) => s.id === currentSessionId);
                                setSessionToDelete({
                                  id: currentSessionId,
                                  title: active?.title || "Sesi saat ini",
                                });
                              }}
                              className="h-8 w-8 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                            Hapus Sesi Ini
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}

                  {/* Desktop New Chat Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleNewChat}
                          className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                          title="Chat Baru"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                        Chat Baru
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Mobile Unified Three-Dots Menu (Consolidates Chat Baru, Riwayat, Rename, Delete into a spacious, ultra-clean header) */}
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] relative"
                        title="Menu Sesi Copilot"
                      >
                        <MoreVertical className="h-4 w-4" />
                        {sessions.length > 0 && (
                          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-[#0C0E18]" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-[#0C0E18] border-white/[0.1] text-white text-xs w-52 shadow-2xl p-1.5 z-[60]"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-500">
                        Menu Copilot
                      </div>

                      {/* Chat Baru */}
                      <DropdownMenuItem
                        onClick={handleNewChat}
                        className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08]"
                      >
                        <Plus className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-white">Chat Baru</span>
                          <span className="text-[10px] text-gray-400">Mulai sesi percakapan baru</span>
                        </div>
                      </DropdownMenuItem>

                      {/* Riwayat Percakapan */}
                      <DropdownMenuItem
                        onClick={() => setViewMode("history")}
                        className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 w-full">
                          <History className="h-4 w-4 text-indigo-400 shrink-0" />
                          <div className="flex flex-col min-w-0 w-full">
                            <span className="font-medium text-white">Riwayat Percakapan</span>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] text-gray-400">Buka arsip percakapan</span>
                              {sessions.length > 0 && (
                                <Badge
                                  variant="outline"
                                  className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] px-1.5 py-0 font-mono shrink-0 ml-1"
                                >
                                  {sessions.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>

                      {currentSessionId && (
                        <>
                          <DropdownMenuSeparator className="bg-white/[0.08] my-1" />
                          <DropdownMenuItem
                            onClick={handleRefreshCurrentSession}
                            disabled={isRefreshingSession || isLoading}
                            className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08]"
                          >
                            <RefreshCw
                              className={cn(
                                "h-4 w-4 text-indigo-400 shrink-0",
                                isRefreshingSession && "animate-spin"
                              )}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-white">Sinkronkan Pesan</span>
                              <span className="text-[10px] text-gray-400">Muat ulang pesan dari database</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const active = sessions.find((s) => s.id === currentSessionId);
                              handleOpenRenameDialog({
                                id: currentSessionId,
                                title: active?.title || "Sesi saat ini",
                              });
                            }}
                            className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08]"
                          >
                            <Pencil className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            <span>Ubah Judul Sesi</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleCopySessionId(currentSessionId, e)}
                            className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08]"
                          >
                            <Terminal className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            <span>Salin ID Sesi</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/[0.08] my-1" />
                          <DropdownMenuItem
                            onClick={() => {
                              const active = sessions.find((s) => s.id === currentSessionId);
                              setSessionToDelete({
                                id: currentSessionId,
                                title: active?.title || "Sesi saat ini",
                              });
                            }}
                            className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 hover:text-rose-300 focus:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5 shrink-0" />
                            <span>Hapus Sesi Ini</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="h-8 px-2 sm:px-2.5 rounded-lg border-indigo-500/30 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 hover:text-white text-xs gap-1 sm:gap-1.5"
                title="Chat Baru"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Chat Baru</span>
              </Button>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] shrink-0"
              title="Tutup Copilot"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === "history" ? (
          /* Full-View History Screen */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#090A10]">
            {/* Search Bar & Summary Header */}
            <div className="p-3.5 sm:p-4 pb-2.5 border-b border-white/[0.04] bg-[#0C0E18]/50">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Cari topik, isi pesan, atau halaman..."
                  className="w-full bg-[#121624] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchQuery("")}
                    className="absolute right-2.5 p-1 text-gray-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Counter / Meta Info */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mt-2 px-0.5">
                <span>
                  {filteredSessions.length} sesi {historySearchQuery ? "ditemukan" : "tersimpan"}
                </span>
                {currentSessionId && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    1 sesi aktif
                  </span>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 scrollbar-thin">
              {filteredSessions.length === 0 ? (
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-500 mb-3 shadow-inner">
                    <History className="h-6 w-6" />
                  </div>
                  {historySearchQuery ? (
                    <>
                      <p className="text-xs font-semibold text-white">Tidak ada sesi ditemukan</p>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-xs leading-relaxed">
                        Tidak ada percakapan dengan kata kunci &quot;{historySearchQuery}&quot;
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistorySearchQuery("")}
                        className="mt-3.5 border-white/[0.1] bg-white/[0.03] text-gray-300 hover:text-white text-xs rounded-xl"
                      >
                        Reset Pencarian
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-white">Belum ada riwayat sesi</p>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-xs leading-relaxed">
                        Percakapan Anda dengan Gemini Copilot akan otomatis tersimpan di sini.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleNewChat}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl shadow-md shadow-indigo-600/20"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Mulai Chat Sekarang
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                filteredSessions.map((sess) => {
                  const isActive = currentSessionId === sess.id;
                  const pathLabel = formatSessionPath(sess.currentPath);

                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={cn(
                        "group relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5",
                        "active:scale-[0.99] select-none",
                        isActive
                          ? "bg-gradient-to-r from-indigo-950/50 via-[#131728]/90 to-[#101322]/80 border-indigo-500/40 shadow-sm shadow-indigo-500/10"
                          : "bg-[#111422]/65 border-white/[0.07] hover:bg-[#15192b]/85 hover:border-white/[0.16] hover:shadow-xs"
                      )}
                    >
                      {/* Active Indicator Accent Bar on Left */}
                      {isActive && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}

                      {/* Header Row: Icon + Title + Context Badge + Action Buttons */}
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                        {/* Session Avatar / Icon */}
                        <div
                          className={cn(
                            "h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200",
                            isActive
                              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-xs"
                              : "bg-white/[0.03] text-gray-400 border-white/[0.07] group-hover:text-indigo-300 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10"
                          )}
                        >
                          {isActive ? (
                            <Sparkles className="h-4 w-4 text-indigo-300 animate-pulse" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </div>

                        {/* Title & Preview Body */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                              <h4
                                className={cn(
                                  "text-xs sm:text-[13px] leading-snug font-medium line-clamp-1 break-words",
                                  isActive
                                    ? "text-white font-semibold"
                                    : "text-gray-200 group-hover:text-white"
                                )}
                                title={sess.title}
                              >
                                {sess.title}
                              </h4>

                              {isActive && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium shrink-0">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Aktif
                                </span>
                              )}

                              {pathLabel && (
                                <span
                                  className="inline-flex items-center gap-1 text-[9px] font-mono text-gray-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded max-w-[120px] truncate shrink-0"
                                  title={`Konteks Halaman: ${sess.currentPath}`}
                                >
                                  <Compass className="h-2.5 w-2.5 text-indigo-400/80 shrink-0" />
                                  <span className="truncate">{pathLabel}</span>
                                </span>
                              )}
                            </div>

                            {/* Integrated Action Buttons (Rename & Delete) */}
                            <div
                              className="flex items-center gap-0.5 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleOpenRenameDialog({ id: sess.id, title: sess.title }, e)
                                }
                                className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-indigo-300 hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors cursor-pointer"
                                title="Ubah judul sesi"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleRequestDeleteSession(e, { id: sess.id, title: sess.title })
                                }
                                className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors cursor-pointer"
                                title="Hapus sesi"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Snippet Preview of Last Message */}
                          {sess.lastMessage && (
                            <p className="text-[11px] sm:text-xs text-gray-400 line-clamp-1 mt-1 font-normal leading-relaxed group-hover:text-gray-300 transition-colors">
                              {sess.lastMessage}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Timestamp + Message Count + Session Reference Pill */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.05] text-[10px] sm:text-[10.5px] text-gray-400 font-mono">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex items-center gap-1 shrink-0 text-gray-400">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>{formatRelativeTime(sess.updatedAt || sess.createdAt)}</span>
                          </span>

                          {sess.messageCount > 0 && (
                            <span className="hidden xs:inline-flex items-center gap-1 text-gray-400 border-l border-white/[0.08] pl-2 shrink-0">
                              <MessageSquare className="h-2.5 w-2.5 text-gray-400" />
                              <span>{sess.messageCount} pesan</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleCopySessionId(sess.id, e)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.03] hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-300 border border-white/[0.06] hover:border-indigo-500/30 transition-all cursor-pointer shrink-0"
                          title={`Salin Session ID: ${sess.id}`}
                        >
                          <Terminal className="h-2.5 w-2.5 text-indigo-400" />
                          <span>ref:{sess.id.slice(0, 8)}</span>
                          {copiedSessionId === sess.id ? (
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-2.5 w-2.5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <>

        {/* Messages Scroll Area */}
        <div
          ref={scrollViewportRef}
          className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 space-y-3 sm:space-y-4 scroll-smooth text-gray-200"
        >
          {messages.map((msg, msgIdx) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2 sm:gap-3 text-xs sm:text-sm",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot size={13} className="sm:hidden" />
                  <Bot size={15} className="hidden sm:block" />
                </div>
              )}

              <div
                className={cn(
                  "rounded-2xl p-3 sm:p-3.5 transition-all",
                  msg.role === "user"
                    ? "max-w-[88%] sm:max-w-[85%] bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-md"
                    : "w-full max-w-full sm:max-w-[92%] min-w-0 bg-[#111422] border border-white/[0.08] text-gray-200 rounded-tl-sm shadow-sm"
                )}
              >
                {/* Active Tool Execution Indicator */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mb-2 pb-2 border-b border-white/[0.08] space-y-1">
                    {msg.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20"
                      >
                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                        <span className="text-gray-400 font-medium">DB Action:</span>
                        <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-[280px]">{tc.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assistant Skill Attribution Header */}
                {msg.role === "assistant" && (() => {
                  const prevMsg = messages[msgIdx - 1];
                  if (prevMsg && prevMsg.role === "user") {
                    const prevSkill = extractSkillFromPrompt(prevMsg.content).skill;
                    if (prevSkill) {
                      return (
                        <div className="mb-2 pb-1.5 border-b border-white/[0.08] flex items-center justify-between text-[10.5px] font-mono text-indigo-300">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-indigo-400" />
                            <span className="font-semibold text-white">Synthesized with {prevSkill.label}</span>
                          </div>
                          <span className="text-[9.5px] text-gray-500 hidden sm:inline">Dual-Source Memory</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                {msg.content ? (
                  msg.role === "assistant" ? (
                    <CopilotMarkdown content={msg.content} />
                  ) : (
                    <div>
                      {(() => {
                        const extracted = extractSkillFromPrompt(msg.content);
                        if (extracted.skill) {
                          return (
                            <div className="mb-1.5 flex items-center gap-1.5 bg-black/25 text-white/90 border border-white/15 px-2 py-0.5 rounded-md text-[11px] font-mono w-fit">
                              <Brain className="h-3 w-3 text-indigo-200" />
                              <span className="font-semibold">{extracted.skill.command}</span>
                              <span className="text-[10px] text-indigo-200/80 hidden xs:inline">• {extracted.skill.label}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div className="whitespace-pre-wrap text-[12.5px] sm:text-[13px] leading-relaxed select-text">
                        {(() => {
                          const extracted = extractSkillFromPrompt(msg.content);
                          return extracted.skill && extracted.cleanedPrompt ? extracted.cleanedPrompt : msg.content;
                        })()}
                      </div>
                    </div>
                  )
                ) : msg.status === "streaming" ? (
                  <div className="flex items-center gap-2 text-xs text-indigo-300 py-1 font-mono">
                    <Loader2 size={13} className="animate-spin text-primary" />
                    <span>{activeTool || "Sedang memproses instruksi..."}</span>
                  </div>
                ) : null}
              </div>

              {msg.role === "user" && (
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-gray-300 shrink-0 mt-0.5">
                  <User size={13} className="sm:hidden" />
                  <User size={14} className="hidden sm:block" />
                </div>
              )}
            </div>
          ))}

          {/* Floating active tool loading spinner */}
          {isLoading && activeTool && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl w-fit font-mono animate-pulse">
              <Loader2 size={12} className="animate-spin" />
              <span>{activeTool}</span>
            </div>
          )}
        </div>

        {/* Contextual Quick Suggestions with Mobile Swipeable Carousel */}
        <div className="px-3 sm:px-4 py-1.5 border-t border-white/[0.06] bg-[#0C0E18]/80 flex flex-col gap-1.5 transition-all">
          <button
            type="button"
            onClick={toggleQuickPrompts}
            className="w-full flex items-center justify-between text-[10px] font-mono text-gray-500 hover:text-gray-300 uppercase tracking-wider cursor-pointer select-none group py-0.5"
            title={showQuickPrompts ? "Sembunyikan saran prompt" : "Tampilkan saran prompt"}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span>Quick Prompts</span>
              <span className="text-[9px] lowercase px-1.5 py-0.2 rounded bg-white/[0.04] text-gray-400 font-sans">
                {getContextualPrompts().length} saran
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 group-hover:text-indigo-300 font-sans normal-case">
              <span className="text-[9px] text-gray-500 sm:hidden">Geser ↔</span>
              <span>{showQuickPrompts ? "Sembunyikan" : "Tampilkan"}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  showQuickPrompts ? "rotate-180" : "rotate-0"
                )}
              />
            </div>
          </button>

          {showQuickPrompts && (
            <div className="flex overflow-x-auto sm:flex-wrap gap-1.5 pt-0.5 pb-1 no-scrollbar scroll-smooth touch-pan-x -mx-1 px-1 animate-in fade-in duration-200">
              {getContextualPrompts().map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(undefined, item.prompt)}
                  disabled={isLoading}
                  className="shrink-0 sm:shrink text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 active:bg-indigo-600/30 hover:text-indigo-300 hover:border-indigo-500/40 border border-white/[0.08] text-gray-300 text-left transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap sm:whitespace-normal"
                >
                  <span className="font-semibold text-white mr-0.5">{item.label}:</span>
                  <span className="text-gray-400 max-w-[200px] sm:max-w-[280px] truncate">{item.prompt}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Form with Top Resize Handle */}
        <div className="border-t border-white/[0.08] bg-[#0C0E18]/95 relative flex flex-col pb-[max(0.6rem,env(safe-area-inset-bottom))]">
          {/* Top Drag Handle Bar to Resize Upwards */}
          <div
            onMouseDown={handleMouseDownOnResize}
            onTouchStart={handleTouchStartOnResize}
            className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none -mt-1 z-10 touch-none"
            title="Drag up/down to resize input height"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-16 transition-all duration-200" />
          </div>

          <div className="p-2.5 sm:p-3 pt-0.5 sm:pt-1">
            <form
              ref={formRef}
              onSubmit={(e) => handleSubmit(e)}
              className="relative flex flex-col bg-[#131726] border border-white/[0.1] rounded-xl p-2 sm:p-2.5 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-inner"
            >
              {/* Slash Command Autocomplete Popover */}
              {isSlashMenuOpen && (
                <CopilotSlashCommandMenu
                  searchQuery={slashSearchQuery}
                  filteredSkills={filteredSkills}
                  highlightedIndex={highlightedSkillIndex}
                  onSelectSkill={handleSelectSkill}
                  onHoverIndex={setHighlightedSkillIndex}
                  onClose={() => setIsSlashMenuOpen(false)}
                />
              )}

              {/* Active Skill Pill/Tag if prompt starts with skill command */}
              {activeSkill && (
                <div className="flex items-center justify-between px-2 py-1 mb-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-xs text-indigo-200 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Brain className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-white font-mono text-[11px]">{activeSkill.command}</span>
                    <span className="text-[11px] text-indigo-300 hidden xs:inline">• {activeSkill.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const stripped = input.replace(new RegExp(`^${activeSkill.command}\\s*`), "");
                      setInput(stripped);
                      saveDraft(stripped, currentSessionId);
                    }}
                    className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                    title="Lepas skill ini dari prompt"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Sample prompt chip if input only has the command prefix */}
              {activeSkill && activeSkill.samplePrompt && input.trim() === activeSkill.command && (
                <button
                  type="button"
                  onClick={() => {
                    const sample = `${activeSkill.command} ${activeSkill.samplePrompt}`;
                    setInput(sample);
                    saveDraft(sample, currentSessionId);
                    setTimeout(() => inputRef.current?.focus(), 20);
                  }}
                  className="mb-1.5 text-left px-2.5 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-[10.5px] text-indigo-300 font-mono border border-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer w-fit"
                  title="Klik untuk menyisipkan prompt contoh"
                >
                  <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span className="text-gray-400">Contoh:</span>
                  <span className="truncate italic max-w-[280px] sm:max-w-[420px]">&quot;{activeSkill.samplePrompt}&quot;</span>
                </button>
              )}

              <textarea
                ref={inputRef}
                value={input}
                style={{
                  height: `${inputHeight}px`,
                  maxHeight: "45vh",
                  minHeight: "44px",
                }}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (isSlashMenuOpen && filteredSkills.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightedSkillIndex((prev) => (prev + 1) % filteredSkills.length);
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightedSkillIndex((prev) => (prev - 1 + filteredSkills.length) % filteredSkills.length);
                      return;
                    }
                    if (e.key === "Enter" || e.key === "Tab") {
                      e.preventDefault();
                      const target = filteredSkills[highlightedSkillIndex] || filteredSkills[0];
                      if (target) {
                        handleSelectSkill(target);
                      }
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setIsSlashMenuOpen(false);
                      return;
                    }
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  activeSkill
                    ? `${activeSkill.placeholder}`
                    : "Tanyakan apapun tentang CMS atau ketik / untuk daftar skill..."
                }
                className="w-full bg-transparent text-xs text-white placeholder-gray-500 resize-none outline-none px-1 py-1 scrollbar-thin overflow-y-auto leading-relaxed"
                disabled={isLoading}
              />

              {/* Bottom toolbar inside input box */}
              <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-white/[0.05] mt-1">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-gray-500 font-mono min-w-0">
                  {/* Quick Slash Menu Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isSlashMenuOpen) {
                        setIsSlashMenuOpen(false);
                      } else {
                        if (!input.startsWith("/")) {
                          const nextVal = `/${input}`.trimStart();
                          setInput(nextVal);
                          saveDraft(nextVal, currentSessionId);
                        }
                        setIsSlashMenuOpen(true);
                        setSlashSearchQuery("");
                        setHighlightedSkillIndex(0);
                        setTimeout(() => inputRef.current?.focus(), 20);
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors font-mono cursor-pointer border shrink-0",
                      isSlashMenuOpen || activeSkill
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                        : "bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border-white/10"
                    )}
                    title="Pilih Copilot Skill (Ketik /)"
                  >
                    <Terminal className="h-2.5 w-2.5 text-indigo-400" />
                    <span>/skills</span>
                  </button>

                  <span className="hidden sm:inline">Enter kirim • Shift+Enter baris baru</span>
                  {input.trim().length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      <Check className="h-2.5 w-2.5" />
                      <span className="hidden xs:inline">Draft tersimpan</span>
                      <span className="xs:hidden">Draft</span>
                    </span>
                  )}
                  {input.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setInput("");
                        clearDraft(currentSessionId);
                        setDraftRestored(false);
                        setIsSlashMenuOpen(false);
                      }}
                      className="inline-flex items-center gap-1 text-[9px] text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                      title="Buang draft ini"
                    >
                      <X className="h-2.5 w-2.5" />
                      <span>Buang</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {/* Quick Expand / Collapse Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (inputHeight > 100) {
                        setInputHeight(64);
                        try {
                          localStorage.setItem(INPUT_HEIGHT_KEY, "64");
                        } catch {}
                      } else {
                        const target = Math.min(240, Math.floor(window.innerHeight * 0.4));
                        setInputHeight(target);
                        try {
                          localStorage.setItem(INPUT_HEIGHT_KEY, String(target));
                        } catch {}
                      }
                    }}
                    className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    title={inputHeight > 100 ? "Perkecil input" : "Perbesar input"}
                  >
                    {inputHeight > 100 ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="h-7 w-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 disabled:opacity-40 shadow-sm"
                    title="Kirim instruksi"
                  >
                    {isLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="hidden sm:flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1.5 px-1">
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
              </span>
              <span>Tekan ⌘J untuk sembunyikan</span>
            </div>
            <div className="sm:hidden flex items-center justify-between text-[9.5px] text-gray-500 font-mono mt-1 px-1">
              <span>Gemini 3.8 Flash • Copilot</span>
              <span>Tarik handle untuk resize</span>
            </div>
          </div>
        </div>
      </>
    )}
  </div>

      {/* Delete Session Confirmation Dialog */}
      <AlertDialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingSession) {
            setSessionToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="z-[70] bg-[#0C0E18] border border-white/[0.1] text-white max-w-md shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2 text-base">
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
                <Trash2 className="h-4 w-4" />
              </div>
              <span>Hapus Riwayat Sesi?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs leading-relaxed pt-1">
              Apakah kamu yakin ingin menghapus sesi chat{" "}
              <span className="font-semibold text-white">&quot;{sessionToDelete?.title}&quot;</span>?
              Tindakan ini tidak dapat dibatalkan dan semua pesan percakapan dalam sesi ini akan dihapus secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isDeletingSession}
              className="border-white/[0.08] bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white text-xs"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingSession}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDeleteSession();
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs gap-1.5"
            >
              {isDeletingSession ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Ya, Hapus Sesi
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Session Dialog */}
      <Dialog
        open={Boolean(sessionToRename)}
        onOpenChange={(open) => {
          if (!open && !isRenamingSession) {
            setSessionToRename(null);
          }
        }}
      >
        <DialogContent className="z-[70] bg-[#0C0E18] border border-white/[0.1] text-white max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-base">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Pencil className="h-4 w-4" />
              </div>
              <span>Ubah Judul Sesi</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs leading-relaxed pt-1">
              Beri nama yang jelas untuk memudahkan Anda menemukan percakapan ini kembali di riwayat Copilot.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRenameSession} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">
                Judul Percakapan
              </label>
              <input
                type="text"
                autoFocus
                value={renameTitleInput}
                onChange={(e) => setRenameTitleInput(e.target.value)}
                placeholder="Masukkan judul sesi percakapan..."
                maxLength={100}
                disabled={isRenamingSession}
                className="w-full bg-[#121624] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Maksimal 100 karakter</span>
                <span>{renameTitleInput.length}/100</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isRenamingSession}
                onClick={() => setSessionToRename(null)}
                className="border border-white/[0.08] bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white text-xs h-9 px-3"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isRenamingSession || !renameTitleInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs h-9 px-3.5 gap-1.5 disabled:opacity-40"
              >
                {isRenamingSession ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Simpan Judul
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
