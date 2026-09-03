"use server";

import { revalidatePath } from "next/cache";

import { eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { ServiceError } from "../core/base-service";
import type { CtaData, PageCopyContent, PageCopyEntry, PageCopyMap, PageKey } from "./types";

// Server actions backing `pageCopyService` — one typed jsonb blob per page
// (hero copy, section headers, per-page meta, CTA variant). Reads are public;
// updates are admin-only. Shapes are enforced by the TS contracts in
// ./types.ts (the CMS forms are typed per page), not by SQL.

const { pageCopy } = schema;

const pagePath: Record<PageKey, string> = {
  home: "/",
  about: "/about",
  services: "/services",
  "hire-me": "/hire-me",
  offers: "/offers",
  blog: "/blog",
  projects: "/projects",
  contact: "/contact",
  "not-found": "/",
  default: "/",
};

export async function getPageCopy<K extends PageKey>(page: K): Promise<PageCopyMap[K] | null> {
  try {
    const [row] = await getDb().select().from(pageCopy).where(eq(pageCopy.page, page)).limit(1);
    return row ? (row.content as PageCopyMap[K]) : null;
  } catch (e) {
    console.error(`[page-copy] Error fetching page copy for ${page}:`, e);
    return null;
  }
}

// The CTA block for a page, falling back to the `default` row's variant —
// replaces the old hardcoded map in src/lib/get-cta-data-for-page.ts.
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

export async function getAllForCms(): Promise<PageCopyEntry[]> {
  await assertAdmin();
  const rows = await getDb().select().from(pageCopy).orderBy(pageCopy.page);
  return rows.map((row) => ({
    page: row.page,
    content: row.content,
    updatedAt: row.updatedAt,
  }));
}

export async function updatePageCopy(page: PageKey, content: PageCopyContent): Promise<void> {
  await assertAdmin();
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new ServiceError("Validation failed", "invalid-input");
  }
  await getDb()
    .insert(pageCopy)
    .values({ page, content })
    .onConflictDoUpdate({
      target: pageCopy.page,
      set: { content, updatedAt: new Date() },
    });
  revalidatePath(pagePath[page]);
  // The `default` CTA can surface on any page.
  if (page === "default") revalidatePath("/", "layout");
}
