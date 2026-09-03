"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import { BlogCard } from "@/components/cards/blog-card";
import { TableOfContents } from "@/components/cards/table-of-contents";
import AuthorBio from "@/components/detail/author-bio";
import ContentHeader from "@/components/detail/content-header";
import ContentSkeleton from "@/components/detail/content-skeleton";
import FeaturedImage from "@/components/detail/featured-image";
import ReadingProgress from "@/components/detail/reading-progress";
import SocialShareBar from "@/components/detail/social-share-bar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useReadingProgress } from "@/hooks/use-reading-progress";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import { blogService } from "@/services";

const MDXPreview = dynamic(() => import("@/components/mdx/mdx-preview"), {
  ssr: false,
  loading: () => <ContentSkeleton />,
});

export function BlogDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollToHash } = useScrollToHash();
  const [isLiked, setIsLiked] = useState(false);

  const readingProgress = useReadingProgress(contentRef);

  const {
    data: blog,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => blogService.getBySlug(slug || ""),
    enabled: !!slug,
  });

  const { data: relatedBlogs = [] } = useQuery({
    queryKey: ["relatedBlogs"],
    queryFn: () => blogService.getLatest(3),
    enabled: !!blog?.id,
  });

  const viewMutation = useMutation({
    mutationFn: () => blogService.incrementView(blog?.id || ""),
    onError: (err) => {
      console.error("Failed to increment view count:", err);
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => blogService.incrementLike(blog?.id || ""),
    onSuccess: () => {
      setIsLiked(true);
      toast({
        title: "Thanks for your feedback!",
        description: "You liked this article.",
      });
    },
  });

  const handleLike = () => {
    if (blog && !isLiked) {
      likeMutation.mutate();
    }
  };

  useEffect(() => {
    if (blog) {
      viewMutation.mutate();
      setTimeout(scrollToHash, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blog]);

  useEffect(() => {
    if (isError) {
      console.error("Blog not found:", error);
      router.replace("/blog");
    }
  }, [isError, error, router]);

  if (isLoading) {
    return <ContentSkeleton />;
  }

  if (!blog) return null;

  const readingTime = `${blog.readingTime ?? 5} min read`;
  const relatedArticles = relatedBlogs.filter((related) => related.id !== blog.id).slice(0, 2);

  return (
    <div className="relative py-8 md:py-12">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <ReadingProgress value={readingProgress} />

      <div className="container max-w-6xl px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Content */}
          <main className="lg:col-span-8 xl:col-span-9 min-w-0">
            <article>
              <ContentHeader
                title={blog.title}
                tags={blog.tags}
                publishedDate={blog.publishedDate}
                views={blog.views}
                readingTime={readingTime}
              />

              <FeaturedImage image={blog.image} alt={blog.title} />

              {/* Summary Callout */}
              <div className="prose prose-invert prose-lg max-w-none mb-8 animate-fade-in">
                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed border-l-4 border-primary pl-5 italic bg-primary/[0.03] py-3 rounded-r-2xl border-y border-r border-white/[0.04]">
                  {blog.summary}
                </p>

                {/* Mobile TOC */}
                <TableOfContents
                  containerRef={contentRef}
                  className="block lg:hidden my-8 bg-[#0C0E18]/85 rounded-3xl border border-white/[0.08]"
                />

                <Separator className="my-8 bg-white/[0.08]" />
              </div>

              {/* MDX Content */}
              <MDXPreview code={blog.content} innerRef={contentRef} />

              <SocialShareBar
                id={blog.id}
                likes={blog.likes}
                isLiked={isLiked}
                onLike={handleLike}
                contentType="blog"
              />

              <AuthorBio />
            </article>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-16 pt-8 border-t border-white/[0.08] animate-fade-in">
                <h2 className="text-2xl font-bold text-white mb-8">Related Essays</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.map((relatedBlog) => (
                    <BlogCard key={relatedBlog.id} blog={relatedBlog} variant="compact" />
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Sticky Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-6">
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
