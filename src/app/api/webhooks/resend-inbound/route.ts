import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { Webhook } from "svix";

import { getDb, schema } from "@/db";
import { sendInboundAlertToAdmin } from "@/services/core/resend";

const { contacts, serviceRequests, inquiryMessages } = schema;

function extractCleanEmail(rawFrom: string): { name: string; email: string } {
	const match = rawFrom.match(/(.*?)\s*<([^>]+)>/);
	if (match) {
		return {
			name: match[1]?.trim() || match[2]?.trim() || "Client",
			email: match[2]?.trim() || rawFrom.trim(),
		};
	}
	return {
		name: rawFrom.split("@")[0] || "Client",
		email: rawFrom.trim(),
	};
}

function extractInquiryId(subject: string): string | null {
	// Look for pattern [Ref: #ID] or [Ref: ID]
	const match = subject.match(/\[Ref:\s*#?([a-zA-Z0-9_-]+)\]/i);
	return match ? match[1].trim() : null;
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
				console.error("Invalid webhook signature:", err);
				return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
			}
		}

		const body = JSON.parse(rawPayload);

		// Handle both Resend standard webhook payload and direct inbound formats
		const data = body.data || body;
		const fromRaw = data.from || "";
		const subject = data.subject || "(No Subject)";
		const textContent = cleanReplyBody(data.text || data.html || "");

		const { name: senderName, email: senderEmail } = extractCleanEmail(fromRaw);

		if (!senderEmail || !textContent) {
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
		}

		return NextResponse.json({ success: true, matched: !!targetInquiryId });
	} catch (error) {
		console.error("Error processing inbound email webhook:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
