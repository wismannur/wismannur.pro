import "server-only";

import { SITE_URL } from "@/lib/site-url";

export type DiscordChannelType = "contacts" | "hire" | "services" | "inbound";

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

/**
 * Truncates text safely to comply with Discord API limits.
 */
function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3)}...`;
}

/**
 * Resolves the appropriate Discord webhook URL for a channel type.
 * Automatically falls back to DISCORD_WEBHOOK_CONTACTS or DISCORD_WEBHOOK_DEFAULT
 * if a specialized channel webhook is not yet configured.
 */
export function getDiscordWebhookUrl(channel: DiscordChannelType): string | null {
  const fallbackUrl =
    process.env.DISCORD_WEBHOOK_DEFAULT?.trim() ||
    process.env.DISCORD_WEBHOOK_CONTACTS?.trim() ||
    null;

  switch (channel) {
    case "contacts":
      return process.env.DISCORD_WEBHOOK_CONTACTS?.trim() || fallbackUrl;
    case "hire":
      return process.env.DISCORD_WEBHOOK_HIRE?.trim() || fallbackUrl;
    case "services":
      return process.env.DISCORD_WEBHOOK_SERVICES?.trim() || fallbackUrl;
    case "inbound":
      return process.env.DISCORD_WEBHOOK_INBOUND?.trim() || fallbackUrl;
    default:
      return fallbackUrl;
  }
}

/**
 * Generic dispatcher to send payloads to Discord Webhooks.
 * Fail-safe: Always catches errors and logs them, never throwing to caller.
 */
export async function sendDiscordWebhook(
  channel: DiscordChannelType,
  payload: DiscordWebhookPayload
): Promise<boolean> {
  const webhookUrl = getDiscordWebhookUrl(channel);
  if (!webhookUrl) {
    console.warn(`[Discord Webhook] No webhook URL configured for channel "${channel}". Skipping notification.`);
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: payload.username || "wismannur.pro Alerts",
        avatar_url: payload.avatar_url,
        content: payload.content,
        embeds: payload.embeds,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Discord Webhook] Failed to send notification (status ${response.status}):`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Discord Webhook] Error sending alert to "${channel}":`, error);
    return false;
  }
}

/**
 * Color palettes for Discord embeds (hex converted to integer)
 */
const EMBED_COLORS = {
  contacts: 0x6366f1, // Indigo
  hire: 0x10b981,     // Emerald Green
  services: 0xf59e0b, // Amber
  inbound: 0x0ea5e9,  // Sky Blue
} as const;

export interface ContactNotificationPayload {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Sends a rich notification to Discord for public contact form inquiries.
 */
export async function sendDiscordContactNotification(
  payload: ContactNotificationPayload
): Promise<boolean> {
  const cmsLink = payload.id
    ? `${SITE_URL}/cms/contacts/${payload.id}`
    : `${SITE_URL}/cms/contacts`;

  const fields: DiscordEmbedField[] = [
    {
      name: "👤 From",
      value: `${truncate(payload.name, 100)} (<${truncate(payload.email, 100)}>)`,
      inline: true,
    },
    {
      name: "📌 Subject",
      value: truncate(payload.subject, 200),
      inline: true,
    },
  ];

  if (payload.id) {
    fields.push({
      name: "🏷️ Tracking Ref ID",
      value: `\`${payload.id}\``,
      inline: true,
    });
  }

  fields.push({
    name: "💬 Message Content",
    value: truncate(payload.message, 1000) || "*(Empty message)*",
    inline: false,
  });

  fields.push({
    name: "⚡ Action",
    value: `[Open in CMS Dashboard →](${cmsLink})`,
    inline: false,
  });

  const embed: DiscordEmbed = {
    title: "📬 New Contact Transmission",
    url: cmsLink,
    color: EMBED_COLORS.contacts,
    description: `Received via public form on **${SITE_URL}/contact**`,
    fields,
    footer: {
      text: "wismannur.pro • Contact Notifications",
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook("contacts", { embeds: [embed] });
}

export interface ServiceRequestNotificationPayload {
  id?: string;
  name: string;
  email: string;
  company?: string;
  serviceType: string;
  budget: string;
  timeframe: string;
  projectDetails: string;
}

/**
 * Sends a rich notification to Discord for client service requests.
 */
export async function sendDiscordServiceNotification(
  payload: ServiceRequestNotificationPayload
): Promise<boolean> {
  const cmsLink = payload.id
    ? `${SITE_URL}/cms/services/${payload.id}`
    : `${SITE_URL}/cms/services`;

  const senderInfo = payload.company
    ? `${truncate(payload.name, 100)} (${truncate(payload.company, 100)})`
    : truncate(payload.name, 100);

  const fields: DiscordEmbedField[] = [
    {
      name: "👤 Client",
      value: `${senderInfo} (<${truncate(payload.email, 100)}>)`,
      inline: false,
    },
    {
      name: "🛠️ Service Requested",
      value: truncate(payload.serviceType, 100),
      inline: true,
    },
    {
      name: "💰 Budget",
      value: truncate(payload.budget, 100),
      inline: true,
    },
    {
      name: "⏱️ Timeframe",
      value: truncate(payload.timeframe, 100),
      inline: true,
    },
  ];

  if (payload.id) {
    fields.push({
      name: "🏷️ Tracking Ref ID",
      value: `\`${payload.id}\``,
      inline: true,
    });
  }

  fields.push({
    name: "📋 Project Details",
    value: truncate(payload.projectDetails, 1000) || "*(Empty details)*",
    inline: false,
  });

  fields.push({
    name: "⚡ Action",
    value: `[Open in Services CMS →](${cmsLink})`,
    inline: false,
  });

  const embed: DiscordEmbed = {
    title: "💼 New Service / Project Request",
    url: cmsLink,
    color: EMBED_COLORS.services,
    description: `Received via **${SITE_URL}/services**`,
    fields,
    footer: {
      text: "wismannur.pro • Services",
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook("services", { embeds: [embed] });
}

export interface HireRequestNotificationPayload {
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

/**
 * Sends a rich notification to Discord for Hire Me recruiter/talent opportunities.
 */
export async function sendDiscordHireNotification(
  payload: HireRequestNotificationPayload
): Promise<boolean> {
  const cmsLink = payload.id
    ? `${SITE_URL}/cms/hire-requests/${payload.id}`
    : `${SITE_URL}/cms/hire-requests`;

  const fields: DiscordEmbedField[] = [
    {
      name: "👤 Recruiter / Contact",
      value: `${truncate(payload.name, 100)} (<${truncate(payload.email, 100)}>)`,
      inline: true,
    },
    {
      name: "🏢 Company",
      value: truncate(payload.company, 100),
      inline: true,
    },
    {
      name: "🎯 Role Title",
      value: truncate(payload.roleTitle, 100),
      inline: true,
    },
    {
      name: "💼 Employment & Workplace",
      value: `${truncate(payload.employmentType, 50)} • ${truncate(payload.workplaceType, 50)}${payload.location ? ` (${truncate(payload.location, 50)})` : ""}`,
      inline: false,
    },
  ];

  if (payload.salaryRange) {
    fields.push({
      name: "💵 Salary Range",
      value: truncate(payload.salaryRange, 100),
      inline: true,
    });
  }

  if (payload.id) {
    fields.push({
      name: "🏷️ Tracking Ref ID",
      value: `\`${payload.id}\``,
      inline: true,
    });
  }

  fields.push({
    name: "💬 Opportunity Message",
    value: truncate(payload.message, 1000) || "*(Empty message)*",
    inline: false,
  });

  fields.push({
    name: "⚡ Action",
    value: `[Open in Hire Requests CMS →](${cmsLink})`,
    inline: false,
  });

  const embed: DiscordEmbed = {
    title: "🤝 New Hire Me Opportunity",
    url: cmsLink,
    color: EMBED_COLORS.hire,
    description: `Received via **${SITE_URL}/hire-me**`,
    fields,
    footer: {
      text: "wismannur.pro • Hire Requests",
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook("hire", { embeds: [embed] });
}

export interface InboundAlertNotificationPayload {
  inquiryId: string;
  inquiryType: "contact" | "service_request" | "hire_request" | "job_outreach";
  clientName: string;
  clientEmail: string;
  subject: string;
  message: string;
  isNewConversation?: boolean;
}

/**
 * Sends a rich notification to Discord when a client or recruiter sends an inbound email/reply.
 */
export async function sendDiscordInboundNotification(
  payload: InboundAlertNotificationPayload
): Promise<boolean> {
  const cmsLink = payload.isNewConversation
    ? `${SITE_URL}/cms/direct-emails/${payload.inquiryId}`
    : payload.inquiryType === "hire_request"
      ? `${SITE_URL}/cms/hire-requests/${payload.inquiryId}`
      : payload.inquiryType === "service_request"
        ? `${SITE_URL}/cms/services/${payload.inquiryId}`
        : payload.inquiryType === "job_outreach"
          ? `${SITE_URL}/cms/job-outreaches/${payload.inquiryId}`
          : `${SITE_URL}/cms/contacts/${payload.inquiryId}`;

  const fields: DiscordEmbedField[] = [
    {
      name: "👤 Sender",
      value: `${truncate(payload.clientName, 100)} (<${truncate(payload.clientEmail, 100)}>)`,
      inline: true,
    },
    {
      name: "📌 Subject",
      value: truncate(payload.subject, 200),
      inline: true,
    },
    {
      name: "🏷️ Inquiry Ref ID",
      value: `\`${payload.inquiryId}\` (${payload.inquiryType})`,
      inline: false,
    },
    {
      name: "💬 Inbound Message Snippet",
      value: truncate(payload.message, 1000) || "*(Empty reply body)*",
      inline: false,
    },
    {
      name: "⚡ Action",
      value: payload.isNewConversation
        ? `[Open Direct Email in CMS →](${cmsLink})`
        : `[Open Inbound Thread in CMS →](${cmsLink})`,
      inline: false,
    },
  ];

  const embed: DiscordEmbed = {
    title: payload.isNewConversation
      ? "📩 New Direct Inbound Email"
      : "💬 Inbound Email Reply Received",
    url: cmsLink,
    color: EMBED_COLORS.inbound,
    description: `Incoming transmission addressed to Wisman Nur inbox.`,
    fields,
    footer: {
      text: "wismannur.pro • Inbound Webhook",
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook("inbound", { embeds: [embed] });
}
