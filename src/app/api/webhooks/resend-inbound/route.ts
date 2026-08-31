import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { Resend } from "resend";
import { Webhook } from "svix";

import { getDb, schema } from "@/db";
import { sendInboundAlertToAdmin } from "@/services/core/resend";

const { contacts, serviceRequests, hireRequests, inquiryMessages, jobOutreaches, jobOutreachMessages } = schema;


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

function extractIdFromToAddress(toRaw: unknown): {
	id: string | null;
	type?: "job_outreach" | "contact" | "service_request" | "hire_request";
} {
	const toList = Array.isArray(toRaw) ? toRaw : [toRaw];
	for (const item of toList) {
		const str =
			typeof item === "string"
				? item
				: typeof item === "object" && item
					? String((item as Record<string, unknown>).email || (item as Record<string, unknown>).address || "")
					: "";

		const outreachMatch = str.match(/(?:^|\+)?(outreach[-_][0-9]{10}-[a-z0-9]{3,})/i);
		if (outreachMatch && outreachMatch[1]) {
			return { id: outreachMatch[1].replace("_", "-").toLowerCase(), type: "job_outreach" };
		}
		const contactMatch = str.match(/(?:^|\+)?(contact[-_][0-9]{10}-[a-z0-9]{3,})/i);
		if (contactMatch && contactMatch[1]) {
			return { id: contactMatch[1].replace("_", "-").toLowerCase(), type: "contact" };
		}
		const serviceMatch = str.match(/(?:^|\+)?(service(?:[-_]requests?)?[-_][0-9]{10}-[a-z0-9]{3,})/i);
		if (serviceMatch && serviceMatch[1]) {
			const normalized = serviceMatch[1].replace(/^service[-_]requests?[-_]/i, "service-").replace("_", "-").toLowerCase();
			return { id: normalized, type: "service_request" };
		}
		const hireMatch = str.match(/(?:^|\+)?(hire(?:[-_]inquir(?:y|ies))?[-_][0-9]{10}-[a-z0-9]{3,})/i);
		if (hireMatch && hireMatch[1]) {
			const normalized = hireMatch[1].replace(/^hire[-_]inquir(?:y|ies)[-_]/i, "hire-").replace("_", "-").toLowerCase();
			return { id: normalized, type: "hire_request" };
		}
		const generalMatch = str.match(/((?:outreach|contact|service|hire)[-_][0-9]{10}-[a-z0-9]{3,})/i);
		if (generalMatch && generalMatch[1]) {
			return { id: generalMatch[1].replace("_", "-").toLowerCase() };
		}
	}
	return { id: null };
}

