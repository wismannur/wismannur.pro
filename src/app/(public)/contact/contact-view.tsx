"use client";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { ContactForm, contactService } from "@/services";
import type { ContactCopy } from "@/services/page-copy/types";
import type { SiteSettings } from "@/services/site-settings/types";
import { RecaptchaDisclaimer } from "@/components/common/recaptcha-disclaimer";
import { getReCaptchaToken } from "@/services/recaptcha";
import { trackEvent } from "@/lib/umami";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
	ArrowRight,
	Clock,
	Github,
	Linkedin,
	Mail,
	MapPin,
	Sparkles,
	Twitter,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const contactFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().min(1, "Email is required").email("Invalid email address"),
	subject: z.string().min(1, "Subject is required"),
	message: z.string().min(20, "Message must be at least 20 characters"),
});

type ContactViewProps = {
	copy: ContactCopy | null;
	settings: SiteSettings;
};

export const ContactView = ({ copy, settings }: ContactViewProps) => {
	const contactDetails = [
		{
			icon: Mail,
			title: "Email",
			content: settings.publicEmail,
			link: `mailto:${settings.publicEmail}`,
		},
		{
			icon: MapPin,
			title: "Location",
			content: settings.location,
		},
		{
			icon: Clock,
			title: "Time Zone",
			content: settings.timezoneLabel,
		},
	];

	const socialLinks = [
		{ icon: Github, url: settings.social.github, label: "GitHub" },
		{ icon: Twitter, url: settings.social.twitter, label: "Twitter" },
		{ icon: Linkedin, url: settings.social.linkedin, label: "LinkedIn" },
	].filter(({ url }) => url);

	const form = useForm<z.infer<typeof contactFormSchema>>({
		resolver: zodResolver(contactFormSchema),
		defaultValues: {
			name: "",
			email: "",
			subject: "",
			message: "",
		},
	});

	const mutation = useMutation({
		mutationFn: ({ form, token }: { form: ContactForm; token: string }) =>
			contactService.submit(form, token),
		onSuccess: () => {
			toast({
				title: "Message sent!",
				description: "Thanks for reaching out. I'll get back to you soon.",
			});
			trackEvent("contact-form-submit-success", { subject: form.getValues().subject });
			form.reset();
		},
		onError: () => {
			toast({
				title: "Error",
				description: "Failed to send your message. Please try again.",
				variant: "destructive",
			});
			trackEvent("contact-form-submit-error");
		},
		onSettled: () => {
			setIsSubmitting(false);
		},
		retry: false,
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (data: z.infer<typeof contactFormSchema>) => {
		setIsSubmitting(true);
		trackEvent("contact-form-submit-attempt", { subject: data.subject });
		const token = await getReCaptchaToken();
		mutation.mutate({ form: data as ContactForm, token });
	};

	return (
		<section className="py-12 md:py-20 relative">
			<div className="container px-4 max-w-6xl mx-auto">
				<SectionHeader
					title={copy?.header.title || "Get In Touch"}
					subtitle={copy?.header.subtitle || "Contact Me"}
					description={copy?.header.description || "Have a project in mind or want to say hello? Drop me a message below."}
					className="text-center mb-14"
				/>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Contact Form Card */}
					<div className="lg:col-span-7 order-2 lg:order-1">
						<SpotlightCard className="p-8 md:p-10 rounded-3xl bg-card/80 border border-border/50 shadow-xl">
							<h3 className="text-2xl font-bold mb-2 text-foreground">
								Send Me a Message
							</h3>
							<p className="text-sm text-muted-foreground mb-8">
								Fill out the form, and I will get back to you as soon as possible.
							</p>

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
										name="subject"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground/80 font-medium text-xs">
													Subject <span className="text-primary">*</span>
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Project inquiry, collaboration, or consultation"
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
										name="message"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground/80 font-medium text-xs">
													Message <span className="text-primary">*</span>
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Tell me more about your requirements or idea..."
														rows={5}
														className="rounded-xl border-border/50 focus-visible:ring-primary/30 resize-none bg-background/80"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<Button
										type="submit"
										size="lg"
										data-umami-event="contact-form-submit-click"
										className="w-full md:w-auto px-8 rounded-full shadow-lg shadow-primary/20 group"
										disabled={mutation.isPending || isSubmitting}
									>
										{mutation.isPending || isSubmitting ? (
											<span className="flex items-center">
												<Sparkles className="animate-spin -ml-1 mr-2 h-4 w-4" />
												Sending...
											</span>
										) : (
											<span className="flex items-center gap-2">
												Send Message
												<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
											</span>
										)}
									</Button>

									<RecaptchaDisclaimer />
								</form>
							</Form>
						</SpotlightCard>
					</div>

					{/* Contact Details Card */}
					<div className="lg:col-span-5 order-1 lg:order-2">
						<SpotlightCard className="p-8 md:p-10 rounded-3xl bg-card/80 border border-border/50 shadow-xl h-full flex flex-col justify-between">
							<div>
								<h3 className="text-2xl font-bold mb-2 text-foreground">
									Direct Coordinates
								</h3>
								<p className="text-sm text-muted-foreground mb-8">
									Feel free to connect directly via email or social platforms.
								</p>

								<div className="space-y-6">
									{contactDetails.map(({ icon: Icon, title, content, link }, index) => (
										<div key={index} className="flex items-start group">
											<div className="p-3 bg-primary/10 rounded-xl text-primary mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
												<Icon size={20} />
											</div>
											<div>
												<h4 className="font-semibold text-sm text-foreground">{title}</h4>
												{link ? (
													<a
														href={link}
														data-umami-event="contact-info-link-click"
														data-umami-event-label={title}
														className="text-xs text-muted-foreground hover:text-primary transition-colors"
														rel="noopener noreferrer"
														target="_blank"
													>
														{content}
													</a>
												) : (
													<p className="text-xs text-muted-foreground">{content}</p>
												)}
											</div>
										</div>
									))}
								</div>
							</div>

							<div className="mt-10 pt-6 border-t border-border/40">
								<h4 className="font-semibold text-xs text-muted-foreground tracking-wider mb-4 uppercase">
									Social Presence
								</h4>
								<div className="flex gap-2.5">
									{socialLinks.map(({ icon: Icon, url, label }, index) => (
										<a
											key={index}
											href={url}
											target="_blank"
											rel="noopener noreferrer"
											data-umami-event="contact-social-click"
											data-umami-event-platform={label}
											className="p-3 bg-background/80 border border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-md transition-all duration-300"
											aria-label={label}
										>
											<Icon size={18} />
										</a>
									))}
								</div>
							</div>
						</SpotlightCard>
					</div>
				</div>
			</div>
		</section>
	);
};
