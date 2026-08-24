"use client";

import PowerfulCTACard from "@/components/cards/powerful-cta-card";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { getContentIcon } from "@/lib/icon-registry";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";
import { serviceRequestService } from "@/services";
import type { Faq } from "@/services/faqs/types";
import type { ServicesCopy } from "@/services/page-copy/types";
import type { ProcessStep } from "@/services/process-steps/types";
import { RecaptchaDisclaimer } from "@/components/common/recaptcha-disclaimer";
import { getReCaptchaToken } from "@/services/recaptcha";
import type { ServiceItem } from "@/services/service-catalog/types";
import type { SelectOption } from "@/services/site-settings/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { z } from "zod";

const serviceFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().min(1, "Email is required").email("Invalid email address"),
	company: z.string().optional(),
	serviceType: z.string().min(1, "Please select a service type"),
	budget: z.string().min(1, "Please select a budget range"),
	timeframe: z.string().min(1, "Please select a timeframe"),
	projectDetails: z.string().min(20, "Project details must be at least 20 characters"),
	termsAccepted: z.boolean().refine((val) => val === true, {
		message: "You must accept the terms and conditions",
	}),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

type ServicesViewProps = {
	copy: ServicesCopy | null;
	services: ServiceItem[];
	faqs: Faq[];
	processSteps: ProcessStep[];
	timeframes: SelectOption[];
	budgetRanges: SelectOption[];
};

