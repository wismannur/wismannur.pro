"use client";

import { openCommandPalette } from "@/components/common/command-palette";
import { trackEvent } from "@/lib/umami";
import type { SiteSettings } from "@/services/site-settings/types";
import {
	ArrowUp,
	ArrowUpRight,
	Briefcase,
	Check,
	Clock,
	Compass,
	Copy,
	Github,
	Linkedin,
	Mail,
	MapPin,
	Search,
	Twitter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export const Footer = ({ settings }: { settings: SiteSettings }) => {
	const currentYear = new Date().getFullYear();
	const [copied, setCopied] = useState(false);

	const exploreLinks = [
		{ to: "/", label: "Home" },
		{ to: "/about", label: "About Me" },
		...(settings.enableBlog ? [{ to: "/blog", label: "Blog & Articles" }] : []),
		{ to: "/contact", label: "Get in Touch" },
	];

	const workLinks = [
		{ to: "/projects", label: "Projects & Work" },
		{ to: "/services", label: "Client Solutions" },
		{ to: "/hire-me", label: "Hire Me" },
		{ to: "/offers", label: "Special Offers" },
	];

	const socialLinks = [
		{ href: settings.social.github, icon: Github, label: "GitHub" },
		{ href: settings.social.twitter, icon: Twitter, label: "Twitter" },
		{ href: settings.social.linkedin, icon: Linkedin, label: "LinkedIn" },
	].filter(({ href }) => href);

	const handleCopyEmail = async () => {
		try {
			await navigator.clipboard.writeText(settings.publicEmail);
			setCopied(true);
			trackEvent("footer-copy-email", { email: settings.publicEmail });
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy email", err);
		}
	};

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
		trackEvent("footer-back-to-top-click");
	};

	return (
		<footer className="relative border-t border-border/50 bg-gradient-to-b from-background via-background/95 to-muted/20 overflow-hidden">
			{/* Top accent glowing gradient line */}
			<div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />

			{/* Subtle ambient light */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[180px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

			<div className="container px-4 max-w-6xl mx-auto pt-8 md:pt-10 pb-8">
				{/* Top Bar: Brand, Live Availability, and Command Bar Trigger */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
					<div className="flex flex-wrap items-center gap-3.5">
						<Link
							href="/"
							className="text-xl md:text-2xl font-black tracking-tight inline-flex items-center gap-3 group"
							data-umami-event="footer-logo-click"
						>
							<div className="relative w-10 h-8 md:w-11 md:h-9 rounded overflow-hidden border border-border/60 bg-card shadow-sm group-hover:border-primary/50 group-hover:shadow-md transition-all duration-300 flex-shrink-0">
								<Image
									src="/logo.webp"
									alt="wismannur.pro logo"
									width={36}
									height={36}
									className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-300"
								/>
							</div>
							<span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent group-hover:text-primary transition-colors">
								wismannur<span className="text-primary">.pro</span>
							</span>
						</Link>

						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
							</span>
							<span>Available for Projects</span>
						</div>
					</div>

					{/* Quick Action Shortcuts */}
					<div className="flex items-center gap-2.5 w-full sm:w-auto">
						<button
							type="button"
							onClick={openCommandPalette}
							data-umami-event="footer-quick-search-click"
							className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-card/70 hover:bg-muted/80 backdrop-blur-sm border border-border/60 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm"
						>
							<Search size={13} className="text-primary" />
							<span>Quick Actions</span>
							<kbd className="inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/70 bg-background/90 px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
								<span>⌘</span>K
							</kbd>
						</button>

						<button
							type="button"
							onClick={scrollToTop}
							aria-label="Back to top"
							className="inline-flex items-center justify-center p-2 rounded-full bg-card/70 hover:bg-primary/10 border border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary transition-all duration-200 shadow-sm group"
						>
							<ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
						</button>
					</div>
				</div>

				{/* Main Footer Content */}
				<div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 py-8">
					{/* Brand Bio, Location, Email Chip & Socials (Span 5) */}
					<div className="md:col-span-6 space-y-4">
						<p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
							{settings.footerBio ||
								"Software Engineer & Autonomous AI Agent Architect specializing in high-performance web applications and delightful digital experiences."}
						</p>

						<div className="flex flex-wrap items-center gap-2.5 pt-1">
							{/* Location & Timezone Pill */}
							<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/60 border border-border/50 text-[11px] md:text-xs text-muted-foreground backdrop-blur-sm shadow-sm">
								<div className="flex items-center gap-1.5 font-medium text-foreground">
									<MapPin size={12} className="text-primary" />
									<span>{settings.location || "Jakarta, ID"}</span>
								</div>
								<span className="text-border">•</span>
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<Clock size={12} className="text-primary/80" />
									<span>{settings.timezoneLabel || "WIB (UTC+7)"}</span>
								</div>
							</div>

							{/* Minimalist Email Copy Chip */}
							{settings.publicEmail && (
								<div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/60 hover:bg-card/90 border border-border/50 hover:border-primary/40 text-[11px] md:text-xs backdrop-blur-sm shadow-sm transition-all">
									<Mail size={12} className="text-primary flex-shrink-0" />
									<a
										href={`mailto:${settings.publicEmail}`}
										data-umami-event="footer-email-click"
										className="font-mono text-muted-foreground hover:text-foreground transition-colors truncate"
									>
										{settings.publicEmail}
									</a>
									<button
										type="button"
										onClick={handleCopyEmail}
										aria-label="Copy email address"
										title="Copy email"
										className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors ml-0.5"
									>
										{copied ? (
											<Check size={12} className="text-emerald-400" />
										) : (
											<Copy size={12} />
										)}
									</button>
								</div>
							)}
						</div>

						{/* Social Media Icons */}
						<div className="flex items-center gap-2 pt-1">
							{socialLinks.map(({ href, icon: Icon, label }) => (
								<a
									key={label}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									data-umami-event="footer-social-click"
									data-umami-event-platform={label}
									className="p-2 bg-card/70 border border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-md transition-all duration-200"
									aria-label={label}
								>
									<Icon size={15} />
								</a>
							))}
						</div>
					</div>

					{/* Navigation Columns (Span 7) */}
					<div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-2 gap-8 sm:gap-12 md:pl-4 lg:pl-12">
						{/* Explore / Pages */}
						<div>
							<h3 className="font-bold text-xs uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
								<Compass size={13} className="text-primary" />
								<span>Explore</span>
							</h3>
							<ul className="space-y-2">
								{exploreLinks.map(({ to, label }) => (
									<li key={to}>
										<Link
											href={to}
											data-umami-event="footer-nav-click"
											data-umami-event-label={label}
											className="group inline-flex items-center text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors py-0.5"
										>
											<span className="group-hover:translate-x-1 transition-transform duration-200">
												{label}
											</span>
											<ArrowUpRight
												size={13}
												className="ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary"
											/>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Work & Solutions */}
						<div>
							<h3 className="font-bold text-xs uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
								<Briefcase size={13} className="text-primary" />
								<span>Work & Services</span>
							</h3>
							<ul className="space-y-2">
								{workLinks.map(({ to, label }) => (
									<li key={to}>
										<Link
											href={to}
											data-umami-event="footer-nav-click"
											data-umami-event-label={label}
											className="group inline-flex items-center text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors py-0.5"
										>
											<span className="group-hover:translate-x-1 transition-transform duration-200">
												{label}
											</span>
											<ArrowUpRight
												size={13}
												className="ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary"
											/>
										</Link>
									</li>
								))}
								{settings.footerProjectLinks?.map(({ href, label }) => (
									<li key={href}>
										<a
											href={href}
											target="_blank"
											rel="noopener noreferrer"
											data-umami-event="footer-project-click"
											data-umami-event-label={label}
											className="group inline-flex items-center text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors py-0.5"
										>
											<span className="group-hover:translate-x-1 transition-transform duration-200">
												{label}
											</span>
											<ArrowUpRight
												size={13}
												className="ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary"
											/>
										</a>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				{/* Bottom Sub-Footer Bar */}
				<div className="border-t border-border/40 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-3">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-center md:text-left">
						<p>
							&copy; {currentYear} <span className="font-semibold text-foreground">{settings.copyrightName}</span>. All rights reserved.
						</p>
						{settings.footerTagline && (
							<>
								<span className="hidden md:inline text-border">•</span>
								<span>{settings.footerTagline}</span>
							</>
						)}
					</div>

					<div className="flex items-center gap-3 text-xs">
						<Link
							href="/privacy-policy"
							data-umami-event="footer-privacy-policy-click"
							className="hover:text-primary transition-colors"
						>
							Privacy Policy
						</Link>
						<span>•</span>
						<Link
							href="/terms-of-service"
							data-umami-event="footer-terms-of-service-click"
							className="hover:text-primary transition-colors"
						>
							Terms of Service
						</Link>
						{settings.repoUrl && (
							<>
								<span>•</span>
								<a
									href={settings.repoUrl}
									target="_blank"
									rel="noopener noreferrer"
									data-umami-event="footer-repo-click"
									className="hover:text-primary transition-colors inline-flex items-center gap-1"
								>
									<Github size={12} />
									<span>{settings.repoLinkLabel || "Source Code"}</span>
								</a>
							</>
						)}
					</div>
				</div>
			</div>
		</footer>
	);
};
