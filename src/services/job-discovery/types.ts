export interface DiscoveredJob {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  workplaceType: "remote" | "hybrid" | "onsite";
  jobType: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  publishedAt: string;
  jobUrl: string;
  tags: string[];
  description: string;
  matchScore: number;
  matchedSkills: string[];
  matchReasons?: string[];
  source:
    | "jobicy"
    | "remotive"
    | "arbeitnow"
    | "remoteok"
    | "linkedin"
    | "google_linkedin"
    | "global"
    | "ashby"
    | "greenhouse"
    | "lever";
  sourceName: string;
  sourceBadgeColor?: string;
  visaSponsorship?: boolean;
  seniorityLevel?: "Junior" | "Mid" | "Senior" | "Lead" | "Staff" | "Executive" | "All Levels";
  geoRegion?: "apac" | "japan" | "europe" | "australia" | "usa" | "worldwide";
}

export type JobDiscoveryPlatform =
  | "linkedin"
  | "remoteok"
  | "remotive"
  | "jobicy"
  | "arbeitnow"
  | "ashby"
  | "greenhouse"
  | "lever";

export interface JobDiscoverySearchParams {
  query?: string;
  tag?: string;
  geo?: "all" | "worldwide" | "apac" | "japan" | "europe" | "australia" | "usa";
  platforms?: (JobDiscoveryPlatform | string)[];
  limit?: number;
}
