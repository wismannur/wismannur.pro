"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Cpu,
  Database,
  Globe,
  HelpCircle,
  Layers,
  MapPin,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
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
import { SubmissionSuccessModal } from "@/components/common/submission-success-modal";
import { getReCaptchaToken } from "@/services/recaptcha";
import { hireRequestService } from "@/services";
import type { AvailabilitySlot } from "@/services/availability/types";
import type { Faq } from "@/services/faqs/types";
import type { HireMeCopy } from "@/services/page-copy/types";
import type { SiteSettings } from "@/services/site-settings/types";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";

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

const TARGET_ROLES = [
  {
    title: "Senior / Staff Fullstack Engineer",
    tag: "Full-Time / Direct Hire",
    description:
      "Architecting end-to-end web applications and high-throughput SaaS platforms with Next.js 16, TypeScript, and serverless relational databases.",
    icon: Layers,
    skills: [
      "Next.js 16 App Router & React 19",
      "Strict TypeScript & Drizzle ORM",
      "Neon PostgreSQL & Scalable DBs",
      "REST & RPC Architecture",
    ],
  },
  {
    title: "Founding AI & Agentic Systems Engineer",
    tag: "Venture / Core Team",
    description:
      "Designing and implementing autonomous multi-agent loops, Model Context Protocol (MCP) servers, structured tool-calling, and reasoning workflows.",
    icon: Bot,
    skills: [
      "Gemini 3.8 & Claude Reasoning APIs",
      "Model Context Protocol (MCP) Tooling",
      "Multi-Agent Automation Loops",
      "Structured Outputs & Schemas",
    ],
  },
  {
    title: "Fractional Tech Lead & Architect",
    tag: "Advisory / Leadership",
    description:
      "Providing zero-to-one system blueprints, engineering best practices, RFC drafting, code review standards, and technical velocity steering.",
    icon: Cpu,
    skills: [
      "Zero-to-One Architecture Roadmaps",
      "Code Review & Quality Standards",
      "Team Velocity & Mentorship",
      "Sub-second CWV & Latency Audits",
    ],
  },
  {
    title: "High-Impact Sprint Retainer",
    tag: "Dedicated Monthly Retainer",
    description:
      "Dedicated monthly engineering bandwidth to accelerate critical product roadmap features, resolve technical debt, or ship MVPs.",
    icon: Zap,
    skills: [
      "Rapid MVP Delivery & Iteration",
      "Edge Caching & Performance Tuning",
      "Critical Bug Remediation",
      "Clean Modular Refactoring",
    ],
  },
];

const STACK_MATRIX = [
  {
    category: "Frontend Architecture",
    icon: Code2,
    description: "High-performance, type-safe, and responsive client-side interfaces.",
    tech: [
      "Next.js 16 App Router",
      "React 19 Server Components",
      "Tailwind CSS & Radix UI",
      "TanStack Query",
      "Framer Motion",
    ],
  },
  {
    category: "Backend & Data Tier",
    icon: Database,
    description: "Scalable serverless databases, ORMs, and secure data access layers.",
    tech: [
      "Node.js & Strict TypeScript",
      "Neon Serverless PostgreSQL",
      "Drizzle ORM & Migrations",
      "REST & RPC API Design",
      "Redis Caching",
    ],
  },
  {
    category: "Autonomous AI & Tooling",
    icon: Bot,
    description: "Agentic tool calling, MCP servers, and LLM automation pipelines.",
    tech: [
      "Model Context Protocol (MCP)",
      "Gemini 3.8 & Claude APIs",
      "Structured Reasoning Loops",
      "Vector Embeddings & RAG",
      "Custom AI Sidecars",
    ],
  },
  {
    category: "DevOps & Reliability",
    icon: ServerCog,
    description: "Deterministic deployments, edge distribution, and performance rigor.",
    tech: [
      "Docker & Containerization",
      "Vercel & Edge Runtime",
      "Core Web Vitals Tuning",
      "CI/CD & GitHub Actions",
      "GitOps & Zero-Downtime",
    ],
  },
];

