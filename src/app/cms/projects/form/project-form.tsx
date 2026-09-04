"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  Code,
  Github,
  Globe,
  Info,
  LinkIcon,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
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
import { projectService, type TProjectResponse } from "@/services";

const MDXEditor = lazy(() => import("@/components/mdx/mdx-editor"));

const projectSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  summary: z.string().min(10, { message: "Summary must be at least 10 characters" }),
  description: z.string().min(50, { message: "Description must be at least 50 characters" }),
  technologies: z.string(),
  demoUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  repoUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  image: z.string().optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectForm() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState(0);
  const [currentProject, setCurrentProject] = useState<TProjectResponse | null>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      technologies: "",
      demoUrl: "",
      repoUrl: "",
      isPublished: false,
      isFeatured: false,
    },
  });

  const descriptionValues = form.getValues("description");

  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const project = await projectService.getById(id);
          if (project) {
            setCurrentProject(project);
            form.reset({
              title: project.title,
              summary: project.summary,
              description: project.description,
              technologies: project.technologies.join(", "),
              demoUrl: project.demoUrl || "",
              repoUrl: project.repoUrl || "",
              isPublished: Boolean(project.isPublished),
              isFeatured: Boolean(project.isFeatured),
            });

            if (project.image) {
              setSelectedImage(project.image);
            }

            const time = calculateReadingTime(project.description);
            setReadingTime(time);
          } else {
            toast.error("Project not found");
            router.push("/cms/projects");
          }
        } catch (error) {
          console.error("Error fetching project:", error);
          toast.error("Failed to load project");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProject();
  }, [id, form, router]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.description) {
        const time = calculateReadingTime(value.description);
        setReadingTime(time);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      const techList = data.technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech.length > 0);

      const imageUrl = data.image || currentProject?.image || "";
      const computedReadingTime = calculateReadingTime(data.description);

      if (isEditMode && id) {
        await projectService.update(id, {
          title: data.title,
          summary: data.summary,
          description: data.description,
          image: imageUrl,
          technologies: techList,
          demoUrl: data.demoUrl || undefined,
          repoUrl: data.repoUrl || undefined,
          readingTime: computedReadingTime,
          isPublished: data.isPublished,
          isFeatured: data.isFeatured,
          ...(data.isPublished && !currentProject?.publishedDate
            ? { publishedDate: new Date() }
            : { publishedDate: null }),
        });

        toast.success("Project updated successfully!");
      } else {
        const slug = slugify(data.title);

        await projectService.create({
          title: data.title,
          slug,
          summary: data.summary,
          description: data.description,
          image: imageUrl,
          isPublished: data.isPublished,
          isFeatured: data.isFeatured,
          publishedDate: data.isPublished ? new Date() : null,
          technologies: techList,
          demoUrl: data.demoUrl || undefined,
          repoUrl: data.repoUrl || undefined,
          views: 0,
          likes: 0,
          readingTime: computedReadingTime,
          authorId: user?.uid,
          authorName: user?.displayName || "Anonymous",
        });

        toast.success("Project created successfully!");
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["latestProjects"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProjects"] });
      queryClient.invalidateQueries({ queryKey: ["projectTechnologies"] });
      router.push("/cms/projects");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <span className="ml-2 text-lg text-slate-300">Loading project...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            {isEditMode ? "Edit Project" : "Add New Project"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Craft high-impact portfolio showcases with markdown details
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0C0E18]/80 border border-white/[0.08] text-slate-400 text-xs">
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span>Estimated reading time: <span className="text-slate-200 font-semibold">{readingTime} min</span></span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/[0.06] px-6 py-4">
                  <CardTitle className="flex items-center text-slate-100 text-base font-semibold">
                    <Briefcase className="h-4 w-4 mr-2 text-indigo-400" />
                    Project Details & Story
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* Status & Featured Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/[0.06] bg-[#131726]/60 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-200">
                              Publication Status
                            </FormLabel>
                            <div className="text-xs text-slate-400">
                              {field.value ? "Publicly visible" : "Draft state"}
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
                      name="isFeatured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/[0.06] bg-[#131726]/60 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                              Featured
                            </FormLabel>
                            <div className="text-xs text-slate-400">
                              {field.value ? "Show on hero" : "Standard list"}
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-200">
                          Project Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Electric Obsidian Portfolio Platform"
                            className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="text-xs text-slate-500 mt-1 font-mono">
                          Slug: {form.watch("title") ? slugify(form.watch("title")) : "—"}
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-200">Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A concise, compelling overview of the project and its value proposition..."
                            className="resize-none h-24 bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-200">
                          Description (MDX)
                        </FormLabel>
                        <FormControl>
                          <div className="rounded-xl border border-white/[0.08] bg-[#131726]/40 p-1 overflow-hidden">
                            <MDXEditor
                              initialCode={descriptionValues}
                              onChange={(code) => field.onChange(code)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-6 sticky top-6">
                <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/[0.06] px-6 py-4">
                    <CardTitle className="flex items-center text-slate-100 text-base font-semibold">
                      <Code className="h-4 w-4 mr-2 text-indigo-400" />
                      Links & Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6">
                    <FormField
                      control={form.control}
                      name="technologies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-200">
                            Technologies
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Next.js, TypeScript, Tailwind, Go"
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                              {...field}
                            />
                          </FormControl>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center">
                            <Info className="h-3 w-3 mr-1 text-slate-400" />
                            Comma-separated list of tech tags
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="demoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-200">Demo URL</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="https://demo.example.com"
                                className="pl-10 bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center">
                            <LinkIcon className="h-3 w-3 mr-1 text-slate-400" />
                            Optional live product demo
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="repoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-200">
                            Repository URL
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Github className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="https://github.com/org/repo"
                                className="pl-10 bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center">
                            <Github className="h-3 w-3 mr-1 text-slate-400" />
                            Optional public code link
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-200">
                            Project Cover Image
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <Input
                                placeholder="https://cdn.example.com/cover.png"
                                className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                                value={selectedImage || ""}
                                onChange={(e) => {
                                  setSelectedImage(e.target.value);
                                  form.setValue("image", e.target.value);
                                }}
                              />
                              {selectedImage && (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/[0.08] bg-[#131726]/60">
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
                                    className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white"
                                    onClick={() => {
                                      setSelectedImage(null);
                                      form.setValue("image", "");
                                    }}
                                  >
                                    <span className="sr-only">Remove image</span>×
                                  </Button>
                                </div>
                              )}
                              <p className="text-[11px] text-slate-500">
                                Recommended aspect ratio 16:9 (1200 × 675px)
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-semibold group relative overflow-hidden h-11"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="flex items-center group-hover:-translate-x-1 transition-transform duration-300">
                            {form.getValues("isPublished") ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Publish Project
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save as Draft
                              </>
                            )}
                          </span>
                          <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-300" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Project Tips */}
                <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/[0.06] py-3 px-6">
                    <CardTitle className="text-xs font-semibold flex items-center text-slate-300">
                      <Info className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                      Showcase Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-xs text-slate-400">
                    <p>
                      <span className="text-slate-200 font-medium">Architecture:</span> Detail architecture patterns, performance benchmarks, and design decisions.
                    </p>
                    <p>
                      <span className="text-slate-200 font-medium">Outcomes:</span> Highlight quantitative metrics (e.g., 40% latency reduction, $12k/mo saved).
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

