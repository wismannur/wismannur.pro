"use server";

import { cmsFetch } from "@/lib/cms-client";
import { CMS_API_ENDPOINTS, CMS_CACHE_TAGS, type SitePage } from "@wismannur.pro/cms-contracts";

export async function getBySlug(slug: string): Promise<SitePage | null> {
  try {
    return await cmsFetch<SitePage | null>(CMS_API_ENDPOINTS.SITE_PAGES(slug), {
      tags: [CMS_CACHE_TAGS.SITE_PAGE(slug)],
    });
  } catch (error) {
    console.error(`[site-pages] Failed to fetch page '${slug}':`, error);
    return null;
  }
}
