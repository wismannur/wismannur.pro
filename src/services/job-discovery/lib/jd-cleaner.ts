import type { DiscoveredJob } from "../types";

export function sanitizeText(html: string): string {
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
export function formatJobDescription(raw: string): string {
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

export function detectSeniorityLevel(title: string): DiscoveredJob["seniorityLevel"] {
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

export function detectGeoRegion(location: string, tags: string[] = []): DiscoveredJob["geoRegion"] {
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
export function isStrictWorldwideRemote(job: {
  location: string;
  tags?: string[];
  description?: string;
  source?: string;
}): boolean {
  const loc = (job.location || "").toLowerCase().trim();
  const desc = (job.description || "").toLowerCase();
  const tagsStr = (job.tags || []).join(" ").toLowerCase();
  const metaText = `${loc} ${tagsStr} ${desc.slice(0, 700)}`;

  // 1. Explicit rejection triggers
  const rejectPatterns = [
    /us\s+only/i,
    /u\.s\.\s+only/i,
    /usa\s+only/i,
    /united\s+states\s+only/i,
    /north\s+america\s+only/i,
    /canada\s+only/i,
    /europe\s+only/i,
    /uk\s+only/i,
    /latam\s+only/i,
    /apac\s+only/i,
    /australia\s+only/i,
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
