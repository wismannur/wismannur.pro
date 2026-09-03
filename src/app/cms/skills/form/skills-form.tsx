"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Info, ListOrdered, Loader2, Save, Wrench } from "lucide-react";
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
import { skillsService } from "@/services";

const skillSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  sortOrder: z.number().int(),
  isPublished: z.boolean().default(true),
});

type SkillFormValues = z.infer<typeof skillSchema>;

export function SkillsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: "",
      sortOrder: 0,
      isPublished: true,
    },
  });

  useEffect(() => {
    const fetchSkill = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const skill = await skillsService.getById(id);
        if (skill) {
          form.reset({
            name: skill.name,
            sortOrder: skill.sortOrder,
            isPublished: skill.isPublished,
          });
        } else {
          toast.error("Skill not found");
          router.push("/cms/skills");
        }
      } catch (error) {
        console.error("Error loading skill:", error);
        toast.error("Failed to load skill");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkill();
  }, [id, form, router]);

  const onSubmit = async (data: SkillFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      };

      if (isEditMode && id) {
        await skillsService.update(id, payload);
        toast.success("Skill updated successfully!");
      } else {
        await skillsService.create(payload);
        toast.success("Skill created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["cmsSkills"] });
      router.push("/cms/skills");
    } catch (error) {
      console.error("Error saving skill:", error);
      toast.error("Failed to save skill. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading skill...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold">{isEditMode ? "Edit Skill" : "Add Skill"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-x-0 border-b-0 sm:border-border/50 shadow-none sm:shadow-md rounded-none sm:rounded-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/30 px-0 py-4 sm:p-6">
                  <CardTitle className="flex items-center">
                    <Wrench className="h-5 w-5 mr-2 text-primary" />
                    Skill
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
                              ? "This skill appears in the grid on your about page"
                              : "This skill stays hidden from your about page"}
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
                            placeholder="TypeScript"
                            className="rounded-lg border-border/50 focus-visible:ring-primary/30"
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

            <div className="lg:col-span-1">
              <div className="space-y-6 sticky top-24">
                <Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/30 py-4">
                    <CardTitle className="text-base flex items-center">
                      <ListOrdered className="h-4 w-4 mr-2 text-primary" />
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
                            Lower numbers appear first in the skills grid.
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
                                Publish Skill
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
                      Skill Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <p>
                        <span className="font-semibold">Naming:</span> Keep names short — one
                        technology or tool per skill reads best in the grid
                      </p>
                      <p>
                        <span className="font-semibold">Order:</span> Use the display order to put
                        your strongest skills first
                      </p>
                      <p>
                        <span className="font-semibold">Hidden:</span> Use the publication toggle to
                        keep a skill out of the public page without deleting it
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
