import React from "react";
import { SectionHeader } from "@/components/ui/section-header";

type BlogHeaderProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

const BlogHeader = ({ eyebrow, title, description }: BlogHeaderProps) => {
  return (
    <SectionHeader
      subtitle={eyebrow || "TECHNICAL WRITING • PRODUCTION NOTES"}
      title={title || "Architectural **Essays** & Engineering Insights."}
      description={
        description ||
        "In-depth write-ups on scaling modern web platforms, autonomous AI agent workflows with Gemini 3.8 & MCP, and hard-earned engineering lessons from 7+ years in production."
      }
      className="text-center mb-10 md:mb-12"
    />
  );
};

export default BlogHeader;
