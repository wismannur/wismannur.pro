export type NotificationEntityType =
  | "contact"
  | "direct_email"
  | "service_request"
  | "hire_request"
  | "job_outreach";

export interface UnreadEmailCounts {
  contacts: number;
  directEmails: number;
  serviceRequests: number;
  hireRequests: number;
  jobOutreaches: number;
  total: number;
}

export interface UnreadNotificationItem {
  id: string;
  type: NotificationEntityType;
  title: string;
  subtitle: string;
  snippet: string;
  createdAt: string;
  href: string;
}

export interface NotificationSummaryResponse {
  counts: UnreadEmailCounts;
  recentItems: UnreadNotificationItem[];
}
