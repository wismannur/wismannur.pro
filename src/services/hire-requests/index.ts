import { deleteHireRequest, getById, getHireRequests, submit, updateStatus } from "./actions";
import type { HireRequest, HireRequestStatus, NewHireRequest } from "./types";

export interface HireRequestService {
  getRequests(
    page?: number,
    startAfterDoc?: unknown,
    status?: string
  ): Promise<{
    requests: HireRequest[];
    lastVisible: unknown;
    hasMore: boolean;
    total?: number;
  }>;
  getById(id: string): Promise<HireRequest | null>;
  submit(data: NewHireRequest, recaptchaToken?: string): Promise<string>;
  updateStatus(id: string, status: HireRequestStatus): Promise<void>;
  delete(id: string): Promise<void>;
}

export const hireRequestService: HireRequestService = {
  getRequests: getHireRequests,
  getById,
  submit,
  updateStatus,
  delete: deleteHireRequest,
};

export * from "./types";
