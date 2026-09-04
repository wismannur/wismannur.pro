"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Contact,
  Globe,
  Layout,
  ListChecks,
  Loader2,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { siteSettingsService } from "@/services";
import type { SiteSettings } from "@/services/site-settings/types";

// List-ish fields are edited as one-entry-per-line text; "id | label" and
// "Label | https://url" pairs use a pipe separator.
const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const toPairLines = (
  items: Array<{ id?: string; label: string; href?: string }>,
  kind: "option" | "link"
) =>
  items
    .map((item) =>
      kind === "option" ? `${item.id} | ${item.label}` : `${item.label} | ${item.href}`
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
  enableBlog: z.boolean(),
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
  enableBlog: settings.enableBlog ?? true,
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
      enableBlog: true,
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
        enableBlog: data.enableBlog,
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <span className="ml-3 text-sm font-medium text-slate-300">Loading site settings...</span>
      </div>
    );
  }

  type StringFieldKeys = {
    [K in keyof SiteFormValues]: SiteFormValues[K] extends string ? K : never;
  }[keyof SiteFormValues];

  const textInput = (
    name: StringFieldKeys,
    label: string,
    placeholder = "",
    description?: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-slate-200 text-xs font-semibold">{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              className="h-10 rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/40"
              {...field}
            />
          </FormControl>
          {description && <FormDescription className="text-slate-400 text-[11px]">{description}</FormDescription>}
          <FormMessage className="text-xs text-rose-400" />
        </FormItem>
      )}
    />
  );

  const textArea = (name: StringFieldKeys, label: string, rows: number, description?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-slate-200 text-xs font-semibold">{label}</FormLabel>
          <FormControl>
            <Textarea
              rows={rows}
              className="rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs leading-relaxed focus-visible:ring-indigo-500/40"
              {...field}
            />
          </FormControl>
          {description && <FormDescription className="text-slate-400 text-[11px]">{description}</FormDescription>}
          <FormMessage className="text-xs text-rose-400" />
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Globe className="w-5 h-5" />
            </span>
            Site Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global identity, SEO, social presence, footer details, and service form parameters.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="flex-wrap h-auto p-1.5 bg-[#0C0E18]/90 border border-white/[0.08] rounded-2xl gap-1 backdrop-blur-xl">
              <TabsTrigger
                value="identity"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 transition-all"
              >
                <Globe className="mr-2 h-4 w-4" />
                Identity & SEO
              </TabsTrigger>
              <TabsTrigger
                value="features"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 transition-all"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Features
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 transition-all"
              >
                <Contact className="mr-2 h-4 w-4" />
                Contact & Social
              </TabsTrigger>
              <TabsTrigger
                value="footer"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 transition-all"
              >
                <Layout className="mr-2 h-4 w-4" />
                Footer
              </TabsTrigger>
              <TabsTrigger
                value="forms"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 transition-all"
              >
                <ListChecks className="mr-2 h-4 w-4" />
                Form Options
              </TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-6">
              <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
                  <CardTitle className="text-base font-bold text-white">Site Features & Modules</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Control the visibility of public sections and pages without affecting CMS access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="enableBlog"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl bg-[#131726]/70 border border-white/[0.06] p-4.5 shadow-sm">
                        <div className="space-y-1 pr-4">
                          <FormLabel className="text-sm font-bold text-white">
                            Enable Blog Module
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-400 leading-relaxed">
                            When enabled, the /blog page, article previews on the home page,
                            navigation links, and sitemap entries will be visible to public
                            visitors. When disabled, the public pages return 404 while remaining
                            fully editable in the CMS.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="identity" className="mt-6">
              <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
                  <CardTitle className="text-base font-bold text-white">Identity & SEO</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Feeds the browser title, meta tags, search indexing, and generated social-share cards.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {textInput("siteName", "Site Name", "Wisman Nur")}
                    {textInput("themeColor", "Theme Color", "#4F46E5", "Browser UI accent color")}
                  </div>
                  {textInput(
                    "titleDefault",
                    "Default Title",
                    "Wisman Nur - Frontend Software Engineer"
                  )}
                  {textInput(
                    "titleTemplate",
                    "Title Template",
                    "%s | Wisman Nur",
                    "%s is replaced with the active page title"
                  )}
                  {textArea("metaDescription", "Meta Description", 3, "Summary snippet for search engine indexing")}
                  {textArea("keywordsText", "Keywords (one per line)", 4, "Key SEO tags for discovery")}
                  {textInput("twitterHandle", "Twitter / X Handle", "@wismannur")}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
                    {textInput(
                      "ogTitle",
                      "Share Image Role Line",
                      "Frontend Software Engineer",
                      "Second line on the generated social-share image"
                    )}
                    {textInput(
                      "ogTagline",
                      "Share Image Tagline",
                      "Building resilient web apps",
                      "Bottom line on the generated social-share image"
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="mt-6">
              <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
                  <CardTitle className="text-base font-bold text-white">Contact & Social Links</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Displayed in the footer, author bio card, and public contact views.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {textInput("publicEmail", "Public Email", "you@example.com")}
                    {textInput("location", "Location", "Bandung, West Java, Indonesia")}
                  </div>
                  {textInput(
                    "timezoneLabel",
                    "Time Zone Label",
                    "Western Indonesian Time, UTC+07:00"
                  )}
                  <div className="pt-2 border-t border-white/[0.06] space-y-4">
                    {textInput("github", "GitHub Profile URL", "https://github.com/…")}
                    {textInput("twitter", "Twitter / X Profile URL", "https://x.com/…")}
                    {textInput("linkedin", "LinkedIn Profile URL", "https://linkedin.com/in/…")}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="footer" className="mt-6">
              <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
                  <CardTitle className="text-base font-bold text-white">Footer Configuration</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Content and branding rendered in the site-wide footer component.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {textArea("footerBio", "Footer Bio", 3, "Short summary beneath your name in the footer")}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {textInput(
                      "footerTagline",
                      "Footer Tagline",
                      "Crafted with precision & modern web architecture"
                    )}
                    {textInput("copyrightName", "Copyright Name", "Wisman Nur")}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {textInput("repoUrl", "Source Code Repository URL", "https://github.com/…")}
                    {textInput(
                      "repoLinkLabel",
                      "Repository Link Label",
                      "See the recent update on Github"
                    )}
                  </div>
                  {textArea(
                    "footerProjectLinksText",
                    "Footer Project Links (one per line)",
                    3,
                    'Format: "Label | https://url" — leave empty to hide the PROJECTS column'
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forms" className="mt-6">
              <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
                  <CardTitle className="text-base font-bold text-white">Service Request Form Options</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Dropdown options powering the service inquiry form on /services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {textArea(
                    "requestTimeframesText",
                    "Timeframes (one per line)",
                    5,
                    'Format: "id | Label", e.g. "asap | As soon as possible". IDs are stored with submissions — avoid altering existing IDs.'
                  )}
                  {textArea(
                    "requestBudgetRangesText",
                    "Budget Ranges (one per line)",
                    6,
                    'Format: "id | Label", e.g. "under-1000 | Under $1,000"'
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-6 h-10 text-xs font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Site Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
