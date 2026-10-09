"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import type { ChatMessage } from "@/services/ai-chat/types";
import {
  ALL_SUGGESTED_PROMPTS,
  getRandomSuggestedPrompts,
  INITIAL_HERO_MESSAGE,
  STORAGE_KEY,
  SESSION_STORAGE_KEY,
  CONSOLE_HEIGHT_KEY,
  DEFAULT_CONSOLE_BODY_HEIGHT,
  type ConsoleTab,
} from "./constants";

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

export function useHeroConsole() {
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
      if (
        userMessages.length > 1 ||
        (userMessages.length === 1 && userMessages[0].id !== "hero-initial-greeting")
      ) {
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

  const refreshSuggestedPrompts = () => {
    setSuggestedPrompts(getRandomSuggestedPrompts(3));
  };

  return {
    activeTab,
    setActiveTab,
    messages,
    input,
    setInput,
    isLoading,
    suggestedPrompts,
    refreshSuggestedPrompts,
    scrollRef,
    inputRef,
    consoleHeight,
    inputHeight,
    handleMouseDownResizeConsole,
    handleMouseDownOnResize,
    handleReset,
    handleSendMessage,
  };
}
