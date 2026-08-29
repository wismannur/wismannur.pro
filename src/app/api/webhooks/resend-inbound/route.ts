import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { Resend } from "resend";
import { Webhook } from "svix";

import { getDb, schema } from "@/db";
import { sendInboundAlertToAdmin } from "@/services/core/resend";

const { contacts, serviceRequests, inquiryMessages } = schema;

function extractCleanEmail(rawFrom: unknown): { name: string; email: string } {
	if (!rawFrom) return { name: "Client", email: "" };

	const first = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;
	if (typeof first === "object" && first !== null) {
		const obj = first as Record<string, unknown>;
		const email = String(obj.email || obj.address || "").trim().toLowerCase();
		const name = String(obj.name || email.split("@")[0] || "Client")
			.trim()
			.replace(/^["']|["']$/g, "");
		return { name: name || "Client", email };
	}

	const fromStr = typeof first === "string" ? first.trim() : "";
	const match = fromStr.match(/(.*?)\s*<([^>]+)>/);
	if (match) {
		const rawName = match[1]?.trim().replace(/^["']|["']$/g, "") || "";
		const email = match[2]?.trim().toLowerCase();
		return {
			name: rawName || email.split("@")[0] || "Client",
			email,
		};
	}

	const cleanStr = fromStr.replace(/[<>]/g, "").trim().toLowerCase();
	return {
		name: cleanStr.split("@")[0] || "Client",
		email: cleanStr,
	};
}

function extractInquiryId(subject: string): string | null {
	if (!subject) return null;
	// 1. Look for explicit pattern [Ref: #ID] or (Ref: ID) or Ref: ID
	const refMatch = subject.match(/(?:\[|\()?\bRef:\s*#?([a-zA-Z0-9_-]+)(?:\]|\))?/i);
	if (refMatch && refMatch[1]) {
		return refMatch[1].trim();
	}
	// 2. Fallback: match standard UUID pattern anywhere in subject
	const uuidMatch = subject.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
	if (uuidMatch && uuidMatch[1]) {
		return uuidMatch[1].trim();
	}
	return null;
}

function htmlToPlainText(html: string): string {
	if (!html) return "";
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
	const lines = text.split("\n");
	const cleanedLines: string[] = [];

	for (const line of lines) {
		// Stop at common email quote headers
		if (line.match(/^On\s.+wrote:$/i)) break;
		if (line.match(/^Pada\s.+menulis:$/i)) break;
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
		const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();

		// 1. Verify Svix / StandardWebhooks signature if secret is configured in environment
		if (webhookSecret) {
			const svixId =
				req.headers.get("svix-id") ||
				req.headers.get("webhook-id") ||
				req.headers.get("x-svix-id");
			const svixTimestamp =
				req.headers.get("svix-timestamp") ||
				req.headers.get("webhook-timestamp") ||
				req.headers.get("x-svix-timestamp");
			const svixSignature =
				req.headers.get("svix-signature") ||
				req.headers.get("webhook-signature") ||
				req.headers.get("x-svix-signature");

			if (!svixId || !svixTimestamp || !svixSignature) {
				console.error(
					"[Resend Inbound] Missing webhook signature headers while RESEND_WEBHOOK_SECRET is set",
					{ svixId: !!svixId, svixTimestamp: !!svixTimestamp, svixSignature: !!svixSignature }
				);
				return NextResponse.json({ error: "Missing webhook signature headers" }, { status: 400 });
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

		let body: Record<string, unknown> = {};
		try {
			body = JSON.parse(rawPayload);
		} catch {
			return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
		}

		// 2. Ignore non-receiving event types (e.g. email.sent, email.delivered)
		const eventType = String(body.type || "");
		if (eventType && eventType !== "email.received") {
			console.log(`[Resend Inbound] Ignored non-inbound event: ${eventType}`);
			return NextResponse.json({ message: `Ignored event: ${eventType}` }, { status: 200 });
		}

		const data = (body.data as Record<string, unknown>) || body;
		let fromRaw = data.from || "";
		let subject = String(data.subject || "(No Subject)");
		let rawText = typeof data.text === "string" ? data.text : "";
		let rawHtml = typeof data.html === "string" ? data.html : "";

		// 3. Resend's email.received webhook payload contains email_id. Fetch full body via Receiving API.
		const emailId = String(data.email_id || data.id || body.email_id || body.id || "");
		const resendApiKey = process.env.RESEND_API_KEY?.trim();
		const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

		if (emailId && resendClient) {
			try {
				const { data: fullEmail, error } = await resendClient.emails.receiving.get(emailId);
				if (error) {
					console.error("[Resend Inbound] Failed to fetch email from Resend Receiving API:", error);
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

		// 4. Extract message text content
		let textContent = "";
		if (rawText) {
			textContent = cleanReplyBody(rawText);
		}
		if (!textContent && rawHtml) {
			textContent = cleanReplyBody(htmlToPlainText(rawHtml));
		}
		if (!textContent) {
			textContent = rawText.trim() || htmlToPlainText(rawHtml) || subject || "(Pesan masuk tanpa teks)";
		}

		const { name: senderName, email: senderEmail } = extractCleanEmail(fromRaw);

		if (!senderEmail) {
			console.warn("[Resend Inbound] Webhook received but sender email is missing. fromRaw:", fromRaw);
			return NextResponse.json({ message: "Sender email missing, skipped" }, { status: 200 });
		}

		const db = getDb();
		let targetInquiryId: string | null = extractInquiryId(subject);
		let targetInquiryType: "contact" | "service_request" = "contact";
		let targetSubject = subject;

		// 5. Match by explicit reference ID if found
		if (targetInquiryId) {
			const [contactRow] = await db
				.select()
				.from(contacts)
				.where(eq(contacts.id, targetInquiryId))
				.limit(1);

			if (contactRow) {
				targetInquiryType = "contact";
				targetSubject = contactRow.subject;
			} else {
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

		// 6. Fallback: match by sender email with most recent inquiry (case-insensitive)
		if (!targetInquiryId && senderEmail) {
			const [latestContactRows, latestServiceRows] = await Promise.all([
				db
					.select()
					.from(contacts)
					.where(sql`lower(${contacts.email}) = ${senderEmail.toLowerCase()}`)
					.orderBy(desc(contacts.createdAt))
					.limit(1),
				db
					.select()
					.from(serviceRequests)
					.where(sql`lower(${serviceRequests.email}) = ${senderEmail.toLowerCase()}`)
					.orderBy(desc(serviceRequests.createdAt))
					.limit(1),
			]);

			const contactMatch = latestContactRows[0];
			const serviceMatch = latestServiceRows[0];

			if (contactMatch && serviceMatch) {
				if (new Date(contactMatch.createdAt).getTime() >= new Date(serviceMatch.createdAt).getTime()) {
					targetInquiryId = contactMatch.id;
					targetInquiryType = "contact";
					targetSubject = contactMatch.subject;
				} else {
					targetInquiryId = serviceMatch.id;
					targetInquiryType = "service_request";
					targetSubject = serviceMatch.serviceType;
				}
			} else if (contactMatch) {
				targetInquiryId = contactMatch.id;
				targetInquiryType = "contact";
				targetSubject = contactMatch.subject;
			} else if (serviceMatch) {
				targetInquiryId = serviceMatch.id;
				targetInquiryType = "service_request";
				targetSubject = serviceMatch.serviceType;
			}
		}

		// 7. If still not matched, create a new contact inquiry so the email is NEVER lost and visible in CMS
		if (!targetInquiryId) {
			const cleanSubject = subject.replace(/^(Re:\s*)+/i, "").trim() || "Inbound Email";
			const [newContact] = await db
				.insert(contacts)
				.values({
					name: senderName || "Client",
					email: senderEmail,
					subject: cleanSubject,
					message: textContent,
					status: "new",
				})
				.returning({ id: contacts.id });

			targetInquiryId = newContact.id;
			targetInquiryType = "contact";
			targetSubject = cleanSubject;

			console.log(
				`[Resend Inbound] No existing inquiry found. Created new contact ${targetInquiryId} for ${senderEmail}`
			);
		}

		// 8. Insert inbound message into inquiryMessages thread
		await db.insert(inquiryMessages).values({
			inquiryId: targetInquiryId,
			inquiryType: targetInquiryType,
			senderType: "client",
			senderName: senderName || "Client",
			senderEmail,
			message: textContent,
		});

		// 9. Update inquiry status to "new" to highlight it in CMS
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

		// 10. Send email alert to Admin
		await sendInboundAlertToAdmin({
			inquiryId: targetInquiryId,
			inquiryType: targetInquiryType,
			clientName: senderName || "Client",
			clientEmail: senderEmail,
			subject: targetSubject,
			message: textContent,
		});

		console.log(
			`[Resend Inbound] Successfully recorded inbound email for inquiry ${targetInquiryId} (${targetInquiryType}) from ${senderEmail}`
		);

		return NextResponse.json({ success: true, inquiryId: targetInquiryId, matched: true });
	} catch (error) {
		console.error("[Resend Inbound] Error processing inbound email webhook:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
