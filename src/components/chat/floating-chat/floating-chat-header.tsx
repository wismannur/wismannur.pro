"use client";

import React from "react";
import { Bot, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FloatingChatHeaderProps {
  onReset: () => void;
  onClose: () => void;
}

export function FloatingChatHeader({ onReset, onClose }: FloatingChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 pt-[max(0.65rem,env(safe-area-inset-top))] border-b border-white/[0.08] bg-[#0B0D14]/85 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative p-2 rounded-xl bg-primary/15 border border-primary/25 text-primary shrink-0">
          <Bot className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-1 ring-[#0B0D14]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <h3 className="font-semibold text-xs sm:text-sm leading-tight text-white truncate">
              Wisman&apos;s AI Assistant
            </h3>
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 h-4 font-semibold text-primary bg-primary/15 border border-primary/25 shrink-0"
            >
              AI
            </Badge>
          </div>
          <p className="text-[10.5px] sm:text-[11px] text-gray-400 leading-none mt-0.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
            <span className="truncate">Active 24/7 • Represents Wisman Nur</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-lg cursor-pointer"
              onClick={onReset}
              aria-label="Reset conversation"
              title="Reset percakapan"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset Conversation</TooltipContent>
        </Tooltip>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-lg cursor-pointer"
          onClick={onClose}
          aria-label="Close chat"
          title="Tutup chat"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
