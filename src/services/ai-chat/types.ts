export type ChatRole = "user" | "model" | "assistant" | "system";

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  content: string;
  createdAt?: number;
  toolCallName?: string;
  toolCallArgs?: Record<string, unknown>;
  toolCallResult?: Record<string, unknown>;
  status?: "sending" | "streaming" | "done" | "error";
}

export interface ChatRequestPayload {
  messages: Array<{
    role: "user" | "assistant" | "model";
    content: string;
  }>;
  clientSessionId?: string;
}

export interface SubmitHireInquiryArgs {
  name: string;
  email: string;
  company: string;
  roleTitle: string;
  employmentType?: "full_time" | "contract" | "part_time" | "freelance" | "internship";
  workplaceType?: "remote" | "hybrid" | "onsite";
  location?: string;
  salaryRange?: string;
  message: string;
}

export interface SubmitContactMessageArgs {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ToolExecutionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
