"use server";

import { cmsFetch } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type ServiceItem,
} from "@wismannur.pro/cms-contracts";

export async function getPublished(): Promise<ServiceItem[]> {
  try {
    return await cmsFetch<ServiceItem[]>(CMS_API_ENDPOINTS.SERVICES, {
      tags: [CMS_CACHE_TAGS.SERVICES_ALL],
      revalidate: 86400,
    });
  } catch (e) {
    console.error("[service-catalog] getPublished error:", e);
    return [];
  }
}

export async function getBySlug(slug: string): Promise<ServiceItem | null> {
  try {
    return await cmsFetch<ServiceItem>(CMS_API_ENDPOINTS.SERVICE_DETAIL(slug), {
      tags: [CMS_CACHE_TAGS.SERVICE_DETAIL(slug)],
      revalidate: 86400,
    });
  } catch (e) {
    console.error(`[service-catalog] getBySlug error for '${slug}':`, e);
    return null;
  }
}
