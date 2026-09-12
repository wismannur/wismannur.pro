"use server";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { buildKnowledgeContext } from "../ai-chat/knowledge-context";
import { assertAdmin } from "../core/auth-guard";
import { ServiceError } from "../core/base-service";
import { RESEND_EMAIL_DOMAIN, sendAdminReplyToClient } from "../core/resend";
import type {
  GenerateAiReplyDraftInput,
  GenerateAiReplyDraftResult,
  InquiryMessage,
  SendAdminReplyInput,
} from "./types";

const { inquiryMessages, contacts, serviceRequests, hireRequests, aiKnowledgeItems } = schema;

const sendReplySchema = z.object({
  inquiryId: z.string().min(1),
  inquiryType: z.enum(["contact", "service_request", "hire_request"]),
  toEmail: z.string().trim().email(),
  toName: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  message: z.string().trim().min(1).max(10000),
  originalMessageSnippet: z.string().optional(),
});

export async function getThreadMessages(inquiryId: string): Promise<InquiryMessage[]> {
  await assertAdmin();
  const db = getDb();
  const rows = await db
    .select()
    .from(inquiryMessages)
    .where(eq(inquiryMessages.inquiryId, inquiryId))
    .orderBy(asc(inquiryMessages.createdAt));

  return rows.map((row) => ({
    id: row.id,
    inquiryId: row.inquiryId,
    inquiryType: row.inquiryType as InquiryMessage["inquiryType"],
    senderType: row.senderType,
    senderName: row.senderName,
    senderEmail: row.senderEmail,
    message: row.message,
    messageId: row.messageId ?? undefined,
    createdAt: row.createdAt,
  }));
}

export async function sendAdminReply(data: SendAdminReplyInput): Promise<InquiryMessage> {
  await assertAdmin();
  const parsed = sendReplySchema.safeParse(data);
  if (!parsed.success) {
    throw new ServiceError("Validation failed", "invalid-input", parsed.error);
  }
  const clean = parsed.data;

  const db = getDb();

  // 1. Fetch previous thread messages and initial entity messageId to construct threading references
  const previousMessages = await db
    .select()
    .from(inquiryMessages)
    .where(eq(inquiryMessages.inquiryId, clean.inquiryId))
    .orderBy(asc(inquiryMessages.createdAt));

  const referencesIds: string[] = [];
  let initialEntityMessage: string | undefined = undefined;

  // Check initial messageId and message content from parent table
  if (clean.inquiryType === "contact") {
    const [parent] = await db
      .select({ messageId: contacts.messageId, message: contacts.message })
      .from(contacts)
      .where(eq(contacts.id, clean.inquiryId))
      .limit(1);
    if (parent?.messageId) referencesIds.push(parent.messageId);
    if (parent?.message) initialEntityMessage = parent.message;
  } else if (clean.inquiryType === "service_request") {
    const [parent] = await db
      .select({
        messageId: serviceRequests.messageId,
        projectDetails: serviceRequests.projectDetails,
      })
      .from(serviceRequests)
      .where(eq(serviceRequests.id, clean.inquiryId))
      .limit(1);
    if (parent?.messageId) referencesIds.push(parent.messageId);
    if (parent?.projectDetails) initialEntityMessage = parent.projectDetails;
  } else if (clean.inquiryType === "hire_request") {
    const [parent] = await db
      .select({ messageId: hireRequests.messageId, message: hireRequests.message })
      .from(hireRequests)
      .where(eq(hireRequests.id, clean.inquiryId))
      .limit(1);
    if (parent?.messageId) referencesIds.push(parent.messageId);
    if (parent?.message) initialEntityMessage = parent.message;
  }

  for (const msg of previousMessages) {
    if (msg.messageId) {
      referencesIds.push(msg.messageId);
    }
  }

  const inReplyToId = referencesIds.length > 0 ? referencesIds[referencesIds.length - 1] : null;

  // Find the most recent message from the client to quote dynamically in the email
  const latestClientMessage = [...previousMessages]
    .reverse()
    .find((msg) => msg.senderType === "client");

  const originalSnippetToQuote =
    latestClientMessage?.message ||
    clean.originalMessageSnippet ||
    initialEntityMessage ||
    undefined;

  // 2. Send email to client via Resend with RFC 5322 In-Reply-To and References
  const sendRes = await sendAdminReplyToClient({
    inquiryId: clean.inquiryId,
    toEmail: clean.toEmail,
    toName: clean.toName,
    subject: clean.subject,
    message: clean.message,
    originalMessageSnippet: originalSnippetToQuote,
    inReplyToId,
    referencesIds,
  });

  // 3. Insert admin reply to database with messageId
  const [inserted] = await db
    .insert(inquiryMessages)
    .values({
      inquiryId: clean.inquiryId,
      inquiryType: clean.inquiryType,
      senderType: "admin",
      senderName: "Wisman Nur",
      senderEmail: `hi@${RESEND_EMAIL_DOMAIN}`,
      message: clean.message,
      messageId: sendRes.id || null,
    })
    .returning();

  // 4. Update status of the inquiry
  if (clean.inquiryType === "contact") {
    await db.update(contacts).set({ status: "replied" }).where(eq(contacts.id, clean.inquiryId));
  } else if (clean.inquiryType === "service_request") {
    await db
      .update(serviceRequests)
      .set({ status: "in-progress" })
      .where(eq(serviceRequests.id, clean.inquiryId));
  } else if (clean.inquiryType === "hire_request") {
    await db
      .update(hireRequests)
      .set({ status: "reviewed", updatedAt: new Date() })
      .where(eq(hireRequests.id, clean.inquiryId));
  }

  return {
    id: inserted.id,
    inquiryId: inserted.inquiryId,
    inquiryType: inserted.inquiryType,
    senderType: inserted.senderType,
    senderName: inserted.senderName,
    senderEmail: inserted.senderEmail,
    message: inserted.message,
    messageId: inserted.messageId ?? undefined,
    createdAt: inserted.createdAt,
  };
}

