"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Code,
  Copy,
  ExternalLink,
  Laptop,
  Maximize2,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EmailHtmlViewerProps {
  html: string;
  subject?: string;
  senderName?: string;
  senderEmail?: string;
  className?: string;
  defaultViewMode?: "desktop" | "mobile";
  initialHeight?: number;
}

export function EmailHtmlViewer({
  html,
  subject,
  senderName,
  senderEmail,
  className,
  defaultViewMode = "desktop",
  initialHeight = 560,
}: EmailHtmlViewerProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">(defaultViewMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number>(initialHeight);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);

  // Prepare safe sandboxed HTML with <base target="_blank"> so all links open in new tab
  const sanitizedSrcDoc = useMemo(() => {
    if (!html) return "";

    let processed = html;

    // Inject base target="_blank" so clicked links open in new tabs
    if (processed.includes("<head>")) {
      processed = processed.replace(
        "<head>",
        '<head><base target="_blank" rel="noopener noreferrer" />'
      );
    } else if (processed.includes("<html")) {
      processed = processed.replace(
        /<html[^>]*>/,
        '$&<head><base target="_blank" rel="noopener noreferrer" /></head>'
      );
    } else {
      processed = `<base target="_blank" rel="noopener noreferrer" />` + processed;
    }

    // Strip inline script tags as defense-in-depth
    processed = processed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    return processed;
  }, [html]);

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success("Raw email HTML copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy HTML");
    }
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([sanitizedSrcDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // Adjust height automatically based on iframe content load if accessible
  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const iframe = e.currentTarget;
      if (iframe.contentWindow?.document?.body) {
        const scrollHeight = iframe.contentWindow.document.body.scrollHeight;
        if (scrollHeight > 100) {
          setIframeHeight(Math.max(scrollHeight + 40, initialHeight));
        }
      }
    } catch {
      // Cross-origin sandboxing might prevent direct document access in some browsers; default height will be used
    }
  };

  return (
    <div className={cn("flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-[#0c101c]", className)}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[#121626] border-b border-white/[0.06] text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sandboxed Email Frame</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Viewport switch: Desktop / Mobile */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/[0.06] mr-1">
            <button
              type="button"
              onClick={() => setViewMode("desktop")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors",
                viewMode === "desktop"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
              title="Desktop View (Full Width)"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors",
                viewMode === "mobile"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
              title="Mobile View (380px phone preview)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mobile</span>
            </button>
          </div>

          {/* Quick Actions */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopyRaw}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-md"
            title="Copy Raw HTML"
          >
            {copied ? <Code className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleOpenInNewTab}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-md"
            title="Open in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(true)}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-md"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Frame Container */}
      <div
        className={cn(
          "w-full overflow-x-auto bg-[#080a12] p-2 sm:p-4 flex justify-center transition-all",
          viewMode === "mobile" && "py-6"
        )}
      >
        <div
          className={cn(
            "transition-all duration-300 w-full",
            viewMode === "mobile"
              ? "max-w-[400px] border-4 border-slate-700/60 rounded-3xl shadow-2xl p-1 bg-slate-900"
              : "w-full max-w-full"
          )}
        >
          {viewMode === "mobile" && (
            <div className="flex justify-center items-center py-1.5 mb-1">
              <div className="w-16 h-1 bg-slate-700 rounded-full" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            srcDoc={sanitizedSrcDoc}
            onLoad={handleIframeLoad}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            title={subject || "Email Content"}
            className={cn(
              "w-full bg-white border-0 transition-all",
              viewMode === "mobile" ? "rounded-2xl min-h-[580px]" : "rounded-lg min-h-[520px]"
            )}
            style={{
              height: viewMode === "mobile" ? "620px" : `${Math.min(iframeHeight, 800)}px`,
            }}
          />
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 bg-[#0c101c] border-white/[0.1] text-white">
          <DialogHeader className="p-4 border-b border-white/[0.08] flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>{subject || "Email Preview"}</span>
                <span className="text-xs font-normal text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded">
                  Original HTML
                </span>
              </DialogTitle>
              {(senderName || senderEmail) && (
                <p className="text-xs text-slate-400">
                  From: <strong className="text-slate-200">{senderName}</strong> ({senderEmail})
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 pr-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="h-8 text-xs gap-1.5 rounded-lg border-white/[0.1] bg-white/[0.04] text-slate-200 hover:text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 p-4 bg-[#080a12] overflow-hidden flex justify-center">
            <iframe
              ref={fullscreenIframeRef}
              srcDoc={sanitizedSrcDoc}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              title={subject || "Email Content Fullscreen"}
              className="w-full h-full bg-white rounded-xl border-0 shadow-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
