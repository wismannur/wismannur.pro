"use client";

import React from "react";
import { Loader2, Maximize2, Minimize2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INPUT_HEIGHT_KEY } from "./constants";

interface FloatingChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  inputHeight: number;
  setInputHeight: React.Dispatch<React.SetStateAction<number>>;
  onSendMessage: (text: string) => void;
  onMouseDownOnResize: (e: React.MouseEvent) => void;
  onTouchStartOnResize: (e: React.TouchEvent) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function FloatingChatInput({
  input,
  setInput,
  isLoading,
  inputHeight,
  setInputHeight,
  onSendMessage,
  onMouseDownOnResize,
  onTouchStartOnResize,
  inputRef,
}: FloatingChatInputProps) {
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

  const toggleExpand = () => {
    if (inputHeight > 80) {
      const h = 56;
      setInputHeight(h);
      try {
        localStorage.setItem(INPUT_HEIGHT_KEY, String(h));
      } catch {}
    } else {
      const h = 140;
      setInputHeight(h);
      try {
        localStorage.setItem(INPUT_HEIGHT_KEY, String(h));
      } catch {}
    }
  };

  return (
    <div className="p-2.5 sm:p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/[0.08] bg-[#0B0D14]/85 backdrop-blur-md relative flex flex-col shrink-0">
      {/* Top Drag Handle Bar to Resize Upwards */}
      <div
        onMouseDown={onMouseDownOnResize}
        onTouchStart={onTouchStartOnResize}
        className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none -mt-1 mb-1 z-10 touch-none"
        title="Drag up/down to resize input height"
      >
        <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-16 transition-all duration-200" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col bg-[#121524]/80 border border-white/[0.1] rounded-xl p-2 sm:p-2.5 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all font-sans"
      >
        <textarea
          ref={inputRef}
          value={input}
          style={{
            height: `${inputHeight}px`,
            minHeight: "44px",
            maxHeight: "45vh",
          }}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about Wisman..."
          disabled={isLoading}
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-gray-500 resize-none outline-none px-1 py-1 scrollbar-thin overflow-y-auto leading-relaxed"
        />

        {/* Bottom toolbar inside input box */}
        <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.05] mt-1">
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
            <span className="hidden sm:inline">Enter send • Shift+Enter new line</span>
            <span className="sm:hidden">Gemini 3.8 Flash</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleExpand}
              className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
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
              className="h-7 w-7 rounded-lg shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-white shrink-0 disabled:opacity-40 cursor-pointer"
              aria-label="Send message"
              title="Kirim pesan"
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
      <p className="text-[10px] text-center text-gray-400 mt-1.5 leading-none font-medium">
        Powered by Gemini 3.8 Flash • Instant responses 24/7
      </p>
    </div>
  );
}
