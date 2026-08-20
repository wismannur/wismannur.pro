"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { siteSettingsService } from "@/services";
import type { SiteSettings } from "@/services/site-settings/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Contact, Globe, Layout, ListChecks, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// List-ish fields are edited as one-entry-per-line text; "id | label" and
// "Label | https://url" pairs use a pipe separator.
const lines = (value: string) =>
	value
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

const toPairLines = (items: Array<{ id?: string; label: string; href?: string }>, kind: "option" | "link") =>
	items
		.map((item) =>
			kind === "option" ? `${item.id} | ${item.label}` : `${item.label} | ${item.href}`,
		)
		.join("\n");

const parseOptionLines = (value: string) =>
	lines(value).map((line) => {
		const [id, ...rest] = line.split("|");
		return { id: id.trim(), label: rest.join("|").trim() || id.trim() };
	});

const parseLinkLines = (value: string) =>
	lines(value).map((line) => {
		const [label, ...rest] = line.split("|");
		return { label: label.trim(), href: rest.join("|").trim() };
	});

const siteFormSchema = z.object({
	siteName: z.string().min(1, "Site name is required"),
	titleDefault: z.string().min(1, "Default title is required"),
	titleTemplate: z.string().min(1, "Title template is required"),
	metaDescription: z.string(),
	keywordsText: z.string(),
	twitterHandle: z.string(),
	themeColor: z.string(),
	ogTitle: z.string(),
	ogTagline: z.string(),
	publicEmail: z.string().email("Invalid email").or(z.literal("")),
	location: z.string(),
	timezoneLabel: z.string(),
	github: z.string(),
	twitter: z.string(),
	linkedin: z.string(),
	footerBio: z.string(),
	footerTagline: z.string(),
	copyrightName: z.string(),
	repoUrl: z.string(),
	repoLinkLabel: z.string(),
	footerProjectLinksText: z.string(),
	requestTimeframesText: z.string(),
	requestBudgetRangesText: z.string(),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;

const toFormValues = (settings: SiteSettings): SiteFormValues => ({
	siteName: settings.siteName,
	titleDefault: settings.titleDefault,
	titleTemplate: settings.titleTemplate,
	metaDescription: settings.metaDescription,
	keywordsText: settings.keywords.join("\n"),
	twitterHandle: settings.twitterHandle,
	themeColor: settings.themeColor,
	ogTitle: settings.ogTitle,
	ogTagline: settings.ogTagline,
	publicEmail: settings.publicEmail,
	location: settings.location,
	timezoneLabel: settings.timezoneLabel,
	github: settings.social.github,
	twitter: settings.social.twitter,
	linkedin: settings.social.linkedin,
	footerBio: settings.footerBio,
	footerTagline: settings.footerTagline,
	copyrightName: settings.copyrightName,
	repoUrl: settings.repoUrl,
	repoLinkLabel: settings.repoLinkLabel,
	footerProjectLinksText: toPairLines(settings.footerProjectLinks, "link"),
	requestTimeframesText: toPairLines(settings.requestTimeframes, "option"),
	requestBudgetRangesText: toPairLines(settings.requestBudgetRanges, "option"),
});

export default function CmsSitePage() {
	const queryClient = useQueryClient();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: settings, isLoading } = useQuery({
		queryKey: ["cmsSiteSettings"],
		queryFn: () => siteSettingsService.get(),
	});

	const form = useForm<SiteFormValues>({
		resolver: zodResolver(siteFormSchema),
		defaultValues: {
			siteName: "",
			titleDefault: "",
			titleTemplate: "",
			metaDescription: "",
			keywordsText: "",
			twitterHandle: "",
			themeColor: "",
			ogTitle: "",
			ogTagline: "",
			publicEmail: "",
			location: "",
			timezoneLabel: "",
			github: "",
			twitter: "",
			linkedin: "",
			footerBio: "",
			footerTagline: "",
			copyrightName: "",
			repoUrl: "",
			repoLinkLabel: "",
			footerProjectLinksText: "",
			requestTimeframesText: "",
			requestBudgetRangesText: "",
		},
	});

	useEffect(() => {
		if (settings) form.reset(toFormValues(settings));
	}, [settings, form]);

	const onSubmit = async (data: SiteFormValues) => {
		setIsSubmitting(true);
		try {
			await siteSettingsService.update({
				siteName: data.siteName.trim(),
				titleDefault: data.titleDefault.trim(),
				titleTemplate: data.titleTemplate.trim(),
				metaDescription: data.metaDescription.trim(),
				keywords: lines(data.keywordsText),
				twitterHandle: data.twitterHandle.trim(),
				themeColor: data.themeColor.trim(),
				ogTitle: data.ogTitle.trim(),
				ogTagline: data.ogTagline.trim(),
				publicEmail: data.publicEmail.trim(),
				location: data.location.trim(),
				timezoneLabel: data.timezoneLabel.trim(),
				social: {
					github: data.github.trim(),
					twitter: data.twitter.trim(),
					linkedin: data.linkedin.trim(),
				},
				footerBio: data.footerBio.trim(),
				footerTagline: data.footerTagline.trim(),
				copyrightName: data.copyrightName.trim(),
				repoUrl: data.repoUrl.trim(),
				repoLinkLabel: data.repoLinkLabel.trim(),
				footerProjectLinks: parseLinkLines(data.footerProjectLinksText),
				requestTimeframes: parseOptionLines(data.requestTimeframesText),
				requestBudgetRanges: parseOptionLines(data.requestBudgetRangesText),
			});
			queryClient.invalidateQueries({ queryKey: ["cmsSiteSettings"] });
			toast.success("Site settings saved — public pages update immediately");
		} catch (error) {
			console.error("Error saving site settings:", error);
			toast.error("Failed to save site settings");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-96">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
				<span className="ml-2 text-lg">Loading settings...</span>
			</div>
		);
	}

	const textInput = (
		name: keyof SiteFormValues,
		label: string,
		placeholder = "",
		description?: string,
	) => (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel className="text-foreground/80 font-medium">{label}</FormLabel>
					<FormControl>
						<Input
							placeholder={placeholder}
							className="rounded-lg border-border/50 focus-visible:ring-primary/30"
							{...field}
						/>
					</FormControl>
					{description && <FormDescription>{description}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	const textArea = (
		name: keyof SiteFormValues,
		label: string,
		rows: number,
		description?: string,
	) => (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel className="text-foreground/80 font-medium">{label}</FormLabel>
					<FormControl>
						<Textarea
							rows={rows}
							className="rounded-lg border-border/50 focus-visible:ring-primary/30"
							{...field}
						/>
					</FormControl>
					{description && <FormDescription>{description}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	return (
		<div className="space-y-6 max-w-4xl">
			<div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
					<p className="text-muted-foreground">
						Global identity, SEO, contact info, and footer content — changes go live without a
						redeploy
					</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Tabs defaultValue="identity">
						{/* h-auto: the default h-10 clips the second row when the four tabs
						    wrap on narrow screens */}
						<TabsList className="flex-wrap h-auto">
							<TabsTrigger value="identity">
								<Globe className="mr-2 h-4 w-4" />
								Identity & SEO
							</TabsTrigger>
							<TabsTrigger value="contact">
								<Contact className="mr-2 h-4 w-4" />
								Contact & Social
							</TabsTrigger>
							<TabsTrigger value="footer">
								<Layout className="mr-2 h-4 w-4" />
								Footer
							</TabsTrigger>
							<TabsTrigger value="forms">
								<ListChecks className="mr-2 h-4 w-4" />
								Form Options
							</TabsTrigger>
						</TabsList>

						<TabsContent value="identity" className="mt-6">
							<Card className="border-border/50 shadow-md rounded-xl">
								<CardHeader>
									<CardTitle>Identity & SEO</CardTitle>
									<CardDescription>
										Feeds the browser title, meta tags, and the generated social-share image
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{textInput("siteName", "Site Name", "Wisman Nur")}
									{textInput(
										"titleDefault",
										"Default Title",
										"Wisman Nur - Frontend Software Engineer",
									)}
									{textInput(
										"titleTemplate",
										"Title Template",
										"%s | Wisman Nur",
										"%s is replaced with the page title",
									)}
									{textArea("metaDescription", "Meta Description", 3)}
									{textArea("keywordsText", "Keywords (one per line)", 4)}
									{textInput("twitterHandle", "Twitter Handle", "@wismannur")}
									{textInput("themeColor", "Theme Color", "#4F46E5", "Browser UI accent color")}
									{textInput(
										"ogTitle",
										"Share Image Role Line",
										"Frontend Software Engineer",
										"Second line on the generated social-share image",
									)}
									{textArea(
										"ogTagline",
										"Share Image Tagline",
										2,
										"Bottom line on the generated social-share image",
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="contact" className="mt-6">
							<Card className="border-border/50 shadow-md rounded-xl">
								<CardHeader>
									<CardTitle>Contact & Social</CardTitle>
									<CardDescription>Shown in the footer and on the contact page</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{textInput("publicEmail", "Public Email", "you@example.com")}
									{textInput("location", "Location", "Bandung, West Java, Indonesia")}
									{textInput(
										"timezoneLabel",
										"Time Zone Label",
										"Western Indonesian Time, UTC+07:00",
									)}
									{textInput("github", "GitHub URL", "https://github.com/…")}
									{textInput("twitter", "Twitter / X URL", "https://x.com/…")}
									{textInput("linkedin", "LinkedIn URL", "https://linkedin.com/in/…")}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="footer" className="mt-6">
							<Card className="border-border/50 shadow-md rounded-xl">
								<CardHeader>
									<CardTitle>Footer</CardTitle>
									<CardDescription>Copy shown in the site-wide footer</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{textArea("footerBio", "Footer Bio", 3)}
									{textInput("footerTagline", "Footer Tagline", "Made with ♥ using React & Tailwind")}
									{textInput("copyrightName", "Copyright Name", "Wisman Nur")}
									{textInput("repoUrl", "Repository URL", "https://github.com/…")}
									{textInput("repoLinkLabel", "Repository Link Label", "See the recent update on Github")}
									{textArea(
										"footerProjectLinksText",
										"Project Links (one per line)",
										3,
										'Format: "Label | https://url" — leave empty to hide the PROJECTS column',
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="forms" className="mt-6">
							<Card className="border-border/50 shadow-md rounded-xl">
								<CardHeader>
									<CardTitle>Request Form Options</CardTitle>
									<CardDescription>
										Dropdown options for the service-request forms on /services and /hire-me
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{textArea(
										"requestTimeframesText",
										"Timeframes (one per line)",
										5,
										'Format: "id | Label", e.g. "asap | As soon as possible". Ids are stored with submissions — avoid changing existing ids.',
									)}
									{textArea(
										"requestBudgetRangesText",
										"Budget Ranges (one per line)",
										6,
										'Format: "id | Label", e.g. "under-1000 | Under $1,000"',
									)}
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>

					<div className="flex justify-end">
						<Button type="submit" disabled={isSubmitting} className="rounded-lg">
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Save Settings
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
