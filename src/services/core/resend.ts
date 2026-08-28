import "server-only";

import { Resend } from "resend";
import AdminContactNotificationEmail from "@/components/emails/admin-contact-notification";
import AdminInboundAlertEmail from "@/components/emails/admin-inbound-alert";
import AdminReplyToClientEmail from "@/components/emails/admin-reply-to-client";
import AdminServiceRequestNotificationEmail from "@/components/emails/admin-service-request-notification";
import ClientContactAutoReplyEmail from "@/components/emails/client-contact-auto-reply";
import ClientServiceRequestAutoReplyEmail from "@/components/emails/client-service-request-auto-reply";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
	name: string;
	email: string;
	subject: string;
	message: string;
}

interface ServiceRequestEmailPayload {
	name: string;
	email: string;
	company?: string;
	serviceType: string;
	budget: string;
	timeframe: string;
	projectDetails: string;
}

interface AdminReplyPayload {
	inquiryId: string;
	toEmail: string;
	toName: string;
	subject: string;
	message: string;
	originalMessageSnippet?: string;
}

interface InboundAlertPayload {
	inquiryId: string;
	inquiryType: "contact" | "service_request";
	clientName: string;
	clientEmail: string;
	subject: string;
	message: string;
}

/**
 * Sends both Admin notification and Client auto-reply for contact inquiries.
 * Fail-safe: Any Resend error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendContactEmails(payload: ContactEmailPayload): Promise<void> {
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping email delivery.");
		return;
	}

	try {
		const sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

		await Promise.allSettled([
			// 1. Notification to Admin
			resend.emails.send({
				from: SENDER_NOTIFICATIONS,
				to: ADMIN_EMAIL,
				replyTo: payload.email,
				subject: `[Contact Form] ${payload.subject} - ${payload.name}`,
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
				replyTo: "hi@wismannur.pro",
				subject: `[Ref: #${payload.subject}] Pesan Anda telah diterima - Wisman Nur`,
				react: ClientContactAutoReplyEmail({
					name: payload.name,
					subject: payload.subject,
					message: payload.message,
				}),
			}),
		]);
	} catch (error) {
		console.error("Failed to send contact emails via Resend:", error);
	}
}

/**
 * Sends both Admin notification and Client auto-reply for Hire-Me service requests.
 * Fail-safe: Any Resend error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendServiceRequestEmails(payload: ServiceRequestEmailPayload): Promise<void> {
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping email delivery.");
		return;
	}

	try {
		const sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

		await Promise.allSettled([
			// 1. Notification to Admin
			resend.emails.send({
				from: SENDER_NOTIFICATIONS,
				to: ADMIN_EMAIL,
				replyTo: payload.email,
				subject: `[Hire Me Request] ${payload.serviceType} - ${payload.name}${payload.company ? ` (${payload.company})` : ""}`,
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
				replyTo: "hi@wismannur.pro",
				subject: `[Ref: #${payload.serviceType}] Permintaan proyek diterima - Wisman Nur`,
				react: ClientServiceRequestAutoReplyEmail({
					name: payload.name,
					serviceType: payload.serviceType,
					budget: payload.budget,
					timeframe: payload.timeframe,
					projectDetails: payload.projectDetails,
				}),
			}),
		]);
	} catch (error) {
		console.error("Failed to send service request emails via Resend:", error);
	}
}

/**
 * Sends an email response from the Admin directly to the Client.
 */
export async function sendAdminReplyToClient(payload: AdminReplyPayload): Promise<void> {
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping reply email.");
		return;
	}

	try {
		const formattedSubject = payload.subject.startsWith("Re:")
			? payload.subject
			: `Re: [Ref: #${payload.inquiryId}] ${payload.subject}`;

		await resend.emails.send({
			from: SENDER_HI,
			to: payload.toEmail,
			replyTo: "hi@wismannur.pro",
			subject: formattedSubject,
			react: AdminReplyToClientEmail({
				clientName: payload.toName,
				replyMessage: payload.message,
				originalSubject: payload.subject,
				originalMessageSnippet: payload.originalMessageSnippet,
			}),
		});
	} catch (error) {
		console.error("Failed to send admin reply email via Resend:", error);
		throw error;
	}
}

/**
 * Sends an alert to Admin when a Client sends an inbound reply via email.
 */
export async function sendInboundAlertToAdmin(payload: InboundAlertPayload): Promise<void> {
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping inbound alert.");
		return;
	}

	try {
		await resend.emails.send({
			from: SENDER_NOTIFICATIONS,
			to: ADMIN_EMAIL,
			subject: `[Inbound Reply] ${payload.clientName} membalas di CMS: ${payload.subject}`,
			react: AdminInboundAlertEmail({
				inquiryId: payload.inquiryId,
				inquiryType: payload.inquiryType,
				clientName: payload.clientName,
				clientEmail: payload.clientEmail,
				subject: payload.subject,
				message: payload.message,
			}),
		});
	} catch (error) {
		console.error("Failed to send inbound alert email via Resend:", error);
	}
}

