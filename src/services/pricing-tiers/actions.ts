"use server";

import { revalidatePath } from "next/cache";

import { asc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type { NewPricingTier, PricingTier, UpdatePricingTier } from "./types";

// Server actions backing `pricingTiersService` — /hire-me service packages.

const { pricingTiers } = schema;

function revalidateTierPaths() {
	revalidatePath("/hire-me");
}

const displayOrder = [asc(pricingTiers.sortOrder), asc(pricingTiers.name)];

export async function getPublished(): Promise<PricingTier[]> {
	return getDb()
		.select()
		.from(pricingTiers)
		.where(eq(pricingTiers.isPublished, true))
		.orderBy(...displayOrder);
}

export async function getById(id: string): Promise<PricingTier | null> {
	await assertAdmin();
	const [row] = await getDb()
		.select()
		.from(pricingTiers)
		.where(eq(pricingTiers.id, id))
		.limit(1);
	return row ?? null;
}

export async function create(tier: NewPricingTier): Promise<string> {
	await assertAdmin();
	const [{ id }] = await getDb()
		.insert(pricingTiers)
		.values(tier)
		.returning({ id: pricingTiers.id });
	revalidateTierPaths();
	return id;
}

export async function update(id: string, tier: UpdatePricingTier): Promise<void> {
	await assertAdmin();
	await getDb()
		.update(pricingTiers)
		.set({ ...tier, updatedAt: new Date() })
		.where(eq(pricingTiers.id, id));
	revalidateTierPaths();
}

export async function deletePricingTier(id: string): Promise<void> {
	await assertAdmin();
	await getDb().delete(pricingTiers).where(eq(pricingTiers.id, id));
	revalidateTierPaths();
}

export async function getAllForCms(): Promise<PricingTier[]> {
	await assertAdmin();
	return getDb()
		.select()
		.from(pricingTiers)
		.orderBy(...displayOrder);
}
