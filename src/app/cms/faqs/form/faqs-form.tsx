"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, HelpCircle, Info, ListOrdered, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { faqsService } from "@/services";

const faqSchema = z.object({
  question: z.string().min(1, { message: "Question is required" }),
  answer: z.string().min(1, { message: "Answer is required" }),
  sortOrder: z.number().int(),
  isPublished: z.boolean().default(true),
});

type FaqFormValues = z.infer<typeof faqSchema>;

export function FaqsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      sortOrder: 0,
      isPublished: true,
    },
  });

  useEffect(() => {
    const fetchFaq = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const faq = await faqsService.getById(id);
        if (faq) {
          form.reset({
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
            isPublished: faq.isPublished,
          });
        } else {
          toast.error("FAQ not found");
          router.push("/cms/faqs");
        }
      } catch (error) {
        console.error("Error loading FAQ:", error);
        toast.error("Failed to load FAQ");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaq();
  }, [id, form, router]);

  const onSubmit = async (data: FaqFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        question: data.question.trim(),
        answer: data.answer.trim(),
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      };

      if (isEditMode && id) {
        await faqsService.update(id, payload);
        toast.success("FAQ updated successfully!");
      } else {
        await faqsService.create(payload);
        toast.success("FAQ created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["cmsFaqs"] });
      router.push("/cms/faqs");
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast.error("Failed to save FAQ. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <span className="ml-2 text-lg text-slate-300">Loading FAQ...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            {isEditMode ? "Edit FAQ" : "Add FAQ"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Address client objections and explain hiring or project workflows
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/[0.06] px-6 py-4">
                  <CardTitle className="flex items-center text-slate-100 text-base font-semibold">
                    <HelpCircle className="h-4 w-4 mr-2 text-indigo-400" />
                    FAQ Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
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
                            {field.value
                              ? "Visible on /services and /hire-me pages"
                              : "Hidden from public view"}
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
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-200">Question</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. How does your sprint billing cycle work?"
                            className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="answer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-200">Answer</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="We work in 2-week agile sprints with fixed deliverables, asynchronous demos, and weekly strategy syncs…"
                            className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                            {...field}
                          />
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
                      <ListOrdered className="h-4 w-4 mr-2 text-indigo-400" />
                      Display & Ordering
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6">
                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-200">
                            Display Weight
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 rounded-xl focus-visible:ring-indigo-500/40"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Lower numbers appear higher up in the accordion list.
                          </div>
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
                                Publish FAQ
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save as Hidden
                              </>
                            )}
                          </span>
                          <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-300" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/[0.06] py-3 px-6">
                    <CardTitle className="text-xs font-semibold flex items-center text-slate-300">
                      <Info className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                      FAQ Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-xs text-slate-400">
                    <p>
                      <span className="text-slate-200 font-medium">Clarity:</span> Start with a direct "Yes" or "No" before providing technical nuances.
                    </p>
                    <p>
                      <span className="text-slate-200 font-medium">Scope:</span> Answer questions on timelines, revision policies, tech stacks, and IP ownership.
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

