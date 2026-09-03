"use client";

import React from "react";
import type { HomeCopy } from "@/services/page-copy/types";
import type { ServiceItem } from "@/services/service-catalog/types";
import type { SiteSettings } from "@/services/site-settings/types";
import { HeroV2 } from "@/components/home-v2/hero-v2";
import { CredibilityStrip } from "@/components/home-v2/credibility-strip";
import { ExpertiseBentoV2 } from "@/components/home-v2/expertise-bento-v2";
import { FeaturedProjectsV2 } from "@/components/home-v2/featured-projects-v2";
import { SolutionsServicesV2 } from "@/components/home-v2/solutions-services-v2";
import { RecruiterFastTrack } from "@/components/home-v2/recruiter-fast-track";
import { LatestInsightsV2 } from "@/components/home-v2/latest-insights-v2";
import { CtaV2 } from "@/components/home-v2/cta-v2";

type HomeViewProps = {
  copy: HomeCopy | null;
  services: ServiceItem[];
  enableBlog?: boolean;
  settings?: SiteSettings;
};

export function HomeView({ copy, services, enableBlog = true, settings }: HomeViewProps) {
  return (
    <div className="flex flex-col gap-14 md:gap-20 pb-12">
      {/* 1. Hero Section with Centered Showcase & Interactive Console */}
      <HeroV2 eyebrow={copy?.hero.eyebrow} title={copy?.hero.title} bio={copy?.hero.bio} />

      {/* 2. Credibility & High-Signal Trust Strip */}
      <CredibilityStrip />

      {/* 3. Architectural Pillars & Tech Stack Bento */}
      <ExpertiseBentoV2 />

      {/* 4. Selected Works & Case Studies (Auto-hidden if 0 projects in DB) */}
      <FeaturedProjectsV2
        title={copy?.sections.projects.title}
        subtitle={copy?.sections.projects.subtitle}
        description={copy?.sections.projects.description}
      />

      {/* 5. Specialized Engineering Solutions & Consulting */}
      <SolutionsServicesV2
        services={services}
        title={copy?.sections.services.title}
        subtitle={copy?.sections.services.subtitle}
        description={copy?.sections.services.description}
      />

      {/* 6. Recruiter & Hiring Fast-Track */}
      <RecruiterFastTrack settings={settings} />

      {/* 7. Technical Insights & Architecture Blog */}
      {enableBlog && (
        <LatestInsightsV2
          title={copy?.sections.blog.title}
          subtitle={copy?.sections.blog.subtitle}
          description={copy?.sections.blog.description}
        />
      )}

      {/* 8. Conversion Closing CTA with Direct Connect Card */}
      <CtaV2 settings={settings} />
    </div>
  );
}
