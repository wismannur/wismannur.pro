"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    "Halo Wisman! 👋 Saya adalah **CMS Executive Copilot** Anda yang ditenagai oleh **Gemini 3.8 Flash**.\n\nSaya terintegrasi penuh ke database Anda dengan kapabilitas **Query, Analisis, Mutasi, & Hapus Data** di seluruh menu CMS kita:\n- 📊 **Dashboard & General**: Health check metrik & performa situs\n- 🎯 **Career Hub**: Job Hunter (ATS Feeds & Target Companies), Job Tracker (Pipeline & Interviews), Job Outreaches (Cold Pitches & Threads)\n- 🚀 **Finder Project Hub**: Project Hunter (Site Audits), Project Tracker (Prospect Pipeline), Project Outreaches (Modernization Pitches)\n- 🧠 **AI Assistant**: AI Knowledge Hub, AI English Fluency Hub (Habit Streak, Speech drills, Vocab decks), AI Chat Logs\n- 📬 **Inbox & Leads**: Contacts, Service Orders & Consulting Inquiries, Recruiter Hire Requests\n- 🌐 **Site Architecture**: Site Settings, Page Copy, Legal Pages\n- 📁 **Content & Catalog**: Blog Posts, Portfolio Projects, Resume, Skills, Service Catalog, FAQs, Process Steps, Testimonials, Availability\n- ⚙️ **Account & System**: Admin Profile & Preferences Settings\n\nAda modul yang ingin Anda query, kelola, atau perbarui sekarang?",
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

interface StreamCallbacks {
  onSessionId: (id: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>) => void;
  onToolResult: (name: string, result: Record<string, unknown>) => void;
  onTextChunk: (chunk: string) => void;
  onError: (errMsg: string) => void;
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

export function CmsCopilotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<CmsCopilotSessionRow[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `copilot-${Date.now()}`
  );
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
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<{ id: string; title: string } | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState("");
  const [isRenamingSession, setIsRenamingSession] = useState(false);
  const [inputHeight, setInputHeight] = useState<number>(64);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const startHeightRef = useRef(64);

