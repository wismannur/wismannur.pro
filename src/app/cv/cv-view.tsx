"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { formatResumePeriod } from "@/lib/resume";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";
import type { ResumeEntry } from "@/services/resume/types";
import type { SiteSettings } from "@/services/site-settings/types";
import type { Skill } from "@/services/skills/types";
import type { UserProfile } from "@/services/user/types";
import {
	ArrowLeft,
	Briefcase,
	Code2,
	Download,
	Github,
	Globe,
	GraduationCap,
	Linkedin,
	Mail,
	MapPin,
	Moon,
	Send,
	Sparkles,
	Sun,
	Twitter,
	User,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface CVViewProps {
	user: UserProfile | null;
	experiences: ResumeEntry[];
	education: ResumeEntry[];
	skills: Skill[];
	settings: SiteSettings;
}

interface CVSectionTitleProps {
	icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
	title: string;
}

function CVSectionTitle({ icon: Icon, title }: CVSectionTitleProps) {
	return (
		<div className="flex items-center gap-2.5 mb-6 pb-2 border-b border-border/40 print:border-zinc-300">
			<div className="p-1 rounded-md bg-primary/10 text-primary print:bg-transparent print:p-0 print:text-zinc-900">
				<Icon size={15} aria-hidden="true" />
			</div>
			<h2 className="text-xs uppercase font-bold tracking-widest text-primary print:text-zinc-900 print:text-sm print:font-extrabold">
				{title}
			</h2>
			<div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent print:hidden" />
		</div>
	);
}

function renderDescriptionItems(description?: string) {
	if (!description) return null;

	const rawItems = description.includes("\n")
		? description.split("\n")
		: description.split(". ");

	const items = rawItems
		.map((item) => item.trim())
		.filter(Boolean)
		.map((item) => (item.endsWith(".") || item.includes(":") ? item : `${item}.`));

	if (items.length === 0) return null;

	const highlightPrefixes = [
		"Problem:",
		"Role:",
		"Action:",
		"Quantifiable results:",
		"Impact:",
		"Key Achievements:",
		"Responsibility:",
		"Responsibilities:",
		"Technologies:",
	];

	return (
		<ul className="text-xs sm:text-sm text-muted-foreground print:text-zinc-800 space-y-2 print:space-y-1 leading-relaxed list-none print:list-disc print:pl-4">
			{items.map((item, i) => {
				const matchingPrefix = highlightPrefixes.find((p) =>
					item.toLowerCase().startsWith(p.toLowerCase()),
				);

				if (matchingPrefix) {
					const parts = item.split(":");
					const prefix = parts[0];
					const content = parts.slice(1).join(":").trim();
					return (
						<li key={i} className="flex items-start gap-2.5 print:list-item print:gap-0">
							<span aria-hidden="true" className="text-primary print:hidden font-bold shrink-0 mt-0.5">•</span>
							<p className="inline">
								<strong className="text-foreground print:text-zinc-950 font-semibold">{prefix}:</strong>{" "}
								{content}
							</p>
						</li>
					);
				}

				return (
					<li key={i} className="flex items-start gap-2.5 print:list-item print:gap-0">
						<span aria-hidden="true" className="text-primary print:hidden font-bold shrink-0 mt-0.5">•</span>
						<p className="inline">{item}</p>
					</li>
				);
			})}
		</ul>
	);
}

export function CVView({ user, experiences, education, skills, settings }: CVViewProps) {
	const { isDark, setTheme } = useTheme();

	const name = user?.displayName || settings.siteName || "Wisman Nur";
	const email = user?.email || settings.publicEmail || "wismannur.pro@gmail.com";
	const location = user?.location || settings.location || "Indonesia";
	const website = user?.website || "https://wismannur.pro";
	const github = user?.social?.github || settings.social?.github;
	const linkedin = user?.social?.linkedin || settings.social?.linkedin;
	const twitter = user?.social?.twitter || settings.social?.twitter;
	const bio =
		user?.bio ||
		settings.footerBio ||
		"Senior Software Engineer & Frontend Specialist experienced in crafting high-performance, scalable, and user-centric web applications.";

	const toggleTheme = () => {
		const nextTheme = isDark ? "light" : "dark";
		setTheme(nextTheme);
		if (typeof window !== "undefined" && window.umami) {
			window.umami.track("theme-toggle", { theme: nextTheme, source: "cv-page" });
		}
	};

	const handlePrint = () => {
		trackEvent("cv-download-pdf-click", { name, format: "pdf" });
		const previousTitle = document.title;
		document.title = `CV_${name.replace(/\s+/g, "_")}_wismannur.pro`;
		window.print();
		window.addEventListener(
			"afterprint",
			() => {
				document.title = previousTitle;
			},
			{ once: true },
		);
	};

	return (
		<div className="min-h-screen bg-muted/20 text-foreground py-6 sm:py-12 print:py-0 print:bg-white relative">
			{/* ATS & PDF Print CSS Rules */}
			<style jsx global>{`
				@media print {
					@page {
						margin: 12mm 15mm;
						size: A4 portrait;
					}
					html, body {
						background: #ffffff !important;
						color: #09090b !important;
						font-size: 10.5pt;
						line-height: 1.45;
					}
					* {
						-webkit-print-color-adjust: exact !important;
						print-color-adjust: exact !important;
						text-shadow: none !important;
						box-shadow: none !important;
					}
				}
			`}</style>

			{/* Ambient background glow for screen view */}
			<div className="fixed top-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10 print:hidden" />
			<div className="fixed bottom-20 right-10 w-[400px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10 print:hidden" />

			{/* Standalone Modern Top Header (Hidden when printing) */}
			<header className="sticky top-4 z-40 container max-w-4xl mx-auto px-4 mb-8 print:hidden">
				<div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-lg shadow-black/5">
					<div className="flex items-center gap-1 sm:gap-2">
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="rounded-full gap-2 text-muted-foreground hover:text-foreground font-semibold px-3 h-9"
						>
							<Link href="/" data-umami-event="cv-back-home-click">
								<ArrowLeft size={15} />
								<span>wismannur.pro</span>
							</Link>
						</Button>
						<span className="text-border/60 hidden sm:inline">•</span>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="rounded-full text-xs text-muted-foreground hover:text-primary font-medium px-3 h-9 hidden sm:inline-flex"
						>
							<Link href="/about">About</Link>
						</Button>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="rounded-full text-xs text-muted-foreground hover:text-primary font-medium px-3 h-9 hidden sm:inline-flex"
						>
							<Link href="/projects">Projects</Link>
						</Button>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleTheme}
							className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/80"
							aria-label="Toggle theme"
							data-umami-event="cv-theme-toggle-click"
						>
							{isDark ? (
								<Sun size={16} className="text-yellow-500" />
							) : (
								<Moon size={16} className="text-slate-700" />
							)}
						</Button>

						<Button
							onClick={handlePrint}
							data-umami-event="cv-top-download-pdf-click"
							size="sm"
							className="rounded-full gap-1.5 px-4 h-9 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
						>
							<Download size={14} />
							<span>Download PDF</span>
						</Button>
					</div>
				</div>
			</header>

			{/* Main Printable CV Paper */}
			<main className="container max-w-4xl mx-auto px-4">
				<article
					id="cv-document"
					className={cn(
						"relative bg-card/90 text-card-foreground border border-border/60 rounded-3xl shadow-2xl p-8 sm:p-12 md:p-16 transition-all duration-300 backdrop-blur-sm",
						"print:bg-white print:text-zinc-950 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:max-w-none print:backdrop-blur-none"
					)}
				>
					{/* Top Accent Gradient Bar (Screen only) */}
					<div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40 rounded-t-3xl print:hidden pointer-events-none" />

					{/* CV Header */}
					<header className="border-b border-border/40 print:border-zinc-300 pb-8 mb-8 print:pb-4 print:mb-6">
						<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 print:flex-row print:justify-between">
							<div className="space-y-1.5">
								<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 mb-1 print:hidden">
									<Sparkles size={13} className="animate-pulse" />
									<span>Curriculum Vitae</span>
								</div>
								<h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground print:text-zinc-950 print:text-3xl">
									{name}
								</h1>
								<p className="text-base sm:text-lg font-semibold text-primary print:text-zinc-800 print:text-sm">
									Senior Software Engineer & Frontend Specialist
								</p>
							</div>

							{/* Contact / Links Info (Structured for clean ATS extraction) */}
							<address className="not-italic flex flex-col gap-2 text-xs sm:text-sm text-muted-foreground print:text-zinc-800 print:gap-1">
								<div className="flex items-center gap-2">
									<Mail size={14} aria-hidden="true" className="text-primary shrink-0 print:text-zinc-800" />
									<a
										href={`mailto:${email}`}
										className="hover:text-primary print:text-zinc-900 transition-colors font-medium"
										data-umami-event="cv-email-click"
									>
										{email}
									</a>
								</div>

								{location && (
									<div className="flex items-center gap-2">
										<MapPin size={14} aria-hidden="true" className="text-primary shrink-0 print:text-zinc-800" />
										<span>{location}</span>
									</div>
								)}

								{website && (
									<div className="flex items-center gap-2">
										<Globe size={14} aria-hidden="true" className="text-primary shrink-0 print:text-zinc-800" />
										<a
											href={website}
											target="_blank"
											rel="noopener noreferrer"
											className="hover:text-primary print:text-zinc-900 transition-colors font-medium"
											data-umami-event="cv-website-click"
										>
											{website.replace(/^https?:\/\//, "")}
										</a>
									</div>
								)}

								<div className="flex flex-wrap items-center gap-3 pt-1 print:pt-0 print:gap-x-4">
									{linkedin && (
										<a
											href={linkedin}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary print:text-zinc-900 transition-colors"
											data-umami-event="cv-linkedin-click"
										>
											<Linkedin size={13} aria-hidden="true" className="text-primary print:text-zinc-800" />
											<span className="print:hidden">LinkedIn</span>
											<span className="hidden print:inline">{linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
										</a>
									)}
									{github && (
										<a
											href={github}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary print:text-zinc-900 transition-colors"
											data-umami-event="cv-github-click"
										>
											<Github size={13} aria-hidden="true" className="text-primary print:text-zinc-800" />
											<span className="print:hidden">GitHub</span>
											<span className="hidden print:inline">{github.replace(/^https?:\/\/(www\.)?/, "")}</span>
										</a>
									)}
									{twitter && (
										<a
											href={twitter}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary print:text-zinc-900 transition-colors"
											data-umami-event="cv-twitter-click"
										>
											<Twitter size={13} aria-hidden="true" className="text-primary print:text-zinc-800" />
											<span className="print:hidden">Twitter</span>
											<span className="hidden print:inline">{twitter.replace(/^https?:\/\/(www\.)?/, "")}</span>
										</a>
									)}
								</div>
							</address>
						</div>
					</header>

					{/* Summary Section */}
					<section className="mb-10 print:mb-6">
						<CVSectionTitle icon={User} title="Professional Summary" />
						<p className="text-muted-foreground print:text-zinc-800 leading-relaxed text-sm sm:text-base print:text-xs">
							{bio}
						</p>
					</section>

					{/* Skills Section */}
					{skills.length > 0 && (
						<section className="mb-10 print:mb-6">
							<CVSectionTitle icon={Code2} title="Technical Skills & Competencies" />
							<ul className="flex flex-wrap gap-2 print:gap-1.5 list-none p-0 m-0">
								{skills.map((skill) => (
									<li key={skill.id}>
										<Badge
											variant="secondary"
											className="px-3 py-1.5 text-xs font-medium rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors print:bg-zinc-100 print:text-zinc-950 print:border-zinc-300 print:rounded-md print:px-2 print:py-0.5 print:font-semibold print:text-[10pt]"
										>
											{skill.name}
										</Badge>
									</li>
								))}
							</ul>
						</section>
					)}

					{/* Experience Section */}
					{experiences.length > 0 && (
						<section className="mb-10 print:mb-6">
							<CVSectionTitle icon={Briefcase} title="Work Experience" />

							<div className="space-y-8 print:space-y-4">
								{experiences.map((exp) => (
									<div
										key={exp.id}
										className="relative pl-6 border-l-2 border-primary/30 print:border-l-0 print:pl-0 break-inside-avoid print:break-inside-avoid space-y-2 print:space-y-1"
									>
										<div
											aria-hidden="true"
											className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background print:hidden"
										/>

										<div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 print:flex-row print:justify-between print:items-baseline">
											<h3 className="text-base sm:text-lg font-bold text-foreground print:text-zinc-950 print:text-sm print:font-bold">
												{exp.title}
											</h3>
											<span className="text-xs font-semibold text-primary print:text-zinc-700 bg-primary/10 print:bg-transparent border border-primary/20 print:border-none px-2.5 py-0.5 print:px-0 print:py-0 rounded-full w-fit print:text-[9.5pt]">
												{formatResumePeriod(exp)}
											</span>
										</div>

										<div className="text-xs sm:text-sm font-semibold text-primary/90 print:text-zinc-800 flex items-center gap-2 print:text-xs">
											<span>{exp.organization}</span>
											{exp.location && (
												<>
													<span aria-hidden="true" className="text-muted-foreground/60 print:text-zinc-500">•</span>
													<span className="text-muted-foreground font-normal print:text-zinc-700">{exp.location}</span>
												</>
											)}
										</div>

										{renderDescriptionItems(exp.description)}
									</div>
								))}
							</div>
						</section>
					)}

					{/* Education Section */}
					{education.length > 0 && (
						<section className="mb-8 print:mb-4">
							<CVSectionTitle icon={GraduationCap} title="Education & Certifications" />

							<div className="space-y-6 print:space-y-4">
								{education.map((edu) => (
									<div
										key={edu.id}
										className="relative pl-6 border-l-2 border-primary/30 print:border-l-0 print:pl-0 break-inside-avoid print:break-inside-avoid space-y-1.5 print:space-y-1"
									>
										<div
											aria-hidden="true"
											className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background print:hidden"
										/>

										<div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 print:flex-row print:justify-between print:items-baseline">
											<h3 className="text-base sm:text-lg font-bold text-foreground print:text-zinc-950 print:text-sm print:font-bold">
												{edu.title}
											</h3>
											<span className="text-xs font-semibold text-primary print:text-zinc-700 bg-primary/10 print:bg-transparent border border-primary/20 print:border-none px-2.5 py-0.5 print:px-0 print:py-0 rounded-full w-fit print:text-[9.5pt]">
												{formatResumePeriod(edu)}
											</span>
										</div>

										<div className="text-xs sm:text-sm font-semibold text-primary/90 print:text-zinc-800 print:text-xs">
											{edu.organization}
										</div>

										{edu.description && (
											<p className="text-xs sm:text-sm text-muted-foreground print:text-zinc-800 leading-relaxed print:text-xs">
												{edu.description}
											</p>
										)}
									</div>
								))}
							</div>
						</section>
					)}
				</article>

				{/* Bottom CTA / Action Section (Hidden when printing) */}
				<footer className="mt-12 mb-16 relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-primary/20 bg-gradient-to-br from-primary/10 via-card/90 to-background shadow-xl text-center space-y-5 print:hidden">
					<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
						<Sparkles size={13} className="animate-pulse" />
						<span>Export & Collaboration</span>
					</div>

					<h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
						Looking for a high-performing engineer?
					</h2>

					<p className="text-muted-foreground max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
						Save this CV as an ATS-friendly, clean PDF, or reach out directly to discuss full-time roles, contract projects, and consulting opportunities.
					</p>

					<div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
						<Button
							onClick={handlePrint}
							data-umami-event="cv-bottom-download-pdf-click"
							size="lg"
							className="rounded-full px-7 h-11 text-xs md:text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all group"
						>
							<Download size={16} />
							<span>Download PDF</span>
						</Button>

						<Button
							asChild
							variant="outline"
							size="lg"
							className="rounded-full px-7 h-11 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group"
						>
							<Link href="/hire-me" data-umami-event="cv-bottom-hire-me-click" className="inline-flex items-center gap-2">
								<Send size={15} className="text-primary" />
								<span>Hire Me / Contact</span>
							</Link>
						</Button>
					</div>
				</footer>
			</main>
		</div>
	);
}