export function ServicesView({
	copy,
	services,
	faqs,
	processSteps,
	timeframes,
	budgetRanges,
}: ServicesViewProps) {
	const ctaData = copy?.cta;
	const [selectedService, setSelectedService] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<ServiceFormValues>({
		resolver: zodResolver(serviceFormSchema),
		defaultValues: {
			name: "",
			email: "",
			company: "",
			serviceType: "",
			budget: "",
			timeframe: "",
			projectDetails: "",
			termsAccepted: false,
		},
	});

	const mutation = useMutation({
		mutationFn: ({ form, token }: { form: ServiceFormValues; token: string }) => {
			return serviceRequestService.submit(
				{
					name: form.name,
					email: form.email,
					company: form.company || undefined,
					serviceType: form.serviceType,
					budget: form.budget,
					timeframe: form.timeframe,
					projectDetails: form.projectDetails,
				},
				token,
			);
		},
		onSuccess: () => {
			toast({
				title: "Request submitted!",
				description: "Thanks for your interest. I'll get back to you soon.",
			});
			const vals = form.getValues();
			trackEvent("services-form-submit-success", {
				serviceType: vals.serviceType,
				budget: vals.budget,
				timeframe: vals.timeframe,
			});
			form.reset();
		},
		onError: () => {
			toast({
				title: "Error",
				description: "Failed to send your request. Please try again.",
				variant: "destructive",
			});
			trackEvent("services-form-submit-error");
		},
		onSettled: () => {
			setIsSubmitting(false);
		},
	});

	const onSubmit = async (data: ServiceFormValues) => {
		setIsSubmitting(true);
		trackEvent("services-form-submit-attempt", {
			serviceType: data.serviceType,
			budget: data.budget,
		});
		// Token is verified server-side inside `submit` (empty in stub mode).
		const token = await getReCaptchaToken();
		mutation.mutate({ form: data, token });
	};

	const handleServiceSelect = (serviceId: string) => {
		setSelectedService(serviceId);
		form.setValue("serviceType", serviceId);
		trackEvent("services-card-selected", { serviceId });
	};

	return (
		<div className="space-y-24">
			{/* Hero Section */}
			<section className="relative overflow-hidden py-12 md:py-20">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.header.title}
						subtitle={copy?.header.subtitle}
						description={copy?.header.description}
						className="mb-16"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{services.map((service) => {
							const Icon = getContentIcon(service.icon);
							return (
								<Card
									key={service.id}
									className={cn(
										"border border-border/40 transition-all duration-300 overflow-hidden",
										selectedService === service.slug
											? "ring-2 ring-primary border-transparent shadow-lg"
											: "hover:border-primary/30 hover:shadow-md",
									)}
								>
									<CardHeader className="pb-4">
										<div className="p-3 bg-primary/10 rounded-xl text-primary mb-4 w-fit">
											<Icon size={24} />
										</div>
										<CardTitle className="text-xl">{service.title}</CardTitle>
										<CardDescription className="text-sm mt-2">
											{service.description}
										</CardDescription>
									</CardHeader>
									<CardContent className="pb-4">
										<div className="font-bold text-lg mb-4">{service.priceLabel}</div>
										<ul className="space-y-2">
											{service.features.map((feature, index) => (
												<li key={index} className="flex items-start text-sm text-muted-foreground">
													<CheckCircle
														size={16}
														className="mr-2 mt-0.5 text-primary flex-shrink-0"
													/>
													{feature}
												</li>
											))}
										</ul>
									</CardContent>
									<CardFooter>
										<Button
											variant={selectedService === service.slug ? "default" : "outline"}
											className="w-full rounded-xl"
											onClick={() => handleServiceSelect(service.slug)}
										>
											{selectedService === service.slug ? "Selected" : "Select Service"}
										</Button>
									</CardFooter>
								</Card>
							);
						})}
					</div>
				</div>
			</section>

			{/* Process Section */}
			<section className="py-16 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.processSection.title}
						subtitle={copy?.processSection.subtitle}
						description={copy?.processSection.description}
						className="mb-16"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						{processSteps.map((step, index) => (
							<div
								key={step.id}
								className="bg-background border border-border/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
							>
								<div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-2xl flex items-center justify-center font-bold text-primary">
									<span className="text-2xl font-bold">{index + 1}</span>
								</div>
								<h3 className="text-xl font-bold mb-4 mt-6">{step.title}</h3>
								<p className="text-muted-foreground">{step.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Request Form Section */}
			<section className="bg-gradient-to-b from-background to-muted/30">
				<div id="request-service-form" className="container px-4 py-16 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.requestSection.title}
						subtitle={copy?.requestSection.subtitle}
						description={copy?.requestSection.description}
						className="mb-16"
					/>

					<div className="bg-background border border-border/40 rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden max-w-4xl mx-auto">
						<div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background pointer-events-none"></div>

						<div className="relative">
							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">
														Name <span className="text-primary">*</span>
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Your name"
															className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80 backdrop-blur-sm"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">
														Email <span className="text-primary">*</span>
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Your email"
															type="email"
															className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80 backdrop-blur-sm"
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
										name="company"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground/80 font-medium">
													Company (Optional)
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Your company name"
														className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80 backdrop-blur-sm"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
										<FormField
											control={form.control}
											name="serviceType"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">
														Service Type <span className="text-primary">*</span>
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80 backdrop-blur-sm">
																<SelectValue placeholder="Select a service" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{services.map((service) => (
																<SelectItem key={service.id} value={service.slug}>
																	{service.title}
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
											name="budget"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">
														Budget <span className="text-primary">*</span>
													</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80 backdrop-blur-sm">
																<SelectValue placeholder="Select budget range" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{budgetRanges.map((range) => (
																<SelectItem key={range.id} value={range.id}>
																	{range.label}
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
											name="timeframe"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground/80 font-medium">
														Timeframe <span className="text-primary">*</span>
													</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value}>
														<FormControl>
															<SelectTrigger className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80 backdrop-blur-sm">
																<SelectValue placeholder="Select timeframe" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{timeframes.map((timeframe) => (
																<SelectItem key={timeframe.id} value={timeframe.id}>
																	{timeframe.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="projectDetails"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground/80 font-medium">
													Project Details <span className="text-primary">*</span>
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Describe your project, requirements, and any specific details that would help me understand your needs better."
														rows={6}
														className="rounded-xl border-border/50 focus-visible:ring-primary/30 resize-none bg-background/80 backdrop-blur-sm"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="termsAccepted"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-muted/30">
												<FormControl>
													<Checkbox checked={field.value} onCheckedChange={field.onChange} />
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel className="text-sm">
														I agree to the{" "}
														<Link href="/terms-of-service" className="text-primary hover:underline">
															terms of service
														</Link>{" "}
														and{" "}
														<Link href="/privacy-policy" className="text-primary hover:underline">
															privacy policy
														</Link>
														.
													</FormLabel>
													<FormMessage />
												</div>
											</FormItem>
										)}
									/>

									<Button
										type="submit"
										size="lg"
										className={cn(
											"w-full md:w-auto px-8 rounded-full transition-all duration-300",
											"bg-primary hover:bg-primary/90 text-primary-foreground",
											"group overflow-hidden relative",
										)}
										disabled={mutation.isPending || isSubmitting}
									>
										{mutation.isPending || isSubmitting ? (
											<span className="flex items-center">
												<svg
													className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														className="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														strokeWidth="4"
													></circle>
													<path
														className="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												Submitting...
											</span>
										) : (
											<>
												<span className="flex items-center gap-2 group-hover:-translate-x-2 transition-transform duration-300">
													Submit Request
													<ArrowRight className="w-4 h-4 group-hover:translate-x-4 transition-transform duration-300" />
												</span>
												<span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary">
													<CheckCircle2 className="w-5 h-5 mr-2" />
													Ready to Submit
												</span>
											</>
										)}
									</Button>

									<RecaptchaDisclaimer />
								</form>
							</Form>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="py-16">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.faqSection.title}
						subtitle={copy?.faqSection.subtitle}
						className="mb-16"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
						{faqs.map((faq) => (
							<div
								key={faq.id}
								className="bg-background border border-border/40 rounded-xl p-6 hover:border-primary/30 hover:shadow-sm transition-all duration-300"
							>
								<h3 className="text-lg font-bold mb-2">{faq.question}</h3>
								<p className="text-muted-foreground">{faq.answer}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Enhanced CTA Section */}
			<section className="pb-16">
				<div className="container px-4 max-w-6xl mx-auto">
					{ctaData && <PowerfulCTACard {...ctaData} />}
				</div>
			</section>
		</div>
	);
}
