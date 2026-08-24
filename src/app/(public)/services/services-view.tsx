"use client";

import PowerfulCTACard from "@/components/cards/powerful-cta-card";
import { Button } from "@/components/ui/button";
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
import { SpotlightCard } from "@/components/ui/spotlight-card";
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
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
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
		const token = await getReCaptchaToken();
		mutation.mutate({ form: data, token });
	};

	const handleServiceSelect = (serviceId: string) => {
		setSelectedService(serviceId);
		form.setValue("serviceType", serviceId);
		trackEvent("services-card-selected", { serviceId });

		const formEl = document.getElementById("request-service-form");
		if (formEl) {
			formEl.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<div className="space-y-20 md:space-y-28 pb-12">
			{/* Hero Section */}
			<section className="relative overflow-hidden pt-6 md:pt-12">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.header.title || "Engineering Services"}
						subtitle={copy?.header.subtitle || "What I Do"}
						description={copy?.header.description}
						className="mb-14 text-center"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{services.map((service) => {
							const Icon = getContentIcon(service.icon);
							const isSelected = selectedService === service.slug;

							return (
								<SpotlightCard
									key={service.id}
									className={cn(
										"p-7 flex flex-col justify-between h-full rounded-2xl bg-card/60 border transition-all duration-300",
										isSelected
											? "border-primary ring-2 ring-primary/30 shadow-xl"
											: "border-border/50 hover:border-primary/40 hover:shadow-lg",
									)}
								>
									<div>
										<div className="flex items-center justify-between mb-5">
											<div className="p-3.5 bg-primary/10 rounded-2xl text-primary">
												<Icon size={24} />
											</div>
											{service.priceLabel && (
												<span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
													{service.priceLabel}
												</span>
											)}
										</div>

										<h3 className="text-xl font-bold mb-2.5 text-foreground group-hover:text-primary transition-colors">
											{service.title}
										</h3>

										<p className="text-sm text-muted-foreground leading-relaxed mb-6">
											{service.description}
										</p>

										{service.features && service.features.length > 0 && (
											<ul className="space-y-2.5 mb-6 border-t border-border/40 pt-4">
												{service.features.map((feature, index) => (
													<li key={index} className="flex items-start text-xs text-muted-foreground">
														<CheckCircle2
															size={15}
															className="mr-2 mt-0.5 text-primary flex-shrink-0"
														/>
														<span>{feature}</span>
													</li>
												))}
											</ul>
										)}
									</div>

									<div className="pt-4 border-t border-border/40">
										<Button
											variant={isSelected ? "default" : "outline"}
											className="w-full rounded-xl text-xs font-semibold h-10"
											onClick={() => handleServiceSelect(service.slug)}
										>
											{isSelected ? "Selected for Inquiry" : "Select Service"}
										</Button>
									</div>
								</SpotlightCard>
							);
						})}
					</div>
				</div>
			</section>

			{/* Process Section */}
			<section className="py-8 relative overflow-hidden">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.processSection.title || "How We Work"}
						subtitle={copy?.processSection.subtitle || "The Process"}
						description={copy?.processSection.description}
						className="mb-14 text-center"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{processSteps.map((step, index) => (
							<SpotlightCard
								key={step.id}
								className="p-6 rounded-2xl bg-card/60 border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between"
							>
								<div>
									<div className="flex items-center justify-between mb-5">
										<span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm border border-primary/20">
											0{index + 1}
										</span>
									</div>

									<h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
										{step.title}
									</h3>

									<p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
										{step.description}
									</p>
								</div>
							</SpotlightCard>
						))}
					</div>
				</div>
			</section>

			{/* Request Form Section */}
			<section className="py-8">
				<div id="request-service-form" className="container px-4 max-w-4xl mx-auto">
					<SectionHeader
						title={copy?.requestSection.title || "Request a Service"}
						subtitle={copy?.requestSection.subtitle || "Get in Touch"}
						description={copy?.requestSection.description}
						className="mb-12 text-center"
					/>

					<SpotlightCard className="p-8 md:p-12 rounded-3xl bg-card/80 border border-border/50 shadow-xl">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground/80 font-medium text-xs">
													Name <span className="text-primary">*</span>
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Your name"
														className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80"
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
												<FormLabel className="text-foreground/80 font-medium text-xs">
													Email <span className="text-primary">*</span>
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Your email"
														type="email"
														className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80"
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
											<FormLabel className="text-foreground/80 font-medium text-xs">
												Company (Optional)
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Your company or team name"
													className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80"
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
												<FormLabel className="text-foreground/80 font-medium text-xs">
													Service Type <span className="text-primary">*</span>
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80">
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
												<FormLabel className="text-foreground/80 font-medium text-xs">
													Budget Range <span className="text-primary">*</span>
												</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80">
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
												<FormLabel className="text-foreground/80 font-medium text-xs">
													Timeframe <span className="text-primary">*</span>
												</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80">
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
											<FormLabel className="text-foreground/80 font-medium text-xs">
												Project Details & Goals <span className="text-primary">*</span>
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Describe your project, goals, and any specific technical requirements..."
													rows={5}
													className="rounded-xl border-border/50 focus-visible:ring-primary/30 resize-none bg-background/80"
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
										<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl p-4 bg-muted/40 border border-border/40">
											<FormControl>
												<Checkbox checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel className="text-xs text-muted-foreground">
													I agree to the{" "}
													<Link href="/terms-of-service" className="text-primary hover:underline font-medium">
														terms of service
													</Link>{" "}
													and{" "}
													<Link href="/privacy-policy" className="text-primary hover:underline font-medium">
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
									className="w-full md:w-auto px-8 rounded-full shadow-lg shadow-primary/20 group"
									disabled={mutation.isPending || isSubmitting}
								>
									{mutation.isPending || isSubmitting ? (
										<span className="flex items-center">
											<Sparkles className="animate-spin -ml-1 mr-2 h-4 w-4" />
											Submitting Inquiry...
										</span>
									) : (
										<span className="flex items-center gap-2">
											Submit Service Inquiry
											<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
										</span>
									)}
								</Button>

								<RecaptchaDisclaimer />
							</form>
						</Form>
					</SpotlightCard>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="py-8">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.faqSection.title || "Frequently Asked Questions"}
						subtitle={copy?.faqSection.subtitle || "Got Questions?"}
						className="mb-14 text-center"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
						{faqs.map((faq) => (
							<SpotlightCard
								key={faq.id}
								className="p-6 rounded-2xl bg-card/60 border border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-300"
							>
								<h3 className="text-base font-bold mb-2 text-foreground">{faq.question}</h3>
								<p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
							</SpotlightCard>
						))}
					</div>
				</div>
			</section>

			{/* Bottom CTA Section */}
			<section className="pb-8">
				<div className="container px-4 max-w-6xl mx-auto">
					{ctaData && <PowerfulCTACard {...ctaData} />}
				</div>
			</section>
		</div>
	);
}
