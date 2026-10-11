"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { createApplication } from "../job-tracker/actions";
import type { DiscoveredJob, JobDiscoverySearchParams } from "./types";
import {
  formatJobDescription,
  sanitizeText,
  detectSeniorityLevel,
  detectGeoRegion,
  isStrictWorldwideRemote,
} from "./lib/jd-cleaner";
import {
  loadCandidateProfileContext,
  computeCalibratedMatchScore,
} from "./lib/match-engine";
import { fetchDirectLinkedInJobs } from "./lib/linkedin-scraper";
import { mapJobSourceToPlatform } from "./lib/platform-mapper";

/**
 * Fetches worldwide remote and global tech jobs dynamically adapted
 * to candidate's skills, AI Knowledge Hub entries, and experience in CMS database.
 */
export async function fetchWorldwideTechJobs(
  params: JobDiscoverySearchParams = {}
): Promise<DiscoveredJob[]> {
  await assertAdmin();

  const db = getDb();
  const profileContext = await loadCandidateProfileContext(db);

  const hasUserSearch = Boolean(params.query && params.query.trim());
  const userQuery = hasUserSearch ? params.query!.trim() : "";

  const jobicyUrl = hasUserSearch
    ? `https://jobicy.com/api/v2/remote-jobs?count=40&geo=anywhere&tag=${encodeURIComponent(userQuery)}`
    : `https://jobicy.com/api/v2/remote-jobs?count=40&geo=anywhere`;

  const remotiveUrl = hasUserSearch
    ? `https://remotive.com/api/remote-jobs?limit=40&search=${encodeURIComponent(userQuery)}`
    : `https://remotive.com/api/remote-jobs?limit=40&category=software-dev`;

  const arbeitnowUrl = hasUserSearch
    ? `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(userQuery)}`
    : `https://www.arbeitnow.com/api/job-board-api`;

  const remoteOkUrl = hasUserSearch
    ? `https://remoteok.com/api?tag=${encodeURIComponent(userQuery)}`
    : `https://remoteok.com/api?tag=dev`;

  const linkedInQueries = userQuery
    ? [userQuery]
    : [
        profileContext.targetRoles[0] || "Senior Full Stack Engineer",
        "Lead Software Engineer",
        "Full Stack Developer",
        "Senior Frontend Engineer",
      ];

  let linkedInLocation = "Worldwide";
  if (params.geo === "apac") linkedInLocation = "Singapore";
  else if (params.geo === "japan") linkedInLocation = "Japan";
  else if (params.geo === "europe") linkedInLocation = "Europe";
  else if (params.geo === "australia") linkedInLocation = "Australia";
  else if (params.geo === "usa") linkedInLocation = "United States";

  const hasPlatformFilter = Boolean(params.platforms && params.platforms.length > 0);
  const normalizedPlatforms = params.platforms?.map((p) => p.toLowerCase());
  const isPlatformActive = (name: string) =>
    !hasPlatformFilter || Boolean(normalizedPlatforms?.includes(name));

  const shouldFetchJobicy = isPlatformActive("jobicy");
  const shouldFetchRemotive = isPlatformActive("remotive");
  const shouldFetchArbeitnow = isPlatformActive("arbeitnow");
  const shouldFetchRemoteOk = isPlatformActive("remoteok");
  const shouldFetchLinkedIn = isPlatformActive("linkedin");

  const jobs: DiscoveredJob[] = [];

  // Concurrently fetch from all verified direct providers (Jobicy, Remotive, Arbeitnow, RemoteOK, LinkedIn Live)
  const [jobicyRes, remotiveRes, arbeitnowRes, remoteOkRes, directLinkedInJobs] =
    await Promise.allSettled([
      // 1. Jobicy API
      shouldFetchJobicy
        ? fetch(jobicyUrl, {
            next: { revalidate: 1800 },
            headers: { "User-Agent": "CareerHubBot/1.0" },
          }).then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null),

      // 2. Remotive API
      shouldFetchRemotive
        ? fetch(remotiveUrl, {
            next: { revalidate: 1800 },
            headers: { "User-Agent": "CareerHubBot/1.0" },
          }).then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null),

      // 3. Arbeitnow API
      shouldFetchArbeitnow
        ? fetch(arbeitnowUrl, {
            next: { revalidate: 1800 },
            headers: { "User-Agent": "CareerHubBot/1.0" },
          }).then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null),

      // 4. RemoteOK API
      shouldFetchRemoteOk
        ? fetch(remoteOkUrl, {
            next: { revalidate: 1800 },
            headers: { "User-Agent": "CareerHubBot/1.0" },
          }).then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null),

      // 5. LinkedIn Live Direct Engine (100% verified DOM matching)
      shouldFetchLinkedIn
        ? fetchDirectLinkedInJobs(
            linkedInQueries,
            linkedInLocation,
            profileContext
          )
        : Promise.resolve([]),
    ]);

  // 1. Parse Jobicy
  if (jobicyRes.status === "fulfilled" && jobicyRes.value?.jobs) {
    for (const j of jobicyRes.value.jobs) {
      const desc = formatJobDescription(j.jobDescription || j.jobExcerpt || "");
      const loc = sanitizeText(j.jobGeo || "Worldwide Remote");
      const tags = Array.isArray(j.jobIndustry) ? j.jobIndustry : ["Engineering"];

      if (
        !isStrictWorldwideRemote({
          location: loc,
          tags,
          description: desc,
          source: "jobicy",
        })
      ) {
        continue;
      }

      const { matchScore, matchedSkills, matchReasons } = computeCalibratedMatchScore(
        j.jobTitle,
        desc,
        tags,
        profileContext
      );

      jobs.push({
        id: `jobicy-${j.id}`,
        title: sanitizeText(j.jobTitle),
        companyName: sanitizeText(j.companyName),
        companyLogo: j.companyLogo || undefined,
        location: loc.toLowerCase().includes("anywhere") ? "Worldwide Remote" : loc,
        workplaceType: "remote",
        jobType: Array.isArray(j.jobType) ? j.jobType[0] : j.jobType || "Full-Time",
        salary:
          j.salaryMin && j.salaryMax
            ? `$${j.salaryMin.toLocaleString()} - $${j.salaryMax.toLocaleString()} / yr`
            : undefined,
        salaryMin: j.salaryMin || undefined,
        salaryMax: j.salaryMax || undefined,
        salaryCurrency: j.salaryCurrency || "USD",
        salaryPeriod: j.salaryPeriod || "yearly",
        publishedAt: j.pubDate || new Date().toISOString(),
        jobUrl: j.url,
        tags,
        description: desc,
        matchScore,
        matchedSkills,
        matchReasons,
        source: "jobicy",
        sourceName: "Jobicy Global",
        sourceBadgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        seniorityLevel: detectSeniorityLevel(j.jobTitle),
        geoRegion: detectGeoRegion(loc, tags),
      });
    }
  }

  // 2. Parse Remotive
  if (remotiveRes.status === "fulfilled" && remotiveRes.value?.jobs) {
    for (const r of remotiveRes.value.jobs) {
      const desc = formatJobDescription(r.description || "");
      const loc = sanitizeText(r.candidate_required_location || "Worldwide Remote");
      const tags = Array.isArray(r.tags) ? r.tags : ["Engineering"];

      if (
        !isStrictWorldwideRemote({
          location: loc,
          tags,
          description: desc,
          source: "remotive",
        })
      ) {
        continue;
      }

      const { matchScore, matchedSkills, matchReasons } = computeCalibratedMatchScore(
        r.title,
        desc,
        tags,
        profileContext
      );

      const normalizedLoc =
        loc.toLowerCase().includes("worldwide") || loc.toLowerCase().includes("anywhere")
          ? "Worldwide Remote"
          : `Worldwide Remote (${loc})`;

      jobs.push({
        id: `remotive-${r.id}`,
        title: sanitizeText(r.title),
        companyName: sanitizeText(r.company_name),
        companyLogo: r.company_logo || undefined,
        location: normalizedLoc,
        workplaceType: "remote",
        jobType: r.job_type || "Full-Time",
        salary: r.salary || undefined,
        publishedAt: r.publication_date || new Date().toISOString(),
        jobUrl: r.url,
        tags,
        description: desc,
        matchScore,
        matchedSkills,
        matchReasons,
        source: "remotive",
        sourceName: "Remotive Tech",
        sourceBadgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
        seniorityLevel: detectSeniorityLevel(r.title),
        geoRegion: detectGeoRegion(loc, tags),
      });
    }
  }

  // 3. Parse Arbeitnow
  if (arbeitnowRes.status === "fulfilled" && arbeitnowRes.value?.data) {
    for (const a of arbeitnowRes.value.data) {
      const desc = formatJobDescription(a.description || "");
      const loc = sanitizeText(a.location || (a.remote ? "Europe (Remote)" : "Germany / Europe"));
      const tags = Array.isArray(a.tags) ? a.tags : ["Europe Tech"];

      if (
        !isStrictWorldwideRemote({
          location: loc,
          tags,
          description: desc,
          source: "arbeitnow",
        })
      ) {
        continue;
      }

      const { matchScore, matchedSkills, matchReasons } = computeCalibratedMatchScore(
        a.title,
        desc,
        tags,
        profileContext
      );

      jobs.push({
        id: `arbeitnow-${a.slug || Math.random().toString(36).slice(2, 9)}`,
        title: sanitizeText(a.title),
        companyName: sanitizeText(a.company_name),
        location: "Worldwide Remote",
        workplaceType: "remote",
        jobType: (a.job_types && a.job_types[0]) || "Full-Time",
        publishedAt: a.created_at
          ? new Date(a.created_at * 1000).toISOString()
          : new Date().toISOString(),
        jobUrl: a.url,
        tags,
        description: desc,
        matchScore,
        matchedSkills,
        matchReasons,
        source: "arbeitnow",
        sourceName: "Arbeitnow Europe",
        sourceBadgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        visaSponsorship: Boolean(a.visa_sponsorship),
        seniorityLevel: detectSeniorityLevel(a.title),
        geoRegion: detectGeoRegion(loc, tags),
      });
    }
  }

  // 4. Parse RemoteOK
  if (remoteOkRes.status === "fulfilled" && Array.isArray(remoteOkRes.value)) {
    const rawList = remoteOkRes.value.filter(
      (item: Record<string, unknown>) => item.id && item.position
    );
    for (const ro of rawList.slice(0, 40)) {
      const desc = formatJobDescription(ro.description || "");
      const loc = sanitizeText(ro.location || "Worldwide Remote");
      const tags = Array.isArray(ro.tags) ? ro.tags : ["Startup"];

      if (
        !isStrictWorldwideRemote({
          location: loc,
          tags,
          description: desc,
          source: "remoteok",
        })
      ) {
        continue;
      }

      const { matchScore, matchedSkills, matchReasons } = computeCalibratedMatchScore(
        ro.position,
        desc,
        tags,
        profileContext
      );

      const salaryMin = ro.salary_min ? parseInt(ro.salary_min, 10) : undefined;
      const salaryMax = ro.salary_max ? parseInt(ro.salary_max, 10) : undefined;
      const salaryFormatted =
        salaryMin && salaryMax
          ? `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} / yr`
          : undefined;

      jobs.push({
        id: `remoteok-${ro.id}`,
        title: sanitizeText(ro.position),
        companyName: sanitizeText(ro.company),
        companyLogo: ro.company_logo || ro.logo || undefined,
        location: "Worldwide Remote",
        workplaceType: "remote",
        jobType: "Full-Time",
        salary: salaryFormatted,
        salaryMin,
        salaryMax,
        salaryCurrency: "USD",
        salaryPeriod: "yearly",
        publishedAt: ro.date
          ? new Date(ro.date).toISOString()
          : ro.epoch
          ? new Date(ro.epoch * 1000).toISOString()
          : new Date().toISOString(),
        jobUrl: ro.url || `https://remoteok.com/remote-jobs/${ro.id}`,
        tags,
        description: desc,
        matchScore,
        matchedSkills,
        matchReasons,
        source: "remoteok",
        sourceName: "RemoteOK",
        sourceBadgeColor: "bg-rose-500/10 text-rose-600 border-rose-500/30",
        seniorityLevel: detectSeniorityLevel(ro.position),
        geoRegion: detectGeoRegion(loc, tags),
      });
    }
  }

  // 5. Parse LinkedIn Live Direct Engine
  if (directLinkedInJobs.status === "fulfilled" && Array.isArray(directLinkedInJobs.value)) {
    jobs.push(...directLinkedInJobs.value);
  }

  // Deduplicate jobs by unique ID and jobUrl
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const uniqueJobs: DiscoveredJob[] = [];

  for (const job of jobs) {
    const normalizedUrl = job.jobUrl ? job.jobUrl.toLowerCase().split("?")[0] : "";
    if (seenIds.has(job.id)) continue;
    if (normalizedUrl && seenUrls.has(normalizedUrl)) continue;

    seenIds.add(job.id);
    if (normalizedUrl) seenUrls.add(normalizedUrl);
    uniqueJobs.push(job);
  }

  // Filter by Region if specified
  let filtered = uniqueJobs;
  if (params.geo && params.geo !== "all") {
    if (params.geo === "worldwide") {
      filtered = filtered.filter(
        (job) =>
          job.geoRegion === "worldwide" ||
          job.location.toLowerCase().includes("worldwide") ||
          job.location.toLowerCase().includes("anywhere")
      );
    } else {
      filtered = filtered.filter(
        (job) =>
          job.geoRegion === params.geo || job.location.toLowerCase().includes(params.geo!)
      );
    }
  }

  // Filter by search query if specified
  if (hasUserSearch) {
    const q = userQuery.toLowerCase();
    filtered = filtered.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.companyName.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.tags.some((t) => t.toLowerCase().includes(q)) ||
        job.matchedSkills.some((s) => s.toLowerCase().includes(q))
    );
  }

  // Filter by Platform if specified
  if (hasPlatformFilter && normalizedPlatforms) {
    filtered = filtered.filter((job) => {
      const src = job.source.toLowerCase();
      if (
        normalizedPlatforms.includes("linkedin") &&
        (src === "linkedin" || src === "google_linkedin")
      ) {
        return true;
      }
      return normalizedPlatforms.includes(src);
    });
  }

  // Sort by match score descending, then by newest publication date
  filtered.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return filtered.slice(0, params.limit || 60);
}

/**
 * 1-Click Import discovered global job directly into Career Hub Tracker.
 */
export async function importDiscoveredJobToTracker(job: DiscoveredJob): Promise<string> {
  await assertAdmin();

  const platform = mapJobSourceToPlatform(job.source, job.jobUrl);

  const { id: createdId } = await createApplication({
    companyName: job.companyName,
    companyLogo: job.companyLogo,
    jobTitle: job.title,
    jobUrl: job.jobUrl,
    location: job.location,
    workplaceType: job.workplaceType,
    jobType: "full_time",
    platform,
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
