import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCachedSiteSettings } from "@/lib/site-metadata";
import { pageCopyService } from "@/services";
import { BlogView } from "./blog-view";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getCachedSiteSettings();
	if (!settings.enableBlog) {
		return {
			title: "Page Not Found",
		};
	}
	const copy = await pageCopyService.get("blog");
	return {
		title: copy?.meta.title ?? "Blog",
		description: copy?.meta.description,
	};
}

export default async function BlogPage() {
	const settings = await getCachedSiteSettings();
	if (!settings.enableBlog) {
		notFound();
	}
	const copy = await pageCopyService.get("blog");
	return <BlogView copy={copy} />;
}
