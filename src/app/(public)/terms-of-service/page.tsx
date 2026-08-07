import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePageView } from "@/components/site-pages/site-page-view";
import { sitePagesService } from "@/services";

const SLUG = "terms-of-service";

// Content is CMS-managed MDX (site_pages); updatedAt doubles as the public
// "Last updated" date. Saves in /cms/legal revalidate this path.
export async function generateMetadata(): Promise<Metadata> {
	const page = await sitePagesService.getBySlug(SLUG);
	return {
		title: page?.title ?? "Terms of Service",
		description:
			"Terms of Service governing the use of Wisman Nur's website and professional web development services.",
	};
}

export default async function TermsOfServicePage() {
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
			icon="file-text"
		/>
	);
}
