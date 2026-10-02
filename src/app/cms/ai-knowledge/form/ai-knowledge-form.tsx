"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Brain,
  Tag,
  Briefcase,
  Cpu,
  BookOpen,
  FileQuestion,
  Layers,
  Info,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import {
  getAiKnowledgeItemById,
  createAiKnowledgeItem,
  updateAiKnowledgeItem,
} from "@/services/ai-knowledge/actions";
import { AI_KNOWLEDGE_CATEGORIES } from "@/services/ai-knowledge/types";

const knowledgeFormSchema = z.object({
  category: z.string().min(1, { message: "Category is required" }),
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  tagsString: z.string().optional(),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

type KnowledgeFormValues = z.infer<typeof knowledgeFormSchema>;

export function AiKnowledgeForm() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<KnowledgeFormValues>({
    resolver: zodResolver(knowledgeFormSchema),
    defaultValues: {
      category: "hiring",
      title: "",
      content: "",
      tagsString: "",
      isPublished: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    async function loadItem() {
      if (!id) return;
      setIsLoading(true);
      try {
        const item = await getAiKnowledgeItemById(id);
        if (!item) {
          toast.error("Knowledge item not found.");
          router.push("/cms/ai-knowledge");
          return;
        }

        form.reset({
          category: item.category,
          title: item.title,
          content: item.content,
          tagsString: (item.tags || []).join(", "),
          isPublished: item.isPublished,
          sortOrder: item.sortOrder,
        });
      } catch (error) {
        console.error("Failed to load knowledge item:", error);
        toast.error("Failed to load knowledge item.");
      } finally {
        setIsLoading(false);
      }
    }

    loadItem();
  }, [id, form, router]);

  const watchedCategory = useWatch({ control: form.control, name: "category" }) ?? "hiring";
  const watchedContent = useWatch({ control: form.control, name: "content" }) ?? "";
  const watchedTagsString = useWatch({ control: form.control, name: "tagsString" }) ?? "";
  const watchedIsPublished = useWatch({ control: form.control, name: "isPublished" }) ?? true;
  const watchedSortOrder = useWatch({ control: form.control, name: "sortOrder" }) ?? 0;

  const currentCategoryObj =
    AI_KNOWLEDGE_CATEGORIES.find((c) => c.value === watchedCategory) ||
    AI_KNOWLEDGE_CATEGORIES[0];

  const parsedTags = watchedTagsString
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const wordCount = watchedContent.trim() ? watchedContent.trim().split(/\s+/).length : 0;
  const charCount = watchedContent.length;

  const getCategoryIcon = (categoryValue: string) => {
    switch (categoryValue) {
      case "hiring":
        return <Briefcase className="w-3.5 h-3.5 text-primary" />;
      case "technical":
        return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
      case "philosophy":
        return <BookOpen className="w-3.5 h-3.5 text-indigo-400" />;
      case "screening":
        return <FileQuestion className="w-3.5 h-3.5 text-amber-400" />;
      case "projects":
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const onSubmit = async (values: KnowledgeFormValues) => {
    setIsSubmitting(true);
    try {
      const tags = values.tagsString
        ? values.tagsString
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        : [];

      if (isEditMode && id) {
        await updateAiKnowledgeItem(id, {
          category: values.category,
          title: values.title,
          content: values.content,
          tags,
          isPublished: values.isPublished,
          sortOrder: values.sortOrder,
        });
        toast.success("Knowledge item updated successfully.");
      } else {
        await createAiKnowledgeItem({
          category: values.category,
          title: values.title,
          content: values.content,
          tags,
          isPublished: values.isPublished,
          sortOrder: values.sortOrder,
        });
        toast.success("Knowledge item created successfully.");
      }

      router.push("/cms/ai-knowledge");
    } catch (error) {
      console.error("Error saving knowledge item:", error);
      toast.error("Failed to save knowledge item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <span className="text-xs text-slate-400 font-medium">Loading knowledge studio...</span>
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
          <Link href="/cms/ai-knowledge">
            <ArrowLeft className="h-4 w-4" /> Back to AI Knowledge Base
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
                <Brain size={13} className="text-primary" />
                <span>SYNTHETIC INTELLIGENCE KNOWLEDGE BASE</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Gemini System Prompt Sync Active</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                {getCategoryIcon(watchedCategory)}
                <span>{currentCategoryObj.label}</span>
              </span>
              {watchedIsPublished ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  Active in AI Prompt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                  Draft (Excluded from AI)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isEditMode ? "Edit " : "Create "}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-primary">
                AI Knowledge Item
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Inject deep domain context, screening question answers, system architecture rationales, and engineering philosophies directly into Wisman&apos;s Gemini AI Assistant.
            </p>

            {/* Quick KPI badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-gray-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <span>
                  Words: <strong className="text-white font-bold">{wordCount}</strong> &bull; {charCount} chars
                </span>
              </div>
              {parsedTags.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    Tags: <strong className="text-white font-bold">{parsedTags.length}</strong>
                  </span>
                </div>
              )}
              {watchedSortOrder !== 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Priority: <strong className="text-white font-bold">{watchedSortOrder}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons on Hero Header */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/cms/ai-knowledge")}
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
                  <Save className="w-4 h-4" />
                  <span>{isEditMode ? "Save Changes" : "Create Item"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card 1: Knowledge Classification & Prompt Priority */}
          <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-visible">
            <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span>Classification & Prompt Priority</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Row 1: Category, Active Switch & Sort Order */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Category Selector */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-slate-200 text-xs font-semibold">
                        Knowledge Category *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-[#131726] border-white/[0.08] text-slate-100 rounded-xl focus:ring-primary/40 text-xs">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200 text-xs max-h-72">
                          {AI_KNOWLEDGE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="text-xs py-2">
                              <div className="flex flex-col text-left">
                                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                                  {getCategoryIcon(cat.value)}
                                  {cat.label}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5">
                                  {cat.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-rose-400" />
                    </FormItem>
                  )}
                />

                {/* Active in AI Switch */}
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between rounded-xl bg-[#131726] border border-white/[0.06] p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Active in AI Copilot</span>
                          </FormLabel>
                          <div className="text-[11px] text-slate-400">
                            {field.value
                              ? "Injected into Gemini system prompt"
                              : "Excluded as draft"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2">
                        Turn off to temporarily hide without deleting.
                      </div>
                    </FormItem>
                  )}
                />

                {/* Prompt Priority / Sort Order */}
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-200 text-xs font-semibold">
                          Prompt Priority Weight
                        </FormLabel>
                        <span className="text-[10px] text-slate-500 font-mono">0 = Default</span>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          className="h-10 bg-[#131726] border-white/[0.08] text-slate-100 rounded-xl focus-visible:ring-primary/40 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-[11px] text-slate-500">
                        Lower values are ordered earlier in the prompt context.
                      </div>
                      <FormMessage className="text-xs text-rose-400" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Title / Question Topic */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-slate-200 text-xs font-semibold">
                      Topic Title / Question Summary *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Timezone Overlap & US/EU Working Hours or Why I Chose Next.js App Router"
                        className="h-11 rounded-xl bg-[#131726] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-medium"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-[11px] text-slate-500">
                      A clear, unambiguous title describing the insight or question topic.
                    </div>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={form.control}
                name="tagsString"
                render={({ field }) => (
                  <FormItem className="space-y-2 rounded-xl bg-[#131726]/60 border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-purple-400" />
                        <span>Semantic Retrieval Tags</span>
                      </FormLabel>
                      <span className="text-[10px] text-slate-500 font-mono">Comma-separated</span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="e.g. timezone, contract, b2b, remote, rates, nextjs, architecture"
                        className="h-10 rounded-xl bg-[#0C0E18] border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-primary/40 font-mono"
                        {...field}
                      />
                    </FormControl>
                    {parsedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parsedTags.map((tag) => (
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
            </CardContent>
          </Card>

          {/* Card 2: Detailed Insight & Context Studio (Markdown Editor) */}
          <Card className="border border-white/[0.08] bg-[#0C0E18] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-white/[0.06] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Detailed Insight & Context (Markdown Studio) *</span>
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">
                  Full-width Monaco editor with real-time markdown preview, side-by-side split, and bottom nested resizer
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Injected into Gemini AI Prompt</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormControl>
                      <MarkdownEditor
                        value={field.value}
                        onChange={field.onChange}
                        defaultHeight={400}
                        badgeLabel="AI Knowledge Context"
                        placeholder="Provide deep facts, philosophies, metrics, or recruiter answers that Wisman's AI Assistant should know..."
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Tips & Knowledge Engineering Best Practices */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span>Prompt Knowledge Engineering Tips</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                  <div>
                    <strong className="text-slate-200">&bull; Direct Screening Answers:</strong> Notice period, timezone overlap (e.g. 4 hrs US EST), preferred contract type (B2B/Deel), target compensation.
                  </div>
                  <div>
                    <strong className="text-slate-200">&bull; Architecture Decisions:</strong> Explain why you choose specific tech (e.g. Next.js App Router vs Pages, Serverless vs Docker, Drizzle vs Prisma).
                  </div>
                  <div>
                    <strong className="text-slate-200">&bull; Measurable Outcomes:</strong> Scale handled (e.g., 50k DAU), performance metrics (e.g. 40% latency reduction), cloud cost savings.
                  </div>
                  <div>
                    <strong className="text-slate-200">&bull; Instant Cache Sync:</strong> Saving here automatically flushes the server prompt cache so your next chat query reflects changes immediately.
                  </div>
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
                  ? "Knowledge item is active and will be injected into Gemini AI prompt context."
                  : "Knowledge item is saved as a private draft and excluded from AI prompt."}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/cms/ai-knowledge")}
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isEditMode ? "Save Changes" : "Create Item"}</span>
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
