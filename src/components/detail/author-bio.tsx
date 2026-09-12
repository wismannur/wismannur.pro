"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Github,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
  Twitter,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { siteSettingsService, userService, type UserProfile, type SiteSettings } from "@/services";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { trackEvent } from "@/lib/umami";

const CORE_STACK = [
  "Next.js 16 & React 19",
  "TypeScript Strict",
  "Neon PostgreSQL & Drizzle",
  "Autonomous AI & MCP",
  "Sub-second CWV",
];

interface AuthorBioProps {
  settings?: SiteSettings;
}

const AuthorBio = ({ settings: initialSettings }: AuthorBioProps) => {
  const [authorData, setAuthorData] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(initialSettings || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch author profile and site settings from database
    userService
      .getAuthorProfile()
      .then(setAuthorData)
      .catch((error) => console.error("Error fetching author data:", error));

    if (!initialSettings) {
      siteSettingsService
        .get()
        .then(setSettings)
        .catch((error) => console.error("Error fetching site settings:", error));
    }
  }, [initialSettings]);

  // Email directly sourced from database (site_settings or author profile)
  const publicEmail = settings?.publicEmail || authorData?.email || PUBLIC_SUPPORT_EMAIL;
  const githubUrl =
    settings?.social?.github || authorData?.social?.github || "https://github.com/wismannur";
  const linkedinUrl =
    settings?.social?.linkedin ||
    authorData?.social?.linkedin ||
    "https://linkedin.com/in/wismannur";
  const twitterUrl =
    settings?.social?.twitter || authorData?.social?.twitter || "https://x.com/wismannur";
  const locationText = settings?.location || authorData?.location || "Bandung, ID";
  const timezoneText = settings?.timezoneLabel || "WIB (UTC+7)";

  const socialLinks = [
    {
      name: "LinkedIn",
      url: linkedinUrl,
      icon: <Linkedin size={15} />,
    },
    {
      name: "GitHub",
      url: githubUrl,
      icon: <Github size={15} />,
    },
    {
      name: "Twitter",
      url: twitterUrl,
      icon: <Twitter size={15} />,
    },
  ];

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(publicEmail);
      setCopied(true);
      trackEvent("author-bio-copy-email", { email: publicEmail });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy email", err);
    }
  };

  return (
    <SpotlightCard className="mt-14 p-6 sm:p-8 rounded-3xl bg-[#0C0E18]/90 border border-white/[0.09] shadow-2xl backdrop-blur-2xl animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center lg:items-start">
        {/* Avatar Column with Live Beacon, Location, Copy Email & Socials (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center lg:border-r lg:border-white/[0.08] lg:pr-8 w-full space-y-3.5">
          {/* Avatar */}
          <div className="relative group mx-auto">
            <div className="absolute -inset-2 bg-gradient-to-tr from-primary/60 via-indigo-500/30 to-purple-600/40 rounded-full opacity-80 blur-md group-hover:opacity-100 transition duration-500" />
            <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-[#0C0E18] relative shadow-2xl mx-auto">
              <AvatarImage
                src={authorData?.photoURL || "https://github.com/shadcn.png"}
                alt={authorData?.displayName || "Wisman Nur"}
              />
              <AvatarFallback className="bg-primary/20 text-white text-xl font-bold">
                {authorData?.displayName?.[0] || "W"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Live Availability Beacon */}
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold whitespace-nowrap mx-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Available for Roles & Projects</span>
          </div>

          {/* Location & Global Remote Ready (Clean Two-Line Stack to prevent overlap) */}
          <div className="flex flex-col items-center text-xs text-gray-400 space-y-1 mx-auto">
            <div className="inline-flex items-center justify-center gap-1.5 font-medium flex-wrap">
              <MapPin size={12} className="text-primary flex-shrink-0" />
              <span>{locationText}</span>
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 font-medium flex-wrap">
              <Clock size={12} className="text-primary/80 flex-shrink-0" />
              <span>{timezoneText}</span>
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 text-gray-400 whitespace-nowrap">
              <Globe size={11} className="text-emerald-400 flex-shrink-0" />
              <span>Global Remote Ready</span>
            </div>
          </div>

          {/* 1-Click Copy Email Badge (Database-driven) */}
          {publicEmail && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/40 text-xs text-gray-300 transition-all max-w-full mx-auto">
              <Mail size={12} className="text-primary flex-shrink-0" />
              <a
                href={`mailto:${publicEmail}`}
                className="font-mono text-gray-300 hover:text-white transition-colors truncate max-w-[170px] sm:max-w-none"
              >
                {publicEmail}
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label="Copy email address"
                className="p-0.5 text-gray-400 hover:text-primary transition-colors focus:outline-none flex-shrink-0"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
          )}

          {/* Social Channels (LinkedIn, GitHub, Twitter) */}
          <div className="flex gap-2 justify-center items-center pt-1 mx-auto">
            <TooltipProvider>
              {socialLinks.map((link, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-primary/20 hover:text-white hover:border-primary/40 text-gray-400 transition-all"
                      asChild
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-umami-event="author-social-click"
                        data-umami-event-platform={link.name}
                      >
                        {link.icon}
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#0C0E18] border border-white/[0.1] text-white text-xs">
                    <p>{link.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>

        {/* Bio & Professional Narrative Column (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/25 tracking-wide">
              <Sparkles size={11} className="animate-pulse" />
              <span>AUTHOR & ARCHITECT</span>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {authorData?.displayName || "Wisman Nur"}
            </h3>
            <p className="text-xs font-mono text-primary font-semibold mt-0.5">
              Senior Fullstack & Autonomous AI Systems Engineer
            </p>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            {authorData?.bio ||
              "7+ years architecting scalable fullstack web applications, autonomous AI agent pipelines with Gemini 3.8 & Model Context Protocol (MCP), and production database systems with sub-second performance rigor."}
          </p>

          {/* Core Stack Pills */}
          <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-1.5">
            {CORE_STACK.map((tech, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] text-gray-300 border border-white/[0.08] inline-flex items-center gap-1.5 font-mono"
              >
                <CheckCircle2 size={11} className="text-primary flex-shrink-0" />
                <span>{tech}</span>
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-nowrap justify-center lg:justify-start gap-3">
            <Button
              size="sm"
              className="rounded-full text-xs font-semibold px-5 h-10 shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              asChild
            >
              <Link
                href="/about"
                data-umami-event="author-about-click"
                className="inline-flex items-center gap-1.5"
              >
                <BookOpen size={13} className="text-white" />
                <span>Full Engineering Bio</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-semibold px-5 h-10 border-white/[0.12] bg-white/[0.04] text-white hover:bg-primary/10 hover:border-primary/40 transition-all group"
              asChild
            >
              <Link
                href="/contact"
                data-umami-event="author-contact-click"
                className="inline-flex items-center gap-1.5"
              >
                <MessageCircle size={13} className="text-primary" />
                <span>Discuss Opportunity</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
};

export default AuthorBio;
