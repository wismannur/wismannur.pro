import type { Metadata } from "next";

import { getCachedSiteSettings } from "@/lib/site-metadata";
import {
  faqsService,
  pageCopyService,
  processStepsService,
  serviceCatalogService,
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
    getCachedSiteSettings(),
  ]);

  return (
    <ServicesView
      copy={copy}
      services={services}
      faqs={faqs}
      processSteps={processSteps}
      timeframes={settings.requestTimeframes}
      budgetRanges={settings.requestBudgetRanges}
      settings={settings}
    />
  );
}
