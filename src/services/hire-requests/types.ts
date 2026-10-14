export type {
  HireRequest,
  HireRequestStatus,
  NewHireRequest,
} from "@wismannur/cms-contracts";

import type { HireRequest, HireRequestStatus, NewHireRequest } from "@wismannur/cms-contracts";

export type ServiceRequest = HireRequest;
export type ServiceRequestStatus = HireRequestStatus;
export type NewServiceRequest = NewHireRequest;
export type UpdateServiceRequest = Partial<NewHireRequest>;
