"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, HelpCircle, Info, ListOrdered, Loader2, Save } from "lucide-react";
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
import { faqsService } from "@/services";

const faqSchema = z.object({
	question: z.string().min(1, { message: "Question is required" }),
	answer: z.string().min(1, { message: "Answer is required" }),
	sortOrder: z.number().int(),
	isPublished: z.boolean().default(true),
});

type FaqFormValues = z.infer<typeof faqSchema>;

export function FaqsForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { id } = useParams<{ id?: string }>();
	const isEditMode = Boolean(id);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(isEditMode);

	const form = useForm<FaqFormValues>({
		resolver: zodResolver(faqSchema),
		defaultValues: {
			question: "",
			answer: "",
			sortOrder: 0,
			isPublished: true,
		},
	});

	useEffect(() => {
		const fetchFaq = async () => {
			if (!id) return;

			setIsLoading(true);
			try {
				const faq = await faqsService.getById(id);
				if (faq) {
					form.reset({
						question: faq.question,
						answer: faq.answer,
						sortOrder: faq.sortOrder,
						isPublished: faq.isPublished,
					});
				} else {
					toast.error("FAQ not found");
					router.push("/cms/faqs");
				}
			} catch (error) {
				console.error("Error loading FAQ:", error);
				toast.error("Failed to load FAQ");
			} finally {
				setIsLoading(false);
			}
		};

		fetchFaq();
	}, [id, form, router]);

	const onSubmit = async (data: FaqFormValues) => {
		setIsSubmitting(true);
		try {
			const payload = {
				question: data.question.trim(),
				answer: data.answer.trim(),
				sortOrder: data.sortOrder,
				isPublished: data.isPublished,
			};

			if (isEditMode && id) {
				await faqsService.update(id, payload);
				toast.success("FAQ updated successfully!");
			} else {
				await faqsService.create(payload);
				toast.success("FAQ created successfully!");
			}

			queryClient.invalidateQueries({ queryKey: ["cmsFaqs"] });
			router.push("/cms/faqs");
		} catch (error) {
			console.error("Error saving FAQ:", error);
			toast.error("Failed to save FAQ. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-96">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
				<span className="ml-2 text-lg">Loading FAQ...</span>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto">
			<div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-6 sm:mb-8">
				<h1 className="text-3xl font-bold">{isEditMode ? "Edit FAQ" : "Add FAQ"}</h1>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2">
							<Card className="border-x-0 border-b-0 sm:border-border/50 shadow-none sm:shadow-md rounded-none sm:rounded-xl overflow-hidden">
								<CardHeader className="bg-muted/30 border-b border-border/30 px-0 py-4 sm:p-6">
									<CardTitle className="flex items-center">
										<HelpCircle className="h-5 w-5 mr-2 text-primary" />
										FAQ Entry
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
															? "This FAQ appears on /services and /hire-me"
															: "This FAQ stays hidden from /services and /hire-me"}
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
										name="question"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground/80 font-medium">Question</FormLabel>
												<FormControl>
													<Input
														placeholder="How long does a typical project take?"
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
										name="answer"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground/80 font-medium">Answer</FormLabel>
												<FormControl>
													<Textarea
														rows={5}
														placeholder="Most projects take between 2 and 6 weeks depending on scope…"
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
														Lower numbers appear first in the FAQ list.
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
																Publish FAQ
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
											FAQ Tips
										</CardTitle>
									</CardHeader>
									<CardContent className="p-4">
										<div className="text-xs space-y-2 text-muted-foreground">
											<p>
												<span className="font-semibold">Question:</span> Phrase it the way a
												client would ask it — short and specific
											</p>
											<p>
												<span className="font-semibold">Answer:</span> Lead with the direct answer
												first, then add context or caveats
											</p>
											<p>
												<span className="font-semibold">Shared:</span> The same FAQ list is shown
												on both /services and /hire-me
											</p>
											<p>
												<span className="font-semibold">Hidden:</span> Use the publication toggle
												to keep an entry out of the public pages without deleting it
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
