"use client";

import { projectService } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ProjectCard } from "@/components/cards/project-card";
import Pagination from "@/components/common/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectFilters from "@/features/project/project-filters";
import ProjectGrid from "@/features/project/project-grid";
import ProjectHeader from "@/features/project/project-header";
import type { ListHeaderCopy } from "@/services/page-copy/types";
import ProjectResultsInfo from "@/features/project/project-results-info";

const ITEMS_PER_PAGE = 6;

export const ProjectsView = ({ copy }: { copy: ListHeaderCopy | null }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedTech, setSelectedTech] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	// Fetch featured projects
	const { data: featuredProjects = [], isLoading: isFeaturedLoading } = useQuery({
		queryKey: ["featuredProjects"],
		queryFn: () => projectService.getFeaturedProjects(),
	});

	// Fetch all technologies
	const { data: allTechnologies = [], isLoading: isTechnologiesLoading } = useQuery({
		queryKey: ["projectTechnologies"],
		queryFn: () => projectService.getAllTechnologies(),
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
	});

	// Fetch paginated and filtered projects - removed withLoading
	const {
		data: projectData = { projects: [], totalPages: 0, currentPage: 1 },
		isLoading: isFilteredLoading,
	} = useQuery({
		queryKey: ["projects", currentPage, searchTerm, selectedTech],
		queryFn: () =>
			projectService.getByPage(currentPage, ITEMS_PER_PAGE, {
				searchTerm,
				technology: selectedTech,
			}),
	});

	const { projects: paginatedProjects, totalPages } = projectData;

	const clearFilters = () => {
		setSearchTerm("");
		setSelectedTech(null);
		setCurrentPage(1); // Reset to first page when clearing filters
	};

	// Props for child components
	const filterProps = {
		searchTerm,
		setSearchTerm,
		selectedTech,
		setSelectedTech,
		allTechnologies,
	};

	const resultsProps = {
		filteredProjects: paginatedProjects,
		paginatedProjects,
		isLoading: isFilteredLoading,
		currentPage,
		totalPages,
	};

	const gridProps = {
		isLoading: isFilteredLoading,
		projects: paginatedProjects,
		filteredProjects: paginatedProjects,
		clearFilters,
	};

	const paginationProps = {
		currentPage,
		totalPages,
		pageNumbers: Array.from({ length: totalPages }, (_, i) => i + 1),
		setCurrentPage,
	};

	// Skeleton loader for featured projects
	const FeaturedProjectsSkeleton = () => (
		<div className="space-y-8">
			{Array.from({ length: 3 }).map((_, i) => (
				<div
					key={i}
					className="flex flex-col md:flex-row gap-6 rounded-xl border border-border/40 p-4 overflow-hidden"
				>
					<Skeleton className="h-64 md:w-1/2 rounded-lg" />
					<div className="md:w-1/2 space-y-4 py-2">
						<Skeleton className="h-8 w-3/4" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-2/3" />
						<div className="flex gap-2 pt-2">
							{Array.from({ length: 4 }).map((_, j) => (
								<Skeleton key={j} className="h-6 w-16 rounded-full" />
							))}
						</div>
					</div>
				</div>
			))}
		</div>
	);

	// Skeleton loader for regular projects grid
	const ProjectsGridSkeleton = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="border border-border/40 rounded-lg p-4 space-y-4">
					<Skeleton className="h-48 w-full rounded-lg" />
					<Skeleton className="h-6 w-3/4" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<div className="flex gap-2">
						{Array.from({ length: 3 }).map((_, j) => (
							<Skeleton key={j} className="h-5 w-14 rounded-full" />
						))}
					</div>
				</div>
			))}
		</div>
	);

	return (
		<div className="py-12 md:py-20">
			<div className="container px-4 max-w-6xl mx-auto">
				<ProjectHeader
					eyebrow={copy?.header.eyebrow}
					title={copy?.header.title}
					description={copy?.header.description}
				/>

				{/* Featured Projects Section */}
				{featuredProjects.length > 0 || isFeaturedLoading ? (
					<section className="flex flex-col mb-20">
						<div className="text-center max-w-2xl mx-auto mb-10">
							<h2 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-r from-primary via-indigo-500 to-purple-500 text-transparent bg-clip-text inline-block">
								Featured Projects
							</h2>
							<p className="text-muted-foreground text-sm md:text-base leading-relaxed">
								A curated selection of production systems showcasing technical architecture,
								problem-solving depth, and measurable user impact.
							</p>
						</div>

						{isFeaturedLoading ? (
							<FeaturedProjectsSkeleton />
						) : (
							<div className="grid grid-cols-1 gap-8">
								{featuredProjects.map((project) => (
									<ProjectCard key={project.id} project={project} variant="featured" />
								))}
							</div>
						)}
					</section>
				) : null}

				<section className="mb-16">
					<div className="text-center max-w-2xl mx-auto mb-8">
						<h2 className="text-2xl font-bold tracking-tight mb-2">All Projects & Exploration</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							Explore all applications, open-source utilities, and experiments built with modern toolchains.
						</p>
					</div>

					<ProjectFilters {...filterProps} />

					{/* Project Results Info */}
					<ProjectResultsInfo {...resultsProps} />

					{/* Project Grid with Skeleton Loading */}
					{isFilteredLoading ? (
						<ProjectsGridSkeleton />
					) : (
						<ProjectGrid paginatedProjects={paginatedProjects} {...gridProps} />
					)}
				</section>

				{/* Pagination */}
				{totalPages > 1 && <Pagination {...paginationProps} />}
			</div>
		</div>
	);
};
