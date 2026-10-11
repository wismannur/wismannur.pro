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
  messageId?: string | null;
  status: "new" | "read" | "replied" | "archived";
  createdAt: Date;
};
