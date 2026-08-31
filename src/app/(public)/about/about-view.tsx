"use client";

import PowerfulCTACard from "@/components/cards/powerful-cta-card";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Button } from "@/components/ui/button";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { SectionHeader } from "@/components/ui/section-header";
import { getContentIcon } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import type { AboutCopy } from "@/services/page-copy/types";
import type { ResumeEntry } from "@/services/resume/types";
import type { Skill } from "@/services/skills/types";
import { ArrowRight, ChevronRight, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { ResumeSection } from "./resume-section";

type AboutViewProps = {
	experiences: ResumeEntry[];
	education: ResumeEntry[];
	skills: Skill[];
	copy: AboutCopy | null;
};

export function AboutView({ experiences, education, skills, copy }: AboutViewProps) {
	const hasResume = experiences.length > 0 || education.length > 0;
	const hero = copy?.hero;

	return (
		<div className="space-y-20 md:space-y-28 pb-12">
			{/* Hero Section */}
			<section className="relative overflow-hidden pt-6 md:pt-12">
				<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

				<div className="container px-4 max-w-6xl mx-auto relative">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
						{/* Profile Card / Avatar */}
						<div className="lg:col-span-5 animate-scale-in">
							<SpotlightCard className="p-4 md:p-6 rounded-3xl bg-card/70 border border-border/50 shadow-xl">
								<div className="relative aspect-square rounded-2xl overflow-hidden bg-background border border-border/50 group">
									<img
										src={hero?.photoUrl || "/placeholder.svg"}
										alt="Wisman Nur"
										className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
										{hero?.photoBadge && (
											<span className="bg-primary/90 text-primary-foreground text-xs px-3.5 py-1.5 rounded-full font-medium shadow-md backdrop-blur-md">
												{hero.photoBadge}
											</span>
										)}
									</div>
								</div>

								{hero?.statPills && hero.statPills.length > 0 && (
									<div className="mt-5 flex flex-wrap gap-2 justify-center">
										{hero.statPills.map((pill) => {
											const Icon = getContentIcon(pill.icon);
											return (
												<div
													key={pill.label}
													className={cn(
														"flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
														pill.variant === "success"
															? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
															: "bg-primary/10 text-primary border-primary/20",
													)}
												>
													<Icon size={14} />
													{pill.label}
												</div>
											);
										})}
									</div>
								)}
							</SpotlightCard>
						</div>

						{/* Bio & Intro Text */}
						<div className="lg:col-span-7 space-y-6 animate-fade-in">
							<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-semibold border border-primary/20">
								<User size={15} />
								{hero?.badge || "About Me"}
							</div>

							<h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.2]">
								<HighlightedText text={hero?.title ?? ""} />
							</h1>

							<div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed">
								{hero?.paragraphs?.map((paragraph, index) => (
									<p key={index}>
										<HighlightedText text={paragraph} boldClassName="font-bold text-foreground" />
									</p>
								))}
							</div>

							<div className="flex flex-wrap items-center gap-3.5 pt-2">
								<Button
									asChild
									size="lg"
									className="rounded-full px-7 h-12 text-xs md:text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
								>
									<Link href="/hire-me" data-umami-event="about-hero-hire-me-click" className="inline-flex items-center gap-2">
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
									className="rounded-full px-7 h-12 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
								>
									<Link href="/projects" data-umami-event="about-hero-view-work-click" className="inline-flex items-center gap-2">
										<span>Explore Case Studies</span>
										<ChevronRight
											size={15}
											className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
										/>
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Skills Section */}
			<section className="py-8 relative overflow-hidden">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.skillsSection.title || "Skills & Core Ecosystem"}
						subtitle={copy?.skillsSection.subtitle || "Tech Stack"}
						className="mb-12 text-center"
					/>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 animate-fade-in">
						{skills.map((skill, index) => (
							<SpotlightCard
								key={skill.id}
								className="p-3.5 flex items-center justify-center text-center rounded-xl bg-card/60 border border-border/50 hover:border-primary/40 transition-all duration-300"
								style={{ animationDelay: `${index * 0.04}s` }}
							>
								<span className="text-xs md:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
									{skill.name}
								</span>
							</SpotlightCard>
						))}
					</div>
				</div>
			</section>

			{/* Experience & Education Section */}
			{hasResume && <ResumeSection experiences={experiences} education={education} />}

			{/* Why Work With Me Section */}
			<section className="py-8 relative overflow-hidden">
				<div className="container max-w-6xl px-4 mx-auto">
					<SectionHeader
						title={copy?.whySection.title || "Engineering Values & Principles"}
						subtitle={copy?.whySection.subtitle || "How I Build"}
						description={copy?.whySection.description}
						className="text-center mb-14"
					/>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{copy?.whyCards?.map((card, index) => {
							const Icon = getContentIcon(card.icon);
							return (
								<SpotlightCard
									key={card.title || index}
									className="p-8 flex flex-col justify-between h-full bg-card/60 border border-border/50 hover:border-primary/40 hover:shadow-xl transition-all duration-300"
								>
									<div>
										<div className="p-3.5 bg-primary/10 rounded-2xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
											<Icon size={24} />
										</div>
										<h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
											{card.title}
										</h3>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{card.description}
										</p>
									</div>
								</SpotlightCard>
							);
						})}
					</div>

					<div className="mt-12 text-center">
						<Button
							asChild
							variant="outline"
							size="lg"
							className="rounded-full px-7 h-11 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md group"
						>
							<Link href="/services" data-umami-event="about-services-cta-click" className="inline-flex items-center gap-2">
								<span>Explore Solutions & Services</span>
								<ArrowRight
									size={15}
									className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
								/>
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Bottom CTA Section */}
			<section className="pb-8">
				<div className="container max-w-6xl px-4 mx-auto">
					{copy?.cta && <PowerfulCTACard {...copy.cta} />}
				</div>
			</section>
		</div>
	);
}
