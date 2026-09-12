"use server";

import { revalidatePath } from "next/cache";

import { and, asc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { ProcessStepRow } from "@/db/schema";
import { assertAdmin } from "../core/auth-guard";
import type { NewProcessStep, ProcessScope, ProcessStep, UpdateProcessStep } from "./types";

// Server actions backing `processStepsService` — the "how we'll work
// together" step lists on /services and /hire-me.

const { processSteps } = schema;

function revalidateStepPaths() {
  revalidatePath("/services");
  revalidatePath("/hire-me");
}

const toProcessStep = (row: ProcessStepRow): ProcessStep => ({
  ...row,
  icon: row.icon ?? undefined,
});

const displayOrder = [asc(processSteps.sortOrder), asc(processSteps.title)];

export async function getPublished(scope: ProcessScope): Promise<ProcessStep[]> {
  const rows = await getDb()
    .select()
    .from(processSteps)
    .where(and(eq(processSteps.isPublished, true), eq(processSteps.scope, scope)))
    .orderBy(...displayOrder);
  return rows.map(toProcessStep);
}

export async function getById(id: string): Promise<ProcessStep | null> {
  await assertAdmin();
  const [row] = await getDb().select().from(processSteps).where(eq(processSteps.id, id)).limit(1);
  return row ? toProcessStep(row) : null;
}

export async function create(step: NewProcessStep): Promise<string> {
  await assertAdmin();
  const [{ id }] = await getDb()
    .insert(processSteps)
    .values({ ...step, icon: step.icon ?? null })
    .returning({ id: processSteps.id });
  revalidateStepPaths();
  return id;
}

export async function update(id: string, step: UpdateProcessStep): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(processSteps)
    .set({ ...step, updatedAt: new Date() })
    .where(eq(processSteps.id, id));
  revalidateStepPaths();
}

export async function deleteProcessStep(id: string): Promise<void> {
  await assertAdmin();
  await getDb().delete(processSteps).where(eq(processSteps.id, id));
  revalidateStepPaths();
}

export async function getAllForCms(): Promise<ProcessStep[]> {
  await assertAdmin();
  const rows = await getDb()
    .select()
    .from(processSteps)
    .orderBy(asc(processSteps.scope), ...displayOrder);
  return rows.map(toProcessStep);
}
