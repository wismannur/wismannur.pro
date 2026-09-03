"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const onSubmit = async (values: KnowledgeFormValues) => {
    setIsSubmitting(true);
    try {
      const parsedTags = values.tagsString
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
          tags: parsedTags,
          isPublished: values.isPublished,
          sortOrder: values.sortOrder,
        });
        toast.success("Knowledge item updated successfully.");
      } else {
        await createAiKnowledgeItem({
          category: values.category,
          title: values.title,
          content: values.content,
          tags: parsedTags,
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
      <div className="flex flex-col items-center justify-center p-12 text-sm text-muted-foreground gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Loading knowledge item details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Link & Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/cms/ai-knowledge">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Edit AI Knowledge Item" : "New AI Knowledge Item"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditMode
              ? "Update context and insights for Wisman's AI Assistant"
              : "Add deep context, screening answers, or engineering philosophies"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="border-border/70 shadow-xs">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Knowledge Details</CardTitle>
                  <CardDescription className="text-xs">
                    This content will be injected directly into the Gemini AI system prompt.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Category Selector */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AI_KNOWLEDGE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                <div className="flex flex-col text-left">
                                  <span className="font-semibold">{cat.label}</span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {cat.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Title / Question Topic</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Timezone Overlap & US/EU Working Hours"
                            className="text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          A clear summary title of what this insight covers.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Markdown Content */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Detailed Insight & Context (Markdown Supported)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide deep facts, philosophies, metrics, or recruiter answers that Wisman's AI Assistant should know..."
                            className="text-xs font-mono min-h-[180px] leading-relaxed"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          Be specific with facts, achievements, metrics, tech stack choices, or exact policies.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  <FormField
                    control={form.control}
                    name="tagsString"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Tags (Comma-separated)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. timezone, contract, b2b, remote"
                            className="text-xs font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sort Order & Publish Switch */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Sort Order</FormLabel>
                          <FormControl>
                            <Input type="number" className="text-xs" {...field} />
                          </FormControl>
                          <FormDescription className="text-[10px]">
                            Lower numbers appear first in the prompt.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 p-3 shadow-xs">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs font-semibold">Active in AI</FormLabel>
                            <FormDescription className="text-[10px]">
                              When active, AI includes this in its prompt.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t border-border/50 pt-4">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link href="/cms/ai-knowledge">Cancel</Link>
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5 text-xs">
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {isEditMode ? "Save Changes" : "Create Item"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        {/* Sidebar Help Card */}
        <div className="space-y-4">
          <Card className="border-border/70 bg-muted/20 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                <Sparkles className="w-4 h-4" /> AI Knowledge Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>What makes good AI Knowledge?</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-[11px]">
                <li>
                  <strong>Direct Screening Answers:</strong> Notice period, timezone flexibility (e.g. 4 hours US overlap), preferred contract type (B2B/Deel).
                </li>
                <li>
                  <strong>Architecture Decisions:</strong> Why you choose Bloc vs Riverpod, Next.js App Router vs Pages, Serverless vs Docker.
                </li>
                <li>
                  <strong>Measurable Outcomes:</strong> Scale handled (e.g., 50k DAU), performance gains (e.g., 40% latency reduction).
                </li>
                <li>
                  <strong>Consulting Workflow:</strong> How you run code audits, MVP builds, or team workshops.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/40 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Instant Cache Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-muted-foreground leading-normal">
              Whenever you save changes here, the server automatically flushes the in-memory prompt cache. Your next chat interaction will reflect these updates immediately.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
