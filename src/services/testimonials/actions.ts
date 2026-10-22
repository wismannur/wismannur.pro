"use server";

import { cmsFetch } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type Testimonial,
} from "@wismannur.pro/cms-contracts";

export async function getPublished(): Promise<Testimonial[]> {
  try {
    return await cmsFetch<Testimonial[]>(CMS_API_ENDPOINTS.TESTIMONIALS, {
      tags: [CMS_CACHE_TAGS.TESTIMONIALS],
      revalidate: 86400,
    });
  } catch (e) {
    console.error("[testimonials] getPublished error:", e);
    return [];
  }
}
