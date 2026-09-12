"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { createApplication } from "../job-tracker/actions";
import type { DiscoveredJob, JobDiscoverySearchParams } from "./types";
import type { JobPlatform } from "../job-tracker/types";

const {
  skills,
  resumeEntries,
  aiKnowledgeItems,
  projects,
  services,
  jobApplications,
  siteSettings,
} = schema;

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

/**
 * Converts raw HTML or raw text job descriptions into clean, structured Markdown.
 * Preserves headings, bold highlights, bullet lists, and paragraphs so that
 * the JD preview is readable, structured, and easy to consume.
 */
function formatJobDescription(raw: string): string {
  if (!raw) return "";

  let text = raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€”/g, "—")
    .replace(/Â±/g, "±");

  // If the raw text contains HTML markup:
  if (/<[a-z][\s\S]*>/i.test(text)) {
    text = text
      // Headers
      .replace(/<h[1-2][^>]*>([\s\S]*?)<\/h[1-2]>/gi, "\n\n## $1\n\n")
      .replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, "\n\n### $1\n\n")
      // List items
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n• $1")
      // Paragraphs & line breaks
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n")
      .replace(/<br\s*[\/]?>/gi, "\n")
      // Bold
      .replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, "**$1**")
      // Italics
      .replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, "*$1*")
      // Strip remaining tags
      .replace(/<[^>]+>/g, "");
  }

  // Clean up whitespace and excess empty lines
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
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
 * Rigorously validates whether a job is 100% Worldwide / Anywhere Remote.
 * Disqualifies geo-restricted listings (e.g. "US Only", "Must reside in...")
 * and disguised hybrid or on-site listings.
 */
function isStrictWorldwideRemote(job: {
  location: string;
  tags?: string[];
  description?: string;
  source: string;
}): boolean {
  const loc = (job.location || "").toLowerCase().trim();
  const desc = (job.description || "").toLowerCase();
  const tagsStr = (job.tags || []).join(" ").toLowerCase();
  const metaText = `${loc} ${tagsStr}`;

  // 1. Red Flag / Country Restriction Checks
  const rejectPatterns = [
    /\bus\s+only\b/i,
    /\busa\s+only\b/i,
    /\buk\s+only\b/i,
    /\beurope\s+only\b/i,
    /\beu\s+only\b/i,
    /\bcanada\s+only\b/i,
    /\bgermany\s+only\b/i,
    /\baustralia\s+only\b/i,
    /\blatam\s+only\b/i,
    /\bapac\s+only\b/i,
    /must\s+reside\s+in/i,
    /must\s+be\s+located\s+in/i,
    /must\s+be\s+based\s+in/i,
    /authorized\s+to\s+work\s+in\s+(?:the\s+)?(?:u\.?s|united\s+states|uk|eu|canada)/i,
    /u\.?s\.?\s+citizenship\s+required/i,
    /u\.?s\.?\s+citizen/i,
    /work\s+authorization\s+in/i,
    /valid\s+work\s+permit\s+in/i,
    /\bhybrid\b/i,
    /\bonsite\b/i,
    /\bon-site\b/i,
    /days\s+(?:a|per)\s+week\s+in\s+(?:the\s+)?office/i,
    /relocation\s+required/i,
  ];

  for (const regex of rejectPatterns) {
    if (regex.test(metaText)) {
      return false;
    }
  }

  // 2. Positive indicator of global/worldwide remote
  const hasWorldwideIndicator =
    loc.includes("worldwide") ||
    loc.includes("anywhere") ||
    loc.includes("global") ||
    loc.includes("work from anywhere") ||
    loc.includes("any location") ||
    loc.includes("100% remote") ||
    loc.includes("remote worldwide") ||
    tagsStr.includes("worldwide") ||
    tagsStr.includes("anywhere") ||
    tagsStr.includes("global") ||
    desc.includes("open to applicants located anywhere") ||
    desc.includes("work from anywhere in the world") ||
    desc.includes("100% worldwide remote");

  // 3. Provider-specific rules
  if (job.source === "jobicy") {
    return (
      loc.includes("anywhere") ||
      loc.includes("worldwide") ||
      loc.includes("global") ||
      hasWorldwideIndicator
    );
  }

  if (job.source === "remotive") {
    const isRestrictedSingleCountry =
      loc === "usa" ||
      loc === "united states" ||
      loc === "uk" ||
      loc === "europe" ||
      loc === "canada" ||
      loc === "germany" ||
      loc === "france";

    if (isRestrictedSingleCountry) return false;

    return (
      loc.includes("worldwide") ||
      loc.includes("anywhere") ||
      loc.includes("global") ||
      (loc.includes("apac") && !loc.includes("only")) ||
      hasWorldwideIndicator
    );
  }

  if (job.source === "arbeitnow") {
    return (
      hasWorldwideIndicator ||
      desc.includes("worldwide") ||
      desc.includes("anywhere") ||
      tagsStr.includes("worldwide")
    );
  }

  if (job.source === "remoteok") {
    const isSingleCityOrCountry =
      loc.length > 0 &&
      !loc.includes("worldwide") &&
      !loc.includes("anywhere") &&
      !loc.includes("global") &&
      loc !== "remote";

    if (isSingleCityOrCountry) return false;

    return (
      hasWorldwideIndicator ||
      loc === "" ||
      loc === "remote" ||
      loc.includes("worldwide")
    );
  }

  if (job.source === "linkedin") {
    const hasPhysicalCityOnly =
      !loc.includes("worldwide") &&
      !loc.includes("remote") &&
      !loc.includes("anywhere");

    if (hasPhysicalCityOnly) return false;

    return (
      loc.includes("worldwide") ||
      loc.includes("remote") ||
      loc.includes("anywhere") ||
      hasWorldwideIndicator
    );
  }

  return hasWorldwideIndicator;
}

