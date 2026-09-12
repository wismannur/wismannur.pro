export type TargetLevel = "A1-A2" | "B1" | "B2" | "C1";

export type FluencyCategory =
  | "technical"
  | "workplace_idiom"
  | "collaboration"
  | "leadership"
  | "general";

export type MasteryStatus = "learning" | "mastered";

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface ExtractedVocab {
  phrase: string;
  phonetic?: string;
  meaning: string;
  category: FluencyCategory;
  targetLevel: TargetLevel;
  techContextExample: string;
  casualVsStaff?: string;
}

export interface AiEnglishSession {
  id: string;
  targetLevel: TargetLevel;
  topicTitle: string;
  topicCategory: string;
  knowledgeItemId: string | null;
  knowledgeSnippet: string | null;
  scenarioPrompt: string;
  sentenceStarters: string[];
  sampleModelAnswer: string | null;
  userSpeechTranscript: string | null;
  userAudioUrl: string | null;
  fluencyScore: number | null;
  grammarScore: number | null;
  vocabularyScore: number | null;
  overallScore: number | null;
  feedbackSummary: string | null;
  betterAlternative: string | null;
  pronunciationTips: string | null;
  grammarCorrections: GrammarCorrection[] | null;
  extractedVocabularies: ExtractedVocab[] | null;
  durationSeconds: number;
  status: "in_progress" | "completed";
  completedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface VocabExample {
  workplaceExample: string;
  casualVsStaff?: string;
  scenarioContext?: string;
}

export interface AiEnglishVocabulary {
  id: string;
  phrase: string;
  phonetic: string | null;
  meaning: string;
  category: FluencyCategory;
  targetLevel: TargetLevel;
  techContextExample: string;
  casualVsStaff: string | null;
  examples?: VocabExample[] | null;
  masteryStatus: MasteryStatus;
  timesPracticed: number;
  sourceSessionId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AiEnglishStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalSpeakingMinutes: number;
  masteredVocabCount: number;
  lastActivityDate: string | null;
  updatedAt: Date | string;
}

export interface SpeechEvaluationResult {
  overallScore: number;
  fluencyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  feedbackSummary: string;
  betterAlternative: string;
  pronunciationTips: string;
  grammarCorrections: GrammarCorrection[];
  extractedVocabularies: ExtractedVocab[];
}

export interface CefrMilestone {
  level: TargetLevel;
  title: string;
  description: string;
  targetSessions: number;
  targetScore: number;
  targetPhrases: number;
  targetMinutes: number;
  progressPercentage: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  sessionsCompleted: number;
  phrasesMastered: number;
  speakingMinutes: number;
  averageScore: number;
  remainingSessions: number;
  remainingPhrases: number;
  remainingMinutes: number;
  scoreGap: number;
  keyCompetencyBadge: string;
}

export interface EnglishAnalyticsReport {
  currentEstimatedLevel: TargetLevel;
  currentLevelPercentage: number;
  nextTargetLevel: TargetLevel | "MAX";
  totalCompletedSessions: number;
  totalSpeakingMinutes: number;
  masteredVocabCount: number;
  learningVocabCount: number;
  averageScores: {
    overall: number;
    fluency: number;
    grammar: number;
    vocabulary: number;
  };
  recentTrend: Array<{
    date: string;
    topic: string;
    score: number;
    fluency: number;
    grammar: number;
  }>;
  milestones: CefrMilestone[];
  diagnosticMessage: string;
}

// --------------------------------------------------------------------------
// GUIDED DEVELOPER CURRICULUM TRACKS (freeCodeCamp A2/B1 inspired)
// --------------------------------------------------------------------------

export type CurriculumTrackLevel = "A2" | "B1" | "B2";

export interface DialogueCharacter {
  name: string;
  role: string;
  avatarColor: string; // Tailwind color class e.g. "bg-blue-500"
  voice: string; // Google TTS voice
}

export interface DialogueTurn {
  id: string;
  speaker: string;
  role: string;
  text: string;
  audioUrl?: string | null;
  keyPhraseHighlight?: string;
  indonesianHint?: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  type: "cloze" | "multiple_choice" | "pragmatic_tone";
  question: string;
  sentenceWithBlank?: string; // For cloze test
  options: QuizOption[];
  explanation: string;
}

export interface SpokenRolePlayChallenge {
  scenario: string;
  characterName: string;
  characterRole: string;
  promptQuestion: string; // Question the character directs at Wisman
  sentenceStarters: string[];
  modelAnswer: string;
}

export interface CurriculumLesson {
  id: string;
  unitId: string;
  lessonNumber: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  targetSkills: string[];
  dialogue: DialogueTurn[];
  quiz: QuizQuestion[];
  rolePlay: SpokenRolePlayChallenge;
  isCompleted?: boolean;
  userQuizScore?: number | null;
  userSpokenScore?: number | null;
  userSpokenTranscript?: string | null;
  userStaffUpgradeFeedback?: string | null;
}

export interface CurriculumUnit {
  id: string;
  trackLevel: CurriculumTrackLevel;
  unitNumber: number;
  title: string;
  description: string;
  badge: string;
  lessons: CurriculumLesson[];
}

export interface CurriculumTrack {
  level: CurriculumTrackLevel;
  title: string;
  description: string;
  cefrBadge: string;
  estimatedTime: string;
  units: CurriculumUnit[];
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

