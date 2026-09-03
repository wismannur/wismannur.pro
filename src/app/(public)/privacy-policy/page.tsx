import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePageView } from "@/components/site-pages/site-page-view";
import { sitePagesService } from "@/services";

const SLUG = "privacy-policy";

// Content is CMS-managed MDX (site_pages); updatedAt doubles as the public
// "Last updated" date. Saves in /cms/legal revalidate this path.
export async function generateMetadata(): Promise<Metadata> {
  const page = await sitePagesService.getBySlug(SLUG);
  return {
    title: page?.title ?? "Privacy Policy",
    description:
      "Privacy Policy explaining how Wisman Nur collects, uses, discloses, and safeguards your information when you visit the website or use the services.",
  };
}

export default async function PrivacyPolicyPage() {
  const page = await sitePagesService.getBySlug(SLUG);
  if (!page) notFound();

  return (
    <SitePageView
      title={page.title}
      lastUpdatedLabel={page.updatedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      content={page.content}
      icon="shield"
    />
  );
}
