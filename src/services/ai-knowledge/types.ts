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
  { value: "career-impact", label: "Career Impact & Real Metrics", description: "Quantifiable outcomes, system scale, performance boosts, cost savings, and team leadership" },
  { value: "tech-opinions", label: "Architecture & Tech Opinions", description: "Strong opinions on frameworks, patterns, trade-offs (e.g. Next.js, AI agents, microservices)" },
  { value: "case-studies", label: "Project & Incident Case Studies", description: "Deep-dives into hard engineering challenges, outages resolved, and mission-critical migrations" },
  { value: "writing-voice", label: "Persona & Writing Voice", description: "Writing tone, technical vocabulary, communication style for blogs, proposals, and cover letters" },
  { value: "technical", label: "Technical & Architecture", description: "System design, tech stack mastery, performance optimization, and devops" },
  { value: "philosophy", label: "Engineering Philosophy", description: "Clean code, testing strategies, mentoring, and pragmatic problem-solving mindset" },
  { value: "screening", label: "Recruiter FAQs & Screening", description: "Direct answers to common recruiter, client, and executive screening questions" },
  { value: "projects", label: "Project Deep Dives", description: "Complex challenges, business impact metrics, architecture, and technology trade-offs" },
  { value: "hiring", label: "Hiring & Engagement", description: "Contract types, timezone overlap, notice period, rate expectations, and collaboration terms" },
  { value: "general", label: "General & Personal", description: "Background, language fluency, work equipment, personal values, and origin story" },
] as const;
