"use client";

import PowerfulCTACard from "@/components/cards/powerful-cta-card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { toast } from "@/components/ui/use-toast";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { getContentIcon } from "@/lib/icon-registry";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";
import { serviceRequestService } from "@/services";
import type { AvailabilitySlot } from "@/services/availability/types";
import type { Faq } from "@/services/faqs/types";
import type { HireMeCopy } from "@/services/page-copy/types";
import type { PricingTier } from "@/services/pricing-tiers/types";
import type { ProcessStep } from "@/services/process-steps/types";
import { RecaptchaDisclaimer } from "@/components/common/recaptcha-disclaimer";
import { getReCaptchaToken } from "@/services/recaptcha";
import type { ServiceItem } from "@/services/service-catalog/types";
import type { SelectOption } from "@/services/site-settings/types";
import type { Testimonial } from "@/services/testimonials/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
	ArrowRight,
	CheckCircle2,
	ChevronDown,
	Clock,
	MessageSquare,
	Sparkles,
	Star,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { z } from "zod";

const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const hireFormSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	email: z.string().min(1, { message: "Email is required" }).email("Invalid email address"),
	company: z.string().optional(),
	serviceType: z.string().min(1, { message: "Please select a service type" }),
	budget: z.string().min(1, { message: "Please select a budget range" }),
	timeframe: z.string().min(1, { message: "Please select a timeframe" }),
	projectDetails: z.string().min(20, { message: "Project details must be at least 20 characters" }),
	termsAccepted: z.boolean().refine((val) => val === true, {
		message: "You must accept the terms and conditions",
	}),
});

type HireFormValues = z.infer<typeof hireFormSchema>;

type HireMeViewProps = {
	copy: HireMeCopy | null;
	pricingTiers: PricingTier[];
	expertiseAreas: ServiceItem[];
	testimonials: Testimonial[];
	processSteps: ProcessStep[];
	faqs: Faq[];
	availabilitySlots: AvailabilitySlot[];
	timeframes: SelectOption[];
	budgetRanges: SelectOption[];
};

