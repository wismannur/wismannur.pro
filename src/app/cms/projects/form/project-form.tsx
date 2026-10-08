"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Brain,
  Briefcase,
  Check,
  Clock,
  Code,
  Copy,
  FileText,
  FolderGit2,
  Github,
  Globe,
  GripHorizontal,
  Image as ImageIcon,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Save,
  Send,
  Share2,
  Sparkles,
  Wand2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { type DraftProjectResult, projectService, type TProjectResponse } from "@/services";

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
  const [currentProject, setCurrentProject] = useState<TProjectResponse | null>(null);

  // Resize state & handlers for Project Summary textarea
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

  const watchedDescription = useWatch({ control: form.control, name: "description" });
  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedTechnologies = useWatch({ control: form.control, name: "technologies" });
  const watchedIsPublished = useWatch({ control: form.control, name: "isPublished" });
  const watchedIsFeatured = useWatch({ control: form.control, name: "isFeatured" });

  const readingTime = calculateReadingTime(watchedDescription || "");
  const wordCount = (watchedDescription || "").trim()
    ? (watchedDescription || "").trim().split(/\s+/).length
    : 0;

  const parsedTechList = (watchedTechnologies || "")
    .split(",")
    .map((tech) => tech.trim())
    .filter(Boolean);

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

  // Second Brain Case Study Drafting & Sync states
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState<DraftProjectResult | null>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [projectTitlePrompt, setProjectTitlePrompt] = useState("");
  const [technologiesPrompt, setTechnologiesPrompt] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleDraftCaseStudyWithSecondBrain = async () => {
    setIsDrafting(true);
    try {
      const result = await projectService.draftWithSecondBrain({
        projectTitle: projectTitlePrompt.trim() || form.getValues("title")?.trim() || undefined,
        technologies: technologiesPrompt.trim() || form.getValues("technologies")?.trim() || undefined,
        existingSummary: form.getValues("summary")?.trim() || undefined,
        existingDescription: form.getValues("description")?.trim() || undefined,
      });
      setDraftResult(result);
      toast.success("Project case study synthesized from My Second Brain!");
    } catch (error) {
      console.error("Error drafting project with Second Brain:", error);
      toast.error(error instanceof Error ? error.message : "Failed to draft project case study.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleApplyDraft = () => {
    if (!draftResult) return;
    form.setValue("title", draftResult.title, { shouldDirty: true });
    form.setValue("summary", draftResult.summary, { shouldDirty: true });
    form.setValue("technologies", draftResult.technologies, { shouldDirty: true });
    form.setValue("description", draftResult.description, { shouldDirty: true });
    setShowDraftDialog(false);
    toast.success("Applied Second Brain case study into Project Studio!");
  };

  const handleSyncProjectToSecondBrain = async () => {
    const title = form.getValues("title")?.trim();
    const summary = form.getValues("summary")?.trim();
    const description = form.getValues("description")?.trim();

    if (!title || !summary || !description) {
      toast.error("Please fill in Title, Summary, and Description before syncing to Second Brain.");
      return;
    }

    setIsSyncing(true);
    try {
      const technologies = form
        .getValues("technologies")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await projectService.syncToSecondBrain({
        title,
        summary,
        description,
        technologies,
        category: "case-studies",
      });
      queryClient.invalidateQueries({ queryKey: ["aiKnowledgeItems"] });
      toast.success("Synced case study to My Second Brain (Case Studies)!", {
        action: {
          label: "Open Brain",
          onClick: () => router.push("/cms/ai-knowledge"),
        },
      });
    } catch (error) {
      console.error("Error syncing to Second Brain:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync to Second Brain.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <span className="text-xs text-slate-400 font-medium">Loading project studio...</span>
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
          <Link href="/cms/projects">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>
        </Button>
      </div>

      {/* Electric Obsidian Command Center Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0C0E18] via-[#090A10] to-[#08090C] border border-white/[0.08] shadow-2xl">
        <div className="absolute top-0 right-0 w-[450px] h-[240px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[280px] h-[140px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <FolderGit2 size={13} className="text-primary" />
                <span>ENGINEERING SHOWCASE ORCHESTRATOR</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Portfolio Engine Active</span>
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
              {watchedIsFeatured && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-indigo-300 text-[11px] font-semibold">
                  <Sparkles size={11} className="text-primary" />
                  <span>Featured Hero</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isEditMode ? "Edit " : "Create "}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-primary">
                Portfolio Showcase
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Curate high-impact engineering case studies, architectural blueprints, live demo endpoints, and repository artifacts with live interactive MDX preview.
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
              {parsedTechList.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  <span><strong className="text-white font-bold">{parsedTechList.length}</strong> Technologies</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons on Hero Header */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/cms/projects")}
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
                      <span>Publish Project</span>
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
          {/* My Second Brain Case Study Assistant */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-slate-900/40 border border-purple-500/25 shadow-lg shadow-purple-950/10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">My Second Brain Case Study Architect</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                    Digital Twin SSOT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Synthesize an executive case study (STAR & XYZ impact) grounded in your Second Brain project architecture and metrics.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncProjectToSecondBrain}
                disabled={isSyncing || isDrafting}
                className="h-8 text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-white rounded-lg transition-colors"
                title="Export this project's case study into My Second Brain"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                    <span>Sync to Brain</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setShowDraftDialog(true)}
                disabled={isDrafting || isSyncing}
                className="h-8 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-purple-600/20 rounded-lg transition-all"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-300" />
                <span>Draft Case Study</span>
              </Button>
            </div>
          </div>

          {/* Card 1: Project Essentials & Architecture Metadata */}
          <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span>Project Essentials & Architecture Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Project Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-slate-200 text-xs font-semibold">
                      Project Title *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Electric Obsidian Portfolio Platform"
                        className="h-11 rounded-xl bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-medium"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                    {watchedTitle && (
                      <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                        <span className="text-primary font-semibold">Target URL Slug:</span>
                        <span className="text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                          /projects/{slugify(watchedTitle)}
                        </span>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* 2-Column Row: Publication & Featured Switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Publication Status Switch */}
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
                              ? "Publicly live on portfolio"
                              : "Private draft mode"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </div>

                      {isEditMode && currentProject && (
                        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            Published:{" "}
                            <strong className="text-slate-200">
                              {currentProject.publishedDate
                                ? new Date(currentProject.publishedDate).toLocaleDateString()
                                : "Not yet"}
                            </strong>
                          </span>
                          <span>
                            Views: <strong className="text-slate-200">{currentProject.views || 0}</strong>
                          </span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* Featured Status Switch */}
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between rounded-xl bg-[#131726] border border-white/[0.06] p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Featured Showcase</span>
                          </FormLabel>
                          <div className="text-[11px] text-slate-400">
                            {field.value
                              ? "Spotlight on home / hero banner"
                              : "Standard portfolio showcase listing"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </div>

                      {isEditMode && currentProject && (
                        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            Likes: <strong className="text-slate-200">{currentProject.likes || 0}</strong>
                          </span>
                          <span>
                            Author: <strong className="text-slate-200">{currentProject.authorName || "Wisman Nur"}</strong>
                          </span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              {/* 2-Column Row: Live Endpoints & Repos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="demoUrl"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Live Demo URL</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://demo.example.com"
                          className="h-10 rounded-xl bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-rose-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repoUrl"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                        <Github className="h-3.5 w-3.5 text-slate-300" />
                        <span>Source Repository URL</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://github.com/wismannur/repo"
                          className="h-10 rounded-xl bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-rose-400" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tech Stack & Ecosystem */}
              <FormField
                control={form.control}
                name="technologies"
                render={({ field }) => (
                  <FormItem className="space-y-2 rounded-xl bg-[#131726]/60 border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                        <Code className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Tech Stack & Ecosystem *</span>
                      </FormLabel>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Info className="h-3 w-3 text-primary shrink-0" />
                        <span>Separate technologies with commas</span>
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Next.js, TypeScript, Tailwind CSS, PostgreSQL, Drizzle"
                        className="h-10 rounded-xl bg-[#0C0E18] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40"
                        {...field}
                      />
                    </FormControl>
                    {parsedTechList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parsedTechList.map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-[10px] bg-primary/10 border border-primary/20 text-indigo-300 rounded-md font-mono px-2 py-0.5"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Project Cover Showcase */}
              <FormField
                control={form.control}
                name="image"
                render={() => (
                  <FormItem className="space-y-2 rounded-xl bg-[#131726]/60 border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Project Cover Showcase</span>
                      </FormLabel>
                      <span className="text-[10px] text-slate-500">16:9 aspect ratio recommended (1200 × 675px)</span>
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        <Input
                          placeholder="https://... or /images/projects/..."
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

              {/* Project Summary with Nested Resizer */}
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-200 text-xs font-semibold">
                        Project Summary / Value Proposition *
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
                          placeholder="A concise, high-impact summary of the project architecture, target audience, and business outcomes..."
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

          {/* Card 2: Full-Width Case Study Narrative Studio (MDX) */}
          <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Case Study Description (MDX) Studio</span>
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">
                  Full-width Monaco editor with real-time side-by-side preview & flexible tabs
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Architecture Blueprints, Metrics & Codeblocks</span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormControl>
                      <MDXEditor
                        value={field.value}
                        initialCode={descriptionValues}
                        height="580px"
                        onChange={(code) => field.onChange(code)}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Showcase & Storytelling Tips Footer */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Highlight quantitative metrics (e.g. 40% latency reduction, 99.9% uptime, or cost optimizations).
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
                  ? "Project is set to be publicly visible on your portfolio showcase."
                  : "Project is in private draft mode and only visible to you in CMS."}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/cms/projects")}
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
                    <span>Saving Project...</span>
                  </>
                ) : (
                  <>
                    {watchedIsPublished ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-300" />
                        <span>Publish Project</span>
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

      {/* Draft Project Case Study Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="max-w-2xl bg-[#0C0E18] border-white/[0.08] text-slate-200">
          <DialogHeader>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <Brain className="h-4 w-4" />
              <span>Second Brain Portfolio Architect</span>
            </div>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <span>Synthesize Project Case Study</span>
              <Sparkles className="h-4 w-4 text-amber-400" />
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Formulate a structured engineering case study (Architecture, Implementation, STAR Challenges, XYZ Metrics) grounded in your verified Second Brain knowledge entries.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">Project Focus / Name (Optional)</label>
                <Input
                  placeholder="e.g. Real-Time Distributed Analytics Engine"
                  value={projectTitlePrompt}
                  onChange={(e) => setProjectTitlePrompt(e.target.value)}
                  className="h-9 bg-[#131726] border-white/[0.08] text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">Technologies / Stack (Optional)</label>
                <Input
                  placeholder="e.g. Next.js, Go, PostgreSQL, Redis, Kafka"
                  value={technologiesPrompt}
                  onChange={(e) => setTechnologiesPrompt(e.target.value)}
                  className="h-9 bg-[#131726] border-white/[0.08] text-xs text-white"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleDraftCaseStudyWithSecondBrain}
              disabled={isDrafting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs h-9 rounded-xl shadow-md"
            >
              {isDrafting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Synthesizing Architectural Case Study...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2 text-amber-300" />
                  <span>{draftResult ? "Re-generate Case Study" : "Generate Case Study from Second Brain"}</span>
                </>
              )}
            </Button>

            {/* Generated Result Preview */}
            {draftResult && (
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                {draftResult.matchedSecondBrainTopics.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-purple-400">Referenced Second Brain Knowledge:</span>
                    <div className="flex flex-wrap gap-1">
                      {draftResult.matchedSecondBrainTopics.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px] px-2 py-0.5">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="text-xs font-bold text-white">{draftResult.title}</div>
                  <div className="text-[11px] text-slate-300 italic">{draftResult.summary}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Technologies: {draftResult.technologies}</div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>Generated Case Study (MDX):</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(draftResult.description);
                        toast.success("Case study copied to clipboard!");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy MDX
                    </Button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#131726] border border-purple-500/30 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto custom-scrollbar">
                    {draftResult.description}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDraftDialog(false)}
              className="border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white text-xs h-9 rounded-xl"
            >
              Close
            </Button>
            {draftResult && (
              <Button
                type="button"
                onClick={handleApplyDraft}
                className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-primary/20"
              >
                Apply Case Study to Studio
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
