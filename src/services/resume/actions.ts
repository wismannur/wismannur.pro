"use server";

import { revalidatePath } from "next/cache";

import { asc, desc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type { ResumeEntryRow } from "@/db/schema";
import type {
	NewResumeEntry,
	ResumeEntry,
	ResumeSections,
	UpdateResumeEntry,
} from "./types";

// Server actions backing `resumeService` — the work experience and education
// timelines on /about. Admin-only actions (create/update/delete/getAllForCms)
// are gated by assertAdmin(); server actions are public POST endpoints otherwise.

const { resumeEntries } = schema;

// /about renders on the server, so every mutation has to invalidate it or the
// edit only shows up after a redeploy.
function revalidateResumePaths() {
	revalidatePath("/about");
}

// Optional⇄nullable mapping: the contract has `location?: string`, the column
// is `string | null`.
const toResumeEntry = (row: ResumeEntryRow): ResumeEntry => ({
	...row,
	location: row.location ?? undefined,
	endDate: row.endDate ?? undefined,
});

// Newest first, with `sortOrder` as the manual override — everything at the
// default 0 means pure reverse-chronological order.
const displayOrder = [desc(resumeEntries.sortOrder), desc(resumeEntries.startDate)];

export async function getPublished(): Promise<ResumeSections> {
	const rows = await getDb()
		.select()
		.from(resumeEntries)
		.where(eq(resumeEntries.isPublished, true))
		.orderBy(...displayOrder);

	const entries = rows.map(toResumeEntry);
	return {
		experiences: entries.filter((entry) => entry.kind === "experience"),
		education: entries.filter((entry) => entry.kind === "education"),
	};
}

export async function getById(id: string): Promise<ResumeEntry | null> {
	await assertAdmin();
	const [row] = await getDb()
		.select()
		.from(resumeEntries)
		.where(eq(resumeEntries.id, id))
		.limit(1);
	return row ? toResumeEntry(row) : null;
}

export async function create(entry: NewResumeEntry): Promise<string> {
	await assertAdmin();
	const [{ id }] = await getDb()
		.insert(resumeEntries)
		.values({
			...entry,
			endDate: entry.isCurrent ? null : (entry.endDate ?? null),
		})
		.returning({ id: resumeEntries.id });
	revalidateResumePaths();
	return id;
}

export async function update(id: string, entry: UpdateResumeEntry): Promise<void> {
	await assertAdmin();
	await getDb()
		.update(resumeEntries)
		.set({
			...entry,
			updatedAt: new Date(),
			// An ongoing role has no end date, whatever the form last held.
			...(entry.isCurrent ? { endDate: null } : {}),
		})
		.where(eq(resumeEntries.id, id));
	revalidateResumePaths();
}

export async function deleteResumeEntry(id: string): Promise<void> {
	await assertAdmin();
	await getDb().delete(resumeEntries).where(eq(resumeEntries.id, id));
	revalidateResumePaths();
}

// CMS helper — drafts included, grouped by kind then display order.
export async function getAllForCms(): Promise<ResumeEntry[]> {
	await assertAdmin();
	const rows = await getDb()
		.select()
		.from(resumeEntries)
		.orderBy(asc(resumeEntries.kind), ...displayOrder);
	return rows.map(toResumeEntry);
}
