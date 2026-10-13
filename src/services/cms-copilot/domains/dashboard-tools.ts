import { Type } from "@google/genai";
import { getSummary } from "@/services/dashboard/actions";
import {
  applyMasterCvSyncPlan,
  auditAndGenerateMasterCvSyncPlan,
  getMasterCvStudioSnapshot,
  toggleProjectFeaturedOnCv,
  updateCvExecutiveHeader,
} from "@/services/master-cv/actions";
import type { ApplyMasterCvSyncInput } from "@/services/master-cv/types";
import type { CopilotToolExecutionResult } from "../types";

export const DASHBOARD_TOOL_DECLARATIONS = [
  {
    name: "get_cms_dashboard_summary",
    description:
      "Fetch complete high-level metrics and health status across all modules in Electric Obsidian CMS: blogs, projects, inbox leads, service requests, hire inquiries, drafts, upcoming interviews, availability slots, legal pages, and active system alerts.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  // Master CV Studio (/cms/master-cv)
  {
    name: "get_master_cv_studio_snapshot",
    description:
      "Retrieve the complete live snapshot of Master CV Studio (/cms/master-cv) and public /cv page: Executive Header & Professional Summary, published Work Experiences, Education, curated Featured Projects on /cv, published Skills, and active Second Brain knowledge items count.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "audit_master_cv_with_second_brain",
    description:
      "Run the Hub-and-Spoke AI Ecosystem Synthesizer in Master CV Studio (/cms/master-cv). Audits My Second Brain (ai_knowledge_items) against current Work Experiences, Portfolio Projects, and Skills to generate a non-destructive MasterCvSyncProposal (Alignment Score, Executive Headline & Bio upgrade, Google XYZ Experience bullet upgrades, Project ATS summary & featured curation, and Missing Skills extraction).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        focusPrompt: {
          type: Type.STRING,
          description:
            "Optional strategic focus instruction (e.g. 'Highlight autonomous AI agents, Next.js architecture, and high-scale distributed systems')",
        },
        categoryFilter: {
          type: Type.STRING,
          description:
            "Optional Second Brain category filter ('all', 'career-impact', 'tech-opinions', 'case-studies', 'technical', 'projects', etc.)",
        },
      },
    },
  },
  {
    name: "apply_master_cv_sync_plan",
    description:
      "Atomically apply approved Master CV upgrades across Executive Profile (Headline & Bio), Work Experience descriptions, Project CV summaries/featured flags, and newly extracted Skills, then revalidate /cv and /about.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        headline: {
          type: Type.STRING,
          description: "Optional new Executive Headline (ogTagline) to apply to /cv",
        },
        bio: {
          type: Type.STRING,
          description: "Optional new Professional Summary (bio) to apply to /cv",
        },
        experienceUpdates: {
          type: Type.ARRAY,
          description: "Array of Work Experience bullet description updates to apply",
          items: {
            type: Type.OBJECT,
            properties: {
              entryId: { type: Type.STRING, description: "Exact resume_entries ID" },
              description: {
                type: Type.STRING,
                description: "Polished multiline Google XYZ bullets starting with '- '",
              },
            },
            required: ["entryId", "description"],
          },
        },
        projectUpdates: {
          type: Type.ARRAY,
          description: "Array of Project CV summary and featured flag updates to apply",
          items: {
            type: Type.OBJECT,
            properties: {
              projectId: { type: Type.STRING, description: "Exact projects ID" },
              summary: { type: Type.STRING, description: "Updated concise ATS summary for /cv" },
              isFeatured: {
                type: Type.BOOLEAN,
                description: "Whether to feature this project in top 4 on /cv",
              },
            },
            required: ["projectId"],
          },
        },
        skillsToAdd: {
          type: Type.ARRAY,
          description: "Array of new skill names extracted from Second Brain/Projects to add",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Normalized skill name" },
              sortOrder: { type: Type.INTEGER, description: "Optional sort order (default: 10)" },
            },
            required: ["name"],
          },
        },
      },
    },
  },
  {
    name: "update_master_cv_executive_header",
    description:
      "Directly update the Executive Header & Professional Summary displayed at the top of /cv and the ATS Vector PDF (displayName, headline, bio, publicEmail, location).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        displayName: { type: Type.STRING, description: "Full name on CV (default: Wisman Nur)" },
        headline: {
          type: Type.STRING,
          description: "Executive Headline / Role Tagline on CV",
        },
        bio: {
          type: Type.STRING,
          description: "Professional Summary paragraph on CV",
        },
        publicEmail: { type: Type.STRING, description: "Optional public email on CV" },
        location: { type: Type.STRING, description: "Optional location on CV" },
      },
      required: ["displayName", "headline", "bio"],
    },
  },
  {
    name: "toggle_project_featured_on_cv",
    description:
      "Toggle whether a portfolio project is marked as Featured (isFeatured) so it appears in the Key Technical Projects section on /cv and the ATS Vector PDF.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        projectId: { type: Type.STRING, description: "Project ID to toggle" },
        isFeatured: {
          type: Type.BOOLEAN,
          description: "True to feature on /cv, false to unfeature",
        },
      },
      required: ["projectId", "isFeatured"],
    },
  },
];

