"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { JobApplicationRow, JobOutreachMessageRow, JobOutreachRow } from "@/db/schema";
import { assertAdmin } from "../core/auth-guard";
import { RESEND_EMAIL_DOMAIN, sendJobOutreachEmail } from "../core/resend";
import { generateOutreachDraftWithGemini } from "./gemini-ai";
import type {
  AiOutreachDraftParams,
  AiOutreachDraftResult,
  JobOutreach,
  JobOutreachAttachment,
  JobOutreachMessage,
  NewJobOutreach,
  OutreachAnalytics,
  OutreachStatus,
  OutreachType,
  UpdateJobOutreach,
} from "./types";

const { jobOutreaches, jobOutreachMessages, jobApplications } = schema;

/**
 * Uploads a document attachment (CV, Portfolio, Cover Letter) to Vercel Blob storage.
 */
export async function uploadOutreachAttachment(formData: FormData): Promise<JobOutreachAttachment> {
  await assertAdmin();
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    throw new Error("No file provided");
  }

  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const { url } = await put(`outreach-attachments/${Date.now()}_${safeFilename}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || "application/octet-stream",
  });

  return {
    name: file.name,
    url,
    type: file.type,
  };
}

function revalidateOutreachPaths(id?: string) {
  revalidatePath("/cms/job-outreaches");
  revalidatePath("/cms/job-tracker");
  if (id) {
    revalidatePath(`/cms/job-outreaches/${id}`);
  }
}

const toJobOutreachMessage = (row: JobOutreachMessageRow): JobOutreachMessage => ({
  id: row.id,
  outreachId: row.outreachId,
  senderType: row.senderType,
  senderName: row.senderName,
  senderEmail: row.senderEmail,
  message: row.message,
  messageId: row.messageId ?? undefined,
  createdAt: row.createdAt,
});

const toJobOutreach = (
  row: JobOutreachRow,
  messages: JobOutreachMessage[] = [],
  jobApp?: JobApplicationRow | null
): JobOutreach => ({
  id: row.id,
  jobApplicationId: row.jobApplicationId ?? undefined,
  companyName: row.companyName,
  companyWebsite: row.companyWebsite ?? undefined,
  jobTitle: row.jobTitle,
  contactName: row.contactName,
  contactRole: row.contactRole ?? undefined,
  contactEmail: row.contactEmail,
  contactLinkedin: row.contactLinkedin ?? undefined,
  outreachType: row.outreachType,
  status: row.status,
  subject: row.subject,
  body: row.body,
  notes: row.notes ?? undefined,
  attachments: (row.attachments as JobOutreachAttachment[] | null) ?? undefined,
  initialMessageId: row.initialMessageId ?? undefined,
  sentAt: row.sentAt ?? undefined,
  followUpDueDate: row.followUpDueDate ?? undefined,
  lastRepliedAt: row.lastRepliedAt ?? undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  messages,
  jobApplication: jobApp
    ? {
        id: jobApp.id,
        jobTitle: jobApp.jobTitle,
        companyName: jobApp.companyName,
        status: jobApp.status,
      }
    : undefined,
});

/**
 * Lists all outreaches with optional filtering.
 */
export async function getJobOutreaches(filters?: {
  status?: OutreachStatus | "all";
  type?: OutreachType | "all";
  search?: string;
  jobApplicationId?: string;
}): Promise<JobOutreach[]> {
  await assertAdmin();
  const db = getDb();

  const conditions = [];

  if (filters?.jobApplicationId) {
    conditions.push(eq(jobOutreaches.jobApplicationId, filters.jobApplicationId));
  }

  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(jobOutreaches.status, filters.status));
  }

  if (filters?.type && filters.type !== "all") {
    conditions.push(eq(jobOutreaches.outreachType, filters.type));
  }

  if (filters?.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(jobOutreaches.companyName, q),
        ilike(jobOutreaches.jobTitle, q),
        ilike(jobOutreaches.contactName, q),
        ilike(jobOutreaches.contactEmail, q),
        ilike(jobOutreaches.subject, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(jobOutreaches)
    .where(whereClause)
    .orderBy(desc(jobOutreaches.createdAt));

  // Fetch linked job applications if needed
  const appIds = rows.map((r) => r.jobApplicationId).filter(Boolean) as string[];

  const appMap = new Map<string, JobApplicationRow>();
  if (appIds.length > 0) {
    const appRows = await db
      .select()
      .from(jobApplications)
      .where(sql`${jobApplications.id} IN ${appIds}`);
    for (const app of appRows) {
      appMap.set(app.id, app);
    }
  }

  return rows.map((row) =>
    toJobOutreach(row, [], row.jobApplicationId ? appMap.get(row.jobApplicationId) : null)
  );
}

/**
 * Gets a single outreach by ID with all thread messages and linked job application.
 */
export async function getJobOutreachById(id: string): Promise<JobOutreach | null> {
  await assertAdmin();
  const db = getDb();

  const [row] = await db.select().from(jobOutreaches).where(eq(jobOutreaches.id, id)).limit(1);

  if (!row) return null;

  const [messages, [jobApp]] = await Promise.all([
    db
      .select()
      .from(jobOutreachMessages)
      .where(eq(jobOutreachMessages.outreachId, id))
      .orderBy(asc(jobOutreachMessages.createdAt)),
    row.jobApplicationId
      ? db
          .select()
          .from(jobApplications)
          .where(eq(jobApplications.id, row.jobApplicationId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return toJobOutreach(row, messages.map(toJobOutreachMessage), jobApp ?? null);
}

/**
 * Creates a new job outreach, optionally sending it immediately via Resend.
 */
export async function createJobOutreach(
  data: NewJobOutreach,
  sendImmediately = false
): Promise<JobOutreach> {
  await assertAdmin();
  const db = getDb();

  const now = new Date();
  const isSending = sendImmediately && Boolean(data.contactEmail);

  // Default follow up due in 3 days if sent
  const followUpDate =
    data.followUpDueDate ||
    (isSending ? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) : undefined);

  const [inserted] = await db
    .insert(jobOutreaches)
    .values({
      jobApplicationId: data.jobApplicationId || null,
      companyName: data.companyName.trim(),
      companyWebsite: data.companyWebsite?.trim() || null,
      jobTitle: data.jobTitle.trim(),
      contactName: data.contactName.trim(),
      contactRole: data.contactRole?.trim() || null,
      contactEmail: data.contactEmail.trim().toLowerCase(),
      contactLinkedin: data.contactLinkedin?.trim() || null,
      outreachType: data.outreachType,
      status: isSending ? "sent" : data.status || "draft",
      subject: data.subject.trim(),
      body: data.body.trim(),
      notes: data.notes?.trim() || null,
      attachments: data.attachments || null,
      sentAt: isSending ? now : null,
      followUpDueDate: followUpDate || null,
    })
    .returning();

  // Insert initial message into thread
  if (inserted) {
    let resendId: string | undefined;

    // Send email via Resend if requested
    if (isSending) {
      try {
        const sendRes = await sendJobOutreachEmail({
          outreachId: inserted.id,
          toEmail: inserted.contactEmail,
          toName: inserted.contactName,
          subject: inserted.subject,
          message: inserted.body,
          companyName: inserted.companyName,
          jobTitle: inserted.jobTitle,
          attachments: (inserted.attachments as JobOutreachAttachment[] | null) ?? undefined,
        });
        resendId = sendRes.id;
      } catch (err) {
        console.error("[Job Outreach] Failed to send email on create:", err);
      }
    }

    await db.insert(jobOutreachMessages).values({
      outreachId: inserted.id,
      senderType: "admin",
      senderName: "Wisman Nur",
      senderEmail: `hi@${RESEND_EMAIL_DOMAIN}`,
      message: inserted.body,
      messageId: resendId || null,
      createdAt: isSending ? now : inserted.createdAt,
    });

    if (resendId) {
      await db
        .update(jobOutreaches)
        .set({ initialMessageId: resendId })
        .where(eq(jobOutreaches.id, inserted.id));
    }
  }

  revalidateOutreachPaths(inserted.id);
  return toJobOutreach(inserted);
}

/**
 * Updates an existing job outreach.
 */
export async function updateJobOutreach(id: string, data: UpdateJobOutreach): Promise<JobOutreach> {
  await assertAdmin();
  const db = getDb();

  const updatePayload: Partial<typeof jobOutreaches.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.companyName !== undefined) updatePayload.companyName = data.companyName;
  if (data.companyWebsite !== undefined) updatePayload.companyWebsite = data.companyWebsite || null;
  if (data.jobTitle !== undefined) updatePayload.jobTitle = data.jobTitle;
  if (data.contactName !== undefined) updatePayload.contactName = data.contactName;
  if (data.contactRole !== undefined) updatePayload.contactRole = data.contactRole || null;
  if (data.contactEmail !== undefined) updatePayload.contactEmail = data.contactEmail.toLowerCase();
  if (data.contactLinkedin !== undefined)
    updatePayload.contactLinkedin = data.contactLinkedin || null;
  if (data.outreachType !== undefined) updatePayload.outreachType = data.outreachType;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.subject !== undefined) updatePayload.subject = data.subject;
  if (data.body !== undefined) updatePayload.body = data.body;
  if (data.notes !== undefined) updatePayload.notes = data.notes || null;
  if (data.attachments !== undefined) updatePayload.attachments = data.attachments || null;
  if (data.followUpDueDate !== undefined)
    updatePayload.followUpDueDate = data.followUpDueDate || null;
  if (data.jobApplicationId !== undefined)
    updatePayload.jobApplicationId = data.jobApplicationId || null;

  const [updated] = await db
    .update(jobOutreaches)
    .set(updatePayload)
    .where(eq(jobOutreaches.id, id))
    .returning();

  if (!updated) throw new Error("Outreach not found");

  revalidateOutreachPaths(id);
  return toJobOutreach(updated);
}

/**
 * Sends a draft outreach email via Resend and transitions status to 'sent'.
 */
export async function sendOutreachEmail(id: string): Promise<JobOutreach> {
  await assertAdmin();
  const db = getDb();

  const [row] = await db.select().from(jobOutreaches).where(eq(jobOutreaches.id, id)).limit(1);

  if (!row) throw new Error("Outreach not found");

  const now = new Date();
  const followUpDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const sendRes = await sendJobOutreachEmail({
    outreachId: row.id,
    toEmail: row.contactEmail,
    toName: row.contactName,
    subject: row.subject,
    message: row.body,
    companyName: row.companyName,
    jobTitle: row.jobTitle,
    attachments: (row.attachments as JobOutreachAttachment[] | null) ?? undefined,
  });

  const [updated] = await db
    .update(jobOutreaches)
    .set({
      status: "sent",
      sentAt: now,
      initialMessageId: sendRes.id || row.initialMessageId || null,
      followUpDueDate: followUpDate,
      updatedAt: now,
    })
    .where(eq(jobOutreaches.id, id))
    .returning();

  if (sendRes.id) {
    const [firstMsg] = await db
      .select()
      .from(jobOutreachMessages)
      .where(eq(jobOutreachMessages.outreachId, id))
      .orderBy(asc(jobOutreachMessages.createdAt))
      .limit(1);

    if (firstMsg) {
      await db
        .update(jobOutreachMessages)
        .set({ messageId: sendRes.id })
        .where(eq(jobOutreachMessages.id, firstMsg.id));
    }
  }

  revalidateOutreachPaths(id);
  return toJobOutreach(updated);
}

/**
 * Sends a follow-up email in the same thread to the recruiter.
 */
export async function sendFollowUpMessage(
  outreachId: string,
  followUpText: string,
  subject?: string
): Promise<JobOutreachMessage> {
  await assertAdmin();
  const db = getDb();

  const [outreach] = await db
    .select()
    .from(jobOutreaches)
    .where(eq(jobOutreaches.id, outreachId))
    .limit(1);

  if (!outreach) throw new Error("Outreach not found");

  // 1. Fetch previous thread messages to extract inReplyToId and references
  const previousMessages = await db
    .select()
    .from(jobOutreachMessages)
    .where(eq(jobOutreachMessages.outreachId, outreachId))
    .orderBy(asc(jobOutreachMessages.createdAt));

  const referencesIds: string[] = [];
  if (outreach.initialMessageId) {
    referencesIds.push(outreach.initialMessageId);
  }
  for (const msg of previousMessages) {
    if (msg.messageId) {
      referencesIds.push(msg.messageId);
    }
  }

  const inReplyToId = referencesIds.length > 0 ? referencesIds[referencesIds.length - 1] : null;

  // 2. Send via Resend with In-Reply-To and References headers
  const finalSubject = subject || outreach.subject;
  const sendRes = await sendJobOutreachEmail({
    outreachId,
    toEmail: outreach.contactEmail,
    toName: outreach.contactName,
    subject: finalSubject,
    message: followUpText.trim(),
    companyName: outreach.companyName,
    jobTitle: outreach.jobTitle,
    isFollowUp: true,
    inReplyToId,
    referencesIds,
  });

  // 3. Insert message into thread with messageId
  const [newMessage] = await db
    .insert(jobOutreachMessages)
    .values({
      outreachId,
      senderType: "admin",
      senderName: "Wisman Nur",
      senderEmail: `hi@${RESEND_EMAIL_DOMAIN}`,
      message: followUpText.trim(),
      messageId: sendRes.id || null,
    })
    .returning();

  // 4. Update outreach status & next follow-up due in 4 days
  const now = new Date();
  await db
    .update(jobOutreaches)
    .set({
      status: "sent",
      followUpDueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    })
    .where(eq(jobOutreaches.id, outreachId));

  revalidateOutreachPaths(outreachId);
  return toJobOutreachMessage(newMessage);
}

/**
 * Deletes an outreach and its thread messages.
 */
export async function deleteJobOutreach(id: string): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db.delete(jobOutreaches).where(eq(jobOutreaches.id, id));
  revalidateOutreachPaths(id);
}

/**
 * Converts or links an outreach to an active Job Application in the Job Tracker.
 */
export async function convertOutreachToJobApplication(
  outreachId: string,
  existingApplicationId?: string
): Promise<{ outreach: JobOutreach; applicationId: string }> {
  await assertAdmin();
  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [outreach] = await tx
      .select()
      .from(jobOutreaches)
      .where(eq(jobOutreaches.id, outreachId))
      .limit(1);

    if (!outreach) throw new Error("Outreach not found");

    let targetAppId = existingApplicationId;

    // If no existing application ID provided, create a new Job Application record!
    if (!targetAppId) {
      const [newApp] = await tx
        .insert(jobApplications)
        .values({
          companyName: outreach.companyName,
          companyWebsite: outreach.companyWebsite || null,
          jobTitle: outreach.jobTitle,
          platform: "other",
          workplaceType: "remote",
          jobType: "full_time",
          requirements: [],
          status: "applied",
          appliedAt: outreach.sentAt || new Date(),
          contactName: outreach.contactName,
          contactEmail: outreach.contactEmail,
          notes: `Created from Job Outreach: "${outreach.subject}".\nNotes: ${outreach.notes || "-"}`,
          sortOrder: 0,
        })
        .returning({ id: jobApplications.id });

      targetAppId = newApp.id;
    }

    // Link outreach to job application and update status to 'converted'
    const [updatedOutreach] = await tx
      .update(jobOutreaches)
      .set({
        jobApplicationId: targetAppId,
        status: "converted",
        updatedAt: new Date(),
      })
      .where(eq(jobOutreaches.id, outreachId))
      .returning();

    return {
      outreach: toJobOutreach(updatedOutreach),
      applicationId: targetAppId,
    };
  });

  revalidateOutreachPaths(outreachId);
  return result;
}

/**
 * Retrieves aggregate analytics for Job Outreaches.
 */
export async function getOutreachAnalytics(): Promise<OutreachAnalytics> {
  await assertAdmin();
  const db = getDb();

  const rows = await db.select().from(jobOutreaches);

  const statusCounts: Record<OutreachStatus, number> = {
    draft: 0,
    sent: 0,
    follow_up_due: 0,
    replied: 0,
    converted: 0,
    closed: 0,
  };

  const typeCounts: Record<OutreachType, number> = {
    direct_apply: 0,
    cold_pitch: 0,
    follow_up: 0,
  };

  const now = new Date();

  for (const r of rows) {
    let effStatus = r.status as OutreachStatus;
    // Dynamically compute follow_up_due if sent and past due date without reply
    if (
      effStatus === "sent" &&
      r.followUpDueDate &&
      new Date(r.followUpDueDate) < now &&
      !r.lastRepliedAt
    ) {
      effStatus = "follow_up_due";
    }

    if (statusCounts[effStatus] !== undefined) {
      statusCounts[effStatus]++;
    }
    if (typeCounts[r.outreachType] !== undefined) {
      typeCounts[r.outreachType]++;
    }
  }

  const totalOutreaches = rows.length;
  const repliedCount = statusCounts.replied + statusCounts.converted;
  const sentOrActiveCount = totalOutreaches - statusCounts.draft;

  const responseRate =
    sentOrActiveCount > 0 ? Math.round((repliedCount / sentOrActiveCount) * 100) : 0;

  return {
    totalOutreaches,
    awaitingReply: statusCounts.sent,
    followUpDue: statusCounts.follow_up_due,
    replied: statusCounts.replied,
    converted: statusCounts.converted,
    responseRate,
    statusCounts,
    typeCounts,
  };
}

/**
 * Generates an AI draft for job outreach using Gemini AI.
 */
export async function generateAiOutreachDraft(
  params: AiOutreachDraftParams
): Promise<AiOutreachDraftResult> {
  await assertAdmin();
  return generateOutreachDraftWithGemini(params);
}
