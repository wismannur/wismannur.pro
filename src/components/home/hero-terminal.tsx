"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, Code2, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type TabKey = "config" | "terminal" | "stack";

export function HeroTerminal() {
	const [activeTab, setActiveTab] = useState<TabKey>("config");
	const [hasCopied, setHasCopied] = useState(false);

	const codeSnippets: Record<TabKey, string> = {
		config: `export const developer: DeveloperProfile = {
  name: "Wisman Nur",
  role: "Full-Stack Engineer & AI Craftsman",
  status: "🟢 Available for high-impact projects",
  location: "Jakarta, Indonesia (UTC+7)",
  specialties: [
    "Next.js 16 (App Router) & React 19",
    "Autonomous AI Agents & Agentic Workflows",
    "Cloud Architecture, PostgreSQL & Drizzle",
    "High-Performance Web & Mobile Apps",
  ],
  passion: "Crafting delightful, scalable digital experiences"
};`,
		terminal: `$ curl -s https://wismannur.pro/api/health
{
  "status": "ready",
  "timezone": "Asia/Jakarta",
  "latency": "14ms",
  "open_for_hire": true,
  "recent_shipped": ["Agentic AI Kit", "CMS Suite", "Design System"]
}
$ git status
On branch main (100% test passing) 🚀`,
		stack: `{
  "core": ["TypeScript", "React 19", "Next.js", "Node.js"],
  "ai_agents": ["Gemini 3.7", "Claude Sonnet", "MCP", "LangGraph"],
  "database": ["PostgreSQL", "Neon Serverless", "Drizzle ORM", "Redis"],
  "devops": ["Vercel", "Docker", "GCP", "CI/CD Automations"]
}`,
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(codeSnippets[activeTab]);
		setHasCopied(true);
		toast({
			title: "Snippet copied to clipboard!",
		});
		setTimeout(() => setHasCopied(false), 2000);
	};

	return (
		<div className="relative rounded-2xl border border-border/60 bg-[#0d1117] text-[#e6edf3] shadow-2xl overflow-hidden font-mono text-xs md:text-sm">
			{/* Terminal Header */}
			<div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
				<div className="flex items-center space-x-2">
					<div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
					<div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
					<div className="w-3 h-3 rounded-full bg-[#27c93f]" />
					<span className="ml-2 text-xs text-muted dark:text-muted-foreground font-sans hidden sm:inline">
						wismannur.pro ~ zsh
					</span>
				</div>

				{/* Tabs */}
				<div className="flex items-center space-x-1">
					<button
						type="button"
						onClick={() => setActiveTab("config")}
						data-umami-event="hero-terminal-tab-click"
						data-umami-event-tab="config"
						className={cn(
							"px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1.5",
							activeTab === "config"
								? "bg-[#21262d] text-primary-foreground font-semibold border border-primary/40 text-indigo-400"
								: "text-gray-400 hover:text-gray-200"
						)}
					>
						<Code2 size={13} />
						profile.ts
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("terminal")}
						data-umami-event="hero-terminal-tab-click"
						data-umami-event-tab="terminal"
						className={cn(
							"px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1.5",
							activeTab === "terminal"
								? "bg-[#21262d] text-primary-foreground font-semibold border border-primary/40 text-emerald-400"
								: "text-gray-400 hover:text-gray-200"
						)}
					>
						<Terminal size={13} />
						shell
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("stack")}
						data-umami-event="hero-terminal-tab-click"
						data-umami-event-tab="stack"
						className={cn(
							"px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1.5",
							activeTab === "stack"
								? "bg-[#21262d] text-primary-foreground font-semibold border border-primary/40 text-amber-400"
								: "text-gray-400 hover:text-gray-200"
						)}
					>
						<Cpu size={13} />
						stack.json
					</button>
				</div>

				{/* Copy button */}
				<button
					type="button"
					onClick={handleCopy}
					aria-label="Copy snippet"
					data-umami-event="hero-terminal-copy-click"
					data-umami-event-tab={activeTab}
					className="p-1.5 rounded-md hover:bg-[#21262d] text-gray-400 hover:text-gray-200 transition-colors"
				>
					{hasCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
				</button>
			</div>

			{/* Code Content Body */}
			<div className="p-4 md:p-5 overflow-x-auto min-h-[220px] leading-relaxed">
				{activeTab === "config" && (
					<pre className="text-gray-300 font-mono">
						<code>
							<span className="text-purple-400">export const</span>{" "}
							<span className="text-blue-300">developer</span>:{" "}
							<span className="text-yellow-300">DeveloperProfile</span> = &#123;
							{"\n"}  <span className="text-blue-300">name</span>:{" "}
							<span className="text-green-300">&quot;Wisman Nur&quot;</span>,
							{"\n"}  <span className="text-blue-300">role</span>:{" "}
							<span className="text-green-300">&quot;Full-Stack Engineer & AI Craftsman&quot;</span>,
							{"\n"}  <span className="text-blue-300">status</span>:{" "}
							<span className="text-emerald-400 font-semibold">&quot;🟢 Available for high-impact projects&quot;</span>,
							{"\n"}  <span className="text-blue-300">location</span>:{" "}
							<span className="text-green-300">&quot;Jakarta, Indonesia (UTC+7)&quot;</span>,
							{"\n"}  <span className="text-blue-300">specialties</span>: [
							{"\n"}    <span className="text-green-300">&quot;Next.js 16 (App Router) & React 19&quot;</span>,
							{"\n"}    <span className="text-green-300">&quot;Autonomous AI Agents & Agentic Workflows&quot;</span>,
							{"\n"}    <span className="text-green-300">&quot;Cloud Architecture, PostgreSQL & Drizzle&quot;</span>,
							{"\n"}    <span className="text-green-300">&quot;High-Performance Web & Mobile Apps&quot;</span>,
							{"\n"}  ],
							{"\n"}  <span className="text-blue-300">passion</span>:{" "}
							<span className="text-green-300">&quot;Crafting delightful, scalable digital experiences&quot;</span>
							{"\n"}&#125;;
						</code>
					</pre>
				)}

				{activeTab === "terminal" && (
					<pre className="text-emerald-400 font-mono">
						<code>
							<span className="text-gray-400">$</span> curl -s https://wismannur.pro/api/health
							{"\n"}&#123;
							{"\n"}  <span className="text-blue-300">&quot;status&quot;</span>: <span className="text-green-300">&quot;ready&quot;</span>,
							{"\n"}  <span className="text-blue-300">&quot;timezone&quot;</span>: <span className="text-green-300">&quot;Asia/Jakarta&quot;</span>,
							{"\n"}  <span className="text-blue-300">&quot;latency&quot;</span>: <span className="text-yellow-300">&quot;14ms&quot;</span>,
							{"\n"}  <span className="text-blue-300">&quot;open_for_hire&quot;</span>: <span className="text-purple-400">true</span>,
							{"\n"}  <span className="text-blue-300">&quot;recent_shipped&quot;</span>: [
							{"\n"}    <span className="text-green-300">&quot;Agentic AI Kit&quot;</span>,
							{"\n"}    <span className="text-green-300">&quot;CMS Suite&quot;</span>,
							{"\n"}    <span className="text-green-300">&quot;Design System&quot;</span>
							{"\n"}  ]
							{"\n"}&#125;
							{"\n"}<span className="text-gray-400">$</span> git status
							{"\n"}On branch main (100% clean & typed) 🚀
						</code>
					</pre>
				)}

				{activeTab === "stack" && (
					<pre className="text-amber-300 font-mono">
						<code>
							&#123;
							{"\n"}  <span className="text-blue-300">&quot;frontend&quot;</span>: [<span className="text-green-300">&quot;Next.js 16&quot;</span>, <span className="text-green-300">&quot;React 19&quot;</span>, <span className="text-green-300">&quot;TypeScript&quot;</span>, <span className="text-green-300">&quot;Tailwind CSS&quot;</span>],
							{"\n"}  <span className="text-blue-300">&quot;ai_agentic&quot;</span>: [<span className="text-green-300">&quot;Gemini API&quot;</span>, <span className="text-green-300">&quot;Claude&quot;</span>, <span className="text-green-300">&quot;MCP Tooling&quot;</span>, <span className="text-green-300">&quot;LangGraph&quot;</span>],
							{"\n"}  <span className="text-blue-300">&quot;backend_db&quot;</span>: [<span className="text-green-300">&quot;Node.js&quot;</span>, <span className="text-green-300">&quot;PostgreSQL&quot;</span>, <span className="text-green-300">&quot;Neon&quot;</span>, <span className="text-green-300">&quot;Drizzle ORM&quot;</span>],
							{"\n"}  <span className="text-blue-300">&quot;cloud_infra&quot;</span>: [<span className="text-green-300">&quot;Vercel&quot;</span>, <span className="text-green-300">&quot;Docker&quot;</span>, <span className="text-green-300">&quot;GCP&quot;</span>, <span className="text-green-300">&quot;GitHub Actions&quot;</span>]
							{"\n"}&#125;
						</code>
					</pre>
				)}
			</div>
		</div>
	);
}
