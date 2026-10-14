import type { MetadataRoute } from "next";

import { SITE_URL as BASE_URL } from "@/lib/site-url";
import { blogService, projectService, siteSettingsService } from "@/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const settings = await siteSettingsService.get();
  const enableBlog = settings.enableBlog;

  const staticPaths = [
    "",
    ...(enableBlog ? ["/blog"] : []),
    "/projects",
    "/about",
    "/cv",
    "/services",
    "/contact",
    "/hire-me",
    "/terms-of-service",
    "/privacy-policy",
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const [blogRows, projectRows] = await Promise.all([
    enableBlog ? blogService.getAll() : Promise.resolve([]),
    projectService.getAll(),
  ]);

  const blogRoutes: MetadataRoute.Sitemap = blogRows.map((b) => ({
    url: `${BASE_URL}/blog/${b.slug}`,
    lastModified: b.updatedAt ? new Date(b.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projectRows.map((p) => ({
    url: `${BASE_URL}/projects/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes, ...projectRoutes];
}
