import type { Metadata } from "next";

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
	const [copy, services] = await Promise.all([
		pageCopyService.get("home"),
		serviceCatalogService.getPublished(),
	]);

	return <HomeView copy={copy} services={services.filter((service) => service.showOnHome)} />;
}
