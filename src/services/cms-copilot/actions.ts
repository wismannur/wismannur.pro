"use server";

import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type { CmsCopilotMessageRow, CmsCopilotSessionRow } from "@/db/schema";
import type { ToolCallInfo, ToolResultInfo } from "./types";

const { cmsCopilotSessions, cmsCopilotMessages } = schema;

export async function getCmsCopilotSessions(): Promise<CmsCopilotSessionRow[]> {
  await assertAdmin();
  const db = getDb();

  return db
    .select()
    .from(cmsCopilotSessions)
    .orderBy(desc(cmsCopilotSessions.updatedAt))
    .limit(50);
}

export async function getCmsCopilotSessionMessages(
  sessionId: string
): Promise<CmsCopilotMessageRow[]> {
  await assertAdmin();
  const db = getDb();

  return db
    .select()
    .from(cmsCopilotMessages)
    .where(eq(cmsCopilotMessages.sessionId, sessionId))
    .orderBy(cmsCopilotMessages.createdAt);
}

export async function createCmsCopilotSession(
  title = "New Conversation",
  currentPath = "/cms/dashboard"
): Promise<string> {
  await assertAdmin();
  const db = getDb();

  const [{ id }] = await db
    .insert(cmsCopilotSessions)
    .values({
      title,
      currentPath,
      messageCount: 0,
    })
    .returning({ id: cmsCopilotSessions.id });

  return id;
}

export async function deleteCmsCopilotSession(sessionId: string): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db.delete(cmsCopilotSessions).where(eq(cmsCopilotSessions.id, sessionId));
}

export async function updateCmsCopilotSessionTitle(
  sessionId: string,
  newTitle: string
): Promise<void> {
  await assertAdmin();
  const db = getDb();

  const trimmed = newTitle.trim();
  if (!trimmed) {
    throw new Error("Judul sesi percakapan tidak boleh kosong");
  }

  await db
    .update(cmsCopilotSessions)
    .set({
      title: trimmed.slice(0, 100),
      updatedAt: new Date(),
    })
    .where(eq(cmsCopilotSessions.id, sessionId));
}

export async function clearAllCmsCopilotSessions(): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db.delete(cmsCopilotSessions);
}

export interface SaveCopilotTurnParams {
  sessionId: string;
  userMessage: string;
  assistantMessage: string;
  currentPath?: string;
  toolCalls?: ToolCallInfo[];
  toolResults?: ToolResultInfo[];
}

export async function saveCmsCopilotTurn(params: SaveCopilotTurnParams): Promise<void> {
  await assertAdmin();
  const db = getDb();

  try {
    const [existingSession] = await db
      .select()
      .from(cmsCopilotSessions)
      .where(eq(cmsCopilotSessions.id, params.sessionId))
      .limit(1);

    const cleanTitle =
      params.userMessage.trim().slice(0, 50) + (params.userMessage.length > 50 ? "..." : "");

    if (!existingSession) {
      await db.insert(cmsCopilotSessions).values({
        id: params.sessionId,
        title: cleanTitle || "New Conversation",
        currentPath: params.currentPath || "/cms/dashboard",
        messageCount: 2,
        lastMessage: params.assistantMessage.slice(0, 150),
      });
    } else {
      const isDefaultTitle =
        !existingSession.title ||
        existingSession.title === "New Session" ||
        existingSession.title === "New Conversation";

      await db
        .update(cmsCopilotSessions)
        .set({
          title: isDefaultTitle ? cleanTitle : existingSession.title,
          currentPath: params.currentPath || existingSession.currentPath,
          messageCount: sql`${cmsCopilotSessions.messageCount} + 2`,
          lastMessage: params.assistantMessage.slice(0, 150),
          updatedAt: new Date(),
        })
        .where(eq(cmsCopilotSessions.id, params.sessionId));
    }

    // Insert user message
    await db.insert(cmsCopilotMessages).values({
      sessionId: params.sessionId,
      role: "user",
      content: params.userMessage,
    });

    // Insert assistant message
    await db.insert(cmsCopilotMessages).values({
      sessionId: params.sessionId,
      role: "assistant",
      content: params.assistantMessage,
      toolCalls: params.toolCalls && params.toolCalls.length > 0 ? params.toolCalls : null,
      toolResults: params.toolResults && params.toolResults.length > 0 ? params.toolResults : null,
    });
  } catch (error) {
    console.error("[saveCmsCopilotTurn Error]:", error);
  }
}
