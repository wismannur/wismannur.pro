"use server";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { countRows } from "@/db/sort";
import { ServiceError } from "../core/base-service";
import { assertSubmissionAllowed } from "../core/rate-limit";
import { assertHuman } from "../core/recaptcha";
import { sendServiceRequestEmails } from "../core/resend";
import type { NewServiceRequest, ServiceRequest } from "./types";

// Server actions backing `serviceRequestService`. `submit` is the public
// hire-me form — input is re-validated on the server, reCAPTCHA-verified
// (once RECAPTCHA_SECRET_KEY is set) and rate-limited (phase 8.6).
// getRequests/getById/updateStatus are gated by assertAdmin().

const { serviceRequests } = schema;

const PAGE_SIZE = 10;

const newRequestSchema = z.object({
	name: z.string().trim().min(1).max(200),
	email: z.string().trim().email().max(320),
	company: z.string().trim().max(200).optional(),
	serviceType: z.string().trim().min(1).max(100),
	budget: z.string().trim().min(1).max(100),
	timeframe: z.string().trim().min(1).max(100),
	projectDetails: z.string().trim().min(1).max(5000),
});

const toRequest = (row: typeof serviceRequests.$inferSelect): ServiceRequest => ({
	...row,
	company: row.company ?? undefined,
});

export async function getRequests(page = 1, _startAfterDoc: unknown = null, status?: string) {
	await assertAdmin();
	const db = getDb();
	const where =
		status && status !== "all"
			? eq(serviceRequests.status, status as ServiceRequest["status"])
			: undefined;
	const [rows, [{ count }]] = await Promise.all([
		db
			.select()
			.from(serviceRequests)
			.where(where)
			.orderBy(desc(serviceRequests.createdAt))
			.limit(PAGE_SIZE)
			.offset((page - 1) * PAGE_SIZE),
		db.select({ count: countRows }).from(serviceRequests).where(where),
	]);
	return { requests: rows.map(toRequest), lastVisible: null, hasMore: page * PAGE_SIZE < count };
}

export async function getById(id: string): Promise<ServiceRequest | null> {
	await assertAdmin();
	const [row] = await getDb()
		.select()
		.from(serviceRequests)
		.where(eq(serviceRequests.id, id))
		.limit(1);
	return row ? toRequest(row) : null;
}

export async function submit(data: NewServiceRequest, recaptchaToken?: string): Promise<string> {
	const parsed = newRequestSchema.safeParse(data);
	if (!parsed.success) {
		throw new ServiceError("Validation failed", "invalid-input", parsed.error);
	}
	// Cast: with `strictNullChecks` off (legacy tsconfig), Zod's inferred object
	// type degrades to all-optional; the schema itself guarantees this shape.
	const clean = parsed.data as NewServiceRequest;
	await assertHuman(recaptchaToken);
	await assertSubmissionAllowed(
		serviceRequests,
		{ email: serviceRequests.email, createdAt: serviceRequests.createdAt },
		clean.email,
	);
	const [{ id }] = await getDb()
		.insert(serviceRequests)
		.values({ ...clean, status: "new" })
		.returning({ id: serviceRequests.id });

	const { clientEmailId } = await sendServiceRequestEmails({ ...clean, id });
	if (clientEmailId) {
		await getDb()
			.update(serviceRequests)
			.set({ messageId: clientEmailId })
			.where(eq(serviceRequests.id, id));
	}

	return id;
}

export async function updateStatus(id: string, status: ServiceRequest["status"]): Promise<void> {
	await assertAdmin();
	await getDb().update(serviceRequests).set({ status }).where(eq(serviceRequests.id, id));
}

export async function deleteServiceRequest(id: string): Promise<void> {
	await assertAdmin();
	const db = getDb();
	await db.delete(schema.inquiryMessages).where(eq(schema.inquiryMessages.inquiryId, id));
	await db.delete(serviceRequests).where(eq(serviceRequests.id, id));
}
