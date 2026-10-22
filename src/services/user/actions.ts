"use server";

import { cmsFetch } from "@/lib/cms-client";
import { CMS_API_ENDPOINTS, CMS_CACHE_TAGS } from "@wismannur.pro/cms-contracts";
import type { UserProfile } from "./types";

export async function getAuthorProfile(): Promise<UserProfile | null> {
  try {
    const res = await cmsFetch<{ user: UserProfile | null }>(CMS_API_ENDPOINTS.CV, {
      tags: [CMS_CACHE_TAGS.CV],
      revalidate: 86400,
    });
    return res.user;
  } catch (err) {
    console.error("[userService] getAuthorProfile error:", err);
    return null;
  }
}
