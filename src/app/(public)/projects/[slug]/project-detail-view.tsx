"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import { TableOfContents } from "@/components/cards/table-of-contents";
import AuthorBio from "@/components/detail/author-bio";
import ContentHeader from "@/components/detail/content-header";
import ContentSkeleton from "@/components/detail/content-skeleton";
import FeaturedImage from "@/components/detail/featured-image";
import ProjectLinks from "@/components/detail/project-links";
import ReadingProgress from "@/components/detail/reading-progress";
import SidebarProjectLinks from "@/components/detail/sidebar-project-links";
import SocialShareBar from "@/components/detail/social-share-bar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useReadingProgress } from "@/hooks/use-reading-progress";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import { projectService } from "@/services";

const MDXPreview = dynamic(() => import("@/components/mdx/mdx-preview"), {
  ssr: false,
  loading: () => <ContentSkeleton />,
});

export function ProjectDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollToHash } = useScrollToHash();
  const [isLiked, setIsLiked] = useState(false);

  const readingProgress = useReadingProgress(contentRef);

  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["project", slug],
    queryFn: () => projectService.getBySlug(slug || ""),
    enabled: !!slug,
  });

  const viewMutation = useMutation({
    mutationFn: () => projectService.incrementView(project?.id || ""),
    onError: (err) => {
      console.error("Failed to increment view count:", err);
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => projectService.incrementLike(project?.id || ""),
    onSuccess: () => {
      setIsLiked(true);
      toast({
        title: "Thanks for your feedback!",
        description: "You liked this case study.",
      });
    },
  });

  const handleLike = () => {
    if (project && !isLiked) {
      likeMutation.mutate();
    }
  };

  // Increment view count on mount
  useEffect(() => {
    if (project) {
      viewMutation.mutate();
      setTimeout(scrollToHash, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  // Redirect if project not found
  useEffect(() => {
    if (isError) {
      console.error("Project not found:", error);
      router.replace("/projects");
    }
  }, [isError, error, router]);

  if (isLoading) {
    return <ContentSkeleton />;
  }

  if (!project) return null;

  const readingTime = `${project.readingTime ?? 5} min read`;

  return (
    <div className="relative py-8 md:py-12">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <ReadingProgress value={readingProgress} />

      <div className="container max-w-6xl px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Article Content */}
          <main className="lg:col-span-8 xl:col-span-9 min-w-0">
            <article>
              <ContentHeader
                title={project.title}
                technologies={project.technologies}
                publishedDate={project.publishedDate}
                views={project.views}
                readingTime={readingTime}
              />

              <FeaturedImage image={project.image} alt={project.title} />

              <ProjectLinks demoUrl={project.demoUrl} repoUrl={project.repoUrl} />

              {/* Executive Summary */}
              <div className="prose prose-invert prose-lg max-w-none mb-8 animate-fade-in">
                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed border-l-4 border-primary pl-5 italic bg-primary/[0.03] py-3 rounded-r-2xl border-y border-r border-white/[0.04]">
                  {project.summary}
                </p>

                {/* Mobile-only Table of Contents */}
                <TableOfContents
                  containerRef={contentRef}
                  className="block lg:hidden my-8 bg-[#0C0E18]/85 rounded-3xl border border-white/[0.08]"
                />

                <Separator className="my-8 bg-white/[0.08]" />
              </div>

              {/* MDX Content Body */}
              <MDXPreview code={project.description} innerRef={contentRef} />

              <SocialShareBar
                id={project.id}
                likes={project.likes}
                isLiked={isLiked}
                onLike={handleLike}
                contentType="project"
              />

              <AuthorBio />
            </article>
          </main>

          {/* Sticky Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-6">
              <SidebarProjectLinks demoUrl={project.demoUrl} repoUrl={project.repoUrl} />

              <TableOfContents
                containerRef={contentRef}
                className="bg-[#0C0E18]/85 border border-white/[0.08] rounded-3xl shadow-xl"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
