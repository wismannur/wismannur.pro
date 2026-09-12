"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertAdmin } from "@/services/core/auth-guard";
import type { DiscoveredJob } from "../types";
import { PRESET_ATS_COMPANIES } from "./presets";
import type {
  AtsFetchParams,
  AtsPlatform,
  AtsTargetCompany,
  AtsVerificationResult,
} from "./types";
import { detectAtsFromUrl, verifyAtsTarget } from "./adapters/detector";
import { parseAshbyJob, type AshbyRawJob } from "./adapters/ashby";
import { parseGreenhouseJob, type GreenhouseRawJob } from "./adapters/greenhouse";
import { parseLeverJob, type LeverRawJob } from "./adapters/lever";

const { atsTargetCompanies, skills } = schema;

/**
 * Gets all active ATS target companies (database custom + default presets).
 */
export async function getTargetCompanies(): Promise<AtsTargetCompany[]> {
  await assertAdmin();
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(atsTargetCompanies)
      .orderBy(desc(atsTargetCompanies.createdAt))
      .catch(() => []);

    const dbCompanies: AtsTargetCompany[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      platform: r.platform as AtsPlatform,
      slug: r.slug,
      websiteUrl: r.websiteUrl || undefined,
      logoUrl: r.logoUrl || undefined,
      isActive: r.isActive,
      isCustom: true,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    }));

    // Combine presets with DB entries (avoiding duplicate slug+platform)
    const combined: AtsTargetCompany[] = [...dbCompanies];
    for (const preset of PRESET_ATS_COMPANIES) {
      const exists = dbCompanies.some(
        (c) => c.platform === preset.platform && c.slug.toLowerCase() === preset.slug.toLowerCase()
      );
      if (!exists) {
        combined.push(preset);
      }
    }

    return combined;
  } catch (err) {
    console.error("Failed to load target companies:", err);
    return PRESET_ATS_COMPANIES;
  }
}

/**
 * Verifies an ATS URL or slug and returns detected platform, slug, and live job count.
 */
export async function verifyAtsTargetAction(
  input: string,
  platformHint?: AtsPlatform
): Promise<AtsVerificationResult> {
  await assertAdmin();
  const detected = detectAtsFromUrl(input);
  const platform = detected?.platform || platformHint || "ashby";
  const slug = detected?.slug || input.trim().toLowerCase();

  return verifyAtsTarget(platform, slug);
}

/**
 * Saves a new custom target company to the database.
 */
export async function saveTargetCompany(data: {
  name: string;
  platform: AtsPlatform;
  slug: string;
  websiteUrl?: string;
  logoUrl?: string;
}): Promise<{ success: boolean; company?: AtsTargetCompany; error?: string }> {
  await assertAdmin();

  const name = data.name.trim();
  const slug = data.slug.trim().toLowerCase();
  const platform = data.platform;

  if (!name || !slug) {
    return { success: false, error: "Company name and slug are required." };
  }

  // Pre-validate that this company endpoint actually works
  const verification = await verifyAtsTarget(platform, slug);
  if (!verification.valid) {
    return {
      success: false,
      error: verification.error || `Could not verify ${platform} job board for "${slug}".`,
    };
  }

  try {
    const db = getDb();
    const id = `custom-${platform}-${slug}`;

    const [row] = await db
      .insert(atsTargetCompanies)
      .values({
        id,
        name,
        platform,
        slug,
        websiteUrl: data.websiteUrl?.trim() || null,
        logoUrl: data.logoUrl?.trim() || null,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: atsTargetCompanies.id,
        set: {
          name,
          websiteUrl: data.websiteUrl?.trim() || null,
          logoUrl: data.logoUrl?.trim() || null,
          isActive: true,
          updatedAt: new Date(),
        },
      })
      .returning();

    revalidatePath("/cms/job-hunter");
    atsMemoryCache.delete(`${platform}:${slug}`);

    return {
      success: true,
      company: {
        id: row.id,
        name: row.name,
        platform: row.platform as AtsPlatform,
        slug: row.slug,
        websiteUrl: row.websiteUrl || undefined,
        logoUrl: row.logoUrl || undefined,
        isActive: row.isActive,
        isCustom: true,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to save company." };
  }
}

/**
 * Deletes a custom company from database.
 */
export async function deleteTargetCompany(id: string): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();

  try {
    const db = getDb();
    await db.delete(atsTargetCompanies).where(eq(atsTargetCompanies.id, id));
    revalidatePath("/cms/job-hunter");
    atsMemoryCache.clear();
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to delete company." };
  }
}

/**
 * Toggles a company active status.
 */
export async function toggleTargetCompany(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();

  try {
    const db = getDb();
    await db
      .update(atsTargetCompanies)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(atsTargetCompanies.id, id));
    revalidatePath("/cms/job-hunter");
    atsMemoryCache.clear();
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to toggle company." };
  }
}

