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
    <SpotlightCard className="p-5 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.08] shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-primary uppercase tracking-wider">
        <Sparkles size={13} className="animate-pulse" />
        <span>Project Links</span>
      </div>
      <div className="space-y-2.5">
        {demoUrl && (
          <Button
            asChild
            className="w-full rounded-full text-xs font-semibold h-10 shadow-md shadow-primary/30"
          >
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-umami-event="sidebar-project-demo-click"
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} />
              <span>Live Platform</span>
            </a>
          </Button>
        )}
        {repoUrl && (
          <Button
            asChild
            variant="outline"
            className="w-full rounded-full text-xs font-semibold h-10 border-white/[0.12] bg-white/[0.04] text-white hover:bg-primary/10 hover:border-primary/40"
          >
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-umami-event="sidebar-project-repo-click"
              className="flex items-center justify-center gap-2"
            >
              <Github size={14} className="text-primary" />
              <span>Source Code</span>
            </a>
          </Button>
        )}
      </div>
    </SpotlightCard>
  );
};

export default SidebarProjectLinks;
