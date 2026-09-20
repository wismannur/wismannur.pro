export type FrontendPillar = "concepts" | "javascript" | "react" | "system_design";

export type FrontendDifficulty = "mid" | "senior" | "staff";

export type FrontendVerdict =
  | "strong_hire"
  | "hire"
  | "lean_hire"
  | "lean_no_hire"
  | "no_hire";

export interface RubricBreakdown {
  correctness: number; // 0 - 100
  performance: number; // 0 - 100 (Layout thrashing, microtasks, memoization, event loop)
  architecture: number; // 0 - 100 (Clean separation, maintainability, type-safety)
  edgeCases: number; // 0 - 100 (Async races, boundary values, network latency, null safety)
  accessibilityOrUx: number; // 0 - 100 (ARIA, keyboard navigation, smooth UX, visual feedback)
}

export interface FrontendMasteryEvaluation {
  overallScore: number;
  verdict: FrontendVerdict;
  summary: string;
  rubricBreakdown: RubricBreakdown;
  strengths: string[];
  criticalIssues: string[];
  staffLevelModelAnswer: string;
  seniorTakeaways: string[];
}

export interface FrontendMasterySession {
  id: string;
  pillar: FrontendPillar;
  topicId: string;
  topicTitle: string;
  difficulty: FrontendDifficulty;
  questionPrompt: string;
  starterCode?: string | null;
  hints?: string[] | null;
  userSubmission?: string | null;
  evaluationResult?: FrontendMasteryEvaluation | null;
  score?: number | null;
  status: "in_progress" | "completed";
  timeSpentSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FrontendMasteryProgressItem {
  id: string;
  topicId: string;
  pillar: FrontendPillar;
  topicTitle: string;
  masteryStatus: "not_started" | "practicing" | "mastered";
  attemptsCount: number;
  bestScore: number | null;
  lastCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurriculumTopic {
  id: string;
  pillar: FrontendPillar;
  title: string;
  category: string;
  description: string;
  difficulty: FrontendDifficulty;
  keyConcepts: string[];
  starterCode?: string;
  referenceUrl?: string;
  bigTechContext: string;
}

export interface PillarMetadata {
  pillar: FrontendPillar;
  title: string;
  shortDesc: string;
  iconName: string;
  badgeColor: string;
  topicsCount: number;
}