  const pathname = usePathname();
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Global Keyboard Shortcut (Cmd+J / Ctrl+J) & Custom Event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
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
  }, []);

  // Fetch session history when panel opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    getCmsCopilotSessions()
      .then((data) => {
        if (isMounted) setSessions(data);
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

  // Load selected session messages
  const handleSelectSession = async (session: CmsCopilotSessionRow) => {
    try {
      setIsLoading(true);
      setCurrentSessionId(session.id);
      setViewMode("chat");
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
    setMessages([INITIAL_GREETING]);
    setInput("");
    setActiveTool(null);
    setViewMode("chat");
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
        { label: "💼 Status Update", prompt: "Tampilkan daftar 5 lamaran terakhir yang statusnya masih 'applied' atau 'screening'" },
        { label: "📅 Interviews", prompt: "Apakah ada interview yang terjadwal dalam waktu dekat?" },
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
    if (pathname.includes("/cms/ai-english-fluency")) {
      return [
        { label: "🔥 Habit Streak", prompt: "Berapa hari streak latihan berbicara bahasa Inggris saya dan total menit latihan?" },
        { label: "🎙️ Sesi Terakhir", prompt: "Tampilkan ringkasan hasil latihan speaking terakhir dan skor evaluasinya" },
        { label: "📚 Vocabulary Deck", prompt: "Tampilkan daftar kosakata executive & technical English yang sedang saya pelajari" },
      ];
    }
    if (pathname.includes("/cms/ai-knowledge")) {
      return [
        { label: "🧠 AI Knowledge", prompt: "Tampilkan daftar knowledge item AI yang saat ini aktif di database" },
        { label: "➕ Tambah Knowledge", prompt: "Bantu saya buatkan knowledge item baru untuk kategori 'tech-stack'" },
        { label: "🏷️ Knowledge Categories", prompt: "Apa saja kategori knowledge item yang sudah terdaftar?" },
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
        { label: "✍️ Draft Article", prompt: "Bantu saya buatkan outline artikel blog baru tentang arsitektur software modern" },
        { label: "📊 Top Viewed", prompt: "Artikel blog mana yang memiliki pembaca / views terbanyak?" },
      ];
    }
    if (pathname.includes("/cms/projects")) {
      return [
        { label: "💼 Portfolio Projects", prompt: "Tampilkan daftar portfolio projects dan teknologi yang digunakan" },
        { label: "⭐ Featured Projects", prompt: "Project apa saja yang saat ini diset sebagai featured di homepage?" },
        { label: "➕ Tambah Project", prompt: "Bantu saya siapkan draft portfolio project baru lengkap dengan summary & tech stack" },
      ];
    }
    if (pathname.includes("/cms/resume")) {
      return [
        { label: "🎓 Resume Timeline", prompt: "Tampilkan seluruh riwayat work experience dan education yang terdaftar" },
        { label: "💼 Current Role", prompt: "Tampilkan pekerjaan saya yang saat ini statusnya isCurrent: true" },
        { label: "➕ Tambah Experience", prompt: "Bantu saya tambahkan riwayat pekerjaan baru ke daftar resume" },
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
      { label: "🎯 Career Hub", prompt: "Berapa banyak total lamaran aktif dan status pipeline saya di Career Hub?" },
      { label: "🚀 Project Hub", prompt: "Tampilkan ringkasan prospect client di Finder Project Hub" },
      { label: "📬 Inbox Leads", prompt: "Cek apakah ada kontak atau hire request baru yang belum saya review?" },
    ];
  };

  // Submit message & handle SSE stream
  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isLoading) return;

    const userMessageText = promptToSend.trim();
    setInput("");

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
          onSessionId: (sid) => setCurrentSessionId(sid),
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


  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(true)}
              className={cn(
                "fixed bottom-6 right-6 z-40 h-12 w-12 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl",
                "hover:scale-105 active:scale-95 transition-all duration-300",
                "border border-white/20 shadow-indigo-500/30",
                isOpen && "opacity-0 pointer-events-none"
              )}
              aria-label="Open AI Copilot"
            >
              <Sparkles className="h-5 w-5 animate-pulse text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-[#0C0E18] text-white border-white/[0.1] text-xs font-mono">
            CMS Copilot (⌘J)
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Slide-over Panel (Right Drawer with Left Resize Handle) */}
      <div
        style={{ width: `min(100vw, ${panelWidth}px)` }}
        className={cn(
          "fixed top-0 right-0 h-screen z-50",
          "bg-[#090A10]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.85)]",
          "flex flex-col",
          !isDraggingWidth && "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
          isDraggingWidth && "select-none"
        )}
      >
        {/* Left Resize Drag Handle */}
        <div
          onMouseDown={handleMouseDownOnWidthResize}
          className="group absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-50 flex items-center justify-center hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-colors select-none"
          title="Drag left/right to resize panel width"
        >
          <div className="w-1 h-12 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:h-20 group-active:bg-indigo-300 transition-all duration-200" />
        </div>
        {/* Panel Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0C0E18]/80 backdrop-blur-md">
          {viewMode === "history" ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("chat")}
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08]"
                title="Kembali ke percakapan"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Riwayat Percakapan</span>
                  <Badge
                    variant="outline"
                    className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] px-1.5 py-0 font-mono font-normal"
                  >
                    {sessions.length} sesi
                  </Badge>
                </h3>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">Pilih atau cari percakapan sebelumnya</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">CMS Staff Copilot</h3>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0 font-mono font-normal"
                  >
                    Gemini 3.8 Flash
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono mt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-indigo-400">Context:</span>
                    <span className="truncate max-w-[120px] text-gray-300">{pathname}</span>
                  </div>
                  {currentSessionId && (
                    <>
                      <span className="text-white/20">•</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => handleCopySessionId(currentSessionId, e)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-indigo-500/20 text-gray-300 hover:text-indigo-300 border border-white/[0.08] hover:border-indigo-500/30 transition-all text-[10px] font-mono cursor-pointer"
                            >
                              <Terminal className="h-2.5 w-2.5 text-indigo-400" />
                              <span>ref:{currentSessionId.slice(0, 8)}</span>
                              {copiedSessionId === currentSessionId ? (
                                <Check className="h-2.5 w-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-2.5 w-2.5 text-gray-400" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-[#0C0E18] text-white border-white/[0.1] text-xs font-mono">
                            Klik untuk salin Session ID ({currentSessionId}) untuk sesi terminal Antigravity
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {viewMode === "chat" ? (
              <>
                {/* Switch to History Screen */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("history")}
                        className="h-8 px-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] text-xs font-mono gap-1.5"
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

                {/* Rename Current Session Button (when a session is active) */}
                {currentSessionId && (
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
                )}

                {/* Delete Current Session Button (when a session is active) */}
                {currentSessionId && (
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
                )}

                {/* New Chat Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNewChat}
                        className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                      New Conversation
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="h-8 px-2.5 rounded-lg border-indigo-500/30 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 hover:text-white text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Chat Baru</span>
              </Button>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === "history" ? (
          /* Full-View History Screen */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#090A10]">
            {/* Search Bar */}
            <div className="p-4 pb-2 border-b border-white/[0.04]">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Cari topik riwayat percakapan..."
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
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
              {filteredSessions.length === 0 ? (
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-500 mb-3">
                    <History className="h-6 w-6" />
                  </div>
                  {historySearchQuery ? (
                    <>
                      <p className="text-xs font-semibold text-white">Tidak ada sesi ditemukan</p>
                      <p className="text-[11px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                        Tidak ada percakapan dengan kata kunci &quot;{historySearchQuery}&quot;
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-white">Belum ada riwayat sesi</p>
                      <p className="text-[11px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                        Percakapan Anda dengan Gemini Copilot akan otomatis tersimpan di sini.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleNewChat}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl"
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
                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={cn(
                        "group relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3",
                        isActive
                          ? "bg-indigo-950/30 border-indigo-500/40 shadow-sm shadow-indigo-500/10"
                          : "bg-[#121624]/60 border-white/[0.07] hover:bg-[#161b2d] hover:border-white/[0.15]"
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-white/[0.04] text-gray-400 border-white/[0.06] group-hover:text-indigo-300 group-hover:border-indigo-500/30"
                        )}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0 pr-14">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              "text-xs leading-snug line-clamp-2",
                              isActive
                                ? "text-white font-semibold"
                                : "text-gray-200 group-hover:text-white font-medium"
                            )}
                          >
                            {sess.title}
                          </h4>
                          {isActive && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1 py-0 font-mono shrink-0"
                            >
                              Aktif
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-white/[0.04] text-[10px] text-gray-500 font-mono">
                          <span>{formatRelativeTime(sess.createdAt || sess.updatedAt)}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopySessionId(sess.id, e)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-300 border border-white/[0.06] transition-colors cursor-pointer"
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

                      {/* Action buttons on card (Rename & Delete) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all absolute right-2 top-2 flex items-center gap-1 bg-[#090A10]/95 backdrop-blur-sm p-0.5 rounded-lg border border-white/[0.1] shadow-md z-10">
                        <button
                          type="button"
                          onClick={(e) =>
                            handleOpenRenameDialog({ id: sess.id, title: sess.title }, e)
                          }
                          className="hover:text-indigo-300 hover:bg-white/[0.08] p-1.5 rounded-md text-gray-400 transition-colors cursor-pointer"
                          title="Ubah judul sesi"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleRequestDeleteSession(e, { id: sess.id, title: sess.title })
                          }
                          className="hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-md text-gray-400 transition-colors cursor-pointer"
                          title="Hapus sesi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
        {/* Session Reference Bar for Terminal Handoff */}
        {currentSessionId && (
          <div className="px-4 py-1.5 bg-[#0b0e1b] border-b border-white/[0.05] flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-gray-400 shrink-0">Terminal Ref:</span>
              <span className="text-indigo-300 font-medium truncate select-all">{currentSessionId}</span>
            </div>
            <button
              type="button"
              onClick={(e) => handleCopySessionId(currentSessionId, e)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] transition-colors shrink-0 ml-2 cursor-pointer"
              title="Salin ID sesi ini untuk chat terminal Antigravity"
            >
              {copiedSessionId === currentSessionId ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-indigo-400" />
                  <span>Salin ID Terminal</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div
          ref={scrollViewportRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth text-gray-200"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 text-sm",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot size={15} />
                </div>
              )}

              <div
                className={cn(
                  "rounded-2xl p-3.5 transition-all",
                  msg.role === "user"
                    ? "max-w-[85%] bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-md"
                    : "max-w-[92%] min-w-0 bg-[#111422] border border-white/[0.08] text-gray-200 rounded-tl-sm shadow-sm"
                )}
              >
                {/* Active Tool Execution Indicator */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mb-2.5 pb-2 border-b border-white/[0.08] space-y-1">
                    {msg.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20"
                      >
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                        <span className="text-gray-400 font-medium">DB Action:</span>
                        <span className="font-semibold text-white">{tc.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {msg.content ? (
                  msg.role === "assistant" ? (
                    <CopilotMarkdown content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap text-[13px] leading-relaxed select-text">
                      {msg.content}
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
                <div className="h-7 w-7 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-gray-300 shrink-0 mt-0.5">
                  <User size={14} />
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

        {/* Contextual Quick Suggestions with Show/Hide Toggle */}
        <div className="px-4 py-1.5 border-t border-white/[0.06] bg-[#0C0E18]/70 flex flex-col gap-1.5 transition-all">
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
            <div className="flex items-center gap-1 text-[10px] text-gray-400 group-hover:text-indigo-300 font-sans normal-case">
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
            <div className="flex flex-wrap gap-1.5 pt-0.5 pb-0.5 animate-in fade-in duration-200">
              {getContextualPrompts().map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(undefined, item.prompt)}
                  disabled={isLoading}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 hover:text-indigo-300 hover:border-indigo-500/40 border border-white/[0.08] text-gray-300 text-left transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <span className="font-semibold text-white mr-0.5">{item.label}:</span>
                  <span className="text-gray-400 truncate max-w-[280px]">{item.prompt}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Form with Top Resize Handle */}
        <div className="border-t border-white/[0.08] bg-[#0C0E18]/95 relative flex flex-col">
          {/* Top Drag Handle Bar to Resize Upwards */}
          <div
            onMouseDown={handleMouseDownOnResize}
            className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none -mt-1 z-10"
            title="Drag up to resize input height"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-16 transition-all duration-200" />
          </div>

          <div className="p-3 pt-1">
            <form
              onSubmit={(e) => handleSubmit(e)}
              className="relative flex flex-col bg-[#131726] border border-white/[0.1] rounded-xl p-2 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-inner"
            >
              <textarea
                ref={inputRef}
                value={input}
                style={{ height: `${inputHeight}px` }}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ketik instruksi untuk Gemini (mis: 'Tampilkan summary lamaran aktif' atau 'Mark contact terbaru as read')..."
                className="w-full bg-transparent text-xs text-white placeholder-gray-500 resize-none outline-none px-1 py-1 scrollbar-thin overflow-y-auto leading-relaxed"
                disabled={isLoading}
              />

              {/* Bottom toolbar inside input box */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] mt-1">
                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                  <span>Enter kirim • Shift+Enter baris baru</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Quick Expand / Collapse Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (inputHeight > 100) {
                        setInputHeight(64);
                      } else {
                        const target = Math.min(260, Math.floor(window.innerHeight * 0.45));
                        setInputHeight(target);
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

            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1.5 px-1">
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
              </span>
              <span>Tekan ⌘J untuk sembunyikan</span>
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
