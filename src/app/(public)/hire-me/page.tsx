import type { Metadata } from "next";

import {
	availabilityService,
	faqsService,
	pageCopyService,
	pricingTiersService,
	processStepsService,
	serviceCatalogService,
	siteSettingsService,
	testimonialsService,
} from "@/services";
import { HireMeView } from "./hire-me-view";

export async function generateMetadata(): Promise<Metadata> {
	const copy = await pageCopyService.get("hire-me");
	return {
		title: copy?.meta.title ?? "Hire Me",
		description: copy?.meta.description,
	};
}

export default async function HireMePage() {
	const [copy, pricingTiers, services, testimonials, processSteps, faqs, availabilitySlots, settings] =
		await Promise.all([
			pageCopyService.get("hire-me"),
			pricingTiersService.getPublished(),
			serviceCatalogService.getPublished(),
			testimonialsService.getPublished(),
			processStepsService.getPublished("hire-me"),
			faqsService.getPublished(),
			availabilityService.getPublished(),
			siteSettingsService.get(),
		]);

	return (
		<HireMeView
			copy={copy}
			pricingTiers={pricingTiers}
			expertiseAreas={services.filter((service) => service.showOnHireMe)}
			testimonials={testimonials}
			processSteps={processSteps}
			faqs={faqs}
			availabilitySlots={availabilitySlots}
			timeframes={settings.requestTimeframes}
			budgetRanges={settings.requestBudgetRanges}
		/>
	);
}
