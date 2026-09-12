import type { Metadata } from "next";
import { getCachedSiteSettings } from "@/lib/site-metadata";
import { pageCopyService, resumeService, skillsService } from "@/services";
import { AboutView } from "./about-view";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await pageCopyService.get("about");
  return {
    title: copy?.meta.title ?? "About",
    description: copy?.meta.description,
  };
}

export default async function AboutPage() {
  // Resume, skills, and page copy are all CMS-managed; every mutation there
  // revalidates this path.
  const [{ experiences, education }, skills, copy, settings] = await Promise.all([
    resumeService.getPublished(),
    skillsService.getPublished(),
    pageCopyService.get("about"),
    getCachedSiteSettings(),
  ]);

  return (
    <AboutView
      experiences={experiences}
      education={education}
      skills={skills}
      copy={copy}
      settings={settings}
    />
  );
}
