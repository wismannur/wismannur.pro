import React from "react";
import { ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectLinksProps {
  demoUrl?: string;
  repoUrl?: string;
}

const ProjectLinks = ({ demoUrl, repoUrl }: ProjectLinksProps) => {
  if (!demoUrl && !repoUrl) return null;

  return (
    <div className="mb-8 flex flex-wrap gap-4 animate-fade-in">
      {demoUrl && (
        <Button
          asChild
          size="lg"
          className="rounded-full px-6 shadow-lg shadow-primary/30 hover:shadow-primary/40 group"
        >
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="project-detail-demo-click"
            className="flex items-center gap-2"
          >
            <ExternalLink size={16} className="group-hover:animate-pulse" />
            <span>Live Platform</span>
          </a>
        </Button>
      )}

      {repoUrl && (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-full px-6 border-white/[0.12] bg-white/[0.04] text-white hover:bg-primary/10 hover:border-primary/40 group"
        >
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="project-detail-repo-click"
            className="flex items-center gap-2"
          >
            <Github size={16} className="group-hover:rotate-12 transition-transform text-primary" />
            <span>Source Repository</span>
          </a>
        </Button>
      )}
    </div>
  );
};

export default ProjectLinks;
