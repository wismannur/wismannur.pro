import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import type {
  AtsAnalysis,
  CompanyIntelligence,
  InboundReachoutReplyDraft,
  InterviewPrepResult,
  MockInterviewAnswerEvaluation,
  ParsedInterviewInvitation,
  ParsedJobPosting,
  RejectionDiagnosticResult,
  TailoredBullet,
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
 * Parses raw text or scraped content from a job vacancy URL into structured job details.
 */
export async function parseJobPostingWithGemini(rawContent: string): Promise<ParsedJobPosting> {
  const ai = getGeminiClient();

  let contentToParse = rawContent;

  // If rawContent looks like pure URL and short, attempt lightweight fetch
  const urlMatch = rawContent.match(/https?:\/\/[^\s]+/);
  if (urlMatch && rawContent.length < 300) {
    try {
      const res = await fetch(urlMatch[0], {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const html = await res.text();
        // Strip HTML tags roughly for token efficiency
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (cleanText.length > 100) {
          contentToParse = `Source URL: ${urlMatch[0]}\n\nExtracted Web Content:\n${cleanText.slice(0, 12000)}`;
        }
      }
    } catch {
      // Fallback to original text if fetch times out or fails (e.g. auth-wall)
    }
  }

  const prompt = `You are an expert tech recruiter and ATS parsing assistant.
Extract and structure the following job posting details into clean JSON.
If a field is not explicitly mentioned, provide a reasonable inference or leave it undefined.

Raw Job Content / URL Text:
"""
${contentToParse.slice(0, 15000)}
"""

Return a JSON object conforming strictly to this format:
{
  "companyName": "string",
  "jobTitle": "string",
  "platform": "linkedin" | "jobstreet" | "glints" | "techinasia" | "indeed" | "company_website" | "referral" | "other",
  "location": "string (e.g. Jakarta, Indonesia or Remote)",
  "workplaceType": "remote" | "hybrid" | "onsite",
  "jobType": "full_time" | "contract" | "part_time" | "freelance" | "internship",
  "salaryMin": number | null,
  "salaryMax": number | null,
  "salaryCurrency": "string (default 'IDR')",
  "salaryPeriod": "monthly" | "yearly" | "hourly",
  "jobDescriptionRaw": "string (concise formatted markdown summary of the job description)",
  "requirements": ["array of requirement bullet points"],
  "contactName": "string or null",
  "contactEmail": "string or null",
  "companyWebsite": "string or null"
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No response received from Gemini AI model.");
  }

  try {
    const parsed = JSON.parse(cleanJsonText(responseText)) as ParsedJobPosting;
    return {
      ...parsed,
      platform: parsed.platform || "linkedin",
      workplaceType: parsed.workplaceType || "remote",
      jobType: parsed.jobType || "full_time",
      salaryCurrency: parsed.salaryCurrency || "IDR",
      salaryPeriod: parsed.salaryPeriod || "monthly",
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
    };
  } catch (err) {
    console.error("Failed to parse Gemini job posting JSON:", responseText, err);
    throw new Error("Failed to parse job vacancy details from AI response.");
  }
}

/**
 * Analyzes candidate's master CV and skills against a specific Job Description.
 * Calculates ATS match score, keyword gaps, tailored summary, customized bullets (XYZ formula), and cover letter.
 */
export async function analyzeResumeMatchWithGemini(params: {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  requirements: string[];
  masterResume: {
    experiences: { title: string; organization: string; description: string; period?: string }[];
    education: { title: string; organization: string; description: string }[];
  };
  skills: { name: string; category?: string }[];
}): Promise<{
  atsAnalysis: AtsAnalysis;
  tailoredSummary: string;
  tailoredBulletPoints: TailoredBullet[];
  coverLetter: string;
}> {
  const ai = getGeminiClient();

  const resumeContext = JSON.stringify(
    {
      experiences: params.masterResume.experiences,
      education: params.masterResume.education,
      skills: params.skills.map((s) => s.name),
    },
    null,
    2
  );

  const prompt = `You are a senior hiring manager and ATS optimization specialist.
Analyze the candidate's real profile against the target job posting.

Target Job:
- Title: ${params.jobTitle}
- Company: ${params.companyName}
- Requirements & JD:
${params.jobDescription}
${params.requirements.join("\n- ")}

Candidate's Real Master Profile:
${resumeContext}

Tasks:
1. ATS Score (0 to 100) based on role suitability, technology stack alignment, and experience level.
2. Match strengths (key areas where the candidate strongly matches).
3. Missing keywords / skills gaps that the job requires but are absent or weak in the candidate's profile.
4. Actionable recommendations for the application.
5. Tailored Professional Summary highlighting the most relevant accomplishments for this specific role.
6. Tailored Experience Bullet Points using the XYZ Formula ("Accomplished [X] as measured by [Y], by doing [Z]") adapted from the candidate's real experience.
7. High-impact, concise Cover Letter / Cold outreach message addressed to the hiring team.

Return a JSON object conforming strictly to this format:
{
  "atsAnalysis": {
    "score": number,
    "matchStrengths": ["string"],
    "missingKeywords": ["string"],
    "recommendations": ["string"],
    "summaryFeedback": "string"
  },
  "tailoredSummary": "string",
  "tailoredBulletPoints": [
    {
      "roleContext": "string (e.g. at Previous Company)",
      "tailored": "string (XYZ bullet point)",
      "rationale": "string"
    }
  ],
  "coverLetter": "string"
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Failed to generate resume analysis from Gemini AI.");
  }

  try {
    return JSON.parse(cleanJsonText(responseText));
  } catch (err) {
    console.error("Failed to parse Gemini resume analysis JSON:", responseText, err);
    throw new Error("Failed to parse resume match analysis from AI response.");
  }
}

/**
 * Extracts interview invitation details (schedule, meeting link, format, interviewers).
 */
export async function parseInterviewInvitationWithGemini(
  invitationText: string
): Promise<ParsedInterviewInvitation> {
  const ai = getGeminiClient();

  const prompt = `You are an AI career assistant.
Parse the following recruiter email or interview invitation chat and extract all key logistical details.

Invitation Text:
"""
${invitationText}
"""

Return a JSON object conforming strictly to this format:
{
  "stageType": "hr_screening" | "technical_interview" | "live_coding" | "take_home_test" | "user_interview" | "system_design" | "final_leadership" | "offering_discussion" | "other",
  "title": "string (e.g. Technical Interview with Engineering Lead)",
  "scheduledAt": "ISO date-time string if found, otherwise null",
  "interviewers": "string or null",
  "meetingLink": "string (Google Meet/Zoom/Teams link) or null",
  "aiSummary": "string (Concise summary of what the interview entails and how to prepare)",
  "keyFocusAreas": ["array of key topics or competencies mentioned"]
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Failed to parse interview invitation.");
  }

  try {
    const parsed = JSON.parse(cleanJsonText(responseText));
    return {
      ...parsed,
      stageType: parsed.stageType || "hr_screening",
      title: parsed.title || "Interview Session",
      keyFocusAreas: Array.isArray(parsed.keyFocusAreas) ? parsed.keyFocusAreas : [],
    };
  } catch (err) {
    console.error("Failed to parse Gemini interview invite JSON:", responseText, err);
    throw new Error("Failed to parse interview invitation details from AI response.");
  }
}

/**
 * Generates an interview cheat sheet, predicted questions with model STAR answers, and questions to ask the interviewer.
 */
export async function generateInterviewPrepWithGemini(params: {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  stageType: string;
  masterResume: unknown;
}): Promise<InterviewPrepResult> {
  const ai = getGeminiClient();

  const prompt = `You are an executive interview coach.
Generate a comprehensive interview preparation simulator and cheat sheet for this upcoming interview.

Target Role: ${params.jobTitle} at ${params.companyName}
Interview Stage: ${params.stageType}
Job Description:
${params.jobDescription}

Candidate Profile:
${JSON.stringify(params.masterResume, null, 2)}

Tasks:
1. Provide a stage summary and key strategic advice for this particular stage.
2. Predict 6-8 likely interview questions spanning:
   - Behavioral (STAR method)
   - Technical / Stack-specific deep dives
   - System design / Architecture / Problem-solving
   - Role-fit & culture
   For each question, provide:
   - Category ("behavioral" | "technical" | "system_design" | "role_fit" | "culture")
   - Strategic tip on what the interviewer is evaluating
   - Tailored sample answer rooted in the candidate's real experience.
3. 4-5 smart, high-value questions the candidate should ask the interviewer.
4. Technical checklist of concepts/topics to review before this interview.

Return a JSON object conforming strictly to this format:
{
  "stageSummary": "string",
  "questions": [
    {
      "question": "string",
      "category": "behavioral" | "technical" | "system_design" | "role_fit" | "culture",
      "tip": "string",
      "sampleAnswer": "string"
    }
  ],
  "questionsToAskInterviewer": ["string"],
  "technicalChecklist": ["string"]
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Failed to generate interview preparation.");
  }

  try {
    return JSON.parse(cleanJsonText(responseText));
  } catch (err) {
    console.error("Failed to parse Gemini interview prep JSON:", responseText, err);
    throw new Error("Failed to generate interview preparation questions.");
  }
}

/**
 * Evaluates a candidate's mock interview response in real-time.
 * Gives a 1-10 score, constructive critique, STAR method breakdown, and an upgraded high-impact sample answer.
 */
export async function evaluateMockInterviewAnswerWithGemini(params: {
  jobTitle: string;
  companyName: string;
  stageType: string;
  question: string;
  category: string;
  userAnswer: string;
}): Promise<MockInterviewAnswerEvaluation> {
  const ai = getGeminiClient();

  const prompt = `You are a strict, constructive Tech & Executive Hiring Director at ${params.companyName}.
Evaluate the candidate's answer for the following interview question for the role of ${params.jobTitle} (${params.stageType} stage).

Interview Question:
"${params.question}" (Category: ${params.category})

Candidate's Answer:
"""
${params.userAnswer}
"""

Evaluation Criteria:
1. Score from 1 to 10 (10 = world-class, 7-8 = solid hiring bar, <6 = weak or missing specifics).
2. Verdict: "excellent" (9-10), "good" (7-8), "needs_improvement" (5-6), or "poor" (1-4).
3. Strengths: 2-3 specific positive aspects of their response (e.g., clear metrics, ownership, structured communication).
4. Improvements: 2-3 specific critique points (e.g., missing business impact, vague technical trade-offs, lack of STAR format).
5. If behavioral, analyze STAR breakdown (Situation, Task, Action, Result).
6. Refined Answer: A polished, high-signal model response demonstrating how a senior engineer would answer this concisely.
7. Follow-Up Question: A natural, probing follow-up question the interviewer would ask next.

Return a JSON object conforming strictly to this format:
{
  "score": number,
  "verdict": "excellent" | "good" | "needs_improvement" | "poor",
  "strengths": ["string"],
  "improvements": ["string"],
  "starBreakdown": {
    "situation": "string",
    "task": "string",
    "action": "string",
    "result": "string"
  },
  "refinedAnswer": "string",
  "followUpQuestion": "string"
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No response received from Gemini evaluator.");
  }

  try {
    return JSON.parse(cleanJsonText(responseText)) as MockInterviewAnswerEvaluation;
  } catch (err) {
    console.error("Failed to parse mock interview evaluation JSON:", responseText, err);
    throw new Error("Failed to parse mock interview evaluation.");
  }
}

/**
 * Diagnoses an application rejection or failed interview stage.
 * Generates root cause analysis, skill gap remediation checklist, and a graceful relationship-building closure email.
 */
export async function diagnoseRejectionWithGemini(params: {
  jobTitle: string;
  companyName: string;
  stageFailedAt: string;
  primaryReason: string;
  recruiterFeedback?: string;
  lessonsLearned?: string;
}): Promise<RejectionDiagnosticResult> {
  const ai = getGeminiClient();

  const prompt = `You are a compassionate yet highly strategic Executive Career Coach.
A candidate has experienced a rejection for the following application:

Role: ${params.jobTitle} at ${params.companyName}
Final Stage Reached: ${params.stageFailedAt}
Primary Stated Reason: ${params.primaryReason}
Recruiter / Interviewer Feedback: ${params.recruiterFeedback || "None provided"}
Candidate's Own Reflection: ${params.lessonsLearned || "None provided"}

Tasks:
1. Root Cause Analysis (RCA): Provide an objective, insightful breakdown of why this outcome likely occurred without sugarcoating or demoralizing the candidate.
2. Skill Gaps: 2-3 specific technical or behavioral concepts that were likely missing or could be sharpened.
3. Remediation Plan: 3-4 concrete, actionable steps the candidate should take before their next interview (e.g. specific system design patterns, STAR story adjustments, or code challenge prep).
4. Graceful Closure Email: Write a warm, memorable, and ultra-professional response to the recruiter / hiring manager expressing gratitude, asking to stay in their talent bench for future senior openings, and connecting on LinkedIn.
5. Suggested Next Focus: A 1-sentence strategic mantra / priority for their upcoming applications.

Return a JSON object conforming strictly to this format:
{
  "rootCauseAnalysis": "string",
  "skillGaps": ["string"],
  "remediationPlan": ["string"],
  "gracefulClosureEmail": {
    "subject": "string",
    "body": "string"
  },
  "suggestedNextFocus": "string"
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No response received from Gemini diagnostic.");
  }

  try {
    return JSON.parse(cleanJsonText(responseText)) as RejectionDiagnosticResult;
  } catch (err) {
    console.error("Failed to parse rejection diagnostic JSON:", responseText, err);
    throw new Error("Failed to parse rejection diagnostic.");
  }
}

/**
 * Enriches company intelligence with business model, tech stack detection, reputation, and talking points.
 */
export async function enrichCompanyIntelligenceWithGemini(params: {
  companyName: string;
  companyWebsite?: string;
  jobTitle?: string;
  location?: string;
  jobDescriptionRaw?: string;
}): Promise<CompanyIntelligence> {
  const ai = getGeminiClient();

  const prompt = `You are an elite executive tech recruiter and corporate intelligence researcher.
Analyze the following company and generate a high-value "Company Intelligence & Reputation Dossier" for a senior candidate preparing for high-stakes interviews.

Target Company: ${params.companyName}
Website: ${params.companyWebsite || "Not provided"}
Job Role: ${params.jobTitle || "Senior Software Engineer"}
Location / HQ: ${params.location || "Not specified"}
Job Context:
"""
${(params.jobDescriptionRaw || "").slice(0, 4000)}
"""

Tasks:
1. Business Model: Describe their core revenue/business model clearly in 1-2 punchy sentences (e.g. "Omnichannel B2C Retail combining large-scale e-commerce with physical showroom experiences").
2. Core Offerings: Array of 3-5 primary product or service categories they sell or specialize in.
3. Detected Tech Stack: Array of 4-7 modern frontend, backend, or cloud technologies they likely use or look for based on company scale and industry (e.g. "Vue.js / Nuxt 4", "Tailwind CSS", "TypeScript", "SSR / Edge Caching", "PostgreSQL").
4. Reputation: Provide estimated or publicly known Trustpilot / Glassdoor benchmarks if applicable (e.g. Trustpilot score ~4.6/5 with high customer satisfaction, or Glassdoor rating ~4.2). If exact numbers are unknown, provide realistic estimated indicators and a short reputation note.
5. Strategic Talking Points: 3 actionable, highly impressive "cheat-sheet" talking points the candidate can naturally mention during the interview to demonstrate deep company understanding (e.g. referencing customer trust, high-ticket catalog challenges, or architectural scalability).
6. Headquarters & Timezone: Infer the headquarters country, city, and primary IANA timezone (e.g. "Europe/Amsterdam", "America/New_York", "Europe/London", "Asia/Jakarta").

Return a JSON object conforming strictly to this format:
{
  "businessModel": "string",
  "coreOfferings": ["string"],
  "detectedTechStack": ["string"],
  "reputation": {
    "trustpilotScore": number | null,
    "trustpilotReviewsCount": number | null,
    "trustpilotUrl": "string | null",
    "glassdoorScore": number | null,
    "ratingLabel": "string (e.g. Excellent / High Trust)",
    "notes": "string"
  },
  "strategicTalkingPoints": ["string"],
  "headquartersCountry": "string",
  "headquartersCity": "string",
  "timezone": "string (IANA timezone, e.g. Europe/Amsterdam)"
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No response received from Gemini company intelligence enrichment.");
  }

  try {
    return JSON.parse(cleanJsonText(responseText)) as CompanyIntelligence;
  } catch (err) {
    console.error("Failed to parse company intelligence JSON:", responseText, err);
    throw new Error("Failed to parse company intelligence.");
  }
}

/**
 * Generates high-converting tailored reply options to a recruiter inbound reachout / InMail.
 */
export async function generateInboundReachoutReplyWithGemini(params: {
  recruiterMessage: string;
  recruiterName?: string;
  recruiterRole?: string;
  companyName: string;
  jobTitle: string;
  candidateHighlights?: string[];
}): Promise<{
  keyInsights: string[];
  replyDrafts: InboundReachoutReplyDraft[];
}> {
  const ai = getGeminiClient();

  const prompt = `You are an elite career strategist and negotiation advisor for top 1% software engineers.
A recruiter or hiring manager reached out to the candidate with an exciting opportunity.

Company: ${params.companyName}
Target Role: ${params.jobTitle}
Recruiter Name: ${params.recruiterName || "Recruiter"}
Recruiter Role / Title: ${params.recruiterRole || "Hiring Lead"}

Recruiter Inbound Message:
"""
${params.recruiterMessage}
"""

Candidate Profile Context:
- Senior Engineer with 7+ years in tech
- 4+ years of specialized Nuxt 4 / Nuxt 3, Vue, TypeScript, and high-scale E-Commerce Storefront experience (currently Senior Frontend at Kick Avenue)
- Experienced in AI-native engineering (acting as architect & validator with tools like Claude Code, Cursor, Antigravity)
- Leadership & technical ownership: ready to help shape technical foundations for new engineering hubs

Tasks:
1. Key Insights: 2-3 bullet points analyzing the recruiter's message (e.g. what they care about most, why they reached out, subtle hints about the team or culture).
2. Generate 3 distinct high-converting reply options:
   - Style 1: "crisp_linkedin" — Short, punchy, skimmable, perfect for a LinkedIn DM/InMail.
   - Style 2: "formal_email" — Structured, professional, comprehensive, ideal for formal email communication.
   - Style 3: "enthusiastic" — Warm, vision-aligned, engaging, leaning into shared technical excitement.

Return a JSON object conforming strictly to this format:
{
  "keyInsights": ["string"],
  "replyDrafts": [
    {
      "id": "string",
      "style": "crisp_linkedin" | "formal_email" | "enthusiastic",
      "title": "string",
      "content": "string",
      "createdAt": "string (ISO timestamp)"
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No response received from Gemini inbound reply generator.");
  }

  try {
    return JSON.parse(cleanJsonText(responseText)) as {
      keyInsights: string[];
      replyDrafts: InboundReachoutReplyDraft[];
    };
  } catch (err) {
    console.error("Failed to parse inbound reply JSON:", responseText, err);
    throw new Error("Failed to parse inbound reply.");
  }
}

