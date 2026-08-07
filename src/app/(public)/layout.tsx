import type React from "react";

import { Layout } from "@/components/layout/layout";
import { getCachedSiteSettings } from "@/lib/site-metadata";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
	// Footer/navbar contact info, social links, and copyright are CMS-managed
	// (site_settings) — every settings save revalidates the whole layout.
	const settings = await getCachedSiteSettings();

	return <Layout settings={settings}>{children}</Layout>;
}
