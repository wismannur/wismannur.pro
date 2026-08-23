"use client";

import { BlogCard } from "@/components/cards/blog-card";
import PowerfulCTACard from "@/components/cards/powerful-cta-card";
import { ProjectCard } from "@/components/cards/project-card";
import { Button } from "@/components/ui/button";
import { HighlightedText } from "@/components/ui/highlighted-text";
import { SectionHeader } from "@/components/ui/section-header";
import { VideoPlayer } from "@/components/ui/video-player";
import { getContentIcon } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import { blogService, projectService } from "@/services";
import type { HomeCopy } from "@/services/page-copy/types";
import type { ServiceItem } from "@/services/service-catalog/types";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
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
		<>
			<div className="space-y-12 md:space-y-24">
				<section className="pt-16 md:pt-24 lg:pt-28 relative overflow-hidden">
					<div className="container px-4 max-w-6xl mx-auto">
						<div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16 md:py-8">
							<div className="lg:w-1/2 animate-fade-in">
								<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
									<Sparkles size={16} />
									{copy?.hero.eyebrow}
								</div>

								<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
									<HighlightedText text={copy?.hero.title ?? ""} />
								</h1>

								<p className="text-lg text-muted-foreground mb-8 leading-relaxed">
									<HighlightedText text={copy?.hero.bio ?? ""} />
								</p>

								<div className="flex flex-wrap gap-4">
									<Button asChild size="lg" className="rounded-full px-8 group">
										<Link href="/hire-me">
											<Sparkles size={16} className="mr-2 animate-pulse" />
											Hire Me
										</Link>
									</Button>
									<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
										<Link href="/contact" className="hover:text-white">
											Contact me
											<ChevronRight
												size={16}
												className="ml-1 group-hover:translate-x-1 transition-transform"
											/>
										</Link>
									</Button>
								</div>
							</div>

							<div className="lg:w-1/2 animate-scale-in">
								<div className="relative group">
									<div
										className={clsx(
											"absolute rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500",
											"-inset-2 bg-gradient-to-tr from-primary/30 to-primary/60",
											"dark:from-primary/50 dark:to-primary/90"
										)}
									></div>
									<div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50">
										{/* Poster retired with cdn.sundflow.cloud (dead host) — the muted
										    background shows until the first frame loads. */}
										{copy?.hero.videoUrl && (
											<VideoPlayer src={copy.hero.videoUrl} className="aspect-video bg-muted" />
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="py-24 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
					<div className="container px-4 max-w-6xl mx-auto">
						<SectionHeader
							title={copy?.sections.services.title}
							subtitle={copy?.sections.services.subtitle}
							description={copy?.sections.services.description}
							className="text-center mb-16"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{services.map((service, index) => {
								const Icon = getContentIcon(service.icon);
								return (
									<div
										key={service.id}
										className={cn(
											"group bg-background border border-border/50 rounded-xl p-8",
											"hover:border-primary/30 dark:hover:border-primary/70 hover:shadow-lg transition-all duration-300",
											"flex flex-col h-full"
										)}
										style={{ animationDelay: `${(index + 1) * 0.1}s` }}
									>
										<div className="p-4 bg-primary/10 rounded-xl text-primary mb-6 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
											<Icon size={24} />
										</div>
										<h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
											{service.title}
										</h3>
										<p className="text-muted-foreground leading-relaxed flex-grow">
											{service.longDescription ?? service.description}
										</p>
									</div>
								);
							})}
						</div>

						<div className="mt-16 text-center">
							<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
								<Link href="/services" className="hover:text-white">
									Request Services
									<ArrowRight
										size={16}
										className="ml-2 group-hover:translate-x-1 transition-transform"
									/>
								</Link>
							</Button>
						</div>
					</div>
				</section>

				{enableBlog && (
					<section className="py-24">
						<div className="container px-4 max-w-6xl mx-auto">
							<SectionHeader
								title={copy?.sections.blog.title}
								subtitle={copy?.sections.blog.subtitle}
								className="text-center mb-16"
							/>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
								{isBlogsLoading
									? // Loading placeholders
										Array.from({ length: 3 }).map((_, i) => (
											<div key={i} className="bg-muted/30 h-[420px] rounded-xl animate-pulse" />
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

							<div className="mt-16 text-center">
								<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
									<Link href="/blog" className="hover:text-white">
										View all articles
										<ArrowRight
											size={16}
											className="ml-2 group-hover:translate-x-1 transition-transform"
										/>
									</Link>
								</Button>
							</div>
						</div>
					</section>
				)}

				<section className="py-24 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
					<div className="container px-4 max-w-6xl mx-auto">
						<SectionHeader
							title={copy?.sections.projects.title}
							subtitle={copy?.sections.projects.subtitle}
							className="text-center mb-16"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{isProjectsLoading
								? // Loading placeholders
									Array.from({ length: 3 }).map((_, i) => (
										<div key={i} className="bg-muted/30 h-[420px] rounded-xl animate-pulse" />
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

						<div className="mt-16 text-center">
							<Button asChild variant="outline" size="lg" className="rounded-full px-8 group">
								<Link href="/projects" className="hover:text-white">
									View all projects
									<ArrowRight
										size={16}
										className="ml-2 group-hover:translate-x-1 transition-transform"
									/>
								</Link>
							</Button>
						</div>
					</div>
				</section>

				<section className="py-24 !mt-6">
					<div className="container px-4 max-w-6xl mx-auto">
						{copy?.cta && <PowerfulCTACard {...copy.cta} />}
					</div>
				</section>
			</div>
		</>
	);
}
