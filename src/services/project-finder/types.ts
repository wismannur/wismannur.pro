export type ProjectProspectStatus =
  | "sourced"
  | "audited"
  | "building_mvp"
  | "pitch_ready"
  | "outreach_sent"
  | "negotiation"
  | "won"
  | "archived";

export type ProspectIndustry =
  | "home_living"
  | "d2c_luxury"
  | "outdoor_mobility"
  | "b2b_wholesale"
  | "specialty_food"
  | "other";

export interface ProjectAuditAnalysis {
  performanceScore?: number; // 0 - 100 estimated Lighthouse
  mobileFrictionScore?: number; // 0 - 100 friction level
  modernizationOpportunityScore: number; // 0 - 100 overall opportunity score
  detectedStack?: string[]; // e.g. ["Legacy Magento 1", "jQuery", "Monolithic PHP"]
  coreWebVitalIssues?: string[]; // e.g. ["LCP 4.6s", "CLS 0.35 on dynamic banners"]
  mobileUxPainPoints?: string[]; // e.g. ["Non-responsive cart", "No optimistic updates"]
  recommendedModernization?: string[]; // e.g. ["Nuxt 4 SSR", "Tailwind CSS", "Nitro Edge Caching"]
  modernizationPitchSummary?: string;
  estimatedConversionLift?: string; // e.g. "+15% to +28% mobile checkout completion"
  executiveSummary?: string;
}

export interface ProjectProspect {
  id: string;
  companyName: string;
  companyLogo?: string;
  companyWebsite: string;
  industry: ProspectIndustry | string;
  country: string;
  city?: string;
  timezone: string;
  status: ProjectProspectStatus;
  estimatedRevenueTier?: string;
  auditScore?: number;
  auditAnalysis?: ProjectAuditAnalysis;
  mvpDemoUrl?: string;
  loomVideoUrl?: string;
  pitchScript?: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  contactLinkedin?: string;
  outreachStatus?: string;
  outreachSentAt?: Date;
  followUpDueDate?: Date;
  notes?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewProjectProspect {
  companyName: string;
  companyLogo?: string;
  companyWebsite: string;
  industry?: ProspectIndustry | string;
  country?: string;
  city?: string;
  timezone?: string;
  status?: ProjectProspectStatus;
  estimatedRevenueTier?: string;
  auditScore?: number;
  auditAnalysis?: ProjectAuditAnalysis;
  mvpDemoUrl?: string;
  loomVideoUrl?: string;
  pitchScript?: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  contactLinkedin?: string;
  outreachStatus?: string;
  outreachSentAt?: Date;
  followUpDueDate?: Date;
  notes?: string;
  sortOrder?: number;
}

export interface UpdateProjectProspect extends Partial<NewProjectProspect> {
  id: string;
}

export interface ModernizationPitchResult {
  coldEmailSubject: string;
  coldEmailBody: string;
  linkedInMessage: string;
  loomVideoScript: string;
  valuePropositionHighlights: string[];
}

export interface HunterSearchNiche {
  id: string;
  title: string;
  description: string;
  estimatedRevenue: string;
  pitchApprovalPotential: "very_high" | "high" | "medium";
  conversionRationale: string;
  recommendedQueries: {
    country: string;
    flag: string;
    query: string;
    googleMapsUrl: string;
  }[];
}
