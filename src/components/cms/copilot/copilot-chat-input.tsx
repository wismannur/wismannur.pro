"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Sparkles,
  ChevronDown,
  Terminal,
  Brain,
  X,
  Check,
  Minimize2,
  Maximize2,
  Loader2,
  Send,
  GripHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  COPILOT_SKILLS,
  getSkillByCommand,
  type CopilotSkillDefinition,
} from "@/services/cms-copilot/skills";
import { CopilotSlashCommandMenu } from "./copilot-slash-command-menu";
import { INPUT_HEIGHT_KEY } from "@/hooks/use-copilot-draft";

interface CopilotChatInputProps {
  input: string;
  setInput: (value: string) => void;
  inputHeight: number;
  setInputHeight: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
  showQuickPrompts: boolean;
  toggleQuickPrompts: () => void;
  contextualPrompts: Array<{ label: string; prompt: string }>;
  onSubmit: (e?: React.FormEvent, customPrompt?: string) => void;
  onMouseDownResize: (e: React.MouseEvent) => void;
  onTouchStartResize: (e: React.TouchEvent) => void;
  currentSessionId: string;
  saveDraft: (val: string, sid?: string) => void;
  clearDraft: (sid?: string) => void;
  setDraftRestored: (val: boolean) => void;
  draftRestored: boolean;
}