/**
 * Helper to extract candidate skills from database for scoring.
 */
async function getCandidateSkills(): Promise<string[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({ name: skills.name })
      .from(skills)
      .where(eq(skills.isPublished, true))
      .catch(() => []);
    if (rows.length > 0) return rows.map((r) => r.name);
  } catch {}

  return [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Go",
    "Flutter",
    "PostgreSQL",
    "Tailwind CSS",
    "GraphQL",
    "Docker",
    "System Architecture",
    "Fullstack Engineering",
  ];
}

/**
 * Computes a lightweight match score for ATS jobs.
 */
function scoreAtsJob(
  job: Partial<DiscoveredJob>,
  masterSkills: string[]
): { matchScore: number; matchedSkills: string[]; matchReasons: string[] } {
  const fullText = `${job.title || ""} ${job.description || ""} ${job.tags?.join(" ") || ""}`.toLowerCase();
  const titleText = (job.title || "").toLowerCase();
  const matchedSkills: string[] = [];
  const matchReasons: string[] = [];

  for (const skill of masterSkills) {
    const s = skill.toLowerCase();
    if (fullText.includes(s) && !matchedSkills.includes(skill)) {
      matchedSkills.push(skill);
    }
  }

  let score = 30; // base score for verified direct ATS job

  // Remote bonus
  if (job.workplaceType === "remote") {
    score += 20;
    matchReasons.push("🌐 Remote Opportunity: Direct remote role from official company ATS (+20%)");
  }

  // Seniority / Engineering role match
  if (/\b(?:staff|lead|senior|sr\.?|principal|founding|architect)\b/i.test(titleText)) {
    score += 25;
    matchReasons.push("🎯 Senior / Lead Discipline: High-level engineering role match (+25%)");
  } else if (/\b(?:full[- ]?stack|frontend|backend|software|developer|engineer)\b/i.test(titleText)) {
    score += 15;
    matchReasons.push("💻 Software Engineering Alignment (+15%)");
  }

  // Skills match
  if (matchedSkills.length >= 3) {
    score += 25;
    matchReasons.push(`🛠️ Tech Stack Overlap: Matched ${matchedSkills.slice(0, 3).join(", ")} (+25%)`);
  } else if (matchedSkills.length >= 1) {
    score += 15;
    matchReasons.push(`🛠️ Tech Stack Overlap: Matched ${matchedSkills[0]} (+15%)`);
  }

  const matchScore = Math.max(20, Math.min(99, score));
  return { matchScore, matchedSkills, matchReasons };
}

/**
 * Checks whether an ATS location is open worldwide, APAC, or to Indonesian candidates.
 * Filters out positions explicitly restricted to specific foreign countries (e.g. "Remote, Poland", "Remote, US").
 */
