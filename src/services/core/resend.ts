import "server-only";

import { Resend } from "resend";
import AdminReplyToClientEmail from "@/components/emails/admin-reply-to-client";
import ClientContactAutoReplyEmail from "@/components/emails/client-contact-auto-reply";
import ClientHireRequestAutoReplyEmail from "@/components/emails/client-hire-request-auto-reply";
import ClientServiceRequestAutoReplyEmail from "@/components/emails/client-service-request-auto-reply";
import JobOutreachEmail from "@/components/emails/job-outreach-email";
import { toCustomAttachmentUrl, toDirectBlobUrl } from "@/lib/attachment-url";
import {
  sendDiscordContactNotification,
  sendDiscordHireNotification,
  sendDiscordInboundNotification,
  sendDiscordServiceNotification,
} from "./discord";

function getResendClient(): Resend | null {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  return resendApiKey ? new Resend(resendApiKey) : null;
}

export const RESEND_EMAIL_DOMAIN =
  process.env.RESEND_EMAIL_DOMAIN?.trim() ||
  process.env.NEXT_PUBLIC_RESEND_EMAIL_DOMAIN?.trim() ||
  "wismannur.pro";


const SENDER_HI =
  process.env.RESEND_FROM_HI ||
  process.env.RESEND_FROM_HELLO ||
  `Wisman Nur <hi@${RESEND_EMAIL_DOMAIN}>`;

interface ContactEmailPayload {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ServiceRequestEmailPayload {
  id?: string;
  name: string;
  email: string;
  company?: string;
  serviceType: string;
  budget: string;
  timeframe: string;
  projectDetails: string;
}

interface HireRequestEmailPayload {
  id?: string;
  name: string;
  email: string;
  company: string;
  roleTitle: string;
  employmentType: string;
  workplaceType: string;
  location?: string;
  salaryRange?: string;
  message: string;
}

export interface AdminReplyPayload {
  inquiryId: string;
  toEmail: string;
  toName: string;
  subject: string;
  message: string;
  originalMessageSnippet?: string;
  attachments?: Array<{ name: string; url: string }>;
  inReplyToId?: string | null;
  referencesIds?: (string | null | undefined)[];
}

interface InboundAlertPayload {
  inquiryId: string;
  inquiryType: "contact" | "service_request" | "hire_request" | "job_outreach";
  clientName: string;
  clientEmail: string;
  subject: string;
  message: string;
  toAddress?: string;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
  isNewConversation?: boolean;
}

export interface JobOutreachSendPayload {
  outreachId: string;
  toEmail: string;
  toName: string;
  subject: string;
  message: string;
  companyName?: string;
  jobTitle?: string;
  isFollowUp?: boolean;
  attachments?: Array<{ name: string; url: string }>;
  inReplyToId?: string | null;
  referencesIds?: (string | null | undefined)[];
}

/**
 * Formats a message ID for RFC 5322 In-Reply-To and References headers.
 * Standard RFC headers require angle brackets `<...>`, e.g. `<id@domain.com>` or `<resend-uuid@resend.dev>`.
 */
function formatMessageIdHeader(id: string | null | undefined): string | null {
  if (!id) return null;
  const trimmed = id.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed;
  }
  if (trimmed.includes("@")) {
    return `<${trimmed}>`;
  }
  // For Resend IDs (which are UUIDs/alphanumerics), Resend sets the Message-ID as <id@resend.dev>
  return `<${trimmed}@resend.dev>`;
}

/**
 * Constructs email headers containing X-Entity-Ref-ID, In-Reply-To, and References for proper email client threading.
 */
