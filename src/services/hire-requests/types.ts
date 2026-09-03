export type HireRequestStatus =
  | "new"
  | "reviewed"
  | "interviewing"
  | "offered"
  | "rejected"
  | "archived";

export interface HireRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  roleTitle: string;
  employmentType: string;
  workplaceType: string;
  location?: string;
  salaryRange?: string;
  message: string;
  status: HireRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type NewHireRequest = Omit<HireRequest, "id" | "status" | "createdAt" | "updatedAt">;
