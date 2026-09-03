"use server";

import { revalidatePath } from "next/cache";

import { asc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { OfferRow } from "@/db/schema";
import { assertAdmin } from "../core/auth-guard";
import type { NewOffer, Offer, UpdateOffer } from "./types";

// Server actions backing `offersService` — the /offers package catalog.

const { offers } = schema;

function revalidateOfferPaths() {
  revalidatePath("/offers");
}

const toOffer = (row: OfferRow): Offer => ({
  ...row,
  color: row.color ?? undefined,
});

const displayOrder = [asc(offers.sortOrder), asc(offers.title)];

export async function getPublished(): Promise<Offer[]> {
  const rows = await getDb()
    .select()
    .from(offers)
    .where(eq(offers.isPublished, true))
    .orderBy(...displayOrder);
  return rows.map(toOffer);
}

export async function getById(id: string): Promise<Offer | null> {
  await assertAdmin();
  const [row] = await getDb().select().from(offers).where(eq(offers.id, id)).limit(1);
  return row ? toOffer(row) : null;
}

export async function create(offer: NewOffer): Promise<string> {
  await assertAdmin();
  const [{ id }] = await getDb()
    .insert(offers)
    .values({ ...offer, color: offer.color ?? null })
    .returning({ id: offers.id });
  revalidateOfferPaths();
  return id;
}

export async function update(id: string, offer: UpdateOffer): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(offers)
    .set({ ...offer, updatedAt: new Date() })
    .where(eq(offers.id, id));
  revalidateOfferPaths();
}

export async function deleteOffer(id: string): Promise<void> {
  await assertAdmin();
  await getDb().delete(offers).where(eq(offers.id, id));
  revalidateOfferPaths();
}

export async function getAllForCms(): Promise<Offer[]> {
  await assertAdmin();
  const rows = await getDb()
    .select()
    .from(offers)
    .orderBy(...displayOrder);
  return rows.map(toOffer);
}
