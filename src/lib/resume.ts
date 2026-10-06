import { format, parseISO } from "date-fns";

import type { ResumeEntry } from "@/services/resume/types";

export type ResumePeriodInput = {
  kind?: ResumeEntry["kind"] | string;
  startDate: string;
  endDate?: string | null;
  isCurrent?: boolean;
};

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "part_time", label: "Part-time" },
  { value: "internship", label: "Internship" },
] as const;

export const LOCATION_TYPE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPE_OPTIONS)[number]["value"];
export type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]["value"];

export function formatEmploymentType(type?: string | null): string {
  if (!type) return "";
  const normalized = type.toLowerCase().replace(/[-\s]/g, "_");
  const found = EMPLOYMENT_TYPE_OPTIONS.find((opt) => opt.value === normalized);
  if (found) return found.label;
  return type
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatLocationType(type?: string | null): string {
  if (!type) return "";
  const normalized = type.toLowerCase().replace(/[-\s]/g, "");
  if (normalized === "remote" || normalized === "fullremote") return "Remote";
  if (normalized === "hybrid") return "Hybrid";
  if (normalized === "onsite" || normalized === "on-site") return "On-site";
  const found = LOCATION_TYPE_OPTIONS.find(
    (opt) => opt.value === type.toLowerCase().replace(/[-\s]/g, "_")
  );
  if (found) return found.label;
  return type
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatExperienceMeta(entry: {
  location?: string | null;
  employmentType?: string | null;
  locationType?: string | null;
}): string {
  const parts: string[] = [];
  if (entry.location?.trim()) {
    parts.push(entry.location.trim());
  }
  const emp = formatEmploymentType(entry.employmentType);
  if (emp) {
    parts.push(emp);
  }
  const loc = formatLocationType(entry.locationType);
  if (loc) {
    parts.push(loc);
  }
  return parts.join(" • ");
}

// Education is formatted in years ("2014 - 2017" or "2021"), work in short 3-letter months
// ("May 2021 - Sep 2024", "Jan 2025 - Present") for crisp ATS standards.
const patternFor = (kind?: string) => (kind === "education" ? "yyyy" : "MMM yyyy");

const normalizeIsoDate = (input: string) => {
  if (!input) return input;
  // If "YYYY-MM", append day for parseISO compatibility
  if (/^\d{4}-\d{2}$/.test(input)) {
    return `${input}-01`;
  }
  return input;
};

const formatDay = (isoDay: string, pattern: string) => {
  try {
    const normalized = normalizeIsoDate(isoDay);
    return format(parseISO(normalized), pattern);
  } catch {
    return isoDay;
  }
};

// Builds the period label shown on /about, /cv, AI CV Tailor, and CMS previews.
// A start and end that render the same (a one-year course, or single month) collapse to a single label.
export function formatResumePeriod(entry: ResumePeriodInput): string {
  if (!entry.startDate) return "";
  const pattern = patternFor(entry.kind);
  const start = formatDay(entry.startDate, pattern);

  if (entry.isCurrent) return `${start} - Present`;
  if (!entry.endDate) return start;

  const end = formatDay(entry.endDate, pattern);
  return start === end ? start : `${start} - ${end}`;
}
