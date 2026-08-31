import "server-only";

import { Resend } from "resend";
import AdminContactNotificationEmail from "@/components/emails/admin-contact-notification";
import AdminDirectEmailAlertEmail from "@/components/emails/admin-direct-email-alert";
import AdminHireRequestNotificationEmail from "@/components/emails/admin-hire-request-notification";
import AdminInboundAlertEmail from "@/components/emails/admin-inbound-alert";
import AdminReplyToClientEmail from "@/components/emails/admin-reply-to-client";
import AdminServiceRequestNotificationEmail from "@/components/emails/admin-service-request-notification";
import ClientContactAutoReplyEmail from "@/components/emails/client-contact-auto-reply";
import ClientHireRequestAutoReplyEmail from "@/components/emails/client-hire-request-auto-reply";
import ClientServiceRequestAutoReplyEmail from "@/components/emails/client-service-request-auto-reply";
import JobOutreachEmail from "@/components/emails/job-outreach-email";

function getResendClient(): Resend | null {
	const resendApiKey = process.env.RESEND_API_KEY?.trim();
	return resendApiKey ? new Resend(resendApiKey) : null;
}

const ADMIN_EMAIL =
	process.env.ADMIN_NOTIFICATION_EMAIL ||
	process.env.ADMIN_EMAIL ||
	"wismannur.pro@gmail.com";

const SENDER_NOTIFICATIONS =
	process.env.RESEND_FROM_NOTIFICATIONS || "Wisman Nur <notifications@wismannur.pro>";

