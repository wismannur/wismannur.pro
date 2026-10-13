export type NotificationEntityType =
  | "contact"
  | "service_request"
  | "hire_request"
  | "job_outreach";

export interface UnreadEmailCounts {
  contacts: number;
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
