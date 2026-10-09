"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatMessage } from "@/services/ai-chat/types";
import {
  ALL_SUGGESTED_PROMPTS,
  getRandomSuggestedPrompts,
  INITIAL_MESSAGE,
  STORAGE_KEY,
  SESSION_STORAGE_KEY,
  INPUT_HEIGHT_KEY,
} from "./constants";

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

export function useFloatingChat(onOpenChange?: (open: boolean) => void) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    onOpenChange?.(isOpen);
    if (typeof document !== "undefined") {
      if (isOpen) {
        document.body.setAttribute("data-floating-chat-open", "true");
        if (window.innerWidth < 640) {
          document.body.style.overflow = "hidden";
        }
      } else {
        document.body.removeAttribute("data-floating-chat-open");
        document.body.style.overflow = "";
      }
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("public-chat-open", { detail: { isOpen } })
      );
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, onOpenChange]);

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

  const [inputHeight, setInputHeight] = useState<number>(() => {
    if (typeof window === "undefined") return 56;
    try {
      const saved = localStorage.getItem(INPUT_HEIGHT_KEY);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 44 && val <= 350) return val;
      }
    } catch {}
    return 56;
  });

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
      const maxHeight = Math.floor(window.innerHeight * 0.45);
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 44), maxHeight);
      setInputHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingInputRef.current = false;
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
    isDraggingInputRef.current = true;
    dragStartYRef.current = e.touches[0].clientY;
    startHeightRef.current = inputHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingInputRef.current || moveEvent.touches.length !== 1) return;
      const deltaY = dragStartYRef.current - moveEvent.touches[0].clientY;
      const maxHeight = Math.floor(window.innerHeight * 0.45);
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 44), maxHeight);
      setInputHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingInputRef.current = false;
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

  // Floating Window Resizing
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

  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (e) {
      console.error("Failed to persist chat history:", e);
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

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

  const isHistoryPushedRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isHistoryPushedRef.current) {
      isHistoryPushedRef.current = false;
      if (typeof window !== "undefined" && window.history.state?.__publicChatWidgetOpen) {
        window.history.back();
      }
    }
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isOpen) {
      if (isHistoryPushedRef.current) {
        isHistoryPushedRef.current = false;
        if (window.history.state?.__publicChatWidgetOpen) {
          window.history.back();
        }
      }
      return;
    }

    if (!isHistoryPushedRef.current) {
      const currentState = window.history.state || {};
      window.history.pushState(
        { ...currentState, __publicChatWidgetOpen: true },
        "",
        window.location.href
      );
      isHistoryPushedRef.current = true;
    }

    const handlePopState = () => {
      if (!isHistoryPushedRef.current) return;
      isHistoryPushedRef.current = false;
      setIsOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

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

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          clientSessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const state: {
        accumulatedContent: string;
        toolCallData?: Record<string, unknown>;
        toolResultData?: Record<string, unknown>;
      } = {
        accumulatedContent: "",
        toolCallData: undefined,
        toolResultData: undefined,
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

  const refreshSuggestedPrompts = () => {
    setSuggestedPrompts(getRandomSuggestedPrompts(3));
  };

  return {
    isOpen,
    setIsOpen,
    handleClose,
    messages,
    input,
    setInput,
    isLoading,
    suggestedPrompts,
    refreshSuggestedPrompts,
    scrollViewportRef,
    inputRef,
    inputHeight,
    setInputHeight,
    widgetWidth,
    widgetHeight,
    isResizingWidget,
    handleMouseDownOnResize,
    handleTouchStartOnResize,
    handleMouseDownResizeWidget,
    handleReset,
    handleSendMessage,
  };
}
