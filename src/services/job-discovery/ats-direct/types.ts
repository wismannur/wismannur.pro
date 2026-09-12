export type AtsPlatform = "ashby" | "greenhouse" | "lever";

export interface AtsTargetCompany {
  id: string;
  name: string;
  platform: AtsPlatform;
  slug: string;
  websiteUrl?: string;
  logoUrl?: string;
  isActive: boolean;
  isCustom?: boolean;
  createdAt?: string;
}

export interface AtsVerificationResult {
  valid: boolean;
  platform: AtsPlatform;
  slug: string;
  jobCount: number;
  sampleTitle?: string;
  error?: string;
}

export interface AtsFetchParams {
  query?: string;
  selectedCompanies?: string[]; // list of company slugs or ids
  platform?: AtsPlatform | "all";
  remoteOnly?: boolean;
  worldwideOnly?: boolean;
  limit?: number;
  forceRefresh?: boolean;
}
