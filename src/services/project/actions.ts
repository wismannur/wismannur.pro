"use server";

import { cmsFetch, cmsPost } from "@/lib/cms-client";
import {
  CMS_API_ENDPOINTS,
  CMS_CACHE_TAGS,
  type Project,
} from "@wismannur.pro/cms-contracts";

export async function getAll(): Promise<Project[]> {
  try {
    return await cmsFetch<Project[]>(CMS_API_ENDPOINTS.PROJECTS, {
      tags: [CMS_CACHE_TAGS.PROJECTS_ALL],
      revalidate: 86400,
    });
  } catch (err) {
    console.error("[projectService] getAll error:", err);
    return [];
  }
}

export async function getLatest(limit: number): Promise<Project[]> {
  try {
    return await cmsFetch<Project[]>(`${CMS_API_ENDPOINTS.PROJECTS}?limit=${limit}`, {
      tags: [CMS_CACHE_TAGS.PROJECTS_ALL],
      revalidate: 86400,
    });
  } catch (err) {
    console.error("[projectService] getLatest error:", err);
    return [];
  }
}

export async function getFeatured(limit = 4): Promise<Project[]> {
  try {
    const projects = await cmsFetch<Project[]>(`${CMS_API_ENDPOINTS.PROJECTS}?featured=true`, {
      tags: [CMS_CACHE_TAGS.PROJECTS_ALL],
      revalidate: 86400,
    });
    return projects.slice(0, limit);
  } catch (err) {
    console.error("[projectService] getFeatured error:", err);
    return [];
  }
}

export async function getBySlug(slug: string): Promise<Project | null> {
  try {
    return await cmsFetch<Project>(CMS_API_ENDPOINTS.PROJECT_DETAIL(slug), {
      tags: [CMS_CACHE_TAGS.PROJECT_DETAIL(slug)],
      revalidate: 86400,
    });
  } catch (err) {
    console.error(`[projectService] getBySlug error for '${slug}':`, err);
    return null;
  }
}

export async function searchByTechnology(technology: string): Promise<Project[]> {
  try {
    return await cmsFetch<Project[]>(
      `${CMS_API_ENDPOINTS.PROJECTS}?technology=${encodeURIComponent(technology)}`,
      {
        tags: [CMS_CACHE_TAGS.PROJECTS_ALL],
        revalidate: 86400,
      }
    );
  } catch (err) {
    console.error("[projectService] searchByTechnology error:", err);
    return [];
  }
}

export async function getByPage(
  page: number,
  pageSize: number,
  filters?: { searchTerm?: string; technology?: string }
): Promise<{ projects: Project[]; totalPages: number; currentPage: number }> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    if (filters?.searchTerm) params.set("search", filters.searchTerm);
    if (filters?.technology) params.set("technology", filters.technology);

    const baseUrl = process.env.CMS_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:7002" : "https://cms.wismannur.pro");
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/public/projects?${params.toString()}`, {
      next: { tags: [CMS_CACHE_TAGS.PROJECTS_ALL], revalidate: 86400 },
    });
    const json = await res.json();
    return {
      projects: json.data || [],
      totalPages: json.meta?.totalPages || 1,
      currentPage: json.meta?.page || page,
    };
  } catch (err) {
    console.error("[projectService] getByPage error:", err);
    return { projects: [], totalPages: 1, currentPage: page };
  }
}

export async function getAllTechnologies(): Promise<string[]> {
  try {
    const all = await getAll();
    const set = new Set<string>();
    for (const p of all) {
      for (const t of p.technologies || []) {
        set.add(t);
      }
    }
    return Array.from(set).sort();
  } catch (err) {
    console.error("[projectService] getAllTechnologies error:", err);
    return [];
  }
}

export async function incrementView(slug: string): Promise<void> {
  try {
    await cmsPost(CMS_API_ENDPOINTS.INTERACTION_VIEW, { entityType: "project", slug });
  } catch (err) {
    console.warn("Silent failure incrementing project view:", err);
  }
}

export async function incrementLike(slug: string): Promise<void> {
  try {
    await cmsPost(CMS_API_ENDPOINTS.INTERACTION_LIKE, { entityType: "project", slug });
  } catch (err) {
    console.warn("Silent failure incrementing project like:", err);
  }
}
