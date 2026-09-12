"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  Mail,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/umami";

import type { SiteSettings } from "@/services/site-settings/types";

interface CtaV2Props {
  settings?: SiteSettings;
}

export function CtaV2({ settings }: CtaV2Props) {
  const [copied, setCopied] = useState(false);
  const email = settings?.publicEmail || "wismannur@gmail.com";
  const locationText = settings?.location
    ? `${settings.location} • Global Remote Ready`
    : "Bandung, West Java, Indonesia (UTC+7) • Global Remote Ready";

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      trackEvent("cta-v2-copy-email", { email });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy email", err);
    }
  };

  return (
    <section className="relative pb-8 pt-4">
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 lg:p-12 border border-white/[0.1] bg-gradient-to-br from-[#090A0F] via-[#0E111D] to-[#12162B] backdrop-blur-2xl shadow-2xl">
          {/* Ambient glow backgrounds */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[110px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-[110px] pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headline & Action Buttons (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/25 shadow-sm">
                <Sparkles size={13} className="animate-pulse" />
                <span>Ready to Collaborate</span>
              </div>

              {/* Main Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.14]">
                Let’s Build Something <span className="text-primary">Exceptional</span> Together.
              </h2>

              {/* Narrative Body */}
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl">
                Whether you need a Senior Fullstack Architect to build a high-throughput platform,
                integrate autonomous AI agents, or level up your engineering team’s delivery speed —
                let’s start a conversation.
              </p>

              {/* Primary Actions */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
                >
                  <Link
                    href="/hire-me"
                    data-umami-event="home-v2-cta-start-project"
                    className="inline-flex items-center gap-2"
                  >
                    <Sparkles size={15} className="animate-pulse" />
                    <span>Start a Project</span>
                    <ChevronRight
                      size={15}
                      className="group-hover:translate-x-1 transition-transform duration-200"
                    />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold border-white/[0.15] bg-white/[0.04] backdrop-blur-md hover:bg-primary/10 hover:border-primary/40 hover:text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group text-gray-200"
                >
                  <Link
                    href="/contact"
                    data-umami-event="home-v2-cta-send-message"
                    className="inline-flex items-center gap-2"
                  >
                    <Mail size={15} />
                    <span>Send a Message</span>
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
                    />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Direct Connect & Fast-Track Card (Span 5) */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
                {/* Availability Pill */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold text-white">Direct Availability</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-medium">
                    Open for Roles
                  </span>
                </div>

                {/* Direct Details */}
                <div className="space-y-3 text-xs">
                  {/* Response Time */}
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                      <Zap size={13} />
                    </div>
                    <span>Fast Response: typically &lt; 2 hours</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <div className="p-1.5 rounded-lg bg-primary/15 text-primary flex-shrink-0">
                      <MapPin size={13} />
                    </div>
                    <span className="truncate">{locationText}</span>
                  </div>

                  {/* Direct Copy Email */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-gray-300">
                    <div className="flex items-center gap-2 font-mono text-[11px] truncate">
                      <Mail size={13} className="text-primary flex-shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      aria-label="Copy email"
                      className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-primary hover:text-primary-foreground hover:bg-primary px-2 py-1 rounded-md transition-all ml-2 flex-shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Book Discovery Call */}
                <div className="pt-2">
                  <Link
                    href="/contact"
                    data-umami-event="home-v2-cta-book-intro"
                    className="group flex items-center justify-between p-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-xs font-semibold text-primary hover:text-white transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Book a 15-Min Intro Call</span>
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
