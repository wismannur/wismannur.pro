"use client";

import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { trackEvent } from "@/lib/umami";
import { Code, X } from "lucide-react";

interface ProjectFiltersProps {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	selectedTech: string | null;
	setSelectedTech: (tech: string | null) => void;
	allTechnologies: string[];
}

const ProjectFilters = ({
	searchTerm,
	setSearchTerm,
	selectedTech,
	setSelectedTech,
	allTechnologies,
}: ProjectFiltersProps) => {
	const handleTechClick = (tech: string | null) => {
		setSelectedTech(tech);
		trackEvent("project-filter-tech", { tech: tech ?? "all" });
	};

	return (
		<SpotlightCard className="p-5 md:p-6 mb-12 rounded-2xl bg-card/60 border border-border/50 shadow-sm">
			<div className="flex flex-col justify-between gap-4">
				<div className="flex items-center flex-wrap gap-2">
					<div className="flex items-center mr-2 text-foreground font-medium text-xs md:text-sm">
						<Code size={16} className="mr-1.5 text-primary" />
						<span>Filter by Stack:</span>
					</div>
					<Button
						variant={selectedTech === null ? "default" : "outline"}
						size="sm"
						onClick={() => handleTechClick(null)}
						data-umami-event="project-filter-all"
						className="rounded-full px-3.5 h-8 text-xs font-semibold"
					>
						All Projects
					</Button>
					{allTechnologies.map((tech) => (
						<Button
							key={tech}
							variant={selectedTech === tech ? "default" : "outline"}
							size="sm"
							onClick={() => handleTechClick(tech === selectedTech ? null : tech)}
							data-umami-event="project-filter-tech-click"
							data-umami-event-tech={tech}
							className="rounded-full px-3.5 h-8 text-xs font-medium group border-border/60"
						>
							<span>{tech}</span>
							{selectedTech === tech && <X size={13} className="ml-1.5 group-hover:text-red-500" />}
						</Button>
					))}
				</div>
			</div>

			{/* Active filters display */}
			{(searchTerm || selectedTech) && (
				<div className="mt-4 pt-4 border-t border-border/40 flex items-center flex-wrap gap-2 text-xs">
					<span className="text-muted-foreground">Active filter:</span>
					{selectedTech && (
						<div className="bg-primary/10 border border-primary/20 text-primary rounded-full px-3 py-1 flex items-center font-medium">
							<span>{selectedTech}</span>
							<button
								type="button"
								onClick={() => setSelectedTech(null)}
								data-umami-event="project-filter-clear-tech"
								data-umami-event-tech={selectedTech}
								className="ml-1.5 hover:text-red-500"
								aria-label="Clear tech filter"
							>
								<X size={12} />
							</button>
						</div>
					)}
					<button
						type="button"
						onClick={() => {
							setSearchTerm("");
							setSelectedTech(null);
						}}
						data-umami-event="project-filter-reset"
						className="text-primary hover:underline ml-2 font-medium"
					>
						Reset
					</button>
				</div>
			)}
		</SpotlightCard>
	);
};

export default ProjectFilters;
