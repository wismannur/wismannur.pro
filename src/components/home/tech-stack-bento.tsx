"use client";

import React, { useState } from "react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";
import { Code2, Bot, Database, Cloud, Layers, Sparkles } from "lucide-react";

interface TechItem {
	name: string;
	category: "frontend" | "ai" | "backend" | "devops";
	iconUrl?: string;
	badge?: string;
}

const techItems: TechItem[] = [
	// Frontend
	{ name: "Next.js 16", category: "frontend", badge: "Primary" },
	{ name: "React 19", category: "frontend", badge: "Core" },
	{ name: "TypeScript", category: "frontend", badge: "Strict" },
	{ name: "Tailwind CSS", category: "frontend" },
	{ name: "Framer Motion", category: "frontend" },
	{ name: "TanStack Query", category: "frontend" },

	// AI & Agentic
	{ name: "Autonomous AI Agents", category: "ai", badge: "Specialty" },
	{ name: "Gemini API", category: "ai" },
	{ name: "MCP Protocol", category: "ai", badge: "Advanced" },
	{ name: "Claude API", category: "ai" },
	{ name: "Function Calling / Tools", category: "ai" },

	// Backend & DB
	{ name: "Node.js", category: "backend" },
	{ name: "PostgreSQL", category: "backend", badge: "Preferred" },
	{ name: "Drizzle ORM", category: "backend" },
	{ name: "Neon Serverless", category: "backend" },
	{ name: "REST / RPC APIs", category: "backend" },

	// DevOps
	{ name: "Vercel", category: "devops" },
	{ name: "Docker", category: "devops" },
	{ name: "Google Cloud", category: "devops" },
	{ name: "GitHub Actions CI/CD", category: "devops" },
];

export function TechStackBento() {
	const [activeCategory, setActiveCategory] = useState<string>("all");

	const filteredTechs = activeCategory === "all"
		? techItems
		: techItems.filter((item) => item.category === activeCategory);

	const categories = [
		{ id: "all", label: "All Stack", icon: Layers },
		{ id: "frontend", label: "Frontend", icon: Code2 },
		{ id: "ai", label: "AI & Agents", icon: Bot },
		{ id: "backend", label: "Backend & DB", icon: Database },
		{ id: "devops", label: "DevOps & Cloud", icon: Cloud },
	];

	return (
		<SpotlightCard className="p-6 md:p-7 flex flex-col justify-between h-full rounded-2xl bg-card/70 border border-border/50">
			<div>
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<div className="p-2 rounded-xl bg-primary/10 text-primary">
							<Sparkles size={18} />
						</div>
						<div>
							<h3 className="font-bold text-lg text-foreground">Core Technologies</h3>
							<p className="text-xs text-muted-foreground">Battle-tested tools & modern ecosystem</p>
						</div>
					</div>
				</div>

				{/* Category Pills */}
				<div className="flex flex-wrap gap-1.5 mb-6">
					{categories.map((cat) => {
						const Icon = cat.icon;
						const isActive = activeCategory === cat.id;
						return (
							<button
								key={cat.id}
								type="button"
								onClick={() => setActiveCategory(cat.id)}
								className={cn(
									"flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
									isActive
										? "bg-primary text-primary-foreground shadow-sm"
										: "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
								)}
							>
								<Icon size={12} />
								{cat.label}
							</button>
						);
					})}
				</div>

				{/* Tech Grid */}
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
					{filteredTechs.map((tech) => (
						<div
							key={tech.name}
							className="group relative flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
						>
							<span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
								{tech.name}
							</span>
							{tech.badge && (
								<span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
									{tech.badge}
								</span>
							)}
						</div>
					))}
				</div>
			</div>

			<div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
				<span>Continuous Learning & Experimentation</span>
				<span className="font-mono text-[11px] text-primary">v2026.x</span>
			</div>
		</SpotlightCard>
	);
}
