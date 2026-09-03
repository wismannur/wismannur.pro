import type { AiKnowledgeItemRow } from "@/db/schema";

export type AiKnowledgeItem = AiKnowledgeItemRow;

export interface NewAiKnowledgeItem {
  category: string;
  title: string;
  content: string;
  tags?: string[];
  isPublished?: boolean;
  sortOrder?: number;
}

export type UpdateAiKnowledgeItem = Partial<NewAiKnowledgeItem>;

export const AI_KNOWLEDGE_CATEGORIES = [
  { value: "hiring", label: "Hiring & Engagement", description: "Contract types, timezone overlap, notice period, rate expectations" },
  { value: "technical", label: "Technical & Architecture", description: "System design, tech stack mastery, performance, devops" },
  { value: "philosophy", label: "Engineering Philosophy", description: "Clean code, testing strategies, mentoring, problem-solving mindset" },
  { value: "screening", label: "Recruiter FAQs & Screening", description: "Direct answers to common recruiter and client screening questions" },
  { value: "projects", label: "Project Deep Dives", description: "Complex challenges, business impact metrics, and trade-offs" },
  { value: "general", label: "General & Personal", description: "Background, language fluency, work equipment, personal values" },
] as const;
