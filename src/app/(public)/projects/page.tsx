import type { Metadata } from "next";

import { getCachedSiteSettings } from "@/lib/site-metadata";
import { pageCopyService } from "@/services";
import { ProjectsView } from "./projects-view";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await pageCopyService.get("projects");
  return {
    title: copy?.meta.title ?? "Projects",
    description: copy?.meta.description,
  };
}

export default async function ProjectsPage() {
  const [copy, settings] = await Promise.all([
    pageCopyService.get("projects"),
    getCachedSiteSettings(),
  ]);

  return <ProjectsView copy={copy} settings={settings} />;
}
