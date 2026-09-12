import type { DiscoveredJob } from "../../types";
import type { AtsTargetCompany } from "../types";

export interface AshbyRawJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  secondaryLocations?: string[];
  publishedAt?: string;
  isListed?: boolean;
  isRemote?: boolean;
  workplaceType?: string; // "Remote" | "Hybrid" | "InPerson"
  address?: {
    postalAddress?: {
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string;
    };
  };
  jobUrl?: string;
  applyUrl?: string;
  descriptionHtml?: string;
  compensation?: {
    compensationTierSummary?: string;
    minValue?: number;
    maxValue?: number;
    currencyCode?: string;
  };
}

export function parseAshbyJob(
  raw: AshbyRawJob,
  company: AtsTargetCompany
): Partial<DiscoveredJob> {
  const isRemote =
    raw.isRemote === true ||
    raw.workplaceType?.toLowerCase() === "remote" ||
    raw.location?.toLowerCase().includes("remote") ||
    false;

  const workplaceType: "remote" | "hybrid" | "onsite" = isRemote
    ? "remote"
    : raw.workplaceType?.toLowerCase() === "hybrid"
    ? "hybrid"
    : "onsite";

  const tags: string[] = [];
  if (raw.department) tags.push(raw.department);
  if (raw.team && raw.team !== raw.department) tags.push(raw.team);
  if (raw.employmentType) tags.push(raw.employmentType);
  if (isRemote) tags.push("Remote");

  const locationParts = [
    raw.location,
    raw.address?.postalAddress?.addressLocality,
    raw.address?.postalAddress?.addressCountry,
  ].filter(Boolean);
  const location = locationParts.length > 0 ? Array.from(new Set(locationParts)).join(", ") : isRemote ? "Remote" : "HQ";

  let salary: string | undefined = undefined;
  if (raw.compensation?.compensationTierSummary) {
    salary = raw.compensation.compensationTierSummary;
  } else if (raw.compensation?.minValue && raw.compensation?.maxValue) {
    const cur = raw.compensation.currencyCode || "USD";
    salary = `${cur} ${raw.compensation.minValue.toLocaleString()} - ${raw.compensation.maxValue.toLocaleString()}`;
  }

  const jobUrl = raw.applyUrl || raw.jobUrl || `https://jobs.ashbyhq.com/${company.slug}/${raw.id}`;

  return {
    id: `ashby-${company.slug}-${raw.id}`,
    title: raw.title,
    companyName: company.name,
    companyLogo: company.logoUrl,
    location,
    workplaceType,
    jobType: raw.employmentType || "Full-Time",
    salary,
    salaryMin: raw.compensation?.minValue,
    salaryMax: raw.compensation?.maxValue,
    salaryCurrency: raw.compensation?.currencyCode || "USD",
    publishedAt: raw.publishedAt || new Date().toISOString(),
    jobUrl,
    tags,
    description: raw.descriptionHtml || "",
    source: "ashby",
    sourceName: `Ashby (${company.name})`,
    sourceBadgeColor: "bg-emerald-500",
  };
}
