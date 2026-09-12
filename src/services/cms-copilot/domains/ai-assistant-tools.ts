import { Type } from "@google/genai";
import { revalidatePath } from "next/cache";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { CopilotToolExecutionResult } from "../types";
import { deleteAiKnowledgeItem } from "../../ai-knowledge/actions";
import {
  getEnglishFluencyStreak,
  getRecentSessions,
  deleteSession as deleteEnglishSessionAction,
  getEnglishVocabularies,
  saveCustomVocab,
  toggleVocabMastery,
  deleteVocab as deleteEnglishVocabAction,
  getCurriculumTracksWithProgress,
} from "../../ai-english-fluency/actions";
import type {
  FluencyCategory,
  TargetLevel,
  MasteryStatus,
} from "../../ai-english-fluency/types";
import {
  getAiChatSessionDetails,
  deleteAiChatSession,
} from "../../ai-chat/actions";

const {
  aiKnowledgeItems,
  aiChatSessions,
  aiEnglishSessions,
  aiEnglishVocabularies,
  aiEnglishStreaks,
  aiEnglishCurriculumProgress,
} = schema;

export const AI_ASSISTANT_TOOL_DECLARATIONS = [
  {
    name: "list_ai_knowledge_items",
    description:
      "Search and list AI Knowledge Hub items used to ground Wisman's portfolio AI assistant.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description:
            "Filter category: general, bio, tech-stack, projects, experience, contact, faqs, or all",
        },
        search: {
          type: Type.STRING,
          description: "Search keyword matching title or content",
        },
      },
    },
  },
  {
    name: "create_ai_knowledge_item",
    description:
      "Add a new knowledge entry to Wisman's AI Knowledge Hub so the public assistant knows about it.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: "Category: general, bio, tech-stack, projects, experience, contact, faqs",
        },
        title: {
          type: Type.STRING,
          description: "Title of the knowledge document or FAQ",
        },
        content: {
          type: Type.STRING,
          description: "Markdown / text content of the knowledge item",
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Optional list of keyword tags",
        },
      },
      required: ["category", "title", "content"],
    },
  },
  {
    name: "update_ai_knowledge_item",
    description: "Update an existing AI knowledge item title, content, or published status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "ID of the AI knowledge item",
        },
        title: {
          type: Type.STRING,
          description: "Updated title",
        },
        content: {
          type: Type.STRING,
          description: "Updated content",
        },
        category: {
          type: Type.STRING,
          description: "Updated category",
        },
        isPublished: {
          type: Type.BOOLEAN,
          description: "Whether this knowledge item is active and visible to the AI",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_ai_knowledge_item",
    description: "Permanently delete an AI knowledge item by its ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Knowledge item ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_english_fluency_overview",
    description:
      "Get habit tracker & progress stats from AI English Fluency Hub: current streak, total speaking minutes, completed sessions, and mastered vocabularies.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "list_english_sessions",
    description:
      "List English speaking drill sessions. Filter by status ('completed', 'in_progress') or view recent.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Status filter: in_progress, completed, or all",
        },
        limit: {
          type: Type.INTEGER,
          description: "Max sessions to return (default: 10)",
        },
      },
    },
  },
  {
    name: "get_english_session_detail",
    description:
      "Retrieve comprehensive details of an English drill session: scenario, speech transcript, feedback, CEFR scores, grammar corrections, and pronunciation tips.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Session ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_english_session",
    description: "Permanently delete an English fluency practice session log by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Session ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_english_vocabularies",
    description:
      "Search and list English vocabulary cards (filter by masteryStatus: 'learning' or 'mastered', category, or search keyword).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        masteryStatus: {
          type: Type.STRING,
          description: "Filter: learning, mastered, or all",
        },
        category: {
          type: Type.STRING,
          description: "Filter: technical, workplace_idiom, collaboration, leadership, general, or all",
        },
        search: {
          type: Type.STRING,
          description: "Search keyword matching phrase or meaning",
        },
      },
    },
  },
  {
    name: "save_english_vocabulary",
    description: "Save a new technical or executive English vocabulary card into the Fluency Hub deck.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        phrase: {
          type: Type.STRING,
          description: "The English phrase or idiom (e.g. 'Trade-off analysis', 'Pushback')",
        },
        meaning: {
          type: Type.STRING,
          description: "Meaning or Indonesian translation/explanation",
        },
        category: {
          type: Type.STRING,
          description: "Category: technical, workplace_idiom, collaboration, leadership, general",
        },
        targetLevel: {
          type: Type.STRING,
          description: "Target CEFR level: A1-A2, B1, B2, C1",
        },
        techContextExample: {
          type: Type.STRING,
          description: "Realistic sentence example in senior engineering / staff context",
        },
        casualVsStaff: {
          type: Type.STRING,
          description: "Comparison showing casual vs executive staff-level wording",
        },
      },
      required: ["phrase", "meaning", "techContextExample"],
    },
  },
  {
    name: "toggle_english_vocab_mastery",
    description: "Toggle mastery status of a vocabulary card between 'learning' and 'mastered'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Vocabulary record ID",
        },
        masteryStatus: {
          type: Type.STRING,
          description: "learning or mastered",
        },
      },
      required: ["id", "masteryStatus"],
    },
  },
  {
    name: "update_english_vocabulary",
    description:
      "Update an existing English vocabulary card (phrase, meaning, category, targetLevel, techContextExample, casualVsStaff, masteryStatus).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Vocabulary record ID",
        },
        phrase: {
          type: Type.STRING,
          description: "Phrase or idiom",
        },
        meaning: {
          type: Type.STRING,
          description: "Meaning or translation",
        },
        category: {
          type: Type.STRING,
          description: "Category: technical, workplace_idiom, collaboration, leadership, general",
        },
        targetLevel: {
          type: Type.STRING,
          description: "Target level: A1-A2, B1, B2, C1",
        },
        techContextExample: {
          type: Type.STRING,
          description: "Contextual sentence example",
        },
        casualVsStaff: {
          type: Type.STRING,
          description: "Comparison showing casual vs executive staff-level wording",
        },
        masteryStatus: {
          type: Type.STRING,
          description: "learning or mastered",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_english_vocabulary",
    description: "Permanently delete an English vocabulary card from the deck by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Vocabulary record ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_english_curriculum_progress",
    description:
      "Fetch CEFR curriculum tracks (A2 Elementary, B1 Intermediate, B2 Upper-Intermediate) and completion stats.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "reset_english_curriculum_progress",
    description:
      "Reset or clear curriculum roadmap progress (completed lessons, quiz/spoken scores) and optionally reset habit streak analytics back to 0.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        resetHabitAnalytics: {
          type: Type.BOOLEAN,
          description: "Whether to also reset habit streak analytics (streak, speaking minutes, total sessions) to 0. Default: true",
        },
        lessonId: {
          type: Type.STRING,
          description: "Optional specific lesson ID (e.g. 'a2-u1-l1') to reset. If omitted, resets all completed lessons.",
        },
      },
    },
  },
  {
    name: "get_recent_visitor_chats",
    description:
      "Get recent chat sessions and questions asked by visitors on the public portfolio website.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: "Number of sessions to retrieve (default: 10)",
        },
      },
    },
  },
  {
    name: "get_ai_chat_session_detail",
    description:
      "Get full conversation dialogue turns and tool call logs for a specific visitor chat session.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sessionId: {
          type: Type.STRING,
          description: "The visitor chat session ID",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "delete_ai_chat_session",
    description: "Permanently delete a visitor chat session and all its messages from AI Chat Logs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sessionId: {
          type: Type.STRING,
          description: "Session ID to delete",
        },
      },
      required: ["sessionId"],
    },
  },
];

