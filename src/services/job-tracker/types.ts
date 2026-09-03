export type JobApplicationStatus =
  | "wishlist"
  | "applied"
  | "screening"
  | "interview_hr"
  | "interview_tech"
  | "interview_user"
  | "offering"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "ghosted";

export type JobPlatform =
  | "linkedin"
  | "jobstreet"
  | "glints"
  | "techinasia"
  | "indeed"
  | "company_website"
  | "referral"
  | "other";

export type WorkplaceType = "remote" | "hybrid" | "onsite";

export type JobEmploymentType = "full_time" | "contract" | "part_time" | "freelance" | "internship";

export type InterviewStageType =
  | "hr_screening"
  | "technical_interview"
  | "live_coding"
  | "take_home_test"
  | "user_interview"
  | "system_design"
  | "final_leadership"
  | "offering_discussion"
  | "other";

export type InterviewStatus = "scheduled" | "completed" | "passed" | "failed" | "cancelled";

export interface AtsAnalysis {
  score: number;
  matchStrengths: string[];
  missingKeywords: string[];
  recommendations: string[];
  summaryFeedback: string;
}

export interface TailoredBullet {
  roleContext?: string;
  tailored: string;
  rationale?: string;
}

export interface PredictedQuestion {
  id?: string;
  question: string;
  category: "behavioral" | "technical" | "system_design" | "role_fit" | "culture";
  tip: string;
  sampleAnswer: string;
}

export interface MockInterviewAnswerEvaluation {
  score: number; // 1 to 10
  verdict: "excellent" | "good" | "needs_improvement" | "poor";
  strengths: string[];
  improvements: string[];
  starBreakdown?: {
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
  };
  refinedAnswer: string;
  followUpQuestion?: string;
}

export interface RejectionDiagnosticResult {
  rootCauseAnalysis: string;
  skillGaps: string[];
  remediationPlan: string[];
  gracefulClosureEmail: {
    subject: string;
    body: string;
  };
  suggestedNextFocus: string;
}

export interface JobInterview {
  id: string;
  applicationId: string;
  stageType: InterviewStageType;
  title: string;
  scheduledAt: Date;
  interviewers?: string;
  meetingLink?: string;
  rawInvitation?: string;
  aiSummary?: string;
  aiPredictedQuestions?: PredictedQuestion[];
  notes?: string;
  feedback?: string;
  status: InterviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  companyName: string;
  companyLogo?: string;
  companyWebsite?: string;
  jobTitle: string;
  jobUrl?: string;
  platform: JobPlatform;
  location?: string;
  workplaceType: WorkplaceType;
  jobType: JobEmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryPeriod: string;
  jobDescriptionRaw?: string;
  requirements: string[];
  status: JobApplicationStatus;
  appliedAt?: Date;
  atsScore?: number;
  atsAnalysis?: AtsAnalysis;
  tailoredSummary?: string;
  tailoredBulletPoints?: TailoredBullet[];
  coverLetter?: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  followUpDate?: Date;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  interviews?: JobInterview[];
}

export type NewJobApplication = Omit<
  JobApplication,
  "id" | "createdAt" | "updatedAt" | "interviews"
>;

export type UpdateJobApplication = Partial<NewJobApplication>;

export type NewJobInterview = Omit<JobInterview, "id" | "createdAt" | "updatedAt">;

export type UpdateJobInterview = Partial<NewJobInterview>;

export interface ParsedJobPosting {
  companyName: string;
  jobTitle: string;
  platform: JobPlatform;
  location?: string;
  workplaceType: WorkplaceType;
  jobType: JobEmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  jobDescriptionRaw: string;
  requirements: string[];
  contactName?: string;
  contactEmail?: string;
  companyWebsite?: string;
}

export interface ParsedInterviewInvitation {
  stageType: InterviewStageType;
  title: string;
  scheduledAt?: string; // ISO string
  interviewers?: string;
  meetingLink?: string;
  aiSummary: string;
  keyFocusAreas: string[];
}

export interface InterviewPrepResult {
  stageSummary: string;
  questions: PredictedQuestion[];
  questionsToAskInterviewer: string[];
  technicalChecklist: string[];
}

export interface JobTrackerAnalytics {
  totalApplications: number;
  appliedToday: number;
  appliedThisWeek: number;
  appliedThisMonth: number;
  activeInterviews: number;
  totalOffers: number;
  responseRate: number;
  offerRate: number;
  statusCounts: Record<JobApplicationStatus, number>;
  platformCounts: Record<JobPlatform, number>;
  recentActivity: { date: string; count: number }[];
  funnel: { stage: string; count: number; percentage: number }[];
}
