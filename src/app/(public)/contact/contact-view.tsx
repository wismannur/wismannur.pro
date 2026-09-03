"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Calendar,
  Check,
  Copy,
  Github,
  Linkedin,
  MapPin,
  MessageSquare,
  Sparkles,
  Twitter,
  Zap,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

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
import { RecaptchaDisclaimer } from "@/components/common/recaptcha-disclaimer";
import { SubmissionSuccessModal } from "@/components/common/submission-success-modal";
import { getReCaptchaToken } from "@/services/recaptcha";
import { contactService, type ContactForm } from "@/services";
import type { ContactCopy } from "@/services/page-copy/types";
import type { SiteSettings } from "@/services/site-settings/types";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";

const contactFormSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
  email: z.string().min(1, "Please enter your email").email("Please enter a valid email address"),
  subject: z.string().min(1, "Please specify a subject or topic"),
  message: z.string().min(15, "Message must be at least 15 characters"),
});

type ContactViewProps = {
  copy: ContactCopy | null;
  settings: SiteSettings;
};

const INQUIRY_TOPICS = [
  { label: "💼 Senior Fullstack Role", value: "Senior Fullstack Engineering Opportunity" },
  { label: "🤖 Autonomous AI & Agents", value: "Autonomous AI Agent & LLM Architecture Project" },
  { label: "🚀 Zero-to-One MVP Build", value: "End-to-End MVP Product Engineering" },
  { label: "⚡ Architecture & Speed Audit", value: "Web Performance & Architecture Audit" },
  { label: "🤝 Monthly Tech Retainer", value: "Fractional Lead / Monthly Engineering Retainer" },
  { label: "💬 General Collaboration", value: "General Inquiry & Technical Discussion" },
];

