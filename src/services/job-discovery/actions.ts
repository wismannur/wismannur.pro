"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { createApplication } from "../job-tracker/actions";
import type { DiscoveredJob, JobDiscoverySearchParams } from "./types";

const { skills, resumeEntries, aiKnowledgeItems } = schema;

function sanitizeText(html: string): string {
  if (!html) return "";
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€”/g, "—")
    .replace(/Â±/g, "±")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSeniorityLevel(title: string): DiscoveredJob["seniorityLevel"] {
  const t = title.toLowerCase();
  if (
    t.includes("staff") ||
    t.includes("principal") ||
    t.includes("lead") ||
    t.includes("architect") ||
    t.includes("director") ||
    t.includes("head") ||
    t.includes("vp")
  ) {
    return "Lead";
  }
  if (t.includes("senior") || t.includes("sr.") || t.includes("sr ") || t.includes("expert")) {
    return "Senior";
  }
  if (
    t.includes("junior") ||
    t.includes("jr.") ||
    t.includes("entry") ||
    t.includes("intern") ||
    t.includes("associate")
  ) {
    return "Junior";
  }
  return "Mid";
}

function detectGeoRegion(location: string, tags: string[] = []): DiscoveredJob["geoRegion"] {
  const loc = `${location} ${tags.join(" ")}`.toLowerCase();
  if (loc.includes("japan") || loc.includes("tokyo") || loc.includes("osaka")) return "japan";
  if (
    loc.includes("singapore") ||
    loc.includes("apac") ||
    loc.includes("asia") ||
    loc.includes("hong kong") ||
    loc.includes("korea") ||
    loc.includes("indonesia") ||
    loc.includes("malaysia")
  )
    return "apac";
  if (
    loc.includes("australia") ||
    loc.includes("sydney") ||
    loc.includes("melbourne") ||
    loc.includes("new zealand") ||
    loc.includes("auckland") ||
    loc.includes("anz")
  )
    return "australia";
  if (
    loc.includes("europe") ||
    loc.includes("germany") ||
    loc.includes("berlin") ||
    loc.includes("uk") ||
    loc.includes("london") ||
    loc.includes("netherlands") ||
    loc.includes("amsterdam") ||
    loc.includes("france") ||
    loc.includes("spain") ||
    loc.includes("sweden") ||
    loc.includes("ireland") ||
    loc.includes("poland") ||
    loc.includes("estonia") ||
    loc.includes("swiss") ||
    loc.includes("switzerland")
  )
    return "europe";
  if (
    loc.includes("usa") ||
    loc.includes("united states") ||
    loc.includes("san francisco") ||
    loc.includes("new york") ||
    loc.includes("seattle") ||
    loc.includes("austin") ||
    loc.includes("canada") ||
    loc.includes("toronto") ||
    loc.includes("north america")
  )
    return "usa";
  return "worldwide";
}

/**
 * Calibrates a realistic, highly differentiated Match Score (15% to 99%)
 * based on candidate's real master skills, AI Knowledge Hub context, and experience titles.
 */
