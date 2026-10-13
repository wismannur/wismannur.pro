export type MessageSenderType = "admin" | "client";
export type InquiryType = "contact" | "service_request" | "hire_request";

export interface EmailAttachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

export interface InquiryMessage {
  id: string;
  inquiryId: string;
  inquiryType: InquiryType;
  senderType: MessageSenderType;
  senderName: string;
  senderEmail: string;
  message: string;
  rawHtml?: string | null;
  attachments?: EmailAttachment[];
  messageId?: string;
  createdAt: Date;
}

export interface SendAdminReplyInput {
  inquiryId: string;
  inquiryType: InquiryType;
  toEmail: string;
  toName: string;
  subject: string;
  message: string;
  originalMessageSnippet?: string;
  attachments?: EmailAttachment[];
}

export interface GenerateAiReplyDraftInput {
  inquiryId: string;
  inquiryType: InquiryType;
  userGuidance?: string;
  tone?: "professional" | "friendly" | "detailed";
}

export interface GenerateAiReplyDraftResult {
  draft: string;
  usedKnowledgeTopicsCount: number;
}
