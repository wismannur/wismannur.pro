import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
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

		const outreachMatch = str.match(/(?:^|\+)(?:outreach|job)[-_]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
		if (outreachMatch && outreachMatch[1]) {
			return { id: outreachMatch[1], type: "job_outreach" };
		}
		const contactMatch = str.match(/(?:^|\+)contact[-_]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
		if (contactMatch && contactMatch[1]) {
			return { id: contactMatch[1], type: "contact" };
		}
		const serviceMatch = str.match(/(?:^|\+)service[-_]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
		if (serviceMatch && serviceMatch[1]) {
			return { id: serviceMatch[1], type: "service_request" };
		}
		const hireMatch = str.match(/(?:^|\+)hire[-_]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
		if (hireMatch && hireMatch[1]) {
			return { id: hireMatch[1], type: "hire_request" };
		}
		const anyUuidMatch = str.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
		if (anyUuidMatch && anyUuidMatch[1]) {
			return { id: anyUuidMatch[1] };
		}
	}
	return { id: null };
}

function extractInquiryId(subject: string, rawBody?: string): string | null {
	// 1. Look for explicit pattern [Ref: #ID] or (Ref: ID) or Ref: ID in subject
	if (subject) {
		const refMatch = subject.match(/(?:\[|\()?\bRef:\s*#?([a-zA-Z0-9_-]+)(?:\]|\))?/i);
		if (refMatch && refMatch[1]) {
			return refMatch[1].trim();
		}
		// Fallback: match standard UUID pattern anywhere in subject
		const uuidMatch = subject.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
		if (uuidMatch && uuidMatch[1]) {
			return uuidMatch[1].trim();
		}
	}

	// 2. Check quoted reply headers in email body
	if (rawBody) {
		const refMatchBody = rawBody.match(/(?:\[|\()?\bRef:\s*#?([a-zA-Z0-9_-]+)(?:\]|\))?/i);
		if (refMatchBody && refMatchBody[1]) {
			return refMatchBody[1].trim();
		}
		const uuidMatchBody = rawBody.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
		if (uuidMatchBody && uuidMatchBody[1]) {
			return uuidMatchBody[1].trim();
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

		let targetInquiryId: string | null =
			toInfo.id ||
			headerRefId ||
			extractInquiryId(subject, rawText || rawHtml);
		let targetInquiryType: "contact" | "service_request" | "hire_request" =
			(toInfo.type && toInfo.type !== "job_outreach" ? toInfo.type : undefined) || "contact";
		let targetSubject = subject;


		// 5. Match by explicit reference ID if found
		if (targetInquiryId) {
			// Check job outreaches first
			const [outreachRow] = await db
				.select()
				.from(jobOutreaches)
				.where(eq(jobOutreaches.id, targetInquiryId))
				.limit(1);


			if (outreachRow) {
				await db.insert(jobOutreachMessages).values({
					outreachId: outreachRow.id,
					senderType: "client",
					senderName: senderName || outreachRow.contactName || "Recruiter",
					senderEmail,
					message: textContent,
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
					const [hireRow] = await db
						.select()
						.from(hireRequests)
						.where(eq(hireRequests.id, targetInquiryId))
						.limit(1);

					if (hireRow) {
						targetInquiryType = "hire_request";
						targetSubject = `${hireRow.roleTitle} @ ${hireRow.company}`;
					} else {
						targetInquiryId = null;
					}
				}
			}
		}

		// 6. Fallback: match by sender email with most recent entity (outreach or inquiry)
		if (!targetInquiryId && senderEmail) {
			const [latestOutreachRows, latestContactRows, latestServiceRows, latestHireRows] = await Promise.all([
				db
					.select()
					.from(jobOutreaches)
					.where(sql`lower(${jobOutreaches.contactEmail}) = ${senderEmail.toLowerCase()}`)
					.orderBy(desc(jobOutreaches.createdAt))
					.limit(1),
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
				db
					.select()
					.from(hireRequests)
					.where(sql`lower(${hireRequests.email}) = ${senderEmail.toLowerCase()}`)
					.orderBy(desc(hireRequests.createdAt))
					.limit(1),
			]);

			const allMatches = [
				latestOutreachRows[0]
					? {
							id: latestOutreachRows[0].id,
							type: "job_outreach" as const,
							subject: latestOutreachRows[0].subject,
							contactName: latestOutreachRows[0].contactName,
							createdAt: new Date(latestOutreachRows[0].sentAt || latestOutreachRows[0].createdAt).getTime(),
						}
					: null,
				latestContactRows[0]
					? {
							id: latestContactRows[0].id,
							type: "contact" as const,
							subject: latestContactRows[0].subject,
							contactName: latestContactRows[0].name,
							createdAt: new Date(latestContactRows[0].createdAt).getTime(),
						}
					: null,
				latestServiceRows[0]
					? {
							id: latestServiceRows[0].id,
							type: "service_request" as const,
							subject: latestServiceRows[0].serviceType,
							contactName: latestServiceRows[0].name,
							createdAt: new Date(latestServiceRows[0].createdAt).getTime(),
						}
					: null,
				latestHireRows[0]
					? {
							id: latestHireRows[0].id,
							type: "hire_request" as const,
							subject: `${latestHireRows[0].roleTitle} @ ${latestHireRows[0].company}`,
							contactName: latestHireRows[0].name,
							createdAt: new Date(latestHireRows[0].createdAt).getTime(),
						}
					: null,
			].filter(Boolean) as Array<{
				id: string;
				type: "job_outreach" | "contact" | "service_request" | "hire_request";
				subject: string;
				contactName: string;
				createdAt: number;
			}>;

			if (allMatches.length > 0) {
				allMatches.sort((a, b) => b.createdAt - a.createdAt);
				const bestMatch = allMatches[0];

				if (bestMatch.type === "job_outreach") {
					await db.insert(jobOutreachMessages).values({
						outreachId: bestMatch.id,
						senderType: "client",
						senderName: senderName || bestMatch.contactName || "Recruiter",
						senderEmail,
						message: textContent,
					});

					await db
						.update(jobOutreaches)
						.set({
							status: "replied",
							lastRepliedAt: new Date(),
							updatedAt: new Date(),
						})
						.where(eq(jobOutreaches.id, bestMatch.id));

					await sendInboundAlertToAdmin({
						inquiryId: bestMatch.id,
						inquiryType: "job_outreach",
						clientName: senderName || bestMatch.contactName || "Recruiter",
						clientEmail: senderEmail,
						subject: bestMatch.subject,
						message: textContent,
					});

					console.log(
						`[Resend Inbound] Fallback matched email to Job Outreach ${bestMatch.id} from ${senderEmail}`
					);

					return NextResponse.json({
						success: true,
						outreachId: bestMatch.id,
						matched: true,
						type: "job_outreach",
					});
				}

				targetInquiryId = bestMatch.id;
				targetInquiryType = bestMatch.type;
				targetSubject = bestMatch.subject;
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
