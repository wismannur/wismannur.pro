"use client";

import React from "react";
import { Loader2, Trash2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CopilotSessionDialogsProps {
  sessionToDelete: { id: string; title: string } | null;
  isDeletingSession: boolean;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;

  sessionToRename: { id: string; title: string } | null;
  renameTitleInput: string;
  isRenamingSession: boolean;
  onRenameTitleChange: (value: string) => void;
  onCancelRename: () => void;
  onConfirmRename: (e: React.FormEvent) => void;
}

export function CopilotSessionDialogs({
  sessionToDelete,
  isDeletingSession,
  onCancelDelete,
  onConfirmDelete,
  sessionToRename,
  renameTitleInput,
  isRenamingSession,
  onRenameTitleChange,
  onCancelRename,
  onConfirmRename,
}: CopilotSessionDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingSession) {
            onCancelDelete();
          }
        }}
      >
        <AlertDialogContent className="z-[70] bg-[#0C0E18] border border-white/[0.1] text-white max-w-md shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2 text-base">
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
                <Trash2 className="h-4 w-4" />
              </div>
              <span>Hapus Riwayat Sesi?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs leading-relaxed pt-1">
              Apakah kamu yakin ingin menghapus sesi chat{" "}
              <span className="font-semibold text-white">&quot;{sessionToDelete?.title}&quot;</span>?
              Tindakan ini tidak dapat dibatalkan dan semua pesan percakapan dalam sesi ini akan dihapus secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isDeletingSession}
              onClick={onCancelDelete}
              className="border-white/[0.08] bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white text-xs"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingSession}
              onClick={(e) => {
                e.preventDefault();
                onConfirmDelete();
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs gap-1.5"
            >
              {isDeletingSession ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Ya, Hapus Sesi
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Session Dialog */}
      <Dialog
        open={Boolean(sessionToRename)}
        onOpenChange={(open) => {
          if (!open && !isRenamingSession) {
            onCancelRename();
          }
        }}
      >
        <DialogContent className="z-[70] bg-[#0C0E18] border border-white/[0.1] text-white max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-base">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Pencil className="h-4 w-4" />
              </div>
              <span>Ubah Judul Sesi</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs leading-relaxed pt-1">
              Beri nama yang jelas untuk memudahkan Anda menemukan percakapan ini kembali di riwayat Copilot.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onConfirmRename} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">
                Judul Percakapan
              </label>
              <input
                type="text"
                autoFocus
                value={renameTitleInput}
                onChange={(e) => onRenameTitleChange(e.target.value)}
                placeholder="Masukkan judul sesi percakapan..."
                maxLength={100}
                disabled={isRenamingSession}
                className="w-full bg-[#121624] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Maksimal 100 karakter</span>
                <span>{renameTitleInput.length}/100</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isRenamingSession}
                onClick={onCancelRename}
                className="border border-white/[0.08] bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white text-xs h-9 px-3"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isRenamingSession || !renameTitleInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs h-9 px-3.5 gap-1.5 disabled:opacity-40"
              >
                {isRenamingSession ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Simpan Judul
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
