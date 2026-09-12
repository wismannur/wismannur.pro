export type OutreachType = "direct_apply" | "cold_pitch" | "follow_up";

export type OutreachStatus =
  | "draft"
  | "sent"
  | "follow_up_due"
  | "replied"
  | "converted"
  | "closed";

export interface JobOutreachAttachment {
  name: string;
  url: string;
  type?: string;
}

export interface JobOutreachMessage {
  id: string;
  outreachId: string;
  senderType: "admin" | "client";
  senderName: string;
  senderEmail: string;
  message: string;
  messageId?: string;
  createdAt: Date;
}

export interface JobOutreach {
  id: string;
  jobApplicationId?: string;
  companyName: string;
  companyWebsite?: string;
  jobTitle: string;
  contactName: string;
  contactRole?: string;
  contactEmail: string;
  contactLinkedin?: string;
  outreachType: OutreachType;
  status: OutreachStatus;
  subject: string;
  body: string;
  notes?: string;
  attachments?: JobOutreachAttachment[];
  initialMessageId?: string;
  sentAt?: Date;
  followUpDueDate?: Date;
  lastRepliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  messages?: JobOutreachMessage[];
  jobApplication?: {
    id: string;
    jobTitle: string;
    companyName: string;
    status: string;
  };
}

export type NewJobOutreach = Omit<
  JobOutreach,
  "id" | "createdAt" | "updatedAt" | "messages" | "jobApplication"
>;

export type UpdateJobOutreach = Partial<NewJobOutreach>;

export interface OutreachAnalytics {
  totalOutreaches: number;
  awaitingReply: number;
  followUpDue: number;
  replied: number;
  converted: number;
  responseRate: number;
  statusCounts: Record<OutreachStatus, number>;
  typeCounts: Record<OutreachType, number>;
}

export interface AiOutreachDraftParams {
  type: OutreachType;
  companyName: string;
  jobTitle: string;
  contactName: string;
  contactRole?: string;
  companyWebsite?: string;
  keySkillsOrHighlights?: string[];
  jobDescriptionSnippet?: string;
  customInstructions?: string;
}

export interface AiOutreachDraftResult {
  subject: string;
  body: string;
  recommendedFollowUpDays: number;
  toneRationale: string;
}
