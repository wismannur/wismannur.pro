"use server";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { countRows } from "@/db/sort";
import { ServiceError } from "../core/base-service";
import { assertSubmissionAllowed } from "../core/rate-limit";
import { assertHuman } from "../core/recaptcha";
import { sendHireRequestEmails } from "../core/resend";
import type { HireRequest, HireRequestStatus, NewHireRequest } from "./types";

const { hireRequests } = schema;

const PAGE_SIZE = 10;

const newHireRequestSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(200),
	email: z.string().trim().email("Invalid email address").max(320),
	company: z.string().trim().min(1, "Company is required").max(200),
	roleTitle: z.string().trim().min(1, "Position / Role is required").max(200),
	employmentType: z.string().trim().min(1).max(100),
	workplaceType: z.string().trim().min(1).max(100),
	location: z.string().trim().max(200).optional(),
	salaryRange: z.string().trim().max(100).optional(),
	message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
});

const toHireRequest = (row: typeof hireRequests.$inferSelect): HireRequest => ({
	...row,
	status: row.status as HireRequestStatus,
	location: row.location ?? undefined,
	salaryRange: row.salaryRange ?? undefined,
});

export async function getHireRequests(page = 1, _startAfterDoc: unknown = null, status?: string) {
	await assertAdmin();
	const db = getDb();
	const where =
		status && status !== "all"
			? eq(hireRequests.status, status as HireRequestStatus)
			: undefined;

	const [rows, [{ count }]] = await Promise.all([
		db
			.select()
			.from(hireRequests)
			.where(where)
			.orderBy(desc(hireRequests.createdAt))
			.limit(PAGE_SIZE)
			.offset((page - 1) * PAGE_SIZE),
		db.select({ count: countRows }).from(hireRequests).where(where),
	]);

	return {
		requests: rows.map(toHireRequest),
		lastVisible: null,
		hasMore: page * PAGE_SIZE < count,
		total: count,
	};
}

export async function getById(id: string): Promise<HireRequest | null> {
	await assertAdmin();
	const [row] = await getDb()
		.select()
		.from(hireRequests)
		.where(eq(hireRequests.id, id))
		.limit(1);

	return row ? toHireRequest(row) : null;
}

export async function submit(data: NewHireRequest, recaptchaToken?: string): Promise<string> {
	const parsed = newHireRequestSchema.safeParse(data);
	if (!parsed.success) {
		throw new ServiceError("Validation failed", "invalid-input", parsed.error);
	}

	const clean = parsed.data as NewHireRequest;
	await assertHuman(recaptchaToken);
	await assertSubmissionAllowed(
		hireRequests,
		{ email: hireRequests.email, createdAt: hireRequests.createdAt },
		clean.email,
	);

	const [{ id }] = await getDb()
		.insert(hireRequests)
		.values({
			name: clean.name,
			email: clean.email,
			company: clean.company,
			roleTitle: clean.roleTitle,
			employmentType: clean.employmentType,
			workplaceType: clean.workplaceType,
			location: clean.location || null,
			salaryRange: clean.salaryRange || null,
			message: clean.message,
			status: "new",
		})
		.returning({ id: hireRequests.id });

	const { clientEmailId } = await sendHireRequestEmails({ ...clean, id });
	if (clientEmailId) {
		await getDb()
			.update(hireRequests)
			.set({ messageId: clientEmailId })
			.where(eq(hireRequests.id, id));
	}

	return id;
}

export async function updateStatus(id: string, status: HireRequestStatus): Promise<void> {
	await assertAdmin();
	await getDb()
		.update(hireRequests)
		.set({ status, updatedAt: new Date() })
		.where(eq(hireRequests.id, id));
}

export async function deleteHireRequest(id: string): Promise<void> {
	await assertAdmin();
	const db = getDb();
	await db.delete(schema.inquiryMessages).where(eq(schema.inquiryMessages.inquiryId, id));
	await db.delete(hireRequests).where(eq(hireRequests.id, id));
}
