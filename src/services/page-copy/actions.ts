"use server";

import { cmsFetch } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type CtaData,
  type PageCopyContent,
  type PageCopyMap,
  type PageKey,
} from "@wismannur/cms-contracts";

export async function getPageCopy<K extends PageKey>(page: K): Promise<PageCopyMap[K] | null> {
  try {
    return await cmsFetch<PageCopyMap[K]>(`${CMS_API_ENDPOINTS.PAGE_COPY}?page=${page}`, {
      tags: [CMS_CACHE_TAGS.PAGE_COPY(page)],
      revalidate: 86400,
    });
  } catch (e) {
    console.error(`[page-copy] Error fetching page copy for ${page}:`, e);
    return null;
  }
}

export async function getCtaForPage(page: PageKey): Promise<CtaData | null> {
  try {
    const content = (await getPageCopy(page)) as { cta?: CtaData } | null;
    if (content?.cta) return content.cta;
    const fallback = await getPageCopy("default");
    return fallback?.cta ?? null;
  } catch (e) {
    console.error(`[page-copy] Error fetching CTA for ${page}:`, e);
    return null;
  }
}
