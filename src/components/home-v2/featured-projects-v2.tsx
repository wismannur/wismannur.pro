"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { projectService, type Project } from "@/services";
import { ProjectCard } from "@/components/cards/project-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";

interface FeaturedProjectsV2Props {
  title?: string;
  subtitle?: string;
  description?: string;
}

export function FeaturedProjectsV2({
  title = "Selected Works & Production Case Studies",
  subtitle = "Proven Execution",
  description = "Real-world web architectures, AI workflows, and mobile platforms delivered with high reliability and measurable business impact.",
}: FeaturedProjectsV2Props) {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["latestProjects-v2"],
    queryFn: () => projectService.getLatest(4),
  });

  // If no projects exist in the database, gracefully hide the entire section
  if (!isLoading && projects.length === 0) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <section className="relative overflow-hidden py-6 md:py-10">
      <div className="container px-4 max-w-6xl mx-auto">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          description={description}
          className="text-center mb-10 md:mb-12"
        />

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted/30 h-[380px] rounded-3xl animate-pulse border border-border/40"
                />
              ))
            : projects.map((project: Project, index: number) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  variant={index === 0 ? "featured" : "default"}
                  className={index === 0 ? "md:col-span-2" : ""}
                />
              ))}
        </div>

        {/* Explore All CTA */}
        <div className="mt-10 md:mt-12 text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md group"
          >
            <Link
              href="/projects"
              data-umami-event="home-v2-explore-all-projects"
              className="inline-flex items-center gap-2"
            >
              <span>Explore All Engineering Works</span>
              <ArrowRight
                size={15}
                className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
              />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
