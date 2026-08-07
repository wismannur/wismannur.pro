"use server";

import { revalidatePath } from "next/cache";

import { asc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { TestimonialRow } from "@/db/schema";
import { assertAdmin } from "../core/auth-guard";
import type { NewTestimonial, Testimonial, UpdateTestimonial } from "./types";

// Server actions backing `testimonialsService` — client quotes on /hire-me.

const { testimonials } = schema;

function revalidateTestimonialPaths() {
	revalidatePath("/hire-me");
}

const toTestimonial = (row: TestimonialRow): Testimonial => ({
	...row,
	avatarUrl: row.avatarUrl ?? undefined,
});

const displayOrder = [asc(testimonials.sortOrder), asc(testimonials.authorName)];

export async function getPublished(): Promise<Testimonial[]> {
	const rows = await getDb()
		.select()
		.from(testimonials)
		.where(eq(testimonials.isPublished, true))
		.orderBy(...displayOrder);
	return rows.map(toTestimonial);
}

export async function getById(id: string): Promise<Testimonial | null> {
	await assertAdmin();
	const [row] = await getDb()
		.select()
		.from(testimonials)
		.where(eq(testimonials.id, id))
		.limit(1);
	return row ? toTestimonial(row) : null;
}

export async function create(testimonial: NewTestimonial): Promise<string> {
	await assertAdmin();
	const [{ id }] = await getDb()
		.insert(testimonials)
		.values({ ...testimonial, avatarUrl: testimonial.avatarUrl ?? null })
		.returning({ id: testimonials.id });
	revalidateTestimonialPaths();
	return id;
}

export async function update(id: string, testimonial: UpdateTestimonial): Promise<void> {
	await assertAdmin();
	await getDb()
		.update(testimonials)
		.set({ ...testimonial, updatedAt: new Date() })
		.where(eq(testimonials.id, id));
	revalidateTestimonialPaths();
}

export async function deleteTestimonial(id: string): Promise<void> {
	await assertAdmin();
	await getDb().delete(testimonials).where(eq(testimonials.id, id));
	revalidateTestimonialPaths();
}

export async function getAllForCms(): Promise<Testimonial[]> {
	await assertAdmin();
	const rows = await getDb()
		.select()
		.from(testimonials)
		.orderBy(...displayOrder);
	return rows.map(toTestimonial);
}
