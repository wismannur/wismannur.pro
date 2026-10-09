import type { JobPlatform } from "../../job-tracker/types";

export function mapJobSourceToPlatform(source: string, jobUrl?: string): JobPlatform {
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
