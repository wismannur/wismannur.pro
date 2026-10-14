import type { ApiResponse } from "@wismannur.pro/cms-contracts";

const getCmsBaseUrl = (): string => {
  if (process.env.CMS_API_URL) {
    return process.env.CMS_API_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:7002";
  }
  return "https://cms.wismannur.pro";
};

export interface CmsFetchOptions {
  tags?: string[];
  revalidate?: number | false;
  cache?: RequestCache;
  headers?: Record<string, string>;
}

/**
 * Fetch typed data from cms.wismannur.pro with Next.js Cache & ISR Tags
 */
export async function cmsFetch<T>(
  endpoint: string,
  options: CmsFetchOptions = {}
): Promise<T> {
  const baseUrl = getCmsBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const defaultRevalidate = options.revalidate !== undefined ? options.revalidate : 86400; // 24h fallback
  const nextConfig: NextFetchRequestConfig = {
    revalidate: defaultRevalidate,
    tags: options.tags,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (process.env.CMS_API_KEY) {
    headers["x-api-key"] = process.env.CMS_API_KEY;
  }

  const res = await fetch(url, {
    headers,
    cache: options.cache,
    next: nextConfig,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`[CMS API] HTTP ${res.status} error fetching ${endpoint}: ${errorText}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(`[CMS API] API error fetching ${endpoint}: ${json.error || "Unknown error"}`);
  }

  return json.data;
}

/**
 * Send mutations to cms.wismannur.pro (e.g. form submissions, visitor chat, view/like increments)
 */
export async function cmsPost<T, B = unknown>(
  endpoint: string,
  body: B,
  customHeaders?: Record<string, string>
): Promise<T> {
  const baseUrl = getCmsBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (process.env.CMS_API_KEY) {
    headers["x-api-key"] = process.env.CMS_API_KEY;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`[CMS API] HTTP ${res.status} posting to ${endpoint}: ${errorText}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(`[CMS API] API error posting to ${endpoint}: ${json.error || "Unknown error"}`);
  }

  return json.data;
}
