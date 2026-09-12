"use server";

import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { invalidateKnowledgeCache } from "../ai-chat/knowledge-context";
import type { AiKnowledgeItem, NewAiKnowledgeItem, UpdateAiKnowledgeItem } from "./types";

const { aiKnowledgeItems } = schema;

export async function getAiKnowledgeItems(
  category?: string,
  search?: string
): Promise<AiKnowledgeItem[]> {
  await assertAdmin();
  const db = getDb();

  const conditions = [];

  if (category && category !== "all") {
    conditions.push(eq(aiKnowledgeItems.category, category));
  }

  if (search) {
    conditions.push(
      or(
        ilike(aiKnowledgeItems.title, `%${search}%`),
        ilike(aiKnowledgeItems.content, `%${search}%`),
        ilike(aiKnowledgeItems.category, `%${search}%`)
      )
    );
  }

  const query = db
    .select()
    .from(aiKnowledgeItems)
    .orderBy(asc(aiKnowledgeItems.sortOrder), desc(aiKnowledgeItems.createdAt));

  if (conditions.length > 0) {
    return query.where(conditions.length === 1 ? conditions[0] : or(...conditions));
  }

  return query;
}

export async function getAiKnowledgeItemById(id: string): Promise<AiKnowledgeItem | null> {
  await assertAdmin();
  const db = getDb();
  const [item] = await db
    .select()
    .from(aiKnowledgeItems)
    .where(eq(aiKnowledgeItems.id, id))
    .limit(1);

  return item ?? null;
}

export async function createAiKnowledgeItem(data: NewAiKnowledgeItem): Promise<string> {
  await assertAdmin();
  const db = getDb();

  const [{ id }] = await db
    .insert(aiKnowledgeItems)
    .values({
      category: data.category || "general",
      title: data.title.trim(),
      content: data.content.trim(),
      tags: data.tags || [],
      isPublished: data.isPublished ?? true,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning({ id: aiKnowledgeItems.id });

  invalidateKnowledgeCache();
  revalidatePath("/cms/ai-knowledge");
  return id;
}

export async function updateAiKnowledgeItem(
  id: string,
  data: UpdateAiKnowledgeItem
): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db
    .update(aiKnowledgeItems)
    .set({
      ...(data.category ? { category: data.category } : {}),
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.content ? { content: data.content.trim() } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      updatedAt: new Date(),
    })
    .where(eq(aiKnowledgeItems.id, id));

  invalidateKnowledgeCache();
  revalidatePath("/cms/ai-knowledge");
}

export async function toggleAiKnowledgeItemPublished(
  id: string,
  isPublished: boolean
): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db
    .update(aiKnowledgeItems)
    .set({
      isPublished,
      updatedAt: new Date(),
    })
    .where(eq(aiKnowledgeItems.id, id));

  invalidateKnowledgeCache();
  revalidatePath("/cms/ai-knowledge");
}

export async function deleteAiKnowledgeItem(id: string): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db.delete(aiKnowledgeItems).where(eq(aiKnowledgeItems.id, id));

  invalidateKnowledgeCache();
  revalidatePath("/cms/ai-knowledge");
}
