import type { Metadata } from "next";

import { getCachedSiteSettings } from "@/lib/site-metadata";
import {
  blogService,
  pageCopyService,
  projectService,
  serviceCatalogService,
} from "@/services";
import { HomeView } from "./home-view";

// Hero copy, section headers, the services grid, projects, and the CTA are all
// CMS-managed; the relevant mutations revalidate "/".
export async function generateMetadata(): Promise<Metadata> {
  const copy = await pageCopyService.get("home");
  return {
    title: copy?.meta.title ?? "Home",
    description: copy?.meta.description,
  };
}

export default async function HomePage() {
  const settings = await getCachedSiteSettings();
  const [copy, services, projects, blogs] = await Promise.all([
    pageCopyService.get("home"),
    serviceCatalogService.getPublished(),
    projectService.getLatest(4),
    settings.enableBlog ? blogService.getLatest(3) : Promise.resolve([]),
  ]);

  return (
    <HomeView
      copy={copy}
      services={services.filter((service) => service.showOnHome)}
      projects={projects}
      blogs={blogs}
      enableBlog={settings.enableBlog}
      settings={settings}
    />
  );
}
