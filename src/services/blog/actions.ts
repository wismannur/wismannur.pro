"use server";

import { cmsFetch, cmsPost } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type Blog,
} from "@wismannur.pro/cms-contracts";

export async function getAll(): Promise<Blog[]> {
  try {
    return await cmsFetch<Blog[]>(CMS_API_ENDPOINTS.BLOGS, {
      tags: [CMS_CACHE_TAGS.BLOGS_ALL],
      revalidate: 86400,
    });
  } catch (err) {
    console.error("[blogService] getAll error:", err);
    return [];
  }
}

export async function getLatest(limit: number): Promise<Blog[]> {
  try {
    return await cmsFetch<Blog[]>(`${CMS_API_ENDPOINTS.BLOGS}?limit=${limit}`, {
      tags: [CMS_CACHE_TAGS.BLOGS_ALL],
      revalidate: 86400,
    });
  } catch (err) {
    console.error("[blogService] getLatest error:", err);
    return [];
  }
}

export async function getBySlug(slug: string): Promise<Blog | null> {
  try {
    return await cmsFetch<Blog>(CMS_API_ENDPOINTS.BLOG_DETAIL(slug), {
      tags: [CMS_CACHE_TAGS.BLOG_DETAIL(slug)],
      revalidate: 86400,
    });
  } catch (err) {
    console.error(`[blogService] getBySlug error for '${slug}':`, err);
    return null;
  }
}

export async function getByPage(
  page: number,
  pageSize: number
): Promise<{ blogs: Blog[]; totalPages: number; currentPage: number }> {
  try {
    const baseUrl = process.env.CMS_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:7002" : "https://cms.wismannur.pro");
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/public/blogs?page=${page}&limit=${pageSize}`, {
      next: { tags: [CMS_CACHE_TAGS.BLOGS_ALL], revalidate: 86400 },
    });
    const json = await res.json();
    return {
      blogs: json.data || [],
      totalPages: json.meta?.totalPages || 1,
      currentPage: json.meta?.page || page,
    };
  } catch (err) {
    console.error("[blogService] getByPage error:", err);
    return { blogs: [], totalPages: 1, currentPage: page };
  }
}

export async function getAllTags(): Promise<string[]> {
  try {
    const all = await getAll();
    const set = new Set<string>();
    for (const b of all) {
      for (const t of b.tags || []) {
        set.add(t);
      }
    }
    return Array.from(set).sort();
  } catch (err) {
    console.error("[blogService] getAllTags error:", err);
    return [];
  }
}

export async function incrementView(slug: string): Promise<void> {
  try {
    await cmsPost(CMS_API_ENDPOINTS.INTERACTION_VIEW, { entityType: "blog", slug });
  } catch (err) {
    console.warn("Silent failure incrementing blog view:", err);
  }
}

export async function incrementLike(slug: string): Promise<void> {
  try {
    await cmsPost(CMS_API_ENDPOINTS.INTERACTION_LIKE, { entityType: "blog", slug });
  } catch (err) {
    console.warn("Silent failure incrementing blog like:", err);
  }
}
