"use client";

import React from "react";
import {
  Sparkles,
  Link2,
  GripHorizontal,
  Minimize2,
  Maximize2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTextareaResize } from "@/hooks/use-textarea-resize";

interface TabAiImportProps {
  jobUrl: string;
  setJobUrl: (v: string) => void;
  rawContent: string;
  setRawContent: (v: string) => void;
  isExtracting: boolean;
  onExtract: () => void;
  onSkipToManual: () => void;
}

export function TabAiImport({
  jobUrl,
  setJobUrl,
  rawContent,
  setRawContent,
  isExtracting,
  onExtract,
  onSkipToManual,
}: TabAiImportProps) {
  const {
    height: rawContentHeight,
    setHeight: setRawContentHeight,
    handleMouseDownResize,
    handleTouchStartResize,
  } = useTextareaResize({ initialHeight: 220, minHeight: 120 });

  return (
    <Card className="bg-[#0C0E18] border-white/[0.08] text-white shadow-xl rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-white">
              Gemini AI Quick Extractor
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Paste the job vacancy content or target URL. Gemini AI will auto-extract company details, tech stack, salary range, and workplace settings.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2 text-gray-300 leading-relaxed">
          <div className="font-bold flex items-center gap-1.5 text-primary text-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>How it works:</span>
          </div>
          <p>
            Copy & paste any job post from LinkedIn, Jobstreet, Glints, Tech in Asia, Ashby, Greenhouse, or corporate career sites. You can also paste the URL directly. Once extracted, all fields in the Form tab will be automatically populated for your review.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobUrl" className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
            <Link2 className="w-3.5 h-3.5 text-primary" />
            <span>Job Posting URL (Optional)</span>
          </Label>
          <Input
            id="jobUrl"
            placeholder="https://www.linkedin.com/jobs/view/... or https://boards.greenhouse.io/..."
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            className="bg-[#131726] border-white/[0.08] text-xs h-11 rounded-xl text-white placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="rawContent" className="text-xs font-semibold text-gray-300">
              Job Description Text / Vacancy Content
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 hidden sm:flex items-center gap-1 font-mono">
                <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setRawContentHeight((prev) => (prev > 260 ? 220 : 450));
                }}
                className="h-6 w-6 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06]"
                title={rawContentHeight > 260 ? "Collapse height" : "Expand height"}
              >
                {rawContentHeight > 260 ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-inner">
            <Textarea
              id="rawContent"
              style={{ height: `${rawContentHeight}px` }}
              placeholder="Paste the full job description text, requirements, responsibilities, and company details here (or paste bookmarklet output)..."
              value={rawContent}
              onChange={(e) => {
                const text = e.target.value;
                setRawContent(text);
                if (
                  text.trim().startsWith("{") &&
                  text.includes('"url"') &&
                  text.includes('"content"')
                ) {
                  try {
                    const parsed = JSON.parse(text);
                    if (parsed.url && !jobUrl) setJobUrl(parsed.url);
                    if (parsed.content) {
                      setRawContent(parsed.content);
                      toast.success("Bookmarklet JSON detected! Autofilled URL and content.");
                    }
                  } catch {
                    // Keep original text if parse fails
                  }
                }
              }}
              className="w-full text-xs font-mono resize-none rounded-none border-0 bg-transparent text-gray-200 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto custom-scrollbar"
            />
            {/* Bottom Drag Handle Bar to Resize Inside Field */}
            <div
              onMouseDown={handleMouseDownResize}
              onTouchStart={handleTouchStartResize}
              className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
              title="Drag handle to resize job description"
            >
              <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-16 transition-all duration-200" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSkipToManual}
            className="w-full sm:w-auto text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
          >
            Skip AI & Fill Form Manually
          </Button>

          <Button
            type="button"
            onClick={onExtract}
            disabled={isExtracting || (!rawContent.trim() && !jobUrl.trim())}
            className="w-full sm:w-auto gap-2 text-xs rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 h-10 px-5"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Extract & Autofill</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
