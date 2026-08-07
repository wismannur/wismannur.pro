import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

import { getDb, schema } from "@/db";
import { SITE_URL as BASE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const now = new Date();

	const staticPaths = [
		"",
		"/blog",
		"/projects",
		"/about",
		"/services",
		"/offers",
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

	const db = getDb();
	const [blogRows, projectRows] = await Promise.all([
		db
			.select({ slug: schema.blogs.slug, updatedAt: schema.blogs.updatedAt })
			.from(schema.blogs)
			.where(eq(schema.blogs.isPublished, true)),
		db
			.select({ slug: schema.projects.slug, updatedAt: schema.projects.updatedAt })
			.from(schema.projects)
			.where(eq(schema.projects.isPublished, true)),
	]);

	const blogRoutes: MetadataRoute.Sitemap = blogRows.map((b) => ({
		url: `${BASE_URL}/blog/${b.slug}`,
		lastModified: b.updatedAt,
		changeFrequency: "monthly",
		priority: 0.6,
	}));

	const projectRoutes: MetadataRoute.Sitemap = projectRows.map((p) => ({
		url: `${BASE_URL}/projects/${p.slug}`,
		lastModified: p.updatedAt,
		changeFrequency: "monthly",
		priority: 0.6,
	}));

	return [...staticRoutes, ...blogRoutes, ...projectRoutes];
}