export async function executeDashboardTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  switch (name) {
    case "get_cms_dashboard_summary": {
      const summary = await getSummary();
      return {
        success: true,
        data: summary,
      };
    }

    case "get_master_cv_studio_snapshot": {
      const snapshot = await getMasterCvStudioSnapshot();
      const publishedExperiences = snapshot.experiences.filter((e) => e.isPublished);
      const publishedEducation = snapshot.education.filter((e) => e.isPublished);
      const publishedProjects = snapshot.projects.filter((p) => p.isPublished);
      const featuredCvProjects = publishedProjects.filter((p) => p.isFeatured);
      const publishedSkills = snapshot.skills.filter((s) => s.isPublished);
      const activeBrainItems = snapshot.knowledgeItems.filter((k) => k.isPublished);

      return {
        success: true,
        data: {
          executiveHeader: {
            displayName: snapshot.user?.displayName || snapshot.settings.siteName || "Wisman Nur",
            headline: snapshot.settings.ogTagline,
            bio: snapshot.user?.bio || snapshot.settings.footerBio,
            publicEmail: snapshot.settings.publicEmail || snapshot.user?.email,
            location: snapshot.settings.location || snapshot.user?.location,
          },
          counts: {
            activeSecondBrainItems: activeBrainItems.length,
            publishedExperiences: publishedExperiences.length,
            publishedEducation: publishedEducation.length,
            featuredCvProjects: featuredCvProjects.length,
            totalPublishedProjects: publishedProjects.length,
            publishedSkills: publishedSkills.length,
          },
          experiences: publishedExperiences.map((e) => ({
            id: e.id,
            title: e.title,
            organization: e.organization,
            startDate: e.startDate,
            endDate: e.endDate,
            isCurrent: e.isCurrent,
            description: e.description,
          })),
          cvProjects: publishedProjects.slice(0, 6).map((p) => ({
            id: p.id,
            title: p.title,
            isFeatured: p.isFeatured,
            technologies: p.technologies,
            summary: p.summary,
          })),
          skills: publishedSkills.map((s) => ({
            id: s.id,
            name: s.name,
            sortOrder: s.sortOrder,
          })),
        },
      };
    }

    case "audit_master_cv_with_second_brain": {
      const focusPrompt = args.focusPrompt ? String(args.focusPrompt) : undefined;
      const categoryFilter = args.categoryFilter ? String(args.categoryFilter) : undefined;
      const proposal = await auditAndGenerateMasterCvSyncPlan({
        focusPrompt,
        categoryFilter,
      });

      return {
        success: true,
        message: `Audit Master CV selesai (Alignment Score: ${proposal.alignmentScore}%). Ditemukan ${proposal.experienceUpgrades.length} upgrade Experience, ${proposal.projectUpgrades.length} Project, dan ${proposal.missingSkills.length} Skill baru.`,
        data: proposal,
      };
    }

    case "apply_master_cv_sync_plan": {
      const payload: ApplyMasterCvSyncInput = {};
      if (args.headline || args.bio) {
        payload.updateExecutiveProfile = {
          headline: args.headline ? String(args.headline) : undefined,
          bio: args.bio ? String(args.bio) : undefined,
        };
      }
      if (Array.isArray(args.experienceUpdates)) {
        payload.experienceUpdates = (
          args.experienceUpdates as Array<{ entryId: string; description: string }>
        ).map((e) => ({
          entryId: String(e.entryId),
          description: String(e.description),
        }));
      }
      if (Array.isArray(args.projectUpdates)) {
        payload.projectUpdates = (
          args.projectUpdates as Array<{
            projectId: string;
            summary?: string;
            isFeatured?: boolean;
          }>
        ).map((p) => ({
          projectId: String(p.projectId),
          summary: p.summary ? String(p.summary) : undefined,
          isFeatured: p.isFeatured !== undefined ? Boolean(p.isFeatured) : undefined,
        }));
      }
      if (Array.isArray(args.skillsToAdd)) {
        payload.skillsToAdd = (
          args.skillsToAdd as Array<{ name: string; sortOrder?: number }>
        ).map((s) => ({
          name: String(s.name),
          sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : 10,
        }));
      }

      const result = await applyMasterCvSyncPlan(payload);
      return {
        success: true,
        message: `Perubahan Master CV berhasil diterapkan ke database dan /cv telah di-revalidate (Profile: ${result.updatedProfile ? "Updated" : "Unchanged"}, Experiences: ${result.updatedExperiencesCount}, Projects: ${result.updatedProjectsCount}, New Skills: ${result.addedSkillsCount}).`,
        data: result,
      };
    }

    case "update_master_cv_executive_header": {
      await updateCvExecutiveHeader({
        displayName: String(args.displayName || "Wisman Nur"),
        headline: String(args.headline),
        bio: String(args.bio),
        publicEmail: args.publicEmail !== undefined ? String(args.publicEmail) : undefined,
        location: args.location !== undefined ? String(args.location) : undefined,
      });

      return {
        success: true,
        message: "Executive Header & Professional Summary pada /cv berhasil diperbarui.",
        data: {
          displayName: args.displayName,
          headline: args.headline,
          bio: args.bio,
        },
      };
    }

    case "toggle_project_featured_on_cv": {
      const projectId = String(args.projectId);
      const isFeatured = Boolean(args.isFeatured);
      await toggleProjectFeaturedOnCv(projectId, isFeatured);

      return {
        success: true,
        message: `Project (ID: ${projectId}) ${isFeatured ? "ditambahkan ke" : "dihapus dari"} daftar Featured di /cv.`,
        data: { projectId, isFeatured },
      };
    }

    default:
      return null;
  }
}

