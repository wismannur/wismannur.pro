"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Info, Loader2, Quote, Save, Star } from "lucide-react";
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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading testimonial...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Testimonial" : "Add Testimonial"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-x-0 border-b-0 sm:border-border/50 shadow-none sm:shadow-md rounded-none sm:rounded-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/30 px-0 py-4 sm:p-6">
                  <CardTitle className="flex items-center">
                    <Quote className="h-5 w-5 mr-2 text-primary" />
                    Testimonial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 px-0 py-4 sm:p-6">
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publication Status</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            {field.value
                              ? "This testimonial appears on /hire-me"
                              : "Draft — the /hire-me testimonials section only shows when at least one testimonial is published"}
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
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">
                          Author Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane Doe"
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
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
                        <FormLabel className="text-foreground/80 font-medium">
                          Author Role
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CTO at Acme Inc."
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">Quote</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={5}
                            placeholder="Working together was a great experience…"
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
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
                        <FormLabel className="text-foreground/80 font-medium">Avatar URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://… (optional)"
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Optional. Leave empty to show the testimonial without a photo.
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
                <Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/30 py-4">
                    <CardTitle className="text-base flex items-center">
                      <Star className="h-4 w-4 mr-2 text-primary" />
                      Rating & Display
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 font-medium">Rating</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={String(field.value)}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-lg border-border/50">
                                <SelectValue placeholder="Select a rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                              <SelectItem value="4">4 - Great</SelectItem>
                              <SelectItem value="3">3 - Good</SelectItem>
                              <SelectItem value="2">2 - Fair</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
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
                          <FormLabel className="text-foreground/80 font-medium">
                            Display Order
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground mt-1">
                            Lower numbers appear first in the testimonials section.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="px-6 py-4 bg-muted/20 border-t border-border/30">
                    <Button
                      type="submit"
                      className="w-full rounded-lg group relative overflow-hidden"
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

                <Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/30 py-3">
                    <CardTitle className="text-sm flex items-center">
                      <Info className="h-4 w-4 mr-2 text-primary" />
                      Testimonial Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <p>
                        <span className="font-semibold">Drafts:</span> New testimonials start hidden
                        so you can review them before they go live
                      </p>
                      <p>
                        <span className="font-semibold">Section:</span> The /hire-me testimonials
                        section only renders when at least one testimonial is published
                      </p>
                      <p>
                        <span className="font-semibold">Quote:</span> Short, specific quotes about
                        results read better than generic praise
                      </p>
                      <p>
                        <span className="font-semibold">Avatar:</span> Use a square image URL for
                        the cleanest look — it is optional
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
