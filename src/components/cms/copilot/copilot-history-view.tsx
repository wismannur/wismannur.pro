"use client";

import React from "react";
import {
  Search,
  X,
  History,
  Plus,
  Sparkles,
  MessageSquare,
  Compass,
  Download,
  Pencil,
  Trash2,
  Clock,
  Terminal,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CmsCopilotSessionRow } from "@/db/schema";
import { formatRelativeTime, formatSessionPath } from "./copilot-export";

interface CopilotHistoryViewProps {
  sessions: CmsCopilotSessionRow[];
  currentSessionId: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  copiedSessionId: string | null;
  isExportingSession: boolean;
  onSelectSession: (sess: CmsCopilotSessionRow) => void;
  onNewChat: () => void;
  onCopySessionId: (id: string, e: React.MouseEvent) => void;
  onDownloadSession: (sess: CmsCopilotSessionRow, e: React.MouseEvent) => void;
  onOpenRenameDialog: (session: { id: string; title: string }, e: React.MouseEvent) => void;
  onRequestDeleteSession: (e: React.MouseEvent, session: { id: string; title: string }) => void;
}

export function CopilotHistoryView({
  sessions,
  currentSessionId,
  searchQuery,
  onSearchChange,
  copiedSessionId,
  isExportingSession,
  onSelectSession,
  onNewChat,
  onCopySessionId,
  onDownloadSession,
  onOpenRenameDialog,
  onRequestDeleteSession,
}: CopilotHistoryViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#090A10]">
      {/* Search Bar & Summary Header */}
      <div className="p-3.5 sm:p-4 pb-2.5 border-b border-white/[0.04] bg-[#0C0E18]/50">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari topik, isi pesan, atau halaman..."
            className="w-full bg-[#121624] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 p-1 text-gray-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Counter / Meta Info */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mt-2 px-0.5">
          <span>
            {sessions.length} sesi {searchQuery ? "ditemukan" : "tersimpan"}
          </span>
          {currentSessionId && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              1 sesi aktif
            </span>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 scrollbar-thin">
        {sessions.length === 0 ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-500 mb-3 shadow-inner">
              <History className="h-6 w-6" />
            </div>
            {searchQuery ? (
              <>
                <p className="text-xs font-semibold text-white">Tidak ada sesi ditemukan</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs leading-relaxed">
                  Tidak ada percakapan dengan kata kunci &quot;{searchQuery}&quot;
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSearchChange("")}
                  className="mt-3.5 border-white/[0.1] bg-white/[0.03] text-gray-300 hover:text-white text-xs rounded-xl"
                >
                  Reset Pencarian
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-white">Belum ada riwayat sesi</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs leading-relaxed">
                  Percakapan Anda dengan Gemini Copilot akan otomatis tersimpan di sini.
                </p>
                <Button
                  size="sm"
                  onClick={onNewChat}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl shadow-md shadow-indigo-600/20"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Mulai Chat Sekarang
                </Button>
              </>
            )}
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = currentSessionId === sess.id;
            const pathLabel = formatSessionPath(sess.currentPath);

            return (
              <div
                key={sess.id}
                onClick={() => onSelectSession(sess)}
                className={cn(
                  "group relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5",
                  "active:scale-[0.99] select-none",
                  isActive
                    ? "bg-gradient-to-r from-indigo-950/50 via-[#131728]/90 to-[#101322]/80 border-indigo-500/40 shadow-sm shadow-indigo-500/10"
                    : "bg-[#111422]/65 border-white/[0.07] hover:bg-[#15192b]/85 hover:border-white/[0.16] hover:shadow-xs"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                )}

                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={cn(
                      "h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200",
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-xs"
                        : "bg-white/[0.03] text-gray-400 border-white/[0.07] group-hover:text-indigo-300 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10"
                    )}
                  >
                    {isActive ? (
                      <Sparkles className="h-4 w-4 text-indigo-300 animate-pulse" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                        <h4
                          className={cn(
                            "text-xs sm:text-[13px] leading-snug font-medium line-clamp-1 break-words",
                            isActive
                              ? "text-white font-semibold"
                              : "text-gray-200 group-hover:text-white"
                          )}
                          title={sess.title}
                        >
                          {sess.title}
                        </h4>

                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Aktif
                          </span>
                        )}

                        {pathLabel && (
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-mono text-gray-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded max-w-[120px] truncate shrink-0"
                            title={`Konteks Halaman: ${sess.currentPath}`}
                          >
                            <Compass className="h-2.5 w-2.5 text-indigo-400/80 shrink-0" />
                            <span className="truncate">{pathLabel}</span>
                          </span>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-0.5 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => onDownloadSession(sess, e)}
                          disabled={isExportingSession}
                          className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors cursor-pointer"
                          title="Ekspor & Unduh Markdown (.md)"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            onOpenRenameDialog({ id: sess.id, title: sess.title }, e)
                          }
                          className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-indigo-300 hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors cursor-pointer"
                          title="Ubah judul sesi"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            onRequestDeleteSession(e, { id: sess.id, title: sess.title })
                          }
                          className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Hapus sesi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {sess.lastMessage && (
                      <p className="text-[11px] sm:text-xs text-gray-400 line-clamp-1 mt-1 font-normal leading-relaxed group-hover:text-gray-300 transition-colors">
                        {sess.lastMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.05] text-[10px] sm:text-[10.5px] text-gray-400 font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1 shrink-0 text-gray-400">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span>{formatRelativeTime(sess.updatedAt || sess.createdAt)}</span>
                    </span>

                    {sess.messageCount > 0 && (
                      <span className="hidden xs:inline-flex items-center gap-1 text-gray-400 border-l border-white/[0.08] pl-2 shrink-0">
                        <MessageSquare className="h-2.5 w-2.5 text-gray-400" />
                        <span>{sess.messageCount} pesan</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => onCopySessionId(sess.id, e)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.03] hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-300 border border-white/[0.06] hover:border-indigo-500/30 transition-all cursor-pointer shrink-0"
                    title={`Salin Session ID: ${sess.id}`}
                  >
                    <Terminal className="h-2.5 w-2.5 text-indigo-400" />
                    <span>ref:{sess.id.slice(0, 8)}</span>
                    {copiedSessionId === sess.id ? (
                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-2.5 w-2.5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
