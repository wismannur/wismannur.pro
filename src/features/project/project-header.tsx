import React from "react";
import { SectionHeader } from "@/components/ui/section-header";

type ProjectHeaderProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

const ProjectHeader = ({ eyebrow, title, description }: ProjectHeaderProps) => {
  return (
    <SectionHeader
      subtitle={eyebrow || "FEATURED WORK • PRODUCTION CASE STUDIES"}
      title={title || "Architectural **Case Studies** & Production Platforms."}
      description={
        description ||
        "A curated collection of scalable web applications, autonomous AI agent workflows, and open-source infrastructure built for performance and maintainability."
      }
      className="text-center mb-12 md:mb-16"
    />
  );
};

export default ProjectHeader;
