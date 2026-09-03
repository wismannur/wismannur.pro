import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import type {
  AtsAnalysis,
  InterviewPrepResult,
  ParsedInterviewInvitation,
  ParsedJobPosting,
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
