"use client";

import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock, Eye } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn, formatDate } from "@/lib/utils";
import type { Blog } from "@/services";

interface BlogCardProps {
  blog: Blog;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "compact";
}

export const BlogCard = memo(
  ({ blog, className, style, variant = "default" }: BlogCardProps) => {
    const readingTime = `${blog.readingTime ?? 5} min read`;

    if (variant === "compact") {
      return (
        <SpotlightCard
          className={cn(
            "group flex gap-4 p-4 rounded-2xl border border-white/[0.08] bg-[#0C0E18]/85 hover:border-primary/40 transition-all duration-300",
            className
          )}
          style={style}
        >
          <Link
            href={`/blog/${blog.slug}`}
            data-umami-event="blog-card-compact-click"
            data-umami-event-slug={blog.slug}
            className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-black/40 relative border border-white/[0.06]"
          >
            <Image
              src={blog.image || "/placeholder.svg"}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
          <div className="flex flex-col justify-between flex-1">
            <div>
              <Link
                href={`/blog/${blog.slug}`}
                data-umami-event="blog-card-compact-click"
                data-umami-event-slug={blog.slug}
              >
                <h3 className="font-bold text-sm text-white line-clamp-2 group-hover:text-primary transition-colors">
                  {blog.title}
                </h3>
              </Link>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{blog.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 mt-2">
              <span className="flex items-center">
                <Calendar size={11} className="mr-1 text-primary" />
                {formatDate(blog.publishedDate)}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock size={11} className="mr-1 text-primary" />
                {readingTime}
              </span>
            </div>
          </div>
        </SpotlightCard>
      );
    }

    return (
      <SpotlightCard
        className={cn(
          "group flex flex-col h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0C0E18]/85 hover:border-primary/40 hover:shadow-2xl transition-all duration-300",
          className
        )}
        style={style}
      >
        {/* Article Thumbnail */}
        <Link
          href={`/blog/${blog.slug}`}
          data-umami-event="blog-card-image-click"
          data-umami-event-slug={blog.slug}
          className="block aspect-video overflow-hidden bg-black/40 relative border-b border-white/[0.06]"
        >
          {blog.image && blog.image !== "/placeholder.svg" ? (
            <Image
              src={blog.image}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#121526] via-[#0E111F] to-[#08090C]">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Clock size={24} />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E18] via-transparent to-transparent opacity-60" />
        </Link>

        {/* Article Body */}
        <div className="flex flex-col flex-1 justify-between p-6 sm:p-7">
          <div>
            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3.5">
                {blog.tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${tag}`}
                    data-umami-event="blog-card-tag-click"
                    data-umami-event-tag={tag}
                    className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors uppercase tracking-wider"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {tag}
                  </Link>
                ))}
                {blog.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/[0.05] text-gray-400 border border-white/[0.08]">
                    +{blog.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <Link
              href={`/blog/${blog.slug}`}
              data-umami-event="blog-card-title-click"
              data-umami-event-slug={blog.slug}
              className="block group/title"
            >
              <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-2.5 line-clamp-2 text-white group-hover/title:text-primary transition-colors leading-snug">
                {blog.title}
              </h3>
            </Link>

            {/* Summary */}
            <p className="text-gray-300 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4">
              {blog.summary}
            </p>
          </div>

          {/* Card Footer Metadata */}
          <div className="pt-4 border-t border-white/[0.08] mt-auto">
            <div className="w-full text-xs text-gray-400 flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center">
                  <Calendar size={12} className="mr-1 text-primary" />
                  {formatDate(blog.publishedDate)}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock size={12} className="mr-1 text-primary" />
                  {readingTime}
                </span>
              </div>

              {blog.views !== undefined && (
                <span className="flex items-center text-[11px] font-mono text-gray-400">
                  <Eye size={12} className="mr-1 text-primary" />
                  {blog.views.toLocaleString()}
                </span>
              )}
            </div>

            {/* Read Link */}
            <div className="flex justify-end pt-1">
              <Link
                href={`/blog/${blog.slug}`}
                data-umami-event="blog-card-readmore-click"
                data-umami-event-slug={blog.slug}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-white transition-colors group-hover:translate-x-1 duration-200"
              >
                <span>Read Article</span>
                <ArrowRight size={13} className="text-primary" />
              </Link>
            </div>
          </div>
        </div>
      </SpotlightCard>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.blog.id === nextProps.blog.id && prevProps.variant === nextProps.variant;
  }
);

BlogCard.displayName = "BlogCard";
