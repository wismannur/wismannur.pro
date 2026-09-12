import type { DiscoveredJob } from "../../types";
import type { AtsTargetCompany } from "../types";

export interface GreenhouseRawJob {
  id: number | string;
  title: string;
  location?: { name: string };
  absolute_url?: string;
  updated_at?: string;
  first_published?: string;
  content?: string;
  departments?: Array<{ id: number; name: string }>;
  offices?: Array<{ id: number; name: string; location?: string }>;
  metadata?: Array<{ name: string; value: string | string[] }>;
}

export function decodeHtmlEntities(html: string): string {
  if (!html) return "";

  const decodeOnce = (str: string) => {
    let text = str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&nbsp;/g, " ")
      .replace(/&#160;/g, " ")
      .replace(/&bull;/g, "•")
      .replace(/&ndash;/g, "–")
      .replace(/&mdash;/g, "—")
      .replace(/&hellip;/g, "…");

    text = text.replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return "";
      }
    });

    text = text.replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    });

    return text;
  };

  let decoded = decodeOnce(html);
  if (decoded.includes("&lt;") || decoded.includes("&gt;")) {
    decoded = decodeOnce(decoded);
  }

  return decoded;
}

export function parseGreenhouseJob(
  raw: GreenhouseRawJob,
  company: AtsTargetCompany
): Partial<DiscoveredJob> {
  const locName = raw.location?.name || "";
  const isRemote =
    locName.toLowerCase().includes("remote") ||
    raw.offices?.some((o) => o.name?.toLowerCase().includes("remote")) ||
    false;

  const tags: string[] = [];
  if (raw.departments) {
    raw.departments.forEach((d) => {
      if (d.name) tags.push(d.name);
    });
  }
  if (isRemote) tags.push("Remote");

  const jobUrl =
    raw.absolute_url ||
    `https://job-boards.greenhouse.io/${company.slug}/jobs/${raw.id}`;

  return {
    id: `gh-${company.slug}-${raw.id}`,
    title: raw.title,
    companyName: company.name,
    companyLogo: company.logoUrl,
    location: locName || (isRemote ? "Remote" : "Headquarters"),
    workplaceType: isRemote ? "remote" : "onsite",
    jobType: "Full-Time",
    publishedAt: raw.first_published || raw.updated_at || new Date().toISOString(),
    jobUrl,
    tags,
    description: decodeHtmlEntities(raw.content || ""),
    source: "greenhouse",
    sourceName: `Greenhouse (${company.name})`,
    sourceBadgeColor: "bg-teal-500",
  };
}
