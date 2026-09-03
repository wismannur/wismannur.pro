"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Eye, Info, LayoutGrid, Loader2, Save } from "lucide-react";
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
import { contentIconNames, getContentIcon } from "@/lib/icon-registry";
import { serviceCatalogService } from "@/services";

const serviceCatalogSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  slug: z
    .string()
    .min(2, { message: "Slug must be at least 2 characters" })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message: "Use lowercase letters, numbers and dashes (kebab-case)",
    }),
  description: z.string().min(2, { message: "Description is required" }),
  longDescription: z.string().optional(),
  icon: z.string().min(1, { message: "Pick an icon" }),
  priceLabel: z.string().min(1, { message: "Price label is required" }),
  features: z.string().optional(),
  showOnHome: z.boolean().default(true),
  showOnHireMe: z.boolean().default(true),
  sortOrder: z.number().int(),
  isPublished: z.boolean().default(true),
});

type ServiceCatalogFormValues = z.infer<typeof serviceCatalogSchema>;

export function ServiceCatalogForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const form = useForm<ServiceCatalogFormValues>({
    resolver: zodResolver(serviceCatalogSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      longDescription: "",
      icon: "",
      priceLabel: "",
      features: "",
      showOnHome: true,
      showOnHireMe: true,
      sortOrder: 0,
      isPublished: true,
    },
  });

  const selectedIcon = form.watch("icon");
  const SelectedIcon = selectedIcon ? getContentIcon(selectedIcon) : null;

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const service = await serviceCatalogService.getById(id);
        if (service) {
          form.reset({
            title: service.title,
            slug: service.slug,
            description: service.description,
            longDescription: service.longDescription ?? "",
            icon: service.icon,
            priceLabel: service.priceLabel,
            features: service.features.join("\n"),
            showOnHome: service.showOnHome,
            showOnHireMe: service.showOnHireMe,
            sortOrder: service.sortOrder,
            isPublished: service.isPublished,
          });
        } else {
          toast.error("Service not found");
          router.push("/cms/service-catalog");
        }
      } catch (error) {
        console.error("Error loading service:", error);
        toast.error("Failed to load service");
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [id, form, router]);

  const onSubmit = async (data: ServiceCatalogFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        longDescription: data.longDescription?.trim() || undefined,
        icon: data.icon,
        priceLabel: data.priceLabel.trim(),
        features: (data.features ?? "")
          .split("\n")
          .map((feature) => feature.trim())
          .filter(Boolean),
        showOnHome: data.showOnHome,
        showOnHireMe: data.showOnHireMe,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      };

      if (isEditMode && id) {
        await serviceCatalogService.update(id, payload);
        toast.success("Service updated successfully!");
      } else {
        await serviceCatalogService.create(payload);
        toast.success("Service created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["cmsServiceCatalog"] });
      router.push("/cms/service-catalog");
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Failed to save service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading service...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold">{isEditMode ? "Edit Service" : "Add Service"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-x-0 border-b-0 sm:border-border/50 shadow-none sm:shadow-md rounded-none sm:rounded-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/30 px-0 py-4 sm:p-6">
                  <CardTitle className="flex items-center">
                    <LayoutGrid className="h-5 w-5 mr-2 text-primary" />
                    Service Details
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
                              ? "This service appears on the public pages"
                              : "This service stays hidden from the public pages"}
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
                        <FormLabel className="text-foreground/80 font-medium">Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Web Development"
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
                            placeholder="web-development"
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Lowercase kebab-case identifier, e.g. "web-development".
                        </div>
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
                            placeholder="Modern, responsive websites built with the latest technologies."
                            className="min-h-24 rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Short description shown on /services and /hire-me
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">
                          Long Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A longer pitch for the home page…"
                            className="min-h-24 rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Longer variant shown on the home page; falls back to the short description
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium flex items-center">
                          Icon
                          {SelectedIcon && <SelectedIcon className="h-4 w-4 ml-2 text-primary" />}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg border-border/50">
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contentIconNames.map((name) => {
                              const Icon = getContentIcon(name);
                              return (
                                <SelectItem key={name} value={name}>
                                  <Icon className="h-4 w-4 mr-2 inline" />
                                  {name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
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
                            placeholder="$15/hour"
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
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">
                          Features (one per line)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={"Responsive design\nSEO optimization\nFast performance"}
                            className="min-h-32 rounded-lg border-border/50 focus-visible:ring-primary/30"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Each line becomes a bullet point on the service card.
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
                      <Eye className="h-4 w-4 mr-2 text-primary" />
                      Visibility & Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <FormField
                      control={form.control}
                      name="showOnHome"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show on Home</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Appears in the "What I Do" grid
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
                      name="showOnHireMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show on Hire Me</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Appears in the /hire-me expertise tab
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
                                Publish Service
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
                      Service Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <p>
                        <span className="font-semibold">Descriptions:</span> The short description
                        is used on /services and /hire-me; the long one only on the home page
                      </p>
                      <p>
                        <span className="font-semibold">Features:</span> Keep them short — one
                        benefit per line reads best on the cards
                      </p>
                      <p>
                        <span className="font-semibold">Visibility:</span> The switches control
                        where the service appears; publication controls whether it appears at all
                      </p>
                      <p>
                        <span className="font-semibold">Hidden:</span> Use the publication toggle to
                        keep a service out of the public pages without deleting it
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