export function CopilotChatInput({
  input,
  setInput,
  inputHeight,
  setInputHeight,
  isLoading,
  showQuickPrompts,
  toggleQuickPrompts,
  contextualPrompts,
  onSubmit,
  onMouseDownResize,
  onTouchStartResize,
  currentSessionId,
  saveDraft,
  clearDraft,
  setDraftRestored,
  draftRestored,
}: CopilotChatInputProps) {
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [slashSearchQuery, setSlashSearchQuery] = useState("");
  const [highlightedSkillIndex, setHighlightedSkillIndex] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const filteredSkills = React.useMemo(() => {
    if (!slashSearchQuery) return COPILOT_SKILLS;
    const q = slashSearchQuery.toLowerCase();
    return COPILOT_SKILLS.filter(
      (s) =>
        s.command.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [slashSearchQuery]);

  const activeSkill = React.useMemo(() => {
    const match = input.trim().match(/^(\/[a-zA-Z0-9_-]+)/);
    if (match) {
      return getSkillByCommand(match[1]);
    }
    return undefined;
  }, [input]);

  const handleInputChange = (newVal: string) => {
    setInput(newVal);
    saveDraft(newVal, currentSessionId);
    if (draftRestored && !newVal.trim()) {
      setDraftRestored(false);
    }

    if (newVal.startsWith("/")) {
      const spaceIdx = newVal.indexOf(" ");
      if (spaceIdx === -1) {
        setSlashSearchQuery(newVal.slice(1).trim().toLowerCase());
        setIsSlashMenuOpen(true);
        setHighlightedSkillIndex(0);
      } else {
        setIsSlashMenuOpen(false);
      }
    } else {
      setIsSlashMenuOpen(false);
    }
  };

  const handleSelectSkill = (skill: CopilotSkillDefinition) => {
    const spaceIdx = input.indexOf(" ");
    const existingMessage = spaceIdx !== -1 ? input.slice(spaceIdx + 1) : "";
    const nextVal = `${skill.command} ${existingMessage}`.trimStart();
    setInput(nextVal);
    saveDraft(nextVal, currentSessionId);
    setIsSlashMenuOpen(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = nextVal.length;
        inputRef.current.selectionEnd = nextVal.length;
      }
    }, 50);

    if (skill.status === "planned") {
      toast.info(`Skill ${skill.label} akan segera aktif di fase berikutnya!`);
    }
  };

  useEffect(() => {
    if (!isSlashMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setIsSlashMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSlashMenuOpen]);

  return (
    <>
      {/* Contextual Quick Suggestions with Mobile Swipeable Carousel */}
      <div className="px-3 sm:px-4 py-1.5 border-t border-white/[0.06] bg-[#0C0E18]/80 flex flex-col gap-1.5 transition-all">
        <button
          type="button"
          onClick={toggleQuickPrompts}
          className="w-full flex items-center justify-between text-[10px] font-mono text-gray-500 hover:text-gray-300 uppercase tracking-wider cursor-pointer select-none group py-0.5"
          title={showQuickPrompts ? "Sembunyikan saran prompt" : "Tampilkan saran prompt"}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span>Quick Prompts</span>
            <span className="text-[9px] lowercase px-1.5 py-0.2 rounded bg-white/[0.04] text-gray-400 font-sans">
              {contextualPrompts.length} saran
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 group-hover:text-indigo-300 font-sans normal-case">
            <span className="text-[9px] text-gray-500 sm:hidden">Geser ↔</span>
            <span>{showQuickPrompts ? "Sembunyikan" : "Tampilkan"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showQuickPrompts ? "rotate-180" : "rotate-0"
              )}
            />
          </div>
        </button>

        {showQuickPrompts && (
          <div className="flex overflow-x-auto sm:flex-wrap gap-1.5 pt-0.5 pb-1 no-scrollbar scroll-smooth touch-pan-x -mx-1 px-1 animate-in fade-in duration-200">
            {contextualPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSubmit(undefined, item.prompt)}
                disabled={isLoading}
                className="shrink-0 sm:shrink text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 active:bg-indigo-600/30 hover:text-indigo-300 hover:border-indigo-500/40 border border-white/[0.08] text-gray-300 text-left transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap sm:whitespace-normal"
              >
                <span className="font-semibold text-white mr-0.5">{item.label}:</span>
                <span className="text-gray-400 max-w-[200px] sm:max-w-[280px] truncate">
                  {item.prompt}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Form with Top Resize Handle */}
      <div className="border-t border-white/[0.08] bg-[#0C0E18]/95 relative flex flex-col pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        {/* Top Drag Handle Bar to Resize Upwards */}
        <div
          onMouseDown={onMouseDownResize}
          onTouchStart={onTouchStartResize}
          className="group w-full h-3.5 cursor-row-resize flex items-center justify-center hover:bg-white/[0.04] transition-colors select-none -mt-1 z-10 touch-none"
          title="Drag up/down to resize input height"
        >
          <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-indigo-400 group-hover:w-16 transition-all duration-200" />
        </div>

        <div className="p-2.5 sm:p-3 pt-0.5 sm:pt-1">
          <form
            ref={formRef}
            onSubmit={(e) => onSubmit(e)}
            className="relative flex flex-col bg-[#131726] border border-white/[0.1] rounded-xl p-2 sm:p-2.5 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-inner"
          >
            {/* Slash Command Autocomplete Popover */}
            {isSlashMenuOpen && (
              <CopilotSlashCommandMenu
                searchQuery={slashSearchQuery}
                filteredSkills={filteredSkills}
                highlightedIndex={highlightedSkillIndex}
                onSelectSkill={handleSelectSkill}
                onHoverIndex={setHighlightedSkillIndex}
                onClose={() => setIsSlashMenuOpen(false)}
              />
            )}

            {/* Active Skill Pill/Tag if prompt starts with skill command */}
            {activeSkill && (
              <div className="flex items-center justify-between px-2 py-1 mb-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-xs text-indigo-200 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Brain className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white font-mono text-[11px]">
                    {activeSkill.command}
                  </span>
                  <span className="text-[11px] text-indigo-300 hidden xs:inline">
                    • {activeSkill.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const stripped = input.replace(new RegExp(`^${activeSkill.command}\\s*`), "");
                    setInput(stripped);
                    saveDraft(stripped, currentSessionId);
                  }}
                  className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                  title="Lepas skill ini dari prompt"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Sample prompt chip if input only has the command prefix */}
            {activeSkill && activeSkill.samplePrompt && input.trim() === activeSkill.command && (
              <button
                type="button"
                onClick={() => {
                  const sample = `${activeSkill.command} ${activeSkill.samplePrompt}`;
                  setInput(sample);
                  saveDraft(sample, currentSessionId);
                  setTimeout(() => inputRef.current?.focus(), 20);
                }}
                className="mb-1.5 text-left px-2.5 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-[10.5px] text-indigo-300 font-mono border border-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer w-fit"
                title="Klik untuk menyisipkan prompt contoh"
              >
                <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />
                <span className="text-gray-400">Contoh:</span>
                <span className="truncate italic max-w-[280px] sm:max-w-[420px]">
                  &quot;{activeSkill.samplePrompt}&quot;
                </span>
              </button>
            )}

            <textarea
              ref={inputRef}
              value={input}
              style={{
                height: `${inputHeight}px`,
                maxHeight: "45vh",
                minHeight: "44px",
              }}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (isSlashMenuOpen && filteredSkills.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedSkillIndex((prev) => (prev + 1) % filteredSkills.length);
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedSkillIndex((prev) => (prev - 1 + filteredSkills.length) % filteredSkills.length);
                    return;
                  }
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    const target = filteredSkills[highlightedSkillIndex] || filteredSkills[0];
                    if (target) {
                      handleSelectSkill(target);
                    }
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setIsSlashMenuOpen(false);
                    return;
                  }
                }

                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder={
                activeSkill
                  ? `${activeSkill.placeholder}`
                  : "Tanyakan apapun tentang CMS atau ketik / untuk daftar skill..."
              }
              className="w-full bg-transparent text-xs text-white placeholder-gray-500 resize-none outline-none px-1 py-1 scrollbar-thin overflow-y-auto leading-relaxed"
              disabled={isLoading}
            />

            {/* Bottom toolbar inside input box */}
            <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-white/[0.05] mt-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-gray-500 font-mono min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (isSlashMenuOpen) {
                      setIsSlashMenuOpen(false);
                    } else {
                      if (!input.startsWith("/")) {
                        const nextVal = `/${input}`.trimStart();
                        setInput(nextVal);
                        saveDraft(nextVal, currentSessionId);
                      }
                      setIsSlashMenuOpen(true);
                      setSlashSearchQuery("");
                      setHighlightedSkillIndex(0);
                      setTimeout(() => inputRef.current?.focus(), 20);
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors font-mono cursor-pointer border shrink-0",
                    isSlashMenuOpen || activeSkill
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                      : "bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border-white/10"
                  )}
                  title="Pilih Copilot Skill (Ketik /)"
                >
                  <Terminal className="h-2.5 w-2.5 text-indigo-400" />
                  <span>/skills</span>
                </button>

                <span className="hidden sm:inline">Enter kirim • Shift+Enter baris baru</span>
                {input.trim().length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                    <Check className="h-2.5 w-2.5" />
                    <span className="hidden xs:inline">Draft tersimpan</span>
                    <span className="xs:hidden">Draft</span>
                  </span>
                )}
                {input.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setInput("");
                      clearDraft(currentSessionId);
                      setDraftRestored(false);
                      setIsSlashMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-1 text-[9px] text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                    title="Buang draft ini"
                  >
                    <X className="h-2.5 w-2.5" />
                    <span>Buang</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (inputHeight > 100) {
                      setInputHeight(64);
                      try {
                        localStorage.setItem(INPUT_HEIGHT_KEY, "64");
                      } catch {}
                    } else {
                      const target = Math.min(240, Math.floor(window.innerHeight * 0.4));
                      setInputHeight(target);
                      try {
                        localStorage.setItem(INPUT_HEIGHT_KEY, String(target));
                      } catch {}
                    }
                  }}
                  className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  title={inputHeight > 100 ? "Perkecil input" : "Perbesar input"}
                >
                  {inputHeight > 100 ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </Button>

                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="h-7 w-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 disabled:opacity-40 shadow-sm"
                  title="Kirim instruksi"
                >
                  {isLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                </Button>
              </div>
            </div>
          </form>

          <div className="hidden sm:flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1.5 px-1">
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
            </span>
            <span>Tekan ⌘J untuk sembunyikan</span>
          </div>
          <div className="sm:hidden flex items-center justify-between text-[9.5px] text-gray-500 font-mono mt-1 px-1">
            <span>Gemini 3.8 Flash • Copilot</span>
            <span>Tarik handle untuk resize</span>
          </div>
        </div>
      </div>
    </>
  );
}
