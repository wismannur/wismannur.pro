"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Info, Loader2, Save, Settings2, Workflow } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading step...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Process Step" : "Add Process Step"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-x-0 border-b-0 sm:border-border/50 shadow-none sm:shadow-md rounded-none sm:rounded-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/30 px-0 py-4 sm:p-6">
                  <CardTitle className="flex items-center">
                    <Workflow className="h-5 w-5 mr-2 text-primary" />
                    Process Step Details
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
                              ? "This step appears on the public page"
                              : "This step stays hidden from the public page"}
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
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-medium">Scope</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg border-border/50">
                              <SelectValue placeholder="Select a scope" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="services">Services (/services)</SelectItem>
                            <SelectItem value="hire-me">Hire Me (/hire-me)</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground mt-1">
                          Which page's how-it-works section this step belongs to.
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
                        <FormLabel className="text-foreground/80 font-medium">Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Discovery Call"
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
                            placeholder="We start with a quick call to understand your goals and scope."
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
                            <SelectItem value={NO_ICON}>None (numbered step)</SelectItem>
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
                        <div className="text-xs text-muted-foreground mt-1">
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
                            Lower numbers appear first. Step numbers (01, 02, …) follow this order
                            automatically.
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

                <Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/30 py-3">
                    <CardTitle className="text-sm flex items-center">
                      <Info className="h-4 w-4 mr-2 text-primary" />
                      Process Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <p>
                        <span className="font-semibold">Numbering:</span> Step numbers (01, 02, …)
                        are derived from the display order automatically — no need to put them in
                        the title
                      </p>
                      <p>
                        <span className="font-semibold">Icons:</span> The /services set renders
                        numbers instead of icons, so "None" is a fine choice there
                      </p>
                      <p>
                        <span className="font-semibold">Scope:</span> Each page owns its own set of
                        steps — switch the scope to move a step between pages
                      </p>
                      <p>
                        <span className="font-semibold">Hidden:</span> Use the publication toggle to
                        keep a step out of the public page without deleting it
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
