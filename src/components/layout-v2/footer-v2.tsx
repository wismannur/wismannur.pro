"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Search,
  Twitter,
  Zap,
} from "lucide-react";
import { openCommandPalette } from "@/components/common/command-palette";
import { trackEvent } from "@/lib/umami";
import type { SiteSettings } from "@/services/site-settings/types";

export function FooterV2({ settings }: { settings: SiteSettings }) {
  const currentYear = new Date().getFullYear();
  const [copied, setCopied] = useState(false);

  const exploreLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About & Resume" },
    { to: "/services", label: "Solutions & Retainers" },
    ...(settings.enableBlog ? [{ to: "/blog", label: "Technical Notes" }] : []),
    { to: "/contact", label: "Direct Contact" },
  ];

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(settings.publicEmail);
      setCopied(true);
      trackEvent("footer-v2-copy-email", { email: settings.publicEmail });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy email", err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackEvent("footer-v2-back-to-top");
  };

  return (
    <footer className="relative border-t border-white/[0.08] bg-[#07080D] text-gray-300 overflow-hidden font-sans">
      {/* Top accent glowing line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none" />

      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[150px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="container px-4 max-w-6xl mx-auto pt-10 pb-8">
        {/* Top Bar: Brand, Status, and Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-white/[0.07]">
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/"
              className="text-lg sm:text-xl font-black tracking-tight inline-flex items-center gap-2.5 group"
              data-umami-event="footer-v2-logo-click"
            >
              <div className="relative w-9 h-8 rounded-lg overflow-hidden border border-white/[0.12] bg-[#121524] shadow-sm group-hover:border-primary/50 transition-all flex-shrink-0">
                <Image
                  src="/logo.webp"
                  alt="wismannur logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-white group-hover:text-primary transition-colors">
                wismannur<span className="text-primary font-black">.pro</span>
              </span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Open for Roles & Available for Projects</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={openCommandPalette}
              data-umami-event="footer-v2-quick-search-click"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-primary/40 text-xs font-medium text-gray-300 hover:text-white transition-all shadow-sm"
            >
              <Search size={13} className="text-primary" />
              <span>Quick Search</span>
              <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-white/[0.1] bg-black/40 px-1 font-mono text-[9px] text-gray-400">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="inline-flex items-center justify-center p-2 rounded-full bg-white/[0.04] hover:bg-primary/20 border border-white/[0.08] hover:border-primary/40 text-gray-300 hover:text-primary transition-all shadow-sm group"
            >
              <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 py-8">
          {/* Brand & Narrative */}
          <div className="md:col-span-6 space-y-4">
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed max-w-md">
              Senior Fullstack & AI Systems Engineer architecting high-performance web applications,
              sub-second edge runtimes, and autonomous agent workflows.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Location */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-gray-300">
                <MapPin size={12} className="text-primary" />
                <span>{settings.location || "Jakarta, ID"}</span>
                <span className="text-gray-600">•</span>
                <Clock size={12} className="text-primary/80" />
                <span>{settings.timezoneLabel || "WIB (UTC+7)"}</span>
              </div>

              {/* Email Copy */}
              {settings.publicEmail && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 text-xs text-gray-300 transition-all">
                  <Mail size={12} className="text-primary" />
                  <a
                    href={`mailto:${settings.publicEmail}`}
                    className="font-mono text-gray-400 hover:text-white transition-colors"
                  >
                    {settings.publicEmail}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    aria-label="Copy email"
                    className="p-0.5 text-gray-400 hover:text-primary transition-colors"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-1">
              {settings.social.github && (
                <a
                  href={settings.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/[0.03] border border-white/[0.07] rounded-xl text-gray-400 hover:text-white hover:border-primary/40 transition-all"
                  aria-label="GitHub"
                >
                  <Github size={15} />
                </a>
              )}
              {settings.social.linkedin && (
                <a
                  href={settings.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/[0.03] border border-white/[0.07] rounded-xl text-gray-400 hover:text-white hover:border-primary/40 transition-all"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={15} />
                </a>
              )}
              {settings.social.twitter && (
                <a
                  href={settings.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/[0.03] border border-white/[0.07] rounded-xl text-gray-400 hover:text-white hover:border-primary/40 transition-all"
                  aria-label="Twitter"
                >
                  <Twitter size={15} />
                </a>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-6 grid grid-cols-2 gap-8 md:pl-8">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
                <Globe size={13} className="text-primary" />
                <span>Navigation</span>
              </h3>
              <ul className="space-y-2">
                {exploreLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      href={to}
                      className="group inline-flex items-center text-xs md:text-sm text-gray-400 hover:text-primary transition-colors py-0.5"
                    >
                      <span>{label}</span>
                      <ArrowUpRight
                        size={12}
                        className="ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
                <Zap size={13} className="text-primary" />
                <span>Stack & Specs</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li>Next.js 16 (App Router)</li>
                <li>React 19 Server Components</li>
                <li>TypeScript Strict Typings</li>
                <li>Gemini 3.8 Flash & MCP</li>
                <li>Neon Serverless PostgreSQL</li>
                <li>Tailwind CSS & Motion</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Footer */}
        <div className="border-t border-white/[0.07] pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-3">
          <p>
            &copy; {currentYear}{" "}
            <span className="font-semibold text-gray-300">
              {settings.copyrightName || "Wisman Nur"}
            </span>
            . All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <Link href="/privacy-policy" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms-of-service" className="hover:text-gray-300 transition-colors">
              Terms of Service
            </Link>
            {settings.repoUrl && (
              <>
                <span>•</span>
                <a
                  href={settings.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors inline-flex items-center gap-1"
                >
                  <Github size={12} />
                  <span>Source</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
