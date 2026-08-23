import type { Metadata } from "next";

import { getCachedSiteSettings } from "@/lib/site-metadata";
import { pageCopyService, serviceCatalogService } from "@/services";
import { HomeView } from "./home-view";

// Hero copy, section headers, the services grid, and the CTA are all
// CMS-managed; the relevant mutations revalidate "/".
export async function generateMetadata(): Promise<Metadata> {
	const copy = await pageCopyService.get("home");
	return {
		title: copy?.meta.title ?? "Home",
		description: copy?.meta.description,
	};
}

export default async function HomePage() {
	const [copy, services, settings] = await Promise.all([
		pageCopyService.get("home"),
		serviceCatalogService.getPublished(),
		getCachedSiteSettings(),
	]);

	return (
		<HomeView
			copy={copy}
			services={services.filter((service) => service.showOnHome)}
			enableBlog={settings.enableBlog}
		/>
	);
}
