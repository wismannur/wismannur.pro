"use client";

import React from "react";
import { ExternalLink, Github, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";

interface SidebarProjectLinksProps {
	demoUrl?: string;
	repoUrl?: string;
}

const SidebarProjectLinks = ({ demoUrl, repoUrl }: SidebarProjectLinksProps) => {
	if (!demoUrl && !repoUrl) return null;

	return (
		<SpotlightCard className="p-5 rounded-2xl bg-card/70 border border-border/50 shadow-md">
			<div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-primary uppercase tracking-wider">
				<Sparkles size={13} className="animate-pulse" />
				<span>Project Links</span>
			</div>
			<div className="space-y-2.5">
				{demoUrl && (
					<Button asChild className="w-full rounded-xl text-xs font-semibold h-10 shadow-md shadow-primary/20">
						<a
							href={demoUrl}
							target="_blank"
							rel="noopener noreferrer"
							data-umami-event="sidebar-project-demo-click"
							className="flex items-center justify-center gap-2"
						>
							<ExternalLink size={14} />
							<span>Live Demo</span>
						</a>
					</Button>
				)}
				{repoUrl && (
					<Button asChild variant="outline" className="w-full rounded-xl text-xs font-semibold h-10 border-border/60">
						<a
							href={repoUrl}
							target="_blank"
							rel="noopener noreferrer"
							data-umami-event="sidebar-project-repo-click"
							className="flex items-center justify-center gap-2"
						>
							<Github size={14} />
							<span>Source Code</span>
						</a>
					</Button>
				)}
			</div>
		</SpotlightCard>
	);
};

export default SidebarProjectLinks;
