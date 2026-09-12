"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/services/ai-chat/types";

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

const INITIAL_MESSAGE: ChatMessage = {
  id: "initial-greeting",
  role: "assistant",
  content:
    "Hi! I am **Wisman's AI Assistant** 🤖. I am here 24/7 to answer questions about Wisman Nur's professional background, portfolio projects, technical skills, services, and availability.\n\nHow can I help you today?",
  status: "done",
};

const STORAGE_KEY = "wismannur_ai_chat_history_v2";
const SESSION_STORAGE_KEY = "wismannur_ai_chat_session_id_v2";

let msgSequence = 0;
function createClientMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  msgSequence += 1;
  return `msg_${Date.now()}_${msgSequence}`;
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

export function FloatingChatWidget() {
  const pathname = usePathname();
  const isShowcase = pathname?.startsWith("/showcase");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") {
      return [INITIAL_MESSAGE];
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse chat history:", e);
    }
    return [INITIAL_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(() =>
    ALL_SUGGESTED_PROMPTS.slice(0, 3)
  );

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      const maxHeight = 260;
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

  // Floating Window Resizing (Left, Top, Top-Left Corner)
  const [widgetWidth, setWidgetWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 420;
    try {
      const saved = localStorage.getItem("floating_ai_widget_width");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 360 && val <= window.innerWidth - 30) {
          return val;
        }
      }
    } catch {}
    return 420;
  });

  const [widgetHeight, setWidgetHeight] = useState<number>(() => {
    if (typeof window === "undefined") return 600;
    try {
      const saved = localStorage.getItem("floating_ai_widget_height");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 440 && val <= window.innerHeight - 30) {
          return val;
        }
      }
    } catch {}
    return 600;
  });

  const [isResizingWidget, setIsResizingWidget] = useState(false);
  const activeResizeHandleRef = useRef<"left" | "top" | "top-left" | null>(null);

  const handleMouseDownResizeWidget = (
    e: React.MouseEvent,
    direction: "left" | "top" | "top-left"
  ) => {
    e.preventDefault();
    activeResizeHandleRef.current = direction;
    setIsResizingWidget(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!activeResizeHandleRef.current) return;
      const dir = activeResizeHandleRef.current;

      if (dir === "left" || dir === "top-left") {
        const calculatedWidth = window.innerWidth - 24 - moveEvent.clientX;
        const minW = 360;
        const maxW = Math.floor(window.innerWidth - 48);
        setWidgetWidth(Math.min(Math.max(calculatedWidth, minW), maxW));
      }

      if (dir === "top" || dir === "top-left") {
        const calculatedHeight = window.innerHeight - 24 - moveEvent.clientY;
        const minH = 440;
        const maxH = Math.floor(window.innerHeight - 48);
        setWidgetHeight(Math.min(Math.max(calculatedHeight, minH), maxH));
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const dir = activeResizeHandleRef.current;
      if (dir) {
        activeResizeHandleRef.current = null;
        setIsResizingWidget(false);

        if (dir === "left" || dir === "top-left") {
          const finalW = Math.min(
            Math.max(window.innerWidth - 24 - upEvent.clientX, 360),
            Math.floor(window.innerWidth - 48)
          );
          try {
            localStorage.setItem("floating_ai_widget_width", String(finalW));
          } catch {}
        }

        if (dir === "top" || dir === "top-left") {
          const finalH = Math.min(
            Math.max(window.innerHeight - 24 - upEvent.clientY, 440),
            Math.floor(window.innerHeight - 48)
          );
          try {
            localStorage.setItem("floating_ai_widget_height", String(finalH));
          } catch {}
        }
      }

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Save chat history to localStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (e) {
      console.error("Failed to persist chat history:", e);
    }
  }, [messages]);

  // Auto scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Focus input and refresh random suggested prompts when chat opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setSuggestedPrompts(getRandomSuggestedPrompts(3));
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scrollToBottom]);

  const handleReset = () => {
    const fresh = [INITIAL_MESSAGE];
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
        .filter((m) => m.id !== "initial-greeting")
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

      if (!res.body) {
        throw new Error("No response body received.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      const state = {
        accumulatedContent: "",
        toolCallData: undefined as Record<string, unknown> | undefined,
        toolResultData: undefined as Record<string, unknown> | undefined,
      };

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
                state.accumulatedContent += data.content;
                const textSnapshot = state.accumulatedContent;
                const toolArgs = state.toolCallData;
                const toolRes = state.toolResultData;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content: textSnapshot,
                          toolCallArgs: toolArgs,
                          toolCallResult: toolRes,
                        }
                      : msg
                  )
                );
              } else if (data.type === "tool_call") {
                state.toolCallData = data.args;
                const toolName = data.toolName;
                const argsSnapshot = data.args;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          toolCallName: toolName,
                          toolCallArgs: argsSnapshot,
                        }
                      : msg
                  )
                );
              } else if (data.type === "tool_result") {
                state.toolResultData = data.result;
                const resultSnapshot = data.result;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          toolCallResult: resultSnapshot,
                        }
                      : msg
                  )
                );
              } else if (data.type === "error") {
                state.accumulatedContent += `\n\n⚠️ ${data.content}`;
                const errorSnapshot = state.accumulatedContent;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content: errorSnapshot,
                          status: "error",
                        }
                      : msg
                  )
                );
              }
            } catch (jsonErr) {
              console.warn("Failed to parse SSE line:", trimmed, jsonErr);
            }
          }
        }
      }

      const finalContent = state.accumulatedContent;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                status: "done",
                content: finalContent || "How else can I assist you today?",
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Chat error:", error);
      const errText =
        error instanceof Error
          ? error.message
          : "Sorry, an error occurred while connecting to the server.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `⚠️ ${errText}`,
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
      <div className="space-y-1.5 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
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
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-primary font-black mt-1 text-xs">•</span>
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
    <TooltipProvider>
      {/* Floating Trigger Button */}
      <div
        className={cn(
          "fixed bottom-6 z-50 flex items-center gap-2",
          isShowcase ? "left-6" : "right-6"
        )}
      >
        {!isOpen && (
          <div className="relative group">
            <Button
              onClick={() => setIsOpen(true)}
              className={cn(
                "h-13 px-4 sm:px-5 rounded-full shadow-2xl flex items-center gap-2.5",
                "bg-[#090A0F]/90 hover:bg-[#121524] text-white border border-white/[0.12] hover:border-primary/50 shadow-black/80 hover:shadow-primary/20 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
              )}
              aria-label="Chat with Wisman's AI Assistant"
            >
              <div className="relative p-1.5 rounded-full bg-primary/15 border border-primary/25 text-primary">
                <Bot className="w-4 h-4 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#090A0F] animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#090A0F]" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-bold leading-tight flex items-center gap-1 text-white">
                  Chat with Wisman&apos;s AI{" "}
                  <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                </span>
                <span className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
                  Online 24/7
                </span>
              </div>
            </Button>
          </div>
        )}
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          style={
            {
              "--widget-width": `${widgetWidth}px`,
              "--widget-height": `${widgetHeight}px`,
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "calc(100vh - 24px)",
            } as React.CSSProperties
          }
          className={cn(
            "fixed z-50 flex flex-col shadow-2xl shadow-black/90 border border-white/[0.12] bg-[#090A0F]/95 backdrop-blur-2xl overflow-hidden",
            "inset-x-3 bottom-3 top-16 sm:inset-auto sm:bottom-6 sm:w-[var(--widget-width)] sm:h-[var(--widget-height)] sm:rounded-2xl rounded-2xl",
            isShowcase ? "sm:left-6 sm:right-auto" : "sm:right-6",
            !isResizingWidget && "transition-all duration-300 ease-out",
            isResizingWidget && "select-none"
          )}
        >
          {/* Left Resize Drag Handle (Desktop) */}
          <div
            onMouseDown={(e) => handleMouseDownResizeWidget(e, "left")}
            className="hidden sm:flex group absolute left-0 top-3 bottom-3 w-2.5 -translate-x-1/2 cursor-col-resize z-40 items-center justify-center hover:bg-primary/20 active:bg-primary/30 transition-colors select-none"
            title="Drag left/right to resize width"
          >
            <div className="w-1 h-10 rounded-full bg-white/20 group-hover:bg-primary group-hover:h-16 group-active:bg-primary transition-all duration-200" />
          </div>

          {/* Top Resize Drag Handle (Desktop) */}
          <div
            onMouseDown={(e) => handleMouseDownResizeWidget(e, "top")}
            className="hidden sm:flex group absolute top-0 left-3 right-3 h-2.5 -translate-y-1/2 cursor-row-resize z-40 items-center justify-center hover:bg-primary/20 active:bg-primary/30 transition-colors select-none"
            title="Drag up/down to resize height"
          >
            <div className="h-1 w-10 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-16 group-active:bg-primary transition-all duration-200" />
          </div>

          {/* Top-Left Corner Resize Drag Handle (Desktop) */}
          <div
            onMouseDown={(e) => handleMouseDownResizeWidget(e, "top-left")}
            className="hidden sm:flex group absolute -top-1 -left-1 w-5 h-5 cursor-nwse-resize z-50 items-center justify-center hover:bg-primary/30 rounded-tl-xl transition-colors select-none"
            title="Drag corner to resize width and height"
          >
            <div className="w-2 h-2 rounded-full bg-white/30 group-hover:bg-primary group-hover:scale-125 transition-all duration-200" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0B0D14]/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 rounded-xl bg-primary/15 border border-primary/25 text-primary">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-1 ring-[#0B0D14]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm leading-tight text-white">
                    Wisman&apos;s AI Assistant
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 h-4 font-semibold text-primary bg-primary/15 border border-primary/25"
                  >
                    AI
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-400 leading-none mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Active 24/7 • Represents Wisman Nur
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-lg"
                    onClick={handleReset}
                    aria-label="Reset conversation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Conversation</TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-lg"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Message Feed */}
          <div
            ref={scrollViewportRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id || idx}
                  className={cn(
                    "flex gap-2.5 max-w-[88%]",
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5",
                      isUser
                        ? "bg-gradient-to-br from-primary to-indigo-600 text-white font-semibold border border-white/20"
                        : "bg-[#121524] border border-white/[0.1] text-primary"
                    )}
                  >
                    {isUser ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>

                  {/* Content Bubble */}
                  <div className="flex flex-col space-y-1.5">
                    <div
                      className={cn(
                        "p-3.5 rounded-2xl text-sm shadow-sm",
                        isUser
                          ? "bg-gradient-to-r from-primary to-indigo-600 text-white rounded-tr-xs border border-white/10"
                          : "bg-[#121524]/90 border border-white/[0.08] text-gray-200 rounded-tl-xs backdrop-blur-sm"
                      )}
                    >
                      {msg.content ? (
                        renderFormattedContent(msg.content)
                      ) : msg.status === "streaming" ? (
                        <div className="flex items-center gap-1.5 py-1 text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs">Typing response...</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Tool execution badge feedback */}
                    {msg.toolCallName && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {msg.toolCallName === "submit_hire_inquiry"
                            ? "Hiring inquiry submitted to Wisman's dashboard."
                            : "Message submitted to Wisman's inbox."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Suggested Prompts (shown when only initial greeting is present) */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" /> Suggested Questions:
                  </p>
                  <button
                    type="button"
                    onClick={() => setSuggestedPrompts(getRandomSuggestedPrompts(3))}
                    className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]"
                    title="Shuffle other questions"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Shuffle</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {suggestedPrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs p-3 rounded-xl border border-white/[0.08] hover:border-primary/40 bg-[#121524]/60 hover:bg-[#181D30] transition-all text-gray-300 hover:text-white flex items-center justify-between group shadow-sm"
                    >
                      <span>{prompt}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Footer with Top Resize Handle */}
          <div className="p-3 border-t border-white/[0.08] bg-[#0B0D14]/80 backdrop-blur-md relative flex flex-col">
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
              className="relative flex flex-col bg-[#121524]/80 border border-white/[0.1] rounded-xl p-2 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all font-sans"
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
                placeholder="Ask anything about Wisman..."
                disabled={isLoading}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-gray-500 resize-none outline-none px-1 py-1 scrollbar-thin overflow-y-auto leading-relaxed"
              />

              {/* Bottom toolbar inside input box */}
              <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.05] mt-1">
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                  <span className="hidden sm:inline">Enter send • Shift+Enter new line</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Quick Expand / Collapse Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (inputHeight > 80) {
                        setInputHeight(56);
                      } else {
                        setInputHeight(190);
                      }
                    }}
                    className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    title={inputHeight > 80 ? "Perkecil input" : "Perbesar input"}
                  >
                    {inputHeight > 80 ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="h-7 w-7 rounded-lg shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-white shrink-0 disabled:opacity-40"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
            <p className="text-[10px] text-center text-gray-400 mt-2 leading-none font-medium">
              Powered by Gemini 3.8 Flash • Instant responses 24/7
            </p>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
