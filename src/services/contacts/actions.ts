"use server";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { countRows } from "@/db/sort";
import { ServiceError } from "../core/base-service";
import { assertSubmissionAllowed } from "../core/rate-limit";
import { assertHuman } from "../core/recaptcha";
import { sendContactEmails } from "../core/resend";
import type { Contact, ContactForm } from "./types";

// Server actions backing `contactService`. `submit` is the public contact
// form — input is re-validated on the server (the client-side Zod schema is
// advisory only once requests can be crafted directly), reCAPTCHA-verified
// (once RECAPTCHA_SECRET_KEY is set) and rate-limited (phase 8.6).
// getContacts/getById/updateStatus are gated by assertAdmin().

const { contacts } = schema;

const PAGE_SIZE = 10;

const contactFormSchema = z.object({
	name: z.string().trim().min(1).max(200),
	email: z.string().trim().email().max(320),
	subject: z.string().trim().min(1).max(300),
	message: z.string().trim().min(1).max(5000),
});

export async function getContacts(page = 1, _startAfterDoc: unknown = null, status?: string) {
	await assertAdmin();
	const db = getDb();
	const where =
		status && status !== "all" ? eq(contacts.status, status as Contact["status"]) : undefined;
	const [rows, [{ count }]] = await Promise.all([
		db
			.select()
			.from(contacts)
			.where(where)
			.orderBy(desc(contacts.createdAt))
			.limit(PAGE_SIZE)
			.offset((page - 1) * PAGE_SIZE),
		db.select({ count: countRows }).from(contacts).where(where),
	]);
	return { contacts: rows, lastVisible: null, hasMore: page * PAGE_SIZE < count };
}

export async function getById(id: string): Promise<Contact | null> {
	await assertAdmin();
	const [row] = await getDb().select().from(contacts).where(eq(contacts.id, id)).limit(1);
	return row ?? null;
}

export async function updateStatus(id: string, status: Contact["status"]): Promise<void> {
	await assertAdmin();
	await getDb().update(contacts).set({ status }).where(eq(contacts.id, id));
}

export async function submit(formData: ContactForm, recaptchaToken?: string): Promise<string> {
	const parsed = contactFormSchema.safeParse(formData);
	if (!parsed.success) {
		throw new ServiceError("Validation failed", "invalid-input", parsed.error);
	}
	// Cast: with `strictNullChecks` off (legacy tsconfig), Zod's inferred object
	// type degrades to all-optional; the schema itself guarantees this shape.
	const clean = parsed.data as ContactForm;
	await assertHuman(recaptchaToken);
	await assertSubmissionAllowed(
		contacts,
		{ email: contacts.email, createdAt: contacts.createdAt },
		clean.email,
	);
	const [{ id }] = await getDb()
		.insert(contacts)
		.values({ ...clean, status: "new" })
		.returning({ id: contacts.id });
	const { clientEmailId } = await sendContactEmails({ ...clean, id });
	if (clientEmailId) {
		await getDb()
			.update(contacts)
			.set({ messageId: clientEmailId })
			.where(eq(contacts.id, id));
	}

	return id;
}

export async function deleteContact(id: string): Promise<void> {
	await assertAdmin();
	const db = getDb();
	await db.delete(schema.inquiryMessages).where(eq(schema.inquiryMessages.inquiryId, id));
	await db.delete(contacts).where(eq(contacts.id, id));
}
