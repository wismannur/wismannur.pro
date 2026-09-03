import type { Metadata } from "next";

import { getCachedSiteSettings } from "@/lib/site-metadata";
import { availabilityService, faqsService, pageCopyService } from "@/services";
import { HireMeView } from "./hire-me-view";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await pageCopyService.get("hire-me");
  return {
    title: copy?.meta.title ?? "Hire Me",
    description: copy?.meta.description,
  };
}

export default async function HireMePage() {
  const [copy, faqs, availabilitySlots, settings] = await Promise.all([
    pageCopyService.get("hire-me"),
    faqsService.getPublished(),
    availabilityService.getPublished(),
    getCachedSiteSettings(),
  ]);

  return (
    <HireMeView copy={copy} faqs={faqs} availabilitySlots={availabilitySlots} settings={settings} />
  );
}
