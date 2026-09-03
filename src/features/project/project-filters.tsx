"use client";

import React from "react";
import { Code, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";

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
    <SpotlightCard className="p-5 md:p-6 mb-8 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.08] shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search case studies, stacks, systems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-full bg-black/40 border-white/[0.1] text-white placeholder:text-gray-500 focus-visible:ring-primary/40 focus-visible:border-primary/50 text-xs sm:text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tech Filter Chips */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center mr-1 text-gray-400 text-xs font-semibold">
            <Code size={14} className="mr-1.5 text-primary" />
            <span>Stack:</span>
          </div>
          <Button
            variant={selectedTech === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleTechClick(null)}
            data-umami-event="project-filter-all"
            className={cn(
              "rounded-full px-3.5 h-8 text-xs font-semibold transition-all duration-200",
              selectedTech === null
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "border-white/[0.1] bg-white/[0.03] text-gray-300 hover:bg-primary/10 hover:text-white hover:border-primary/40"
            )}
          >
            All Stacks
          </Button>
          {allTechnologies.map((tech) => (
            <Button
              key={tech}
              variant={selectedTech === tech ? "default" : "outline"}
              size="sm"
              onClick={() => handleTechClick(tech === selectedTech ? null : tech)}
              data-umami-event="project-filter-tech-click"
              data-umami-event-tech={tech}
              className={cn(
                "rounded-full px-3.5 h-8 text-xs font-medium group transition-all duration-200",
                selectedTech === tech
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "border-white/[0.1] bg-white/[0.03] text-gray-300 hover:bg-primary/10 hover:text-white hover:border-primary/40"
              )}
            >
              <span>{tech}</span>
              {selectedTech === tech && <X size={12} className="ml-1.5 text-white" />}
            </Button>
          ))}
        </div>
      </div>
    </SpotlightCard>
  );
};

export default ProjectFilters;
