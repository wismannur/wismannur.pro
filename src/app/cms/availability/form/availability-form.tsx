"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
	ArrowRight,
	Calendar,
	CalendarDays,
	Check,
	Info,
	Loader2,
	Save,
	Settings2,
} from "lucide-react";
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
	month: z
		.number()
		.int()
		.min(1, { message: "Pick a month" })
		.max(12, { message: "Pick a month" }),
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
		month >= 1 && month <= 12 && year
			? `${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`
			: null;

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
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
				<span className="ml-2 text-lg">Loading slot...</span>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto">
			<div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-6 sm:mb-8">
				<h1 className="text-3xl font-bold">
					{isEditMode ? "Edit Availability Slot" : "Add Availability Slot"}
				</h1>
				{monthPreview && (
					<div className="flex items-center text-muted-foreground">
						<Calendar className="h-4 w-4 mr-1.5" />
						<span className="text-sm">Shown as: {monthPreview}</span>
					</div>
				)}
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2">
							<Card className="border-x-0 border-b-0 sm:border-border/50 shadow-none sm:shadow-md rounded-none sm:rounded-xl overflow-hidden">
								<CardHeader className="bg-muted/30 border-b border-border/30 px-0 py-4 sm:p-6">
									<CardTitle className="flex items-center">
										<CalendarDays className="h-5 w-5 mr-2 text-primary" />
										Availability Slot
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
															? "This slot appears on your hire-me page"
															: "This slot stays hidden from your hire-me page"}
													</div>
												</div>
												<FormControl>
													<Switch checked={field.value} onCheckedChange={field.onChange} />
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
													<FormLabel className="text-foreground/80 font-medium">Month</FormLabel>
													<Select
														onValueChange={(value) => field.onChange(Number(value))}
														value={String(field.value)}
													>
														<FormControl>
															<SelectTrigger className="rounded-lg border-border/50">
																<SelectValue placeholder="Select month" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
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
													<FormLabel className="text-foreground/80 font-medium">Year</FormLabel>
													<FormControl>
														<Input
															type="number"
															min={2020}
															max={2100}
															className="rounded-lg border-border/50 focus-visible:ring-primary/30"
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
												<FormLabel className="text-foreground/80 font-medium">Status</FormLabel>
												<Select onValueChange={field.onChange} value={field.value}>
													<FormControl>
														<SelectTrigger className="rounded-lg border-border/50">
															<SelectValue placeholder="Select status" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="available">Available</SelectItem>
														<SelectItem value="limited">Limited</SelectItem>
														<SelectItem value="booked">Booked</SelectItem>
													</SelectContent>
												</Select>
												<div className="text-xs text-muted-foreground mt-1">
													Controls the badge color of the slot on /hire-me.
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
												<FormLabel className="text-foreground/80 font-medium">Label</FormLabel>
												<FormControl>
													<Input
														placeholder="Available"
														className="rounded-lg border-border/50 focus-visible:ring-primary/30"
														{...field}
													/>
												</FormControl>
												<div className="text-xs text-muted-foreground mt-1">
													Badge text shown on the slot, e.g. Available / Limited Availability /
													Fully Booked
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
														Slots with a lower number show first on the hire-me page.
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

								<Card className="border-border/50 shadow-md rounded-xl overflow-hidden">
									<CardHeader className="bg-muted/30 border-b border-border/30 py-3">
										<CardTitle className="text-sm flex items-center">
											<Info className="h-4 w-4 mr-2 text-primary" />
											Availability Tips
										</CardTitle>
									</CardHeader>
									<CardContent className="p-4">
										<div className="text-xs space-y-2 text-muted-foreground">
											<p>
												<span className="font-semibold">Status:</span> "Available" renders the
												primary badge, "Limited" the secondary one and "Booked" the outline one
											</p>
											<p>
												<span className="font-semibold">Label:</span> Free text — keep it short so
												the badge stays on one line
											</p>
											<p>
												<span className="font-semibold">Horizon:</span> Publish only the next few
												months so the page stays believable
											</p>
											<p>
												<span className="font-semibold">Hidden:</span> Use the publication toggle
												to keep a slot out of the public page without deleting it
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
