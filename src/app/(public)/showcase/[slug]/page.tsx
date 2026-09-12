import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectFinderService } from "@/services/project-finder";
import type { ProjectProspect } from "@/services/project-finder/types";
import { ShowcaseView } from "./showcase-view";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const prospects = await projectFinderService.getAll();
    const staticSlugs = prospects.map((p) => ({
      slug: p.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    }));
    return staticSlugs.length > 0 ? staticSlugs : [{ slug: "maxaro" }];
  } catch {
    return [{ slug: "maxaro" }];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const prospect = await projectFinderService.getBySlug(slug);
  const companyName = prospect?.companyName || (slug.toLowerCase().includes("maxaro") ? "Maxaro" : "Client");

  return {
    title: `${companyName} Storefront Modernization Concept | Wisman Nur`,
    description: `Tailored Nuxt 4 SSR & Core Web Vitals modernization architecture proposal for ${companyName}.`,
    openGraph: {
      title: `${companyName} Storefront Modernization | Nuxt 4 Architecture`,
      description: `Tailored Nuxt 4 SSR & Core Web Vitals modernization architecture proposal for ${companyName}.`,
    },
    robots: {
      index: false, // Keep client pitch decks private and unindexed
      follow: false,
    },
  };
}

const FALLBACK_MAXARO_PROSPECT: ProjectProspect = {
  id: "prospect-maxaro-nl",
  companyName: "Maxaro",
  companyWebsite: "https://www.maxaro.nl",
  industry: "home_living",
  country: "Netherlands",
  city: "Roosendaal",
  timezone: "Europe/Amsterdam",
  status: "pitch_ready",
  estimatedRevenueTier: "€40M - €60M",
  auditScore: 88,
  auditAnalysis: {
    performanceScore: 46,
    mobileFrictionScore: 76,
    modernizationOpportunityScore: 88,
    detectedStack: [
      "Legacy E-Commerce Monolith",
      "jQuery UI",
      "Heavy Client Asset Bundles",
      "Traditional Multi-Step Server Render",
    ],
    coreWebVitalIssues: [
      "LCP 4.2s on mobile 4G due to unoptimized hero banner assets",
      "Noticeable Cumulative Layout Shift (CLS 0.28) during interactive filter drawer expansions",
      "Interaction to Next Paint (INP) latency on category faceted search",
    ],
    mobileUxPainPoints: [
      "Laggy filter drawer expansion with full-page reflow on mobile screens",
      "No optimistic add-to-cart state causing user uncertainty",
      "Heavy multi-step checkout with friction on smartphone inputs",
    ],
    recommendedModernization: [
      "Nuxt 4 SSR + Nitro Edge Caching on Cloudflare/Vercel",
      "Tailwind CSS + Headless UI for zero-runtime CSS overhead",
      "Pinia optimistic cart state with instant drawer slide-over",
      "Automated WebP/AVIF asset optimization pipeline",
    ],
    modernizationPitchSummary:
      "Maxaro commands exceptional consumer trust (4.6 Trustpilot across 34k+ reviews), but mobile storefront latency creates a significant conversion bottleneck. Modernizing into a sub-second Nuxt 4 storefront can lift mobile sales by up to 24%.",
    estimatedConversionLift: "+18% to +24% Mobile Checkout Completion",
    executiveSummary:
      "Maxaro represents an exemplary transformation candidate: established industry leader, high-consideration bathroom & tile catalog, stellar customer reputation, yet constrained by aging monolithic web frontend architecture.",
  },
  mvpDemoUrl: "https://wismannur.pro/showcase/maxaro",
  loomVideoUrl: "https://www.loom.com/share/maxaro-nuxt4-modernization-demo",
  contactName: "Lennard Bakhuys",
  contactRole: "Projectmanager E-commerce",
  contactEmail: "l.bakhuys@maxaro.nl",
  contactLinkedin: "https://www.linkedin.com/in/lennard-bakhuys/",
  sortOrder: 1,
  createdAt: new Date("2026-09-10T07:10:00Z"),
  updatedAt: new Date("2026-09-10T07:10:00Z"),
};

import { getCachedSiteSettings } from "@/lib/site-metadata";

export default async function ShowcasePage({ params }: Params) {
  const [{ slug }, siteSettings] = await Promise.all([
    params,
    getCachedSiteSettings(),
  ]);

  let prospect = await projectFinderService.getBySlug(slug);

  if (!prospect) {
    if (slug.toLowerCase() === "maxaro" || slug.toLowerCase().includes("maxaro")) {
      prospect = FALLBACK_MAXARO_PROSPECT;
    } else {
      notFound();
    }
  }

  return (
    <ShowcaseView
      prospect={prospect}
      publicEmail={siteSettings.publicEmail}
      linkedinUrl={siteSettings.social?.linkedin}
    />
  );
}