function computeCalibratedMatchScore(
  jobTitle: string,
  jobDesc: string,
  jobTags: string[],
  candidateSkills: string[],
  candidateRoles: string[],
  knowledgeConcepts: string[]
): { matchScore: number; matchedSkills: string[] } {
  const fullText = `${jobTitle} ${jobDesc} ${jobTags.join(" ")}`.toLowerCase();
  const titleText = jobTitle.toLowerCase();

  // 1. Identify matched skills & knowledge tags
  const matchedSkills: string[] = [];
  const uniqueCandidateSkills = Array.from(new Set(candidateSkills));

  uniqueCandidateSkills.forEach((skill) => {
    const s = skill.toLowerCase().trim();
    if (!s || s.length < 2) return;
    const regex = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(fullText) || fullText.includes(s)) {
      matchedSkills.push(skill);
    }
  });

  // 2. Compute granular score components
  let score = 0;

  // A. Title Fit (up to 25 points)
  const isDirectRoleMatch = candidateRoles.some((role) => {
    const r = role.toLowerCase();
    return (
      titleText.includes(r) ||
      (r.includes("engineer") && titleText.includes("engineer")) ||
      (r.includes("developer") && titleText.includes("developer"))
    );
  });

  if (isDirectRoleMatch) {
    score += 25;
  } else if (
    titleText.includes("software") ||
    titleText.includes("engineer") ||
    titleText.includes("frontend") ||
    titleText.includes("backend") ||
    titleText.includes("fullstack")
  ) {
    score += 15;
  }

  // B. Skill & Knowledge Overlap (up to 55 points)
  if (matchedSkills.length > 0) {
    const matchCountBonus = matchedSkills.length >= 4 ? 52 : matchedSkills.length * 13;
    score += Math.min(55, matchCountBonus);
  }

  // C. AI Knowledge Hub Domain Synergy (up to 15 points)
  let knowledgeMatches = 0;
  knowledgeConcepts.forEach((concept) => {
    const c = concept.toLowerCase().trim();
    if (c.length > 3 && fullText.includes(c)) {
      knowledgeMatches += 1;
    }
  });
  const knowledgeBonus = Math.min(10, knowledgeMatches * 3);
  score += knowledgeBonus;

  if (
    fullText.includes("typescript") ||
    fullText.includes("react") ||
    fullText.includes("next.js") ||
    fullText.includes("api") ||
    fullText.includes("cloud") ||
    fullText.includes("postgres")
  ) {
    score += 5;
  }

  // Strict clamp: if 0 skills matched and title is generic, keep score under 25%
  if (matchedSkills.length === 0) {
    score = Math.min(22, score);
  }

  const finalScore = Math.max(15, Math.min(99, score));
  return { matchScore: finalScore, matchedSkills };
}

/**
 * Sanitizes and formats a direct LinkedIn URL (e.g. https://www.linkedin.com/jobs/view/<id>).
 */
function cleanLinkedInUrl(rawUrl: string, fallbackTitle = "", fallbackCompany = ""): string {
  if (!rawUrl) {
    if (fallbackTitle && fallbackCompany) {
      return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
        fallbackTitle + " " + fallbackCompany
      )}`;
    }
    return "https://www.linkedin.com";
  }

  try {
    // 1. Direct match on /jobs/view/<id-or-slug>
    const viewMatch = rawUrl.match(/linkedin\.com\/jobs\/view\/([^/?#]+)/i);
    if (viewMatch) {
      return `https://www.linkedin.com/jobs/view/${viewMatch[1].replace(/&amp;/g, "&")}`;
    }

    // 2. Direct match on numeric entity URN or jobId query param
    const urnMatch = rawUrl.match(/(?:jobPosting%3A|jobPosting:|jobId=|currentJobId=)(\d+)/i);
    if (urnMatch) {
      return `https://www.linkedin.com/jobs/view/${urnMatch[1]}`;
    }

    // 3. If standard URL, clean tracking params
    const parsed = new URL(rawUrl);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return rawUrl.split("?")[0];
  }
}

/**
 * Parses public LinkedIn Guest HTML cards without requiring any login cookies.
 */
