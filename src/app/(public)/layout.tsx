import type React from "react";

import { LayoutV2 } from "@/components/layout-v2/layout-v2";
import { getCachedSiteSettings } from "@/lib/site-metadata";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Footer/navbar contact info, social links, and copyright are CMS-managed
  // (site_settings) — every settings save revalidates the whole layout.
  const settings = await getCachedSiteSettings();

  return <LayoutV2 settings={settings}>{children}</LayoutV2>;
}
