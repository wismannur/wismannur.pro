"use client";

import PowerfulCTACard from "@/components/cards/powerful-cta-card";
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
		<div className="space-y-24">
			{/* Hero Section */}
			<section className="relative overflow-hidden pt-8 md:pt-16">
				<div className="container px-4 lg:px-0 relative">
					<div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
						<div className="lg:w-2/5 animate-scale-in">
							<div className="relative group">
								<div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-primary/40 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500"></div>
								<div className="relative aspect-square rounded-2xl overflow-hidden bg-background shadow-xl border border-border/50">
									<img
										src={hero?.photoUrl || "/placeholder.svg"}
										alt="Profile"
										className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
										<div className="absolute bottom-4 left-4 right-4">
											<div className="flex gap-2 justify-center">
												<span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
													{hero?.photoBadge}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-6 flex flex-wrap gap-3 justify-center">
								{hero?.statPills?.map((pill) => {
									const Icon = getContentIcon(pill.icon);
									return (
										<div
											key={pill.label}
											className={cn(
												"flex items-center gap-2 px-4 py-2 rounded-full font-medium",
												pill.variant === "success"
													? "bg-green-500/10 text-green-500"
													: "bg-primary/10 text-primary",
											)}
										>
											<Icon size={16} />
											{pill.label}
										</div>
									);
								})}
							</div>
						</div>

						<div className="lg:w-3/5 animate-fade-in">
							<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
								<User size={16} />
								{hero?.badge}
							</div>

							<h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-6 tracking-tight leading-tight">
								<HighlightedText text={hero?.title ?? ""} />
							</h1>

							<div className="space-y-4 text-base text-muted-foreground mb-8 leading-relaxed">
								{hero?.paragraphs?.map((paragraph, index) => (
									<p key={index}>
										<HighlightedText text={paragraph} boldClassName="font-bold" />
									</p>
								))}
							</div>

							<div className="flex flex-wrap gap-4">
								<Button asChild size="lg" className="rounded-full px-8 group">
									<Link href="/hire-me" data-umami-event="about-hero-hire-me-click">
										<Sparkles size={16} className="mr-2" />
										Hire Me
									</Link>
								</Button>
								<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
									<Link href="/projects" data-umami-event="about-hero-view-work-click" className="hover:text-white">
										View My Work
										<ChevronRight
											size={16}
											className="ml-1 group-hover:translate-x-1 transition-transform"
										/>
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Skills Section */}
			<section className="py-20 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
				<div className="container px-4 lg:px-0 relative">
					<SectionHeader
						title={copy?.skillsSection.title}
						subtitle={copy?.skillsSection.subtitle}
						className="mb-16 text-center"
					/>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
						{skills.map((skill, index) => (
							<div
								key={skill.id}
								className={cn(
									"p-4 bg-background rounded-xl border border-border/50 shadow-sm",
									"hover:border-primary/30 dark:hover:border-primary/70 hover:shadow-md transition-all duration-300",
									"flex items-center justify-center text-center",
								)}
								style={{ animationDelay: `${index * 0.05}s` }}
							>
								<span className="font-medium">{skill.name}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Experience & Education Section */}
			{hasResume && <ResumeSection experiences={experiences} education={education} />}

			{/* New highlights section */}
			<section className="py-16 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
				<div className="container max-w-6xl px-4">
					<SectionHeader
						title={copy?.whySection.title}
						subtitle={copy?.whySection.subtitle}
						description={copy?.whySection.description}
						className="text-center mb-16"
					/>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{copy?.whyCards?.map((card) => {
							const Icon = getContentIcon(card.icon);
							return (
								<div
									key={card.title}
									className="bg-background border border-border/50 rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary/30 dark:hover:border-primary/70 group"
								>
									<div className="p-4 bg-primary/10 rounded-xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
										<Icon size={24} />
									</div>
									<h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
										{card.title}
									</h3>
									<p className="text-muted-foreground leading-relaxed">{card.description}</p>
								</div>
							);
						})}
					</div>

					<div className="mt-12 text-center">
						<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
							<Link href="/services" data-umami-event="about-services-cta-click" className="hover:text-white">
								Explore My Services
								<ArrowRight
									size={16}
									className="ml-2 group-hover:translate-x-1 transition-transform"
								/>
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Enhanced Hire Me Section with ContactCTA */}
			<section className="pb-16">
				<div className="container max-w-6xl px-4 mx-auto">
					{copy?.cta && <PowerfulCTACard {...copy.cta} />}
				</div>
			</section>
		</div>
	);
}
