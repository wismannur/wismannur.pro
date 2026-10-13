"use client";

import React, { useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toCustomAttachmentUrl } from "@/lib/attachment-url";
import { cn } from "@/lib/utils";
import type { EmailAttachment } from "@/services/inquiry-messages/types";

export function formatAttachmentSize(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function getFileIcon(name: string, type?: string) {
  const lowerName = (name || "").toLowerCase();
  const lowerType = (type || "").toLowerCase();

  if (
    lowerType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(lowerName)
  ) {
    return FileImage;
  }
  if (
    lowerType.includes("zip") ||
    lowerType.includes("compressed") ||
    /\.(zip|rar|7z|tar|gz)$/i.test(lowerName)
  ) {
    return FileArchive;
  }
  if (
    lowerType.includes("spreadsheet") ||
    lowerType.includes("csv") ||
    /\.(xlsx?|csv)$/i.test(lowerName)
  ) {
    return FileSpreadsheet;
  }
  return FileText;
}

interface EmailAttachmentListProps {
  attachments?: EmailAttachment[] | null;
  className?: string;
  compact?: boolean;
  label?: string;
}

export function EmailAttachmentList({
  attachments,
  className,
  compact = false,
  label,
}: EmailAttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <Paperclip className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span>
          {label || `Attachments (${attachments.length})`}
        </span>
      </div>

      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {attachments.map((att, idx) => {
          const brandedUrl = toCustomAttachmentUrl(att.url);
          const IconComponent = getFileIcon(att.name, att.type);
          const sizeLabel = formatAttachmentSize(att.size);

          return (
            <a
              key={`${att.url}-${idx}`}
              href={brandedUrl}
              target="_blank"
              rel="noreferrer"
              title={`Open or download ${att.name}`}
              className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-white/[0.08] bg-[#0C0E18]/90 hover:bg-[#181D31] hover:border-indigo-500/40 transition-all text-xs text-slate-200 group shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors shrink-0">
                  <IconComponent className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-slate-200 group-hover:text-white truncate">
                    {att.name}
                  </p>
                  {sizeLabel && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      {sizeLabel}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-300 shrink-0">
                <Download className="h-3.5 w-3.5" />
                <ExternalLink className="h-3 w-3 opacity-75" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

interface EmailAttachmentUploaderProps {
  attachments: EmailAttachment[];
  onChange: React.Dispatch<React.SetStateAction<EmailAttachment[]>>;
  onUploadFile: (formData: FormData) => Promise<EmailAttachment>;
  disabled?: boolean;
  className?: string;
}

export function EmailAttachmentUploader({
  attachments,
  onChange,
  onUploadFile,
  disabled = false,
  className,
}: EmailAttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedList: EmailAttachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds the 20MB maximum size limit.`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const uploaded = await onUploadFile(formData);
        uploadedList.push(uploaded);
      }

      if (uploadedList.length > 0) {
        onChange((prev) => [...prev, ...uploadedList]);
        toast.success(
          uploadedList.length === 1
            ? `Attached "${uploadedList[0].name}"`
            : `Attached ${uploadedList.length} files`
        );
      }
    } catch (err) {
      console.error("Attachment upload error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to upload attachment"
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border-white/[0.1] bg-[#131726] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
              <span>Attach Files</span>
            </>
          )}
        </Button>

        {attachments.length > 0 && (
          <span className="text-[11px] text-indigo-300 font-medium">
            {attachments.length} file{attachments.length > 1 ? "s" : ""} attached
          </span>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {attachments.map((att, idx) => {
            const IconComponent = getFileIcon(att.name, att.type);
            const sizeLabel = formatAttachmentSize(att.size);
            return (
              <div
                key={`${att.url}-${idx}`}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-xs text-slate-200 max-w-full"
              >
                <IconComponent className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <a
                  href={toCustomAttachmentUrl(att.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium truncate max-w-[180px] sm:max-w-[240px] hover:text-indigo-300 hover:underline"
                  title={att.name}
                >
                  {att.name}
                </a>
                {sizeLabel && (
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    ({sizeLabel})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  disabled={disabled}
                  className="p-0.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                  title="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
