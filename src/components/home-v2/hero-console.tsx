"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import {
  Bot,
  Check,
  Code2,
  Cpu,
  Database,
  Layers,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  User,
  Zap,
  Loader2,
  ArrowUpRight,
  RefreshCw,
  Cloud,
  ShieldCheck,
  Activity,
  Globe,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/services/ai-chat/types";

type ConsoleTab = "assistant" | "stack" | "metrics";

const ALL_SUGGESTED_PROMPTS = [
  // Tech Stack & Architecture
  "What is Wisman's primary tech stack & architecture philosophy?",
  "How does Wisman approach performance optimization & scalable systems?",
  "What is Wisman's experience with Cloud, DevOps, and Fullstack systems?",
  "What are Wisman's thoughts & practical experience with AI/LLM integration?",
  "How does Wisman maintain code quality, testing, and clean architecture?",
  // Projects & Track Record
  "Show me some of Wisman's featured projects & career milestones",
  "What complex engineering challenges has Wisman solved in production?",
  "Can you summarize Wisman's career background and seniority level?",
  "How does Wisman collaborate in cross-functional and fast-paced teams?",
  "What technical articles or insights has Wisman published?",
  // Hiring, Services & Collaboration
  "Is Wisman currently open to full-time or contract/fractional roles?",
  "What engineering consulting & development services does Wisman offer?",
  "I would like to hire Wisman / discuss a project opportunity",
  "What is Wisman's current availability and engagement process?",
  "Can Wisman help build and architect an MVP from scratch?",
];

function getRandomSuggestedPrompts(count = 3): string[] {
  const shuffled = [...ALL_SUGGESTED_PROMPTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const INITIAL_HERO_MESSAGE: ChatMessage = {
  id: "hero-initial-greeting",
  role: "assistant",
  content:
    "Hi! I am **Wisman's AI Assistant** 🤖. I am here 24/7 to answer questions about Wisman Nur's professional background, portfolio projects, technical skills, services, and availability.\n\nHow can I help you today?",
  status: "done",
};

const STORAGE_KEY = "wismannur_ai_chat_history_v2";
const SESSION_STORAGE_KEY = "wismannur_ai_chat_session_id_v2";
const CONSOLE_HEIGHT_KEY = "wismannur_hero_console_height";
const DEFAULT_CONSOLE_BODY_HEIGHT = 440;

let msgSequence = 0;
function createClientMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  msgSequence += 1;
  return `hero_msg_${Date.now()}_${msgSequence}`;
}

function getOrCreateClientSessionId(): string {
  if (typeof window === "undefined") return "session_init";
  try {
    let sid = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return "session_fallback";
  }
}

function subscribeStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

let cachedMessagesRaw: string | null = null;
let cachedMessagesParsed: ChatMessage[] | null = null;

function getSavedMessagesSnapshot(): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedMessagesRaw) return cachedMessagesParsed;
    cachedMessagesRaw = raw;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedMessagesParsed = parsed;
        return parsed;
      }
    }
  } catch {}
  cachedMessagesParsed = null;
  return null;
}

function getServerMessagesSnapshot(): ChatMessage[] | null {
  return null;
}

function getSavedHeightSnapshot(): number {
  if (typeof window === "undefined") return DEFAULT_CONSOLE_BODY_HEIGHT;
  try {
    const saved = localStorage.getItem(CONSOLE_HEIGHT_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 380 && parsed <= 900) return parsed;
    }
  } catch {}
  return DEFAULT_CONSOLE_BODY_HEIGHT;
}

function getServerHeightSnapshot(): number {
  return DEFAULT_CONSOLE_BODY_HEIGHT;
}

const INITIAL_MESSAGES_FALLBACK: ChatMessage[] = [INITIAL_HERO_MESSAGE];

