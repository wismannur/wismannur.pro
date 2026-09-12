"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { countRows, descNullsLast } from "@/db/sort";
import type { Blog, NewBlog, UpdateBlog } from "./types";

const { blogs } = schema;

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 300 * (i + 1)));
    }
  }
  return fn();
}

function revalidateBlogPaths(...slugs: Array<string | null | undefined>) {
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/blog/${slug}`);
  }
  revalidatePath("/sitemap.xml");
}

export async function getByPage(
  page: number,
  pageSize: number
): Promise<{ blogs: Blog[]; totalPages: number; currentPage: number }> {
  return withRetry(async () => {
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
  });
}

export async function getAll(): Promise<Blog[]> {
  await assertAdmin();
  return withRetry(async () => {
    return getDb().select().from(blogs).orderBy(descNullsLast(blogs.publishedDate));
  });
}

export async function getLatest(count = 3): Promise<Blog[]> {
  return withRetry(async () => {
    return getDb()
      .select()
      .from(blogs)
      .where(eq(blogs.isPublished, true))
      .orderBy(descNullsLast(blogs.publishedDate))
      .limit(count);
  });
}

export async function getBySlug(slug: string): Promise<Blog | null> {
  return withRetry(async () => {
    const rows = await getDb().select().from(blogs).where(eq(blogs.slug, slug)).limit(1);
    return rows[0] ?? null;
  });
}

export async function getById(id: string): Promise<Blog | null> {
  return withRetry(async () => {
    const rows = await getDb().select().from(blogs).where(eq(blogs.id, id)).limit(1);
    return rows[0] ?? null;
  });
}

export async function incrementView(id: string): Promise<void> {
  try {
    await getDb()
      .update(blogs)
      .set({ views: sql`${blogs.views} + 1` })
      .where(eq(blogs.id, id));
  } catch (err) {
    console.warn("Silent failure incrementing view:", err);
  }
}

export async function incrementLike(id: string): Promise<void> {
  try {
    await getDb()
      .update(blogs)
      .set({ likes: sql`${blogs.likes} + 1` })
      .where(eq(blogs.id, id));
  } catch (err) {
    console.warn("Silent failure incrementing like:", err);
  }
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

export async function deleteBlog(id: string): Promise<void> {
  await assertAdmin();
  const [deleted] = await getDb()
    .delete(blogs)
    .where(eq(blogs.id, id))
    .returning({ slug: blogs.slug });
  revalidateBlogPaths(deleted?.slug);
}

export async function getAllForCms(): Promise<Blog[]> {
  await assertAdmin();
  return withRetry(async () => {
    return getDb().select().from(blogs).orderBy(desc(blogs.createdAt));
  });
}

export async function getAllTags(): Promise<string[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select({ tags: blogs.tags })
      .from(blogs)
      .where(eq(blogs.isPublished, true));
    return Array.from(new Set(rows.flatMap((r) => r.tags))).sort();
  });
}
