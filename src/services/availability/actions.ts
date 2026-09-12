"use server";

import { revalidatePath } from "next/cache";

import { asc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type { AvailabilitySlot, NewAvailabilitySlot, UpdateAvailabilitySlot } from "./types";

// Server actions backing `availabilityService` — the /hire-me slot grid.

const { availabilitySlots } = schema;

function revalidateAvailabilityPaths() {
  revalidatePath("/hire-me");
}

// Chronological, with sortOrder as the manual override.
const displayOrder = [
  asc(availabilitySlots.sortOrder),
  asc(availabilitySlots.year),
  asc(availabilitySlots.month),
];

export async function getPublished(): Promise<AvailabilitySlot[]> {
  return getDb()
    .select()
    .from(availabilitySlots)
    .where(eq(availabilitySlots.isPublished, true))
    .orderBy(...displayOrder);
}

export async function getById(id: string): Promise<AvailabilitySlot | null> {
  await assertAdmin();
  const [row] = await getDb()
    .select()
    .from(availabilitySlots)
    .where(eq(availabilitySlots.id, id))
    .limit(1);
  return row ?? null;
}

export async function create(slot: NewAvailabilitySlot): Promise<string> {
  await assertAdmin();
  const [{ id }] = await getDb()
    .insert(availabilitySlots)
    .values(slot)
    .returning({ id: availabilitySlots.id });
  revalidateAvailabilityPaths();
  return id;
}

export async function update(id: string, slot: UpdateAvailabilitySlot): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(availabilitySlots)
    .set({ ...slot, updatedAt: new Date() })
    .where(eq(availabilitySlots.id, id));
  revalidateAvailabilityPaths();
}

export async function deleteAvailabilitySlot(id: string): Promise<void> {
  await assertAdmin();
  await getDb().delete(availabilitySlots).where(eq(availabilitySlots.id, id));
  revalidateAvailabilityPaths();
}

export async function getAllForCms(): Promise<AvailabilitySlot[]> {
  await assertAdmin();
  return getDb()
    .select()
    .from(availabilitySlots)
    .orderBy(...displayOrder);
}