function isIndonesiaOrWorldwideFriendly(location: string): boolean {
  const loc = location.toLowerCase().trim();

  // Explicit worldwide, global, APAC, or generic "Remote"
  if (
    loc === "remote" ||
    loc === "worldwide" ||
    loc === "anywhere" ||
    loc === "global" ||
    loc.includes("worldwide") ||
    loc.includes("anywhere") ||
    loc.includes("global remote") ||
    loc.includes("remote (global)") ||
    loc.includes("remote - global") ||
    loc.includes("remote, global") ||
    loc.includes("apac") ||
    loc.includes("asia") ||
    loc.includes("southeast asia") ||
    loc.includes("indonesia") ||
    loc.includes("singapore") ||
    loc.includes("remote - all")
  ) {
    return true;
  }

  // Country/regional restrictions where candidate in Indonesia cannot legally/technically apply
  const restrictedPatterns = [
    /\bpoland\b/i,
    /\bgermany\b/i,
    /\bfrance\b/i,
    /\buk\b/i,
    /\bunited\s+kingdom\b/i,
    /\bnetherlands\b/i,
    /\bspain\b/i,
    /\bitaly\b/i,
    /\bsweden\b/i,
    /\bswitzerland\b/i,
    /\baustria\b/i,
    /\bireland\b/i,
    /\bcanada\b/i,
    /\bbrazil\b/i,
    /\bmexico\b/i,
    /\bus\b/i,
    /\busa\b/i,
    /\bunited\s+states\b/i,
    /\beurope\b/i,
    /\bemea\b/i,
    /\blatam\b/i,
    /\bamericas?\b/i,
    /\bnorth\s+america\b/i,
  ];

  const isRestricted = restrictedPatterns.some((pattern) => pattern.test(loc));
  if (isRestricted) {
    return false;
  }

  return loc.includes("remote");
}

interface AtsCacheEntry {
  timestamp: number;
  jobs: Partial<DiscoveredJob>[];
}

// Module-level in-memory cache for parsed jobs per company (20 minutes TTL)
const atsMemoryCache = new Map<string, AtsCacheEntry>();
const ATS_CACHE_TTL_MS = 20 * 60 * 1000;

/**
 * Fetches all jobs from active ATS target companies concurrently.
 */
