"use client";

import React from "react";
import { Bookmark, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const BOOKMARKLET_CODE = `javascript:(function(){const t=document.title||'',u=window.location.href,s=window.getSelection().toString().trim(),c=s||document.body.innerText.slice(0,15000);const p=JSON.stringify({url:u,title:t,content:c});navigator.clipboard.writeText(p).then(()=>{alert('✅ Job extracted to clipboard!\\n\\nOpen Career Hub and paste into Smart AI Importer.')}).catch(()=>{prompt('Copy this job data for Career Hub:',p)})})();`;

export function TabBookmarklet() {
  return (
    <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="p-6 border-b border-white/[0.06] bg-[#131726]/40">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-purple-400" />
          <span>1-Click Browser Web Clipper Bookmarklet</span>
        </CardTitle>
        <CardDescription className="text-xs text-gray-400">
          Clip vacancies with full requirements directly from LinkedIn, Jobstreet, Greenhouse, or Ashby into your Career Hub in seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="p-4 rounded-xl border border-white/[0.06] bg-[#131726]/50 space-y-2 text-xs">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-purple-400" />
            <span>How to install:</span>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Drag the button below directly into your browser’s Bookmarks Bar. When browsing any job vacancy on
            LinkedIn, Jobstreet, Glints, Greenhouse, Ashby, or Lever, click the bookmark to copy the
            vacancy text and URL to your clipboard in 1 click!
          </p>
        </div>

        <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#131726] flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="text-xs text-gray-400 font-semibold">
            👇 Drag this button to your Bookmarks Bar (Ctrl/Cmd + Shift + B)
          </div>

          <a
            href={BOOKMARKLET_CODE}
            onClick={(e) => {
              e.preventDefault();
              toast.info("Drag this button up to your browser's Bookmarks Bar to install!");
            }}
            className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-grab select-none active:scale-95 transition-all"
            title="Drag me to your Bookmarks Bar"
          >
            <Bookmark className="w-4 h-4" />
            <span>📌 Import to Career Hub</span>
          </a>

          <div className="pt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(BOOKMARKLET_CODE);
                toast.success("Bookmarklet JavaScript code copied to clipboard!");
              }}
              className="gap-1.5 text-xs h-9 rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Bookmarklet JavaScript Code</span>
            </Button>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#090A10] space-y-3 text-xs">
          <div className="font-bold text-white text-sm">💡 Full Workflow Steps:</div>
          <ol className="list-decimal list-inside space-y-2 text-gray-400">
            <li>
              Open any job posting on{" "}
              <strong className="text-gray-200">LinkedIn, Jobstreet, Glints, Indeed, Ashby, or Greenhouse</strong>.
            </li>
            <li>
              Click the <strong className="text-purple-300">📌 Import to Career Hub</strong> bookmark in your browser bar.
            </li>
            <li>
              The bookmark will capture the page URL, title, and selected/full job description directly to your clipboard.
            </li>
            <li>
              Come back to this page, switch to the <strong className="text-primary">Smart AI Importer</strong> tab, paste into the text area, and click{" "}
              <strong className="text-primary">Extract & Autofill</strong>.
            </li>
            <li>
              Review the extracted role, benchmark salary, and requirements, then click <strong className="text-white">Save Opportunity</strong>!
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
