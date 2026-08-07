"use server";

import { revalidatePath } from "next/cache";

import { desc, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { countRows, descNullsLast } from "@/db/sort";
import type { Blog, NewBlog, UpdateBlog } from "./types";

// Server actions backing `blogService` — same method surface as the legacy
// Firestore service, implemented on Drizzle/Neon. Server components call these
// directly; client components go through the generated RPC endpoint.
// Admin-only actions (getAll/create/update/delete/getAllForCms) are gated by
// assertAdmin() — server actions are public POST endpoints otherwise.

const { blogs } = schema;

// `/blog/[slug]` is SSG (generateStaticParams) and the sitemap reads the DB at
// build time — every CMS mutation must invalidate them or published edits only
// appear after a redeploy. Pass both old and new slug when an update renames.
function revalidateBlogPaths(...slugs: Array<string | null | undefined>) {
	for (const slug of new Set(slugs.filter(Boolean))) {
		revalidatePath(`/blog/${slug}`);
	}
	revalidatePath("/sitemap.xml");
}

export async function getByPage(
	page: number,
	pageSize: number,
): Promise<{ blogs: Blog[]; totalPages: number; currentPage: number }> {
	const db = getDb();
	const [rows, [{ count }]] = await Promise.all([
		db
			.select()
			.from(blogs)
			.where(eq(blogs.isPublished, true))
			.orderBy(descNullsLast(blogs.publishedDate))
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db.select({ count: countRows }).from(blogs).where(eq(blogs.isPublished, true)),
	]);
	return {
		blogs: rows,
		totalPages: Math.max(1, Math.ceil(count / pageSize)),
		currentPage: page,
	};
}

export async function getAll(): Promise<Blog[]> {
	await assertAdmin();
	return getDb().select().from(blogs).orderBy(descNullsLast(blogs.publishedDate));
}

export async function getLatest(count = 3): Promise<Blog[]> {
	return getDb()
		.select()
		.from(blogs)
		.where(eq(blogs.isPublished, true))
		.orderBy(descNullsLast(blogs.publishedDate))
		.limit(count);
}

export async function getBySlug(slug: string): Promise<Blog | null> {
	const [row] = await getDb()
		.select()
		.from(blogs)
		.where(sql`${blogs.slug} = ${slug} and ${blogs.isPublished} = true`)
		.limit(1);
	return row ?? null;
}

export async function getById(id: string): Promise<Blog | null> {
	const [row] = await getDb().select().from(blogs).where(eq(blogs.id, id)).limit(1);
	return row ?? null;
}

export async function incrementView(id: string): Promise<void> {
	await getDb()
		.update(blogs)
		.set({ views: sql`${blogs.views} + 1` })
		.where(eq(blogs.id, id));
}

export async function incrementLike(id: string): Promise<void> {
	await getDb()
		.update(blogs)
		.set({ likes: sql`${blogs.likes} + 1` })
		.where(eq(blogs.id, id));
}

export async function create(blog: NewBlog): Promise<string> {
	await assertAdmin();
	const [{ id }] = await getDb()
		.insert(blogs)
		.values({
			...blog,
			views: 0,
			likes: 0,
			publishedDate: blog.isPublished ? (blog.publishedDate ?? new Date()) : null,
		})
		.returning({ id: blogs.id });
	revalidateBlogPaths(blog.slug);
	return id;
}

export async function update(id: string, blog: UpdateBlog): Promise<void> {
	await assertAdmin();
	const db = getDb();
	const existing = await getById(id);
	if (!existing) return;
	await db
		.update(blogs)
		.set({
			...blog,
			updatedAt: new Date(),
			...(blog.isPublished && !existing.publishedDate ? { publishedDate: new Date() } : {}),
		})
		.where(eq(blogs.id, id));
	revalidateBlogPaths(existing.slug, blog.slug);
}

export async function getAllTags(): Promise<{ tags: string[] }> {
	const rows = await getDb()
		.select({ tags: blogs.tags })
		.from(blogs)
		.where(eq(blogs.isPublished, true));
	return { tags: Array.from(new Set(rows.flatMap((r) => r.tags))) };
}

// CMS helpers (the legacy CMS queried Firestore directly; this mirrors the mock).
export async function getAllForCms(): Promise<Blog[]> {
	await assertAdmin();
	return getDb().select().from(blogs).orderBy(desc(blogs.createdAt));
}

// `delete` is a reserved word — exported as deleteBlog, mapped back in index.ts.
export async function deleteBlog(id: string): Promise<void> {
	await assertAdmin();
	const [deleted] = await getDb()
		.delete(blogs)
		.where(eq(blogs.id, id))
		.returning({ slug: blogs.slug });
	revalidateBlogPaths(deleted?.slug);
}
