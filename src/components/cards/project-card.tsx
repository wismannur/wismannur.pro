"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, ExternalLink, Eye, Github, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn, formatDate } from "@/lib/utils";
import type { Project } from "@/services";

interface ProjectCardProps {
  project: Project;
  variant?: "default" | "featured";
  className?: string;
  style?: React.CSSProperties;
}

const ProjectCard = React.memo(
  ({ project, className, variant = "default", style }: ProjectCardProps) => {
    const isHorizontalFeatured = variant === "featured";
    const readingTime = project.readingTime ? `${project.readingTime} min read` : "5 min read";

    if (isHorizontalFeatured) {
      return (
        <SpotlightCard
          className={cn(
            "group rounded-3xl border border-white/[0.08] bg-[#0C0E18]/85 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/40 p-0",
            className
          )}
          style={style}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full items-stretch">
            {/* Left: Image / Visual Banner */}
            <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto lg:min-h-[360px] overflow-hidden bg-gradient-to-br from-[#121526] via-[#0C0E18] to-black flex items-center justify-center p-8 border-b lg:border-b-0 lg:border-r border-white/[0.08]">
              {project.image ? (
                <Link
                  href={`/projects/${project.slug}`}
                  data-umami-event="project-card-image-click"
                  data-umami-event-project={project.slug}
                  className="block w-full h-full"
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </Link>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-4 rounded-3xl bg-primary/10 border border-primary/25 text-primary shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                    <Sparkles size={36} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
                      Featured Architecture
                    </span>
                    <h4 className="text-lg font-bold text-white mt-1">
                      {project.title.split("—")[0].trim()}
                    </h4>
                  </div>
                </div>
              )}

              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-lg shadow-primary/30 backdrop-blur-md">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>Featured Case Study</span>
                </span>
              </div>
            </div>

            {/* Right: Content & Action Details */}
            <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-10 gap-6">
              <div>
                {/* Metadata */}
                <div className="flex flex-wrap items-center text-xs text-gray-400 mb-3 gap-x-3 gap-y-1 font-mono">
                  <div className="flex items-center">
                    <Calendar size={13} className="mr-1 text-primary" />
                    <time dateTime={project.publishedDate?.toString()}>
                      {formatDate(project.publishedDate)}
                    </time>
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <Clock size={13} className="mr-1 text-primary" />
                    <span>{readingTime}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <Eye size={13} className="mr-1 text-primary" />
                    <span>{project.views.toLocaleString()} views</span>
                  </div>
                </div>

                {/* Title */}
                <Link
                  href={`/projects/${project.slug}`}
                  data-umami-event="project-card-title-click"
                  data-umami-event-project={project.slug}
                  className="block group/title"
                >
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3 transition-colors duration-200 group-hover/title:text-primary">
                    {project.title}
                  </h3>
                </Link>

                {/* Summary */}
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6">
                  {project.summary}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 6).map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 6 && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] text-gray-400 border border-white/[0.08]">
                      +{project.technologies.length - 6}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-white/[0.08] mt-auto">
                <div className="flex items-center gap-2.5">
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-umami-event="project-card-demo-click"
                      data-umami-event-project={project.slug}
                      className="text-xs font-semibold text-gray-200 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-primary/20 hover:text-white border border-white/[0.1] transition-all duration-200 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Live demo for ${project.title}`}
                    >
                      <ExternalLink size={13} className="text-primary" />
                      <span>Live Platform</span>
                    </a>
                  )}
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-umami-event="project-card-repo-click"
                      data-umami-event-project={project.slug}
                      className="text-xs font-semibold text-gray-200 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-primary/20 hover:text-white border border-white/[0.1] transition-all duration-200 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Source code for ${project.title}`}
                    >
                      <Github size={13} className="text-primary" />
                      <span>Source Code</span>
                    </a>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs md:text-sm text-primary font-bold p-0 hover:bg-transparent hover:text-primary/80 group-hover:translate-x-1 transition-transform"
                  asChild
                >
                  <Link
                    href={`/projects/${project.slug}`}
                    data-umami-event="project-card-view-click"
                    data-umami-event-project={project.slug}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span>Explore Case Study</span>
                    <ArrowRight size={15} />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </SpotlightCard>
      );
    }

    // Default Vertical Card Layout
    return (
      <SpotlightCard
        className={cn(
          "group flex flex-col h-full rounded-3xl border border-white/[0.08] bg-[#0C0E18]/85 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/40 p-0",
          className
        )}
        style={style}
      >
        {/* Visual Header */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#121526] via-[#0C0E18] to-black border-b border-white/[0.08] flex items-center justify-center p-6">
          {project.image ? (
            <Link
              href={`/projects/${project.slug}`}
              data-umami-event="project-card-image-click"
              data-umami-event-project={project.slug}
              className="block w-full h-full"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/25 text-primary">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                Production Case Study
              </span>
            </div>
          )}

          {project.isFeatured && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-white shadow-md backdrop-blur-md">
                <Sparkles size={11} className="animate-pulse" />
                <span>Featured</span>
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-col flex-1 p-6 sm:p-7 justify-between gap-4">
          <div>
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center text-xs text-gray-400 mb-2.5 gap-x-2.5 gap-y-1 font-mono">
              <div className="flex items-center">
                <Calendar size={12} className="mr-1 text-primary" />
                <time dateTime={project.publishedDate?.toString()}>
                  {formatDate(project.publishedDate)}
                </time>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <Clock size={12} className="mr-1 text-primary" />
                <span>{readingTime}</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <Eye size={12} className="mr-1 text-primary" />
                <span>{project.views.toLocaleString()}</span>
              </div>
            </div>

            {/* Title */}
            <Link
              href={`/projects/${project.slug}`}
              data-umami-event="project-card-title-click"
              data-umami-event-project={project.slug}
              className="block group/title"
            >
              <h3 className="font-bold tracking-tight text-white text-xl mb-2 line-clamp-1 transition-colors duration-200 group-hover/title:text-primary">
                {project.title}
              </h3>
            </Link>

            {/* Summary */}
            <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed mb-4 min-h-[36px]">
              {project.summary}
            </p>

            {/* Technologies */}
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
                >
                  {tech}
                </span>
              ))}
              {project.technologies.length > 4 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-400 border border-white/[0.08]">
                  +{project.technologies.length - 4}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] mt-auto">
            <div className="flex items-center gap-2">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="project-card-demo-click"
                  data-umami-event-project={project.slug}
                  className="text-xs font-semibold text-gray-200 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-primary/20 hover:text-white border border-white/[0.1] transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Live demo for ${project.title}`}
                >
                  <ExternalLink size={12} className="text-primary" />
                  <span>Live</span>
                </a>
              )}

              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="project-card-repo-click"
                  data-umami-event-project={project.slug}
                  className="text-xs font-semibold text-gray-200 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-primary/20 hover:text-white border border-white/[0.1] transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Source code for ${project.title}`}
                >
                  <Github size={12} className="text-primary" />
                  <span>Code</span>
                </a>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary font-bold p-0 hover:bg-transparent hover:text-primary/80 group-hover:translate-x-1 transition-transform"
              asChild
            >
              <Link
                href={`/projects/${project.slug}`}
                data-umami-event="project-card-view-click"
                data-umami-event-project={project.slug}
              >
                <span>Case Study</span>
                <ArrowRight size={13} className="ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </SpotlightCard>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.project.id === nextProps.project.id &&
      prevProps.project.updatedAt === nextProps.project.updatedAt &&
      prevProps.variant === nextProps.variant
    );
  }
);

ProjectCard.displayName = "ProjectCard";

export { ProjectCard };
