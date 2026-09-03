"use server";

import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { createApplication } from "../job-tracker/actions";
import type { DiscoveredJob, JobDiscoverySearchParams } from "./types";

const { skills } = schema;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Fetches worldwide remote and global tech jobs and computes an intelligent match score
 * based on the candidate's master skills in the CMS database.
 */
export async function fetchWorldwideTechJobs(
  params: JobDiscoverySearchParams = {}
): Promise<DiscoveredJob[]> {
  await assertAdmin();

  const db = getDb();
  const userSkillRows = await db.select({ name: skills.name }).from(skills);
  const userSkillNames = userSkillRows.map((s) => s.name.toLowerCase());

  // Default fallback tech skills if DB is empty
  const candidateSkills = userSkillNames.length > 0
    ? userSkillNames
    : ["react", "typescript", "next.js", "node.js", "tailwind", "postgres", "fullstack", "frontend", "backend"];

  const jobs: DiscoveredJob[] = [];

  // Concurrently fetch from Jobicy and Remotive
  const [jobicyRes, remotiveRes] = await Promise.allSettled([
    fetch("https://jobicy.com/api/v2/remote-jobs?count=40&tag=dev", {
      next: { revalidate: 3600 }, // Cache 1 hour
      headers: { "User-Agent": "CareerHubBot/1.0" },
    }).then((r) => (r.ok ? r.json() : null)),
    fetch("https://remotive.com/api/remote-jobs?limit=40&category=software-dev", {
      next: { revalidate: 3600 }, // Cache 1 hour
      headers: { "User-Agent": "CareerHubBot/1.0" },
    }).then((r) => (r.ok ? r.json() : null)),
  ]);

  // Parse Jobicy jobs
  if (jobicyRes.status === "fulfilled" && jobicyRes.value?.jobs) {
    for (const j of jobicyRes.value.jobs) {
      const desc = j.jobDescription || j.jobExcerpt || "";
      const rawText = `${j.jobTitle} ${desc} ${(j.jobIndustry || []).join(" ")}`.toLowerCase();

      const matched: string[] = [];
      candidateSkills.forEach((skill) => {
        if (rawText.includes(skill)) {
          matched.push(skill);
        }
      });

      const baseScore = 50;
      const skillBonus = Math.min(45, matched.length * 12);
      const matchScore = Math.min(98, baseScore + skillBonus);

      jobs.push({
        id: `jobicy-${j.id}`,
        title: j.jobTitle,
        companyName: j.companyName,
        companyLogo: j.companyLogo || undefined,
        location: j.jobGeo || "Worldwide Remote",
        workplaceType: "remote",
        jobType: Array.isArray(j.jobType) ? j.jobType[0] : j.jobType || "Full-Time",
        salary: j.salaryMin && j.salaryMax ? `$${j.salaryMin.toLocaleString()} - $${j.salaryMax.toLocaleString()} / yr` : undefined,
        salaryMin: j.salaryMin || undefined,
        salaryMax: j.salaryMax || undefined,
        salaryCurrency: j.salaryCurrency || "USD",
        salaryPeriod: j.salaryPeriod || "yearly",
        publishedAt: j.pubDate || new Date().toISOString(),
        jobUrl: j.url,
        tags: Array.isArray(j.jobIndustry) ? j.jobIndustry : ["Engineering"],
        description: stripHtml(desc),
        matchScore,
        matchedSkills: matched,
        source: "jobicy",
      });
    }
  }

  // Parse Remotive jobs
  if (remotiveRes.status === "fulfilled" && remotiveRes.value?.jobs) {
    for (const r of remotiveRes.value.jobs) {
      const desc = r.description || "";
      const rawText = `${r.title} ${desc} ${(r.tags || []).join(" ")}`.toLowerCase();

      const matched: string[] = [];
      candidateSkills.forEach((skill) => {
        if (rawText.includes(skill)) {
          matched.push(skill);
        }
      });

      const baseScore = 52;
      const skillBonus = Math.min(45, matched.length * 12);
      const matchScore = Math.min(99, baseScore + skillBonus);

      jobs.push({
        id: `remotive-${r.id}`,
        title: r.title,
        companyName: r.company_name,
        companyLogo: r.company_logo || undefined,
        location: r.candidate_required_location || "Worldwide Remote",
        workplaceType: "remote",
        jobType: r.job_type || "Full-Time",
        salary: r.salary || undefined,
        publishedAt: r.publication_date || new Date().toISOString(),
        jobUrl: r.url,
        tags: Array.isArray(r.tags) ? r.tags : ["Engineering"],
        description: stripHtml(desc),
        matchScore,
        matchedSkills: matched,
        source: "remotive",
      });
    }
  }

  // Apply optional search filter query
  let filtered = jobs;
  if (params.query && params.query.trim()) {
    const q = params.query.toLowerCase().trim();
    filtered = filtered.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.companyName.toLowerCase().includes(q) ||
        job.tags.some((t) => t.toLowerCase().includes(q)) ||
        job.matchedSkills.some((s) => s.toLowerCase().includes(q))
    );
  }

  // Sort by highest matchScore, then latest publishedAt
  filtered.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return filtered.slice(0, params.limit || 50);
}

/**
 * 1-Click Import discovered global job directly into Career Hub Tracker.
 */
export async function importDiscoveredJobToTracker(job: DiscoveredJob): Promise<string> {
  await assertAdmin();

  const createdId = await createApplication({
    companyName: job.companyName,
    companyLogo: job.companyLogo,
    jobTitle: job.title,
    jobUrl: job.jobUrl,
    location: job.location,
    workplaceType: job.workplaceType,
    jobType: "full_time",
    platform: "other",
    status: "wishlist",
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency || "USD",
    salaryPeriod: job.salaryPeriod || "yearly",
    jobDescriptionRaw: job.description,
    requirements: job.tags || [],
    sortOrder: 0,
  });

  revalidatePath("/cms/job-tracker");
  return createdId;
}
