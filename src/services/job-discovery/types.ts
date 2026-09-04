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
  source: "jobicy" | "remotive" | "arbeitnow" | "remoteok" | "linkedin" | "google_linkedin" | "global";
  sourceName: string;
  sourceBadgeColor?: string;
  visaSponsorship?: boolean;
  seniorityLevel?: "Junior" | "Mid" | "Senior" | "Lead" | "Staff" | "Executive" | "All Levels";
  geoRegion?: "apac" | "japan" | "europe" | "australia" | "usa" | "worldwide";
}

export interface JobDiscoverySearchParams {
  query?: string;
  tag?: string;
  geo?: "all" | "worldwide" | "apac" | "japan" | "europe" | "australia" | "usa";
  limit?: number;
}