function extractInquiryId(subject: string, rawBody?: string): string | null {
	// 1. Look for explicit pattern [Ref: #ID] or (Ref: ID) or Ref: ID in subject
	if (subject) {
		const refMatch = subject.match(/(?:\[|\()?\bRef:\s*#?((?:outreach|contact|service|hire)[-_][0-9]{10}-[a-z0-9]{3,}|[a-zA-Z0-9_-]+)(?:\]|\))?/i);
		if (refMatch && refMatch[1]) {
			return refMatch[1].trim();
		}
		const generalMatch = subject.match(/((?:outreach|contact|service|hire)[-_][0-9]{10}-[a-z0-9]{3,})/i);
		if (generalMatch && generalMatch[1]) {
			return generalMatch[1].trim();
		}
	}

	// 2. Check quoted reply headers in email body
	if (rawBody) {
		const refMatchBody = rawBody.match(/(?:\[|\()?\bRef:\s*#?((?:outreach|contact|service|hire)[-_][0-9]{10}-[a-z0-9]{3,}|[a-zA-Z0-9_-]+)(?:\]|\))?/i);
		if (refMatchBody && refMatchBody[1]) {
			return refMatchBody[1].trim();
		}
		const generalMatchBody = rawBody.match(/((?:outreach|contact|service|hire)[-_][0-9]{10}-[a-z0-9]{3,})/i);
		if (generalMatchBody && generalMatchBody[1]) {
			return generalMatchBody[1].trim();
		}
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
		let fullEmail: Record<string, unknown> | null = null;

		if (emailId && resendClient) {
			try {
				const { data: resEmail, error } = await resendClient.emails.receiving.get(emailId);
				if (error) {
					console.error("[Resend Inbound] Failed to fetch email from Resend Receiving API:", error);
				} else if (resEmail) {
					fullEmail = resEmail as unknown as Record<string, unknown>;
					if (resEmail.from) fromRaw = resEmail.from;
					if (resEmail.subject) subject = resEmail.subject;
					if (resEmail.text) rawText = resEmail.text;
					if (resEmail.html) rawHtml = resEmail.html;
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
		const toInfo = extractIdFromToAddress(data.to || fullEmail?.to || data.recipient || body.to);
		const emailHeaders = (fullEmail?.headers || {}) as Record<string, unknown>;
		const headerRefId =
			typeof emailHeaders["x-entity-ref-id"] === "string"
				? (emailHeaders["x-entity-ref-id"] as string)
				: typeof emailHeaders["X-Entity-Ref-ID"] === "string"
					? (emailHeaders["X-Entity-Ref-ID"] as string)
					: null;

		const inboundMessageId =
			(typeof emailHeaders["message-id"] === "string" ? (emailHeaders["message-id"] as string) : undefined) ||
			(typeof emailHeaders["Message-ID"] === "string" ? (emailHeaders["Message-ID"] as string) : undefined) ||
			(typeof fullEmail?.message_id === "string" ? (fullEmail.message_id as string) : undefined) ||
			(typeof data.message_id === "string" ? (data.message_id as string) : undefined) ||
			(emailId ? emailId : undefined);

		const rawExplicitRefId =
			toInfo.id ||
			headerRefId ||
			extractInquiryId(subject, rawText || rawHtml);

		const hasExplicitRefId = Boolean(rawExplicitRefId);
		let targetInquiryId: string | null = rawExplicitRefId;
		let targetInquiryType: "contact" | "service_request" | "hire_request" =
			(toInfo.type && toInfo.type !== "job_outreach" ? toInfo.type : undefined) || "contact";
		let targetSubject = subject;
		let foundEntity = false;

		const referencedMessageIds = (function() {
			const inReplyTo = String(emailHeaders["in-reply-to"] || emailHeaders["In-Reply-To"] || fullEmail?.in_reply_to || "");
			const refs = String(emailHeaders["references"] || emailHeaders["References"] || fullEmail?.references || "");
			const combined = `${inReplyTo} ${refs}`.trim();
			if (!combined) return [];
			const bracketMatches = combined.match(/<([^>]+)>/g);
			if (bracketMatches && bracketMatches.length > 0) {
				return bracketMatches.map(b => b.replace(/[<>]/g, "").trim().toLowerCase()).filter(Boolean);
			}
			return combined.split(/\s+/).map(s => s.replace(/[<>]/g, "").trim().toLowerCase()).filter(Boolean);
		})();

		// Helper to normalize subject strings for comparison
		const normalizeSubject = (str: string) =>
			str.replace(/^(?:re|fwd|fw):\s*/gi, "").replace(/\s+/g, " ").trim().toLowerCase();

		const isReplyOrFwd = /^(?:re|fwd|fw):/i.test(subject.trim());

		// 5. Match by explicit reference ID if found
		if (targetInquiryId) {
			// Check job outreaches first
			const [outreachRow] = await db
				.select()
				.from(jobOutreaches)
				.where(eq(jobOutreaches.id, targetInquiryId))
				.limit(1);

			if (outreachRow) {
				foundEntity = true;

				// Deduplication check: ignore duplicate deliveries within 15 seconds
				const fifteenSecondsAgo = new Date(Date.now() - 15000);
				const [recentDuplicate] = await db
					.select()
					.from(jobOutreachMessages)
					.where(
						and(
							eq(jobOutreachMessages.outreachId, outreachRow.id),
							eq(jobOutreachMessages.senderEmail, senderEmail),
							eq(jobOutreachMessages.message, textContent),
							gte(jobOutreachMessages.createdAt, fifteenSecondsAgo),
						),
					)
					.limit(1);

				if (recentDuplicate) {
					console.log(
						`[Resend Inbound] Ignored duplicate job outreach reply within 15s for ${outreachRow.id}`
					);
					return NextResponse.json({ success: true, duplicate: true });
				}

				await db.insert(jobOutreachMessages).values({
					outreachId: outreachRow.id,
					senderType: "client",
					senderName: senderName || outreachRow.contactName || "Recruiter",
					senderEmail,
					message: textContent,
					messageId: inboundMessageId || null,
				});

				await db
					.update(jobOutreaches)
					.set({
						status: "replied",
						lastRepliedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(jobOutreaches.id, outreachRow.id));

				await sendInboundAlertToAdmin({
					inquiryId: outreachRow.id,
					inquiryType: "job_outreach",
					clientName: senderName || outreachRow.contactName || "Recruiter",
					clientEmail: senderEmail,
					subject: outreachRow.subject,
					message: textContent,
					isNewConversation: false,
				});

				console.log(
					`[Resend Inbound] Recorded reply for Job Outreach ${outreachRow.id} (${outreachRow.companyName}) from ${senderEmail}`
				);

				return NextResponse.json({
					success: true,
					outreachId: outreachRow.id,
					matched: true,
					type: "job_outreach",
				});
			}

			const [contactRow] = await db
				.select()
				.from(contacts)
				.where(eq(contacts.id, targetInquiryId))
				.limit(1);

			if (contactRow) {
				foundEntity = true;
				targetInquiryType = "contact";
				targetSubject = contactRow.subject;
			} else {
				const [serviceRow] = await db
					.select()
					.from(serviceRequests)
					.where(eq(serviceRequests.id, targetInquiryId))
					.limit(1);

				if (serviceRow) {
					foundEntity = true;
					targetInquiryType = "service_request";
					targetSubject = serviceRow.serviceType;
				} else {
					const [hireRow] = await db
						.select()
						.from(hireRequests)
						.where(eq(hireRequests.id, targetInquiryId))
						.limit(1);

					if (hireRow) {
						foundEntity = true;
						targetInquiryType = "hire_request";
						targetSubject = `${hireRow.roleTitle} @ ${hireRow.company}`;
					} else {
						targetInquiryId = null;
					}
				}
			}
		}

		// Self-healing / Cross-environment safety guard:
		// If the inbound email carried an explicit Ref ID (e.g. contact-YYMMDDHHMM-xxx)
		// but was NOT found in this database environment, do NOT create a fake duplicate
		// contact inquiry or misattribute it to a different inquiry by email.
		if (hasExplicitRefId && !foundEntity) {
			console.warn(
				`[Resend Inbound] Explicit Ref ID "${rawExplicitRefId}" was not found in this environment. Skipping fallback creation to prevent cross-env pollution.`
			);
			return NextResponse.json(
				{
					success: true,
					message: `Explicit Ref ID "${rawExplicitRefId}" not found in current environment. Ignored safely.`,
					skipped: true,
				},
				{ status: 200 },
			);
		}

		// 6. Match by threading headers (In-Reply-To / References) if no explicit Ref ID was present
		if (!targetInquiryId && referencedMessageIds.length > 0) {
			// Check if any referenced ID matches a known job outreach
			for (const refId of referencedMessageIds) {
				// Strip domain for Resend ID matching if needed
				const cleanRef = refId.split("@")[0];
				const [matchedOutreachMsg] = await db
					.select({ outreachId: jobOutreachMessages.outreachId })
					.from(jobOutreachMessages)
					.where(
						or(
							eq(sql`lower(${jobOutreachMessages.messageId})`, refId),
							eq(sql`lower(${jobOutreachMessages.messageId})`, cleanRef),
						),
					)
					.limit(1);

				if (matchedOutreachMsg) {
					targetInquiryId = matchedOutreachMsg.outreachId;
					targetInquiryType = "job_outreach" as unknown as typeof targetInquiryType;
					break;
				}

				const [matchedInquiryMsg] = await db
					.select({ inquiryId: inquiryMessages.inquiryId, inquiryType: inquiryMessages.inquiryType })
					.from(inquiryMessages)
					.where(
						or(
							eq(sql`lower(${inquiryMessages.messageId})`, refId),
							eq(sql`lower(${inquiryMessages.messageId})`, cleanRef),
						),
					)
					.limit(1);

				if (matchedInquiryMsg) {
					targetInquiryId = matchedInquiryMsg.inquiryId;
					targetInquiryType = matchedInquiryMsg.inquiryType;
					break;
				}
			}
		}

		// 7. Match by Subject + Sender Email ONLY if the subject is explicitly a reply (starts with Re:) and matches previous entity subject
		if (!targetInquiryId && senderEmail && isReplyOrFwd) {
			const normIncomingSubject = normalizeSubject(subject);

			const [latestOutreachRows, latestContactRows, latestServiceRows, latestHireRows] = await Promise.all([
				db
					.select()
					.from(jobOutreaches)
					.where(sql`lower(${jobOutreaches.contactEmail}) = ${senderEmail.toLowerCase()}`)
					.orderBy(desc(jobOutreaches.createdAt))
					.limit(3),
				db
					.select()
					.from(contacts)
					.where(sql`lower(${contacts.email}) = ${senderEmail.toLowerCase()}`)
					.orderBy(desc(contacts.createdAt))
					.limit(3),
				db
					.select()
					.from(serviceRequests)
					.where(sql`lower(${serviceRequests.email}) = ${senderEmail.toLowerCase()}`)
					.orderBy(desc(serviceRequests.createdAt))
					.limit(3),
				db
					.select()
					.from(hireRequests)
					.where(sql`lower(${hireRequests.email}) = ${senderEmail.toLowerCase()}`)
					.orderBy(desc(hireRequests.createdAt))
					.limit(3),
			]);

			// Match by normalized subject
			const matchingOutreach = latestOutreachRows.find(
				r => normalizeSubject(r.subject) === normIncomingSubject,
			);
			if (matchingOutreach) {
				targetInquiryId = matchingOutreach.id;
				targetInquiryType = "job_outreach" as unknown as typeof targetInquiryType;
				targetSubject = matchingOutreach.subject;
			} else {
				const matchingContact = latestContactRows.find(
					r => normalizeSubject(r.subject) === normIncomingSubject,
				);
				if (matchingContact) {
					targetInquiryId = matchingContact.id;
					targetInquiryType = "contact";
					targetSubject = matchingContact.subject;
				} else {
					const matchingService = latestServiceRows.find(
						r => normalizeSubject(r.serviceType) === normIncomingSubject,
					);
					if (matchingService) {
						targetInquiryId = matchingService.id;
						targetInquiryType = "service_request";
						targetSubject = matchingService.serviceType;
					} else {
						const matchingHire = latestHireRows.find(
							r => normalizeSubject(`${r.roleTitle} @ ${r.company}`) === normIncomingSubject,
						);
						if (matchingHire) {
							targetInquiryId = matchingHire.id;
							targetInquiryType = "hire_request";
							targetSubject = `${matchingHire.roleTitle} @ ${matchingHire.company}`;
						}
					}
				}
			}
		}

		// Handle matched Job Outreach if resolved via threading headers or subject
		if (targetInquiryId && (targetInquiryType as string) === "job_outreach") {
			const [outreachRow] = await db
				.select()
				.from(jobOutreaches)
				.where(eq(jobOutreaches.id, targetInquiryId))
				.limit(1);

			if (outreachRow) {
				const fifteenSecondsAgo = new Date(Date.now() - 15000);
				const [recentDuplicate] = await db
					.select()
					.from(jobOutreachMessages)
					.where(
						and(
							eq(jobOutreachMessages.outreachId, outreachRow.id),
							eq(jobOutreachMessages.senderEmail, senderEmail),
							eq(jobOutreachMessages.message, textContent),
							gte(jobOutreachMessages.createdAt, fifteenSecondsAgo),
						),
					)
					.limit(1);

				if (recentDuplicate) {
					return NextResponse.json({ success: true, duplicate: true });
				}

				await db.insert(jobOutreachMessages).values({
					outreachId: outreachRow.id,
					senderType: "client",
					senderName: senderName || outreachRow.contactName || "Recruiter",
					senderEmail,
					message: textContent,
					messageId: inboundMessageId || null,
				});

				await db
					.update(jobOutreaches)
					.set({
						status: "replied",
						lastRepliedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(jobOutreaches.id, outreachRow.id));

				await sendInboundAlertToAdmin({
					inquiryId: outreachRow.id,
					inquiryType: "job_outreach",
					clientName: senderName || outreachRow.contactName || "Recruiter",
					clientEmail: senderEmail,
					subject: outreachRow.subject,
					message: textContent,
					isNewConversation: false,
				});

				return NextResponse.json({
					success: true,
					outreachId: outreachRow.id,
					matched: true,
					type: "job_outreach",
				});
			}
		}

		// 8. If still not matched, this is a BRAND NEW DIRECT EMAIL -> Create a new contact inquiry so it is visible in CMS Contacts!
		let isNewInquiry = false;
		if (!targetInquiryId) {
			isNewInquiry = true;
			const cleanSubject = subject.replace(/^(?:re|fwd|fw):\s*/gi, "").trim() || "Inbound Email";
			const [newContact] = await db
				.insert(contacts)
				.values({
					name: senderName || "Client",
					email: senderEmail,
					subject: cleanSubject,
					message: textContent,
					status: "new",
					messageId: inboundMessageId || null,
				})
				.returning({ id: contacts.id });

			targetInquiryId = newContact.id;
			targetInquiryType = "contact";
			targetSubject = cleanSubject;

			console.log(
				`[Resend Inbound] Direct email received. Created new contact ${targetInquiryId} (${cleanSubject}) for ${senderEmail}`
			);
		}

		// Deduplication check for inquiryMessages
		const fifteenSecondsAgo = new Date(Date.now() - 15000);
		const [recentDuplicateInquiry] = await db
			.select()
			.from(inquiryMessages)
			.where(
				and(
					eq(inquiryMessages.inquiryId, targetInquiryId),
					eq(inquiryMessages.senderEmail, senderEmail),
					eq(inquiryMessages.message, textContent),
					gte(inquiryMessages.createdAt, fifteenSecondsAgo),
				),
			)
			.limit(1);

		if (recentDuplicateInquiry) {
			console.log(
				`[Resend Inbound] Ignored duplicate inquiry reply within 15s for ${targetInquiryId}`
			);
			return NextResponse.json({ success: true, duplicate: true });
		}

		// 8. Insert inbound message into inquiryMessages thread
		await db.insert(inquiryMessages).values({
			inquiryId: targetInquiryId,
			inquiryType: targetInquiryType,
			senderType: "client",
			senderName: senderName || "Client",
			senderEmail,
			message: textContent,
			messageId: inboundMessageId || null,
		});

		// 9. Update inquiry status to "new" to highlight it in CMS
		if (targetInquiryType === "contact") {
			await db
				.update(contacts)
				.set({ status: "new" })
				.where(eq(contacts.id, targetInquiryId));
		} else if (targetInquiryType === "service_request") {
			await db
				.update(serviceRequests)
				.set({ status: "new" })
				.where(eq(serviceRequests.id, targetInquiryId));
		} else if (targetInquiryType === "hire_request") {
			await db
				.update(hireRequests)
				.set({ status: "new", updatedAt: new Date() })
				.where(eq(hireRequests.id, targetInquiryId));
		}

		const rawTo = data.to || fullEmail?.to || data.recipient || body.to;
		const recipientTo = Array.isArray(rawTo)
			? rawTo
					.map((item) =>
						typeof item === "string"
							? item
							: (item as { email?: string; address?: string })?.email ||
								(item as { address?: string })?.address ||
								"",
					)
					.filter(Boolean)
					.join(", ")
			: typeof rawTo === "string"
				? rawTo
				: "hi@wismannur.pro";

		// 10. Send email alert to Admin
		await sendInboundAlertToAdmin({
			inquiryId: targetInquiryId,
			inquiryType: targetInquiryType,
			clientName: senderName || "Client",
			clientEmail: senderEmail,
			subject: targetSubject,
			message: textContent,
			toAddress: recipientTo || "hi@wismannur.pro",
			isNewConversation: isNewInquiry,
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
