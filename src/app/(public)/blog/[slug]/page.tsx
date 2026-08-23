import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { getCachedSiteSettings } from "@/lib/site-metadata";
import { blogService, siteSettingsService } from "@/services";
import { BlogDetailView } from "./blog-detail-view";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
	const settings = await siteSettingsService.get();
	if (!settings.enableBlog) {
		return [];
	}
	const rows = await getDb()
		.select({ slug: schema.blogs.slug })
		.from(schema.blogs)
		.where(eq(schema.blogs.isPublished, true));
	return rows;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const [settings, { slug }] = await Promise.all([
		getCachedSiteSettings(),
		params,
	]);
	if (!settings.enableBlog) return { title: "Article not found" };

	const blog = await blogService.getBySlug(slug);
	if (!blog) return { title: "Article not found" };
	return {
		title: blog.title,
		description: blog.summary,
		openGraph: {
			title: blog.title,
			description: blog.summary,
			images: [blog.image],
			type: "article",
		},
		twitter: {
			card: "summary_large_image",
			title: blog.title,
			description: blog.summary,
			images: [blog.image],
		},
	};
}

export default async function BlogDetailPage({ params }: Params) {
	const [settings, { slug }] = await Promise.all([
		getCachedSiteSettings(),
		params,
	]);
	if (!settings.enableBlog) notFound();

	const blog = await blogService.getBySlug(slug);
	if (!blog) notFound();
	return <BlogDetailView slug={slug} />;
}
