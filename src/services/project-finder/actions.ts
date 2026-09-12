"use server";

import { revalidatePath } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { ProjectProspectRow } from "@/db/schema";
import { assertAdmin } from "../core/auth-guard";
import {
  aiAuditProspectWebsite,
  aiGenerateModernizationPitch,
} from "./gemini-ai";
import type {
  ModernizationPitchResult,
  NewProjectProspect,
  ProjectAuditAnalysis,
  ProjectProspect,
  ProjectProspectStatus,
} from "./types";

const { projectProspects } = schema;

function revalidateProjectPaths(id?: string) {
  revalidatePath("/cms/project-hunter");
  revalidatePath("/cms/project-tracker");
  revalidatePath("/cms/project-outreaches");
  if (id) {
    revalidatePath(`/cms/project-tracker/${id}`);
  }
}

const toProjectProspect = (row: ProjectProspectRow): ProjectProspect => ({
  id: row.id,
  companyName: row.companyName,
  companyLogo: row.companyLogo ?? undefined,
  companyWebsite: row.companyWebsite,
  industry: row.industry,
  country: row.country,
  city: row.city ?? undefined,
  timezone: row.timezone,
  status: row.status as ProjectProspectStatus,
  estimatedRevenueTier: row.estimatedRevenueTier ?? undefined,
  auditScore: row.auditScore ?? undefined,
  auditAnalysis: (row.auditAnalysis as ProjectAuditAnalysis) ?? undefined,
  mvpDemoUrl: row.mvpDemoUrl ?? undefined,
  loomVideoUrl: row.loomVideoUrl ?? undefined,
  pitchScript: row.pitchScript ?? undefined,
  contactName: row.contactName ?? undefined,
  contactRole: row.contactRole ?? undefined,
  contactEmail: row.contactEmail ?? undefined,
  contactLinkedin: row.contactLinkedin ?? undefined,
  outreachStatus: row.outreachStatus ?? undefined,
  outreachSentAt: row.outreachSentAt ?? undefined,
  followUpDueDate: row.followUpDueDate ?? undefined,
  notes: row.notes ?? undefined,
  sortOrder: row.sortOrder,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export async function getAllProspects(): Promise<ProjectProspect[]> {
  await assertAdmin();
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(projectProspects)
      .orderBy(asc(projectProspects.sortOrder), desc(projectProspects.createdAt));
    return rows.map(toProjectProspect);
  } catch (error) {
    console.error("getAllProspects error:", error);
    return [];
  }
}

export async function getProspectById(id: string): Promise<ProjectProspect | null> {
  await assertAdmin();
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(projectProspects)
      .where(eq(projectProspects.id, id))
      .limit(1);

    if (!row) return null;
    return toProjectProspect(row);
  } catch (error) {
    console.error("getProspectById error:", error);
    return null;
  }
}

export async function getPublicProspectBySlug(slug: string): Promise<ProjectProspect | null> {
  try {
    const db = getDb();
    const rows = await db.select().from(projectProspects);
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = rows.find((r) => {
      const rowIdClean = r.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const rowCompanyClean = r.companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
      return rowIdClean.includes(cleanSlug) || rowCompanyClean === cleanSlug || cleanSlug.includes(rowCompanyClean);
    });

    if (!found) return null;
    return toProjectProspect(found);
  } catch (error) {
    console.error("getPublicProspectBySlug error:", error);
    return null;
  }
}