export async function fetchDirectAtsJobs(
  params: AtsFetchParams = {}
): Promise<{ jobs: DiscoveredJob[]; totalCount: number; companiesCount: number }> {
  await assertAdmin();
  const allCompanies = await getTargetCompanies();
  const activeCompanies = allCompanies.filter((c) => c.isActive);

  // Filter companies if specified
  const filteredCompanies = activeCompanies.filter((c) => {
    if (params.platform && params.platform !== "all" && c.platform !== params.platform) {
      return false;
    }
    if (params.selectedCompanies && params.selectedCompanies.length > 0) {
      return (
        params.selectedCompanies.includes(c.id) ||
        params.selectedCompanies.includes(c.slug) ||
        params.selectedCompanies.includes(c.name)
      );
    }
    return true;
  });

  const masterSkills = await getCandidateSkills();

  // Fetch in parallel with memory cache to prevent Next.js 2MB cache warnings & speed up loads
  const fetchPromises = filteredCompanies.map(async (company) => {
    const cacheKey = `${company.platform}:${company.slug}`;
    const now = Date.now();
    const cached = atsMemoryCache.get(cacheKey);

    if (!params.forceRefresh && cached && now - cached.timestamp < ATS_CACHE_TTL_MS) {
      return cached.jobs;
    }

    try {
      let parsedJobs: Partial<DiscoveredJob>[] = [];

      if (company.platform === "ashby") {
        const res = await fetch(
          `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company.slug)}`,
          {
            headers: { "User-Agent": "CareerHubBot/1.0" },
            cache: "no-store",
          }
        );
        if (!res.ok) return cached?.jobs || [];
        const data = await res.json();
        const rawJobs: AshbyRawJob[] = Array.isArray(data?.jobs) ? data.jobs : [];
        parsedJobs = rawJobs.map((j) => parseAshbyJob(j, company));
      } else if (company.platform === "greenhouse") {
        const res = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company.slug)}/jobs?content=true`,
          {
            headers: { "User-Agent": "CareerHubBot/1.0" },
            cache: "no-store",
          }
        );
        if (!res.ok) return cached?.jobs || [];
        const data = await res.json();
        const rawJobs: GreenhouseRawJob[] = Array.isArray(data?.jobs) ? data.jobs : [];
        parsedJobs = rawJobs.map((j) => parseGreenhouseJob(j, company));
      } else if (company.platform === "lever") {
        const res = await fetch(
          `https://api.lever.co/v0/postings/${encodeURIComponent(company.slug)}?mode=json`,
          {
            headers: { "User-Agent": "CareerHubBot/1.0" },
            cache: "no-store",
          }
        );
        if (!res.ok) return cached?.jobs || [];
        const rawJobs: LeverRawJob[] = await res.json();
        if (!Array.isArray(rawJobs)) return cached?.jobs || [];
        parsedJobs = rawJobs.map((j) => parseLeverJob(j, company));
      }

      if (parsedJobs.length > 0) {
        atsMemoryCache.set(cacheKey, { timestamp: now, jobs: parsedJobs });
      }

      return parsedJobs;
    } catch (err) {
      console.warn(`Failed to fetch jobs for ${company.name} (${company.slug}):`, err);
      if (cached) return cached.jobs;
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  const rawJobsList: Partial<DiscoveredJob>[] = [];

  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      rawJobsList.push(...r.value);
    }
  }

  // Filter and score jobs (Default to 100% Worldwide Remote & Indonesia-friendly)
  const query = params.query?.trim().toLowerCase() || "";
  const remoteOnly = params.remoteOnly ?? true;
  const worldwideOnly = params.worldwideOnly ?? true;

  const processedJobs: DiscoveredJob[] = [];

  for (const raw of rawJobsList) {
    if (!raw.title || !raw.id) continue;

    if (remoteOnly && raw.workplaceType !== "remote") {
      continue;
    }

    const isWorldwideOrApac = isIndonesiaOrWorldwideFriendly(raw.location || "");

    if (worldwideOnly && !isWorldwideOrApac) {
      continue;
    }

    if (query) {
      const titleMatch = raw.title.toLowerCase().includes(query);
      const companyMatch = raw.companyName?.toLowerCase().includes(query);
      const tagMatch = raw.tags?.some((t) => t.toLowerCase().includes(query));
      const locMatch = raw.location?.toLowerCase().includes(query);
      if (!titleMatch && !companyMatch && !tagMatch && !locMatch) {
        continue;
      }
    }

    const { matchScore, matchedSkills, matchReasons } = scoreAtsJob(raw, masterSkills);

    // Detect seniority level
    const t = raw.title.toLowerCase();
    let seniorityLevel: DiscoveredJob["seniorityLevel"] = "Mid";
    if (t.includes("staff") || t.includes("principal") || t.includes("lead") || t.includes("architect")) {
      seniorityLevel = "Lead";
    } else if (t.includes("senior") || t.includes("sr.")) {
      seniorityLevel = "Senior";
    } else if (t.includes("junior") || t.includes("intern") || t.includes("entry")) {
      seniorityLevel = "Junior";
    }

    let geoRegion: DiscoveredJob["geoRegion"] = isWorldwideOrApac ? "worldwide" : "europe";
    const locLower = (raw.location || "").toLowerCase();
    if (locLower.includes("us") || locLower.includes("united states") || locLower.includes("canada") || locLower.includes("americas")) {
      geoRegion = "usa";
    } else if (locLower.includes("japan")) {
      geoRegion = "japan";
    } else if (locLower.includes("australia") || locLower.includes("zealand")) {
      geoRegion = "australia";
    } else if (locLower.includes("apac") || locLower.includes("singapore") || locLower.includes("asia") || locLower.includes("indonesia")) {
      geoRegion = "apac";
    }

    processedJobs.push({
      id: raw.id,
      title: raw.title,
      companyName: raw.companyName || "Unknown Company",
      companyLogo: raw.companyLogo,
      location: raw.location || "Remote",
      workplaceType: raw.workplaceType || "remote",
      jobType: raw.jobType || "Full-Time",
      salary: raw.salary,
      salaryMin: raw.salaryMin,
      salaryMax: raw.salaryMax,
      salaryCurrency: raw.salaryCurrency || "USD",
      publishedAt: raw.publishedAt || new Date().toISOString(),
      jobUrl: raw.jobUrl || "",
      tags: raw.tags || [],
      description: raw.description || "",
      matchScore,
      matchedSkills,
      matchReasons,
      source: raw.source as DiscoveredJob["source"],
      sourceName: raw.sourceName || "Direct ATS",
      sourceBadgeColor: raw.sourceBadgeColor,
      seniorityLevel,
      geoRegion,
    });
  }

  // Sort by match score descending, then published date descending
  processedJobs.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const limit = params.limit || 100;
  return {
    jobs: processedJobs.slice(0, limit),
    totalCount: processedJobs.length,
    companiesCount: filteredCompanies.length,
  };
}
