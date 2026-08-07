"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowRight,
	Check,
	Info,
	Loader2,
	Package,
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
import { Textarea } from "@/components/ui/textarea";
import { contentIconNames, getContentIcon } from "@/lib/icon-registry";
import { queryClient } from "@/lib/query-client";
import { offersService } from "@/services";

// Prices are integer IDR, shown without decimals: "Rp5.000.000".
const idrFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

// Accent color of the offer card. Radix Select forbids empty-string values,
// so "none" stands in for "no accent" and maps to undefined on submit.
const COLOR_OPTIONS = [
	"none",
	"blue",
	"indigo",
	"violet",
	"purple",
	"emerald",
	"teal",
	"sky",
	"yellow",
	"rose",
];

const offerSchema = z.object({
	title: z.string().min(2, { message: "Title must be at least 2 characters" }),
	slug: z
		.string()
		.min(2, { message: "Slug must be at least 2 characters" })
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
			message: "Use lowercase letters, numbers and hyphens only",
		}),
	description: z.string().min(10, { message: "Description must be at least 10 characters" }),
	icon: z.string().min(1, { message: "Pick an icon" }),
	price: z.number().int().min(0, { message: "Price cannot be negative" }),
	forWho: z.string().min(2, { message: "Describe who this offer is for" }),
	extras: z.string().optional(),
	isPopular: z.boolean().default(false),
	color: z.string().default("none"),
	sortOrder: z.number().int(),
	isPublished: z.boolean().default(true),
});

type OfferFormValues = z.infer<typeof offerSchema>;

