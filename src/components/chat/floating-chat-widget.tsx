"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFloatingChat } from "./floating-chat/use-floating-chat";
import { FloatingChatHeader } from "./floating-chat/floating-chat-header";
import { FloatingChatMessageList } from "./floating-chat/floating-chat-message-list";
import { FloatingChatInput } from "./floating-chat/floating-chat-input";

export interface FloatingChatWidgetProps {
  onOpenChange?: (open: boolean) => void;
}

export function FloatingChatWidget({ onOpenChange }: FloatingChatWidgetProps = {}) {
  const pathname = usePathname();
  const isShowcase = pathname?.startsWith("/showcase");

  const {
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
  } = useFloatingChat(onOpenChange);

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
        <>
          {/* Mobile Backdrop Overlay */}
          <div
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[55] sm:hidden animate-in fade-in"
            aria-hidden="true"
          />

          <div
            style={
              {
                "--widget-width": `${widgetWidth}px`,
                "--widget-height": `${widgetHeight}px`,
                maxWidth: "100vw",
                maxHeight: "100dvh",
              } as React.CSSProperties
            }
            className={cn(
              "fixed z-[60] flex flex-col shadow-2xl shadow-black/90 bg-[#090A0F] sm:bg-[#090A0F]/95 backdrop-blur-2xl overflow-hidden overscroll-contain",
              // Mobile (< 640px / sm): True Full Screen edge-to-edge
              "inset-0 w-full h-[100dvh] max-h-[100dvh] rounded-none border-none",
              // Desktop (>= 640px / sm): Bottom corner floating box
              "sm:inset-auto sm:bottom-6 sm:w-[var(--widget-width)] sm:h-[var(--widget-height)] sm:rounded-2xl sm:border sm:border-white/[0.12]",
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
            <FloatingChatHeader onReset={handleReset} onClose={handleClose} />

            {/* Message Feed */}
            <FloatingChatMessageList
              messages={messages}
              isLoading={isLoading}
              suggestedPrompts={suggestedPrompts}
              onRefreshSuggestedPrompts={refreshSuggestedPrompts}
              onSendMessage={handleSendMessage}
              scrollViewportRef={scrollViewportRef}
            />

            {/* Input Footer */}
            <FloatingChatInput
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              inputHeight={inputHeight}
              setInputHeight={setInputHeight}
              onSendMessage={handleSendMessage}
              onMouseDownOnResize={handleMouseDownOnResize}
              onTouchStartOnResize={handleTouchStartOnResize}
              inputRef={inputRef}
            />
          </div>
        </>
      )}
    </TooltipProvider>
  );
}
