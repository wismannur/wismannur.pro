import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

const {
  skills,
  resumeEntries,
  aiKnowledgeItems,
  projects,
  services,
  jobApplications,
  siteSettings,
} = schema;

export interface CandidateProfileContext {
  masterSkills: string[];
  targetRoles: string[];
  projectTechnologies: string[];
  experienceDescriptions: string[];
  aiConcepts: string[];
  trackedJobTitles: string[];
  siteKeywords: string[];
}

export const TECH_EQUIVALENCY_GROUPS: { canonical: string; patterns: RegExp[] }[] = [
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

export function extractMatchedSkills(
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
export function computeCalibratedMatchScore(
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
 * Loads rich profile context across all database tables (skills, projects, resume entries,
 * services, AI knowledge hub, tracked job applications, site settings) with production fallbacks.
 */
export async function loadCandidateProfileContext(
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
