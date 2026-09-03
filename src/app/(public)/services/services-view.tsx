"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

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
import { HighlightedText } from "@/components/ui/highlighted-text";
import { RecaptchaDisclaimer } from "@/components/common/recaptcha-disclaimer";
import { CtaV2 } from "@/components/home-v2/cta-v2";
import { getContentIcon } from "@/lib/icon-registry";
import { getReCaptchaToken } from "@/services/recaptcha";
import { serviceRequestService } from "@/services";
import type { Faq } from "@/services/faqs/types";
import type { ServicesCopy } from "@/services/page-copy/types";
import type { ProcessStep } from "@/services/process-steps/types";
import type { ServiceItem } from "@/services/service-catalog/types";
import type { SelectOption, SiteSettings } from "@/services/site-settings/types";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
  email: z.string().min(1, "Please enter your email").email("Please enter a valid email address"),
  company: z.string().optional(),
  serviceType: z.string().min(1, "Please select a service engagement"),
  budget: z.string().min(1, "Please select an estimated budget"),
  timeframe: z.string().min(1, "Please select an estimated timeline"),
  projectDetails: z.string().min(20, "Project details must be at least 20 characters"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms to submit",
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
  settings?: SiteSettings;
};

export function ServicesView({
  copy,
  services,
  faqs,
  processSteps,
  timeframes,
  budgetRanges,
  settings,
}: ServicesViewProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
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
    mutationFn: ({ formData, token }: { formData: ServiceFormValues; token: string }) => {
      return serviceRequestService.submit(
        {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          serviceType: formData.serviceType,
          budget: formData.budget,
          timeframe: formData.timeframe,
          projectDetails: formData.projectDetails,
        },
        token
      );
    },
    onSuccess: () => {
      toast({
        title: "Service request submitted!",
        description: "Thank you. I will review your project brief and reply within 24 hours.",
      });
      trackEvent("service-request-submit-success", { service: form.getValues().serviceType });
      form.reset();
      setSelectedService(null);
    },
    onError: () => {
      toast({
        title: "Submission failed",
        description: "Something went wrong. Please try again or reach out directly via email.",
        variant: "destructive",
      });
      trackEvent("service-request-submit-error");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
    retry: false,
  });

  const onSubmit = async (data: ServiceFormValues) => {
    setIsSubmitting(true);
    trackEvent("service-request-submit-attempt", { service: data.serviceType });
    const token = await getReCaptchaToken();
    mutation.mutate({ formData: data, token });
  };

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service.title);
    form.setValue("serviceType", service.title, { shouldValidate: true });
    trackEvent("service-card-select", { service: service.title });

    const formElement = document.getElementById("request-service-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
    trackEvent("services-faq-toggle", { faqId: id });
  };

  return (
    <div className="space-y-20 md:space-y-28 pb-12">
      {/* 1. Hero & Service Offerings Overview */}
      <section className="relative overflow-hidden pt-4 sm:pt-8 md:pt-12">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/15 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-1/4 w-[450px] h-[250px] bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="container px-4 max-w-6xl mx-auto relative">
          <SectionHeader
            subtitle={copy?.header.subtitle || "SOLUTIONS & ENGINEERING CAPABILITIES"}
            title={copy?.header.title || "End-to-End **Architecture**, Autonomous AI, & Advisory."}
            description={
              copy?.header.description ||
              "From zero-to-one product engineering to autonomous multi-agent workflows and performance audits — delivering production-grade systems engineered for scalability."
            }
            className="text-center mb-12 md:mb-16"
          />

          {/* 3 Core Solution Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((service) => {
              const Icon = getContentIcon(service.icon);
              const isSelected = selectedService === service.title;

              return (
                <SpotlightCard
                  key={service.id}
                  className={cn(
                    "p-7 sm:p-8 rounded-3xl bg-[#0C0E18]/85 border transition-all duration-300 flex flex-col justify-between h-full shadow-2xl backdrop-blur-xl group",
                    isSelected
                      ? "border-primary shadow-primary/20 ring-1 ring-primary/40"
                      : "border-white/[0.08] hover:border-primary/40"
                  )}
                >
                  <div className="space-y-6">
                    {/* Icon & Price Model Pill */}
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent border border-primary/30 rounded-2xl text-primary shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                        <Icon size={24} />
                      </div>
                      {service.priceLabel && (
                        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold">
                          {service.priceLabel}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-primary transition-colors tracking-tight">
                        {service.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* Features List */}
                    {service.features && service.features.length > 0 && (
                      <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Key Deliverables
                        </p>
                        <ul className="space-y-2">
                          {service.features.map((feature, fIndex) => (
                            <li
                              key={fIndex}
                              className="flex items-start gap-2.5 text-xs text-gray-300"
                            >
                              <CheckCircle2
                                size={14}
                                className="text-primary mt-0.5 flex-shrink-0"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="pt-6 mt-6 border-t border-white/[0.08]">
                    <Button
                      type="button"
                      onClick={() => handleSelectService(service)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "w-full rounded-full h-11 text-xs font-semibold transition-all duration-200 group/btn flex items-center justify-center gap-2",
                        isSelected
                          ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : "border-white/[0.12] bg-white/[0.04] text-white hover:bg-primary/10 hover:border-primary/40"
                      )}
                    >
                      <span>{isSelected ? "Selected for Inquiry" : "Request This Engagement"}</span>
                      <ArrowRight
                        size={14}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </Button>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Execution Framework / How We Collaborate */}
      {processSteps && processSteps.length > 0 && (
        <section className="relative overflow-hidden py-6">
          <div className="container px-4 max-w-6xl mx-auto">
            <SectionHeader
              subtitle={copy?.processSection?.subtitle || "EXECUTION FRAMEWORK"}
              title={copy?.processSection?.title || "How We **Collaborate** & Ship."}
              description={
                copy?.processSection?.description ||
                "A transparent, milestone-driven engineering lifecycle focused on rapid feedback loops, type-safety, and deterministic delivery."
              }
              className="text-center mb-12 md:mb-16"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((step, index) => (
                <SpotlightCard
                  key={step.id || index}
                  className="p-6 sm:p-7 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.08] hover:border-primary/40 transition-all duration-300 flex flex-col justify-between h-full shadow-xl backdrop-blur-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-mono text-primary/80">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight">{step.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Interactive Project Brief / Request Service Form */}
      <section id="request-service-form" className="relative overflow-hidden py-6 scroll-mt-24">
        <div className="container px-4 max-w-4xl mx-auto">
          <SpotlightCard className="p-6 sm:p-8 md:p-12 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.09] shadow-2xl backdrop-blur-xl">
            <div className="space-y-8">
              {/* Form Header */}
              <div className="text-center space-y-3 pb-6 border-b border-white/[0.08]">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/25 tracking-wide mx-auto">
                  <Sparkles size={13} className="animate-pulse" />
                  <span>{copy?.requestSection?.subtitle || "PROJECT BRIEF"}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight text-balance">
                  <HighlightedText
                    text={copy?.requestSection?.title || "Start a **Technical** Collaboration."}
                  />
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed text-balance">
                  {copy?.requestSection?.description ||
                    "Tell me about your system vision, timeline, and architectural requirements. I will review your project brief and respond with an actionable breakdown."}
                </p>
              </div>

              {/* Form Content */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                              placeholder="e.g. Sarah Jenkins"
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
                              placeholder="e.g. sarah@startup.com"
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Service Engagement */}
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-300">
                            Engagement Type <span className="text-primary">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl bg-black/40 border-white/[0.1] text-white focus:ring-primary/40 focus:border-primary/50 h-11 text-xs sm:text-sm">
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0C0E18] border border-white/[0.1] text-white">
                              {services.map((s) => (
                                <SelectItem
                                  key={s.id}
                                  value={s.title}
                                  className="text-xs focus:bg-primary/20 focus:text-white"
                                >
                                  {s.title}
                                </SelectItem>
                              ))}
                              <SelectItem
                                value="Custom Engagement"
                                className="text-xs focus:bg-primary/20 focus:text-white"
                              >
                                Custom Scope / Advisory
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Budget Range */}
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-300">
                            Estimated Budget <span className="text-primary">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl bg-black/40 border-white/[0.1] text-white focus:ring-primary/40 focus:border-primary/50 h-11 text-xs sm:text-sm">
                                <SelectValue placeholder="Select budget" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0C0E18] border border-white/[0.1] text-white">
                              {budgetRanges.map((b) => (
                                <SelectItem
                                  key={b.id}
                                  value={b.label}
                                  className="text-xs focus:bg-primary/20 focus:text-white"
                                >
                                  {b.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Timeframe */}
                    <FormField
                      control={form.control}
                      name="timeframe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-300">
                            Desired Timeline <span className="text-primary">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl bg-black/40 border-white/[0.1] text-white focus:ring-primary/40 focus:border-primary/50 h-11 text-xs sm:text-sm">
                                <SelectValue placeholder="Select timeline" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0C0E18] border border-white/[0.1] text-white">
                              {timeframes.map((t) => (
                                <SelectItem
                                  key={t.id}
                                  value={t.label}
                                  className="text-xs focus:bg-primary/20 focus:text-white"
                                >
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Project Details */}
                  <FormField
                    control={form.control}
                    name="projectDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-300">
                          Project Scope & Architecture Requirements{" "}
                          <span className="text-primary">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide details about your project: tech stack requirements, target release date, existing repository status, or specific architecture goals..."
                            rows={5}
                            className="rounded-xl bg-black/40 border-white/[0.1] text-white placeholder:text-gray-500 focus-visible:ring-primary/40 focus-visible:border-primary/50 resize-none text-xs sm:text-sm leading-relaxed"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Terms Checkbox */}
                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl p-3 bg-white/[0.02] border border-white/[0.06]">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-xs text-gray-300 font-normal">
                            I understand that project scopes are scheduled based on mutual timeline
                            availability and technical alignment.
                          </FormLabel>
                          <FormMessage className="text-xs" />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Submit Action */}
                  <div className="pt-2 text-center sm:text-left">
                    <Button
                      type="submit"
                      size="lg"
                      data-umami-event="service-form-submit-click"
                      className="w-full sm:w-auto px-10 h-12 rounded-full font-semibold text-xs sm:text-sm shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
                      disabled={mutation.isPending || isSubmitting}
                    >
                      {mutation.isPending || isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="animate-spin h-4 w-4 text-white" />
                          <span>Submitting Brief...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles size={15} className="animate-pulse" />
                          <span>Submit Technical Engagement Brief</span>
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
      </section>

      {/* 4. Frequently Asked Questions Accordion */}
      {faqs && faqs.length > 0 && (
        <section className="relative overflow-hidden py-6">
          <div className="container px-4 max-w-4xl mx-auto">
            <SectionHeader
              subtitle={copy?.faqSection?.subtitle || "CLEAR EXPECTATIONS"}
              title={copy?.faqSection?.title || "Frequently Asked **Questions**."}
              className="text-center mb-10 md:mb-12"
            />

            <div className="space-y-4">
              {faqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <SpotlightCard
                    key={faq.id}
                    className={cn(
                      "p-5 sm:p-6 rounded-2xl bg-[#0C0E18]/85 border transition-all duration-200 cursor-pointer shadow-md",
                      isOpen
                        ? "border-primary/40 bg-white/[0.04]"
                        : "border-white/[0.08] hover:border-primary/30"
                    )}
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2.5">
                        <HelpCircle size={16} className="text-primary flex-shrink-0" />
                        <span>{faq.question}</span>
                      </h4>
                      <div
                        className={cn(
                          "p-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-400 transition-transform duration-200 flex-shrink-0",
                          isOpen && "rotate-180 text-primary border-primary/30 bg-primary/10"
                        )}
                      >
                        <ChevronDown size={14} />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-white/[0.08] text-xs sm:text-sm text-gray-300 leading-relaxed animate-fade-in">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 5. Bottom Conversion CTA Card */}
      <CtaV2 settings={settings} />
    </div>
  );
}
