"use server";

import { desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type { AiChatMessageRow, AiChatSessionRow } from "@/db/schema";

const { aiChatSessions, aiChatMessages } = schema;



export interface ChatSessionSummary extends AiChatSessionRow {
  messages?: AiChatMessageRow[];
}

/**
 * Admin action: list chat sessions with search and pagination.
 */
export async function getAiChatSessions(search?: string, limit = 50): Promise<AiChatSessionRow[]> {
  await assertAdmin();
  const db = getDb();

  const whereCondition = search
    ? or(
        ilike(aiChatSessions.title, `%${search}%`),
        ilike(aiChatSessions.lastMessage, `%${search}%`),
        ilike(aiChatSessions.ipAddress, `%${search}%`)
      )
    : undefined;

  const sessions = await db
    .select()
    .from(aiChatSessions)
    .where(whereCondition)
    .orderBy(desc(aiChatSessions.updatedAt))
    .limit(limit);

  return sessions;
}

/**
 * Admin action: get full conversation details for a given session.
 */
export async function getAiChatSessionDetails(
  sessionId: string
): Promise<{ session: AiChatSessionRow; messages: AiChatMessageRow[] } | null> {
  await assertAdmin();
  const db = getDb();

  const [session] = await db
    .select()
    .from(aiChatSessions)
    .where(eq(aiChatSessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  const messages = await db
    .select()
    .from(aiChatMessages)
    .where(eq(aiChatMessages.sessionId, sessionId))
    .orderBy(aiChatMessages.createdAt);

  return { session, messages };
}

/**
 * Admin action: delete a chat session and all associated messages.
 */
export async function deleteAiChatSession(sessionId: string): Promise<boolean> {
  await assertAdmin();
  const db = getDb();

  await db.delete(aiChatSessions).where(eq(aiChatSessions.id, sessionId));
  revalidatePath("/cms/ai-chat-logs");
  return true;
}
