import "server-only";

import { Resend } from "resend";
import AdminContactNotificationEmail from "@/components/emails/admin-contact-notification";
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
	inquiryType: "contact" | "service_request" | "hire_request" | "job_outreach";
	clientName: string;
	clientEmail: string;
	subject: string;
	message: string;
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
}



/**
 * Sends both Admin notification and Client auto-reply for contact inquiries.
 * Fail-safe: Any Resend error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendContactEmails(payload: ContactEmailPayload): Promise<void> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping email delivery.");
		return;
	}

	try {
		const sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
		const dynamicReplyTo = payload.id ? `${payload.id}@wismannur.pro` : "hi@wismannur.pro";

		await Promise.allSettled([
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
	} catch (error) {
		console.error("Failed to send contact emails via Resend:", error);
	}
}

/**
 * Sends both Admin notification and Client auto-reply for Hire-Me service requests.
 * Fail-safe: Any Resend error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendServiceRequestEmails(payload: ServiceRequestEmailPayload): Promise<void> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping email delivery.");
		return;
	}

	try {
		const sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
		const dynamicReplyTo = payload.id ? `${payload.id}@wismannur.pro` : "hi@wismannur.pro";

		await Promise.allSettled([
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
	} catch (error) {
		console.error("Failed to send service request emails via Resend:", error);
	}
}

/**
 * Sends both Admin notification and Client auto-reply for Hire-Me career/job inquiries.
 * Fail-safe: Any Resend error is caught and logged, never bubbling up to crash the form submission.
 */
export async function sendHireRequestEmails(payload: HireRequestEmailPayload): Promise<void> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping email delivery.");
		return;
	}

	try {
		const sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
		const dynamicReplyTo = payload.id ? `${payload.id}@wismannur.pro` : "hi@wismannur.pro";

		await Promise.allSettled([
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
	} catch (error) {
		console.error("Failed to send hire request emails via Resend:", error);
	}
}

/**
 * Sends an email response from the Admin directly to the Client.
 */
export async function sendAdminReplyToClient(payload: AdminReplyPayload): Promise<void> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping reply email.");
		return;
	}

	try {
		let formattedSubject = payload.subject.trim();
		if (!formattedSubject.toLowerCase().startsWith("re:")) {
			formattedSubject = `Re: ${formattedSubject}`;
		}

		await resend.emails.send({
			from: SENDER_HI,
			to: payload.toEmail,
			replyTo: payload.inquiryId ? `${payload.inquiryId}@wismannur.pro` : "hi@wismannur.pro",
			subject: formattedSubject,
			headers: {
				"X-Entity-Ref-ID": payload.inquiryId,
			},
			react: AdminReplyToClientEmail({
				clientName: payload.toName,
				replyMessage: payload.message,
				originalSubject: payload.subject,
				originalMessageSnippet: payload.originalMessageSnippet,
				inquiryId: payload.inquiryId,
			}),
		});
	} catch (error) {
		console.error("Failed to send admin reply email via Resend:", error);
		throw error;
	}
}

/**
 * Sends an alert to Admin when a Client or Recruiter sends an inbound reply via email.
 */
export async function sendInboundAlertToAdmin(payload: InboundAlertPayload): Promise<void> {
	const resend = getResendClient();
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

/**
 * Sends an outbound job application / cold outreach / follow-up email to a recruiter or company contact.
 */
export async function sendJobOutreachEmail(payload: JobOutreachSendPayload): Promise<void> {
	const resend = getResendClient();
	if (!resend) {
		console.warn("Resend is not configured: RESEND_API_KEY is missing. Skipping job outreach email.");
		return;
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

		await resend.emails.send({
			from: SENDER_HI,
			to: payload.toEmail,
			replyTo: payload.outreachId ? `${payload.outreachId}@wismannur.pro` : "hi@wismannur.pro",
			subject: formattedSubject,
			attachments: resendAttachments,
			headers: {
				"X-Entity-Ref-ID": payload.outreachId,
			},
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

	} catch (error) {
		console.error("Failed to send job outreach email via Resend:", error);
		throw error;
	}
}





