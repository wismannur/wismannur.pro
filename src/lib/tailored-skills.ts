import type { AtsAnalysis, CompanyIntelligence } from "@/services/job-tracker/types";

export interface RankedSkillItem {
  name: string;
  isMatched: boolean;
  score: number;
  matchReasons: string[];
  originalSortOrder: number;
}

export interface MinimalSkill {
  name: string;
  sortOrder?: number;
}

export interface MinimalJobApplication {
  jobTitle?: string;
  jobDescriptionRaw?: string | null;
  requirements?: string[];
  atsAnalysis?: AtsAnalysis | null;
  companyIntelligence?: CompanyIntelligence | null;
}

const SKILL_ALIASES: Record<string, string[]> = {
  "tailwind css": ["tailwind", "tailwindcss"],
  "tailwindcss": ["tailwind css", "tailwind"],
  "postgresql": ["postgres", "pg"],
  "golang": ["go"],
  "node.js": ["nodejs", "node"],
  "next.js": ["nextjs", "next"],
  "react": ["react.js", "reactjs"],
  "react.js": ["react", "reactjs"],
  "vue": ["vue.js", "vuejs"],
  "vue.js": ["vue", "vuejs"],
  "angular": ["angular.js", "angularjs"],
  "rest api": ["restful", "rest apis", "rest api's", "rest"],
  "ci/cd": ["cicd", "ci / cd", "continuous integration"],
  "amazon web services": ["aws"],
  "aws": ["amazon web services"],
  "google cloud platform": ["gcp", "google cloud"],
  "gcp": ["google cloud platform", "google cloud"],
  "docker": ["containerization", "containers"],
  "kubernetes": ["k8s"],
  "graphql": ["gql"],
  "tanstack query": ["react query"],
  "zustand": ["zustand state management"],
  "framer motion": ["motion"],
  "neon": ["neon serverless", "neon postgres"],
};

/**
 * Extracts searchable search tokens/aliases from any skill name,
 * stripping version numbers, parentheticals, and splitting compound conjunctions.
 * Examples:
 * - "Next.js 16 (App Router)" -> ["next.js 16 (app router)", "next.js 16", "next.js", "nextjs", "next", "app router"]
 * - "React 19" -> ["react 19", "react", "react.js", "reactjs"]
 * - "TypeScript (Strict)" -> ["typescript (strict)", "typescript", "ts"]
 * - "Docker & Containerization" -> ["docker & containerization", "docker", "containerization", "containers"]
 * - "Google Cloud Platform (GCP)" -> ["google cloud platform (gcp)", "google cloud platform", "google cloud", "gcp"]
 * - "GitHub Actions CI/CD" -> ["github actions ci/cd", "github actions", "ci/cd", "cicd"]
 * - "REST & RPC APIs" -> ["rest & rpc apis", "rest api", "rest", "rpc"]
 * - "Zustand State Management" -> ["zustand state management", "zustand"]
 */
export function extractCanonicalSkillTokens(skillName: string): string[] {
  if (!skillName) return [];
  const tokens = new Set<string>();

  const rawLower = skillName.toLowerCase().trim();
  tokens.add(rawLower);

  // 1. Extract content inside parentheses, e.g. "(App Router)" -> "app router", "(GCP)" -> "gcp"
  const parenMatches = rawLower.match(/\(([^)]+)\)/g);
  if (parenMatches) {
    for (const p of parenMatches) {
      const inside = p.replace(/[()]/g, "").trim();
      if (inside.length >= 2) {
        tokens.add(inside);
      }
    }
  }

  // 2. Base name without parentheses: "next.js 16 (app router)" -> "next.js 16"
  const withoutParens = rawLower.replace(/\s*\([^)]+\)/g, "").trim();
  if (withoutParens && withoutParens !== rawLower) {
    tokens.add(withoutParens);
  }

  // 3. Base name without version numbers (e.g. "next.js 16" -> "next.js", "react 19" -> "react")
  const withoutVersion = withoutParens.replace(/\s+\d+(\.\d+)?/g, "").trim();
  if (withoutVersion && withoutVersion.length >= 2) {
    tokens.add(withoutVersion);
  }

  // 4. Split by conjunctions & or / or and (e.g. "Docker & Containerization" -> "docker", "containerization")
  const conjunctionParts = withoutParens.split(/\s*(?:&|\/|\band\b)\s*/i);
  if (conjunctionParts.length > 1) {
    for (const part of conjunctionParts) {
      const cleanPart = part.trim();
      if (cleanPart.length >= 2) {
        tokens.add(cleanPart);
        const strippedTrailing = cleanPart.replace(/\s+(?:apis?|management|tools?)$/i, "").trim();
        if (strippedTrailing.length >= 2) {
          tokens.add(strippedTrailing);
        }
      }
    }
  }

  // 5. Check specific common suffix strippings, e.g. "Zustand State Management" -> "zustand"
  const withoutSuffixes = withoutVersion
    .replace(/\s+(?:state\s+management|framework|library|platform|architecture|tools?)$/i, "")
    .trim();
  if (withoutSuffixes && withoutSuffixes.length >= 2) {
    tokens.add(withoutSuffixes);
  }

  // 6. Look up any known aliases in SKILL_ALIASES for all collected tokens
  for (const token of Array.from(tokens)) {
    const knownAliases = SKILL_ALIASES[token];
    if (knownAliases) {
      for (const a of knownAliases) {
        tokens.add(a.toLowerCase().trim());
      }
    }
  }

  return Array.from(tokens).filter((t) => t.length >= 2 || t === "r" || t === "c");
}

