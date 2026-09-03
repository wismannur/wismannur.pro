"use server";

import { revalidatePath } from "next/cache";
import { and, arrayContains, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { countRows, descNullsLast } from "@/db/sort";
import type { ProjectRow } from "@/db/schema";
import type { NewProject, Project, TProjectResponse, UpdateProject } from "./types";

const { projects } = schema;
const DEFAULT_PAGE_SIZE = 9;

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

function revalidateProjectPaths(...slugs: Array<string | null | undefined>) {
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/projects/${slug}`);
  }
  revalidatePath("/sitemap.xml");
}

const toProject = (row: ProjectRow): Project => ({
  ...row,
  demoUrl: row.demoUrl ?? undefined,
  repoUrl: row.repoUrl ?? undefined,
  authorId: row.authorId ?? undefined,
  authorName: row.authorName ?? undefined,
});

export async function getAll(): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(descNullsLast(projects.publishedDate));
    return rows.map(toProject);
  });
}

export async function getPaginated(_lastVisible?: unknown) {
  return withRetry(async () => {
    const db = getDb();
    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(eq(projects.isPublished, true))
        .orderBy(descNullsLast(projects.publishedDate))
        .limit(DEFAULT_PAGE_SIZE),
      db.select({ count: countRows }).from(projects).where(eq(projects.isPublished, true)),
    ]);
    return { projects: rows.map(toProject), lastDoc: null, hasMore: count > DEFAULT_PAGE_SIZE };
  });
}

export async function getFeatured(count = 3): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(desc(projects.views))
      .limit(count);
    return rows.map(toProject);
  });
}

export async function getLatest(count = 3): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(descNullsLast(projects.publishedDate))
      .limit(count);
    return rows.map(toProject);
  });
}

export async function getBySlug(slug: string): Promise<TProjectResponse | null> {
  return withRetry(async () => {
    const [row] = await getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublished, true)))
      .limit(1);
    return row ? toProject(row) : null;
  });
}

export async function getById(id: string): Promise<TProjectResponse | null> {
  return withRetry(async () => {
    const [row] = await getDb().select().from(projects).where(eq(projects.id, id)).limit(1);
    return row ? toProject(row) : null;
  });
}

export async function getByAuthor(authorId: string): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.isPublished, true), eq(projects.authorId, authorId)))
      .orderBy(descNullsLast(projects.publishedDate));
    return rows.map(toProject);
  });
}

export async function incrementView(id: string): Promise<void> {
  try {
    await getDb()
      .update(projects)
      .set({ views: sql`${projects.views} + 1` })
      .where(eq(projects.id, id));
  } catch (err) {
    console.warn("Silent failure incrementing view:", err);
  }
}

export async function incrementLike(id: string): Promise<void> {
  try {
    await getDb()
      .update(projects)
      .set({ likes: sql`${projects.likes} + 1` })
      .where(eq(projects.id, id));
  } catch (err) {
    console.warn("Silent failure incrementing like:", err);
  }
}

export async function create(project: NewProject): Promise<string> {
  await assertAdmin();
  const [{ id }] = await getDb()
    .insert(projects)
    .values({
      ...project,
      views: 0,
      likes: 0,
      publishedDate: project.isPublished ? (project.publishedDate ?? new Date()) : null,
    })
    .returning({ id: projects.id });
  revalidateProjectPaths(project.slug);
  return id;
}

export async function update(id: string, project: UpdateProject): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const existing = await getById(id);
  if (!existing) return;
  await db
    .update(projects)
    .set({
      ...project,
      updatedAt: new Date(),
      ...(project.isPublished && !existing.publishedDate ? { publishedDate: new Date() } : {}),
    })
    .where(eq(projects.id, id));
  revalidateProjectPaths(existing.slug, project.slug);
}

export async function deleteProject(id: string): Promise<void> {
  await assertAdmin();
  const [deleted] = await getDb()
    .delete(projects)
    .where(eq(projects.id, id))
    .returning({ slug: projects.slug });
  revalidateProjectPaths(deleted?.slug);
}

export async function searchByTechnology(technology: string): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(
        and(eq(projects.isPublished, true), arrayContains(projects.technologies, [technology]))
      )
      .orderBy(descNullsLast(projects.publishedDate));
    return rows.map(toProject);
  });
}

export async function getFeaturedProjects(): Promise<Project[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.isPublished, true), eq(projects.isFeatured, true)))
      .orderBy(descNullsLast(projects.publishedDate));
    return rows.map(toProject);
  });
}

export async function getByPage(
  page: number,
  pageSize: number,
  filters?: { searchTerm?: string; technology?: string }
): Promise<{ projects: Project[]; totalPages: number; currentPage: number }> {
  return withRetry(async () => {
    const conditions = [eq(projects.isPublished, true), eq(projects.isFeatured, false)];
    if (filters?.technology) {
      conditions.push(arrayContains(projects.technologies, [filters.technology]));
    }
    if (filters?.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      conditions.push(
        or(
          ilike(projects.title, term),
          ilike(projects.summary, term),
          ilike(projects.description, term)
        )!
      );
    }

    const db = getDb();
    const where = and(...conditions);
    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(where)
        .orderBy(descNullsLast(projects.publishedDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: countRows }).from(projects).where(where),
    ]);
    return {
      projects: rows.map(toProject),
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
      currentPage: page,
    };
  });
}

export async function getAllTechnologies(): Promise<string[]> {
  return withRetry(async () => {
    const rows = await getDb()
      .select({ technologies: projects.technologies })
      .from(projects)
      .where(eq(projects.isPublished, true));
    return Array.from(new Set(rows.flatMap((r) => r.technologies))).sort();
  });
}

export async function getAllForCms(): Promise<Project[]> {
  await assertAdmin();
  return withRetry(async () => {
    const rows = await getDb().select().from(projects).orderBy(desc(projects.createdAt));
    return rows.map(toProject);
  });
}
