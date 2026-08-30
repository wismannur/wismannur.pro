"use server";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { ServiceError } from "../core/base-service";
import { sendAdminReplyToClient } from "../core/resend";
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

	// 1. Insert admin reply to database
	const [inserted] = await db
		.insert(inquiryMessages)
		.values({
			inquiryId: clean.inquiryId,
			inquiryType: clean.inquiryType,
			senderType: "admin",
			senderName: "Wisman Nur",
			senderEmail: "hi@wismannur.pro",
			message: clean.message,
		})
		.returning();

	// 2. Update status of the inquiry
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

	// 3. Send email to client via Resend
	await sendAdminReplyToClient({
		inquiryId: clean.inquiryId,
		toEmail: clean.toEmail,
		toName: clean.toName,
		subject: clean.subject,
		message: clean.message,
		originalMessageSnippet: clean.originalMessageSnippet,
	});

	return {
		id: inserted.id,
		inquiryId: inserted.inquiryId,
		inquiryType: inserted.inquiryType,
		senderType: inserted.senderType,
		senderName: inserted.senderName,
		senderEmail: inserted.senderEmail,
		message: inserted.message,
		createdAt: inserted.createdAt,
	};
}
