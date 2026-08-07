"use server";

import { revalidatePath } from "next/cache";

import { and, asc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type { NewSitePage, SitePage, UpdateSitePage } from "./types";

// Server actions backing `sitePagesService` — the MDX legal pages
// (/privacy-policy, /terms-of-service).

const { sitePages } = schema;

function revalidateSitePagePaths(slug?: string) {
	if (slug) revalidatePath(`/${slug}`);
}

// Public read — published only, by route slug.
export async function getBySlug(slug: string): Promise<SitePage | null> {
	const [row] = await getDb()
		.select()
		.from(sitePages)
		.where(and(eq(sitePages.slug, slug), eq(sitePages.isPublished, true)))
		.limit(1);
	return row ?? null;
}

export async function getById(id: string): Promise<SitePage | null> {
	await assertAdmin();
	const [row] = await getDb().select().from(sitePages).where(eq(sitePages.id, id)).limit(1);
	return row ?? null;
}

export async function create(page: NewSitePage): Promise<string> {
	await assertAdmin();
	const [{ id }] = await getDb().insert(sitePages).values(page).returning({ id: sitePages.id });
	revalidateSitePagePaths(page.slug);
	return id;
}

export async function update(id: string, page: UpdateSitePage): Promise<void> {
	await assertAdmin();
	const db = getDb();
	const [current] = await db.select().from(sitePages).where(eq(sitePages.id, id)).limit(1);
	await db
		.update(sitePages)
		.set({ ...page, updatedAt: new Date() })
		.where(eq(sitePages.id, id));
	// Revalidate the old slug too in case it was renamed.
	revalidateSitePagePaths(current?.slug);
	if (page.slug && page.slug !== current?.slug) revalidateSitePagePaths(page.slug);
}

export async function deleteSitePage(id: string): Promise<void> {
	await assertAdmin();
	const db = getDb();
	const [current] = await db.select().from(sitePages).where(eq(sitePages.id, id)).limit(1);
	await db.delete(sitePages).where(eq(sitePages.id, id));
	revalidateSitePagePaths(current?.slug);
}

export async function getAllForCms(): Promise<SitePage[]> {
	await assertAdmin();
	return getDb().select().from(sitePages).orderBy(asc(sitePages.title));
}
