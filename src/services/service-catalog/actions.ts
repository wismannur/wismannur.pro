"use server";

import { revalidatePath } from "next/cache";

import { asc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { ServiceRow } from "@/db/schema";
import { assertAdmin } from "../core/auth-guard";
import type { NewServiceItem, ServiceItem, UpdateServiceItem } from "./types";

// Server actions backing `serviceCatalogService` — the unified service list
// rendered on /, /services, and /hire-me (expertise tab). Named "catalog" to
// stay clear of `serviceRequestService` (the inbox for incoming requests).

const { services } = schema;

function revalidateCatalogPaths() {
	revalidatePath("/");
	revalidatePath("/services");
	revalidatePath("/hire-me");
}

const toServiceItem = (row: ServiceRow): ServiceItem => ({
	...row,
	longDescription: row.longDescription ?? undefined,
});

const displayOrder = [asc(services.sortOrder), asc(services.title)];

export async function getPublished(): Promise<ServiceItem[]> {
	const rows = await getDb()
		.select()
		.from(services)
		.where(eq(services.isPublished, true))
		.orderBy(...displayOrder);
	return rows.map(toServiceItem);
}

export async function getById(id: string): Promise<ServiceItem | null> {
	await assertAdmin();
	const [row] = await getDb().select().from(services).where(eq(services.id, id)).limit(1);
	return row ? toServiceItem(row) : null;
}

export async function create(item: NewServiceItem): Promise<string> {
	await assertAdmin();
	const [{ id }] = await getDb()
		.insert(services)
		.values({ ...item, longDescription: item.longDescription ?? null })
		.returning({ id: services.id });
	revalidateCatalogPaths();
	return id;
}

export async function update(id: string, item: UpdateServiceItem): Promise<void> {
	await assertAdmin();
	await getDb()
		.update(services)
		.set({ ...item, updatedAt: new Date() })
		.where(eq(services.id, id));
	revalidateCatalogPaths();
}

export async function deleteServiceItem(id: string): Promise<void> {
	await assertAdmin();
	await getDb().delete(services).where(eq(services.id, id));
	revalidateCatalogPaths();
}

export async function getAllForCms(): Promise<ServiceItem[]> {
	await assertAdmin();
	const rows = await getDb()
		.select()
		.from(services)
		.orderBy(...displayOrder);
	return rows.map(toServiceItem);
}
