"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Quote,
  Save,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { testimonialsService } from "@/services";

const testimonialSchema = z.object({
  authorName: z.string().min(1, { message: "Author name is required" }),
  authorRole: z.string().min(1, { message: "Author role is required" }),
  quote: z.string().min(1, { message: "Quote is required" }),
  avatarUrl: z.string().optional(),
  rating: z.number().int().min(1).max(5).default(5),
  sortOrder: z.number().int(),
  isPublished: z.boolean().default(false),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

export function TestimonialsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      authorName: "",
      authorRole: "",
      quote: "",
      avatarUrl: "",
      rating: 5,
      sortOrder: 0,
      // Testimonials start as drafts — publish deliberately once reviewed.
      isPublished: false,
    },
  });

  useEffect(() => {
    const fetchTestimonial = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const testimonial = await testimonialsService.getById(id);
        if (testimonial) {
          form.reset({
            authorName: testimonial.authorName,
            authorRole: testimonial.authorRole,
            quote: testimonial.quote,
            avatarUrl: testimonial.avatarUrl ?? "",
            rating: testimonial.rating,
            sortOrder: testimonial.sortOrder,
            isPublished: testimonial.isPublished,
          });
        } else {
          toast.error("Testimonial not found");
          router.push("/cms/testimonials");
        }
      } catch (error) {
        console.error("Error loading testimonial:", error);
        toast.error("Failed to load testimonial");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonial();
  }, [id, form, router]);

  const onSubmit = async (data: TestimonialFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        authorName: data.authorName.trim(),
        authorRole: data.authorRole.trim(),
        quote: data.quote.trim(),
        avatarUrl: data.avatarUrl?.trim() || undefined,
        rating: data.rating,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      };

      if (isEditMode && id) {
        await testimonialsService.update(id, payload);
        toast.success("Testimonial updated successfully!");
      } else {
        await testimonialsService.create(payload);
        toast.success("Testimonial created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["cmsTestimonials"] });
      router.push("/cms/testimonials");
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast.error("Failed to save testimonial. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <span className="ml-2 text-lg text-slate-300">Loading testimonial...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-[#131726]/80 border-white/[0.08] text-slate-400 hover:text-slate-100 rounded-xl"
          >
            <Link href="/cms/testimonials">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {isEditMode ? "Edit Testimonial" : "New Testimonial"}
            </h1>
            <p className="text-xs text-slate-400">
              Manage client feedback, rating stars, author credentials, and placement
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-6">
                  <CardTitle className="flex items-center text-lg text-slate-100">
                    <Quote className="h-5 w-5 mr-2 text-indigo-400" />
                    Testimonial Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl bg-[#131726]/60 border border-white/[0.06] p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold text-slate-200">
                            Publication Status
                          </FormLabel>
                          <div className="text-xs text-slate-400">
                            {field.value
                              ? "This testimonial appears on /hire-me"
                              : "Draft — the /hire-me testimonials section only shows when at least one testimonial is published"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="authorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            Author Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jane Doe"
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="authorRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            Author Role & Company
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="CTO at Acme Inc."
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="quote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                          Client Quote
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={5}
                            placeholder="Working together was a great experience…"
                            className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                          Avatar Image URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://… (optional)"
                            className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Optional. Leave empty to show initials avatar instead.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="space-y-6 sticky top-24">
                <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-4">
                    <CardTitle className="text-sm font-semibold flex items-center text-slate-100">
                      <Star className="h-4 w-4 mr-2 text-amber-400 fill-amber-400" />
                      Rating & Display
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            Rating Stars
                          </FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={String(field.value)}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40">
                                <SelectValue placeholder="Select a rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200">
                              <SelectItem value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</SelectItem>
                              <SelectItem value="4">⭐⭐⭐⭐ (4 - Great)</SelectItem>
                              <SelectItem value="3">⭐⭐⭐ (3 - Good)</SelectItem>
                              <SelectItem value="2">⭐⭐ (2 - Fair)</SelectItem>
                              <SelectItem value="1">⭐ (1 - Poor)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            Display Order
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 focus-visible:ring-indigo-500/40 rounded-xl"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Lower numbers appear first in the testimonials section.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="px-6 py-4 bg-[#131726]/40 border-t border-white/[0.08]">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-semibold group relative overflow-hidden"
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
                                Publish Testimonial
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

                <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-4">
                    <CardTitle className="text-xs font-semibold flex items-center text-slate-100 uppercase tracking-wider">
                      <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />
                      Testimonial Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-xs space-y-2.5 text-slate-400">
                      <p>
                        <span className="font-semibold text-slate-200">Drafts:</span> New testimonials
                        start hidden so you can review and format them before going live.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-200">Section:</span> The /hire-me
                        testimonials block only renders when at least one testimonial is published.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-200">Quote:</span> Specific quotes
                        highlighting project outcomes build greater trust.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-200">Avatar:</span> Use a square
                        photo URL for the best aesthetic.
                      </p>
                    </div>
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
