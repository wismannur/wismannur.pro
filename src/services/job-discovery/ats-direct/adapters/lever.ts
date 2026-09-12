import type { DiscoveredJob } from "../../types";
import type { AtsTargetCompany } from "../types";

export interface LeverRawJob {
  id: string;
  text: string;
  createdAt?: number;
  description?: string;
  categories?: {
    commitment?: string;
    department?: string;
    location?: string;
    team?: string;
    allLocations?: string[];
  };
  hostedUrl?: string;
  applyUrl?: string;
  workplaceType?: string; // "remote" | "hybrid" | "onsite"
}

export function parseLeverJob(
  raw: LeverRawJob,
  company: AtsTargetCompany
): Partial<DiscoveredJob> {
  const loc = raw.categories?.location || "";
  const isRemote =
    raw.workplaceType?.toLowerCase() === "remote" ||
    loc.toLowerCase().includes("remote") ||
    false;

  const workplaceType: "remote" | "hybrid" | "onsite" = isRemote
    ? "remote"
    : raw.workplaceType?.toLowerCase() === "hybrid"
    ? "hybrid"
    : "onsite";

  const tags: string[] = [];
  if (raw.categories?.department) tags.push(raw.categories.department);
  if (raw.categories?.team && raw.categories.team !== raw.categories.department) {
    tags.push(raw.categories.team);
  }
  if (raw.categories?.commitment) tags.push(raw.categories.commitment);
  if (isRemote) tags.push("Remote");

  const jobUrl = raw.applyUrl || raw.hostedUrl || `https://jobs.lever.co/${company.slug}/${raw.id}`;

  return {
    id: `lever-${company.slug}-${raw.id}`,
    title: raw.text,
    companyName: company.name,
    companyLogo: company.logoUrl,
    location: loc || (isRemote ? "Remote" : "Headquarters"),
    workplaceType,
    jobType: raw.categories?.commitment || "Full-Time",
    publishedAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    jobUrl,
    tags,
    description: raw.description || "",
    source: "lever",
    sourceName: `Lever (${company.name})`,
    sourceBadgeColor: "bg-indigo-500",
  };
}
