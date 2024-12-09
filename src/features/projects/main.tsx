"use client";

import PageHeader from "@/components/page-header";
import FeaturedProject from "./featured-project";

export default function OngoingProjects() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <>
      <PageHeader
        title="Curated Projects"
        description="Showcase of my projects that I'm proud of."
      />

      <div className="w-full flex flex-col">
        <div className="container mx-auto">
          {/* featured project */}
          <FeaturedProject />

          {/* ongoing projects */}

          {/* other projects */}
        </div>
      </div>

      <br />
      <br />
      <br />
      <br />
      <br />
    </>
  );
}
