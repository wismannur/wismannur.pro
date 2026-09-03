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
  source: "remotive" | "jobicy" | "global";
}

export interface JobDiscoverySearchParams {
  query?: string;
  tag?: string;
  geo?: "worldwide" | "apac" | "usa" | "europe" | "all";
  limit?: number;
}
