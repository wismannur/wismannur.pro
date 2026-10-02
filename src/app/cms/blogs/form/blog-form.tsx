"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  FileText,
  GripHorizontal,
  Image as ImageIcon,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Save,
  Send,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { lazy, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { calculateReadingTime } from "@/lib/mdx";
import { slugify } from "@/lib/utils";
import { type Blog, blogService, type NewBlog } from "@/services";

const MDXEditor = lazy(() => import("@/components/mdx/mdx-editor"));

const blogSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  summary: z.string().min(10, { message: "Summary must be at least 10 characters" }),
  content: z.string().min(50, { message: "Content must be at least 50 characters" }),
  tags: z.string().min(3, { message: "Tags must be at least 3 characters" }),
  image: z.string().optional(),
  isPublished: z.boolean().default(false),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export function BlogForm() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);

  // Resize state & handlers for Article Summary textarea
  const [summaryHeight, setSummaryHeight] = useState<number>(84);
  const isDraggingSummaryRef = useRef(false);
  const dragStartYSummaryRef = useRef(0);
  const startHeightSummaryRef = useRef(84);

  const handleMouseDownSummaryResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSummaryRef.current = true;
    dragStartYSummaryRef.current = e.clientY;
    startHeightSummaryRef.current = summaryHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingSummaryRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYSummaryRef.current;
      const maxHeight = Math.max(400, Math.floor(window.innerHeight * 0.6));
      const newHeight = Math.min(Math.max(startHeightSummaryRef.current + deltaY, 60), maxHeight);
      setSummaryHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingSummaryRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStartSummaryResize = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingSummaryRef.current = true;
    dragStartYSummaryRef.current = touch.clientY;
    startHeightSummaryRef.current = summaryHeight;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingSummaryRef.current) return;
      const currentTouch = moveEvent.touches[0];
      if (!currentTouch) return;
      const deltaY = currentTouch.clientY - dragStartYSummaryRef.current;
      const maxHeight = Math.max(400, Math.floor(window.innerHeight * 0.6));
      const newHeight = Math.min(Math.max(startHeightSummaryRef.current + deltaY, 60), maxHeight);
      setSummaryHeight(newHeight);
    };

    const handleTouchEnd = () => {
      isDraggingSummaryRef.current = false;
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      summary: "",
      content: "",
      tags: "",
      isPublished: false,
    },
  });

  const contentValues = form.getValues("content");

  useEffect(() => {
    const fetchBlog = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const blog = await blogService.getById(id);
          if (blog) {
            setCurrentBlog(blog);
            form.reset({
              title: blog.title,
              summary: blog.summary,
              content: blog.content,
              tags: blog.tags.join(", "),
              isPublished: Boolean(blog.isPublished),
            });

            if (blog.image) {
              setSelectedImage(blog.image);
            }
          } else {
            toast.error("Blog not found");
            router.push("/cms/blogs");
          }
        } catch (error) {
          console.error("Error fetching blog:", error);
          toast.error("Failed to load blog");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBlog();
  }, [id, form, router]);

  const watchedContent = useWatch({ control: form.control, name: "content" });
  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedTags = useWatch({ control: form.control, name: "tags" });
  const watchedIsPublished = useWatch({ control: form.control, name: "isPublished" });

  const readingTime = calculateReadingTime(watchedContent || "");
  const wordCount = (watchedContent || "").trim()
    ? (watchedContent || "").trim().split(/\s+/).length
    : 0;

  const parsedTagList = (watchedTags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const onSubmit = async (data: BlogFormValues) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const tagList = data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const imageUrl = data.image || currentBlog?.image || "";
      const computedReadingTime = calculateReadingTime(data.content);

      if (isEditMode && id) {
        await blogService.update(id, {
          title: data.title,
          summary: data.summary,
          content: data.content,
          image: imageUrl,
          tags: tagList,
          readingTime: computedReadingTime,
          isPublished: data.isPublished,
          ...(data.isPublished && !currentBlog?.publishedDate
            ? { publishedDate: new Date() }
            : { publishedDate: null }),
        });

        toast.success("Blog post updated successfully!");
      } else {
        const slug = slugify(data.title);

        const newBlog: NewBlog = {
          title: data.title,
          slug,
          summary: data.summary,
          content: data.content,
          image: imageUrl,
          isPublished: data.isPublished,
          publishedDate: data.isPublished ? new Date() : null,
          tags: tagList,
          views: 0,
          likes: 0,
          readingTime: computedReadingTime,
          authorId: user.uid,
          authorName: user.displayName || "Anonymous",
        };

        await blogService.create(newBlog);
        toast.success("Blog post created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      queryClient.invalidateQueries({ queryKey: ["latestBlogs"] });
      queryClient.invalidateQueries({ queryKey: ["relatedBlogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogTags"] });
      router.push("/cms/blogs");
    } catch (error) {
      console.error("Error saving blog:", error);
      toast.error("Failed to save blog post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <span className="text-xs text-slate-400 font-medium">Loading article studio...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 text-slate-100 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-slate-400 hover:text-white hover:bg-[#131726] text-xs font-medium rounded-lg"
        >
          <Link href="/cms/blogs">
            <ArrowLeft className="h-4 w-4" /> Back to Articles
          </Link>
        </Button>
      </div>

      {/* Electric Obsidian Command Center Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] border border-white/[0.08] shadow-2xl">
        <div className="absolute top-0 right-0 w-[450px] h-[240px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[280px] h-[140px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <BookOpen size={13} className="text-primary" />
                <span>THOUGHT LEADERSHIP PUBLISHER</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live MDX Engine Active</span>
              </span>
              {watchedIsPublished ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  Public / Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                  Draft Mode
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isEditMode ? "Edit " : "Create "}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-primary">
                Blog Article
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Author rich technical essays, architecture deep-dives, and tutorials with live interactive MDX preview, custom components, and SEO optimization.
            </p>

            {/* Quick KPI badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-gray-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span><strong className="text-white font-bold">{readingTime} min</strong> Read Time</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span><strong className="text-white font-bold">{wordCount}</strong> Words</span>
              </div>
              {parsedTagList.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span><strong className="text-white font-bold">{parsedTagList.length}</strong> Tags</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons on Hero Header */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/cms/blogs")}
              disabled={isSubmitting}
              className="text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="gap-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 text-xs px-5 h-10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  {watchedIsPublished ? (
                    <>
                      <Send className="w-4 h-4 text-emerald-300" />
                      <span>Publish Article</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>Save as Draft</span>
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card 1: Article Essentials & Metadata (Unified Spacious Grid) */}
          <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>General Information & Metadata</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Article Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-slate-200 text-xs font-semibold">
                      Article Title *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Architecting Scalable Next.js Platforms at Enterprise Scale"
                        className="h-11 rounded-xl bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-medium"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                    {watchedTitle && (
                      <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                        <span className="text-primary font-semibold">Target URL Slug:</span>
                        <span className="text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                          /blog/{slugify(watchedTitle)}
                        </span>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* 2-Column Row: Visibility & Taxonomy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Visibility Status */}
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between rounded-xl bg-[#131726] border border-white/[0.06] p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Visibility & Publication</span>
                          </FormLabel>
                          <div className="text-[11px] text-slate-400">
                            {field.value
                              ? "Publicly visible on the live blog"
                              : "Private author draft mode"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </div>

                      {isEditMode && currentBlog && (
                        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            Published:{" "}
                            <strong className="text-slate-200">
                              {currentBlog.publishedDate
                                ? new Date(currentBlog.publishedDate).toLocaleDateString()
                                : "Not yet"}
                            </strong>
                          </span>
                          <span>
                            Views: <strong className="text-slate-200">{currentBlog.views || 0}</strong>
                          </span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* Taxonomy & Tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className="space-y-2 rounded-xl bg-[#131726] border border-white/[0.06] p-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-purple-400" />
                          <span>Taxonomy & Tags *</span>
                        </FormLabel>
                        <span className="text-[10px] text-slate-500 font-mono">Comma-separated</span>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="nextjs, react, typescript, architecture"
                          className="h-9 rounded-lg bg-[#0C0E18] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40"
                          {...field}
                        />
                      </FormControl>
                      {parsedTagList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {parsedTagList.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-md font-mono px-2 py-0.5"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage className="text-xs text-rose-400" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cover Image */}
              <FormField
                control={form.control}
                name="image"
                render={() => (
                  <FormItem className="space-y-2 rounded-xl bg-[#131726]/60 border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Article Cover Image</span>
                      </FormLabel>
                      <span className="text-[10px] text-slate-500">16:9 ratio recommended (1200 × 630px)</span>
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        <Input
                          placeholder="https://... or /images/blog/..."
                          className="h-10 rounded-xl bg-[#0C0E18] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-mono"
                          value={selectedImage || ""}
                          onChange={(e) => {
                            setSelectedImage(e.target.value);
                            form.setValue("image", e.target.value);
                          }}
                        />
                        {selectedImage && (
                          <div className="relative aspect-video max-h-56 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0C0E18]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedImage || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full bg-rose-500/80 hover:bg-rose-600 shadow-md"
                              onClick={() => {
                                setSelectedImage(null);
                                form.setValue("image", "");
                              }}
                              title="Remove cover image"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Article Summary with Nested Resizer */}
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-200 text-xs font-semibold">
                        Article Summary / Excerpt *
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1 font-mono">
                          <GripHorizontal className="h-3 w-3 opacity-60" /> Drag to resize
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSummaryHeight((prev) => (prev > 120 ? 84 : 180));
                          }}
                          className="h-6 w-6 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06]"
                          title={summaryHeight > 120 ? "Collapse height" : "Expand height"}
                        >
                          {summaryHeight > 120 ? (
                            <Minimize2 className="h-3 w-3" />
                          ) : (
                            <Maximize2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#131726] overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-inner">
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary shown on blog preview cards, social shares, and search engine results..."
                          style={{ height: `${summaryHeight}px` }}
                          className="w-full text-xs resize-none rounded-none border-0 bg-transparent text-slate-100 placeholder:text-slate-500 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 overflow-y-auto custom-scrollbar"
                          {...field}
                        />
                      </FormControl>
                      {/* Bottom Drag Handle Bar to Resize Inside Field */}
                      <div
                        onMouseDown={handleMouseDownSummaryResize}
                        onTouchStart={handleTouchStartSummaryResize}
                        className="group w-full h-3.5 cursor-row-resize flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.06] transition-colors select-none border-t border-white/[0.04]"
                        title="Drag handle to resize summary"
                      >
                        <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-primary group-hover:w-16 transition-all duration-200" />
                      </div>
                    </div>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card 2: Full-Width Content Studio (MDX) */}
          <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Content (MDX) Studio</span>
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">
                  Full-width Monaco editor with real-time side-by-side preview & flexible tabs
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Components, Callouts & Code Highlighting</span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormControl>
                      <MDXEditor
                        value={field.value}
                        initialCode={contentValues}
                        height="580px"
                        onChange={(code) => field.onChange(code)}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              {/* MDX Power Shortcuts / Tips Footer */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Use <code className="text-slate-200 font-mono bg-white/[0.04] px-1 py-0.5 rounded">&lt;Callout type=&quot;info|warning|error&quot;&gt;</code> for callout notes.
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Drag the center divider horizontally to resize split preview
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Action Footer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0E18] border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>
                {watchedIsPublished
                  ? "Article is set to be published live on the website."
                  : "Article is in draft mode and only visible to you."}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/cms/blogs")}
                disabled={isSubmitting}
                className="text-xs rounded-xl border-white/[0.08] bg-white/[0.04] text-gray-300 hover:text-white h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 text-xs px-6 h-10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Article...</span>
                  </>
                ) : (
                  <>
                    {watchedIsPublished ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-300" />
                        <span>Publish Article</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 text-amber-300" />
                        <span>Save as Draft</span>
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
