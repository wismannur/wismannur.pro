import type { Metadata } from "next";

import {
	faqsService,
	pageCopyService,
	processStepsService,
	serviceCatalogService,
	siteSettingsService,
} from "@/services";
import { ServicesView } from "./services-view";

export async function generateMetadata(): Promise<Metadata> {
	const copy = await pageCopyService.get("services");
	return {
		title: copy?.meta.title ?? "Services",
		description: copy?.meta.description,
	};
}

export default async function ServicesPage() {
	const [copy, services, faqs, processSteps, settings] = await Promise.all([
		pageCopyService.get("services"),
		serviceCatalogService.getPublished(),
		faqsService.getPublished(),
		processStepsService.getPublished("services"),
		siteSettingsService.get(),
	]);

	return (
		<ServicesView
			copy={copy}
			services={services}
			faqs={faqs}
			processSteps={processSteps}
			timeframes={settings.requestTimeframes}
			budgetRanges={settings.requestBudgetRanges}
		/>
	);
}
