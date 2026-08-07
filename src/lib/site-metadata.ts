import "server-only";

import { cache } from "react";

import { siteSettingsService } from "@/services";
import type { SiteSettings } from "@/services/site-settings/types";

// One settings read per request, shared by generateMetadata/generateViewport,
// the OG image, and the public layout (React deduplicates the call).
// getSiteSettings itself falls back to the seeded defaults on any DB error,
// so a database blip degrades metadata instead of failing the render.
export const getCachedSiteSettings = cache(
	(): Promise<SiteSettings> => siteSettingsService.get(),
);