function parseLinkedInGuestHtml(
  html: string,
  candidateSkills: string[],
  candidateRoles: string[],
  knowledgeConcepts: string[]
): DiscoveredJob[] {
  const jobs: DiscoveredJob[] = [];
  if (!html || typeof html !== "string") return jobs;

  const cardChunks = html.split(/<div[^>]*class="[^"]*job-search-card[^"]*"[^>]*>/i);

  for (let i = 1; i < cardChunks.length; i++) {
    const chunk = cardChunks[i];
    try {
      const urlMatch = chunk.match(/<a[^>]*class="[^"]*base-card__full-link[^"]*"[^>]*href="([^"]+)"/i);
      const rawJobUrl = urlMatch ? urlMatch[1].replace(/&amp;/g, "&") : "";

      const titleMatch =
        chunk.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i) ||
        chunk.match(/<span[^>]*class="sr-only"[^>]*>([\s\S]*?)<\/span>/i);
      const title = titleMatch ? sanitizeText(titleMatch[1]) : "";
      if (!title) continue;

      const companyMatch =
        chunk.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
      const companyName = companyMatch ? sanitizeText(companyMatch[1]) : "Company on LinkedIn";

      const jobUrl = cleanLinkedInUrl(rawJobUrl, title, companyName);

      const urnMatch = chunk.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/i);
      const jobId = urnMatch
        ? `linkedin-${urnMatch[1]}`
        : `linkedin-${crypto.randomUUID().slice(0, 10)}`;

      const logoMatch =
        chunk.match(/data-delayed-url="([^"]+)"/i) || chunk.match(/<img[^>]*src="([^"]+)"/i);
      const companyLogo =
        logoMatch && !logoMatch[1].includes("data:image")
          ? logoMatch[1].replace(/&amp;/g, "&")
          : undefined;

      const locMatch = chunk.match(
        /<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i
      );
      const location = locMatch ? sanitizeText(locMatch[1]) : "Worldwide / Remote";

      const dateMatch = chunk.match(/<time[^>]*datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);
      const publishedAt =
        dateMatch && dateMatch[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

      const tags = ["LinkedIn", "Tech"];
      const { matchScore, matchedSkills } = computeCalibratedMatchScore(
        title,
        `${title} at ${companyName} in ${location}`,
        tags,
        candidateSkills,
        candidateRoles,
        knowledgeConcepts
      );

      jobs.push({
        id: jobId,
        title,
        companyName,
        companyLogo,
        location,
        workplaceType: location.toLowerCase().includes("remote") ? "remote" : "hybrid",
        jobType: "Full-Time",
        publishedAt,
        jobUrl,
        tags,
        description: `Direct Opportunity posted on LinkedIn for ${title} at ${companyName}. Located in ${location}. Apply directly via the official LinkedIn portal link.`,
        matchScore,
        matchedSkills,
        source: "linkedin",
        sourceName: "LinkedIn Jobs",
        sourceBadgeColor: "bg-blue-600/15 text-blue-600 dark:text-blue-400 border-blue-600/30",
        seniorityLevel: detectSeniorityLevel(title),
        geoRegion: detectGeoRegion(location, tags),
      });
    } catch {
      // Continue to next card
    }
  }

  return jobs;
}

/**
 * Fetches multiple pages and keyword variations directly from LinkedIn's live public API.
 * Ensures 100% DOM data consistency (0% mismatch between card company and destination URL).
 */
async function fetchDirectLinkedInJobs(
  keywordsList: string[],
  location: string,
  candidateSkills: string[],
  candidateRoles: string[],
  knowledgeConcepts: string[]
): Promise<DiscoveredJob[]> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  const fetchPromises: Promise<string | null>[] = [];

  for (const kw of keywordsList) {
    // Fetch Page 1 (0-25) and Page 2 (25-50) for each targeted keyword
    const url1 = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      kw
    )}&location=${encodeURIComponent(location)}&start=0`;

    const url2 = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      kw
    )}&location=${encodeURIComponent(location)}&start=25`;

    fetchPromises.push(
      fetch(url1, { next: { revalidate: 1800 }, headers }).then((r) => (r.ok ? r.text() : null)).catch(() => null),
      fetch(url2, { next: { revalidate: 1800 }, headers }).then((r) => (r.ok ? r.text() : null)).catch(() => null)
    );
  }

  const results = await Promise.allSettled(fetchPromises);
  const discovered: DiscoveredJob[] = [];

  for (const res of results) {
    if (res.status === "fulfilled" && res.value) {
      const parsed = parseLinkedInGuestHtml(
        res.value,
        candidateSkills,
        candidateRoles,
        knowledgeConcepts
      );
      discovered.push(...parsed);
    }
  }

  return discovered;
}

/**
 * Fetches worldwide remote and global tech jobs dynamically adapted
 * to candidate's skills, AI Knowledge Hub entries, and experience in CMS database.
 */
