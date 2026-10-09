"use client";

import React from "react";
import { Sparkles, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTextareaResize } from "@/hooks/use-textarea-resize";

interface OutreachAiAssistantProps {
  customPrompt: string;
  setCustomPrompt: (v: string) => void;
  isGeneratingAi: boolean;
  onGenerateAi: () => void;
}

export function OutreachAiAssistant({
  customPrompt,
  setCustomPrompt,
  isGeneratingAi,
  onGenerateAi,
}: OutreachAiAssistantProps) {
  const {
    height: aiPromptHeight,
    setHeight: setAiPromptHeight,
    handleMouseDownResize,
    handleTouchStartResize,
  } = useTextareaResize({ initialHeight: 76, minHeight: 64 });

  return (
    <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[#0C0E18] to-[#131726] shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <CardContent className="p-5 space-y-3 relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
              <Sparkles className="size-4 lg:size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-sm text-white block">
                AI Cold Email Assistant (Gemini)
              </span>
              <span className="text-[11px] text-slate-400">
                Tailors subject & body grounded in your tech stack & target role
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setAiPromptHeight(aiPromptHeight > 100 ? 76 : 180);
              }}
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
              title={aiPromptHeight > 100 ? "Perkecil area instruksi AI" : "Perbesar area instruksi AI"}
            >
              {aiPromptHeight > 100 ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onGenerateAi}
              disabled={isGeneratingAi}
              className="gap-2 font-semibold h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md border border-indigo-400/30 shrink-0"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Auto-Draft with AI
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="relative flex flex-col">
          <Textarea
            style={{ height: `${aiPromptHeight}px` }}
            placeholder="Optional custom instructions (e.g. 'Emphasize 8+ yrs React/Next.js experience, lead architecture for high-traffic apps, mention why I admire their product')..."
            className="bg-[#131726] border-white/[0.08] text-slate-200 placeholder:text-slate-400 text-xs leading-relaxed resize-none focus-visible:ring-indigo-500/30"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
          <div
            onMouseDown={handleMouseDownResize}
            onTouchStart={handleTouchStartResize}
            className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none mt-1 z-10"
            title="Drag down to resize AI guidance"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-16 transition-all duration-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
