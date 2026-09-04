"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Save,
  Settings2,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
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
import { processStepsService, type ProcessScope } from "@/services";

// Radix Select forbids empty-string values, so "no icon" travels as "none".
const NO_ICON = "none";

const processStepSchema = z.object({
  scope: z.enum(["services", "hire-me"]),
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().min(2, { message: "Description is required" }),
  icon: z.string().default(NO_ICON),
  sortOrder: z.number().int(),
  isPublished: z.boolean().default(true),
});

type ProcessStepFormValues = z.infer<typeof processStepSchema>;

export function ProcessStepsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // `/cms/process-steps` links here with the tab the owner was looking at.
  const initialScope: ProcessScope =
    searchParams.get("scope") === "hire-me" ? "hire-me" : "services";

  const form = useForm<ProcessStepFormValues>({
    resolver: zodResolver(processStepSchema),
    defaultValues: {
      scope: initialScope,
      title: "",
      description: "",
      icon: NO_ICON,
      sortOrder: 0,
      isPublished: true,
    },
  });

  const selectedIcon = form.watch("icon");
  const SelectedIcon = selectedIcon !== NO_ICON ? getContentIcon(selectedIcon) : null;
  const currentScope = form.watch("scope");

  useEffect(() => {
    const fetchStep = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const step = await processStepsService.getById(id);
        if (step) {
          form.reset({
            scope: step.scope,
            title: step.title,
            description: step.description,
            icon: step.icon ?? NO_ICON,
            sortOrder: step.sortOrder,
            isPublished: step.isPublished,
          });
        } else {
          toast.error("Step not found");
          router.push("/cms/process-steps");
        }
      } catch (error) {
        console.error("Error loading process step:", error);
        toast.error("Failed to load step");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStep();
  }, [id, form, router]);

  const onSubmit = async (data: ProcessStepFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        scope: data.scope,
        title: data.title.trim(),
        description: data.description.trim(),
        icon: data.icon === NO_ICON ? undefined : data.icon,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      };

      if (isEditMode && id) {
        await processStepsService.update(id, payload);
        toast.success("Step updated successfully!");
      } else {
        await processStepsService.create(payload);
        toast.success("Step created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["cmsProcessSteps"] });
      router.push("/cms/process-steps");
    } catch (error) {
      console.error("Error saving process step:", error);
      toast.error("Failed to save step. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <span className="ml-2 text-lg text-slate-300">Loading step...</span>
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
            <Link href="/cms/process-steps">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {isEditMode ? "Edit Process Step" : "New Process Step"}
              </h1>
              <Badge
                variant="outline"
                className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs font-mono"
              >
                /{currentScope}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Configure progression card title, description, and display order
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
                    <Workflow className="h-5 w-5 mr-2 text-indigo-400" />
                    Process Step Details
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
                              ? "This step is live on the public page"
                              : "This step stays hidden from the public page"}
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

                  <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                          Target Scope / Page
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40">
                              <SelectValue placeholder="Select a scope" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200">
                            <SelectItem value="services">Services (/services)</SelectItem>
                            <SelectItem value="hire-me">Hire Me (/hire-me)</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Which page&apos;s how-it-works section this step belongs to.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                          Step Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Discovery Call"
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="We start with a quick call to understand your goals and scope."
                            className="min-h-28 bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center">
                          Icon
                          {SelectedIcon && <SelectedIcon className="h-4 w-4 ml-2 text-indigo-400" />}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40">
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200 max-h-64">
                            <SelectItem value={NO_ICON}>None (numbered step)</SelectItem>
                            {contentIconNames.map((name) => {
                              const Icon = getContentIcon(name);
                              return (
                                <SelectItem key={name} value={name}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-indigo-400" />
                                    <span>{name}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Optional. Step numbers (01, 02, …) are derived from the display order
                          automatically.
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
                      <Settings2 className="h-4 w-4 mr-2 text-indigo-400" />
                      Display & Ordering
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
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
                            Lower numbers appear first. Step numbers (01, 02, …) follow this order
                            automatically.
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
                                Publish Step
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

                <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-4">
                    <CardTitle className="text-xs font-semibold flex items-center text-slate-100 uppercase tracking-wider">
                      <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />
                      Process Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-xs space-y-2.5 text-slate-400">
                      <p>
                        <span className="font-semibold text-slate-200">Numbering:</span> Step
                        numbers (01, 02, …) are derived from the display order automatically.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-200">Icons:</span> The /services
                        set renders numbers instead of icons, so &ldquo;None&rdquo; is a fine choice there.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-200">Scope:</span> Each page owns
                        its own set of steps — switch the scope to move a step between pages.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-200">Hidden:</span> Use the
                        publication toggle to keep a step out of the public page without deleting it.
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
