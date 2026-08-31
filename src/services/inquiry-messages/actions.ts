"use server";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { ServiceError } from "../core/base-service";
import { RESEND_EMAIL_DOMAIN, sendAdminReplyToClient } from "../core/resend";
import type { InquiryMessage, SendAdminReplyInput } from "./types";

const { inquiryMessages, contacts, serviceRequests, hireRequests } = schema;

const sendReplySchema = z.object({
	inquiryId: z.string().min(1),
	inquiryType: z.enum(["contact", "service_request", "hire_request"]),
	toEmail: z.string().trim().email(),
	toName: z.string().trim().min(1),
	subject: z.string().trim().min(1),
	message: z.string().trim().min(1).max(10000),
	originalMessageSnippet: z.string().optional(),
});

export async function getThreadMessages(inquiryId: string): Promise<InquiryMessage[]> {
	await assertAdmin();
	const db = getDb();
	const rows = await db
		.select()
		.from(inquiryMessages)
		.where(eq(inquiryMessages.inquiryId, inquiryId))
		.orderBy(asc(inquiryMessages.createdAt));

	return rows.map((row) => ({
		id: row.id,
		inquiryId: row.inquiryId,
		inquiryType: row.inquiryType as InquiryMessage["inquiryType"],
		senderType: row.senderType,
		senderName: row.senderName,
		senderEmail: row.senderEmail,
		message: row.message,
		messageId: row.messageId ?? undefined,
		createdAt: row.createdAt,
	}));
}

export async function sendAdminReply(data: SendAdminReplyInput): Promise<InquiryMessage> {
	await assertAdmin();
	const parsed = sendReplySchema.safeParse(data);
	if (!parsed.success) {
		throw new ServiceError("Validation failed", "invalid-input", parsed.error);
	}
	const clean = parsed.data;

	const db = getDb();

	// 1. Fetch previous thread messages and initial entity messageId to construct threading references
	const previousMessages = await db
		.select()
		.from(inquiryMessages)
		.where(eq(inquiryMessages.inquiryId, clean.inquiryId))
		.orderBy(asc(inquiryMessages.createdAt));

	const referencesIds: string[] = [];
	let initialEntityMessage: string | undefined = undefined;

	// Check initial messageId and message content from parent table
	if (clean.inquiryType === "contact") {
		const [parent] = await db
			.select({ messageId: contacts.messageId, message: contacts.message })
			.from(contacts)
			.where(eq(contacts.id, clean.inquiryId))
			.limit(1);
		if (parent?.messageId) referencesIds.push(parent.messageId);
		if (parent?.message) initialEntityMessage = parent.message;
	} else if (clean.inquiryType === "service_request") {
		const [parent] = await db
			.select({ messageId: serviceRequests.messageId, projectDetails: serviceRequests.projectDetails })
			.from(serviceRequests)
			.where(eq(serviceRequests.id, clean.inquiryId))
			.limit(1);
		if (parent?.messageId) referencesIds.push(parent.messageId);
		if (parent?.projectDetails) initialEntityMessage = parent.projectDetails;
	} else if (clean.inquiryType === "hire_request") {
		const [parent] = await db
			.select({ messageId: hireRequests.messageId, message: hireRequests.message })
			.from(hireRequests)
			.where(eq(hireRequests.id, clean.inquiryId))
			.limit(1);
		if (parent?.messageId) referencesIds.push(parent.messageId);
		if (parent?.message) initialEntityMessage = parent.message;
	}

	for (const msg of previousMessages) {
		if (msg.messageId) {
			referencesIds.push(msg.messageId);
		}
	}

	const inReplyToId =
		referencesIds.length > 0 ? referencesIds[referencesIds.length - 1] : null;

	// Find the most recent message from the client to quote dynamically in the email
	const latestClientMessage = [...previousMessages]
		.reverse()
		.find((msg) => msg.senderType === "client");

	const originalSnippetToQuote =
		latestClientMessage?.message ||
		clean.originalMessageSnippet ||
		initialEntityMessage ||
		undefined;

	// 2. Send email to client via Resend with RFC 5322 In-Reply-To and References
	const sendRes = await sendAdminReplyToClient({
		inquiryId: clean.inquiryId,
		toEmail: clean.toEmail,
		toName: clean.toName,
		subject: clean.subject,
		message: clean.message,
		originalMessageSnippet: originalSnippetToQuote,
		inReplyToId,
		referencesIds,
	});

	// 3. Insert admin reply to database with messageId
	const [inserted] = await db
		.insert(inquiryMessages)
		.values({
			inquiryId: clean.inquiryId,
			inquiryType: clean.inquiryType,
			senderType: "admin",
			senderName: "Wisman Nur",
			senderEmail: `hi@${RESEND_EMAIL_DOMAIN}`,
			message: clean.message,
			messageId: sendRes.id || null,
		})
		.returning();

	// 4. Update status of the inquiry
	if (clean.inquiryType === "contact") {
		await db
			.update(contacts)
			.set({ status: "replied" })
			.where(eq(contacts.id, clean.inquiryId));
	} else if (clean.inquiryType === "service_request") {
		await db
			.update(serviceRequests)
			.set({ status: "in-progress" })
			.where(eq(serviceRequests.id, clean.inquiryId));
	} else if (clean.inquiryType === "hire_request") {
		await db
			.update(hireRequests)
			.set({ status: "reviewed", updatedAt: new Date() })
			.where(eq(hireRequests.id, clean.inquiryId));
	}

	return {
		id: inserted.id,
		inquiryId: inserted.inquiryId,
		inquiryType: inserted.inquiryType,
		senderType: inserted.senderType,
		senderName: inserted.senderName,
		senderEmail: inserted.senderEmail,
		message: inserted.message,
		messageId: inserted.messageId ?? undefined,
		createdAt: inserted.createdAt,
	};
}
