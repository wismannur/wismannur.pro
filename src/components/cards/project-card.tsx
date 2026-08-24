"use client";

import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn, formatDate } from "@/lib/utils";
import type { Project } from "@/services";
import { ArrowRight, Calendar, Clock, ExternalLink, Eye, Github, Sparkles } from "lucide-react";
import React from "react";
import Link from "next/link";
import Chip from "../ui/chip";

interface ProjectCardProps {
	project: Project;
	variant?: "default" | "featured";
	className?: string;
	style?: React.CSSProperties;
}

const ProjectCard = React.memo(
	({ project, className, variant = "default", style }: ProjectCardProps) => {
		// Only use horizontal layout if explicitly requested with variant="featured"
		const isHorizontalFeatured = variant === "featured";
		const readingTime = project.readingTime ? `${project.readingTime} min read` : "5 min read";

		if (isHorizontalFeatured) {
			return (
				<SpotlightCard
					className={cn(
						"group flex flex-col md:flex-row md:items-stretch rounded-3xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/40",
						className
					)}
					style={style}
				>
					{/* Image */}
					<div className="relative md:w-1/2 aspect-video md:aspect-auto md:min-h-[300px] overflow-hidden bg-muted/40">
						<Link
							href={`/projects/${project.slug}`}
							data-umami-event="project-card-image-click"
							data-umami-event-project={project.slug}
							className="block w-full h-full"
						>
							<img
								src={project.image || "/placeholder.svg"}
								alt={project.title}
								className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
						</Link>

						<div className="absolute top-3 left-3 z-10">
							<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-md backdrop-blur-md">
								<Sparkles size={12} className="animate-pulse" />
								Featured Project
							</span>
						</div>
					</div>

					{/* Content */}
					<div className="flex flex-col p-6 md:p-8 md:w-1/2 flex-1 justify-between gap-5">
						<div>
							{/* Metadata */}
							<div className="flex flex-wrap items-center text-xs text-muted-foreground mb-3 gap-x-3 gap-y-1">
								<div className="flex items-center">
									<Calendar size={13} className="mr-1 text-primary/70" />
									<time dateTime={project.publishedDate?.toString()}>
										{formatDate(project.publishedDate)}
									</time>
								</div>
								<span>•</span>
								<div className="flex items-center">
									<Clock size={13} className="mr-1 text-primary/70" />
									<span>{readingTime}</span>
								</div>
								<span>•</span>
								<div className="flex items-center">
									<Eye size={13} className="mr-1 text-primary/70" />
									<span>{project.views.toLocaleString()} views</span>
								</div>
							</div>

							{/* Title */}
							<Link
								href={`/projects/${project.slug}`}
								data-umami-event="project-card-title-click"
								data-umami-event-project={project.slug}
								className="block group/title"
							>
								<h3 className="text-2xl font-bold tracking-tight text-foreground mb-2.5 transition-colors duration-200 group-hover/title:text-primary">
									{project.title}
								</h3>
							</Link>

							{/* Summary */}
							<p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-5">
								{project.summary}
							</p>

							{/* Tech Stack */}
							<div className="flex flex-wrap gap-1.5 mb-2">
								{project.technologies.slice(0, 5).map((tech) => (
									<Chip
										key={tech}
										className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
									>
										{tech}
									</Chip>
								))}
								{project.technologies.length > 5 && (
									<span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
										+{project.technologies.length - 5}
									</span>
								)}
							</div>
						</div>

						{/* Actions */}
						<div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
							<div className="flex items-center gap-2.5">
								{project.demoUrl && (
									<a
										href={project.demoUrl}
										target="_blank"
										rel="noopener noreferrer"
										data-umami-event="project-card-demo-click"
										data-umami-event-project={project.slug}
										className="text-xs font-semibold text-foreground/90 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/70 hover:bg-primary hover:text-primary-foreground border border-border/50 transition-all duration-200"
										onClick={(e) => e.stopPropagation()}
										aria-label={`Live demo for ${project.title}`}
									>
										<ExternalLink size={13} />
										Live Demo
									</a>
								)}
								{project.repoUrl && (
									<a
										href={project.repoUrl}
										target="_blank"
										rel="noopener noreferrer"
										data-umami-event="project-card-repo-click"
										data-umami-event-project={project.slug}
										className="text-xs font-semibold text-foreground/90 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/70 hover:bg-primary hover:text-primary-foreground border border-border/50 transition-all duration-200"
										onClick={(e) => e.stopPropagation()}
										aria-label={`Source code for ${project.title}`}
									>
										<Github size={13} />
										Source
									</a>
								)}
							</div>

							<Button
								variant="ghost"
								size="sm"
								className="text-xs text-primary font-bold p-0 hover:bg-transparent hover:text-primary/80 group-hover:translate-x-1 transition-transform"
								asChild
							>
								<Link
									href={`/projects/${project.slug}`}
									data-umami-event="project-card-view-click"
									data-umami-event-project={project.slug}
								>
									Case Study
									<ArrowRight size={13} className="ml-1" />
								</Link>
							</Button>
						</div>
					</div>
				</SpotlightCard>
			);
		}

		// Default Vertical Card Layout (perfect for 2-column or 3-column grids)
		return (
			<SpotlightCard
				className={cn(
					"group flex flex-col h-full rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/40",
					className
				)}
				style={style}
			>
				{/* Image Container */}
				<div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/30 border-b border-border/40">
					<Link
						href={`/projects/${project.slug}`}
						data-umami-event="project-card-image-click"
						data-umami-event-project={project.slug}
						className="block w-full h-full"
					>
						<img
							src={project.image || "/placeholder.svg"}
							alt={project.title}
							className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
					</Link>

					{project.isFeatured && (
						<div className="absolute top-3 left-3 z-10">
							<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground shadow-md backdrop-blur-md">
								<Sparkles size={11} className="animate-pulse" />
								Featured
							</span>
						</div>
					)}
				</div>

				{/* Card Body */}
				<div className="flex flex-col flex-1 p-6 justify-between gap-4">
					<div>
						{/* Metadata Bar */}
						<div className="flex flex-wrap items-center text-xs text-muted-foreground mb-3 gap-x-2.5 gap-y-1">
							<div className="flex items-center">
								<Calendar size={12} className="mr-1 text-primary/70" />
								<time dateTime={project.publishedDate?.toString()}>
									{formatDate(project.publishedDate)}
								</time>
							</div>

							<span>•</span>

							<div className="flex items-center">
								<Clock size={12} className="mr-1 text-primary/70" />
								<span>{readingTime}</span>
							</div>

							<span>•</span>

							<div className="flex items-center">
								<Eye size={12} className="mr-1 text-primary/70" />
								<span>{project.views.toLocaleString()}</span>
							</div>
						</div>

						{/* Title */}
						<Link
							href={`/projects/${project.slug}`}
							data-umami-event="project-card-title-click"
							data-umami-event-project={project.slug}
							className="block group/title"
						>
							<h3 className="font-bold tracking-tight text-foreground text-xl mb-2 line-clamp-1 transition-colors duration-200 group-hover/title:text-primary">
								{project.title}
							</h3>
						</Link>

						{/* Summary */}
						<p className="text-muted-foreground text-xs md:text-sm line-clamp-2 leading-relaxed mb-4 min-h-[36px]">
							{project.summary}
						</p>

						{/* Technologies */}
						<div className="flex flex-wrap gap-1.5">
							{project.technologies.slice(0, 4).map((tech) => (
								<Chip
									key={tech}
									className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
								>
									{tech}
								</Chip>
							))}
							{project.technologies.length > 4 && (
								<span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
									+{project.technologies.length - 4}
								</span>
							)}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
						<div className="flex items-center gap-2">
							{project.demoUrl && (
								<a
									href={project.demoUrl}
									target="_blank"
									rel="noopener noreferrer"
									data-umami-event="project-card-demo-click"
									data-umami-event-project={project.slug}
									className="text-xs font-semibold text-foreground/80 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/40 transition-all duration-200"
									onClick={(e) => e.stopPropagation()}
									aria-label={`Live demo for ${project.title}`}
								>
									<ExternalLink size={12} />
									Demo
								</a>
							)}

							{project.repoUrl && (
								<a
									href={project.repoUrl}
									target="_blank"
									rel="noopener noreferrer"
									data-umami-event="project-card-repo-click"
									data-umami-event-project={project.slug}
									className="text-xs font-semibold text-foreground/80 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/40 transition-all duration-200"
									onClick={(e) => e.stopPropagation()}
									aria-label={`Source code for ${project.title}`}
								>
									<Github size={12} />
									Code
								</a>
							)}
						</div>

						<Button
							variant="ghost"
							size="sm"
							className="text-xs text-primary font-bold p-0 hover:bg-transparent hover:text-primary/80 group-hover:translate-x-1 transition-transform"
							asChild
						>
							<Link
								href={`/projects/${project.slug}`}
								data-umami-event="project-card-view-click"
								data-umami-event-project={project.slug}
							>
								Case Study
								<ArrowRight size={13} className="ml-1" />
							</Link>
						</Button>
					</div>
				</div>
			</SpotlightCard>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.project.id === nextProps.project.id &&
			prevProps.project.updatedAt === nextProps.project.updatedAt &&
			prevProps.variant === nextProps.variant
		);
	}
);

ProjectCard.displayName = "ProjectCard";

export { ProjectCard };
