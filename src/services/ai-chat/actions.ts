"use server";

import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type {
	AiChatMessageRow,
	AiChatSessionRow,
} from "@/db/schema";

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
 * Persists an entire Q&A turn (user input + assistant response) into the database.
 * Auto-creates the session if it's the first message.
 */
export async function logChatInteraction(params: LogChatInteractionParams) {
	try {
		const db = getDb();

		// Check if session exists
		const [existingSession] = await db
			.select()
			.from(aiChatSessions)
			.where(eq(aiChatSessions.id, params.sessionId))
			.limit(1);

		if (!existingSession) {
			// Derive a clean title from the first 50 chars of the user prompt
			const cleanTitle =
				params.userMessage.trim().slice(0, 60) +
				(params.userMessage.length > 60 ? "..." : "");

			await db.insert(aiChatSessions).values({
				id: params.sessionId,
				visitorId: params.visitorId,
				ipAddress: params.ipAddress || null,
				userAgent: params.userAgent || null,
				title: cleanTitle || "New Conversation",
				messageCount: 2,
				lastMessage: params.assistantMessage.slice(0, 150),
			});
		} else {
			await db
				.update(aiChatSessions)
				.set({
					messageCount: sql`${aiChatSessions.messageCount} + 2`,
					lastMessage: params.assistantMessage.slice(0, 150),
					updatedAt: new Date(),
				})
				.where(eq(aiChatSessions.id, params.sessionId));
		}

		// Insert user message
		await db.insert(aiChatMessages).values({
			sessionId: params.sessionId,
			role: "user",
			content: params.userMessage,
		});

		// Insert assistant message
		await db.insert(aiChatMessages).values({
			sessionId: params.sessionId,
			role: "assistant",
			content: params.assistantMessage,
			toolCallName: params.toolCallName || null,
			toolCallArgs: params.toolCallArgs || null,
			toolCallResult: params.toolCallResult || null,
		});
	} catch (error) {
		console.error("[logChatInteraction Error]:", error);
	}
}

export interface ChatSessionSummary extends AiChatSessionRow {
	messages?: AiChatMessageRow[];
}

/**
 * Admin action: list chat sessions with search and pagination.
 */
export async function getAiChatSessions(
	search?: string,
	limit = 50,
): Promise<AiChatSessionRow[]> {
	await assertAdmin();
	const db = getDb();

	const whereCondition = search
		? or(
				ilike(aiChatSessions.title, `%${search}%`),
				ilike(aiChatSessions.lastMessage, `%${search}%`),
				ilike(aiChatSessions.ipAddress, `%${search}%`),
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
	sessionId: string,
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
