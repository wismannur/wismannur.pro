"use client";

import { BlogCard } from "@/components/cards/blog-card";
import PowerfulCTACard from "@/components/cards/powerful-cta-card";
import { ProjectCard } from "@/components/cards/project-card";
import { HeroTerminal } from "@/components/home/hero-terminal";
import { LiveStatusPill } from "@/components/home/live-status-pill";
import { TechStackBento } from "@/components/home/tech-stack-bento";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Button } from "@/components/ui/button";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { SectionHeader } from "@/components/ui/section-header";
import { openCommandPalette } from "@/components/common/command-palette";
import { getContentIcon } from "@/lib/icon-registry";
import { blogService, projectService } from "@/services";
import type { HomeCopy } from "@/services/page-copy/types";
import type { ServiceItem } from "@/services/service-catalog/types";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowRight,
	CheckCircle2,
	ChevronRight,
	MessageSquare,
	Search,
	Sparkles,
	Zap,
} from "lucide-react";
import Link from "next/link";

type HomeViewProps = {
	copy: HomeCopy | null;
	services: ServiceItem[];
	enableBlog?: boolean;
};

export function HomeView({ copy, services, enableBlog = true }: HomeViewProps) {
	const { data: blogs = [], isLoading: isBlogsLoading } = useQuery({
		queryKey: ["latestBlogs"],
		queryFn: () => blogService.getLatest(3),
		enabled: enableBlog,
	});

	const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
		queryKey: ["latestProjects"],
		queryFn: () => projectService.getLatest(2),
	});

	return (
		<div className="flex flex-col gap-16 md:gap-24 pb-12">
			{/* Hero Section */}
			<section className="pt-4 md:pt-8 lg:pt-10 relative overflow-hidden">
				{/* Background ambient lighting */}
				<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

				<div className="container px-4 max-w-6xl mx-auto">
					{/* Status Bar */}
					<div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8 animate-fade-in">
						<LiveStatusPill />

						<button
							type="button"
							onClick={openCommandPalette}
							data-umami-event="hero-quick-search-click"
							className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/70 hover:bg-muted/80 backdrop-blur-sm border border-border/60 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm"
						>
							<Search size={13} className="text-primary" />
							<span>Quick Search & Actions</span>
							<kbd className="inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/70 bg-background/90 px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
								<span>⌘</span>K
							</kbd>
						</button>
					</div>

					{/* Main Hero Bento Row */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
						{/* Left Headline & Intro */}
						<div className="lg:col-span-5 space-y-5 animate-fade-in">
							{copy?.hero.eyebrow && (
								<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-semibold border border-primary/20">
									<Sparkles size={14} className="animate-pulse" />
									{copy.hero.eyebrow}
								</div>
							)}

							<h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15] text-balance">
								<HighlightedText text={copy?.hero.title ?? ""} />
							</h1>

							<p className="text-sm md:text-base text-muted-foreground leading-relaxed text-balance">
								<HighlightedText text={copy?.hero.bio ?? ""} />
							</p>

							{/* Call-to-actions */}
							<div className="flex flex-wrap items-center gap-3 pt-1">
								<Button
									asChild
									size="lg"
									className="rounded-full px-7 h-11 md:h-12 text-xs md:text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
								>
									<Link href="/hire-me" data-umami-event="home-hero-hire-me-click" className="inline-flex items-center gap-2">
										<Sparkles size={15} className="animate-pulse" />
										<span>Hire Me</span>
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
									className="rounded-full px-7 h-11 md:h-12 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
								>
									<Link href="/contact" data-umami-event="home-hero-contact-click" className="inline-flex items-center gap-2">
										<MessageSquare size={15} className="text-primary" />
										<span>Contact Me</span>
									</Link>
								</Button>
							</div>
						</div>

						{/* Right Interactive Terminal Widget */}
						<div className="lg:col-span-7 animate-scale-in">
							<HeroTerminal />
						</div>
					</div>
				</div>
			</section>

			{/* Highlights Bento Grid */}
			<section className="relative">
				<div className="container px-4 max-w-6xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
						{/* Tech Stack Bento (Span 7) */}
						<div className="md:col-span-7 flex">
							<TechStackBento />
						</div>

						{/* Experience & Value Bento (Span 5) */}
						<div className="md:col-span-5 flex flex-col">
							{/* Quick Impact Stats */}
							<SpotlightCard className="p-6 md:p-7 flex flex-col justify-between h-full rounded-2xl bg-card/70 border border-border/50">
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div className="p-2 rounded-xl bg-primary/10 text-primary">
											<Zap size={18} />
										</div>
										<div>
											<h3 className="font-bold text-base md:text-lg text-foreground">Engineering Philosophy</h3>
											<p className="text-xs text-muted-foreground">High performance, clean code, scalable architecture</p>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-3 mt-4">
										<div className="p-3.5 rounded-xl bg-background/50 border border-border/40">
											<div className="text-2xl font-extrabold text-primary mb-0.5">5+</div>
											<div className="text-xs text-muted-foreground font-medium">Years Building Web</div>
										</div>
										<div className="p-3.5 rounded-xl bg-background/50 border border-border/40">
											<div className="text-2xl font-extrabold text-emerald-500 mb-0.5">20+</div>
											<div className="text-xs text-muted-foreground font-medium">Shipped Projects</div>
										</div>
										<div className="p-3.5 rounded-xl bg-background/50 border border-border/40">
											<div className="text-2xl font-extrabold text-indigo-500 mb-0.5">100%</div>
											<div className="text-xs text-muted-foreground font-medium">Type-Safe Code</div>
										</div>
										<div className="p-3.5 rounded-xl bg-background/50 border border-border/40">
											<div className="text-2xl font-extrabold text-amber-500 mb-0.5">&lt;100ms</div>
											<div className="text-xs text-muted-foreground font-medium">Edge Optimized</div>
										</div>
									</div>
								</div>

								<div className="mt-5 pt-3.5 border-t border-border/40 flex items-center justify-between">
									<span className="text-xs text-muted-foreground">Ready to collaborate?</span>
									<Button asChild variant="ghost" size="sm" className="text-xs text-primary font-semibold p-0 hover:bg-transparent">
										<Link href="/hire-me" className="flex items-center gap-1">
											Book a slot <ArrowRight size={13} />
										</Link>
									</Button>
								</div>
							</SpotlightCard>
						</div>
					</div>
				</div>
			</section>

			{/* Services Section */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.sections.services.title || "Specialized Engineering"}
						subtitle={copy?.sections.services.subtitle || "Services"}
						description={copy?.sections.services.description}
						className="text-center mb-10 md:mb-12"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{services.map((service, index) => {
							const Icon = getContentIcon(service.icon);
							return (
								<SpotlightCard
									key={service.id}
									className="p-6 md:p-7 flex flex-col justify-between h-full rounded-2xl bg-card/60 border border-border/50 hover:border-primary/40 hover:shadow-xl transition-all duration-300"
									style={{ animationDelay: `${(index + 1) * 0.1}s` }}
								>
									<div>
										<div className="p-3.5 bg-primary/10 rounded-2xl text-primary mb-5 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
											<Icon size={22} />
										</div>
										<h3 className="text-lg md:text-xl font-bold mb-2.5 group-hover:text-primary transition-colors">
											{service.title}
										</h3>
										<p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-5">
											{service.longDescription ?? service.description}
										</p>

										{service.features && service.features.length > 0 && (
											<ul className="space-y-2 mb-5 border-t border-border/40 pt-3.5">
												{service.features.slice(0, 3).map((feat, fIdx) => (
													<li key={fIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
														<CheckCircle2 size={13} className="text-primary flex-shrink-0" />
														<span>{feat}</span>
													</li>
												))}
											</ul>
										)}
									</div>

									{service.priceLabel && (
										<div className="pt-3.5 border-t border-border/40 flex items-center justify-between">
											<span className="text-xs font-semibold text-primary">{service.priceLabel}</span>
											<Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary p-0">
												<Link href="/services">Learn more →</Link>
											</Button>
										</div>
									)}
								</SpotlightCard>
							);
						})}
					</div>

					<div className="mt-10 md:mt-12 text-center">
						<Button
							asChild
							variant="outline"
							size="lg"
							className="rounded-full px-7 h-11 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md group"
						>
							<Link href="/services" data-umami-event="home-services-cta-click" className="inline-flex items-center gap-2">
								<span>Explore All Services</span>
								<ArrowRight
									size={15}
									className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
								/>
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Featured Projects Section */}
			<section className="relative overflow-hidden">
				<div className="container px-4 max-w-6xl mx-auto">
					<SectionHeader
						title={copy?.sections.projects.title || "Featured Works"}
						subtitle={copy?.sections.projects.subtitle || "Portfolio"}
						className="text-center mb-10 md:mb-12"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
						{isProjectsLoading
							? Array.from({ length: 2 }).map((_, i) => (
									<div key={i} className="bg-muted/30 h-[380px] rounded-2xl animate-pulse" />
								))
							: projects.map((project, index) => (
									<ProjectCard
										key={project.id}
										project={project}
										className="animate-fade-in"
										style={{ animationDelay: `${index * 0.1}s` }}
									/>
								))}
					</div>

					<div className="mt-10 md:mt-12 text-center">
						<Button
							asChild
							variant="outline"
							size="lg"
							className="rounded-full px-7 h-11 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md group"
						>
							<Link href="/projects" data-umami-event="home-projects-cta-click" className="inline-flex items-center gap-2">
								<span>View All Projects</span>
								<ArrowRight
									size={15}
									className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
								/>
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Blog Section */}
			{enableBlog && (
				<section className="relative">
					<div className="container px-4 max-w-6xl mx-auto">
						<SectionHeader
							title={copy?.sections.blog.title || "Latest Articles & Notes"}
							subtitle={copy?.sections.blog.subtitle || "Insights"}
							className="text-center mb-10 md:mb-12"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{isBlogsLoading
								? Array.from({ length: 3 }).map((_, i) => (
										<div key={i} className="bg-muted/30 h-[360px] rounded-2xl animate-pulse" />
									))
								: blogs.map((blog, index) => (
										<BlogCard
											key={blog.id}
											blog={blog}
											className="animate-fade-in"
											style={{ animationDelay: `${index * 0.1}s` }}
										/>
									))}
						</div>

						<div className="mt-10 md:mt-12 text-center">
							<Button
								asChild
								variant="outline"
								size="lg"
								className="rounded-full px-7 h-11 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md group"
							>
								<Link href="/blog" data-umami-event="home-blog-cta-click" className="inline-flex items-center gap-2">
									<span>View All Articles</span>
									<ArrowRight
										size={15}
										className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
									/>
								</Link>
							</Button>
						</div>
					</div>
				</section>
			)}

			{/* Powerful Bottom CTA Section */}
			<section className="relative">
				<div className="container px-4 max-w-6xl mx-auto">
					{copy?.cta && <PowerfulCTACard {...copy.cta} />}
				</div>
			</section>
		</div>
	);
}
