"use client";

import React from "react";
import {
  Bot,
  User,
  CheckCircle2,
  Sparkles,
  Brain,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCallInfo, ToolResultInfo } from "@/services/cms-copilot/types";
import { extractSkillFromPrompt } from "@/services/cms-copilot/skills";
import { CopilotMarkdown } from "./copilot-markdown";

export interface MessageUI {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallInfo[];
  toolResults?: ToolResultInfo[];
  status?: "streaming" | "done" | "error";
  createdAt?: string | Date;
}

interface CopilotChatMessagesProps {
  messages: MessageUI[];
  isLoading: boolean;
  activeTool: string | null;
  scrollViewportRef: React.RefObject<HTMLDivElement | null>;
}

export function CopilotChatMessages({
  messages,
  isLoading,
  activeTool,
  scrollViewportRef,
}: CopilotChatMessagesProps) {
  return (
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
                    <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-[280px]">
                      {tc.name}
                    </span>
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
                        <span className="font-semibold text-white">
                          Synthesized with {prevSkill.label}
                        </span>
                      </div>
                      <span className="text-[9.5px] text-gray-500 hidden sm:inline">
                        Dual-Source Memory
                      </span>
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
                          <span className="text-[10px] text-indigo-200/80 hidden xs:inline">
                            • {extracted.skill.label}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="whitespace-pre-wrap text-[12.5px] sm:text-[13px] leading-relaxed select-text">
                    {(() => {
                      const extracted = extractSkillFromPrompt(msg.content);
                      return extracted.skill && extracted.cleanedPrompt
                        ? extracted.cleanedPrompt
                        : msg.content;
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
  );
}