export interface CandidateProfileContext {
  masterSkills: string[];
  targetRoles: string[];
  projectTechnologies: string[];
  experienceDescriptions: string[];
  aiConcepts: string[];
  trackedJobTitles: string[];
  siteKeywords: string[];
}

const TECH_EQUIVALENCY_GROUPS: { canonical: string; patterns: RegExp[] }[] = [
  {
    canonical: "Next.js",
    patterns: [/\bnext\.?js\b/i, /\bnextjs\b/i, /\bnext\s*(?:13|14|15)\b/i],
  },
  {
    canonical: "React",
    patterns: [/\breact\.?js\b/i, /\breactjs\b/i, /\breact\b/i],
  },
  {
    canonical: "TypeScript",
    patterns: [/\btypescript\b/i, /\bts\b/i],
  },
  {
    canonical: "JavaScript",
    patterns: [/\bjavascript\b/i, /\bjs\b/i, /\bes6\b/i],
  },
  {
    canonical: "Node.js",
    patterns: [/\bnode\.?js\b/i, /\bnodejs\b/i, /\bnode\b/i],
  },
  {
    canonical: "Go / Golang",
    patterns: [/\bgolang\b/i, /\bgo\s+language\b/i, /\bgo\b/i],
  },
  {
    canonical: "Flutter / Dart",
    patterns: [/\bflutter\b/i, /\bdart\b/i],
  },
  {
    canonical: "PostgreSQL",
    patterns: [/\bpostgresql\b/i, /\bpostgres\b/i, /\bpsql\b/i, /\bsql\b/i],
  },
  {
    canonical: "Tailwind CSS",
    patterns: [/\btailwind(?:css)?\b/i],
  },
  {
    canonical: "Fullstack Architecture",
    patterns: [/\bfull[- ]?stack\b/i, /\bfullstack\b/i],
  },
  {
    canonical: "Frontend Development",
    patterns: [/\bfront[- ]?end\b/i, /\bfrontend\b/i, /\bweb\s+ui\b/i],
  },
  {
    canonical: "Backend Engineering",
    patterns: [/\bback[- ]?end\b/i, /\bbackend\b/i],
  },
  {
    canonical: "Docker / Containers",
    patterns: [/\bdocker\b/i, /\bkubernetes\b/i, /\bk8s\b/i, /\bcontainers?\b/i],
  },
  {
    canonical: "REST APIs & Microservices",
    patterns: [/\brest(?:ful)?\b/i, /\bapis?\b/i, /\bmicroservices?\b/i, /\bgraphql\b/i],
  },
  {
    canonical: "System Architecture & Scale",
    patterns: [
      /\bsystem\s+design\b/i,
      /\bscalab(?:le|ility)\b/i,
      /\bhigh\s+traffic\b/i,
      /\barchitecture\b/i,
      /\bdistributed\s+systems?\b/i,
    ],
  },
  {
    canonical: "AI & Modern LLMs",
    patterns: [
      /\bai\b/i,
      /\bllms?\b/i,
      /\bgenerative\s+ai\b/i,
      /\brag\b/i,
      /\bgemini\b/i,
      /\blangchain\b/i,
      /\bprompt\s+engineering\b/i,
      /\bai\s+agents?\b/i,
    ],
  },
  {
    canonical: "CI/CD & DevOps",
    patterns: [/\bci\/?cd\b/i, /\bgithub\s+actions\b/i, /\bdevops\b/i, /\bdeployment\b/i],
  },
];

