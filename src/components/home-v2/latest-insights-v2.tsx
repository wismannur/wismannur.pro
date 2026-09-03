"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { blogService, type Blog } from "@/services";
import { BlogCard } from "@/components/cards/blog-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";

interface LatestInsightsV2Props {
  title?: string;
  subtitle?: string;
  description?: string;
}

export function LatestInsightsV2({
  title = "Technical Writing & Architecture Teardowns",
  subtitle = "Engineering Blog",
  description = "In-depth insights on Next.js 16 internals, autonomous agent systems, PostgreSQL performance tuning, and scalable frontend design.",
}: LatestInsightsV2Props) {
  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["latestBlogs-v2"],
    queryFn: () => blogService.getLatest(3),
  });

  return (
    <section className="relative overflow-hidden py-8 md:py-12">
      <div className="container px-4 max-w-6xl mx-auto">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          description={description}
          className="text-center mb-10 md:mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted/30 h-[360px] rounded-3xl animate-pulse border border-border/40"
                />
              ))
            : blogs.map((blog: Blog, index: number) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              ))}
        </div>

        <div className="mt-10 md:mt-12 text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md group"
          >
            <Link
              href="/blog"
              data-umami-event="home-v2-view-all-articles"
              className="inline-flex items-center gap-2"
            >
              <BookOpen size={15} />
              <span>Read All Technical Articles</span>
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
