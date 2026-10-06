import { Type } from "@google/genai";
import { revalidatePath } from "next/cache";
import type { CopilotToolExecutionResult } from "../types";
import {
  getCmsCopilotSessionDetails,
  searchCmsCopilotSessions,
  deleteCmsCopilotSession,
} from "../actions";

export const COPILOT_SESSION_TOOL_DECLARATIONS = [
  {
    name: "list_recent_cms_copilot_sessions",
    description:
      "List or search recent internal CMS Staff Copilot conversation sessions. Returns session IDs, titles, message counts, active routes, and timestamps. Use this when Wisman asks what was discussed in past sessions, searches for previous topics, or needs to find a session ref ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search: {
          type: Type.STRING,
          description: "Optional keyword to search session title or last message",
        },
        limit: {
          type: Type.INTEGER,
          description: "Number of sessions to return (1-30, default 10)",
        },
      },
    },
  },
  {
    name: "get_cms_copilot_session_detail",
    description:
      "Retrieve full conversation history, user prompts, assistant answers, and metadata of a previous internal CMS Staff Copilot session. CRITICAL: Use this immediately whenever Wisman mentions a session ID / ref ID (e.g. 'e1b3e334-2708-4bef-af6f-5c71c7a82090' or 'ref:e1b3e334' or 'e1b3e334'), asks to resume or continue an earlier conversation, or references past discussions in Copilot.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sessionId: {
          type: Type.STRING,
          description:
            "The UUID or reference ID of the CMS Copilot session (e.g. 'e1b3e334-2708-4bef-af6f-5c71c7a82090' or 'ref:e1b3e334' or 'e1b3e334')",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "delete_cms_copilot_session",
    description:
      "Delete an internal CMS Staff Copilot session and all its messages by session ID or ref ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sessionId: {
          type: Type.STRING,
          description: "The UUID or reference ID of the CMS Copilot session to delete",
        },
      },
      required: ["sessionId"],
    },
  },
];

export async function executeCopilotSessionTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  switch (name) {
    case "list_recent_cms_copilot_sessions": {
      const search = typeof args.search === "string" ? args.search : undefined;
      const limit = typeof args.limit === "number" ? args.limit : 10;
      const sessions = await searchCmsCopilotSessions(search, limit);
      return {
        success: true,
        data: {
          count: sessions.length,
          sessions: sessions.map((s) => ({
            id: s.id,
            title: s.title,
            currentPath: s.currentPath,
            messageCount: s.messageCount,
            lastMessage: s.lastMessage ? s.lastMessage.slice(0, 160) : null,
            updatedAt: s.updatedAt,
            createdAt: s.createdAt,
          })),
        },
        message: `Ditemukan ${sessions.length} sesi CMS Staff Copilot.`,
      };
    }

    case "get_cms_copilot_session_detail": {
      const sessionId = String(args.sessionId || "").trim();
      if (!sessionId) {
        return { success: false, error: "sessionId is required." };
      }

      const result = await getCmsCopilotSessionDetails(sessionId);
      if (!result) {
        return {
          success: false,
          error: `CMS Staff Copilot session '${sessionId}' tidak ditemukan di database. Pastikan format ref ID sudah sesuai.`,
        };
      }

      const { session, messages } = result;

      const formattedMessages = messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        toolCallsCount: Array.isArray(m.toolCalls) ? m.toolCalls.length : 0,
      }));

      return {
        success: true,
        data: {
          session: {
            id: session.id,
            title: session.title,
            currentPath: session.currentPath,
            messageCount: session.messageCount,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          },
          messageCount: formattedMessages.length,
          messages: formattedMessages,
        },
        message: `Berhasil memuat transkrip sesi '${session.title}' (${formattedMessages.length} pesan). Anda dapat langsung melanjutkan konteks percakapan ini dan merekap progres terakhir.`,
      };
    }

    case "delete_cms_copilot_session": {
      const sessionId = String(args.sessionId || "").trim();
      if (!sessionId) {
        return { success: false, error: "sessionId is required." };
      }

      const result = await getCmsCopilotSessionDetails(sessionId);
      if (!result) {
        return {
          success: false,
          error: `CMS Staff Copilot session '${sessionId}' tidak ditemukan.`,
        };
      }

      await deleteCmsCopilotSession(result.session.id);
      revalidatePath("/cms");

      return {
        success: true,
        data: { id: result.session.id, title: result.session.title },
        message: `Sesi Copilot '${result.session.title}' (${result.session.id}) berhasil dihapus.`,
      };
    }

    default:
      return null;
  }
}
