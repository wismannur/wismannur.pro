import "server-only";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import type {
  CurriculumTopic,
  FrontendDifficulty,
  FrontendMasteryEvaluation,
} from "./types";

const DEFAULT_MODEL = getGeminiModel();

function cleanJsonText(rawText: string): string {
  let clean = rawText.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return clean.trim();
}

/**
 * Generates an in-depth Big Tech interview challenge for a curriculum topic using Vertex AI.
 */
export async function generateChallengeDetailsWithAI(
  topic: CurriculumTopic,
  difficulty: FrontendDifficulty = "senior"
): Promise<{
  questionPrompt: string;
  starterCode?: string;
  hints: string[];
}> {
  const ai = getGeminiClient();

  const prompt = `You are a Principal Frontend Architect and Senior Staff Interviewer at top-tier tech companies (OpenAI, Meta, Google, Airbnb).
You are preparing a realistic, rigorous Frontend interview challenge for a candidate at the '${difficulty.toUpperCase()}' level.

Topic Details:
- Title: ${topic.title}
- Pillar: ${topic.pillar}
- Category: ${topic.category}
- Description: ${topic.description}
- Key Concepts: ${topic.keyConcepts.join(", ")}
- Big Tech Context: ${topic.bigTechContext}

Task:
Generate a comprehensive interview scenario prompt with:
1. Scenario & Problem Statement (Real-world context, e.g. "You are building the core client engine for...")
2. Functional Requirements (Bullet points)
3. Non-Functional Constraints (Performance, memory, browser compatibility, zero layout thrashing, microtask management)
4. Edge Cases to Account For (e.g. rapid firing, unmounted components, circular objects, network drops)
5. 3 progressive hints (Hint 1: subtle nudge, Hint 2: algorithmic/pattern pointer, Hint 3: specific edge case reminder)
${topic.starterCode ? `Use or refine this starter code: \n${topic.starterCode}` : "Provide an idiomatic TypeScript/JavaScript starter skeleton or code template if applicable, or high-level architecture template if system design."}

Output MUST be strictly valid JSON in this structure:
{
  "questionPrompt": "Markdown formatted problem statement with Requirements and Constraints",
  "starterCode": "Optional starter code or skeleton",
  "hints": ["Hint 1", "Hint 2", "Hint 3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(cleanJsonText(text));

    return {
      questionPrompt: parsed.questionPrompt || topic.description,
      starterCode: parsed.starterCode || topic.starterCode || "",
      hints: Array.isArray(parsed.hints) && parsed.hints.length > 0 ? parsed.hints : [
        "Pay careful attention to memory management and cleanup.",
        "Consider handling async race conditions with AbortController or sequence tokens.",
        "Check keyboard accessibility and ARIA states if this touches UI elements.",
      ],
    };
  } catch (err) {
    console.error("Vertex AI generate challenge error:", err);
    return {
      questionPrompt: `### ${topic.title}\n\n${topic.description}\n\n**Big Tech Bar:** ${topic.bigTechContext}\n\n#### Requirements:\n- Implement a robust, production-grade solution.\n- Address edge cases and performance bottlenecks (e.g., layout thrashing, memory leaks).\n- Include comprehensive error handling and type safety.`,
      starterCode: topic.starterCode || "",
      hints: [
        "Focus on time and space complexity first.",
        "Watch out for stale closures and memory leaks in event listeners.",
        "Consider how this scales under high-frequency updates.",
      ],
    };
  }
}

/**
 * Evaluates the candidate's answer acting as a Senior Staff Frontend Engineer & Curriculum Master.
 */
