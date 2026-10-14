"use server";

import { cmsFetch } from "@/lib/cms-client";
import { CMS_API_ENDPOINTS, CMS_CACHE_TAGS, type SiteSettings } from "@wismannur/cms-contracts";
import { DEFAULT_SITE_SETTINGS } from "./defaults";

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    return await cmsFetch<SiteSettings>(CMS_API_ENDPOINTS.SETTINGS, {
      tags: [CMS_CACHE_TAGS.SETTINGS],
      revalidate: 86400,
    });
  } catch (error) {
    console.warn("[site-settings] Falling back to default settings:", error);
    return DEFAULT_SITE_SETTINGS as unknown as SiteSettings;
  }
}
