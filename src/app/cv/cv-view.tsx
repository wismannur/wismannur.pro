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
	Download,
	Github,
	Globe,
	Linkedin,
	Mail,
	MapPin,
	Moon,
	Send,
	Sparkles,
	Sun,
	Twitter,
} from "lucide-react";
import Link from "next/link";

interface CVViewProps {
	user: UserProfile | null;
	experiences: ResumeEntry[];
	education: ResumeEntry[];
	skills: Skill[];
	settings: SiteSettings;
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
		document.title = "cv-resume-wismannur.pro";
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
		<div className="min-h-screen bg-muted/20 text-foreground py-6 sm:py-10 print:py-0 print:bg-white">
			{/* Standalone Minimal Top Header (Hidden when printing) */}
			<header className="container max-w-4xl mx-auto px-4 mb-6 print:hidden">
				<div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-background/90 backdrop-blur-md border border-border/50 shadow-sm">
					<Button asChild variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-foreground font-medium">
						<Link href="/" data-umami-event="cv-back-home-click">
							<ArrowLeft size={16} />
							<span>wismannur.pro</span>
						</Link>
					</Button>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleTheme}
							className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
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
							className="rounded-full gap-1.5 px-4 bg-primary text-primary-foreground shadow hover:bg-primary/90"
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
						"bg-card text-card-foreground border border-border/50 rounded-3xl shadow-xl p-8 sm:p-12 md:p-16 transition-all duration-300",
						"print:bg-white print:text-zinc-900 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:max-w-none"
					)}
				>
					{/* CV Header */}
					<header className="border-b border-border/40 print:border-zinc-300 pb-8 mb-8">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
							<div>
								<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3 print:hidden">
									<Sparkles size={13} />
									Curriculum Vitae
								</div>
								<h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-foreground print:text-zinc-950">
									{name}
								</h1>
								<p className="text-lg font-medium text-primary print:text-zinc-700">
									Senior Software Engineer & Frontend Specialist
								</p>
							</div>

							{/* Contact / Links Info */}
							<div className="flex flex-col gap-2 text-sm text-muted-foreground print:text-zinc-700">
								<div className="flex items-center gap-2">
									<Mail size={15} className="text-primary shrink-0 print:text-zinc-700" />
									<a
										href={`mailto:${email}`}
										className="hover:text-primary print:text-zinc-900 transition-colors"
										data-umami-event="cv-email-click"
									>
										{email}
									</a>
								</div>

								{location && (
									<div className="flex items-center gap-2">
										<MapPin size={15} className="text-primary shrink-0 print:text-zinc-700" />
										<span>{location}</span>
									</div>
								)}

								{website && (
									<div className="flex items-center gap-2">
										<Globe size={15} className="text-primary shrink-0 print:text-zinc-700" />
										<a
											href={website}
											target="_blank"
											rel="noopener noreferrer"
											className="hover:text-primary print:text-zinc-900 transition-colors"
											data-umami-event="cv-website-click"
										>
											{website.replace(/^https?:\/\//, "")}
										</a>
									</div>
								)}

								<div className="flex flex-wrap items-center gap-3 pt-1">
									{linkedin && (
										<a
											href={linkedin}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary print:text-zinc-800 transition-colors"
											data-umami-event="cv-linkedin-click"
										>
											<Linkedin size={14} className="text-primary print:text-zinc-800" />
											<span>LinkedIn</span>
										</a>
									)}
									{github && (
										<a
											href={github}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary print:text-zinc-800 transition-colors"
											data-umami-event="cv-github-click"
										>
											<Github size={14} className="text-primary print:text-zinc-800" />
											<span>GitHub</span>
										</a>
									)}
									{twitter && (
										<a
											href={twitter}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary print:text-zinc-800 transition-colors"
											data-umami-event="cv-twitter-click"
										>
											<Twitter size={14} className="text-primary print:text-zinc-800" />
											<span>Twitter</span>
										</a>
									)}
								</div>
							</div>
						</div>
					</header>

					{/* Summary Section */}
					<section className="mb-10 print:mb-6">
						<h2 className="text-xs uppercase font-bold tracking-widest text-primary print:text-zinc-800 mb-3 flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-primary print:bg-zinc-800"></span>
							Professional Summary
						</h2>
						<p className="text-muted-foreground print:text-zinc-800 leading-relaxed text-sm sm:text-base">
							{bio}
						</p>
					</section>

					{/* Skills Section */}
					{skills.length > 0 && (
						<section className="mb-10 print:mb-6">
							<h2 className="text-xs uppercase font-bold tracking-widest text-primary print:text-zinc-800 mb-3 flex items-center gap-2">
								<span className="w-2 h-2 rounded-full bg-primary print:bg-zinc-800"></span>
								Technical Skills & Competencies
							</h2>
							<div className="flex flex-wrap gap-2">
								{skills.map((skill) => (
									<Badge
										key={skill.id}
										variant="secondary"
										className="px-3 py-1 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 print:bg-zinc-100 print:text-zinc-900 print:border-zinc-300"
									>
										{skill.name}
									</Badge>
								))}
							</div>
						</section>
					)}

					{/* Experience Section */}
					{experiences.length > 0 && (
						<section className="mb-10 print:mb-6">
							<h2 className="text-xs uppercase font-bold tracking-widest text-primary print:text-zinc-800 mb-6 flex items-center gap-2">
								<span className="w-2 h-2 rounded-full bg-primary print:bg-zinc-800"></span>
								Work Experience
							</h2>

							<div className="space-y-8 print:space-y-5">
								{experiences.map((exp) => (
									<div key={exp.id} className="relative pl-6 border-l-2 border-primary/30 print:border-zinc-300 break-inside-avoid">
										<div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary print:bg-zinc-800"></div>

										<div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
											<h3 className="text-lg font-bold text-foreground print:text-zinc-950">
												{exp.title}
											</h3>
											<span className="text-xs font-semibold text-primary print:text-zinc-700 bg-primary/10 print:bg-zinc-100 px-2.5 py-0.5 rounded-full w-fit">
												{formatResumePeriod(exp)}
											</span>
										</div>

										<div className="text-sm font-medium text-muted-foreground print:text-zinc-700 mb-3 flex items-center gap-3">
											<span>{exp.organization}</span>
											{exp.location && (
												<>
													<span>•</span>
													<span>{exp.location}</span>
												</>
											)}
										</div>

										{exp.description && (
											<div className="text-sm text-muted-foreground print:text-zinc-800 space-y-1.5 leading-relaxed">
												{exp.description.split(". ").map((sentence, i) => {
													if (!sentence.trim()) return null;
													const trimmed = sentence.endsWith(".") ? sentence : `${sentence}.`;
													if (
														trimmed.startsWith("Problem:") ||
														trimmed.startsWith("Role:") ||
														trimmed.startsWith("Action:") ||
														trimmed.startsWith("Quantifiable results:")
													) {
														const [prefix, content] = trimmed.split(": ");
														return (
															<div key={i} className="flex items-start gap-2">
																<span className="text-primary print:text-zinc-800 font-semibold">•</span>
																<p>
																	<strong className="text-foreground print:text-zinc-950">{prefix}:</strong> {content}
																</p>
															</div>
														);
													}
													return (
														<div key={i} className="flex items-start gap-2">
															<span className="text-primary print:text-zinc-800 font-semibold">•</span>
															<p>{trimmed}</p>
														</div>
													);
												})}
											</div>
										)}
									</div>
								))}
							</div>
						</section>
					)}

					{/* Education Section */}
					{education.length > 0 && (
						<section className="mb-8 print:mb-4">
							<h2 className="text-xs uppercase font-bold tracking-widest text-primary print:text-zinc-800 mb-6 flex items-center gap-2">
								<span className="w-2 h-2 rounded-full bg-primary print:bg-zinc-800"></span>
								Education & Certifications
							</h2>

							<div className="space-y-6 print:space-y-4">
								{education.map((edu) => (
									<div key={edu.id} className="relative pl-6 border-l-2 border-primary/30 print:border-zinc-300 break-inside-avoid">
										<div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary print:bg-zinc-800"></div>

										<div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
											<h3 className="text-lg font-bold text-foreground print:text-zinc-950">
												{edu.title}
											</h3>
											<span className="text-xs font-semibold text-primary print:text-zinc-700 bg-primary/10 print:bg-zinc-100 px-2.5 py-0.5 rounded-full w-fit">
												{formatResumePeriod(edu)}
											</span>
										</div>

										<div className="text-sm font-medium text-muted-foreground print:text-zinc-700 mb-2">
											{edu.organization}
										</div>

										{edu.description && (
											<p className="text-sm text-muted-foreground print:text-zinc-800 leading-relaxed">
												{edu.description}
											</p>
										)}
									</div>
								))}
							</div>
						</section>
					)}
				</article>

				{/* Bottom Action Section (Hidden when printing) */}
				<footer className="mt-12 mb-16 p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/20 text-center space-y-6 print:hidden">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
						<Download size={14} />
						EXPORT & CONTACT
					</div>

					<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
						Ready to collaborate or need an offline copy?
					</h2>

					<p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
						You can save this CV as a clean, high-resolution PDF or get in touch directly to discuss opportunities.
					</p>

					<div className="flex flex-wrap items-center justify-center gap-4 pt-2">
						<Button
							onClick={handlePrint}
							data-umami-event="cv-bottom-download-pdf-click"
							size="lg"
							className="rounded-full px-8 gap-2 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
						>
							<Download size={18} />
							Download CV (PDF)
						</Button>

						<Button
							asChild
							variant="outline"
							size="lg"
							className="rounded-full px-8 gap-2 hover:bg-primary/10"
						>
							<Link href="/contact" data-umami-event="cv-bottom-contact-click">
								<Send size={16} />
								Contact Me
							</Link>
						</Button>
					</div>
				</footer>
			</main>
		</div>
	);
}