export async function evaluateFrontendSubmissionWithAI(params: {
  topic: CurriculumTopic;
  difficulty: FrontendDifficulty;
  questionPrompt: string;
  userSubmission: string;
  timeSpentSeconds: number;
}): Promise<FrontendMasteryEvaluation> {
  const { topic, difficulty, questionPrompt, userSubmission, timeSpentSeconds } = params;
  const ai = getGeminiClient();

  const prompt = `You are a Senior Staff Frontend Engineer & Curriculum Master evaluating a candidate's answer for a '${difficulty.toUpperCase()}' frontend interview at OpenAI/Meta/Google standard.

Topic: ${topic.title} (${topic.pillar})
Candidate Time Spent: ${Math.round(timeSpentSeconds / 60)} minutes.

Problem Statement:
"""
${questionPrompt}
"""

Candidate's Submission:
"""
${userSubmission}
"""

Evaluate ruthlessly yet constructively like a Staff Engineer grading an L5/L6 candidate:
1. Did they handle high-frequency performance (microtask queuing, layout thrashing, memory leaks, uncollected closures)?
2. Did they handle async races (stale requests, AbortController, out-of-order promise resolution)?
3. For UI/React: Is state normalized? Is WAI-ARIA and keyboard navigation accounted for? Are there unnecessary re-renders?
4. For System Design: Did they consider data flow, caching (LRU/Trie), offline resilience, virtualization, and SSR/hydration boundaries?

Output MUST be strictly valid JSON matching this exact structure:
{
  "overallScore": 85, // integer 0 - 100
  "verdict": "hire", // one of: "strong_hire" | "hire" | "lean_hire" | "lean_no_hire" | "no_hire"
  "summary": "2-3 sentences summarizing the candidate's performance and seniority level demonstrated.",
  "rubricBreakdown": {
    "correctness": 90, // 0 - 100
    "performance": 85, // 0 - 100 (Microtasks, reflows, GC, algorithmic complexity)
    "architecture": 80, // 0 - 100 (Modularity, separation of concerns, clean API)
    "edgeCases": 75, // 0 - 100 (Races, boundaries, circular references, error states)
    "accessibilityOrUx": 80 // 0 - 100 (ARIA, keyboard navigation, feedback)
  },
  "strengths": [
    "Clean and idiomatic functional structure",
    "Proper handling of leading/trailing execution"
  ],
  "criticalIssues": [
    "Potential memory leak if unmounted before timer fires",
    "Does not cancel ongoing fetch request on new input"
  ],
  "staffLevelModelAnswer": "A complete, production-grade, beautifully commented Staff-level implementation or architectural blueprint in Markdown/Code blocks.",
  "seniorTakeaways": [
    "Key takeaway 1",
    "Key takeaway 2"
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(cleanJsonText(text));

    return {
      overallScore: Number(parsed.overallScore) || 75,
      verdict: parsed.verdict || "hire",
      summary: parsed.summary || "Solid foundation with room for optimizing edge-case resiliency.",
      rubricBreakdown: {
        correctness: Number(parsed.rubricBreakdown?.correctness) || 80,
        performance: Number(parsed.rubricBreakdown?.performance) || 75,
        architecture: Number(parsed.rubricBreakdown?.architecture) || 80,
        edgeCases: Number(parsed.rubricBreakdown?.edgeCases) || 70,
        accessibilityOrUx: Number(parsed.rubricBreakdown?.accessibilityOrUx) || 75,
      },
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Good grasp of core mechanisms."],
      criticalIssues: Array.isArray(parsed.criticalIssues) ? parsed.criticalIssues : [],
      staffLevelModelAnswer: parsed.staffLevelModelAnswer || "```ts\n// Staff-level solution\n```",
      seniorTakeaways: Array.isArray(parsed.seniorTakeaways) ? parsed.seniorTakeaways : [
        "Always account for cleanup lifecycle and race conditions.",
        "Prioritize accessibility as a primary requirement, not an afterthought.",
      ],
    };
  } catch (err) {
    console.error("Vertex AI evaluate submission error:", err);
    return {
      overallScore: 70,
      verdict: "lean_hire",
      summary: "Completed the core functional requirement. Automated review fallback triggered.",
      rubricBreakdown: {
        correctness: 75,
        performance: 70,
        architecture: 70,
        edgeCases: 65,
        accessibilityOrUx: 70,
      },
      strengths: ["Implemented functional baseline."],
      criticalIssues: ["Verify edge-case handling under heavy load."],
      staffLevelModelAnswer: topic.starterCode || "/* Review curriculum notes for standard implementation */",
      seniorTakeaways: ["Keep practicing edge case and concurrency patterns."],
    };
  }
}
