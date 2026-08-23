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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { toast } from "@/components/ui/use-toast";
import { getContentIcon } from "@/lib/icon-registry";
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
	Calendar,
	CheckCircle,
	CheckCircle2,
	ChevronDown,
	Clock,
	MessageSquare,
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

// Form schema
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

export const HireMeView = ({
	copy,
	pricingTiers,
	expertiseAreas,
	testimonials,
	processSteps,
	faqs,
	availabilitySlots,
	timeframes,
	budgetRanges,
}: HireMeViewProps) => {
	const ctaData = copy?.cta;
	const [selectedService, setSelectedService] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("services");
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
			form.reset();
		},
		onError: () => {
			toast({
				title: "Error",
				description: "Failed to send your request. Please try again.",
				variant: "destructive",
			});
		},
		onSettled: () => {
			setIsSubmitting(false);
		},
	});

	const onSubmit = async (data: HireFormValues) => {
		setIsSubmitting(true);
		// Token is verified server-side inside `submit` (empty in stub mode).
		const token = await getReCaptchaToken();
		mutation.mutate({ form: data, token });
	};

	const handleServiceSelect = (serviceId: string) => {
		setSelectedService(serviceId);
		form.setValue("serviceType", serviceId);

		// Scroll to the contact form
		const contactForm = document.getElementById("contact-form");
		if (contactForm) {
			contactForm.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<div className="space-y-24">
			{/* Hero Section */}
			<section className="relative overflow-hidden py-12 md:py-20">
				<div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
				<div className="container px-4 max-w-6xl mx-auto">
					<div className="flex flex-col items-center text-center max-w-3xl mx-auto">
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6 animate-fade-in">
							<Calendar size={16} className="shrink-0" />
							{copy?.hero.eyebrow}
						</div>

						<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight animate-fade-in">
							<HighlightedText text={copy?.hero.title ?? ""} />
						</h1>

						<p className="text-lg text-muted-foreground mb-8 leading-relaxed animate-fade-in">
							{copy?.hero.description}
						</p>

						<div className="flex flex-wrap gap-4 justify-center animate-fade-in">
							<Button
								size="lg"
								className="rounded-full px-8 group"
								onClick={() => {
									const contactForm = document.getElementById("contact-form");
									if (contactForm) {
										contactForm.scrollIntoView({ behavior: "smooth" });
									}
								}}
							>
								Get Started
								<ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
							</Button>

							<Button
								variant="outline"
								size="lg"
								className="rounded-full px-8 group"
								onClick={() => {
									const servicesSection = document.getElementById("services-section");
									if (servicesSection) {
										servicesSection.scrollIntoView({ behavior: "smooth" });
									}
								}}
							>
								View Services
								<ChevronDown className="ml-2 transition-transform" />
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Availability Section */}
			<section className="py-12 bg-muted/30">
				<div className="container px-4 max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-background border border-border/40 rounded-3xl p-8 shadow-lg">
						<div className="md:w-1/2">
							<h2 className="text-2xl font-bold mb-2">{copy?.availabilitySection.title}</h2>
							<p className="text-muted-foreground mb-6">{copy?.availabilitySection.description}</p>

							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{availabilitySlots.map((slot) => (
									<div
										key={slot.id}
										className="text-center p-4 border border-border/40 rounded-xl bg-background"
									>
										<p className="font-medium">
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
											className="mt-2"
										>
											{slot.label}
										</Badge>
									</div>
								))}
							</div>
						</div>

						<div className="md:w-1/2 flex flex-col items-center md:items-end">
							<div className="flex items-center gap-2 mb-4">
								<Clock size={20} className="text-primary" />
								<span className="font-medium">{copy?.availabilitySection.timezoneNote}</span>
							</div>

							<Button size="lg" className="rounded-full px-8 w-full md:w-auto" asChild>
								<Link href="/contact" rel="noopener noreferrer">
									<MessageSquare size={18} />
									Get in Touch
								</Link>
							</Button>

							<p className="text-sm text-muted-foreground mt-3">
								{copy?.availabilitySection.contactNote}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Services & Pricing Section */}
			<section id="services-section" className="py-24 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.servicesSection.title}
						subtitle={copy?.servicesSection.subtitle}
						description={copy?.servicesSection.description}
						className="text-center mb-16"
					/>

					<Tabs defaultValue="services" className="w-full" onValueChange={setActiveTab}>
						<TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
							<TabsTrigger
								value="services"
								className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
							>
								Service Packages
							</TabsTrigger>
							<TabsTrigger
								value="expertise"
								className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
							>
								Areas of Expertise
							</TabsTrigger>
						</TabsList>

						<TabsContent value="services" className="space-y-8 animate-fade-in">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
								{pricingTiers.map((tier) => (
									<Card
										key={tier.id}
										className={cn(
											"border border-border/40 transition-all duration-300 overflow-hidden relative",
											selectedService === tier.slug
												? "ring-2 ring-primary border-transparent shadow-lg"
												: "hover:border-primary/30 hover:shadow-md",
										)}
									>
										{tier.isPopular && (
											<div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-medium">
												Most Popular
											</div>
										)}

										<CardHeader className="pb-4">
											<CardTitle className="text-xl">{tier.name}</CardTitle>
											<div className="mt-2">
												<span className="text-3xl font-bold">{tier.priceLabel}</span>
											</div>
											<CardDescription className="mt-2">{tier.description}</CardDescription>
										</CardHeader>

										<CardContent className="pb-4">
											<ul className="space-y-2">
												{tier.features.map((feature, index) => (
													<li key={index} className="flex items-start text-sm">
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
												variant={selectedService === tier.slug ? "default" : "outline"}
												className="w-full rounded-xl"
												onClick={() => handleServiceSelect(tier.slug)}
											>
												{tier.ctaLabel}
											</Button>
										</CardFooter>
									</Card>
								))}
							</div>

							<div className="text-center mt-8 text-muted-foreground">
								<p>
									Need a custom solution?{" "}
									<Button
										variant="link"
										className="p-0 h-auto"
										onClick={() => {
											const contactForm = document.getElementById("contact-form");
											if (contactForm) {
												contactForm.scrollIntoView({ behavior: "smooth" });
											}
										}}
									>
										Contact me
									</Button>{" "}
									for a personalized quote.
								</p>
							</div>
						</TabsContent>

						<TabsContent value="expertise" className="animate-fade-in">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
								{expertiseAreas.map((service, index) => {
									const Icon = getContentIcon(service.icon);
									return (
										<div
											key={service.id}
											className={cn(
												"group bg-background border border-border/50 rounded-xl p-8",
												"hover:border-primary/30 dark:hover:border-primary/70 hover:shadow-lg transition-all duration-300",
												"flex flex-col h-full",
											)}
											style={{ animationDelay: `${(index + 1) * 0.1}s` }}
										>
											<div className="p-4 bg-primary/10 rounded-xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
												<Icon size={24} />
											</div>
											<h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
												{service.title}
											</h3>
											<p className="text-muted-foreground leading-relaxed flex-grow">
												{service.description}
											</p>
										</div>
									);
								})}
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</section>

			{/* Process Section */}
			<section className="py-24 bg-muted/30">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.processSection.title}
						subtitle={copy?.processSection.subtitle}
						description={copy?.processSection.description}
						className="text-center mb-16"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						{processSteps.map((step, index) => {
							const Icon = getContentIcon(step.icon);
							return (
								<div key={step.id} className="relative group">
									{/* Connector line */}
									{index < processSteps.length - 1 && (
										<div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-border z-0">
											<div
												className="absolute top-0 left-0 h-full bg-primary"
												style={{ width: "0%", transition: "width 1s ease" }}
											></div>
										</div>
									)}

									<div className="bg-background border border-border/40 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 relative overflow-hidden h-full z-10">
										<div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-2xl flex items-center justify-center font-bold text-primary">
											{String(index + 1).padStart(2, "0")}
										</div>

										<div className="p-4 bg-primary/10 rounded-xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
											<Icon size={24} />
										</div>

										<h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
											{step.title}
										</h3>

										<p className="text-muted-foreground">{step.description}</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Testimonials Section — hidden until a real testimonial is published */}
			{testimonials.length > 0 && (
				<section className="py-24 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
					<div className="container px-4 max-w-6xl mx-auto">
						<SectionHeader
							title={copy?.testimonialsSection.title}
							subtitle={copy?.testimonialsSection.subtitle}
							description={copy?.testimonialsSection.description}
							className="text-center mb-16"
						/>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{testimonials.map((testimonial) => (
								<div
									key={testimonial.id}
									className="bg-background border border-border/40 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
								>
									<div className="flex items-center gap-4 mb-6">
										<img
											src={testimonial.avatarUrl || "/placeholder.svg"}
											alt={testimonial.authorName}
											className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
										/>
										<div>
											<h3 className="font-bold">{testimonial.authorName}</h3>
											<p className="text-sm text-muted-foreground">{testimonial.authorRole}</p>
										</div>
									</div>

									<div className="flex mb-4">
										{Array.from({ length: 5 }).map((_, i) => (
											<Star
												key={i}
												size={16}
												className={
													i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"
												}
											/>
										))}
									</div>

									<p className="text-muted-foreground italic flex-grow">"{testimonial.quote}"</p>
								</div>
							))}
						</div>
					</div>
				</section>
			)}

			{/* FAQ Section */}
			<section className="py-24 bg-muted/30">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.faqSection.title}
						subtitle={copy?.faqSection.subtitle}
						description={copy?.faqSection.description}
						className="text-center mb-16"
					/>

					<div className="max-w-3xl mx-auto">
						<Accordion type="single" collapsible className="w-full">
							{faqs.map((item, index) => (
								<AccordionItem
									key={item.id}
									value={`item-${index}`}
									className="border-b border-border/40"
								>
									<AccordionTrigger className="text-left font-medium py-4 hover:text-primary transition-colors">
										{item.question}
									</AccordionTrigger>
									<AccordionContent className="text-muted-foreground pb-4">
										{item.answer}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>

						<div className="mt-12 text-center">
							<p className="text-muted-foreground mb-4">Still have questions?</p>
							<Button
								variant="outline"
								size="lg"
								className="rounded-full px-8"
								onClick={() => {
									const contactForm = document.getElementById("contact-form");
									if (contactForm) {
										contactForm.scrollIntoView({ behavior: "smooth" });
									}
								}}
							>
								Contact Me
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Contact Form Section */}
			<section id="contact-form" className="py-24 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.contactSection.title}
						subtitle={copy?.contactSection.subtitle}
						description={copy?.contactSection.description}
						className="text-center mb-16"
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
															{pricingTiers.map((tier) => (
																<SelectItem key={tier.id} value={tier.slug}>
																	{tier.name} Package
																</SelectItem>
															))}
															<SelectItem value="custom">Custom Project</SelectItem>
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

			{/* CTA Section */}
			<section className="py-16 !mt-6">
				<div className="container px-4 max-w-6xl mx-auto">
					{ctaData && <PowerfulCTACard {...ctaData} />}
				</div>
			</section>
		</div>
	);
};
