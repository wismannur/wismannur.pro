import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { Resend } from "resend";
import { Webhook } from "svix";

import { getDb, schema } from "@/db";
import { sendInboundAlertToAdmin } from "@/services/core/resend";

const { contacts, serviceRequests, inquiryMessages } = schema;
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function extractCleanEmail(rawFrom: unknown): { name: string; email: string } {
	const fromStr =
		Array.isArray(rawFrom) ? String(rawFrom[0] || "") : typeof rawFrom === "string" ? rawFrom : "";
	const match = fromStr.match(/(.*?)\s*<([^>]+)>/);
	if (match) {
		return {
			name: match[1]?.trim() || match[2]?.trim() || "Client",
			email: match[2]?.trim() || fromStr.trim(),
		};
	}
	return {
		name: fromStr.split("@")[0] || "Client",
		email: fromStr.trim(),
	};
}

function extractInquiryId(subject: string): string | null {
	// Look for pattern [Ref: #ID] or [Ref: ID]
	const match = subject.match(/\[Ref:\s*#?([a-zA-Z0-9_-]+)\]/i);
	return match ? match[1].trim() : null;
}

function htmlToPlainText(html: string): string {
	return html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<br\s*[\/]?>/gi, "\n")
		.replace(/<\/p>/gi, "\n\n")
		.replace(/<\/div>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.trim();
}

function cleanReplyBody(text: string): string {
	if (!text) return "";
	// Strip common email quote footers
	const lines = text.split("\n");
	const cleanedLines: string[] = [];

	for (const line of lines) {
		// Stop at standard "On ... wrote:" quotes
		if (line.match(/^On\s.+wrote:$/i)) break;
		if (line.match(/^---+\s*Original Message\s*---+/i)) break;
		if (line.match(/^_{5,}/)) break;
		cleanedLines.push(line);
	}

	const result = cleanedLines.join("\n").trim();
	return result || text.trim();
}

export async function POST(req: NextRequest) {
	try {
		const rawPayload = await req.text();
		const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

		// Verify Svix signature if secret is provided in environment
		if (webhookSecret) {
			const svixId = req.headers.get("svix-id");
			const svixTimestamp = req.headers.get("svix-timestamp");
			const svixSignature = req.headers.get("svix-signature");

			if (!svixId || !svixTimestamp || !svixSignature) {
				console.error("[Resend Inbound] Missing Svix headers while RESEND_WEBHOOK_SECRET is set");
				return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
			}

			try {
				const wh = new Webhook(webhookSecret);
				wh.verify(rawPayload, {
					"svix-id": svixId,
					"svix-timestamp": svixTimestamp,
					"svix-signature": svixSignature,
				});
			} catch (err) {
				console.error("[Resend Inbound] Invalid webhook signature:", err);
				return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
			}
		}

		const body = JSON.parse(rawPayload);

		// Handle Resend standard webhook payload (e.g. type: "email.received")
		const data = body.data || body;
		let fromRaw = data.from || "";
		let subject = data.subject || "(No Subject)";
		let rawText = data.text || "";
		let rawHtml = data.html || "";

		// Resend's email.received webhook payload only contains metadata (email_id).
		// We fetch the full body content via Resend Receiving API.
		const emailId = data.email_id || data.id;
		if (!rawText && !rawHtml && emailId && resend) {
			try {
				const { data: fullEmail, error } = await resend.emails.receiving.get(emailId);
				if (error) {
					console.error("[Resend Inbound] Failed to fetch email from Resend API:", error);
				} else if (fullEmail) {
					if (fullEmail.from) fromRaw = fullEmail.from;
					if (fullEmail.subject) subject = fullEmail.subject;
					if (fullEmail.text) rawText = fullEmail.text;
					if (fullEmail.html) rawHtml = fullEmail.html;
				}
			} catch (err) {
				console.error("[Resend Inbound] Error calling resend.emails.receiving.get:", err);
			}
		}

		let textContent = "";
		if (rawText) {
			textContent = cleanReplyBody(rawText);
		} else if (rawHtml) {
			textContent = cleanReplyBody(htmlToPlainText(rawHtml));
		}

		const { name: senderName, email: senderEmail } = extractCleanEmail(fromRaw);

		if (!senderEmail || !textContent) {
			console.warn("[Resend Inbound] Incomplete email payload skipped. senderEmail:", senderEmail, "hasContent:", !!textContent);
			return NextResponse.json({ message: "Incomplete email payload, skipped" }, { status: 200 });
		}

		const db = getDb();
		let targetInquiryId = extractInquiryId(subject);
		let targetInquiryType: "contact" | "service_request" = "contact";
		let targetSubject = subject;

		if (targetInquiryId) {
			// 1. Check if ID exists in contacts table
			const [contactRow] = await db
				.select()
				.from(contacts)
				.where(eq(contacts.id, targetInquiryId))
				.limit(1);

			if (contactRow) {
				targetInquiryType = "contact";
				targetSubject = contactRow.subject;
			} else {
				// 2. Check if ID exists in serviceRequests table
				const [serviceRow] = await db
					.select()
					.from(serviceRequests)
					.where(eq(serviceRequests.id, targetInquiryId))
					.limit(1);

				if (serviceRow) {
					targetInquiryType = "service_request";
					targetSubject = serviceRow.serviceType;
				} else {
					targetInquiryId = null;
				}
			}
		}

		// Fallback: If no ref tag in subject, match by sender email with latest active inquiry
		if (!targetInquiryId) {
			const [latestContact] = await db
				.select()
				.from(contacts)
				.where(eq(contacts.email, senderEmail))
				.orderBy(desc(contacts.createdAt))
				.limit(1);

			if (latestContact) {
				targetInquiryId = latestContact.id;
				targetInquiryType = "contact";
				targetSubject = latestContact.subject;
			} else {
				const [latestService] = await db
					.select()
					.from(serviceRequests)
					.where(eq(serviceRequests.email, senderEmail))
					.orderBy(desc(serviceRequests.createdAt))
					.limit(1);

				if (latestService) {
					targetInquiryId = latestService.id;
					targetInquiryType = "service_request";
					targetSubject = latestService.serviceType;
				}
			}
		}

		// If matched to an inquiry, store the inbound reply in DB
		if (targetInquiryId) {
			await db.insert(inquiryMessages).values({
				inquiryId: targetInquiryId,
				inquiryType: targetInquiryType,
				senderType: "client",
				senderName,
				senderEmail,
				message: textContent,
			});

			// Re-open / update inquiry status so it's highlighted in CMS
			if (targetInquiryType === "contact") {
				await db
					.update(contacts)
					.set({ status: "new" })
					.where(eq(contacts.id, targetInquiryId));
			} else {
				await db
					.update(serviceRequests)
					.set({ status: "new" })
					.where(eq(serviceRequests.id, targetInquiryId));
			}

			// Send instant alert email to Admin
			await sendInboundAlertToAdmin({
				inquiryId: targetInquiryId,
				inquiryType: targetInquiryType,
				clientName: senderName,
				clientEmail: senderEmail,
				subject: targetSubject,
				message: textContent,
			});

			console.log(`[Resend Inbound] Successfully linked message to inquiry ${targetInquiryId} (${targetInquiryType}) from ${senderEmail}`);
		} else {
			console.warn(`[Resend Inbound] Inbound email received but no matching inquiry found for sender: ${senderEmail}, subject: ${subject}`);
		}

		return NextResponse.json({ success: true, matched: !!targetInquiryId });
	} catch (error) {
		console.error("[Resend Inbound] Error processing inbound email webhook:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
