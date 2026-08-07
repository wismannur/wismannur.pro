import "server-only";

import { and, eq, gte } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";

import { getDb } from "@/db";
import { countRows } from "@/db/sort";
import { ServiceError } from "./base-service";

// Sliding-window rate limit for the public submit actions (phase 8.6), counted
// against the submission tables themselves — no extra infra, and the window
// survives serverless cold starts / parallel lambdas. Per-email cap slows a
// polite abuser; the global cap catches email-rotating floods.

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_GLOBAL = 20;

export async function assertSubmissionAllowed(
	table: PgTable,
	columns: { email: AnyPgColumn; createdAt: AnyPgColumn },
	email: string,
): Promise<void> {
	const windowStart = new Date(Date.now() - WINDOW_MS);
	const db = getDb();
	const [[byEmail], [total]] = await Promise.all([
		db
			.select({ count: countRows })
			.from(table)
			.where(and(eq(columns.email, email), gte(columns.createdAt, windowStart))),
		db.select({ count: countRows }).from(table).where(gte(columns.createdAt, windowStart)),
	]);
	if (byEmail.count >= MAX_PER_EMAIL || total.count >= MAX_GLOBAL) {
		throw new ServiceError("Too many submissions. Please try again later.", "rate-limited");
	}
}