const generateAiReplyDraftSchema = z.object({
  inquiryId: z.string().min(1),
  inquiryType: z.enum(["contact", "service_request", "hire_request"]),
  userGuidance: z.string().optional(),
  tone: z.enum(["professional", "friendly", "detailed"]).optional().default("professional"),
});

/**
 * Generates an intelligent, grounded draft email reply for an inquiry
 * using Gemini 3.8 Flash, grounded in thread chat history and AI Knowledge Hub documents.
 */
export async function generateAiReplyDraft(
  input: GenerateAiReplyDraftInput
): Promise<GenerateAiReplyDraftResult> {
  await assertAdmin();
  const parsed = generateAiReplyDraftSchema.safeParse(input);
  if (!parsed.success) {
    throw new ServiceError("Validation failed", "invalid-input", parsed.error);
  }
  const clean = parsed.data;
  const db = getDb();

  // 1. Fetch Inquiry details
  let clientName = "Client";
  let clientEmail = "";
  let subject = "";
  let initialMessage = "";
  let extraDetails = "";

  if (clean.inquiryType === "contact") {
    const [row] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, clean.inquiryId))
      .limit(1);
    if (!row) throw new ServiceError("Contact inquiry not found", "not-found");
    clientName = row.name;
    clientEmail = row.email;
    subject = row.subject;
    initialMessage = row.message;
    extraDetails += `- Status: ${row.status}\n`;
    extraDetails += `- Submitted At: ${row.createdAt.toISOString()}\n`;
  } else if (clean.inquiryType === "service_request") {
    const [row] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, clean.inquiryId))
      .limit(1);
    if (!row) throw new ServiceError("Service request not found", "not-found");
    clientName = row.name;
    clientEmail = row.email;
    subject = `Service Request: ${row.serviceType}`;
    initialMessage = row.projectDetails;
    extraDetails += `- Service Type: ${row.serviceType}\n`;
    if (row.budget) extraDetails += `- Budget: ${row.budget}\n`;
    if (row.timeframe) extraDetails += `- Timeframe: ${row.timeframe}\n`;
    if (row.company) extraDetails += `- Company: ${row.company}\n`;
    extraDetails += `- Status: ${row.status}\n`;
    extraDetails += `- Submitted At: ${row.createdAt.toISOString()}\n`;
  } else if (clean.inquiryType === "hire_request") {
    const [row] = await db
      .select()
      .from(hireRequests)
      .where(eq(hireRequests.id, clean.inquiryId))
      .limit(1);
    if (!row) throw new ServiceError("Hire request not found", "not-found");
    clientName = row.name;
    clientEmail = row.email;
    subject = `Hire Request: ${row.roleTitle || "Software Engineer"}`;
    initialMessage = row.message;
    if (row.company) extraDetails += `- Company: ${row.company}\n`;
    if (row.roleTitle) extraDetails += `- Role Title: ${row.roleTitle}\n`;
    if (row.employmentType) extraDetails += `- Employment Type: ${row.employmentType}\n`;
    if (row.workplaceType) extraDetails += `- Workplace Type: ${row.workplaceType}\n`;
    if (row.location) extraDetails += `- Location: ${row.location}\n`;
    if (row.salaryRange) extraDetails += `- Salary Range / Budget: ${row.salaryRange}\n`;
    extraDetails += `- Status: ${row.status}\n`;
    extraDetails += `- Submitted At: ${row.createdAt.toISOString()}\n`;
  }

  // 2. Fetch Thread Conversation History
  const threadMessages = await db
    .select()
    .from(inquiryMessages)
    .where(eq(inquiryMessages.inquiryId, clean.inquiryId))
    .orderBy(asc(inquiryMessages.createdAt));

  let chatHistoryFormatted = "";
  if (threadMessages.length > 0) {
    chatHistoryFormatted = threadMessages
      .map((msg, idx) => {
        const sender = msg.senderType === "admin" ? "Wisman Nur (Admin)" : msg.senderName;
        return `[Message #${idx + 1} from ${sender} (${msg.senderEmail}) at ${msg.createdAt.toISOString()}]:\n${msg.message}`;
      })
      .join("\n\n");
  } else {
    chatHistoryFormatted = "No follow-up messages yet in this thread. This is the initial reply to the client's message.";
  }

  // 3. Fetch Knowledge Hub Grounding Context
  const knowledgeItems = await db
    .select({
      category: aiKnowledgeItems.category,
      title: aiKnowledgeItems.title,
      content: aiKnowledgeItems.content,
    })
    .from(aiKnowledgeItems)
    .where(eq(aiKnowledgeItems.isPublished, true))
    .orderBy(asc(aiKnowledgeItems.sortOrder));

  let knowledgeHubText = "";
  if (knowledgeItems.length > 0) {
    knowledgeHubText = knowledgeItems
      .map((item) => `### [${item.category.toUpperCase()}] ${item.title}\n${item.content}\n`)
      .join("\n");
  }

  // Also compile rich profile context (skills, bio, experience, verified FAQs, etc.)
  const coreContext = await buildKnowledgeContext();

  // 4. Construct Gemini Prompt
  const ai = getGeminiClient();
  const modelName = getGeminiModel("gemini-3.8-flash");

  const prompt = `You are the personal AI Executive Assistant for Wisman Nur (Senior Fullstack Software Engineer & AI Agent Architect).
Your task is to draft a high-converting, warm, professional, and authentic email reply from Wisman Nur directly to a client/inquirer.

### INQUIRER & INQUIRY CONTEXT:
- Client Name: ${clientName}
- Client Email: ${clientEmail}
- Inquiry Subject: ${subject}
${extraDetails}
- Client's Original Inquiry Message:
"""
${initialMessage}
"""

### CHAT / THREAD CONVERSATION HISTORY:
"""
${chatHistoryFormatted}
"""

### WISMAN NUR'S VERIFIED KNOWLEDGE BASE & AI KNOWLEDGE HUB GROUNDING:
----------------------------------------
${coreContext}

#### SPECIFIC AI KNOWLEDGE HUB DOCUMENTS:
${knowledgeHubText}
----------------------------------------

### DESIRED TONE & INSTRUCTIONS:
- Tone Style: ${clean.tone} (e.g. professional, warm, collaborative, and insightful).
- Custom Admin Guidance/Notes: ${clean.userGuidance?.trim() || "None provided. Use best judgment based on client inquiry and verified knowledge base."}

### DRAFTING GUIDELINES:
1. **Language Matching**: Strictly adapt to the language used by the client!
   - If the client wrote in Indonesian, compose the email reply in courteous, articulate, and natural Indonesian (e.g. "Halo ${clientName}, Terima kasih telah menghubungi saya...").
   - If the client wrote in English, compose in polished, professional English (e.g. "Hi ${clientName}, Thank you for reaching out...").
2. **Substance & Grounding**:
   - Greet the client warmly by name.
   - Accurately answer their requirements, questions, project details, or proposal based on Wisman's verified background, tech stack, and AI Knowledge Hub.
   - Mention relevant technical experience or project examples only when directly helpful to their inquiry.
3. **Action-Oriented Next Steps**:
   - Propose clear, low-friction next steps (e.g. scheduling a discovery call via cal.com/wismannur, discussing milestone estimates, or requesting specific specs).
4. **Sign-off**:
   - Sign off warmly as Wisman Nur (e.g. "Best regards,\nWisman Nur\nSenior Fullstack Software Engineer & AI Agent Architect\nwismannur.pro").
5. **Output Format**:
   - Return ONLY the clean email reply body text ready to be reviewed or sent.
   - Do NOT include markdown code fences (like \`\`\`text), subject line tags, or meta preamble/postamble.
   - Do NOT use placeholder brackets like [Insert Date Here] or [Your Phone Number]. State details directly or refer to email/calendar link.
`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      temperature: 0.65,
    },
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new ServiceError("Failed to generate draft with AI", "ai-generation-failed");
  }

  // Clean any markdown code fences if model wrapped response in ```text ... ```
  let cleanDraft = responseText;
  if (cleanDraft.startsWith("```")) {
    cleanDraft = cleanDraft.replace(/^```(?:text|markdown)?\s*/i, "").replace(/\s*```$/, "");
  }

  return {
    draft: cleanDraft.trim(),
    usedKnowledgeTopicsCount: knowledgeItems.length,
  };
}