/**
 * Escapes regex characters while preserving word boundary safety.
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Counts occurrences of a token or phrase in a body of text with boundary precision.
 */
function countOccurrences(query: string, targetText: string): number {
  if (!query || !targetText) return 0;
  const escaped = escapeRegex(query.trim());
  if (!escaped) return 0;

  // Use character-boundary regex to prevent partial substring false positives
  // e.g. "go" should not match "good" or "algorithm"
  const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}([^a-zA-Z0-9_]|$)`, "gi");
  const matches = targetText.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Checks if a skill (or its recognized aliases/canonical tokens) appears in target text, returning the match count.
 */
export function countSkillMatchesInText(skillName: string, text: string): number {
  if (!skillName || !text) return 0;

  const tokens = extractCanonicalSkillTokens(skillName);
  let maxMatches = 0;

  for (const token of tokens) {
    const matches = countOccurrences(token, text);
    if (matches > maxMatches) {
      maxMatches = matches;
    }
  }

  return maxMatches;
}

/**
 * Ranks candidate skills according to their relevance to a target job application.
 * Tier 1: Skills explicitly matched in Job Title, Requirements, ATS Matched Keywords,
 *         Company Tech Stack, or Job Description (sorted by relevance score DESC).
 * Tier 2: Supporting candidate skills (sorted by original sort order ASC).
 */
export function rankSkillsForJobApplication(
  skills: MinimalSkill[],
  application: MinimalJobApplication
): RankedSkillItem[] {
  if (!skills || skills.length === 0) return [];

  const jobTitle = application.jobTitle || "";
  const requirements = application.requirements || [];
  const requirementsText = requirements.join(" ");
  const jdRaw = application.jobDescriptionRaw || "";
  const matchedKeywordsLower = new Set(
    (application.atsAnalysis?.matchedKeywords || []).map((k) => k.toLowerCase().trim())
  );
  const detectedTechLower = new Set(
    (application.companyIntelligence?.detectedTechStack || []).map((k) => k.toLowerCase().trim())
  );

  const rankedItems: RankedSkillItem[] = skills.map((skill, index) => {
    const skillName = skill.name.trim();
    const originalSortOrder = typeof skill.sortOrder === "number" ? skill.sortOrder : index;
    const tokens = extractCanonicalSkillTokens(skillName);

    let score = 0;
    const matchReasons: string[] = [];

    // 1. Direct Presence in Job Title (+100)
    const titleMatches = countSkillMatchesInText(skillName, jobTitle);
    if (titleMatches > 0) {
      score += 100 * Math.min(titleMatches, 2);
      matchReasons.push("Target Role Title");
    }

    // 2. ATS Analysis Matched Keywords (+50)
    const hasAtsMatch = tokens.some((t) => matchedKeywordsLower.has(t));
    if (hasAtsMatch) {
      score += 50;
      if (!matchReasons.includes("ATS Matched Keyword")) {
        matchReasons.push("ATS Matched Keyword");
      }
    }

    // 3. Presence in Job Requirements (+40 per requirement match)
    let reqMatchesCount = 0;
    for (const req of requirements) {
      if (countSkillMatchesInText(skillName, req) > 0) {
        reqMatchesCount++;
      }
    }
    if (reqMatchesCount > 0) {
      score += 40 * Math.min(reqMatchesCount, 3);
      matchReasons.push(`In Job Requirements (${reqMatchesCount}x)`);
    } else {
      // Check full requirements joined text as fallback
      const reqTextMatches = countSkillMatchesInText(skillName, requirementsText);
      if (reqTextMatches > 0) {
        score += 35;
        matchReasons.push("In Requirements");
      }
    }

    // 4. Detected Company Tech Stack (+30)
    const hasTechMatch = tokens.some((t) => detectedTechLower.has(t));
    if (hasTechMatch) {
      score += 30;
      matchReasons.push("Company Tech Stack");
    }

    // 5. Frequency in Job Description Raw (+10 per mention, capped at 50)
    const jdMatches = countSkillMatchesInText(skillName, jdRaw);
    if (jdMatches > 0) {
      const jdScore = Math.min(jdMatches * 10, 50);
      score += jdScore;
      matchReasons.push(`Mentioned in JD (${jdMatches}x)`);
    }

    return {
      name: skillName,
      isMatched: score > 0,
      score,
      matchReasons,
      originalSortOrder,
    };
  });

  // Split into Tier 1 (Matched to JD) and Tier 2 (Supporting Master Skills)
  const tier1Matched = rankedItems.filter((item) => item.isMatched);
  const tier2Supporting = rankedItems.filter((item) => !item.isMatched);

  // Tier 1 sorted by score DESC, ties broken by originalSortOrder ASC
  tier1Matched.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.originalSortOrder - b.originalSortOrder;
  });

  // Tier 2 sorted by originalSortOrder ASC
  tier2Supporting.sort((a, b) => a.originalSortOrder - b.originalSortOrder);

  return [...tier1Matched, ...tier2Supporting];
}

/**
 * Returns ordered skill names for export.
 */
export function getTailoredSkillNames(
  skills: MinimalSkill[],
  application: MinimalJobApplication
): string[] {
  return rankSkillsForJobApplication(skills, application).map((item) => item.name);
}
