"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock, FileText, Info, Loader2, Save, Tag } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { lazy, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [readingTime, setReadingTime] = useState(0);
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);

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

            const time = calculateReadingTime(blog.content);
            setReadingTime(time);
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

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.content) {
        const time = calculateReadingTime(value.content);
        setReadingTime(time);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = async (data: BlogFormValues) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const tagList = data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const imageUrl = data.image || currentBlog?.image || "";
      const readingTime = calculateReadingTime(data.content);

      if (isEditMode && id) {
        await blogService.update(id, {
          title: data.title,
          summary: data.summary,
          content: data.content,
          image: imageUrl,
          tags: tagList,
          readingTime,
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
          readingTime,
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
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <span className="ml-3 text-sm font-medium text-slate-300">Loading blog post...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06]">
            <Link href="/cms/blogs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
            </h1>
            <div className="flex items-center text-slate-400 text-xs mt-0.5">
              <Clock className="h-3.5 w-3.5 mr-1 text-indigo-400" />
              <span>Estimated reading time: {readingTime} min</span>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
                  <CardTitle className="text-base font-bold text-white flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-indigo-400" />
                    Article Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl bg-[#131726]/70 border border-white/[0.06] p-4.5">
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-bold text-white">Publication Status</FormLabel>
                          <div className="text-xs text-slate-400">
                            {field.value
                              ? "Your article will be publicly visible to all visitors"
                              : "Saved as draft — hidden from public website"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 text-xs font-semibold">Article Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Architecting Scalable Next.js Applications"
                            className="h-10 rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-rose-400" />
                        {form.watch("title") && (
                          <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                            <span className="text-indigo-400">URL Slug:</span> /{slugify(form.watch("title"))}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 text-xs font-semibold">Article Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief summary shown on blog cards and search engine previews"
                            rows={3}
                            className="rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs leading-relaxed focus-visible:ring-indigo-500/40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-rose-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 text-xs font-semibold">
                          Content (MDX)
                        </FormLabel>
                        <FormControl>
                          <MDXEditor
                            initialCode={contentValues}
                            onChange={(code) => field.onChange(code)}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-rose-400" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
                  <CardTitle className="text-base font-bold text-white flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-indigo-400" />
                    Meta & Taxonomy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 text-xs font-semibold">Tags (comma-separated)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="nextjs, react, typescript, web-dev"
                            className="h-10 rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/40"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center">
                          <Info className="h-3 w-3 mr-1 text-indigo-400" />
                          Separate tags with commas
                        </div>
                        <FormMessage className="text-xs text-rose-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-slate-200 text-xs font-semibold">
                          Cover Image URL
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <Input
                              placeholder="https://... or /placeholder.svg"
                              className="h-10 rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/40"
                              value={selectedImage || ""}
                              onChange={(e) => {
                                setSelectedImage(e.target.value);
                                form.setValue("image", e.target.value);
                              }}
                            />
                            {selectedImage && (
                              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/[0.08] bg-[#131726]">
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
                                  className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full bg-rose-500/80 hover:bg-rose-600"
                                  onClick={() => {
                                    setSelectedImage(null);
                                    form.setValue("image", "");
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            )}
                            <p className="text-[11px] text-slate-400">
                              Recommended ratio: 1200 × 630 pixels
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-400" />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="p-6 bg-[#131726]/40 border-t border-white/[0.06]">
                  <Button
                    type="submit"
                    className="w-full rounded-xl h-10 text-xs font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {form.getValues("isPublished") ? "Publishing..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        {form.getValues("isPublished") ? (
                          <>
                            <Check className="mr-1.5 h-4 w-4" />
                            Publish Article
                          </>
                        ) : (
                          <>
                            <Save className="mr-1.5 h-4 w-4" />
                            Save as Draft
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-white/[0.06]">
                  <CardTitle className="text-xs font-bold text-slate-300 flex items-center uppercase tracking-wider">
                    <Info className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                    MDX Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-xs space-y-2 text-slate-400">
                    <p>
                      <strong className="text-slate-200">Headings:</strong> # Title, ## Subtitle
                    </p>
                    <p>
                      <strong className="text-slate-200">Lists:</strong> - Bullet item, 1. Ordered
                    </p>
                    <p>
                      <strong className="text-slate-200">Links:</strong> [Text](https://url.com)
                    </p>
                    <p>
                      <strong className="text-slate-200">Code:</strong> `inline` or ```ts code ```
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