function buildThreadingHeaders(params: {
  entityRefId?: string;
  inReplyToId?: string | null;
  referencesIds?: (string | null | undefined)[];
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (params.entityRefId) {
    headers["X-Entity-Ref-ID"] = params.entityRefId;
  }

  const formattedInReplyTo = formatMessageIdHeader(params.inReplyToId);
  if (formattedInReplyTo) {
    headers["In-Reply-To"] = formattedInReplyTo;
  }

  const validRefs = (params.referencesIds || [])
    .map(formatMessageIdHeader)
    .filter((id): id is string => Boolean(id));

  const uniqueRefs = Array.from(new Set(validRefs));
  if (uniqueRefs.length > 0) {
    headers["References"] = uniqueRefs.join(" ");
  }

  return headers;
}

/**
 * Sends Admin notification via Discord and Client auto-reply via Resend for contact inquiries.
 * Fail-safe: Any delivery error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendContactEmails(
  payload: ContactEmailPayload
): Promise<{ clientEmailId?: string; adminEmailId?: string }> {
  // 1. Dispatch Discord notification to Admin asynchronously (fail-safe)
  const discordPromise = sendDiscordContactNotification(payload);

  const resend = getResendClient();
  if (!resend) {
    console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping client auto-reply.");
    await discordPromise;
    return {};
  }

  try {
    const dynamicReplyTo = payload.id
      ? `${payload.id}@${RESEND_EMAIL_DOMAIN}`
      : `hi@${RESEND_EMAIL_DOMAIN}`;

    // 2. Concurrently execute Client auto-reply and Discord notification
    const [clientRes] = await Promise.allSettled([
      resend.emails.send({
        from: SENDER_HI,
        to: payload.email,
        replyTo: dynamicReplyTo,
        subject: "Message received - Wisman Nur",
        headers: payload.id ? { "X-Entity-Ref-ID": payload.id } : undefined,
        react: ClientContactAutoReplyEmail({
          name: payload.name,
          subject: payload.subject,
          message: payload.message,
          refId: payload.id,
        }),
      }),
      discordPromise,
    ]);

    const clientEmailId =
      clientRes.status === "fulfilled" && clientRes.value.data?.id
        ? clientRes.value.data.id
        : undefined;

    return { clientEmailId };
  } catch (error) {
    console.error("Failed to send contact emails:", error);
    return {};
  }
}

/**
 * Sends Admin notification via Discord and Client auto-reply via Resend for Hire-Me service requests.
 * Fail-safe: Any delivery error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendServiceRequestEmails(
  payload: ServiceRequestEmailPayload
): Promise<{ clientEmailId?: string; adminEmailId?: string }> {
  // 1. Dispatch Discord notification to Admin asynchronously (fail-safe)
  const discordPromise = sendDiscordServiceNotification(payload);

  const resend = getResendClient();
  if (!resend) {
    console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping client auto-reply.");
    await discordPromise;
    return {};
  }

  try {
    const dynamicReplyTo = payload.id
      ? `${payload.id}@${RESEND_EMAIL_DOMAIN}`
      : `hi@${RESEND_EMAIL_DOMAIN}`;

    // 2. Concurrently execute Client auto-reply and Discord notification
    const [clientRes] = await Promise.allSettled([
      resend.emails.send({
        from: SENDER_HI,
        to: payload.email,
        replyTo: dynamicReplyTo,
        subject: "Project request received - Wisman Nur",
        headers: payload.id ? { "X-Entity-Ref-ID": payload.id } : undefined,
        react: ClientServiceRequestAutoReplyEmail({
          name: payload.name,
          serviceType: payload.serviceType,
          budget: payload.budget,
          timeframe: payload.timeframe,
          projectDetails: payload.projectDetails,
          refId: payload.id,
        }),
      }),
      discordPromise,
    ]);

    const clientEmailId =
      clientRes.status === "fulfilled" && clientRes.value.data?.id
        ? clientRes.value.data.id
        : undefined;

    return { clientEmailId };
  } catch (error) {
    console.error("Failed to send service request emails:", error);
    return {};
  }
}

/**
 * Sends Admin notification via Discord and Client auto-reply via Resend for Hire-Me career/job inquiries.
 * Fail-safe: Any delivery error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendHireRequestEmails(
  payload: HireRequestEmailPayload
): Promise<{ clientEmailId?: string; adminEmailId?: string }> {
  // 1. Dispatch Discord notification to Admin asynchronously (fail-safe)
  const discordPromise = sendDiscordHireNotification(payload);

  const resend = getResendClient();
  if (!resend) {
    console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping client auto-reply.");
    await discordPromise;
    return {};
  }

  try {
    const dynamicReplyTo = payload.id
      ? `${payload.id}@${RESEND_EMAIL_DOMAIN}`
      : `hi@${RESEND_EMAIL_DOMAIN}`;

    // 2. Concurrently execute Client auto-reply and Discord notification
    const [clientRes] = await Promise.allSettled([
      resend.emails.send({
        from: SENDER_HI,
        to: payload.email,
        replyTo: dynamicReplyTo,
        subject: `Opportunity received: ${payload.roleTitle} - Wisman Nur`,
        headers: payload.id ? { "X-Entity-Ref-ID": payload.id } : undefined,
        react: ClientHireRequestAutoReplyEmail({
          name: payload.name,
          company: payload.company,
          roleTitle: payload.roleTitle,
          employmentType: payload.employmentType,
          workplaceType: payload.workplaceType,
          message: payload.message,
          refId: payload.id,
        }),
      }),
      discordPromise,
    ]);

    const clientEmailId =
      clientRes.status === "fulfilled" && clientRes.value.data?.id
        ? clientRes.value.data.id
        : undefined;

    return { clientEmailId };
  } catch (error) {
    console.error("Failed to send hire request emails:", error);
    return {};
  }
}

/**
 * Sends an email response from the Admin directly to the Client.
 */
export async function sendAdminReplyToClient(payload: AdminReplyPayload): Promise<{ id?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping reply email.");
    return {};
  }

  try {
    let formattedSubject = payload.subject.trim();
    if (!formattedSubject.toLowerCase().startsWith("re:")) {
      formattedSubject = `Re: ${formattedSubject}`;
    }

    const resendAttachments =
      payload.attachments && payload.attachments.length > 0
        ? payload.attachments.map((att) => ({
            filename: att.name,
            path: toDirectBlobUrl(att.url),
          }))
        : undefined;

    const emailTemplateAttachments = payload.attachments?.map((att) => ({
      ...att,
      url: toCustomAttachmentUrl(att.url),
    }));

    const headers = buildThreadingHeaders({
      entityRefId: payload.inquiryId,
      inReplyToId: payload.inReplyToId,
      referencesIds: payload.referencesIds,
    });

    const { data, error } = await resend.emails.send({
      from: SENDER_HI,
      to: payload.toEmail,
      replyTo: payload.inquiryId
        ? `${payload.inquiryId}@${RESEND_EMAIL_DOMAIN}`
        : `hi@${RESEND_EMAIL_DOMAIN}`,
      subject: formattedSubject,
      attachments: resendAttachments,
      headers,
      react: AdminReplyToClientEmail({
        clientName: payload.toName,
        replyMessage: payload.message,
        originalSubject: payload.subject,
        originalMessageSnippet: payload.originalMessageSnippet,
        inquiryId: payload.inquiryId,
        attachments: emailTemplateAttachments,
      }),
    });

    if (error) {
      console.error("[Resend] Error sending admin reply to client:", error);
      throw error;
    }

    return { id: data?.id };
  } catch (error) {
    console.error("Failed to send admin reply email via Resend:", error);
    throw error;
  }
}

