"use client";

import React from "react";
import {
  ArrowUpRight,
  Bot,
  GripHorizontal,
  Loader2,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/services/ai-chat/types";

interface ConsoleAssistantTabProps {
  messages: ChatMessage[];
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  inputHeight: number;
  suggestedPrompts: string[];
  refreshSuggestedPrompts: () => void;
  onReset: () => void;
  onSendMessage: (text: string) => void;
  onMouseDownOnResize: (e: React.MouseEvent) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

function renderFormattedContent(content: string) {
  const normalized = content.replace(/<br\s*\/?>/gi, "\n");
  const lines = normalized.split("\n");

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
}

export function ConsoleAssistantTab({
  messages,
  isLoading,
  input,
  setInput,
  inputHeight,
  suggestedPrompts,
  refreshSuggestedPrompts,
  onReset,
  onSendMessage,
  onMouseDownOnResize,
  scrollRef,
  inputRef,
}: ConsoleAssistantTabProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
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
          onClick={onReset}
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
                <Sparkles size={12} className="text-primary" />
                <span>Frequently Asked Questions:</span>
              </p>
              <button
                type="button"
                onClick={refreshSuggestedPrompts}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/[0.06] transition-colors"
                title="Shuffle suggestions"
              >
                <RefreshCw size={11} className="transition-transform active:rotate-180" />
                <span className="hidden sm:inline">Shuffle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {suggestedPrompts.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => onSendMessage(prompt)}
                  className="text-left p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-primary/40 text-[11px] text-gray-300 hover:text-white transition-all flex items-center justify-between group/prompt"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <ArrowUpRight
                    size={12}
                    className="text-muted-foreground group-hover/prompt:text-primary shrink-0 transition-transform group-hover/prompt:translate-x-0.5 group-hover/prompt:-translate-y-0.5"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="pt-2 border-t border-white/[0.08]">
        {/* Resize Bar */}
        <div
          onMouseDown={onMouseDownOnResize}
          className="h-2 w-full flex items-center justify-center cursor-row-resize hover:bg-white/[0.03] transition-colors -mt-1 mb-1 rounded group/drag select-none"
          title="Drag up/down to resize input box"
        >
          <GripHorizontal
            size={12}
            className="text-muted-foreground/30 group-hover/drag:text-primary transition-colors"
          />
        </div>

        <form onSubmit={handleSubmit} className="relative flex flex-col gap-1.5">
          <div className="relative rounded-2xl bg-[#11131E] border border-white/[0.1] focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all overflow-hidden flex flex-col justify-between">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Wisman's experience, architecture, or hire availability..."
              disabled={isLoading}
              style={{ height: `${inputHeight}px` }}
              className="w-full bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none transition-[height] duration-75 overflow-y-auto"
            />

            <div className="flex items-center justify-between px-2.5 pb-2 pt-0.5 bg-transparent text-[11px]">
              <span className="text-[10px] text-muted-foreground/60 hidden sm:inline font-mono">
                Press Enter to send, Shift+Enter for new line
              </span>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs",
                  input.trim() && !isLoading
                    ? "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-white/[0.05] text-muted-foreground cursor-not-allowed border border-white/[0.05]"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-primary" />
                    <span>Thinking...</span>
                  </>
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
  );
}
