"use client";

import React, { createContext, useContext, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopilotMarkdownProps {
  content: string;
  className?: string;
}

// Context to detect whether <code> is inside a <pre> block
const PreContext = createContext<boolean>(false);

// Subcomponent for Code Block with header & copy functionality
function CopilotPreBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);

  // Extract language and code string from children
  const codeElement = React.isValidElement(children) ? children : null;
  const className = (codeElement?.props as { className?: string })?.className || "";
  const match = /language-(\w+)/.exec(className);
  const language = match ? match[1] : "";

  // Extract raw code string
  const getRawCode = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(getRawCode).join("");
    if (
      React.isValidElement(node) &&
      typeof node.props === "object" &&
      node.props !== null &&
      "children" in node.props
    ) {
      return getRawCode((node.props as { children?: React.ReactNode }).children);
    }
    return "";
  };

  const codeString = getRawCode(children).replace(/\n$/, "");

  const handleCopy = () => {
    if (!codeString) return;
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-white/[0.1] bg-[#070913] shadow-md group">
      {/* Codeblock Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0e1220] border-b border-white/[0.06] text-[11px] font-mono text-gray-400">
        <div className="flex items-center gap-1.5">
          <Terminal size={12} className="text-indigo-400" />
          <span className="font-medium text-gray-300 lowercase">
            {language || "code"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Salin kode"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400">Tersalin</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre
        className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed text-indigo-100 scrollbar-thin"
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}

function CopilotCode({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  const isInsidePre = useContext(PreContext);

  if (isInsidePre) {
    return (
      <code className={cn("font-mono text-xs", className)} {...props}>
        {children}
      </code>
    );
  }

  return (
    <code
      className="px-1.5 py-0.5 rounded bg-white/[0.08] text-indigo-300 font-mono text-[11.5px] border border-white/[0.06]"
      {...props}
    >
      {children}
    </code>
  );
}

function CopilotPre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <PreContext.Provider value={true}>
      <CopilotPreBlock {...props}>{children}</CopilotPreBlock>
    </PreContext.Provider>
  );
}

const markdownComponents: Components = {
  // Headings
  h1: ({ children, ...props }) => (
    <h1
      className="text-base font-bold text-white mt-3.5 mb-2 pb-1.5 border-b border-white/[0.08] tracking-tight"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-sm font-bold text-white mt-3 mb-1.5 tracking-tight flex items-center gap-1.5"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-xs font-bold text-white mt-2.5 mb-1 tracking-wide"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-xs font-semibold text-indigo-200 mt-2 mb-1"
      {...props}
    >
      {children}
    </h4>
  ),

  // Paragraph
  p: ({ children, ...props }) => (
    <p
      className="mb-2 last:mb-0 leading-relaxed text-[13px] text-gray-200"
      {...props}
    >
      {children}
    </p>
  ),

  // Lists
  ul: ({ children, ...props }) => (
    <ul
      className="list-disc list-outside pl-4 space-y-1 my-2 text-[13px] marker:text-indigo-400"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="list-decimal list-outside pl-4 space-y-1 my-2 text-[13px] marker:text-indigo-400"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-gray-200 pl-0.5 leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Strong & Emphasis
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-white" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-gray-300" {...props}>
      {children}
    </em>
  ),

  // Blockquote
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-2 border-indigo-500/70 pl-3 py-1.5 my-2.5 italic text-gray-300 text-xs bg-indigo-500/[0.04] rounded-r-md border-y border-r border-indigo-500/10"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Links
  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith("http") || href?.startsWith("//");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors font-medium inline-flex items-center gap-0.5"
        {...props}
      >
        <span>{children}</span>
        {isExternal && <ExternalLink size={10} className="opacity-70 ml-0.5" />}
      </a>
    );
  },

  // Horizontal Divider
  hr: ({ ...props }) => (
    <hr className="my-3 border-t border-white/[0.08]" {...props} />
  ),

  // Tables (GFM Table Support)
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-white/[0.1] bg-[#0c0e18]/90 shadow-md">
      <table
        className="min-w-full text-left text-xs border-collapse divide-y divide-white/[0.08]"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-white/[0.05]" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-white/[0.05]" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-white/[0.02] transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="py-2.5 px-3 text-left text-[11px] font-semibold text-gray-200 tracking-wider uppercase border-b border-white/[0.08] whitespace-nowrap"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="py-2.5 px-3 text-xs text-gray-300 align-top" {...props}>
      {children}
    </td>
  ),

  // Pre wrapper: provides PreContext to children
  pre: CopilotPre,

  // Code: handles inline code vs block code
  code: CopilotCode,
};

export const CopilotMarkdown = React.memo(function CopilotMarkdown({
  content,
  className,
}: CopilotMarkdownProps) {
  if (!content) return null;

  return (
    <div className={cn("copilot-markdown leading-relaxed text-[13px] text-gray-200", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
