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
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <span className="ml-2 text-lg text-slate-300">Loading service...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            {isEditMode ? "Edit Service" : "Add Service"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure client service offerings, pricing tiers, and deliverables
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
                    <LayoutGrid className="h-4 w-4 mr-2 text-indigo-400" />
                    Service Offering Details
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
                              ? "Live on public pages"
                              : "Hidden from visitors (draft)"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-200">Service Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Full-Stack Web Architecture"
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
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-200">URL Slug</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="web-architecture"
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40 font-mono"
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-200">
                          Short Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="High-performance, scalable web systems crafted with Next.js and Go."
                            className="min-h-20 bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Concise summary shown on /services cards and /hire-me tabs
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
                        <FormLabel className="text-sm font-semibold text-slate-200">
                          Extended Pitch (Home Page)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed value proposition and architecture workflow for the landing page…"
                            className="min-h-24 bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Optional expanded narrative shown in the homepage feature grid
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-200 flex items-center">
                            Service Icon
                            {SelectedIcon && <SelectedIcon className="h-4 w-4 ml-2 text-indigo-400" />}
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40">
                                <SelectValue placeholder="Select an icon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0C0E18] border-white/[0.08] text-slate-200 max-h-60">
                              {contentIconNames.map((name) => {
                                const Icon = getContentIcon(name);
                                return (
                                  <SelectItem key={name} value={name} className="hover:bg-white/[0.06] cursor-pointer">
                                    <Icon className="h-4 w-4 mr-2 inline text-indigo-400" />
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
                          <FormLabel className="text-sm font-semibold text-slate-200">
                            Pricing Label
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. $4,000 / project or $75/hr"
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40"
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
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-200">
                          Deliverables & Features (One per line)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={"Production-ready Next.js 15 App Router\nClean architecture & TypeScript\n95+ Core Web Vitals score\nCI/CD pipelines included"}
                            className="min-h-32 bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500/40 font-mono text-xs leading-relaxed"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Each line renders as a bullet item in the feature checklist.
                        </div>
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
                      <Eye className="h-4 w-4 mr-2 text-indigo-400" />
                      Visibility & Sorting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6">
                    <FormField
                      control={form.control}
                      name="showOnHome"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/[0.06] bg-[#131726]/60 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-200">Show on Home</FormLabel>
                            <div className="text-xs text-slate-400">
                              Landing page feature grid
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
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/[0.06] bg-[#131726]/60 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-200">Show on Hire Me</FormLabel>
                            <div className="text-xs text-slate-400">
                              /hire-me request selection
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
                            Lower numbers appear first on the service lists.
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

                <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/[0.06] py-3 px-6">
                    <CardTitle className="text-xs font-semibold flex items-center text-slate-300">
                      <Info className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                      Service Catalog Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-xs text-slate-400">
                    <p>
                      <span className="text-slate-200 font-medium">Pricing:</span> Provide clear scope ranges (e.g., "$3k - $8k" or "$50/hr") to qualify prospective leads.
                    </p>
                    <p>
                      <span className="text-slate-200 font-medium">Features:</span> Highlight guarantees, turnaround times, and tech stack stackings.
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

