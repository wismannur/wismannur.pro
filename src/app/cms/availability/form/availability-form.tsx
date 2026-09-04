"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Loader2,
  Save,
  Settings2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { availabilityService } from "@/services";

// `month` is stored as 1-12; the Select shows full month names.
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const availabilitySchema = z.object({
  month: z.number().int().min(1, { message: "Pick a month" }).max(12, { message: "Pick a month" }),
  year: z
    .number()
    .int()
    .min(2020, { message: "Year must be 2020 or later" })
    .max(2100, { message: "Year must be 2100 or earlier" }),
  status: z.enum(["available", "limited", "booked"]),
  label: z.string().min(2, { message: "Label must be at least 2 characters" }),
  sortOrder: z.number().int(),
  isPublished: z.boolean().default(true),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

export function AvailabilityForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      status: "available",
      label: "Available",
      sortOrder: 0,
      isPublished: true,
    },
  });

  const month = form.watch("month");
  const year = form.watch("year");

  // Live version of the month label /hire-me will show for this slot.
  const monthPreview =
    month >= 1 && month <= 12 && year ? `${MONTH_NAMES[month - 1].slice(0, 3)} ${year}` : null;

  useEffect(() => {
    const fetchSlot = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const slot = await availabilityService.getById(id);
        if (slot) {
          form.reset({
            month: slot.month,
            year: slot.year,
            status: slot.status,
            label: slot.label,
            sortOrder: slot.sortOrder,
            isPublished: slot.isPublished,
          });
        } else {
          toast.error("Slot not found");
          router.push("/cms/availability");
        }
      } catch (error) {
        console.error("Error loading availability slot:", error);
        toast.error("Failed to load slot");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlot();
  }, [id, form, router]);

  const onSubmit = async (data: AvailabilityFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        month: data.month,
        year: data.year,
        status: data.status,
        label: data.label.trim(),
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      };

      if (isEditMode && id) {
        await availabilityService.update(id, payload);
        toast.success("Slot updated successfully!");
      } else {
        await availabilityService.create(payload);
        toast.success("Slot created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["cmsAvailability"] });
      router.push("/cms/availability");
    } catch (error) {
      console.error("Error saving availability slot:", error);
      toast.error("Failed to save slot. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <span className="ml-2 text-lg text-slate-300">Loading slot...</span>
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
            <Link href="/cms/availability">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {isEditMode ? "Edit Availability Slot" : "New Availability Slot"}
              </h1>
              {monthPreview && (
                <Badge
                  variant="outline"
                  className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs font-mono"
                >
                  {monthPreview}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Configure open calendar slots and status labels on /hire-me
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
                    <CalendarDays className="h-5 w-5 mr-2 text-indigo-400" />
                    Availability Slot Details
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
                              ? "This slot appears on your hire-me page"
                              : "This slot stays hidden from your hire-me page"}
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
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            Month
                          </FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={String(field.value)}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40">
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200 max-h-56">
                              {MONTH_NAMES.map((name, index) => (
                                <SelectItem key={name} value={String(index + 1)}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            Year
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={2020}
                              max={2100}
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                          Availability Status
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200">
                            <SelectItem value="available">🟢 Available (Accepting Projects)</SelectItem>
                            <SelectItem value="limited">🟡 Limited (Few Slots Remaining)</SelectItem>
                            <SelectItem value="booked">🔴 Booked (Fully Booked)</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Controls the badge color and availability cue on /hire-me.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                          Badge Label
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Available"
                            className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Badge text shown on the slot, e.g. &ldquo;Available&rdquo;, &ldquo;2 Slots Left&rdquo;, or &ldquo;Fully Booked&rdquo;.
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
                            Slots with a lower number show first on the hire-me page.
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
                                Publish Slot
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
                      Availability Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-xs space-y-2.5 text-slate-400">
                      <p>
                        <span className="font-semibold text-slate-200">Status:</span> &ldquo;Available&rdquo;
                        renders the emerald badge, &ldquo;Limited&rdquo; amber, and &ldquo;Booked&rdquo; rose.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-200">Label:</span> Free text —
                        keep it short so the badge stays clean on one line.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-200">Horizon:</span> Publish the
                        next 3-6 months for the most realistic planning timeline.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-200">Hidden:</span> Use the
                        publication toggle to keep a past month out of sight without deleting it.
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