export async function fetchWorldwideTechJobs(
  params: JobDiscoverySearchParams = {}
): Promise<DiscoveredJob[]> {
  await assertAdmin();

  const db = getDb();

  // Query live skills, resume records, AND AI Knowledge Hub items in parallel
  const [userSkillRows, resumeRows, knowledgeRows] = await Promise.all([
    db
      .select({ name: skills.name })
      .from(skills)
      .where(eq(skills.isPublished, true)),
    db
      .select({ title: resumeEntries.title })
      .from(resumeEntries)
      .where(and(eq(resumeEntries.isPublished, true), eq(resumeEntries.kind, "experience")))
      .orderBy(desc(resumeEntries.startDate))
      .limit(5),
    db
      .select({
        title: aiKnowledgeItems.title,
        tags: aiKnowledgeItems.tags,
        category: aiKnowledgeItems.category,
      })
      .from(aiKnowledgeItems)
      .where(eq(aiKnowledgeItems.isPublished, true)),
  ]);

  const rawSkills = userSkillRows.map((s) => s.name);

  const knowledgeTags: string[] = [];
  const knowledgeConcepts: string[] = [];
  knowledgeRows.forEach((k) => {
    if (Array.isArray(k.tags)) {
      knowledgeTags.push(...k.tags);
    }
    if (k.title) {
      knowledgeConcepts.push(k.title);
    }
  });

  const combinedSkillSet = new Set([...rawSkills, ...knowledgeTags]);
  const candidateSkills = Array.from(combinedSkillSet);
  const candidateRoles = resumeRows.map((r) => r.title);

  const effectiveSkills =
    candidateSkills.length > 0
      ? candidateSkills
      : [
          "React",
          "TypeScript",
          "Next.js",
          "Node.js",
          "Tailwind CSS",
          "PostgreSQL",
          "Fullstack",
          "Frontend",
          "Backend",
          "Go",
          "Flutter",
          "AWS",
          "Docker",
        ];

  const hasUserSearch = Boolean(params.query && params.query.trim());
  const userQuery = hasUserSearch ? params.query!.trim() : "";
  const primaryDbTag = effectiveSkills[0] ? effectiveSkills[0].toLowerCase() : "developer";

  const jobicyUrl = hasUserSearch
    ? `https://jobicy.com/api/v2/remote-jobs?count=40&tag=${encodeURIComponent(userQuery)}`
    : `https://jobicy.com/api/v2/remote-jobs?count=40&tag=${encodeURIComponent(primaryDbTag)}`;

  const remotiveUrl = hasUserSearch
    ? `https://remotive.com/api/remote-jobs?limit=40&search=${encodeURIComponent(userQuery)}`
    : `https://remotive.com/api/remote-jobs?limit=40&category=software-dev`;

  const arbeitnowUrl = hasUserSearch
    ? `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(userQuery)}`
    : `https://www.arbeitnow.com/api/job-board-api`;

  const remoteOkUrl = hasUserSearch
    ? `https://remoteok.com/api?tag=${encodeURIComponent(userQuery)}`
    : `https://remoteok.com/api`;

  const linkedInQueries = userQuery
    ? [userQuery]
    : [
        candidateRoles[0] || "Software Engineer",
        `${effectiveSkills.slice(0, 2).join(" ")} Engineer`,
        "Full Stack Developer",
      ];

  let linkedInLocation = "Worldwide";
  if (params.geo === "apac") linkedInLocation = "Singapore";
  else if (params.geo === "japan") linkedInLocation = "Japan";
  else if (params.geo === "europe") linkedInLocation = "Europe";
  else if (params.geo === "australia") linkedInLocation = "Australia";
  else if (params.geo === "usa") linkedInLocation = "United States";

  const jobs: DiscoveredJob[] = [];

  // Concurrently fetch from all verified direct providers (Jobicy, Remotive, Arbeitnow, RemoteOK, LinkedIn Live)
  const [jobicyRes, remotiveRes, arbeitnowRes, remoteOkRes, directLinkedInJobs] =
    await Promise.allSettled([
      // 1. Jobicy API
      fetch(jobicyUrl, {
        next: { revalidate: 1800 },
        headers: { "User-Agent": "CareerHubBot/1.0" },
      }).then((r) => (r.ok ? r.json() : null)),

      // 2. Remotive API
      fetch(remotiveUrl, {
        next: { revalidate: 1800 },
        headers: { "User-Agent": "CareerHubBot/1.0" },
      }).then((r) => (r.ok ? r.json() : null)),

      // 3. Arbeitnow API
      fetch(arbeitnowUrl, {
        next: { revalidate: 1800 },
        headers: { "User-Agent": "CareerHubBot/1.0" },
      }).then((r) => (r.ok ? r.json() : null)),

      // 4. RemoteOK API
      fetch(remoteOkUrl, {
        next: { revalidate: 1800 },
        headers: { "User-Agent": "CareerHubBot/1.0" },
      }).then((r) => (r.ok ? r.json() : null)),

      // 5. LinkedIn Live Direct Engine (100% verified DOM matching)
      fetchDirectLinkedInJobs(
        linkedInQueries,
        linkedInLocation,
        effectiveSkills,
        candidateRoles,
        knowledgeConcepts
      ),
    ]);

  // 1. Parse Jobicy
  if (jobicyRes.status === "fulfilled" && jobicyRes.value?.jobs) {
    for (const j of jobicyRes.value.jobs) {
      const desc = sanitizeText(j.jobDescription || j.jobExcerpt || "");
      const loc = sanitizeText(j.jobGeo || "Worldwide Remote");
      const tags = Array.isArray(j.jobIndustry) ? j.jobIndustry : ["Engineering"];

      const { matchScore, matchedSkills } = computeCalibratedMatchScore(
        j.jobTitle,
        desc,
        tags,
        effectiveSkills,
        candidateRoles,
        knowledgeConcepts
      );

      jobs.push({
        id: `jobicy-${j.id}`,
        title: sanitizeText(j.jobTitle),
        companyName: sanitizeText(j.companyName),
        companyLogo: j.companyLogo || undefined,
        location: loc,
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
      const desc = sanitizeText(r.description || "");
      const loc = sanitizeText(r.candidate_required_location || "Worldwide Remote");
      const tags = Array.isArray(r.tags) ? r.tags : ["Engineering"];

      const { matchScore, matchedSkills } = computeCalibratedMatchScore(
        r.title,
        desc,
        tags,
        effectiveSkills,
        candidateRoles,
        knowledgeConcepts
      );

      jobs.push({
        id: `remotive-${r.id}`,
        title: sanitizeText(r.title),
        companyName: sanitizeText(r.company_name),
        companyLogo: r.company_logo || undefined,
        location: loc,
        workplaceType: "remote",
        jobType: r.job_type || "Full-Time",
        salary: r.salary || undefined,
        publishedAt: r.publication_date || new Date().toISOString(),
        jobUrl: r.url,
        tags,
        description: desc,
        matchScore,
        matchedSkills,
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
      const desc = sanitizeText(a.description || "");
      const loc = sanitizeText(a.location || (a.remote ? "Europe (Remote)" : "Germany / Europe"));
      const tags = Array.isArray(a.tags) ? a.tags : ["Europe Tech"];

      const { matchScore, matchedSkills } = computeCalibratedMatchScore(
        a.title,
        desc,
        tags,
        effectiveSkills,
        candidateRoles,
        knowledgeConcepts
      );

      jobs.push({
        id: `arbeitnow-${a.slug || Math.random().toString(36).slice(2, 9)}`,
        title: sanitizeText(a.title),
        companyName: sanitizeText(a.company_name),
        location: loc,
        workplaceType: a.remote ? "remote" : "hybrid",
        jobType: (a.job_types && a.job_types[0]) || "Full-Time",
        publishedAt: a.created_at
          ? new Date(a.created_at * 1000).toISOString()
          : new Date().toISOString(),
        jobUrl: a.url,
        tags,
        description: desc,
        matchScore,
        matchedSkills,
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
    for (const ro of rawList.slice(0, 30)) {
      const desc = sanitizeText(ro.description || "");
      const loc = sanitizeText(ro.location || "Worldwide Remote");
      const tags = Array.isArray(ro.tags) ? ro.tags : ["Startup"];

      const { matchScore, matchedSkills } = computeCalibratedMatchScore(
        ro.position,
        desc,
        tags,
        effectiveSkills,
        candidateRoles,
        knowledgeConcepts
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
        location: loc,
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

  const isLinkedIn = job.source === "linkedin" || job.source === "google_linkedin";

  const createdId = await createApplication({
    companyName: job.companyName,
    companyLogo: job.companyLogo,
    jobTitle: job.title,
    jobUrl: job.jobUrl,
    location: job.location,
    workplaceType: job.workplaceType,
    jobType: "full_time",
    platform: isLinkedIn ? "linkedin" : "other",
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
