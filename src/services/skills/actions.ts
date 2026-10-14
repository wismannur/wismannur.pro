"use server";

import { cmsFetch } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type Skill,
} from "@wismannur/cms-contracts";

export async function getPublished(): Promise<Skill[]> {
  try {
    return await cmsFetch<Skill[]>(CMS_API_ENDPOINTS.SKILLS, {
      tags: [CMS_CACHE_TAGS.SKILLS],
      revalidate: 86400,
    });
  } catch (e) {
    console.error("[skills] getPublished error:", e);
    return [];
  }
}