const hireFormSchema = z.object({
  name: z.string().min(1, { message: "Your name is required" }),
  email: z
    .string()
    .min(1, { message: "Work email is required" })
    .email("Please enter a valid email address"),
  company: z.string().min(1, { message: "Company / Organization name is required" }),
  roleTitle: z.string().min(1, { message: "Position or role title is required" }),
  employmentType: z.string().min(1, { message: "Please select employment type" }),
  workplaceType: z.string().min(1, { message: "Please select workplace policy" }),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  message: z.string().min(10, { message: "Please provide at least 10 characters about the role" }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type HireFormValues = z.infer<typeof hireFormSchema>;

type HireMeViewProps = {
  copy: HireMeCopy | null;
  faqs: Faq[];
  availabilitySlots: AvailabilitySlot[];
  settings?: SiteSettings;
};

export function HireMeView({ copy, faqs, availabilitySlots, settings }: HireMeViewProps) {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<HireFormValues | null>(null);

  const hero = copy?.hero;
  const availabilityCopy = copy?.availabilitySection;

  const form = useForm<HireFormValues>({
    resolver: zodResolver(hireFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      roleTitle: "",
      employmentType: "full_time",
      workplaceType: "remote",
      location: "",
      salaryRange: "",
      message: "",
      termsAccepted: false,
    },
  });

  const mutation = useMutation({
    mutationFn: ({ formData, token }: { formData: HireFormValues; token: string }) => {
      return hireRequestService.submit(
        {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          roleTitle: formData.roleTitle,
          employmentType: formData.employmentType,
          workplaceType: formData.workplaceType,
          location: formData.location || "",
          salaryRange: formData.salaryRange || "",
          message: formData.message,
        },
        token
      );
    },
    onSuccess: (id: string) => {
      setSubmissionId(id);
      setSuccessModalOpen(true);
      trackEvent("hire-form-submit-success", { role: form.getValues().roleTitle });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Submission failed",
        description: "Something went wrong. Please try again or reach out directly via email.",
        variant: "destructive",
      });
      trackEvent("hire-form-submit-error");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
    retry: false,
  });

  const onSubmit = async (data: HireFormValues) => {
    setIsSubmitting(true);
    trackEvent("hire-form-submit-attempt", { role: data.roleTitle });
    setSubmittedData(data);
    const token = await getReCaptchaToken();
    mutation.mutate({ formData: data, token });
  };

  const handleSelectRole = (roleTitle: string) => {
    form.setValue("roleTitle", roleTitle, { shouldValidate: true });
    trackEvent("hire-role-card-select", { role: roleTitle });

    const formElement = document.getElementById("hire-me-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
    trackEvent("hire-faq-toggle", { faqId: id });
  };

  return (
    <div className="space-y-20 md:space-y-28 pb-12">
      {/* 1. Hero / Recruitment Value Proposition */}
      <section className="relative overflow-hidden pt-4 sm:pt-8 md:pt-12">
        {/* Ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/15 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-1/4 w-[450px] h-[250px] bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="container px-4 max-w-6xl mx-auto relative">
          <SectionHeader
            subtitle={hero?.eyebrow || "SENIOR FULLSTACK • AGENTIC AI ARCHITECT"}
            title={hero?.title || "Let's Engineer Your Next **High-Performance** Platform."}
            description={
              hero?.description ||
              "Senior Fullstack & AI Systems Engineer available for full-time technical roles, high-impact contract engineering, and dedicated retainers. Global remote ready from Bandung, Indonesia (UTC+7)."
            }
            className="text-center mb-10 md:mb-14"
          />

          {/* Direct Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Button
              size="lg"
              onClick={() => {
                document.getElementById("hire-me-form")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
            >
              <Sparkles size={15} className="animate-pulse mr-2 text-white" />
              <span>Submit Opportunity Brief</span>
              <ArrowRight
                size={14}
                className="ml-1.5 group-hover:translate-x-1 transition-transform"
              />
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold border-white/[0.12] bg-white/[0.04] backdrop-blur-md hover:bg-primary/10 hover:border-primary/40 hover:text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group text-gray-200"
            >
              <Link
                href="/services"
                data-umami-event="hire-view-services-click"
                className="inline-flex items-center gap-2"
              >
                <span>Explore Solutions & Services</span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform text-primary"
                />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Live Calendar & Availability Hub */}
      {availabilitySlots && availabilitySlots.length > 0 && (
        <section className="relative overflow-hidden py-4">
          <div className="container px-4 max-w-5xl mx-auto">
            <SpotlightCard className="p-6 sm:p-8 md:p-10 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.09] shadow-2xl backdrop-blur-xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      <HighlightedText
                        text={availabilityCopy?.title || "Current Engagement **Availability**."}
                      />
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
                    {availabilityCopy?.description ||
                      "Real-time schedule for upcoming quarters. Reserve dedicated engineering bandwidth for your upcoming launches."}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full font-semibold flex-shrink-0 w-fit">
                  <Clock size={13} />
                  <span>Open for Q3/Q4</span>
                </div>
              </div>

              {/* Months Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {availabilitySlots.slice(0, 4).map((slot) => {
                  const isAvailable = slot.status === "available";
                  const monthName = MONTH_LABELS[slot.month - 1] || `M${slot.month}`;

                  return (
                    <div
                      key={slot.id}
                      className={cn(
                        "p-5 rounded-2xl border text-center transition-all duration-200",
                        isAvailable
                          ? "bg-emerald-500/[0.06] border-emerald-500/25 text-emerald-400"
                          : "bg-white/[0.02] border-white/[0.06] text-gray-400"
                      )}
                    >
                      <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                        {monthName} {slot.year}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-white mt-1.5">
                        {slot.label || (isAvailable ? "Available" : "Booked")}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-2.5">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            isAvailable ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                          )}
                        />
                        <span className="text-[11px] font-medium text-gray-300">
                          {isAvailable ? "Open for Sprints" : "Reserved"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer notes with generous padding and clear separation */}
              <div className="pt-6 mt-2 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <MapPin size={14} />
                  </div>
                  <span className="text-gray-300">
                    {availabilityCopy?.timezoneNote ||
                      "Bandung, West Java (UTC+7) • Global Remote Ready"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Zap size={14} />
                  </div>
                  <span className="text-gray-300">
                    {availabilityCopy?.contactNote ||
                      "Fast response guarantee: replies typically within 2-4 hours"}
                  </span>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </section>
      )}

      {/* 3. Target Positions & Mutual Fit Bento */}
      <section className="relative overflow-hidden py-4">
        <div className="container px-4 max-w-6xl mx-auto">
          <SectionHeader
            subtitle="TARGET POSITIONS"
            title="Target Roles & **Mutual Fit**."
            description="I partner with fast-moving teams that value clean system architecture, extreme ownership, and autonomous execution."
            className="text-center mb-12 md:mb-16"
          />

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {TARGET_ROLES.map((role, rIndex) => {
              const Icon = role.icon;
              return (
                <SpotlightCard
                  key={rIndex}
                  className="p-7 sm:p-8 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.08] hover:border-primary/40 transition-all duration-300 flex flex-col justify-between h-full shadow-2xl backdrop-blur-xl group"
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent border border-primary/30 rounded-2xl text-primary shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                        <Icon size={24} />
                      </div>
                      <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold">
                        {role.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-primary transition-colors">
                        {role.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Core Focus & Stack
                      </p>
                      <ul className="space-y-2">
                        {role.skills.map((skill, sIndex) => (
                          <li
                            key={sIndex}
                            className="flex items-start gap-2.5 text-xs text-gray-300"
                          >
                            <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/[0.08]">
                    <Button
                      type="button"
                      onClick={() => handleSelectRole(role.title)}
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full h-11 text-xs font-semibold border-white/[0.12] bg-white/[0.04] text-white hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 group/btn flex items-center justify-center gap-2"
                    >
                      <span>Select This Role for Inquiry</span>
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

          {/* Collaboration Principles / Mutual Fit */}
          <div className="mt-8">
            <SpotlightCard className="p-6 sm:p-8 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.08] shadow-xl backdrop-blur-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Zap size={16} />
                    <span>Async-First & High Ownership</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Proactive written documentation, clear RFCs, and self-directed execution with
                    minimal meeting overhead.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <ShieldCheck size={16} />
                    <span>Deterministic Quality</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Strict end-to-end type safety, automated test coverage, and clean modular
                    codebases built to scale.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Globe size={16} />
                    <span>Global Remote Alignment</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Bandung (UTC+7) location providing 3–5 hours of live overlap with US, European,
                    and APAC teams.
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* 4. Production Stack & Architectural Matrix */}
      <section className="relative overflow-hidden py-4">
        <div className="container px-4 max-w-6xl mx-auto">
          <SectionHeader
            subtitle="TECHNICAL COMPETENCIES"
            title="Production Stack & **Architectural Matrix**."
            description="Battle-tested technologies and design patterns I use to deliver sub-second, highly maintainable digital platforms."
            className="text-center mb-12 md:mb-16"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STACK_MATRIX.map((stack, index) => {
              const Icon = stack.icon;
              return (
                <SpotlightCard
                  key={index}
                  className="p-6 sm:p-7 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.08] hover:border-primary/40 transition-all duration-300 flex flex-col justify-between h-full shadow-xl backdrop-blur-xl"
                >
                  <div className="space-y-4">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 rounded-2xl text-primary w-fit shadow-md">
                      <Icon size={22} />
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight">
                      {stack.category}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{stack.description}</p>
                    <div className="pt-3 border-t border-white/[0.08] space-y-1.5">
                      {stack.tech.map((item, tIndex) => (
                        <div key={tIndex} className="flex items-center gap-2 text-xs text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Direct Opportunity Intake Form */}
      <section id="hire-me-form" className="relative overflow-hidden py-4 scroll-mt-24">
        <div className="container px-4 max-w-4xl mx-auto">
          <SpotlightCard className="p-6 sm:p-8 md:p-12 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.09] shadow-2xl backdrop-blur-xl">
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-3 pb-6 border-b border-white/[0.08]">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/25 tracking-wide mx-auto">
                  <Briefcase size={13} className="text-primary" />
                  <span>{copy?.contactSection?.subtitle || "DIRECT INTAKE"}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight text-balance">
                  <HighlightedText
                    text={copy?.contactSection?.title || "Submit an **Opportunity** Brief."}
                  />
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed text-balance">
                  {copy?.contactSection?.description ||
                    "Share details about your position, squad mission, tech stack, and timeline. I will review and respond within 24 hours."}
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
                              placeholder="e.g. David Sterling"
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
                            Work Email <span className="text-primary">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. david@techcorp.com"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Company */}
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-300">
                            Company / Organization <span className="text-primary">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Acme Cloud Inc."
                              className="rounded-xl bg-black/40 border-white/[0.1] text-white placeholder:text-gray-500 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 text-xs sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Position Title */}
                    <FormField
                      control={form.control}
                      name="roleTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-300">
                            Role Title or Engagement <span className="text-primary">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Senior Fullstack Engineer / AI Architect"
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
                    {/* Employment Type */}
                    <FormField
                      control={form.control}
                      name="employmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-300">
                            Employment Type <span className="text-primary">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl bg-black/40 border-white/[0.1] text-white focus:ring-primary/40 focus:border-primary/50 h-11 text-xs sm:text-sm">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0C0E18] border border-white/[0.1] text-white">
                              <SelectItem
                                value="full_time"
                                className="text-xs focus:bg-primary/20 focus:text-white"
                              >
                                Full-Time (Direct Hire)
                              </SelectItem>
                              <SelectItem
                                value="contract"
                                className="text-xs focus:bg-primary/20 focus:text-white"
                              >
                                Contract / Project Sprint
                              </SelectItem>
                              <SelectItem
                                value="part_time"
                                className="text-xs focus:bg-primary/20 focus:text-white"
                              >
                                Part-Time / Advisory
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Workplace Policy */}
                    <FormField
                      control={form.control}
                      name="workplaceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-300">
                            Workplace Policy <span className="text-primary">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl bg-black/40 border-white/[0.1] text-white focus:ring-primary/40 focus:border-primary/50 h-11 text-xs sm:text-sm">
                                <SelectValue placeholder="Select policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0C0E18] border border-white/[0.1] text-white">
                              <SelectItem
                                value="remote"
                                className="text-xs focus:bg-primary/20 focus:text-white"
                              >
                                100% Global Remote
                              </SelectItem>
                              <SelectItem
                                value="hybrid"
                                className="text-xs focus:bg-primary/20 focus:text-white"
                              >
                                Hybrid / Periodic Sync
                              </SelectItem>
                              <SelectItem
                                value="on_site"
                                className="text-xs focus:bg-primary/20 focus:text-white"
                              >
                                On-Site
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Compensation Range */}
                    <FormField
                      control={form.control}
                      name="salaryRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-300">
                            Comp / Budget Range
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. $100k-$140k / $60-$90/hr"
                              className="rounded-xl bg-black/40 border-white/[0.1] text-white placeholder:text-gray-500 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 text-xs sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Message */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-300">
                          Opportunity Brief & Technical Scope{" "}
                          <span className="text-primary">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the role requirements, team composition, mission, and why you think this is a great mutual fit..."
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
                            I confirm that this is a genuine career or contract opportunity inquiry.
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
                      data-umami-event="hire-form-submit-click"
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
                          <span>Submit Opportunity Brief</span>
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

      {/* 6. Frequently Asked Questions Accordion */}
      {faqs && faqs.length > 0 && (
        <section className="relative overflow-hidden py-4">
          <div className="container px-4 max-w-4xl mx-auto">
            <SectionHeader
              subtitle={copy?.faqSection?.subtitle || "CLEAR EXPECTATIONS"}
              title={copy?.faqSection?.title || "Frequently Asked **Questions**."}
              description={
                copy?.faqSection?.description ||
                "Find clear answers regarding contract terms, working hours, code ownership, and collaboration styles."
              }
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

      {/* 7. Bottom Conversion CTA Card */}
      <CtaV2 settings={settings} />

      <SubmissionSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        type="hire"
        referenceId={submissionId || undefined}
        data={{
          name: submittedData?.name,
          email: submittedData?.email,
          company: submittedData?.company,
          targetRole: submittedData?.roleTitle,
          budget: submittedData?.salaryRange,
        }}
      />
    </div>
  );
}
