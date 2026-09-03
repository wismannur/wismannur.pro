import { format, parseISO } from "date-fns";

import type { ResumeEntry } from "@/services/resume/types";

export type ResumePeriodInput = Pick<ResumeEntry, "kind" | "startDate" | "endDate" | "isCurrent">;

// Education is talked about in years ("2014 - 2017"), work in months
// ("May 2021 - Sep 2024") — same convention the hardcoded /about copy used.
const patternFor = (kind: ResumeEntry["kind"]) => (kind === "education" ? "yyyy" : "MMM yyyy");

const formatDay = (isoDay: string, pattern: string) => {
  try {
    return format(parseISO(isoDay), pattern);
  } catch {
    return isoDay;
  }
};

// Builds the period label shown on /about and previewed in the CMS form.
// A start and end that render the same (a one-year course, a role that began
// and ended in the same month) collapse to a single label.
export function formatResumePeriod(entry: ResumePeriodInput): string {
  const pattern = patternFor(entry.kind);
  const start = formatDay(entry.startDate, pattern);

  if (entry.isCurrent) return `${start} - Present`;
  if (!entry.endDate) return start;

  const end = formatDay(entry.endDate, pattern);
  return start === end ? start : `${start} - ${end}`;
}