export async function executeAiAssistantTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  const db = getDb();

  switch (name) {
    case "list_ai_knowledge_items": {
      const category = args.category as string | undefined;
      const search = args.search as string | undefined;

      const conditions = [];
      if (category && category !== "all") {
        conditions.push(eq(aiKnowledgeItems.category, category));
      }
      if (search) {
        conditions.push(
          or(
            ilike(aiKnowledgeItems.title, `%${search}%`),
            ilike(aiKnowledgeItems.content, `%${search}%`)
          )
        );
      }

      let query = db
        .select()
        .from(aiKnowledgeItems)
        .orderBy(desc(aiKnowledgeItems.updatedAt))
        .limit(20);

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as typeof query;
      }

      const items = await query;
      return {
        success: true,
        data: {
          count: items.length,
          items: items.map((i) => ({
            id: i.id,
            category: i.category,
            title: i.title,
            contentSnippet: i.content.slice(0, 200),
            tags: i.tags,
            isPublished: i.isPublished,
          })),
        },
      };
    }

    case "create_ai_knowledge_item": {
      const category = String(args.category || "general").trim();
      const title = String(args.title || "").trim();
      const content = String(args.content || "").trim();
      const tags = Array.isArray(args.tags) ? (args.tags as string[]) : [];

      const [{ id }] = await db
        .insert(aiKnowledgeItems)
        .values({
          category,
          title,
          content,
          tags,
          isPublished: true,
        })
        .returning({ id: aiKnowledgeItems.id });

      revalidatePath("/cms/ai-knowledge");

      return {
        success: true,
        message: `AI Knowledge item '${title}' created successfully.`,
        data: { id, title, category },
      };
    }

    case "update_ai_knowledge_item": {
      const id = args.id as string;
      const title = args.title as string | undefined;
      const content = args.content as string | undefined;
      const category = args.category as string | undefined;
      const isPublished = typeof args.isPublished === "boolean" ? args.isPublished : undefined;

      const [existing] = await db
        .select()
        .from(aiKnowledgeItems)
        .where(eq(aiKnowledgeItems.id, id))
        .limit(1);

      if (!existing) {
        return { success: false, error: `Knowledge item '${id}' not found.` };
      }

      await db
        .update(aiKnowledgeItems)
        .set({
          ...(title ? { title: title.trim() } : {}),
          ...(content ? { content: content.trim() } : {}),
          ...(category ? { category: category.trim() } : {}),
          ...(isPublished !== undefined ? { isPublished } : {}),
          updatedAt: new Date(),
        })
        .where(eq(aiKnowledgeItems.id, id));

      revalidatePath("/cms/ai-knowledge");

      return {
        success: true,
        message: `AI Knowledge item '${existing.title}' updated successfully.`,
      };
    }

    case "delete_ai_knowledge_item": {
      const id = args.id as string;
      const [existing] = await db
        .select({ title: aiKnowledgeItems.title })
        .from(aiKnowledgeItems)
        .where(eq(aiKnowledgeItems.id, id))
        .limit(1);

      if (!existing) {
        return { success: false, error: `AI Knowledge item '${id}' not found.` };
      }

      await deleteAiKnowledgeItem(id);

      return {
        success: true,
        message: `AI Knowledge item '${existing.title}' (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    case "get_english_fluency_overview": {
      const streak = await getEnglishFluencyStreak();
      const recentSessions = await getRecentSessions(5);

      return {
        success: true,
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          totalSessions: streak.totalSessions,
          totalSpeakingMinutes: streak.totalSpeakingMinutes,
          masteredVocabCount: streak.masteredVocabCount,
          lastActivityDate: streak.lastActivityDate,
          recentSessions: recentSessions.map((s) => ({
            id: s.id,
            topicTitle: s.topicTitle,
            overallScore: s.overallScore,
            status: s.status,
            completedAt: s.completedAt,
          })),
        },
      };
    }

    case "list_english_sessions": {
      const status = args.status as string | undefined;
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 50) : 10;
      let sessions = await getRecentSessions(limit);

      if (status && status !== "all") {
        sessions = sessions.filter((s) => s.status === status);
      }

      return {
        success: true,
        data: {
          count: sessions.length,
          sessions: sessions.map((s) => ({
            id: s.id,
            topicTitle: s.topicTitle,
            topicCategory: s.topicCategory,
            targetLevel: s.targetLevel,
            overallScore: s.overallScore,
            fluencyScore: s.fluencyScore,
            grammarScore: s.grammarScore,
            vocabularyScore: s.vocabularyScore,
            status: s.status,
            completedAt: s.completedAt,
          })),
        },
      };
    }

    case "get_english_session_detail": {
      const id = args.id as string;
      const [session] = await db
        .select()
        .from(aiEnglishSessions)
        .where(eq(aiEnglishSessions.id, id))
        .limit(1);

      if (!session) {
        return { success: false, error: `English practice session '${id}' not found.` };
      }

      return {
        success: true,
        data: session,
      };
    }

    case "delete_english_session": {
      const id = args.id as string;
      const [session] = await db
        .select({ topicTitle: aiEnglishSessions.topicTitle })
        .from(aiEnglishSessions)
        .where(eq(aiEnglishSessions.id, id))
        .limit(1);

      if (!session) {
        return { success: false, error: `English practice session '${id}' not found.` };
      }

      await deleteEnglishSessionAction(id);

      return {
        success: true,
        message: `English drill session '${session.topicTitle}' (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    case "list_english_vocabularies": {
      const status = args.masteryStatus as string | undefined;
      const category = args.category as string | undefined;
      const search = args.search as string | undefined;

      const vocabs = await getEnglishVocabularies(status, category, search);
      return {
        success: true,
        data: {
          count: vocabs.length,
          vocabularies: vocabs.slice(0, 25).map((v) => ({
            id: v.id,
            phrase: v.phrase,
            meaning: v.meaning,
            category: v.category,
            targetLevel: v.targetLevel,
            masteryStatus: v.masteryStatus,
            techContextExample: v.techContextExample,
            casualVsStaff: v.casualVsStaff,
          })),
        },
      };
    }

    case "save_english_vocabulary": {
      const created = await saveCustomVocab({
        phrase: String(args.phrase),
        meaning: String(args.meaning),
        category: (args.category as FluencyCategory) || "technical",
        targetLevel: (args.targetLevel as TargetLevel) || "A1-A2",
        techContextExample: String(args.techContextExample),
        casualVsStaff: args.casualVsStaff ? String(args.casualVsStaff) : undefined,
      });

      return {
        success: true,
        message: `English vocabulary card '${created.phrase}' saved successfully.`,
        data: created,
      };
    }

    case "toggle_english_vocab_mastery": {
      const id = args.id as string;
      const masteryStatus = args.masteryStatus as MasteryStatus;

      await toggleVocabMastery(id, masteryStatus);

      return {
        success: true,
        message: `Vocabulary (ID: ${id}) mastery status updated to '${masteryStatus}'.`,
      };
    }

    case "update_english_vocabulary": {
      const id = args.id as string;
      const [existing] = await db
        .select()
        .from(aiEnglishVocabularies)
        .where(eq(aiEnglishVocabularies.id, id))
        .limit(1);

      if (!existing) {
        return { success: false, error: `English vocabulary card with ID '${id}' not found.` };
      }

      const updateData: Record<string, unknown> = {};
      if (args.phrase) updateData.phrase = String(args.phrase).trim();
      if (args.meaning) updateData.meaning = String(args.meaning).trim();
      if (args.category) updateData.category = String(args.category).trim();
      if (args.targetLevel) updateData.targetLevel = String(args.targetLevel).trim();
      if (args.techContextExample) updateData.techContextExample = String(args.techContextExample).trim();
      if (args.casualVsStaff !== undefined)
        updateData.casualVsStaff = args.casualVsStaff ? String(args.casualVsStaff) : null;
      if (args.masteryStatus) updateData.masteryStatus = String(args.masteryStatus).trim();

      await db
        .update(aiEnglishVocabularies)
        .set(updateData)
        .where(eq(aiEnglishVocabularies.id, id));

      return {
        success: true,
        message: `English vocabulary card '${updateData.phrase || existing.phrase}' updated successfully.`,
        data: { id, ...updateData },
      };
    }

    case "delete_english_vocabulary": {
      const id = args.id as string;
      await deleteEnglishVocabAction(id);
      return {
        success: true,
        message: `English vocabulary card (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    case "get_english_curriculum_progress": {
      const tracks = await getCurriculumTracksWithProgress();
      return {
        success: true,
        data: tracks,
      };
    }

    case "reset_english_curriculum_progress": {
      const resetHabitAnalytics = args.resetHabitAnalytics !== false;
      const lessonId = args.lessonId as string | undefined;

      if (lessonId) {
        await db
          .delete(aiEnglishCurriculumProgress)
          .where(
            and(
              eq(aiEnglishCurriculumProgress.userId, "wisman-primary"),
              eq(aiEnglishCurriculumProgress.lessonId, lessonId)
            )
          );
      } else {
        await db
          .delete(aiEnglishCurriculumProgress)
          .where(eq(aiEnglishCurriculumProgress.userId, "wisman-primary"));
      }

      if (resetHabitAnalytics) {
        await db
          .update(aiEnglishStreaks)
          .set({
            currentStreak: 0,
            longestStreak: 0,
            totalSessions: 0,
            totalSpeakingMinutes: 0,
            masteredVocabCount: 0,
            lastActivityDate: null,
            updatedAt: new Date(),
          })
          .where(eq(aiEnglishStreaks.userId, "wisman-primary"));
      }

      revalidatePath("/cms/ai-english-fluency");

      return {
        success: true,
        message: lessonId
          ? `Curriculum progress for lesson '${lessonId}' has been reset successfully.`
          : `All curriculum roadmap progress and habit streak analytics have been reset to 0% initial state.`,
      };
    }

    case "get_recent_visitor_chats": {
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 25) : 10;
      const sessions = await db
        .select()
        .from(aiChatSessions)
        .orderBy(desc(aiChatSessions.updatedAt))
        .limit(limit);

      return {
        success: true,
        data: {
          count: sessions.length,
          sessions: sessions.map((s) => ({
            id: s.id,
            title: s.title,
            lastMessage: s.lastMessage,
            messageCount: s.messageCount,
            updatedAt: s.updatedAt,
          })),
        },
      };
    }

    case "get_ai_chat_session_detail": {
      const sessionId = args.sessionId as string;
      const details = await getAiChatSessionDetails(sessionId);
      if (!details) {
        return { success: false, error: `Visitor chat session '${sessionId}' not found.` };
      }
      return {
        success: true,
        data: details,
      };
    }

    case "delete_ai_chat_session": {
      const sessionId = args.sessionId as string;
      await deleteAiChatSession(sessionId);
      return {
        success: true,
        message: `Visitor chat session '${sessionId}' and all associated messages deleted successfully.`,
        data: { sessionId, deleted: true },
      };
    }

    default:
      return null;
  }
}
