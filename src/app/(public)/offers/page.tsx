import type { Metadata } from "next";

import { offersService, pageCopyService } from "@/services";
import { OffersView } from "./offers-view";

export async function generateMetadata(): Promise<Metadata> {
	const copy = await pageCopyService.get("offers");
	return {
		title: copy?.meta.title ?? "Service Offers",
		description: copy?.meta.description,
	};
}

export default async function OffersPage() {
	const [copy, offers] = await Promise.all([
		pageCopyService.get("offers"),
		offersService.getPublished(),
	]);

	return <OffersView copy={copy} offers={offers} />;
}
