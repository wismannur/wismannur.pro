"use client";

import React from "react";

interface TailoredCvMarkdownTabProps {
  markdownCv: string;
}

export function TailoredCvMarkdownTab({ markdownCv }: TailoredCvMarkdownTabProps) {
  return (
    <div className="p-4 bg-[#08090C] rounded-xl border border-white/[0.08] max-h-[50vh] overflow-y-auto">
      <pre className="text-xs font-mono text-indigo-300 whitespace-pre-wrap leading-relaxed">
        {markdownCv}
      </pre>
    </div>
  );
}
