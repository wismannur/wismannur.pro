"use server";

import { cmsFetch } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type Faq,
} from "@wismannur.pro/cms-contracts";

export async function getPublished(): Promise<Faq[]> {
  try {
    return await cmsFetch<Faq[]>(CMS_API_ENDPOINTS.FAQS, {
      tags: [CMS_CACHE_TAGS.FAQS],
      revalidate: 86400,
    });
  } catch (e) {
    console.error("[faqs] getPublished error:", e);
    return [];
  }
}
