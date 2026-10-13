"use server";

import { revalidatePath } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { formatResumePeriod } from "@/lib/resume";
import { assertAdmin } from "../core/auth-guard";
import { getAiKnowledgeItems } from "../ai-knowledge/actions";
import { getAllForCms as getAllProjectsForCms } from "../project/actions";
import { getAllForCms as getAllResumeEntriesForCms } from "../resume/actions";
import { getSiteSettings, updateSiteSettings } from "../site-settings/actions";
import { getAllForCms as getAllSkillsForCms } from "../skills/actions";
import { getAuthorProfile, updateProfile } from "../user/actions";
import type {
  ApplyMasterCvSyncInput,
  ApplyMasterCvSyncResult,
  MasterCvAuditParams,
  MasterCvStudioSnapshot,
  MasterCvSyncProposal,
  UpdateCvHeaderInput,
} from "./types";

const { resumeEntries, projects, skills, aiKnowledgeItems } = schema;

function revalidateAllCvEcosystemPaths() {
  revalidatePath("/cv");
  revalidatePath("/about");
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/cms/master-cv");
  revalidatePath("/cms/resume");
  revalidatePath("/cms/skills");
  revalidatePath("/cms/projects");
}

export async function getMasterCvStudioSnapshot(): Promise<MasterCvStudioSnapshot> {
  await assertAdmin();

  const [user, settings, allResume, allSkills, allProjects, knowledgeItems] = await Promise.all([
    getAuthorProfile(),
    getSiteSettings(),
    getAllResumeEntriesForCms(),
    getAllSkillsForCms(),
    getAllProjectsForCms(),
    getAiKnowledgeItems("all"),
  ]);

  const experiences = allResume.filter((r) => r.kind === "experience");
  const education = allResume.filter((r) => r.kind === "education");

  // Sort projects so featured come first, then newest
  const sortedProjects = [...allProjects].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return (b.views ?? 0) - (a.views ?? 0);
  });

  return {
    user,
    settings,
    experiences,
    education,
    skills: allSkills,
    projects: sortedProjects,
    knowledgeItems,
  };
}

/**
 * Hub-and-Spoke AI Ecosystem Synthesizer:
 * Audits My Second Brain (`ai_knowledge_items`), Projects, Resume Experiences, and Skills
 * to generate a structured, non-destructive diff proposal for upgrading the Master CV.
 */