export function OffersForm() {
	const router = useRouter();
	const { id } = useParams<{ id?: string }>();
	const isEditMode = Boolean(id);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(isEditMode);

	const form = useForm<OfferFormValues>({
		resolver: zodResolver(offerSchema),
		defaultValues: {
			title: "",
			slug: "",
			description: "",
			icon: "",
			price: 0,
			forWho: "",
			extras: "",
			isPopular: false,
			color: "none",
			sortOrder: 0,
			isPublished: true,
		},
	});

	const selectedIcon = form.watch("icon");
	const price = form.watch("price");
	const SelectedIcon = selectedIcon ? getContentIcon(selectedIcon) : null;

	useEffect(() => {
		const fetchOffer = async () => {
			if (!id) return;

			setIsLoading(true);
			try {
				const offer = await offersService.getById(id);
				if (offer) {
					form.reset({
						title: offer.title,
						slug: offer.slug,
						description: offer.description,
						icon: offer.icon,
						price: offer.price,
						forWho: offer.forWho,
						extras: (offer.extras ?? []).join("\n"),
						isPopular: offer.isPopular,
						color: offer.color ?? "none",
						sortOrder: offer.sortOrder,
						isPublished: offer.isPublished,
					});
				} else {
					toast.error("Offer not found");
					router.push("/cms/offers");
				}
			} catch (error) {
				console.error("Error loading offer:", error);
				toast.error("Failed to load offer");
			} finally {
				setIsLoading(false);
			}
		};

		fetchOffer();
	}, [id, form, router]);

	const onSubmit = async (data: OfferFormValues) => {
		setIsSubmitting(true);
		try {
			const payload = {
				title: data.title.trim(),
				slug: data.slug.trim(),
				description: data.description.trim(),
				icon: data.icon,
				price: data.price,
				forWho: data.forWho.trim(),
				extras: (data.extras ?? "")
					.split("\n")
					.map((line) => line.trim())
					.filter(Boolean),
				isPopular: data.isPopular,
				color: data.color === "none" ? undefined : data.color,
				sortOrder: data.sortOrder,
				isPublished: data.isPublished,
			};

			if (isEditMode && id) {
				await offersService.update(id, payload);
				toast.success("Offer updated successfully!");
			} else {
				await offersService.create(payload);
				toast.success("Offer created successfully!");
			}

			queryClient.invalidateQueries({ queryKey: ["cmsOffers"] });
			router.push("/cms/offers");
		} catch (error) {
			console.error("Error saving offer:", error);
			toast.error("Failed to save offer. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-96">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
				<span className="ml-2 text-lg">Loading offer...</span>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto">
			<div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-6 sm:mb-8">
				<h1 className="text-3xl font-bold">{isEditMode ? "Edit Offer" : "Add Offer"}</h1>
				{price > 0 && (
					<div className="flex items-center text-muted-foreground">
						<Package className="h-4 w-4 mr-1.5" />
						<span className="text-sm">Priced at: {idrFormatter.format(price)}</span>
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
										<Package className="h-5 w-5 mr-2 text-primary" />
										Offer Details
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
															? "This offer appears on your offers page"
															: "This offer stays hidden from your offers page"}
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
														placeholder="Landing Page Sprint"
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
														placeholder="landing-page-sprint"
														className="rounded-lg border-border/50 focus-visible:ring-primary/30"
														{...field}
													/>
												</FormControl>
												<div className="text-xs text-muted-foreground mt-1">
													Lowercase identifier used in links, e.g. landing-page-sprint.
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
														placeholder="A fast, conversion-focused landing page shipped in one week."
														className="min-h-24 rounded-lg border-border/50 focus-visible:ring-primary/30"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
										<FormField
											control={form.control}
											name="icon"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">Icon</FormLabel>
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
																		<span className="flex items-center">
																			<Icon className="h-4 w-4 mr-2" />
																			{name}
																		</span>
																	</SelectItem>
																);
															})}
														</SelectContent>
													</Select>
													<div className="text-xs text-muted-foreground mt-1 flex items-center">
														{SelectedIcon ? (
															<>
																Preview:
																<SelectedIcon className="h-4 w-4 mx-1.5 text-primary" />
																{selectedIcon}
															</>
														) : (
															"Shown next to the offer title on /offers."
														)}
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="price"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">
														Price (IDR)
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															min={0}
															className="rounded-lg border-border/50 focus-visible:ring-primary/30"
															value={field.value}
															onChange={(e) => field.onChange(Number(e.target.value) || 0)}
														/>
													</FormControl>
													<div className="text-xs text-muted-foreground mt-1">
														{price > 0
															? `Shown as: ${idrFormatter.format(price)}`
															: "Whole rupiah, no decimals."}
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="forWho"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground/80 font-medium">
													Who is this for?
												</FormLabel>
												<FormControl>
													<Textarea
														rows={2}
														placeholder="Founders who need a credible online presence fast."
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
										name="extras"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground/80 font-medium">
													What's included (one per line)
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder={"Responsive design\nBasic SEO setup\n1 revision round"}
														className="min-h-28 rounded-lg border-border/50 focus-visible:ring-primary/30"
														{...field}
													/>
												</FormControl>
												<div className="text-xs text-muted-foreground mt-1">
													Each line becomes a bullet point on the offer card. Empty lines are
													ignored.
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
															Highlights this offer with a "Popular" badge
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
											name="color"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">
														Accent Color
													</FormLabel>
													<Select onValueChange={field.onChange} value={field.value}>
														<FormControl>
															<SelectTrigger className="rounded-lg border-border/50">
																<SelectValue placeholder="Select a color" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{COLOR_OPTIONS.map((color) => (
																<SelectItem key={color} value={color}>
																	{color === "none" ? "None (default)" : color}
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
														Offers with a lower number show first on the offers page.
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
																Publish Offer
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
											Offer Tips
										</CardTitle>
									</CardHeader>
									<CardContent className="p-4">
										<div className="text-xs space-y-2 text-muted-foreground">
											<p>
												<span className="font-semibold">Price:</span> Whole rupiah only — the page
												formats it as Rp with thousands separators
											</p>
											<p>
												<span className="font-semibold">Popular:</span> Mark at most one offer so
												the highlight keeps its meaning
											</p>
											<p>
												<span className="font-semibold">Extras:</span> Short, scannable bullets
												sell better than long sentences
											</p>
											<p>
												<span className="font-semibold">Hidden:</span> Use the publication toggle
												to keep an offer out of the public page without deleting it
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
