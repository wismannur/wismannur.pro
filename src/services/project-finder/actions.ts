"use server";

import { cmsFetch } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type ProjectProspect,
} from "@wismannur.pro/cms-contracts";

export async function getAll(): Promise<ProjectProspect[]> {
  try {
    return await cmsFetch<ProjectProspect[]>(CMS_API_ENDPOINTS.SHOWCASE, {
      tags: [CMS_CACHE_TAGS.SHOWCASE_ALL],
    });
  } catch (error) {
    console.error("[project-finder] Failed to fetch prospects:", error);
    return [];
  }
}

export async function getBySlug(slug: string): Promise<ProjectProspect | null> {
  try {
    return await cmsFetch<ProjectProspect | null>(CMS_API_ENDPOINTS.SHOWCASE_DETAIL(slug), {
      tags: [CMS_CACHE_TAGS.SHOWCASE_DETAIL(slug)],
    });
  } catch (error) {
    console.error(`[project-finder] Failed to fetch prospect '${slug}':`, error);
    return null;
  }
}
