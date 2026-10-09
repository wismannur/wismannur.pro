"use client";

import React from "react";
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/services/ai-chat/types";
import { CopilotMarkdown } from "@/components/cms/copilot/copilot-markdown";

interface FloatingChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  suggestedPrompts: string[];
  onRefreshSuggestedPrompts: () => void;
  onSendMessage: (text: string) => void;
  scrollViewportRef: React.RefObject<HTMLDivElement | null>;
}

export function FloatingChatMessageList({
  messages,
  isLoading,
  suggestedPrompts,
  onRefreshSuggestedPrompts,
  onSendMessage,
  scrollViewportRef,
}: FloatingChatMessageListProps) {
  return (
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
                  isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <CopilotMarkdown content={msg.content} />
                  )
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
              onClick={onRefreshSuggestedPrompts}
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
                onClick={() => onSendMessage(prompt)}
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
  );
}