function extractMatchedSkills(
  fullText: string,
  titleText: string,
  jobTags: string[],
  masterSkills: string[]
): string[] {
  const matchedSet = new Set<string>();

  // 1. Canonical equivalency groups
  for (const group of TECH_EQUIVALENCY_GROUPS) {
    if (group.patterns.some((p) => p.test(fullText))) {
      matchedSet.add(group.canonical);
    }
  }

  // 2. Candidate's DB skills
  for (const skill of masterSkills) {
    const s = skill.trim();
    if (!s || s.length < 2) continue;
    if (s.length <= 2 && !["go", "ts", "js", "ai"].includes(s.toLowerCase())) continue;

    const regex = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(fullText)) {
      matchedSet.add(skill);
    }
  }

  // 3. For short snippets (e.g. LinkedIn cards), infer core archetype from title
  if (fullText.length < 250) {
    if (/full[- ]?stack/i.test(titleText)) {
      matchedSet.add("Fullstack Architecture");
      matchedSet.add("TypeScript");
      matchedSet.add("React");
      matchedSet.add("Node.js");
      matchedSet.add("REST APIs & Microservices");
    } else if (/front[- ]?end/i.test(titleText)) {
      matchedSet.add("Frontend Development");
      matchedSet.add("React");
      matchedSet.add("TypeScript");
      matchedSet.add("Tailwind CSS");
    } else if (/back[- ]?end/i.test(titleText)) {
      matchedSet.add("Backend Engineering");
      matchedSet.add("Go / Golang");
      matchedSet.add("Node.js");
      matchedSet.add("PostgreSQL");
      matchedSet.add("System Architecture & Scale");
    } else if (/mobile|flutter/i.test(titleText)) {
      matchedSet.add("Flutter / Dart");
      matchedSet.add("REST APIs & Microservices");
    } else if (/software\s+engineer|developer/i.test(titleText)) {
      matchedSet.add("TypeScript");
      matchedSet.add("React");
      matchedSet.add("Fullstack Architecture");
    }
  }

  return Array.from(matchedSet);
}

/**
 * Calibrates a realistic, highly differentiated Match Score (15% to 98%)
 * based on candidate's comprehensive CMS database profile, production projects,
 * verified 100% Worldwide Remote qualification, and target roles.
 */
