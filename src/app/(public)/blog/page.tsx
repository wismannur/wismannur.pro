import type { Metadata } from "next";

import { pageCopyService } from "@/services";
import { BlogView } from "./blog-view";

export async function generateMetadata(): Promise<Metadata> {
	const copy = await pageCopyService.get("blog");
	return {
		title: copy?.meta.title ?? "Blog",
		description: copy?.meta.description,
	};
}

export default async function BlogPage() {
	const copy = await pageCopyService.get("blog");
	return <BlogView copy={copy} />;
}
