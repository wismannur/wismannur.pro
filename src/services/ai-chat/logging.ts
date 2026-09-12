import "server-only";

import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { aiChatSessions, aiChatMessages } = schema;

export interface LogChatInteractionParams {
  sessionId: string;
  visitorId: string;
  ipAddress?: string;
  userAgent?: string;
  userMessage: string;
  assistantMessage: string;
  toolCallName?: string;
  toolCallArgs?: Record<string, unknown>;
  toolCallResult?: Record<string, unknown>;
}

/**
 * Server-only internal routine that persists an entire Q&A turn into the database.
 * Not exposed as a Next.js Server Action RPC endpoint.
 */
export async function logChatInteraction(params: LogChatInteractionParams): Promise<void> {
  try {
    const db = getDb();
    const sessionId = params.sessionId.slice(0, 100);
    const visitorId = params.visitorId.slice(0, 100);
    const userMessage = (params.userMessage || "").trim().slice(0, 8000);
    const assistantMessage = (params.assistantMessage || "").trim().slice(0, 16000);
    const ipAddress = params.ipAddress ? params.ipAddress.slice(0, 45) : null;
    const userAgent = params.userAgent ? params.userAgent.slice(0, 255) : null;

    if (!sessionId || !userMessage) {
      return;
    }

    // Check if session exists
    const [existingSession] = await db
      .select({ id: aiChatSessions.id })
      .from(aiChatSessions)
      .where(eq(aiChatSessions.id, sessionId))
      .limit(1);

    if (!existingSession) {
      const cleanTitle = userMessage.slice(0, 60) + (userMessage.length > 60 ? "..." : "");

      await db.insert(aiChatSessions).values({
        id: sessionId,
        visitorId,
        ipAddress,
        userAgent,
        title: cleanTitle || "New Conversation",
        messageCount: 2,
        lastMessage: assistantMessage.slice(0, 150),
      });
    } else {
      await db
        .update(aiChatSessions)
        .set({
          messageCount: sql`${aiChatSessions.messageCount} + 2`,
          lastMessage: assistantMessage.slice(0, 150),
          updatedAt: new Date(),
        })
        .where(eq(aiChatSessions.id, sessionId));
    }

    // Insert user message
    await db.insert(aiChatMessages).values({
      sessionId,
      role: "user",
      content: userMessage,
    });

    // Insert assistant message
    await db.insert(aiChatMessages).values({
      sessionId,
      role: "assistant",
      content: assistantMessage,
      toolCallName: params.toolCallName?.slice(0, 100) || null,
      toolCallArgs: params.toolCallArgs || null,
      toolCallResult: params.toolCallResult || null,
    });
  } catch (error) {
    console.error("[logChatInteraction Error]:", error);
  }
}
