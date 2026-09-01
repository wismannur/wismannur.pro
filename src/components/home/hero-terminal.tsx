"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type TabKey = "overview" | "agentic";

export function HeroTerminal() {
	const [activeTab, setActiveTab] = useState<TabKey>("overview");
	const [hasCopied, setHasCopied] = useState(false);

	const codeSnippets: Record<TabKey, string> = {
		overview: `export const engineer: EngineerProfile = {
  name: "Wisman Nur",
  title: "Senior Full-Stack & AI Systems Engineer",
  focus: "Production Web Apps & Autonomous Agent Workflows",
  location: "Jakarta, Indonesia (UTC+7)",
  coreCapabilities: [
    "Next.js 16 (App Router) & React 19 Architectures",
    "Autonomous AI Agents, Tool Calling & MCP Protocols",
    "PostgreSQL, Neon Serverless & Type-Safe Drizzle ORM",
    "High-Concurrency Edge & Cloud Infrastructure (GCP/Vercel)",
  ],
  status: "🟢 Open for high-impact contracts & full-time roles"
};`,
		agentic: `// Agentic Workflow Execution Pipeline
async function orchestrateTask(prompt: string) {
  const agent = new AgentRuntime({
    model: "gemini-2.5-pro",
    tools: [mcpPostgresQuery, mcpGithubDeploy, mcpNotifier]
  });

  const plan = await agent.createPlan(prompt);
  const result = await agent.executeStepByStep(plan, {
    maxIterations: 5,
    approvalPolicy: "auto-for-safe-read"
  });

  return { status: "success", executionTimeMs: 420, artifacts: result };
}`,
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(codeSnippets[activeTab]);
		setHasCopied(true);
		toast({
			title: "Code snippet copied to clipboard",
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
						wismannur.pro ~ engineer-spec
					</span>
				</div>

				{/* Tabs */}
				<div className="flex items-center space-x-1">
					<button
						type="button"
						onClick={() => setActiveTab("overview")}
						data-umami-event="hero-terminal-tab-click"
						data-umami-event-tab="overview"
						className={cn(
							"px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1.5",
							activeTab === "overview"
								? "bg-[#21262d] text-indigo-400 font-semibold border border-indigo-500/40"
								: "text-gray-400 hover:text-gray-200"
						)}
					>
						<Code2 size={13} />
						profile.ts
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("agentic")}
						data-umami-event="hero-terminal-tab-click"
						data-umami-event-tab="agentic"
						className={cn(
							"px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1.5",
							activeTab === "agentic"
								? "bg-[#21262d] text-emerald-400 font-semibold border border-emerald-500/40"
								: "text-gray-400 hover:text-gray-200"
						)}
					>
						<Terminal size={13} />
						agent-flow.ts
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
				{activeTab === "overview" && (
					<pre className="text-gray-300 font-mono">
						<code>
							<span className="text-purple-400">export const</span>{" "}
							<span className="text-blue-300">engineer</span>:{" "}
							<span className="text-yellow-300">EngineerProfile</span> = &#123;
							{"\n"}  <span className="text-blue-300">name</span>:{" "}
							<span className="text-green-300">&quot;Wisman Nur&quot;</span>,
							{"\n"}  <span className="text-blue-300">title</span>:{" "}
							<span className="text-green-300">&quot;Senior Full-Stack & AI Systems Engineer&quot;</span>,
							{"\n"}  <span className="text-blue-300">focus</span>:{" "}
							<span className="text-green-300">&quot;Production Web Apps & Autonomous Agent Workflows&quot;</span>,
							{"\n"}  <span className="text-blue-300">location</span>:{" "}
							<span className="text-green-300">&quot;Jakarta, Indonesia (UTC+7)&quot;</span>,
							{"\n"}  <span className="text-blue-300">coreCapabilities</span>: [
							{"\n"}    <span className="text-green-300">&quot;Next.js 16 (App Router) & React 19 Architectures&quot;</span>,
							{"\n"}    <span className="text-green-300">&quot;Autonomous AI Agents, Tool Calling & MCP Protocols&quot;</span>,
							{"\n"}    <span className="text-green-300">&quot;PostgreSQL, Neon Serverless & Type-Safe Drizzle ORM&quot;</span>,
							{"\n"}    <span className="text-green-300">&quot;High-Concurrency Edge & Cloud Infrastructure (GCP/Vercel)&quot;</span>,
							{"\n"}  ],
							{"\n"}  <span className="text-blue-300">status</span>:{" "}
							<span className="text-emerald-400 font-semibold">&quot;🟢 Open for high-impact contracts & full-time roles&quot;</span>
							{"\n"}&#125;;
						</code>
					</pre>
				)}

				{activeTab === "agentic" && (
					<pre className="text-emerald-400 font-mono">
						<code>
							<span className="text-gray-400">// Autonomous Agent Execution Pipeline</span>
							{"\n"}<span className="text-purple-400">async function</span> <span className="text-yellow-300">orchestrateTask</span>(prompt: <span className="text-blue-300">string</span>) &#123;
							{"\n"}  <span className="text-purple-400">const</span> agent = <span className="text-purple-400">new</span> <span className="text-yellow-300">AgentRuntime</span>(&#123;
							{"\n"}    model: <span className="text-green-300">&quot;gemini-2.5-pro&quot;</span>,
							{"\n"}    tools: [mcpPostgresQuery, mcpGithubDeploy, mcpNotifier]
							{"\n"}  &#125;);
							{"\n"}
							{"\n"}  <span className="text-purple-400">const</span> plan = <span className="text-purple-400">await</span> agent.<span className="text-blue-300">createPlan</span>(prompt);
							{"\n"}  <span className="text-purple-400">const</span> result = <span className="text-purple-400">await</span> agent.<span className="text-blue-300">executeStepByStep</span>(plan, &#123;
							{"\n"}    maxIterations: <span className="text-yellow-300">5</span>,
							{"\n"}    approvalPolicy: <span className="text-green-300">&quot;auto-for-safe-read&quot;</span>
							{"\n"}  &#125;);
							{"\n"}
							{"\n"}  <span className="text-purple-400">return</span> &#123; status: <span className="text-green-300">&quot;success&quot;</span>, latencyMs: <span className="text-yellow-300">420</span>, artifacts: result &#125;;
							{"\n"}&#125;
						</code>
					</pre>
				)}
			</div>
		</div>
	);
}
