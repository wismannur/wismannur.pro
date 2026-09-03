import type { Metadata } from "next";

import { getCachedSiteSettings } from "@/lib/site-metadata";
import { pageCopyService } from "@/services";
import { ContactView } from "./contact-view";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await pageCopyService.get("contact");
  return {
    title: copy?.meta.title ?? "Contact",
    description: copy?.meta.description,
  };
}

export default async function ContactPage() {
  const [copy, settings] = await Promise.all([
    pageCopyService.get("contact"),
    getCachedSiteSettings(),
  ]);

  return <ContactView copy={copy} settings={settings} />;
}
