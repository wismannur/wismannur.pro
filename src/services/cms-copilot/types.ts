import type { CmsCopilotMessageRow, CmsCopilotSessionRow } from "@/db/schema";

export interface CopilotMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: ToolCallInfo[];
  toolResults?: ToolResultInfo[];
  createdAt: string | Date;
}

export interface ToolCallInfo {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResultInfo {
  name: string;
  result: Record<string, unknown>;
}

export interface CopilotSessionSummary extends CmsCopilotSessionRow {
  messages?: CmsCopilotMessageRow[];
}

import type { CmsActivePageContext } from "@/lib/cms-page-context";

export interface CopilotChatPayload {
  sessionId?: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  currentPath?: string;
  pageContext?: CmsActivePageContext | null;
}

export interface CopilotToolExecutionResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}
