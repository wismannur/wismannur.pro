"use client";

import React, { useEffect, useRef } from "react";
import {
  Brain,
  FileText,
  Search,
  PenTool,
  Sparkles,
  Terminal,
  CornerDownLeft,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CopilotSkillDefinition } from "@/services/cms-copilot/skills";

interface CopilotSlashCommandMenuProps {
  searchQuery: string;
  filteredSkills: CopilotSkillDefinition[];
  highlightedIndex: number;
  onSelectSkill: (skill: CopilotSkillDefinition) => void;
  onHoverIndex: (index: number) => void;
  onClose: () => void;
}

function getSkillIcon(iconName: CopilotSkillDefinition["iconName"]) {
  switch (iconName) {
    case "Brain":
      return Brain;
    case "FileText":
      return FileText;
    case "Search":
      return Search;
    case "PenTool":
      return PenTool;
    default:
      return Sparkles;
  }
}

export function CopilotSlashCommandMenu({
  searchQuery,
  filteredSkills,
  highlightedIndex,
  onSelectSkill,
  onHoverIndex,
  onClose,
}: CopilotSlashCommandMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>("[data-highlighted='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  return (
    <div
      role="listbox"
      aria-label="Daftar Copilot Skills"
      className="absolute bottom-full mb-2 left-0 right-0 z-30 overflow-hidden rounded-xl border border-white/[0.12] bg-[#0E1220]/95 backdrop-blur-xl shadow-2xl animate-in fade-in-0 slide-in-from-bottom-2 duration-150"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
          <Terminal className="h-3.5 w-3.5 text-indigo-400" />
          <span>Copilot Skills</span>
          {searchQuery && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-1.5 py-0 h-4 border-indigo-500/30 text-indigo-300 bg-indigo-500/10"
            >
              /{searchQuery}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
          <span className="hidden sm:inline-flex items-center gap-1 text-gray-500">
            <span>Gunakan</span>
            <kbd className="px-1 py-0.2 bg-white/[0.06] rounded border border-white/10 text-gray-300">↑</kbd>
            <kbd className="px-1 py-0.2 bg-white/[0.06] rounded border border-white/10 text-gray-300">↓</kbd>
            <span>navigasi</span>
            <kbd className="px-1.5 py-0.2 bg-white/[0.06] rounded border border-white/10 text-gray-300">↵</kbd>
            <span>pilih</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Tutup menu skill (Esc)"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Skills list */}
      <div
        ref={listRef}
        className="max-h-[260px] overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-white/10"
      >
        {filteredSkills.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-gray-400">
            <p>Tidak ada skill yang cocok dengan kata kunci &quot;/{searchQuery}&quot;</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Coba ketik <span className="font-mono text-indigo-300">/my-second-brain</span>
            </p>
          </div>
        ) : (
          filteredSkills.map((skill, index) => {
            const Icon = getSkillIcon(skill.iconName);
            const isHighlighted = index === highlightedIndex;
            const isActive = skill.status === "active";

            return (
              <div
                key={skill.id}
                role="option"
                aria-selected={isHighlighted}
                data-highlighted={isHighlighted}
                onMouseEnter={() => onHoverIndex(index)}
                onClick={() => onSelectSkill(skill)}
                className={cn(
                  "group relative flex items-start gap-3 rounded-lg p-2.5 cursor-pointer transition-all",
                  isHighlighted
                    ? "bg-indigo-600/15 border border-indigo-500/40 text-white shadow-sm"
                    : "border border-transparent hover:bg-white/[0.04] text-gray-300"
                )}
              >
                {/* Icon box */}
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                    isActive
                      ? isHighlighted
                        ? "bg-indigo-500/30 border-indigo-400/50 text-indigo-200"
                        : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20"
                      : "bg-white/[0.03] border-white/10 text-gray-500"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-white tracking-tight">
                      {skill.command}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      • {skill.label}
                    </span>
                    {skill.badgeText && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] px-1.5 py-0 h-3.5 font-normal",
                          isActive
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-white/[0.06] text-gray-400 border border-white/10"
                        )}
                      >
                        {isActive && <Zap className="h-2 w-2 mr-0.5 inline text-emerald-400" />}
                        {skill.badgeText}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug mt-0.5 line-clamp-1 group-hover:text-gray-300">
                    {skill.description}
                  </p>
                  {skill.samplePrompt && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-300/80 font-mono truncate">
                      <Sparkles className="h-2.5 w-2.5 shrink-0 text-indigo-400" />
                      <span className="truncate">&quot;{skill.samplePrompt}&quot;</span>
                    </div>
                  )}
                </div>

                {/* Select hint on hover/highlight */}
                <div className="shrink-0 pt-1 text-gray-500 group-hover:text-indigo-300 transition-colors">
                  <CornerDownLeft className="h-3 w-3" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-black/30 border-t border-white/[0.05] text-[10px] text-gray-500 flex items-center justify-between">
        <span>Ketik nama skill atau tekan Enter untuk menyisipkan ke pesan</span>
        <span className="font-mono text-indigo-400/80">CMS Executive Copilot</span>
      </div>
    </div>
  );
}
