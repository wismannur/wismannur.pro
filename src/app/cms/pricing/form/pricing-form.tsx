"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Info, Loader2, Save, Settings2, Tag } from "lucide-react";
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
import { pricingTiersService } from "@/services";

const pricingSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  slug: z
    .string()
    .min(2, { message: "Slug must be at least 2 characters" })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message: "Use lowercase letters, numbers and dashes (kebab-case)",
    }),
  priceLabel: z.string().min(1, { message: "Price label is required" }),
  description: z.string().min(2, { message: "Description is required" }),
  features: z.string().optional(),
  isPopular: z.boolean().default(false),
  ctaLabel: z.string().min(1, { message: "CTA label is required" }),
  sortOrder: z.number().int(),
  isPublished: z.boolean().default(true),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

export function PricingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      name: "",
      slug: "",
      priceLabel: "",
      description: "",
      features: "",
      isPopular: false,
      ctaLabel: "",
      sortOrder: 0,
      isPublished: true,
    },
  });

  useEffect(() => {
    const fetchTier = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const tier = await pricingTiersService.getById(id);
        if (tier) {
          form.reset({
            name: tier.name,
            slug: tier.slug,
            priceLabel: tier.priceLabel,
            description: tier.description,
            features: tier.features.join("\n"),
            isPopular: tier.isPopular,
            ctaLabel: tier.ctaLabel,
            sortOrder: tier.sortOrder,
            isPublished: tier.isPublished,
          });
        } else {
          toast.error("Tier not found");
          router.push("/cms/pricing");
        }
      } catch (error) {
        console.error("Error loading pricing tier:", error);
        toast.error("Failed to load tier");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTier();
  }, [id, form, router]);

  const onSubmit = async (data: PricingFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        priceLabel: data.priceLabel.trim(),
        description: data.description.trim(),
        features: (data.features ?? "")
          .split("\n")
          .map((feature) => feature.trim())
          .filter(Boolean),
        isPopular: data.isPopular,
        ctaLabel: data.ctaLabel.trim(),
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      };

      if (isEditMode && id) {
        await pricingTiersService.update(id, payload);
        toast.success("Tier updated successfully!");
      } else {
        await pricingTiersService.create(payload);
        toast.success("Tier created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["cmsPricingTiers"] });
      router.push("/cms/pricing");
    } catch (error) {
      console.error("Error saving pricing tier:", error);
      toast.error("Failed to save tier. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading tier...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Pricing Tier" : "Add Pricing Tier"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-x-0 border-b-0 sm:border-border/50 shadow-none sm:shadow-md rounded-none sm:rounded-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/30 px-0 py-4 sm:p-6">
                  <CardTitle className="flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-primary" />
                    Pricing Tier Details
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
                              ? "This tier appears on /hire-me"
                              : "This tier stays hidden from /hire-me"}
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Starter"
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
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">Slug</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="starter"
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Lowercase kebab-case identifier, e.g. "starter-package".
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">
                          Price Label
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="$499"
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Perfect for small landing pages and quick launches."
                            className="min-h-24 rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">
                          Features (one per line)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={"Up to 5 pages\n2 revision rounds\n1 week delivery"}
                            className="min-h-32 rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Each line becomes a bullet point on the pricing card.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ctaLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">CTA Label</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Get Started"
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Text on the card's call-to-action button.
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
                      <Settings2 className="h-4 w-4 mr-2 text-primary" />
                      Display
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <FormField
                      control={form.control}
                      name="isPopular"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Popular</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Highlights this tier with a "Popular" badge
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
                            Lower numbers appear first.
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
                                Publish Tier
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

                <Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/30 py-3">
                    <CardTitle className="text-sm flex items-center">
                      <Info className="h-4 w-4 mr-2 text-primary" />
                      Pricing Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <p>
                        <span className="font-semibold">Popular:</span> Mark at most one tier as
                        popular so the highlight stays meaningful
                      </p>
                      <p>
                        <span className="font-semibold">Features:</span> Keep them short — one
                        benefit per line reads best on the cards
                      </p>
                      <p>
                        <span className="font-semibold">Price label:</span> Free text, so "From
                        $499" or "Custom quote" both work
                      </p>
                      <p>
                        <span className="font-semibold">Hidden:</span> Use the publication toggle to
                        keep a tier out of /hire-me without deleting it
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
