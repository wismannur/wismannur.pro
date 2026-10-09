import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { generateEntityId } from "@/lib/id-generator";
import type { FrontendMasteryEvaluation } from "@/services/frontend-mastery/types";
import { jobApplications } from "./career";

export const aiKnowledgeItems = pgTable("ai_knowledge_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull().default("general"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  visitorId: text("visitor_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  title: text("title").notNull().default("New Conversation"),
  messageCount: integer("message_count").notNull().default(0),
  lastMessage: text("last_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const aiChatMessages = pgTable("ai_chat_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => aiChatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  toolCallName: text("tool_call_name"),
  toolCallArgs: jsonb("tool_call_args"),
  toolCallResult: jsonb("tool_call_result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cmsCopilotSessions = pgTable("cms_copilot_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull().default("New Session"),
  currentPath: text("current_path"),
  lastMessage: text("last_message"),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const cmsCopilotMessages = pgTable("cms_copilot_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => cmsCopilotSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls"),
  toolResults: jsonb("tool_results"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiEnglishSessions = pgTable("ai_english_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  targetLevel: text("target_level").notNull().default("A1-A2"),
  topicTitle: text("topic_title").notNull(),
  topicCategory: text("topic_category").notNull().default("technical"),
  knowledgeItemId: text("knowledge_item_id").references(() => aiKnowledgeItems.id, {
    onDelete: "set null",
  }),
  knowledgeSnippet: text("knowledge_snippet"),
  scenarioPrompt: text("scenario_prompt").notNull(),
  sentenceStarters: text("sentence_starters")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  sampleModelAnswer: text("sample_model_answer"),
  userSpeechTranscript: text("user_speech_transcript"),
  userAudioUrl: text("user_audio_url"),
  fluencyScore: integer("fluency_score"),
  grammarScore: integer("grammar_score"),
  vocabularyScore: integer("vocabulary_score"),
  overallScore: integer("overall_score"),
  feedbackSummary: text("feedback_summary"),
  betterAlternative: text("better_alternative"),
  pronunciationTips: text("pronunciation_tips"),
  grammarCorrections: jsonb("grammar_corrections"),
  extractedVocabularies: jsonb("extracted_vocabularies"),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  status: text("status").notNull().default("in_progress"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const aiEnglishVocabularies = pgTable("ai_english_vocabularies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  phrase: text("phrase").notNull(),
  phonetic: text("phonetic"),
  meaning: text("meaning").notNull(),
  category: text("category").notNull().default("technical"),
  targetLevel: text("target_level").notNull().default("A1-A2"),
  techContextExample: text("tech_context_example").notNull(),
  casualVsStaff: text("casual_vs_staff"),
  examples: jsonb("examples"),
  masteryStatus: text("mastery_status").notNull().default("learning"),
  timesPracticed: integer("times_practiced").notNull().default(0),
  sourceSessionId: text("source_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const aiEnglishStreaks = pgTable("ai_english_streaks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().default("wisman-primary"),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  totalSpeakingMinutes: integer("total_speaking_minutes").notNull().default(0),
  masteredVocabCount: integer("mastered_vocab_count").notNull().default(0),
  lastActivityDate: text("last_activity_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const aiEnglishCurriculumProgress = pgTable("ai_english_curriculum_progress", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().default("wisman-primary"),
  trackLevel: text("track_level").notNull(), // "A2" | "B1" | "B2"
  unitId: text("unit_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  quizScore: integer("quiz_score"),
  spokenTranscript: text("spoken_transcript"),
  spokenScore: integer("spoken_score"),
  staffUpgradeFeedback: text("staff_upgrade_feedback"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const frontendMasterySessions = pgTable(
  "frontend_mastery_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateEntityId("fms")),
    pillar: text("pillar").notNull(),
    topicId: text("topic_id").notNull(),
    topicTitle: text("topic_title").notNull(),
    difficulty: text("difficulty").notNull().default("senior"),
    questionPrompt: text("question_prompt").notNull(),
    starterCode: text("starter_code"),
    hints: jsonb("hints").$type<string[]>(),
    userSubmission: text("user_submission"),
    evaluationResult: jsonb("evaluation_result").$type<FrontendMasteryEvaluation>(),
    score: integer("score"),
    status: text("status").notNull().default("in_progress"),
    timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
    jobApplicationId: text("job_application_id").references(() => jobApplications.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("frontend_mastery_sessions_topic_id_idx").on(table.topicId),
    index("frontend_mastery_sessions_pillar_idx").on(table.pillar),
    index("frontend_mastery_sessions_status_idx").on(table.status),
    index("frontend_mastery_sessions_job_app_id_idx").on(table.jobApplicationId),
    index("frontend_mastery_sessions_created_at_idx").on(table.createdAt),
  ]
);

export const frontendMasteryProgress = pgTable(
  "frontend_mastery_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateEntityId("fmp")),
    topicId: text("topic_id").notNull().unique(),
    pillar: text("pillar").notNull(),
    topicTitle: text("topic_title").notNull(),
    masteryStatus: text("mastery_status").notNull().default("not_started"),
    attemptsCount: integer("attempts_count").notNull().default(0),
    bestScore: integer("best_score").default(0),
    lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("frontend_mastery_progress_pillar_idx").on(table.pillar),
    index("frontend_mastery_progress_status_idx").on(table.masteryStatus),
  ]
);

export type AiKnowledgeItemRow = typeof aiKnowledgeItems.$inferSelect;
export type AiChatSessionRow = typeof aiChatSessions.$inferSelect;
export type AiChatMessageRow = typeof aiChatMessages.$inferSelect;
export type CmsCopilotSessionRow = typeof cmsCopilotSessions.$inferSelect;
export type CmsCopilotMessageRow = typeof cmsCopilotMessages.$inferSelect;
export type AiEnglishSessionRow = typeof aiEnglishSessions.$inferSelect;
export type AiEnglishVocabularyRow = typeof aiEnglishVocabularies.$inferSelect;
export type AiEnglishStreakRow = typeof aiEnglishStreaks.$inferSelect;
export type AiEnglishCurriculumProgressRow = typeof aiEnglishCurriculumProgress.$inferSelect;
export type FrontendMasterySessionRow = typeof frontendMasterySessions.$inferSelect;
export type FrontendMasteryProgressRow = typeof frontendMasteryProgress.$inferSelect;
