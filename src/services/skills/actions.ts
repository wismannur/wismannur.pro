"use server";

import { revalidatePath } from "next/cache";

import { asc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type { NewSkill, Skill, UpdateSkill } from "./types";

// Server actions backing `skillsService` — the skills grid on /about.

const { skills } = schema;

function revalidateSkillPaths() {
  revalidatePath("/about");
}

const displayOrder = [asc(skills.sortOrder), asc(skills.name)];

export async function getPublished(): Promise<Skill[]> {
  return getDb()
    .select()
    .from(skills)
    .where(eq(skills.isPublished, true))
    .orderBy(...displayOrder);
}

export async function getById(id: string): Promise<Skill | null> {
  await assertAdmin();
  const [row] = await getDb().select().from(skills).where(eq(skills.id, id)).limit(1);
  return row ?? null;
}

export async function create(skill: NewSkill): Promise<string> {
  await assertAdmin();
  const [{ id }] = await getDb().insert(skills).values(skill).returning({ id: skills.id });
  revalidateSkillPaths();
  return id;
}

export async function update(id: string, skill: UpdateSkill): Promise<void> {
  await assertAdmin();
  await getDb()
    .update(skills)
    .set({ ...skill, updatedAt: new Date() })
    .where(eq(skills.id, id));
  revalidateSkillPaths();
}

export async function deleteSkill(id: string): Promise<void> {
  await assertAdmin();
  await getDb().delete(skills).where(eq(skills.id, id));
  revalidateSkillPaths();
}

export async function getAllForCms(): Promise<Skill[]> {
  await assertAdmin();
  return getDb()
    .select()
    .from(skills)
    .orderBy(...displayOrder);
}
