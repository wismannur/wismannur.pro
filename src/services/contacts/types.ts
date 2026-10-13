import type { EmailAttachment } from "../inquiry-messages/types";

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot?: string;
}

export type Contact = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  rawHtml?: string | null;
  attachments?: EmailAttachment[] | null;
  messageId?: string | null;
  status: "new" | "read" | "replied" | "archived";
  createdAt: Date;
};
