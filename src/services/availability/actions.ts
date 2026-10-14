"use server";

import { cmsFetch } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type AvailabilitySlot,
} from "@wismannur.pro/cms-contracts";

export async function getPublished(): Promise<AvailabilitySlot[]> {
  try {
    return await cmsFetch<AvailabilitySlot[]>(CMS_API_ENDPOINTS.AVAILABILITY, {
      tags: [CMS_CACHE_TAGS.AVAILABILITY],
      revalidate: 86400,
    });
  } catch (e) {
    console.error("[availability] getPublished error:", e);
    return [];
  }
}