export function HireMeView({
	copy,
	pricingTiers,
	expertiseAreas,
	testimonials,
	processSteps,
	faqs,
	availabilitySlots,
	timeframes,
	budgetRanges,
}: HireMeViewProps) {
	const ctaData = copy?.cta;
	const [selectedService, setSelectedService] = useState<string | null>(null);
	const [, setActiveTab] = useState("services");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<HireFormValues>({
		resolver: zodResolver(hireFormSchema),
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
		mutationFn: ({ form, token }: { form: HireFormValues; token: string }) => {
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
			trackEvent("hire-me-form-submit-success", {
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
			trackEvent("hire-me-form-submit-error");
		},
		onSettled: () => {
			setIsSubmitting(false);
		},
	});

	const onSubmit = async (data: HireFormValues) => {
		setIsSubmitting(true);
		trackEvent("hire-me-form-submit-attempt", {
			serviceType: data.serviceType,
			budget: data.budget,
		});
		const token = await getReCaptchaToken();
		mutation.mutate({ form: data, token });
	};

	const handleServiceSelect = (serviceId: string) => {
		setSelectedService(serviceId);
		form.setValue("serviceType", serviceId);
		trackEvent("hire-me-service-selected", { serviceId });

		const contactForm = document.getElementById("contact-form");
		if (contactForm) {
			contactForm.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<div className="space-y-20 md:space-y-28 pb-12">
			{/* Hero Section */}
			<section className="relative overflow-hidden pt-6 md:pt-14">
				<div className="container px-4 max-w-6xl mx-auto">
					<div className="flex flex-col items-center text-center max-w-3xl mx-auto">
						<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs md:text-sm mb-6 border border-primary/20 animate-fade-in">
							<Sparkles size={15} className="shrink-0 animate-pulse" />
							{copy?.hero.eyebrow || "Work With Me"}
						</div>

						<h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-[1.15] animate-fade-in">
							<HighlightedText text={copy?.hero.title ?? ""} />
						</h1>

						<p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed animate-fade-in">
							{copy?.hero.description}
						</p>

						<div className="flex flex-wrap gap-3.5 justify-center animate-fade-in">
							<Button
								size="lg"
								data-umami-event="hire-me-start-project-hero-click"
								className="rounded-full px-7 h-12 text-xs md:text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
								onClick={() => {
									const contactForm = document.getElementById("contact-form");
									if (contactForm) {
										contactForm.scrollIntoView({ behavior: "smooth" });
									}
								}}
							>
								<span>Start a Project</span>
								<ArrowRight size={15} className="ml-2 group-hover:translate-x-1 transition-transform duration-200" />
							</Button>

							<Button
								variant="outline"
								size="lg"
								data-umami-event="hire-me-view-packages-click"
								className="rounded-full px-7 h-12 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
								onClick={() => {
									const servicesSection = document.getElementById("services-section");
									if (servicesSection) {
										servicesSection.scrollIntoView({ behavior: "smooth" });
									}
								}}
							>
								<span>View Packages</span>
								<ChevronDown size={15} className="ml-2 group-hover:translate-y-0.5 transition-transform duration-200 text-primary" />
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Availability Section */}
			<section className="py-6">
				<div className="container px-4 max-w-6xl mx-auto">
					<SpotlightCard className="p-8 md:p-10 rounded-3xl bg-card/80 border border-border/50 shadow-xl">
						<div className="flex flex-col md:flex-row items-center justify-between gap-8">
							<div className="md:w-3/5">
								<h2 className="text-2xl font-bold mb-2 text-foreground">
									{copy?.availabilitySection.title || "Project Availability"}
								</h2>
								<p className="text-sm text-muted-foreground mb-6 leading-relaxed">
									{copy?.availabilitySection.description || "Check my booking calendar for upcoming sprint slots and availability."}
								</p>

								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
									{availabilitySlots.map((slot) => (
										<div
											key={slot.id}
											className="text-center p-3.5 border border-border/50 rounded-xl bg-background/60"
										>
											<p className="font-semibold text-xs text-foreground">
												{MONTH_LABELS[slot.month - 1]} {slot.year}
											</p>
											<Badge
												variant={
													slot.status === "available"
														? "default"
														: slot.status === "limited"
															? "secondary"
															: "outline"
												}
												className="mt-1.5 text-[10px] px-2 py-0.5"
											>
												{slot.label}
											</Badge>
										</div>
									))}
								</div>
							</div>

							<div className="md:w-2/5 flex flex-col items-center md:items-end text-center md:text-right">
								<div className="flex items-center gap-2 mb-4 text-xs font-medium text-foreground">
									<Clock size={16} className="text-primary" />
									<span>{copy?.availabilitySection.timezoneNote || "WIB (UTC+7) • Global Remote Friendly"}</span>
								</div>

								<Button size="lg" className="rounded-full px-8 w-full md:w-auto shadow-md" asChild>
									<Link href="/contact" data-umami-event="hire-me-direct-contact-click">
										<MessageSquare size={16} className="mr-2" />
										Direct Contact
									</Link>
								</Button>

								{copy?.availabilitySection.contactNote && (
									<p className="text-xs text-muted-foreground mt-3">
										{copy.availabilitySection.contactNote}
									</p>
								)}
							</div>
						</div>
					</SpotlightCard>
				</div>
			</section>

			{/* Services & Pricing Section */}
			<section id="services-section" className="py-8 relative overflow-hidden">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.servicesSection.title || "Engagement Models & Rates"}
						subtitle={copy?.servicesSection.subtitle || "Investment"}
						description={copy?.servicesSection.description}
						className="text-center mb-14"
					/>

					<Tabs defaultValue="services" className="w-full" onValueChange={(val) => {
						setActiveTab(val);
						trackEvent("hire-me-tab-change", { tab: val });
					}}>
						<TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 mb-12 p-1 bg-muted/60 rounded-full border border-border/40">
							<TabsTrigger
								value="services"
								data-umami-event="hire-me-tab-click"
								data-umami-event-tab="services"
								className="rounded-full text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
							>
								Packages
							</TabsTrigger>
							<TabsTrigger
								value="expertise"
								data-umami-event="hire-me-tab-click"
								data-umami-event-tab="expertise"
								className="rounded-full text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
							>
								Expertise
							</TabsTrigger>
						</TabsList>

						<TabsContent value="services" className="space-y-8 animate-fade-in">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{pricingTiers.map((tier) => {
									const isSelected = selectedService === tier.slug;
									return (
										<SpotlightCard
											key={tier.id}
											className={cn(
												"p-7 flex flex-col justify-between h-full rounded-2xl bg-card/60 border transition-all duration-300 relative",
												isSelected
													? "border-primary ring-2 ring-primary/30 shadow-xl"
													: "border-border/50 hover:border-primary/40 hover:shadow-lg",
											)}
										>
											{tier.isPopular && (
												<div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3.5 py-1 text-[11px] font-bold rounded-bl-xl shadow-sm">
													Popular Choice
												</div>
											)}

											<div>
												<h3 className="text-xl font-bold mb-1 text-foreground">{tier.name}</h3>
												<div className="my-3">
													<span className="text-3xl font-extrabold text-foreground">{tier.priceLabel}</span>
												</div>
												<p className="text-xs text-muted-foreground mb-6 leading-relaxed">
													{tier.description}
												</p>

												<ul className="space-y-2.5 mb-6 border-t border-border/40 pt-4">
													{tier.features.map((feature, index) => (
														<li key={index} className="flex items-start text-xs text-muted-foreground">
															<CheckCircle2
																size={15}
																className="mr-2 mt-0.5 text-primary flex-shrink-0"
															/>
															<span>{feature}</span>
														</li>
													))}
												</ul>
											</div>

											<div className="pt-4 border-t border-border/40">
												<Button
													variant={isSelected ? "default" : "outline"}
													className="w-full rounded-xl text-xs font-semibold h-10"
													onClick={() => handleServiceSelect(tier.slug)}
													data-umami-event="hire-me-select-package-click"
													data-umami-event-package={tier.slug}
												>
													{tier.ctaLabel || "Select Package"}
												</Button>
											</div>
										</SpotlightCard>
									);
								})}
							</div>
						</TabsContent>

						<TabsContent value="expertise" className="animate-fade-in">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{expertiseAreas.map((service, index) => {
									const Icon = getContentIcon(service.icon);
									return (
										<SpotlightCard
											key={service.id}
											className="p-7 flex flex-col justify-between h-full rounded-2xl bg-card/60 border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
											style={{ animationDelay: `${(index + 1) * 0.08}s` }}
										>
											<div>
												<div className="p-3.5 bg-primary/10 rounded-2xl text-primary mb-5 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
													<Icon size={22} />
												</div>
												<h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
													{service.title}
												</h3>
												<p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
													{service.description}
												</p>
											</div>
										</SpotlightCard>
									);
								})}
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</section>

			{/* Process Section */}
			<section className="py-8">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.processSection.title || "Collaboration Flow"}
						subtitle={copy?.processSection.subtitle || "The Workflow"}
						description={copy?.processSection.description}
						className="text-center mb-14"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{processSteps.map((step, index) => {
							const Icon = getContentIcon(step.icon);
							return (
								<SpotlightCard
									key={step.id}
									className="p-6 rounded-2xl bg-card/60 border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
								>
									<div>
										<div className="flex items-center justify-between mb-5">
											<div className="p-3 bg-primary/10 rounded-xl text-primary">
												<Icon size={20} />
											</div>
											<span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-xs border border-primary/20">
												0{index + 1}
											</span>
										</div>

										<h3 className="text-base font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
											{step.title}
										</h3>

										<p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
									</div>
								</SpotlightCard>
							);
						})}
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			{testimonials.length > 0 && (
				<section className="py-8 relative overflow-hidden">
					<div className="container px-4 max-w-6xl mx-auto">
						<SectionHeader
							title={copy?.testimonialsSection.title || "Client Endorsements"}
							subtitle={copy?.testimonialsSection.subtitle || "Testimonials"}
							description={copy?.testimonialsSection.description}
							className="text-center mb-14"
						/>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{testimonials.map((testimonial) => (
								<SpotlightCard
									key={testimonial.id}
									className="p-7 rounded-2xl bg-card/60 border border-border/50 hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
								>
									<div>
										<div className="flex items-center gap-3.5 mb-5">
											<img
												src={testimonial.avatarUrl || "/placeholder.svg"}
												alt={testimonial.authorName}
												className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
											/>
											<div>
												<h3 className="font-bold text-sm text-foreground">{testimonial.authorName}</h3>
												<p className="text-xs text-muted-foreground">{testimonial.authorRole}</p>
											</div>
										</div>

										<div className="flex mb-3.5">
											{Array.from({ length: 5 }).map((_, i) => (
												<Star
													key={i}
													size={14}
													className={
														i < testimonial.rating ? "text-amber-500 fill-amber-500" : "text-muted"
													}
												/>
											))}
										</div>

										<p className="text-xs text-muted-foreground italic leading-relaxed">
											&ldquo;{testimonial.quote}&rdquo;
										</p>
									</div>
								</SpotlightCard>
							))}
						</div>
					</div>
				</section>
			)}

			{/* FAQ Section */}
			<section className="py-8">
				<div className="container px-4 max-w-4xl mx-auto">
					<SectionHeader
						title={copy?.faqSection.title || "Questions & Answers"}
						subtitle={copy?.faqSection.subtitle || "FAQ"}
						description={copy?.faqSection.description}
						className="text-center mb-12"
					/>

					<SpotlightCard className="p-6 md:p-8 rounded-3xl bg-card/80 border border-border/50 shadow-lg">
						<Accordion type="single" collapsible className="w-full">
							{faqs.map((item, index) => (
								<AccordionItem
									key={item.id}
									value={`item-${index}`}
									className="border-b border-border/40 py-1"
								>
									<AccordionTrigger className="text-left font-semibold text-sm hover:text-primary transition-colors py-3">
										{item.question}
									</AccordionTrigger>
									<AccordionContent className="text-xs md:text-sm text-muted-foreground leading-relaxed pb-3">
										{item.answer}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</SpotlightCard>
				</div>
			</section>

			{/* Contact / Project Request Form Section */}
			<section id="contact-form" className="py-8 relative overflow-hidden">
				<div className="container px-4 max-w-4xl mx-auto">
					<SectionHeader
						title={copy?.contactSection.title || "Let's Build Something Great"}
						subtitle={copy?.contactSection.subtitle || "Project Inquiry"}
						description={copy?.contactSection.description}
						className="text-center mb-12"
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
														placeholder="Your email address"
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
												Company / Organization (Optional)
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Your company or project name"
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
													Service Package <span className="text-primary">*</span>
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="rounded-xl border-border/50 focus-visible:ring-primary/30 bg-background/80">
															<SelectValue placeholder="Select a package" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{pricingTiers.map((tier) => (
															<SelectItem key={tier.id} value={tier.slug}>
																{tier.name}
															</SelectItem>
														))}
														<SelectItem value="custom">Custom Engagement</SelectItem>
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
													Target Timeframe <span className="text-primary">*</span>
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
												Project Overview & Scope <span className="text-primary">*</span>
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Describe your goals, tech preferences, and any timeline expectations..."
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
									data-umami-event="hire-me-form-submit-click"
									className="w-full md:w-auto px-8 rounded-full shadow-lg shadow-primary/20 group"
									disabled={mutation.isPending || isSubmitting}
								>
									{mutation.isPending || isSubmitting ? (
										<span className="flex items-center">
											<Sparkles className="animate-spin -ml-1 mr-2 h-4 w-4" />
											Submitting...
										</span>
									) : (
										<span className="flex items-center gap-2">
											Submit Inquiry
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

			{/* Bottom CTA Section */}
			<section className="pb-8">
				<div className="container px-4 max-w-6xl mx-auto">
					{ctaData && <PowerfulCTACard {...ctaData} />}
				</div>
			</section>
		</div>
	);
}