export function HeroConsole() {
  const [activeTab, setActiveTab] = useState<ConsoleTab>("assistant");

  const savedMessages = useSyncExternalStore(
    subscribeStorage,
    getSavedMessagesSnapshot,
    getServerMessagesSnapshot
  );

  const [userMessages, setUserMessages] = useState<ChatMessage[] | null>(null);
  const messages = userMessages ?? savedMessages ?? INITIAL_MESSAGES_FALLBACK;

  const setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>> = useCallback(
    (action) => {
      setUserMessages((prev) => {
        const current = prev ?? savedMessages ?? INITIAL_MESSAGES_FALLBACK;
        if (typeof action === "function") {
          return (action as (prevState: ChatMessage[]) => ChatMessage[])(current);
        }
        return action;
      });
    },
    [savedMessages]
  );

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(() =>
    ALL_SUGGESTED_PROMPTS.slice(0, 3)
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const savedHeight = useSyncExternalStore(
    subscribeStorage,
    getSavedHeightSnapshot,
    getServerHeightSnapshot
  );

  const [userConsoleHeight, setUserConsoleHeight] = useState<number | null>(null);
  const consoleHeight = userConsoleHeight ?? savedHeight;

  const setConsoleHeight = useCallback((height: number) => {
    setUserConsoleHeight(height);
  }, []);

  const isDraggingConsoleRef = useRef(false);
  const dragConsoleStartYRef = useRef(0);
  const startConsoleHeightRef = useRef(DEFAULT_CONSOLE_BODY_HEIGHT);

  const handleMouseDownResizeConsole = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingConsoleRef.current = true;
    dragConsoleStartYRef.current = e.clientY;
    startConsoleHeightRef.current = consoleHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingConsoleRef.current) return;
      const deltaY = moveEvent.clientY - dragConsoleStartYRef.current;
      const minHeight = 380;
      const maxHeight = Math.min(900, Math.floor(window.innerHeight * 0.85));
      const newHeight = Math.min(Math.max(startConsoleHeightRef.current + deltaY, minHeight), maxHeight);
      setConsoleHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingConsoleRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    if (userConsoleHeight !== null) {
      try {
        localStorage.setItem(CONSOLE_HEIGHT_KEY, userConsoleHeight.toString());
      } catch {}
    }
  }, [userConsoleHeight]);

  const [inputHeight, setInputHeight] = useState<number>(56);
  const isDraggingInputRef = useRef(false);
  const dragStartYRef = useRef(0);
  const startHeightRef = useRef(56);

  const handleMouseDownOnResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingInputRef.current = true;
    dragStartYRef.current = e.clientY;
    startHeightRef.current = inputHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingInputRef.current) return;
      const deltaY = dragStartYRef.current - moveEvent.clientY;
      const maxHeight = 300;
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 44), maxHeight);
      setInputHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingInputRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Sync with localStorage
  useEffect(() => {
    if (!userMessages) return;
    try {
      if (userMessages.length > 1 || (userMessages.length === 1 && userMessages[0].id !== "hero-initial-greeting")) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userMessages));
      }
    } catch {}
  }, [userMessages]);

  const scrollToTop = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    });
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (activeTab !== "assistant") return;

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      if (messages.length <= 1) {
        scrollToTop();
        return;
      }
    }

    if (messages.length <= 1 && !isLoading) {
      scrollToTop();
    } else {
      scrollToBottom();
    }
  }, [messages, isLoading, activeTab, scrollToBottom, scrollToTop]);

  const handleReset = () => {
    const fresh = [INITIAL_HERO_MESSAGE];
    setMessages(fresh);
    setSuggestedPrompts(getRandomSuggestedPrompts(3));
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
  };

  const handleSendMessage = async (userText: string) => {
    const text = userText.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: createClientMessageId(),
      role: "user",
      content: text,
      status: "done",
    };

    const assistantMsgId = createClientMessageId();
    const placeholderAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      status: "streaming",
    };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, placeholderAssistantMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const payloadMessages = updatedMessages
        .filter((m) => m.id !== "hero-initial-greeting" && m.id !== "initial-greeting")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const clientSessionId = getOrCreateClientSessionId();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          clientSessionId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      if (!res.body) throw new Error("No response body received.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === "text") {
                accumulatedContent += data.content;
                const textSnapshot = accumulatedContent;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: textSnapshot } : msg
                  )
                );
              } else if (data.type === "error") {
                accumulatedContent += `\n\n⚠️ ${data.content}`;
                const errorSnapshot = accumulatedContent;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: errorSnapshot, status: "error" }
                      : msg
                  )
                );
              }
            } catch {}
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, status: "done" } : msg))
      );
    } catch (err: unknown) {
      console.error("Hero chat error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `Sorry, I encountered an error: ${errorMessage}`,
                status: "error",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format basic markdown (bold, links, bullet points)
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");

    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
          const cleanLine = isBullet ? line.trim().slice(2) : line;

          const parts = cleanLine.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);

          const formatted = parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-semibold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
              const [, text, url] = linkMatch;
              return (
                <a
                  key={pIdx}
                  href={url}
                  target={url.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="text-primary hover:text-indigo-400 underline underline-offset-2 font-medium transition-colors inline-flex items-center gap-0.5"
                >
                  {text}
                  {url.startsWith("http") && <ArrowUpRight className="w-3 h-3" />}
                </a>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-primary font-black mt-0.5 text-xs">•</span>
                <span className="flex-1 text-gray-200">{formatted}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-gray-200">
              {formatted}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative rounded-3xl border border-border/60 bg-[#090A0F]/90 dark:bg-[#07080D]/95 text-[#E2E8F0] shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-primary/40 group/console">
      {/* Ambient top glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Console Window Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#11131E]/80 border-b border-white/[0.08]">
        {/* Window Controls */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]/80 border border-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80 border border-amber-500/40" />
            <div className="w-3 h-3 rounded-full bg-[#10B981]/80 border border-emerald-500/40" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-muted-foreground/80 inline-flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">wismannur ~ ai-assistant-console</span>
          </span>
        </div>

        {/* Interactive Tabs (Desktop / Tablet >= sm) */}
        <div className="hidden sm:flex items-center gap-1 bg-[#181B29] p-1 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("assistant")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              activeTab === "assistant"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Bot size={13} className="text-primary-foreground" />
            <span>Wisman&apos;s AI Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stack")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              activeTab === "stack"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Layers size={13} />
            <span>Fullstack Stack</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("metrics")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              activeTab === "metrics"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Zap size={13} />
            <span>Live Telemetry</span>
          </button>
        </div>
      </div>

      {/* Interactive Tabs (Mobile: positioned between header and body content) */}
      <div className="sm:hidden px-3 pt-2.5 pb-2 bg-[#11131E]/60 border-b border-white/[0.06]">
        <div className="grid grid-cols-3 gap-1 bg-[#181B29] p-1 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("assistant")}
            className={cn(
              "py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === "assistant"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Bot size={12} className="text-primary-foreground shrink-0" />
            <span className="truncate">Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stack")}
            className={cn(
              "py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === "stack"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Layers size={12} className="shrink-0" />
            <span className="truncate">Stack</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("metrics")}
            className={cn(
              "py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === "metrics"
                ? "bg-primary text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <Zap size={12} className="shrink-0" />
            <span className="truncate">Metrics</span>
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div
        style={{ height: `${consoleHeight}px` }}
        className="p-4 sm:p-5 flex flex-col justify-between min-h-[380px] transition-[height] duration-75"
      >
        {/* TAB 1: Live AI Assistant Terminal */}
        {activeTab === "assistant" && (
          <div className="flex flex-col flex-1 min-h-0 justify-between space-y-2.5 animate-fade-in font-sans">
            {/* Top Subheader */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.07] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-foreground text-xs">
                  Wisman&apos;s AI Representative
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono hidden sm:inline">
                  Gemini 3.8 Flash • Vertex AI
                </span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                title="Reset conversation"
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-white/[0.05] transition-colors"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Chat Message Scroll Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-3 pr-1 scroll-smooth text-xs leading-relaxed"
            >
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id || idx}
                    className={cn(
                      "flex gap-2.5 max-w-[92%]",
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] shadow-sm mt-0.5",
                        isUser
                          ? "bg-gradient-to-br from-primary to-indigo-600 text-white font-semibold"
                          : "bg-[#161929] border border-white/[0.12] text-primary"
                      )}
                    >
                      {isUser ? <User size={12} /> : <Bot size={12} />}
                    </div>

                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-xs shadow-xs",
                        isUser
                          ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                          : "bg-[#131625]/90 border border-white/[0.08] text-gray-200 rounded-tl-xs backdrop-blur-md"
                      )}
                    >
                      {msg.content ? (
                        renderFormattedContent(msg.content)
                      ) : msg.status === "streaming" ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground text-xs py-0.5">
                          <Loader2 size={12} className="animate-spin text-primary" />
                          <span>Thinking...</span>
                        </span>
                      ) : null}
                      {msg.status === "streaming" && msg.content && (
                        <span className="inline-block w-1.5 h-3 bg-primary ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Suggested Questions Section (Shown when only initial greeting is present) */}
              {messages.length === 1 && !isLoading && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-primary" /> Suggested Questions:
                    </p>
                    <button
                      type="button"
                      onClick={() => setSuggestedPrompts(getRandomSuggestedPrompts(3))}
                      className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]"
                      title="Shuffle other questions"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Shuffle</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {suggestedPrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left text-[11px] p-2.5 rounded-xl border border-white/[0.08] hover:border-primary/40 bg-[#121524]/60 hover:bg-[#181D30] transition-all text-gray-300 hover:text-white flex items-center justify-between group shadow-xs"
                      >
                        <span className="line-clamp-1">{prompt}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity shrink-0 ml-1.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Form Bar with Top Resize Handle */}
            <div className="pt-2 border-t border-white/[0.08] relative flex flex-col">
              {/* Top Drag Handle Bar to Resize Upwards */}
              <div
                onMouseDown={handleMouseDownOnResize}
                className="group w-full h-3 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none -mt-2 mb-1 z-10"
                title="Drag up to resize input height"
              >
                <div className="w-8 h-1 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-14 transition-all duration-200" />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(input);
                }}
                className="relative flex flex-col bg-[#131625]/80 border border-white/[0.1] rounded-xl p-2 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 transition-all font-sans"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  style={{ height: `${inputHeight}px` }}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(input);
                    }
                  }}
                  placeholder="Ask anything about Wisman's skills, projects, or background..."
                  disabled={isLoading}
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 resize-none outline-none px-1 py-1 scrollbar-thin overflow-y-auto leading-relaxed"
                />

                {/* Bottom toolbar inside input box */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-mono">
                    <span className="hidden sm:inline">Enter send • Shift+Enter new line</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Quick Expand / Collapse Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (inputHeight > 80) {
                          setInputHeight(56);
                        } else {
                          setInputHeight(180);
                        }
                      }}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
                      title={inputHeight > 80 ? "Perkecil input" : "Perbesar input"}
                    >
                      {inputHeight > 80 ? (
                        <Minimize2 size={13} />
                      ) : (
                        <Maximize2 size={13} />
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="h-7 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-95 cursor-pointer"
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={12} />
                          <span className="hidden sm:inline">Send</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: Fullstack Architecture (Rich 9-Item Grid) */}
        {activeTab === "stack" && (
          <div className="space-y-3 animate-fade-in font-sans flex-1 min-h-0 flex flex-col justify-between overflow-y-auto pr-1">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold font-mono text-xs">
                  <Cpu size={14} />
                  <span>Core Production Stack Architecture</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
                  Frontend + Fullstack + AI
                </span>
              </div>

              {/* 9-Item Rich Architecture Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2.5">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Code2 size={14} className="text-cyan-400 shrink-0" />
                    <span className="font-bold text-xs text-foreground truncate">Frontend Architecture</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Micro-frontends, Design Systems, State & 60fps micro-interactions
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Code2 size={14} className="text-indigo-400 shrink-0" />
                    <span className="font-bold text-xs text-foreground truncate">Next.js 16 & React 19</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Server Components, Server Actions & App Router
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={14} className="text-blue-400 shrink-0" />
                    <span className="font-bold text-xs text-foreground truncate">TypeScript 5.x</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Strict end-to-end type safety with Zod & Drizzle schemas
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Database size={14} className="text-emerald-400 shrink-0" />
                    <span className="font-bold text-xs text-foreground truncate">Neon Postgres</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Serverless PostgreSQL with instant branching & autoscaling
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers size={14} className="text-teal-400 shrink-0" />
                    <span className="font-bold text-xs text-foreground truncate">Drizzle ORM</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Type-safe relational queries & zero runtime overhead migrations
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot size={14} className="text-purple-400 shrink-0" />
                    <span className="font-bold text-xs text-foreground truncate">Gemini 3.8 Flash</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Google Vertex AI SDK, Tool Calling & Agentic workflows
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap size={14} className="text-amber-400 shrink-0" />
                    <span className="font-bold text-xs text-foreground truncate">Tailwind & Motion</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    High-framerate design tokens & glassmorphic system
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Cloud size={14} className="text-sky-400 shrink-0" />
                    <span className="font-bold text-xs text-foreground truncate">Cloud Run & Docker</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Containerized microservices & Google Cloud infrastructure
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Terminal size={14} className="text-rose-400 shrink-0" />
                    <span className="font-bold text-xs text-foreground truncate">Vercel Global Edge</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Low-latency edge caching, SSE stream & global CDN
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#131726] border border-white/[0.08] flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-emerald-400 shrink-0" />
                <span>Zero legacy packages • Pure ESM Architecture • Sub-80ms TTFB</span>
              </span>
              <span className="text-primary font-semibold text-xs hidden sm:inline">Production Ready</span>
            </div>
          </div>
        )}

        {/* TAB 3: Live Telemetry & Metrics (Observability Dashboard) */}
        {activeTab === "metrics" && (
          <div className="space-y-3 animate-fade-in font-mono text-xs flex-1 min-h-0 flex flex-col justify-between overflow-y-auto pr-1">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Activity size={14} />
                  <span>Production Telemetry & Observability</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  All Systems Optimal
                </span>
              </div>

              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 font-sans">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="text-xl font-black text-indigo-400 mb-0.5">7+ Yrs</div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    Production Experience
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="text-xl font-black text-cyan-400 mb-0.5">&lt;65ms</div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    P95 Edge Latency
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="text-xl font-black text-emerald-400 mb-0.5">100%</div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    Type Safety Ratio
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="text-xl font-black text-amber-400 mb-0.5">99.9%</div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    Uptime Reliability
                  </div>
                </div>
              </div>

              {/* Live Subsystems Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 font-sans">
                <div className="p-2.5 rounded-xl bg-[#121524]/60 border border-white/[0.06] text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1">
                      <Globe size={12} className="text-cyan-400" /> Global Edge
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">sin1 (SG)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    HTTP/3 & TLS 1.3 edge termination with global caching
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121524]/60 border border-white/[0.06] text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1">
                      <Database size={12} className="text-emerald-400" /> Neon DB Pool
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">14ms P95</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Zero idle leaks & connection pool autoscaling active
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121524]/60 border border-white/[0.06] text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1">
                      <Bot size={12} className="text-purple-400" /> Gemini Vertex
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono">~38ms TTFT</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Streaming at ~72 tok/s with live prompt caching
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Audited Bar */}
            <div className="p-2.5 rounded-xl bg-[#131726] border border-white/[0.08] flex items-center justify-between text-[11px] text-muted-foreground font-sans">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>Core Web Vitals: LCP &lt;1.1s • CLS 0.00 • INP &lt;45ms • CSP Active</span>
              </span>
              <span className="text-primary font-semibold text-xs hidden sm:inline">Audited</span>
            </div>
          </div>
        )}

        {/* Console Footer */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Powered by Gemini 3.8 Flash & Vertex AI</span>
          </div>
          <span>Engineered by Wisman Nur</span>
        </div>
      </div>

      {/* Bottom Resize Handle */}
      <div
        onMouseDown={handleMouseDownResizeConsole}
        className="w-full h-3.5 cursor-row-resize flex items-center justify-center bg-[#090A0F]/90 hover:bg-white/[0.04] transition-colors border-t border-white/[0.06] group/resize select-none"
        title="Drag down to resize terminal height"
      >
        <div className="w-12 h-1 rounded-full bg-white/20 group-hover/resize:bg-primary transition-colors" />
      </div>
    </div>
  );
}