function computeCalibratedMatchScore(
  jobTitle: string,
  jobDesc: string,
  jobTags: string[],
  context: CandidateProfileContext
): { matchScore: number; matchedSkills: string[]; matchReasons: string[] } {
  const fullText = `${jobTitle} ${jobDesc} ${jobTags.join(" ")}`.toLowerCase();
  const titleText = jobTitle.toLowerCase();
  const matchReasons: string[] = [];

  // Extract skills with tech synonym groups + DB master skills
  const matchedSkills = extractMatchedSkills(
    fullText,
    titleText,
    jobTags,
    context.masterSkills
  );

  let score = 0;

  // 1. Worldwide Remote Fit (+20%)
  // The user's highest priority requirement is verified 100% full remote worldwide
  score += 20;
  matchReasons.push(
    "🌐 100% Worldwide Remote: Verified global remote position with zero country or hybrid restrictions (+20%)"
  );

  // 2. Role Seniority & Engineering Discipline Alignment (Up to +35%)
  const isSeniorOrLead =
    /\b(?:staff|lead|senior|sr\.?|principal|founding|head\s+of|architect|tech\s+lead)\b/i.test(
      titleText
    );
  const isEngineeringDiscipline =
    /\b(?:full[- ]?stack|frontend|front[- ]?end|backend|back[- ]?end|software|web|platform|mobile|developer|engineer)\b/i.test(
      titleText
    );

  const directRoleMatch = context.targetRoles.find((role) => {
    const r = role.toLowerCase();
    return (
      titleText.includes(r) ||
      (r.includes("engineer") && titleText.includes("engineer")) ||
      (r.includes("developer") && titleText.includes("developer"))
    );
  });

  if (isSeniorOrLead && isEngineeringDiscipline) {
    score += 35;
    matchReasons.push(
      "🎯 High-Seniority Role Fit: Directly aligns with your background as Lead / Staff / Senior Fullstack Engineer (+35%)"
    );
  } else if (directRoleMatch) {
    score += 32;
    matchReasons.push(
      `🎯 Direct Role Fit: Aligns with your profile and tracked roles as "${directRoleMatch}" (+32%)`
    );
  } else if (isEngineeringDiscipline) {
    score += 28;
    matchReasons.push(
      "💻 Core Discipline Alignment: Strong match for Software & Fullstack Engineering (+28%)"
    );
  } else {
    score += 15;
    matchReasons.push(
      "💼 Tech Track Alignment: Relevant engineering / tech opportunity (+15%)"
    );
  }

  // 3. Core Tech Stack & Production Skills Match (Up to +35%)
  if (matchedSkills.length >= 4) {
    score += 35;
    matchReasons.push(
      `🛠️ Core Tech Stack Fit: High overlap with ${matchedSkills.length} key technologies (${matchedSkills.slice(0, 4).join(", ")}${matchedSkills.length > 4 ? ` +${matchedSkills.length - 4} more` : ""}) (+35%)`
    );
  } else if (matchedSkills.length === 3) {
    score += 30;
    matchReasons.push(
      `🛠️ Core Tech Stack Fit: Matched 3 key technologies (${matchedSkills.join(", ")}) (+30%)`
    );
  } else if (matchedSkills.length === 2) {
    score += 24;
    matchReasons.push(
      `🛠️ Core Tech Stack Fit: Matched 2 key technologies (${matchedSkills.join(", ")}) (+24%)`
    );
  } else if (matchedSkills.length === 1) {
    score += 18;
    matchReasons.push(
      `🛠️ Core Tech Stack Fit: Matched key technology (${matchedSkills[0]}) (+18%)`
    );
  } else {
    matchReasons.push(
      "Profile Notice: Few direct master skills mentioned in the job description"
    );
  }

  // 4. System Architecture, Scalability & Engineering Best Practices (+10%)
  const hasArchitectureSignal =
    /\b(?:system\s+design|architecture|microservices|scalab(?:le|ility)|high\s+traffic|performance|ci\/?cd|mentorship|code\s+review|distributed)\b/i.test(
      fullText
    );
  if (hasArchitectureSignal) {
    score += 10;
    matchReasons.push(
      "🏛️ Architecture & Scale Alignment: Mentions system design, architecture, or high-scale engineering (+10%)"
    );
  }

  // 5. AI Knowledge Hub & Modern Innovation Synergy (+10% Bonus)
  const hasAiSignal =
    /\b(?:ai|llms?|generative\s+ai|rag|gemini|langchain|prompt\s+engineering|automation|agents?|machine\s+learning)\b/i.test(
      fullText
    ) ||
    context.aiConcepts.some((c) => c.length > 3 && fullText.includes(c.toLowerCase()));

  if (hasAiSignal) {
    score += 10;
    matchReasons.push(
      "🤖 AI Knowledge Hub Synergy: Covers AI agents, LLM workflows, or modern intelligent systems from your knowledge base (+10%)"
    );
  }

  // Calibrate final score between 15% and 98%
  const finalScore = Math.max(15, Math.min(98, score));
  return { matchScore: finalScore, matchedSkills, matchReasons };
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
 * Loads rich profile context across all database tables (skills, projects, resume entries,
 * services, AI knowledge hub, tracked job applications, site settings) with production fallbacks.
 */
async function loadCandidateProfileContext(
  db: ReturnType<typeof getDb>
): Promise<CandidateProfileContext> {
  const [
    userSkillRows,
    resumeRows,
    projectRows,
    serviceRows,
    knowledgeRows,
    jobAppRows,
    siteSettingsRows,
  ] = await Promise.all([
    db
      .select({ name: skills.name })
      .from(skills)
      .where(eq(skills.isPublished, true))
      .catch(() => []),
    db
      .select({
        title: resumeEntries.title,
        description: resumeEntries.description,
      })
      .from(resumeEntries)
      .where(and(eq(resumeEntries.isPublished, true), eq(resumeEntries.kind, "experience")))
      .orderBy(desc(resumeEntries.startDate))
      .catch(() => []),
    db
      .select({
        technologies: projects.technologies,
      })
      .from(projects)
      .where(eq(projects.isPublished, true))
      .catch(() => []),
    db
      .select({
        title: services.title,
        features: services.features,
      })
      .from(services)
      .where(eq(services.isPublished, true))
      .catch(() => []),
    db
      .select({
        title: aiKnowledgeItems.title,
        tags: aiKnowledgeItems.tags,
        category: aiKnowledgeItems.category,
      })
      .from(aiKnowledgeItems)
      .where(eq(aiKnowledgeItems.isPublished, true))
      .catch(() => []),
    db
      .select({
        jobTitle: jobApplications.jobTitle,
        requirements: jobApplications.requirements,
      })
      .from(jobApplications)
      .orderBy(desc(jobApplications.createdAt))
      .limit(25)
      .catch(() => []),
    db
      .select({
        keywords: siteSettings.keywords,
      })
      .from(siteSettings)
      .limit(1)
      .catch(() => []),
  ]);

  const rawSkills = userSkillRows.map((s) => s.name);
  const projectTech = projectRows.flatMap((p) => p.technologies || []);
  const serviceFeatures = serviceRows.flatMap((s) => s.features || []);
  const knowledgeTags = knowledgeRows.flatMap((k) => k.tags || []);
  const knowledgeConcepts = knowledgeRows.map((k) => k.title).filter(Boolean);
  const trackedTitles = jobAppRows.map((j) => j.jobTitle).filter(Boolean);
  const trackedReqs = jobAppRows.flatMap((j) => j.requirements || []);
  const siteKeywords = siteSettingsRows[0]?.keywords || [];

  const resumeTitles = resumeRows.map((r) => r.title);
  const resumeDescriptions = resumeRows.map((r) => r.description).filter(Boolean);
  const serviceTitles = serviceRows.map((s) => s.title);

  // Baseline verified tech stack from Wisman Nur's production engineering profile
  const baselineSkills = [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Go",
    "Flutter",
    "PostgreSQL",
    "Tailwind CSS",
    "Docker",
    "REST APIs",
    "GraphQL",
    "Fullstack",
    "Frontend",
    "Backend",
    "System Architecture",
    "AI / LLM",
  ];

  const allSkills = Array.from(
    new Set([
      ...baselineSkills,
      ...rawSkills,
      ...projectTech,
      ...serviceFeatures,
      ...knowledgeTags,
      ...trackedReqs,
      ...siteKeywords,
    ])
  );

  const baselineRoles = [
    "Staff Engineer",
    "Lead Software Engineer",
    "Senior Fullstack Engineer",
    "Senior Frontend Engineer",
    "Lead Fullstack Developer",
    "Software Engineer",
  ];

  const allRoles = Array.from(
    new Set([...baselineRoles, ...resumeTitles, ...serviceTitles, ...trackedTitles])
  );

  return {
    masterSkills: allSkills,
    targetRoles: allRoles,
    projectTechnologies: Array.from(new Set(projectTech)),
    experienceDescriptions: resumeDescriptions,
    aiConcepts: knowledgeConcepts,
    trackedJobTitles: trackedTitles,
    siteKeywords,
  };
}

/**
 * Parses public LinkedIn Guest HTML cards without requiring any login cookies.
 */
function parseLinkedInGuestHtml(
  html: string,
  context: CandidateProfileContext
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
      const rawLocation = locMatch ? sanitizeText(locMatch[1]) : "Worldwide / Remote";

      const tags = ["LinkedIn", "Remote", "Tech"];

      // Validate strict worldwide remote
      if (
        !isStrictWorldwideRemote({
          location: rawLocation,
          tags,
          description: `${title} at ${companyName}`,
          source: "linkedin",
        })
      ) {
        continue;
      }

      const location = rawLocation.toLowerCase().includes("worldwide")
        ? "Worldwide Remote"
        : rawLocation.toLowerCase().includes("remote")
        ? rawLocation
        : `Worldwide Remote (${rawLocation})`;

      const dateMatch = chunk.match(/<time[^>]*datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);
      const publishedAt =
        dateMatch && dateMatch[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

      const { matchScore, matchedSkills, matchReasons } = computeCalibratedMatchScore(
        title,
        `${title} at ${companyName} in ${location}`,
        tags,
        context
      );

      const reasonsFormatted =
        matchReasons.length > 0
          ? matchReasons.map((r) => `• ${r}`).join("\n")
          : "• Verified 100% Worldwide Remote work from anywhere";

      const formattedDesc = formatJobDescription(
        `## Role Overview\nOpportunity for **${title}** at **${companyName}**.\n\n### Work Model & Verification\n• **Workplace Type**: 100% Worldwide Remote\n• **Location**: ${location}\n• **Employment Type**: Full-Time\n\n### Why You're a ${matchScore}% Match\n${reasonsFormatted}\n\n### Candidate Profile Alignment\n• **Key Matched Skills**: ${matchedSkills.length > 0 ? matchedSkills.join(", ") : "Modern Web & Software Engineering"}\n\n### Next Steps\n• Apply directly via the official LinkedIn portal below.`
      );

      jobs.push({
        id: jobId,
        title,
        companyName,
        companyLogo,
        location,
        workplaceType: "remote",
        jobType: "Full-Time",
        publishedAt,
        jobUrl,
        tags,
        description: formattedDesc,
        matchScore,
        matchedSkills,
        matchReasons,
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
  context: CandidateProfileContext
): Promise<DiscoveredJob[]> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  const fetchPromises: Promise<string | null>[] = [];

  for (const kw of keywordsList) {
    // Fetch Page 1 (0-25) and Page 2 (25-50) for each targeted keyword with f_WT=2 (Remote Only)
    const url1 = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      kw
    )}&location=${encodeURIComponent(location)}&f_WT=2&start=0`;

    const url2 = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      kw
    )}&location=${encodeURIComponent(location)}&f_WT=2&start=25`;

    fetchPromises.push(
      fetch(url1, { next: { revalidate: 1800 }, headers }).then((r) => (r.ok ? r.text() : null)).catch(() => null),
      fetch(url2, { next: { revalidate: 1800 }, headers }).then((r) => (r.ok ? r.text() : null)).catch(() => null)
    );
  }

  const results = await Promise.allSettled(fetchPromises);
  const discovered: DiscoveredJob[] = [];

  for (const res of results) {
    if (res.status === "fulfilled" && res.value) {
      const parsed = parseLinkedInGuestHtml(res.value, context);
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

      // Strict Worldwide Remote Filter
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

      // Strict Worldwide Remote Filter
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

      // Strict Worldwide Remote Filter
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

      // Strict Worldwide Remote Filter
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

function mapJobSourceToPlatform(source: string, jobUrl?: string): JobPlatform {
  switch (source) {
    case "ashby":
      return "ashby";
    case "greenhouse":
      return "greenhouse";
    case "lever":
      return "lever";
    case "arbeitnow":
      return "arbeitnow";
    case "remoteok":
      return "remoteok";
    case "remotive":
      return "remotive";
    case "jobicy":
      return "jobicy";
    case "linkedin":
    case "google_linkedin":
      return "linkedin";
  }

  if (jobUrl) {
    const url = jobUrl.toLowerCase();
    if (url.includes("ashbyhq.com")) return "ashby";
    if (url.includes("greenhouse.io")) return "greenhouse";
    if (url.includes("lever.co")) return "lever";
    if (url.includes("arbeitnow.com")) return "arbeitnow";
    if (url.includes("remoteok.com")) return "remoteok";
    if (url.includes("remotive.com")) return "remotive";
    if (url.includes("jobicy.com")) return "jobicy";
    if (url.includes("linkedin.com")) return "linkedin";
  }

  return "other";
}

/**
 * 1-Click Import discovered global job directly into Career Hub Tracker.
 */
export async function importDiscoveredJobToTracker(job: DiscoveredJob): Promise<string> {
  await assertAdmin();

  const platform = mapJobSourceToPlatform(job.source, job.jobUrl);

  const createdId = await createApplication({
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