export async function createProspect(data: NewProjectProspect): Promise<ProjectProspect> {
  await assertAdmin();
  const db = getDb();

  const [inserted] = await db
    .insert(projectProspects)
    .values({
      companyName: data.companyName,
      companyLogo: data.companyLogo || null,
      companyWebsite: data.companyWebsite,
      industry: data.industry || "home_living",
      country: data.country || "Netherlands",
      city: data.city || null,
      timezone: data.timezone || "Europe/Amsterdam",
      status: data.status || "sourced",
      estimatedRevenueTier: data.estimatedRevenueTier || null,
      auditScore: data.auditScore ?? null,
      auditAnalysis: data.auditAnalysis || null,
      mvpDemoUrl: data.mvpDemoUrl || null,
      loomVideoUrl: data.loomVideoUrl || null,
      pitchScript: data.pitchScript || null,
      contactName: data.contactName || null,
      contactRole: data.contactRole || null,
      contactEmail: data.contactEmail || null,
      contactLinkedin: data.contactLinkedin || null,
      outreachStatus: data.outreachStatus || null,
      outreachSentAt: data.outreachSentAt || null,
      followUpDueDate: data.followUpDueDate || null,
      notes: data.notes || null,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  revalidateProjectPaths(inserted.id);
  return toProjectProspect(inserted);
}

export async function updateProspect(
  id: string,
  data: Partial<NewProjectProspect>,
): Promise<ProjectProspect> {
  await assertAdmin();
  const db = getDb();

  const updateValues: Partial<typeof projectProspects.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (data.companyName !== undefined) updateValues.companyName = data.companyName;
  if (data.companyLogo !== undefined) updateValues.companyLogo = data.companyLogo;
  if (data.companyWebsite !== undefined) updateValues.companyWebsite = data.companyWebsite;
  if (data.industry !== undefined) updateValues.industry = data.industry;
  if (data.country !== undefined) updateValues.country = data.country;
  if (data.city !== undefined) updateValues.city = data.city;
  if (data.timezone !== undefined) updateValues.timezone = data.timezone;
  if (data.status !== undefined) updateValues.status = data.status;
  if (data.estimatedRevenueTier !== undefined) updateValues.estimatedRevenueTier = data.estimatedRevenueTier;
  if (data.auditScore !== undefined) updateValues.auditScore = data.auditScore;
  if (data.auditAnalysis !== undefined) updateValues.auditAnalysis = data.auditAnalysis;
  if (data.mvpDemoUrl !== undefined) updateValues.mvpDemoUrl = data.mvpDemoUrl;
  if (data.loomVideoUrl !== undefined) updateValues.loomVideoUrl = data.loomVideoUrl;
  if (data.pitchScript !== undefined) updateValues.pitchScript = data.pitchScript;
  if (data.contactName !== undefined) updateValues.contactName = data.contactName;
  if (data.contactRole !== undefined) updateValues.contactRole = data.contactRole;
  if (data.contactEmail !== undefined) updateValues.contactEmail = data.contactEmail;
  if (data.contactLinkedin !== undefined) updateValues.contactLinkedin = data.contactLinkedin;
  if (data.outreachStatus !== undefined) updateValues.outreachStatus = data.outreachStatus;
  if (data.outreachSentAt !== undefined) updateValues.outreachSentAt = data.outreachSentAt;
  if (data.followUpDueDate !== undefined) updateValues.followUpDueDate = data.followUpDueDate;
  if (data.notes !== undefined) updateValues.notes = data.notes;
  if (data.sortOrder !== undefined) updateValues.sortOrder = data.sortOrder;

  const [updated] = await db
    .update(projectProspects)
    .set(updateValues)
    .where(eq(projectProspects.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Prospect ${id} not found`);
  }

  revalidateProjectPaths(id);
  return toProjectProspect(updated);
}

export async function updateProspectStatus(
  id: string,
  status: ProjectProspectStatus,
): Promise<ProjectProspect> {
  await assertAdmin();
  const db = getDb();

  const [updated] = await db
    .update(projectProspects)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(projectProspects.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Prospect ${id} not found`);
  }

  revalidateProjectPaths(id);
  return toProjectProspect(updated);
}

export async function deleteProspect(id: string): Promise<{ success: boolean }> {
  await assertAdmin();
  const db = getDb();

  await db.delete(projectProspects).where(eq(projectProspects.id, id));
  revalidateProjectPaths(id);
  return { success: true };
}

/**
 * Server action to trigger an AI audit on a prospect and save results directly.
 */
export async function aiRunProspectAudit(id: string): Promise<ProjectProspect> {
  await assertAdmin();
  const prospect = await getProspectById(id);
  if (!prospect) {
    throw new Error("Prospect not found");
  }

  const audit = await aiAuditProspectWebsite(
    prospect.companyWebsite,
    prospect.companyName,
    prospect.industry,
  );

  const nextStatus =
    prospect.status === "sourced" ? "audited" : prospect.status;

  return updateProspect(id, {
    auditScore: audit.modernizationOpportunityScore,
    auditAnalysis: audit,
    status: nextStatus,
  });
}

/**
 * Server action to generate an AI modernization pitch pack for a prospect.
 */
export async function aiGeneratePitch(id: string): Promise<ModernizationPitchResult> {
  await assertAdmin();
  const prospect = await getProspectById(id);
  if (!prospect) {
    throw new Error("Prospect not found");
  }

  const pitch = await aiGenerateModernizationPitch(prospect);

  const formattedScript = `--- COLD EMAIL ---
Subject: ${pitch.coldEmailSubject}

${pitch.coldEmailBody}

--- LINKEDIN INMAIL ---
${pitch.linkedInMessage}

--- 90-SECOND LOOM VIDEO WALKTHROUGH SCRIPT ---
${pitch.loomVideoScript}`;

  await updateProspect(id, {
    pitchScript: formattedScript,
    status:
      prospect.status === "sourced" || prospect.status === "audited" || prospect.status === "building_mvp"
        ? "pitch_ready"
        : prospect.status,
  });

  return pitch;
}

/**
 * Instant audit helper for the Project Hunter playground.
 */
export async function aiRunInstantHunterAudit(
  url: string,
  companyName?: string,
  industry?: string,
): Promise<ProjectAuditAnalysis> {
  await assertAdmin();
  return aiAuditProspectWebsite(url, companyName, industry);
}
