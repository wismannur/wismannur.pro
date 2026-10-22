"use server";

import { cmsFetch } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type ResumeEntry,
} from "@wismannur.pro/cms-contracts";

export async function getPublished(): Promise<{
  experiences: ResumeEntry[];
  education: ResumeEntry[];
}> {
  try {
    return await cmsFetch<{
      experiences: ResumeEntry[];
      education: ResumeEntry[];
    }>(CMS_API_ENDPOINTS.RESUME, {
      tags: [CMS_CACHE_TAGS.RESUME],
      revalidate: 86400,
    });
  } catch (e) {
    console.error("[resume] getPublished error:", e);
    return { experiences: [], education: [] };
  }
}