const SENDER_HI =
	process.env.RESEND_FROM_HI ||
	process.env.RESEND_FROM_HELLO ||
	"Wisman Nur <hi@wismannur.pro>";

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
export function formatMessageIdHeader(id: string | null | undefined): string | null {
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
export function buildThreadingHeaders(params: {
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
 * Sends both Admin notification and Client auto-reply for contact inquiries.
 * Fail-safe: Any Resend error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendContactEmails(
	payload: ContactEmailPayload,
): Promise<{ clientEmailId?: string; adminEmailId?: string }> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping email delivery.");
		return {};
	}

	try {
		const sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
		const dynamicReplyTo = payload.id ? `${payload.id}@wismannur.pro` : "hi@wismannur.pro";

		const [adminRes, clientRes] = await Promise.allSettled([
			// 1. Notification to Admin
			resend.emails.send({
				from: SENDER_NOTIFICATIONS,
				to: ADMIN_EMAIL,
				replyTo: payload.email,
				subject: `[Contact Form] ${payload.subject} - ${payload.name}`,
				headers: payload.id ? { "X-Entity-Ref-ID": payload.id } : undefined,
				react: AdminContactNotificationEmail({
					name: payload.name,
					email: payload.email,
					subject: payload.subject,
					message: payload.message,
					sentAt,
				}),
			}),

			// 2. Auto-reply confirmation to Client
			resend.emails.send({
				from: SENDER_HI,
				to: payload.email,
				replyTo: dynamicReplyTo,
				subject: "Pesan Anda telah diterima - Wisman Nur",
				headers: payload.id ? { "X-Entity-Ref-ID": payload.id } : undefined,
				react: ClientContactAutoReplyEmail({
					name: payload.name,
					subject: payload.subject,
					message: payload.message,
					refId: payload.id,
				}),
			}),
		]);

		const adminEmailId =
			adminRes.status === "fulfilled" && adminRes.value.data?.id ? adminRes.value.data.id : undefined;
		const clientEmailId =
			clientRes.status === "fulfilled" && clientRes.value.data?.id ? clientRes.value.data.id : undefined;

		return { adminEmailId, clientEmailId };
	} catch (error) {
		console.error("Failed to send contact emails via Resend:", error);
		return {};
	}
}

/**
 * Sends both Admin notification and Client auto-reply for Hire-Me service requests.
 * Fail-safe: Any Resend error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendServiceRequestEmails(
	payload: ServiceRequestEmailPayload,
): Promise<{ clientEmailId?: string; adminEmailId?: string }> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping email delivery.");
		return {};
	}

	try {
		const sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
		const dynamicReplyTo = payload.id ? `${payload.id}@wismannur.pro` : "hi@wismannur.pro";

		const [adminRes, clientRes] = await Promise.allSettled([
			// 1. Notification to Admin
			resend.emails.send({
				from: SENDER_NOTIFICATIONS,
				to: ADMIN_EMAIL,
				replyTo: payload.email,
				subject: `[Hire Me Request] ${payload.serviceType} - ${payload.name}${payload.company ? ` (${payload.company})` : ""}`,
				headers: payload.id ? { "X-Entity-Ref-ID": payload.id } : undefined,
				react: AdminServiceRequestNotificationEmail({
					name: payload.name,
					email: payload.email,
					company: payload.company,
					serviceType: payload.serviceType,
					budget: payload.budget,
					timeframe: payload.timeframe,
					projectDetails: payload.projectDetails,
					sentAt,
				}),
			}),

			// 2. Auto-reply confirmation to Client
			resend.emails.send({
				from: SENDER_HI,
				to: payload.email,
				replyTo: dynamicReplyTo,
				subject: "Permintaan proyek diterima - Wisman Nur",
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
		]);

		const adminEmailId =
			adminRes.status === "fulfilled" && adminRes.value.data?.id ? adminRes.value.data.id : undefined;
		const clientEmailId =
			clientRes.status === "fulfilled" && clientRes.value.data?.id ? clientRes.value.data.id : undefined;

		return { adminEmailId, clientEmailId };
	} catch (error) {
		console.error("Failed to send service request emails via Resend:", error);
		return {};
	}
}

/**
 * Sends both Admin notification and Client auto-reply for Hire-Me career/job inquiries.
 * Fail-safe: Any Resend error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendHireRequestEmails(
	payload: HireRequestEmailPayload,
): Promise<{ clientEmailId?: string; adminEmailId?: string }> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping email delivery.");
		return {};
	}

	try {
		const sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
		const dynamicReplyTo = payload.id ? `${payload.id}@wismannur.pro` : "hi@wismannur.pro";

		const [adminRes, clientRes] = await Promise.allSettled([
			// 1. Notification to Admin
			resend.emails.send({
				from: SENDER_NOTIFICATIONS,
				to: ADMIN_EMAIL,
				replyTo: payload.email,
				subject: `[Hire Inquiry] ${payload.roleTitle} @ ${payload.company} - ${payload.name}`,
				headers: payload.id ? { "X-Entity-Ref-ID": payload.id } : undefined,
				react: AdminHireRequestNotificationEmail({
					name: payload.name,
					email: payload.email,
					company: payload.company,
					roleTitle: payload.roleTitle,
					employmentType: payload.employmentType,
					workplaceType: payload.workplaceType,
					location: payload.location,
					salaryRange: payload.salaryRange,
					message: payload.message,
					sentAt,
				}),
			}),

			// 2. Auto-reply confirmation to Recruiter / Client
			resend.emails.send({
				from: SENDER_HI,
				to: payload.email,
				replyTo: dynamicReplyTo,
				subject: `Pesan penawaran posisi ${payload.roleTitle} diterima - Wisman Nur`,
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
		]);

		const adminEmailId =
			adminRes.status === "fulfilled" && adminRes.value.data?.id ? adminRes.value.data.id : undefined;
		const clientEmailId =
			clientRes.status === "fulfilled" && clientRes.value.data?.id ? clientRes.value.data.id : undefined;

		return { adminEmailId, clientEmailId };
	} catch (error) {
		console.error("Failed to send hire request emails via Resend:", error);
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

		const headers = buildThreadingHeaders({
			entityRefId: payload.inquiryId,
			inReplyToId: payload.inReplyToId,
			referencesIds: payload.referencesIds,
		});

		const { data, error } = await resend.emails.send({
			from: SENDER_HI,
			to: payload.toEmail,
			replyTo: payload.inquiryId ? `${payload.inquiryId}@wismannur.pro` : "hi@wismannur.pro",
			subject: formattedSubject,
			headers,
			react: AdminReplyToClientEmail({
				clientName: payload.toName,
				replyMessage: payload.message,
				originalSubject: payload.subject,
				originalMessageSnippet: payload.originalMessageSnippet,
				inquiryId: payload.inquiryId,
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
 * Sends an alert to Admin when a Client or Recruiter sends an inbound email or reply.
 */
export async function sendInboundAlertToAdmin(payload: InboundAlertPayload): Promise<void> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping inbound alert.");
		return;
	}

	try {
		const alertSubject = payload.isNewConversation
			? `[New Direct Email] ${payload.clientName}: ${payload.subject}`
			: `[Inbound Reply] ${payload.clientName} membalas: ${payload.subject}`;

		const alertReact = payload.isNewConversation
			? AdminDirectEmailAlertEmail({
					inquiryId: payload.inquiryId,
					clientName: payload.clientName,
					clientEmail: payload.clientEmail,
					subject: payload.subject,
					message: payload.message,
					toAddress: payload.toAddress,
				})
			: AdminInboundAlertEmail({
					inquiryId: payload.inquiryId,
					inquiryType: payload.inquiryType,
					clientName: payload.clientName,
					clientEmail: payload.clientEmail,
					subject: payload.subject,
					message: payload.message,
				});

		await resend.emails.send({
			from: SENDER_NOTIFICATIONS,
			to: ADMIN_EMAIL,
			replyTo: payload.clientEmail,
			subject: alertSubject,
			react: alertReact,
		});
	} catch (error) {
		console.error("Failed to send inbound alert email via Resend:", error);
	}
}

/**
 * Sends an outbound job application / cold outreach / follow-up email to a recruiter or company contact.
 */
export async function sendJobOutreachEmail(payload: JobOutreachSendPayload): Promise<{ id?: string }> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping job outreach email.");
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
						path: att.url,
					}))
				: undefined;

		const headers = buildThreadingHeaders({
			entityRefId: payload.outreachId,
			inReplyToId: payload.inReplyToId,
			referencesIds: payload.referencesIds,
		});

		const { data, error } = await resend.emails.send({
			from: SENDER_HI,
			to: payload.toEmail,
			replyTo: payload.outreachId ? `${payload.outreachId}@wismannur.pro` : "hi@wismannur.pro",
			subject: formattedSubject,
			attachments: resendAttachments,
			headers,
			react: JobOutreachEmail({
				contactName: payload.toName,
				bodyMessage: payload.message,
				subject: payload.subject,
				companyName: payload.companyName,
				jobTitle: payload.jobTitle,
				attachments: payload.attachments,
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





