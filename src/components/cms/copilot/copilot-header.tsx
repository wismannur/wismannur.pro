"use client";

import React from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  Download,
  History,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge as UiBadge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CmsCopilotSessionRow } from "@/db/schema";

interface CopilotHeaderProps {
  viewMode: "chat" | "history";
  onBackToChat: () => void;
  sessions: CmsCopilotSessionRow[];
  pathname: string;
  currentSessionId: string;
  copiedSessionId: string | null;
  onCopySessionId: (id: string, e: React.MouseEvent) => void;
  onOpenHistory: () => void;
  onRefreshCurrentSession: () => void;
  isRefreshingSession: boolean;
  isLoading: boolean;
  onDownloadActiveSession: () => void;
  isExportingSession: boolean;
  hasValidMessages: boolean;
  onOpenRenameDialog: (sess: { id: string; title: string }) => void;
  onOpenDeleteDialog: (sess: { id: string; title: string }) => void;
  onNewChat: () => void;
  onClose: () => void;
}

export function CopilotHeader({
  viewMode,
  onBackToChat,
  sessions,
  pathname,
  currentSessionId,
  copiedSessionId,
  onCopySessionId,
  onOpenHistory,
  onRefreshCurrentSession,
  isRefreshingSession,
  isLoading,
  onDownloadActiveSession,
  isExportingSession,
  hasValidMessages,
  onOpenRenameDialog,
  onOpenDeleteDialog,
  onNewChat,
  onClose,
}: CopilotHeaderProps) {
  return (
    <div className="p-3 sm:p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0C0E18]/85 backdrop-blur-md gap-2">
      {viewMode === "history" ? (
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackToChat}
            className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] shrink-0"
            title="Kembali ke percakapan"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5 sm:gap-2 truncate">
              <span>Riwayat Percakapan</span>
              <UiBadge
                variant="outline"
                className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] sm:text-[10px] px-1.5 py-0 font-mono font-normal shrink-0"
              >
                {sessions.length} sesi
              </UiBadge>
            </h3>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-mono mt-0.5 truncate">
              Pilih atau cari percakapan sebelumnya
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                <span className="sm:hidden">Staff Copilot</span>
                <span className="hidden sm:inline">CMS Staff Copilot</span>
              </h3>
              <UiBadge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] sm:text-[10px] px-1.5 py-0 font-mono font-normal shrink-0"
              >
                <span className="sm:hidden">3.8 Flash</span>
                <span className="hidden sm:inline">Gemini 3.8 Flash</span>
              </UiBadge>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-gray-400 font-mono mt-0.5 min-w-0">
              <div className="flex items-center gap-1 min-w-0 truncate">
                <span className="text-indigo-400 shrink-0">Context:</span>
                <span className="truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] text-gray-300">
                  {pathname}
                </span>
              </div>
              {currentSessionId && (
                <>
                  <span className="hidden sm:inline-flex text-white/20 shrink-0">•</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => onCopySessionId(currentSessionId, e)}
                          className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-indigo-500/20 text-gray-300 hover:text-indigo-300 border border-white/[0.08] hover:border-indigo-500/30 transition-all text-[9.5px] sm:text-[10px] font-mono cursor-pointer shrink-0"
                        >
                          <Terminal className="h-2.5 w-2.5 text-indigo-400" />
                          <span>ref:{currentSessionId.slice(0, 6)}</span>
                          {copiedSessionId === currentSessionId ? (
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-2.5 w-2.5 text-gray-400" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-[#0C0E18] text-white border-white/[0.1] text-xs font-mono"
                      >
                        Klik untuk salin Session ID ({currentSessionId})
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {viewMode === "chat" ? (
          <>
            {/* Desktop Direct Action Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenHistory}
                      className="h-8 px-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] text-xs font-mono gap-1.5"
                      title="Riwayat Percakapan"
                    >
                      <History className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Riwayat</span>
                      {sessions.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-white/[0.08] text-[10px] text-gray-300">
                          {sessions.length}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                    Buka Riwayat Percakapan
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {currentSessionId && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRefreshCurrentSession}
                        disabled={isRefreshingSession || isLoading}
                        className="h-8 w-8 rounded-lg text-gray-400 hover:text-indigo-300 hover:bg-white/[0.06]"
                        title="Sinkronkan pesan dari database"
                      >
                        <RefreshCw
                          className={cn(
                            "h-3.5 w-3.5",
                            isRefreshingSession && "animate-spin text-indigo-400"
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                      Sinkronkan Pesan dari Database
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {(currentSessionId || hasValidMessages) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDownloadActiveSession}
                        disabled={isExportingSession}
                        className="h-8 w-8 rounded-lg text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                        title="Ekspor & Unduh Markdown (.md)"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                      Ekspor & Unduh Markdown (.md)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {currentSessionId && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const active = sessions.find((s) => s.id === currentSessionId);
                            onOpenRenameDialog({
                              id: currentSessionId,
                              title: active?.title || "Sesi saat ini",
                            });
                          }}
                          className="h-8 w-8 rounded-lg text-gray-400 hover:text-indigo-300 hover:bg-white/[0.06]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                        Ubah Judul Sesi
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const active = sessions.find((s) => s.id === currentSessionId);
                            onOpenDeleteDialog({
                              id: currentSessionId,
                              title: active?.title || "Sesi saat ini",
                            });
                          }}
                          className="h-8 w-8 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                        Hapus Sesi Ini
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onNewChat}
                      className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                      title="Chat Baru"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#0C0E18] text-white border-white/[0.1] text-xs">
                    Chat Baru
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] relative"
                    title="Menu Sesi Copilot"
                  >
                    <MoreVertical className="h-4 w-4" />
                    {sessions.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-[#0C0E18]" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#0C0E18] border-white/[0.1] text-white text-xs w-52 shadow-2xl p-1.5 z-[60]"
                >
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-500">
                    Menu Copilot
                  </div>

                  <DropdownMenuItem
                    onClick={onNewChat}
                    className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08]"
                  >
                    <Plus className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-white">Chat Baru</span>
                      <span className="text-[10px] text-gray-400">Mulai sesi percakapan baru</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={onOpenHistory}
                    className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 w-full">
                      <History className="h-4 w-4 text-indigo-400 shrink-0" />
                      <div className="flex flex-col min-w-0 w-full">
                        <span className="font-medium text-white">Riwayat Percakapan</span>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] text-gray-400">Buka arsip percakapan</span>
                          {sessions.length > 0 && (
                            <UiBadge
                              variant="outline"
                              className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] px-1.5 py-0 font-mono shrink-0 ml-1"
                            >
                              {sessions.length}
                            </UiBadge>
                          )}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>

                  {currentSessionId && (
                    <>
                      <DropdownMenuSeparator className="bg-white/[0.08] my-1" />
                      <DropdownMenuItem
                        onClick={onRefreshCurrentSession}
                        disabled={isRefreshingSession || isLoading}
                        className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08]"
                      >
                        <RefreshCw
                          className={cn(
                            "h-4 w-4 text-indigo-400 shrink-0",
                            isRefreshingSession && "animate-spin"
                          )}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-white">Sinkronkan Pesan</span>
                          <span className="text-[10px] text-gray-400">Muat ulang pesan dari database</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const active = sessions.find((s) => s.id === currentSessionId);
                          onOpenRenameDialog({
                            id: currentSessionId,
                            title: active?.title || "Sesi saat ini",
                          });
                        }}
                        className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08]"
                      >
                        <Pencil className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span>Ubah Judul Sesi</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => onCopySessionId(currentSessionId, e)}
                        className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08]"
                      >
                        <Terminal className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span>Salin ID Sesi</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={onDownloadActiveSession}
                        disabled={isExportingSession || !hasValidMessages}
                        className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.08] focus:bg-white/[0.08]"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-white">Ekspor Markdown</span>
                          <span className="text-[10px] text-gray-400">Unduh berkas .md sesi ini</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.08] my-1" />
                      <DropdownMenuItem
                        onClick={() => {
                          const active = sessions.find((s) => s.id === currentSessionId);
                          onOpenDeleteDialog({
                            id: currentSessionId,
                            title: active?.title || "Sesi saat ini",
                          });
                        }}
                        className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 hover:text-rose-300 focus:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Hapus Sesi Ini</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onNewChat}
            className="h-8 px-2 sm:px-2.5 rounded-lg border-indigo-500/30 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 hover:text-white text-xs gap-1 sm:gap-1.5"
            title="Chat Baru"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Chat Baru</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] shrink-0"
          title="Tutup Copilot"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
