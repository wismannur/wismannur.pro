import type { AtsPlatform, AtsVerificationResult } from "../types";

export function detectAtsFromUrl(input: string): { platform: AtsPlatform; slug: string } | null {
  const clean = input.trim();
  if (!clean) return null;

  try {
    const url = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.replace(/\/+$/, "");
    const parts = pathname.split("/").filter(Boolean);

    // Ashby: jobs.ashbyhq.com/{slug} or ashbyhq.com/{slug}
    if (host.includes("ashbyhq.com")) {
      const slug = parts[0];
      if (slug && slug !== "posting-api") {
        return { platform: "ashby", slug: slug.toLowerCase() };
      }
    }

    // Greenhouse: boards.greenhouse.io/{slug} or job-boards.greenhouse.io/{slug}
    if (host.includes("greenhouse.io")) {
      // e.g. /gitlab or /v1/boards/gitlab
      const slug = parts[0] === "v1" && parts[1] === "boards" ? parts[2] : parts[0];
      if (slug) {
        return { platform: "greenhouse", slug: slug.toLowerCase() };
      }
    }

    // Lever: jobs.lever.co/{slug}
    if (host.includes("lever.co")) {
      const slug = parts[0];
      if (slug) {
        return { platform: "lever", slug: slug.toLowerCase() };
      }
    }
  } catch {
    // If not a valid URL, it might just be a slug or plain text
  }

  return null;
}

export async function verifyAtsTarget(
  platform: AtsPlatform,
  slug: string
): Promise<AtsVerificationResult> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return {
      valid: false,
      platform,
      slug: normalizedSlug,
      jobCount: 0,
      error: "Company slug cannot be empty.",
    };
  }

  try {
    if (platform === "ashby") {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(normalizedSlug)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "CareerHubBot/1.0" },
        cache: "no-store",
      });

      if (!res.ok) {
        return {
          valid: false,
          platform,
          slug: normalizedSlug,
          jobCount: 0,
          error: `Ashby returned HTTP ${res.status}. Please check if "${normalizedSlug}" is the correct Ashby job board slug.`,
        };
      }

      const data = await res.json();
      const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
      return {
        valid: true,
        platform,
        slug: normalizedSlug,
        jobCount: jobs.length,
        sampleTitle: jobs[0]?.title || undefined,
      };
    }

    if (platform === "greenhouse") {
      const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(normalizedSlug)}/jobs`;
      const res = await fetch(url, {
        headers: { "User-Agent": "CareerHubBot/1.0" },
        cache: "no-store",
      });

      if (!res.ok) {
        return {
          valid: false,
          platform,
          slug: normalizedSlug,
          jobCount: 0,
          error: `Greenhouse returned HTTP ${res.status}. Please check if "${normalizedSlug}" is the correct Greenhouse board token.`,
        };
      }

      const data = await res.json();
      const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
      return {
        valid: true,
        platform,
        slug: normalizedSlug,
        jobCount: jobs.length,
        sampleTitle: jobs[0]?.title || undefined,
      };
    }

    if (platform === "lever") {
      const url = `https://api.lever.co/v0/postings/${encodeURIComponent(normalizedSlug)}?mode=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "CareerHubBot/1.0" },
        cache: "no-store",
      });

      if (!res.ok) {
        return {
          valid: false,
          platform,
          slug: normalizedSlug,
          jobCount: 0,
          error: `Lever returned HTTP ${res.status}. Please check if "${normalizedSlug}" is the correct Lever company name.`,
        };
      }

      const data = await res.json();
      const jobs = Array.isArray(data) ? data : [];
      return {
        valid: true,
        platform,
        slug: normalizedSlug,
        jobCount: jobs.length,
        sampleTitle: jobs[0]?.text || undefined,
      };
    }

    return {
      valid: false,
      platform,
      slug: normalizedSlug,
      jobCount: 0,
      error: `Unsupported platform: ${platform}`,
    };
  } catch (err: unknown) {
    return {
      valid: false,
      platform,
      slug: normalizedSlug,
      jobCount: 0,
      error: (err as Error).message || "Failed to connect to ATS endpoint.",
    };
  }
}
