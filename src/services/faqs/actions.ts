"use server";

import { revalidatePath } from "next/cache";

import { asc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type { Faq, NewFaq, UpdateFaq } from "./types";

// Server actions backing `faqsService` — the FAQ sets on /services and
// /hire-me.

const { faqs } = schema;

function revalidateFaqPaths() {
	revalidatePath("/services");
	revalidatePath("/hire-me");
}

const displayOrder = [asc(faqs.sortOrder), asc(faqs.question)];

export async function getPublished(): Promise<Faq[]> {
	return getDb()
		.select()
		.from(faqs)
		.where(eq(faqs.isPublished, true))
		.orderBy(...displayOrder);
}

export async function getById(id: string): Promise<Faq | null> {
	await assertAdmin();
	const [row] = await getDb().select().from(faqs).where(eq(faqs.id, id)).limit(1);
	return row ?? null;
}

export async function create(faq: NewFaq): Promise<string> {
	await assertAdmin();
	const [{ id }] = await getDb().insert(faqs).values(faq).returning({ id: faqs.id });
	revalidateFaqPaths();
	return id;
}

export async function update(id: string, faq: UpdateFaq): Promise<void> {
	await assertAdmin();
	await getDb()
		.update(faqs)
		.set({ ...faq, updatedAt: new Date() })
		.where(eq(faqs.id, id));
	revalidateFaqPaths();
}

export async function deleteFaq(id: string): Promise<void> {
	await assertAdmin();
	await getDb().delete(faqs).where(eq(faqs.id, id));
	revalidateFaqPaths();
}

export async function getAllForCms(): Promise<Faq[]> {
	await assertAdmin();
	return getDb()
		.select()
		.from(faqs)
		.orderBy(...displayOrder);
}