/**
 * Sends an alert to Admin via Discord when a Client or Recruiter sends an inbound email or reply.
 */
export async function sendInboundAlertToAdmin(payload: InboundAlertPayload): Promise<void> {
  try {
    await sendDiscordInboundNotification({
      inquiryId: payload.inquiryId,
      inquiryType: payload.inquiryType,
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
      subject: payload.subject,
      message: payload.message,
      isNewConversation: payload.isNewConversation,
    });
  } catch (error) {
    console.error("Failed to send inbound alert to Discord:", error);
  }
}

/**
 * Sends an outbound job application / cold outreach / follow-up email to a recruiter or company contact.
 */
export async function sendJobOutreachEmail(
  payload: JobOutreachSendPayload
): Promise<{ id?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "Resend is not configured: RESEND_API_KEY is missing. Skipping job outreach email."
    );
    return {};
  }

  try {
    let formattedSubject = payload.subject.trim();
    if (payload.isFollowUp && !formattedSubject.toLowerCase().startsWith("re:")) {
      formattedSubject = `Re: ${formattedSubject}`;
    }

    const resendAttachments =
      payload.attachments && payload.attachments.length > 0
        ? payload.attachments.map((att) => ({
            filename: att.name,
            path: toDirectBlobUrl(att.url),
          }))
        : undefined;

    const headers = buildThreadingHeaders({
      entityRefId: payload.outreachId,
      inReplyToId: payload.inReplyToId,
      referencesIds: payload.referencesIds,
    });

    const emailTemplateAttachments = payload.attachments?.map((att) => ({
      ...att,
      url: toCustomAttachmentUrl(att.url),
    }));

    const { data, error } = await resend.emails.send({
      from: SENDER_HI,
      to: payload.toEmail,
      replyTo: payload.outreachId
        ? `${payload.outreachId}@${RESEND_EMAIL_DOMAIN}`
        : `hi@${RESEND_EMAIL_DOMAIN}`,
      subject: formattedSubject,
      attachments: resendAttachments,
      headers,
      react: JobOutreachEmail({
        contactName: payload.toName,
        bodyMessage: payload.message,
        subject: payload.subject,
        companyName: payload.companyName,
        jobTitle: payload.jobTitle,
        attachments: emailTemplateAttachments,
        refId: payload.outreachId,
      }),
    });

    if (error) {
      console.error("[Resend] Error sending job outreach email:", error);
      throw error;
    }

    return { id: data?.id };
  } catch (error) {
    console.error("Failed to send job outreach email via Resend:", error);
    throw error;
  }
}