export const ContactView = ({ copy, settings }: ContactViewProps) => {
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<z.infer<typeof contactFormSchema> | null>(
    null
  );

  const email = settings.publicEmail || "wismannur@gmail.com";
  const locationText = settings.location
    ? `${settings.location} (UTC+7)`
    : "Bandung, West Java, Indonesia (UTC+7)";

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
    mutationFn: ({ formData, token }: { formData: ContactForm; token: string }) =>
      contactService.submit(formData, token),
    onSuccess: (id: string) => {
      setSubmissionId(id);
      setSuccessModalOpen(true);
      trackEvent("contact-form-submit-success", { subject: form.getValues().subject });
      form.reset();
      setSelectedTopic("");
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Something went wrong. Please try again or reach out directly via email.",
        variant: "destructive",
      });
      trackEvent("contact-form-submit-error");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
    retry: false,
  });

  const onSubmit = async (data: z.infer<typeof contactFormSchema>) => {
    setIsSubmitting(true);
    trackEvent("contact-form-submit-attempt", { subject: data.subject });
    setSubmittedData(data);
    const token = await getReCaptchaToken();
    mutation.mutate({ formData: data as ContactForm, token });
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setHasCopiedEmail(true);
      trackEvent("contact-page-copy-email", { email });
      toast({
        title: "Email address copied!",
        description: email,
      });
      setTimeout(() => setHasCopiedEmail(false), 2000);
    } catch (err) {
      console.error("Failed to copy email", err);
    }
  };

  const handleSelectTopic = (topic: { label: string; value: string }) => {
    setSelectedTopic(topic.value);
    form.setValue("subject", topic.value, { shouldValidate: true });
    trackEvent("contact-topic-select", { topic: topic.value });
  };

  const socialLinks = [
    {
      icon: Linkedin,
      url: settings.social.linkedin,
      label: "LinkedIn",
      color: "hover:text-blue-400",
    },
    { icon: Github, url: settings.social.github, label: "GitHub", color: "hover:text-purple-400" },
    {
      icon: Twitter,
      url: settings.social.twitter,
      label: "Twitter / X",
      color: "hover:text-cyan-400",
    },
  ].filter(({ url }) => url);

  return (
    <div className="space-y-12 md:space-y-16 pb-12">
      {/* Hero & Section Header */}
      <section className="relative overflow-hidden pt-4 sm:pt-8 md:pt-12">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/15 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[250px] bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="container px-4 max-w-6xl mx-auto">
          <SectionHeader
            title={copy?.header.title || "Let's Engineer Something **Exceptional** Together."}
            subtitle={copy?.header.subtitle || "DIRECT CONNECT & INQUIRIES"}
            description={
              copy?.header.description ||
              "Whether you need a Senior Fullstack Architect for a high-throughput platform, autonomous AI agent integration, or an initial technical alignment call — let's connect."
            }
            className="text-center mb-10 md:mb-14"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Direct Coordinates & Availability Hub (Col 5) */}
            <div className="lg:col-span-5 space-y-6 animate-scale-in">
              <SpotlightCard className="p-6 md:p-8 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.09] shadow-2xl backdrop-blur-xl">
                <div className="space-y-6">
                  {/* Live Status Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="text-xs font-semibold text-white">Direct Availability</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      Open for Roles
                    </span>
                  </div>

                  {/* Direct Details Grid */}
                  <div className="space-y-4 text-xs sm:text-sm">
                    {/* Response Time */}
                    <div className="flex items-start gap-3 text-gray-300">
                      <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 flex-shrink-0 mt-0.5">
                        <Zap size={15} />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Response Guarantee</p>
                        <p className="text-xs text-gray-400">Typically replies within 2–4 hours</p>
                      </div>
                    </div>

                    {/* Location & Timezone */}
                    <div className="flex items-start gap-3 text-gray-300">
                      <div className="p-2 rounded-xl bg-primary/15 text-primary flex-shrink-0 mt-0.5">
                        <MapPin size={15} />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Location & Timezone</p>
                        <p className="text-xs text-gray-400">
                          {locationText} • Global Remote Ready
                        </p>
                      </div>
                    </div>

                    {/* Email 1-Click Copy Box */}
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Direct Email
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          aria-label="Copy email address"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-white transition-colors"
                        >
                          {hasCopiedEmail ? (
                            <>
                              <Check size={13} className="text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-mono text-xs text-white truncate">{email}</p>
                    </div>
                  </div>

                  {/* Direct Social / Code Networks */}
                  <div className="pt-2 border-t border-white/[0.08]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                      Direct Channels & Code
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {socialLinks.map(({ icon: Icon, url, label, color }) => (
                        <a
                          key={label}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-umami-event="contact-social-channel-click"
                          data-umami-event-platform={label}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-300 hover:border-primary/40 hover:bg-white/[0.06] transition-all group",
                            color
                          )}
                        >
                          <Icon
                            size={18}
                            className="mb-1 transition-transform group-hover:scale-110"
                          />
                          <span className="text-[10px] font-semibold">{label}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 15-Min Intro Sync CTA */}
                  <div className="pt-1">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/20 text-primary">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Live Discussion</p>
                          <p className="text-[11px] text-gray-400">15-min technical sync</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
                        Available <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </div>

            {/* Right Column: High-Signal Contact Console (Col 7) */}
            <div className="lg:col-span-7 animate-fade-in">
              <SpotlightCard className="p-6 md:p-8 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.09] shadow-2xl backdrop-blur-xl">
                <div className="space-y-6">
                  {/* Form Header */}
                  <div className="flex items-start gap-3.5 pb-4 border-b border-white/[0.08]">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent border border-primary/30 text-primary shadow-lg shadow-primary/20 flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                          Send a Message
                        </h3>
                        <span className="text-[11px] font-mono text-indigo-400 font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 hidden sm:inline-flex items-center gap-1">
                          <Sparkles size={11} className="text-indigo-400" />
                          <span>Instant Delivery</span>
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Fill out the technical brief below, and I will review your requirements
                        promptly.
                      </p>
                    </div>
                  </div>

                  {/* Quick Topic Chips */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-300">
                      Select Inquiry Focus:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {INQUIRY_TOPICS.map((topic) => {
                        const isSelected = selectedTopic === topic.value;
                        return (
                          <button
                            key={topic.value}
                            type="button"
                            onClick={() => handleSelectTopic(topic)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                              isSelected
                                ? "bg-primary text-white border-primary shadow-md shadow-primary/25 font-semibold"
                                : "bg-white/[0.03] text-gray-300 border-white/[0.08] hover:border-primary/40 hover:bg-white/[0.06]"
                            )}
                          >
                            {topic.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* React Hook Form */}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Name */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold text-gray-300">
                                Your Name <span className="text-primary">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Alex Morgan"
                                  className="rounded-xl bg-black/40 border-white/[0.1] text-white placeholder:text-gray-500 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 text-xs sm:text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        {/* Email */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold text-gray-300">
                                Email Address <span className="text-primary">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. alex@company.com"
                                  type="email"
                                  className="rounded-xl bg-black/40 border-white/[0.1] text-white placeholder:text-gray-500 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 text-xs sm:text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Subject */}
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-300">
                              Subject / Opportunity <span className="text-primary">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Senior Fullstack Role / Next.js AI Architecture"
                                className="rounded-xl bg-black/40 border-white/[0.1] text-white placeholder:text-gray-500 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 text-xs sm:text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Message */}
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-300">
                              Project Scope or Message <span className="text-primary">*</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your goals, team timeline, architecture requirements, or specific questions..."
                                rows={5}
                                className="rounded-xl bg-black/40 border-white/[0.1] text-white placeholder:text-gray-500 focus-visible:ring-primary/40 focus-visible:border-primary/50 resize-none text-xs sm:text-sm leading-relaxed"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Submit Button */}
                      <div className="pt-2">
                        <Button
                          type="submit"
                          size="lg"
                          data-umami-event="contact-form-submit-click"
                          className="w-full sm:w-auto px-8 h-12 rounded-full font-semibold text-xs sm:text-sm shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
                          disabled={mutation.isPending || isSubmitting}
                        >
                          {mutation.isPending || isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <Sparkles className="animate-spin h-4 w-4 text-white" />
                              <span>Sending Message...</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Sparkles size={15} className="animate-pulse" />
                              <span>Send Message with Instant Delivery</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </span>
                          )}
                        </Button>
                      </div>

                      <RecaptchaDisclaimer />
                    </form>
                  </Form>
                </div>
              </SpotlightCard>
            </div>
          </div>
        </div>
      </section>

      <SubmissionSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        type="contact"
        referenceId={submissionId || undefined}
        data={{
          name: submittedData?.name,
          email: submittedData?.email,
          subject: submittedData?.subject,
        }}
      />
    </div>
  );
};
