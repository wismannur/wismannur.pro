import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import type { AiOutreachDraftParams, AiOutreachDraftResult } from "./types";

const DEFAULT_MODEL = getGeminiModel("gemini-2.5-flash");

function cleanJsonText(rawText: string): string {
  let clean = rawText.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return clean.trim();
}

/**
 * Generates an impactful, personalized email draft (Subject + Body) for job outreach.
 */
export async function generateOutreachDraftWithGemini(
  params: AiOutreachDraftParams,
  senderProfile = {
    name: "Wisman Nur",
    title: "Frontend Software Engineer & AI Agent Architect",
    portfolioUrl: "https://wismannur.pro",
    githubUrl: "https://github.com/wismannur",
    linkedinUrl: "https://linkedin.com/in/wismannur",
    coreTech:
      "React, Next.js (App Router), TypeScript, Tailwind CSS, State Management, High-Performance Web Apps, AI Agent & LLM integrations",
  }
): Promise<AiOutreachDraftResult> {
  const ai = getGeminiClient();

  const prompt = `You are a world-class career strategist and expert cold email copywriter helping a senior candidate write an exceptionally high-converting email.

Candidate Profile:
- Name: ${senderProfile.name}
- Title: ${senderProfile.title}
- Core Tech & Expertise: ${senderProfile.coreTech}
- Portfolio: ${senderProfile.portfolioUrl}
- GitHub: ${senderProfile.githubUrl}
- LinkedIn: ${senderProfile.linkedinUrl}

Outreach Context:
- Outreach Type: ${params.type} (Options: "direct_apply" = applying directly via email; "cold_pitch" = proactive message to hiring manager/recruiter after applying or finding the company; "follow_up" = polite, value-driven follow up after sending initial email/application).
- Company Name: ${params.companyName}
- Job Title / Target Role: ${params.jobTitle}
- Contact Person: ${params.contactName} ${params.contactRole ? `(${params.contactRole})` : ""}
- Company Website / Context: ${params.companyWebsite || "N/A"}
- Key Highlights / Skills to emphasize: ${params.keySkillsOrHighlights?.join(", ") || "Relevant engineering skills and proven delivery track record"}
- Job Description Snippet / Context:
"""
${params.jobDescriptionSnippet || "Standard expectations for the target role."}
"""
- Custom User Notes/Instructions: ${params.customInstructions || "None provided."}

Guidelines:
1. Language: English or Indonesian (default to fluent, professional, modern English suitable for tech startups & global tech companies, or Bahasa Indonesia if custom notes explicitly ask for it).
2. Tone: Confident, respectful, concise (150-250 words max), punchy, and value-oriented. Avoid fluff, desperate pleading, or generic boilerplate ("I am writing this email to humbly apply...").
3. For "direct_apply": Present a crisp executive pitch of relevant experience, mention CV/portfolio attached/linked, and invite a quick introductory conversation.
4. For "cold_pitch": Acknowledge that the candidate recently submitted an application for the role, highlight 2-3 laser-focused reasons why their background is an exact match for the company's tech stack and vision, and offer a low-friction call.
5. For "follow_up": Gentle check-in, reiterate enthusiasm, add a small piece of extra value or portfolio highlight, and keep it under 100 words.
6. The subject line must be catchy, relevant, professional, and include the candidate's name and role without feeling like spam.

Return a JSON object conforming strictly to this format:
{
  "subject": "string",
  "body": "string (the complete email body without subject, formatted with clean paragraphs)",
  "recommendedFollowUpDays": number (e.g. 3, 4, or 5),
  "toneRationale": "string (brief 1-sentence explanation of why this angle was chosen)"
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error("No response received from Gemini AI.");
  }

  try {
    return JSON.parse(cleanJsonText(responseText)) as AiOutreachDraftResult;
  } catch (err) {
    console.error("Failed to parse Gemini outreach draft JSON:", responseText, err);
    throw new Error("Failed to generate a valid outreach draft JSON.");
  }
}