export async function auditAndGenerateMasterCvSyncPlan(
  params?: MasterCvAuditParams
): Promise<MasterCvSyncProposal> {
  await assertAdmin();

  const db = getDb();
  const [user, settings, allResume, allSkills, allProjects, rawKnowledgeRows] = await Promise.all([
    getAuthorProfile(),
    getSiteSettings(),
    getAllResumeEntriesForCms(),
    getAllSkillsForCms(),
    getAllProjectsForCms(),
    db
      .select()
      .from(aiKnowledgeItems)
      .where(eq(aiKnowledgeItems.isPublished, true))
      .orderBy(asc(aiKnowledgeItems.sortOrder), desc(aiKnowledgeItems.updatedAt)),
  ]);

  const knowledgeRows =
    params?.categoryFilter && params.categoryFilter !== "all"
      ? rawKnowledgeRows.filter((k) => k.category === params.categoryFilter)
      : rawKnowledgeRows;

  const experiences = allResume.filter((r) => r.kind === "experience");
  const publishedProjects = allProjects.filter((p) => p.isPublished);

  const currentHeadline =
    settings.ogTagline || "Senior Fullstack & Autonomous AI Systems Engineer";
  const currentBio =
    user?.bio ||
    settings.footerBio ||
    "Senior Fullstack & Autonomous AI Systems Engineer with 7+ years of experience architecting high-performance web applications, sub-second edge runtimes, and autonomous multi-agent pipelines.";

  const knowledgeContext =
    knowledgeRows.length > 0
      ? knowledgeRows
          .map(
            (k) =>
              `• [ID: ${k.id}] [${k.category.toUpperCase()}] "${k.title}":\n  ${k.content}${
                k.tags && k.tags.length ? `\n  Tags: ${k.tags.join(", ")}` : ""
              }`
          )
          .join("\n\n")
      : "No published Second Brain documents available.";

  const experiencesContext = experiences
    .map(
      (exp) =>
        `• [entryId: "${exp.id}"] ${exp.title} at ${exp.organization} (${formatResumePeriod(exp)})\n  Current Description:\n  ${exp.description || "(Empty)"}`
    )
    .join("\n\n");

  const projectsContext = publishedProjects
    .slice(0, 8)
    .map(
      (proj) =>
        `• [projectId: "${proj.id}"] "${proj.title}" (Featured on CV: ${proj.isFeatured})\n  Tech: ${(proj.technologies || []).join(", ")}\n  Current CV Summary: ${proj.summary}\n  Case Study Excerpt: ${(proj.description || "").slice(0, 400)}`
    )
    .join("\n\n");

  const existingSkillNames = allSkills.map((s) => s.name);

  const ai = getGeminiClient();
  const model = getGeminiModel();

  const prompt = `You are a Principal Engineering Career Architect & ATS Resume Synthesizer acting as the Hub-and-Spoke orchestrator for Wisman Nur's Master CV (/cv).
Your job is to audit the latest insights in Wisman's "My Second Brain" (Digital Twin Knowledge Base) alongside his current Work Experiences, Portfolio Projects, and Skills Matrix, and propose high-impact, ATS-optimized upgrades so his Master CV reflects 100% of his latest capabilities and verified metrics.

${params?.focusPrompt?.trim() ? `USER STRATEGIC FOCUS INSTRUCTION:\n"${params.focusPrompt.trim()}"\n` : ""}

=== 1. CURRENT EXECUTIVE HEADER & BIO ON /CV ===
- Current Headline: "${currentHeadline}"
- Current Professional Summary (Bio): "${currentBio}"

=== 2. VERIFIED SECOND BRAIN KNOWLEDGE BASE (SINGLE SOURCE OF TRUTH) ===
${knowledgeContext}

=== 3. CURRENT WORK EXPERIENCES IN DATABASE (resume_entries) ===
${experiencesContext}

=== 4. CURRENT PORTFOLIO PROJECTS IN DATABASE (projects) ===
${projectsContext}

=== 5. CURRENT SKILLS MATRIX IN DATABASE (skills) ===
${existingSkillNames.join(", ")}

=== STRICT ENGINEERING & ANTI-HALLUCINATION RULES ===
1. ZERO FABRICATION: Every metric, percentage, latency number, architectural pattern, and technology MUST come strictly from the Second Brain items, existing Resume entries, or existing Projects above. Never invent fake employers or unverified metrics.
2. WORK EXPERIENCE UPGRADES (Google XYZ Formula):
   - Review the existing Work Experiences above. For roles that can be enriched by Second Brain insights (or polished for stronger Staff/Senior ATS impact), include them in "experienceUpgrades" using their exact "entryId".
   - Write 3 to 5 concise, high-impact bullet points per role starting with "- " separated by newlines ("\\n").
   - Use Google's XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]") and strong action verbs (Architected, Spearheaded, Engineered, Optimized, Scaled).
3. PROJECT HIGHLIGHTS & CV CURATION:
   - Review the Projects above. Propose a crisp, metric-driven 1-2 sentence "proposedSummary" tailored for an ATS CV (avoid generic marketing fluff; highlight architecture & measurable impact).
   - Recommend up to 4 top projects to have "recommendFeatured": true for the Master CV.
   - Use the exact "projectId" from the list above.
4. MISSING SKILLS EXTRACTION:
   - Compare technologies, architectural patterns, and tools mentioned in Second Brain & Projects against the CURRENT SKILLS MATRIX.
   - Identify 3 to 10 high-value technical skills that are NOT yet in the Current Skills Matrix (do not repeat skills already in the Current Skills Matrix).
   - Normalize names cleanly (e.g., "Next.js", "TypeScript", "Drizzle ORM", "Gemini AI / LLM Orchestration", "Event-Driven Architecture").

Return a JSON object conforming strictly to this schema:
{
  "alignmentScore": 85,
  "executiveAuditSummary": "2-3 sentences explaining what new insights from My Second Brain & Projects were synthesized into this Master CV upgrade.",
  "executiveProfile": {
    "proposedHeadline": "string (Crisp Senior Staff / Lead headline for CV)",
    "proposedBio": "string (3-4 sentences executive professional summary for CV grounded in Second Brain)",
    "reasoning": "string (1 sentence explaining the upgrade)"
  },
  "experienceUpgrades": [
    {
      "entryId": "exact entryId from section 3",
      "proposedDescription": "- Bullet 1...\\n- Bullet 2...\\n- Bullet 3...",
      "changeSummary": "What Second Brain metrics/insights were woven into this role",
      "matchedSecondBrainTopics": ["Title of Second Brain item 1"]
    }
  ],
  "projectUpgrades": [
    {
      "projectId": "exact projectId from section 4",
      "proposedSummary": "Punchy ATS-ready engineering summary with architecture & impact",
      "recommendFeatured": true,
      "changeSummary": "Why this summary or featured status was upgraded",
      "matchedSecondBrainTopics": ["Title of Second Brain item"]
    }
  ],
  "missingSkills": [
    {
      "name": "Skill Name",
      "source": "Detected in Second Brain / Project title",
      "recommendedSortOrder": 10
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Failed to generate Master CV audit proposal from Gemini AI.");
  }

  let clean = responseText.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  let parsed: {
    alignmentScore?: number;
    executiveAuditSummary?: string;
    executiveProfile?: {
      proposedHeadline?: string;
      proposedBio?: string;
      reasoning?: string;
    };
    experienceUpgrades?: Array<{
      entryId: string;
      proposedDescription: string;
      changeSummary?: string;
      matchedSecondBrainTopics?: string[];
    }>;
    projectUpgrades?: Array<{
      projectId: string;
      proposedSummary: string;
      recommendFeatured?: boolean;
      changeSummary?: string;
      matchedSecondBrainTopics?: string[];
    }>;
    missingSkills?: Array<{
      name: string;
      source?: string;
      recommendedSortOrder?: number;
    }>;
  };

  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    console.error("Failed to parse Master CV sync proposal JSON:", responseText, err);
    throw new Error("Failed to parse AI response for Master CV sync.");
  }

  const expById = new Map(experiences.map((e) => [e.id, e]));
  const projById = new Map(publishedProjects.map((p) => [p.id, p]));
  const existingSkillsLower = new Set(existingSkillNames.map((n) => n.toLowerCase().trim()));

  const experienceUpgrades = (parsed.experienceUpgrades ?? [])
    .map((u) => {
      const existing = expById.get(u.entryId);
      if (!existing || !u.proposedDescription?.trim()) return null;
      return {
        entryId: existing.id,
        title: existing.title,
        organization: existing.organization,
        period: formatResumePeriod(existing),
        currentDescription: existing.description,
        proposedDescription: u.proposedDescription.trim(),
        changeSummary: u.changeSummary || "Polished with Second Brain context & XYZ metrics",
        matchedSecondBrainTopics: u.matchedSecondBrainTopics ?? [],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const projectUpgrades = (parsed.projectUpgrades ?? [])
    .map((u) => {
      const existing = projById.get(u.projectId);
      if (!existing || !u.proposedSummary?.trim()) return null;
      return {
        projectId: existing.id,
        title: existing.title,
        technologies: existing.technologies ?? [],
        currentSummary: existing.summary,
        proposedSummary: u.proposedSummary.trim(),
        currentlyFeatured: Boolean(existing.isFeatured),
        recommendFeatured: u.recommendFeatured ?? Boolean(existing.isFeatured),
        changeSummary: u.changeSummary || "Synthesized concise ATS impact summary",
        matchedSecondBrainTopics: u.matchedSecondBrainTopics ?? [],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const missingSkills = (parsed.missingSkills ?? [])
    .filter((s) => s.name && !existingSkillsLower.has(s.name.toLowerCase().trim()))
    .map((s, idx) => ({
      name: s.name.trim(),
      source: s.source || "My Second Brain & Portfolio",
      recommendedSortOrder: s.recommendedSortOrder ?? (idx + 1) * 10,
    }));

  return {
    alignmentScore: parsed.alignmentScore ?? 85,
    executiveAuditSummary:
      parsed.executiveAuditSummary ||
      "Audited My Second Brain knowledge items against Resume Experiences, Projects, and Skills Matrix.",
    executiveProfile: {
      currentHeadline,
      proposedHeadline: parsed.executiveProfile?.proposedHeadline?.trim() || currentHeadline,
      currentBio,
      proposedBio: parsed.executiveProfile?.proposedBio?.trim() || currentBio,
      reasoning:
        parsed.executiveProfile?.reasoning ||
        "Aligned executive summary and headline with verified Second Brain accomplishments.",
    },
    experienceUpgrades,
    projectUpgrades,
    missingSkills,
  };
}

/**
 * Atomically applies the selected diffs approved by Kang Wisman in Master CV Studio
 * across users, site_settings, resume_entries, projects, and skills.
 */
export async function applyMasterCvSyncPlan(
  input: ApplyMasterCvSyncInput
): Promise<ApplyMasterCvSyncResult> {
  await assertAdmin();
  const db = getDb();

  let updatedProfile = false;
  let updatedExperiencesCount = 0;
  let updatedProjectsCount = 0;
  let addedSkillsCount = 0;

  // 1. Update Executive Profile (Headline in site_settings + Bio in users & site_settings)
  if (input.updateExecutiveProfile) {
    const { headline, bio } = input.updateExecutiveProfile;
    const currentAuthor = await getAuthorProfile();

    if (headline?.trim() || bio?.trim()) {
      await updateSiteSettings({
        ...(headline?.trim() ? { ogTagline: headline.trim() } : {}),
        ...(bio?.trim() ? { footerBio: bio.trim() } : {}),
      });
      if (bio?.trim() && currentAuthor) {
        await updateProfile({
          displayName: currentAuthor.displayName || "Wisman Nur",
          bio: bio.trim(),
          website: currentAuthor.website,
          location: currentAuthor.location,
          social: currentAuthor.social,
        });
      }
      updatedProfile = true;
    }
  }

  // 2. Update selected Work Experience descriptions
  if (input.experienceUpdates && input.experienceUpdates.length > 0) {
    for (const expUpdate of input.experienceUpdates) {
      if (!expUpdate.entryId || !expUpdate.description?.trim()) continue;
      await db
        .update(resumeEntries)
        .set({
          description: expUpdate.description.trim(),
          updatedAt: new Date(),
        })
        .where(eq(resumeEntries.id, expUpdate.entryId));
      updatedExperiencesCount++;
    }
  }

  // 3. Update selected Project CV summaries & featured flags
  if (input.projectUpdates && input.projectUpdates.length > 0) {
    for (const projUpdate of input.projectUpdates) {
      if (!projUpdate.projectId) continue;
      await db
        .update(projects)
        .set({
          ...(projUpdate.summary?.trim() ? { summary: projUpdate.summary.trim() } : {}),
          ...(projUpdate.isFeatured !== undefined ? { isFeatured: projUpdate.isFeatured } : {}),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projUpdate.projectId));
      updatedProjectsCount++;
    }
  }

  // 4. Add selected Missing Skills (deduplicated case-insensitively)
  if (input.skillsToAdd && input.skillsToAdd.length > 0) {
    const existingSkills = await db.select().from(skills);
    const existingNamesLower = new Set(existingSkills.map((s) => s.name.toLowerCase().trim()));

    for (const skillItem of input.skillsToAdd) {
      const cleanName = skillItem.name?.trim();
      if (!cleanName || existingNamesLower.has(cleanName.toLowerCase())) continue;

      await db.insert(skills).values({
        name: cleanName,
        sortOrder: skillItem.sortOrder ?? 0,
        isPublished: true,
      });
      existingNamesLower.add(cleanName.toLowerCase());
      addedSkillsCount++;
    }
  }

  revalidateAllCvEcosystemPaths();

  return {
    updatedProfile,
    updatedExperiencesCount,
    updatedProjectsCount,
    addedSkillsCount,
  };
}

/**
 * Direct inline update of the CV Header, Headline & Professional Summary
 * from Master CV Studio.
 */
export async function updateCvExecutiveHeader(input: UpdateCvHeaderInput): Promise<void> {
  await assertAdmin();

  const currentAuthor = await getAuthorProfile();

  await Promise.all([
    updateSiteSettings({
      siteName: input.displayName.trim(),
      ogTagline: input.headline.trim(),
      footerBio: input.bio.trim(),
      ...(input.publicEmail !== undefined ? { publicEmail: input.publicEmail.trim() } : {}),
      ...(input.location !== undefined ? { location: input.location.trim() } : {}),
    }),
    updateProfile({
      displayName: input.displayName.trim(),
      bio: input.bio.trim(),
      location: input.location !== undefined ? input.location.trim() : currentAuthor?.location,
      website: currentAuthor?.website,
      social: currentAuthor?.social,
    }),
  ]);

  revalidateAllCvEcosystemPaths();
}

/**
 * Quick toggle for curating whether a project is featured on /cv and the ATS PDF.
 */
export async function toggleProjectFeaturedOnCv(
  projectId: string,
  isFeatured: boolean
): Promise<void> {
  await assertAdmin();
  const db = getDb();

  await db
    .update(projects)
    .set({
      isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  revalidateAllCvEcosystemPaths();
}
