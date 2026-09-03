import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import type { AiOutreachDraftParams, AiOutreachDraftResult } from "./types";

const { users, siteSettings, skills, projects, resumeEntries, aiKnowledgeItems } = schema;

const DEFAULT_MODEL = getGeminiModel("gemini-2.5-flash");

function cleanJsonText(rawText: string): string {
  let clean = rawText.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return clean.trim();
}

/**
 * Builds candidate context from Database & AI Knowledge Hub to give the LLM
 * authentic, high-impact facts and achievements to reference in cold emails.
 */
async function buildCandidateContext(): Promise<string> {
  try {
    const db = getDb();

    const [userList, settingsList, skillsList, projectsList, resumeList, knowledgeList] =
      await Promise.all([
        db.select().from(users).limit(1).catch(() => []),
        db.select().from(siteSettings).limit(1).catch(() => []),
        db.select().from(skills).where(eq(skills.isPublished, true)).limit(15).catch(() => []),
        db
          .select()
          .from(projects)
          .where(eq(projects.isPublished, true))
          .orderBy(desc(projects.publishedDate))
          .limit(4)
          .catch(() => []),
        db
          .select()
          .from(resumeEntries)
          .where(eq(resumeEntries.isPublished, true))
          .orderBy(desc(resumeEntries.startDate))
          .limit(3)
          .catch(() => []),
        db
          .select()
          .from(aiKnowledgeItems)
          .where(eq(aiKnowledgeItems.isPublished, true))
          .limit(8)
          .catch(() => []),
      ]);

    const user = userList[0];
    const settings = settingsList[0];

    let context = `Candidate Profile:\n`;
    context += `- Name: ${user?.displayName || "Wisman Nur"}\n`;
    context += `- Title/Specialty: Senior Fullstack Software Engineer & AI Agent Architect (Next.js 16, React 19, TypeScript, Cloud, GenAI Systems)\n`;
    context += `- Location: ${user?.location || settings?.location || "Jakarta, Indonesia (Open to worldwide remote)"}\n`;
    context += `- Portfolio: https://wismannur.pro\n`;
    if (settings?.social?.github) context += `- GitHub: ${settings.social.github}\n`;
    if (settings?.social?.linkedin) context += `- LinkedIn: ${settings.social.linkedin}\n`;

    if (skillsList.length > 0) {
      context += `- Core Skills & Technologies: ${skillsList.map((s) => s.name).join(", ")}\n`;
    }

    if (resumeList.length > 0) {
      context += `\nRecent Work Experience:\n`;
      for (const exp of resumeList) {
        context += `- ${exp.title} at ${exp.organization}: ${exp.description || ""}\n`;
      }
    }

    if (projectsList.length > 0) {
      context += `\nKey Featured Projects:\n`;
      for (const p of projectsList) {
        context += `- **${p.title}** (${p.technologies.join(", ")}): ${p.summary}\n`;
      }
    }

    if (knowledgeList.length > 0) {
      context += `\nDeep Engineering Knowledge & Proven Track Record (from AI Knowledge Hub):\n`;
      for (const item of knowledgeList) {
        context += `- [${item.category.toUpperCase()}] ${item.title}: ${item.content}\n`;
      }
    }

    return context;
  } catch (error) {
    console.error("Failed to build candidate context for outreach:", error);
    return `Candidate: Wisman Nur, Senior Fullstack Software Engineer & AI Agent Architect (Next.js, React 19, TypeScript, Cloud & GenAI). Portfolio: https://wismannur.pro`;
  }
}

/**
 * Generates an impactful, personalized email draft (Subject + Body) for job outreach
 * grounded in real achievements from Wisman's AI Knowledge Hub and portfolio.
 */
export async function generateOutreachDraftWithGemini(
  params: AiOutreachDraftParams
): Promise<AiOutreachDraftResult> {
  const ai = getGeminiClient();
  const candidateContext = await buildCandidateContext();

  const prompt = `You are a world-class executive career strategist and cold email copywriter helping a senior software engineer write an exceptionally high-converting, personalized outreach email.

${candidateContext}

Outreach Context:
- Outreach Type: ${params.type} (Options: "direct_apply" = applying directly via email; "cold_pitch" = proactive message to hiring manager/recruiter after finding or applying to the company; "follow_up" = polite, value-driven follow up after sending initial email/application).
- Target Company: ${params.companyName}
- Target Role: ${params.jobTitle}
- Contact Person: ${params.contactName} ${params.contactRole ? `(${params.contactRole})` : ""}
- Company Website / Context: ${params.companyWebsite || "N/A"}
- Key Skills / Highlights to emphasize: ${params.keySkillsOrHighlights?.join(", ") || "Relevant engineering expertise and verified track record"}
- Target Job Description / Snippet:
"""
${params.jobDescriptionSnippet || "Standard expectations for the target engineering role."}
"""
- Custom User Notes/Instructions: ${params.customInstructions || "None provided."}

Strategic Copywriting Guidelines:
1. Authenticity & Substance: Ground the pitch in the candidate's actual projects, achievements, and deep knowledge points (e.g. specific technologies, metrics, problem-solving track record from the profile above). Avoid generic claims.
2. Tone: Confident, respectful, articulate, punchy, and value-oriented (senior engineering tone). Avoid desperation, flattery, or generic boilerplate ("I am writing this email to humbly apply...").
3. Length: Keep the email body crisp and concise (150-250 words max for direct_apply/cold_pitch, under 100 words for follow_up). Engineering managers appreciate succinct, high-signal emails.
4. Call to Action: Provide a clear, low-friction next step (e.g., a brief 10-15 min intro chat or link to portfolio).
5. Subject Line: Catchy, highly relevant, professional, and incorporates the candidate's name or role naturally.

Return a JSON object conforming strictly to this format:
{
  "subject": "string (Compelling subject line)",
  "body": "string (The complete email body without subject, formatted with clean paragraphs)",
  "recommendedFollowUpDays": number (e.g. 3, 4, or 5),
  "toneRationale": "string (Brief 1-sentence explanation of why this angle and proof-points were chosen)"
}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.6,
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
