import { Type } from "@google/genai";
import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { CopilotToolExecutionResult } from "../types";
import {
  createProspect,
  updateProspect,
  deleteProspect,
  aiRunProspectAudit,
  aiGeneratePitch,
  aiRunInstantHunterAudit,
} from "../../project-finder/actions";
import type {
  NewProjectProspect,
  ProjectProspectStatus,
} from "../../project-finder/types";

const { projectProspects } = schema;

export const PROJECT_HUB_TOOL_DECLARATIONS = [
  {
    name: "get_project_tracker_analytics",
    description:
      "Fetch summary metrics and pipeline breakdown of client project prospects in Finder Project Hub (sourced, audited, building_mvp, pitch_ready, outreach_sent, negotiation, won, archived).",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "list_project_prospects",
    description:
      "Query project prospects/companies in Project Tracker & Project Hunter. Filter by pipeline status, industry, country, or search keyword.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description:
            "Filter status: sourced, audited, building_mvp, pitch_ready, outreach_sent, negotiation, won, archived, or all",
        },
        industry: {
          type: Type.STRING,
          description: "Optional industry filter (e.g. home_living, ecommerce, saas)",
        },
        country: {
          type: Type.STRING,
          description: "Optional country filter (e.g. Netherlands, Germany, Indonesia)",
        },
        search: {
          type: Type.STRING,
          description: "Search keyword matching company name, website, or contact name",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum prospects to return (default: 15)",
        },
      },
    },
  },
  {
    name: "get_project_prospect_detail",
    description:
      "Retrieve full details of a specific project prospect by ID including AI audit analysis, opportunity score, pitch script, demo URL, Loom video, and contact information.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "The prospect ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_project_prospect",
    description:
      "Create a new target company/prospect in Project Tracker & Project Hunter.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        companyName: {
          type: Type.STRING,
          description: "Name of the target company",
        },
        companyWebsite: {
          type: Type.STRING,
          description: "Target company website URL (e.g. https://example.com)",
        },
        industry: {
          type: Type.STRING,
          description: "Industry category (default: home_living)",
        },
        country: {
          type: Type.STRING,
          description: "Country of operation (default: Netherlands)",
        },
        city: {
          type: Type.STRING,
          description: "City or headquarters location",
        },
        timezone: {
          type: Type.STRING,
          description: "Timezone (default: Europe/Amsterdam)",
        },
        status: {
          type: Type.STRING,
          description:
            "Status: sourced, audited, building_mvp, pitch_ready, outreach_sent, negotiation, won, archived (default: sourced)",
        },
        estimatedRevenueTier: {
          type: Type.STRING,
          description: "Revenue tier estimate (e.g. '€1M - €5M')",
        },
        contactName: {
          type: Type.STRING,
          description: "Contact / decision maker name",
        },
        contactRole: {
          type: Type.STRING,
          description: "Role or title (e.g. 'Founder', 'Head of E-commerce')",
        },
        contactEmail: {
          type: Type.STRING,
          description: "Contact email address",
        },
        contactLinkedin: {
          type: Type.STRING,
          description: "Contact LinkedIn profile URL",
        },
        mvpDemoUrl: {
          type: Type.STRING,
          description: "Link to interactive MVP demo or prototype built for them",
        },
        loomVideoUrl: {
          type: Type.STRING,
          description: "Loom walkthrough recording URL",
        },
        notes: {
          type: Type.STRING,
          description: "Strategy notes, observations, or action items",
        },
      },
      required: ["companyName", "companyWebsite"],
    },
  },
  {
    name: "update_project_prospect",
    description:
      "Update any details, status, contact info, notes, or pitch URLs of an existing prospect in Project Tracker.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Prospect ID to update",
        },
        companyName: {
          type: Type.STRING,
          description: "Company name",
        },
        companyWebsite: {
          type: Type.STRING,
          description: "Company website URL",
        },
        industry: {
          type: Type.STRING,
          description: "Industry",
        },
        country: {
          type: Type.STRING,
          description: "Country",
        },
        city: {
          type: Type.STRING,
          description: "City",
        },
        timezone: {
          type: Type.STRING,
          description: "Timezone",
        },
        status: {
          type: Type.STRING,
          description:
            "Status: sourced, audited, building_mvp, pitch_ready, outreach_sent, negotiation, won, archived",
        },
        estimatedRevenueTier: {
          type: Type.STRING,
          description: "Revenue tier",
        },
        mvpDemoUrl: {
          type: Type.STRING,
          description: "MVP demo URL",
        },
        loomVideoUrl: {
          type: Type.STRING,
          description: "Loom video walkthrough URL",
        },
        pitchScript: {
          type: Type.STRING,
          description: "Pitch script content",
        },
        contactName: {
          type: Type.STRING,
          description: "Contact name",
        },
        contactRole: {
          type: Type.STRING,
          description: "Contact role",
        },
        contactEmail: {
          type: Type.STRING,
          description: "Contact email",
        },
        contactLinkedin: {
          type: Type.STRING,
          description: "Contact LinkedIn",
        },
        outreachStatus: {
          type: Type.STRING,
          description: "Outreach status",
        },
        notes: {
          type: Type.STRING,
          description: "Notes",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_project_prospect",
    description: "Permanently delete a prospect record from Project Tracker by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Prospect ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "run_project_prospect_audit",
    description:
      "Run an autonomous AI technical and UX audit on a saved prospect's website. Evaluates performance bottlenecks, mobile readiness, modernization potential, and stores the audit score & detailed findings.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Prospect ID to audit",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "generate_project_prospect_pitch",
    description:
      "Generate an executive AI modernization pitch pack for a prospect: personalized cold email, LinkedIn InMail message, and a 90-second Loom video walkthrough script, and updates the prospect status to 'pitch_ready'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Prospect ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "run_instant_project_hunter_audit",
    description:
      "Perform an on-demand AI site audit for any website URL entered in Project Hunter without persisting to database. Useful for quickly vetting prospective client targets.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: "Website URL to audit (e.g. https://www.example.com)",
        },
        companyName: {
          type: Type.STRING,
          description: "Company name (optional)",
        },
        industry: {
          type: Type.STRING,
          description: "Industry category (optional, e.g. 'home_living', 'ecommerce')",
        },
      },
      required: ["url"],
    },
  },
];

export async function executeProjectHubTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  const db = getDb();

  switch (name) {
    case "get_project_tracker_analytics": {
      const rows = await db.select().from(projectProspects);
      const statusCounts: Record<string, number> = {};
      let totalAuditScore = 0;
      let auditedCount = 0;

      for (const row of rows) {
        statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
        if (row.auditScore != null) {
          totalAuditScore += row.auditScore;
          auditedCount += 1;
        }
      }

      return {
        success: true,
        data: {
          totalProspects: rows.length,
          statusBreakdown: statusCounts,
          averageAuditScore: auditedCount > 0 ? Math.round(totalAuditScore / auditedCount) : null,
          auditedCount,
        },
      };
    }

    case "list_project_prospects": {
      const status = args.status as string | undefined;
      const industry = args.industry as string | undefined;
      const country = args.country as string | undefined;
      const search = args.search as string | undefined;
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 50) : 15;

      const conditions = [];
      if (status && status !== "all") {
        conditions.push(eq(projectProspects.status, status as ProjectProspectStatus));
      }
      if (industry && industry !== "all") {
        conditions.push(ilike(projectProspects.industry, `%${industry}%`));
      }
      if (country && country !== "all") {
        conditions.push(ilike(projectProspects.country, `%${country}%`));
      }
      if (search) {
        conditions.push(
          or(
            ilike(projectProspects.companyName, `%${search}%`),
            ilike(projectProspects.companyWebsite, `%${search}%`),
            ilike(projectProspects.contactName, `%${search}%`)
          )
        );
      }

      let query = db
        .select()
        .from(projectProspects)
        .orderBy(asc(projectProspects.sortOrder), desc(projectProspects.createdAt))
        .limit(limit);

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : (conditions[0] && conditions[1] ? or(...conditions) : conditions[0])) as typeof query;
      }

      const rows = await query;
      return {
        success: true,
        data: {
          count: rows.length,
          prospects: rows.map((p) => ({
            id: p.id,
            companyName: p.companyName,
            companyWebsite: p.companyWebsite,
            industry: p.industry,
            country: p.country,
            status: p.status,
            auditScore: p.auditScore,
            contactName: p.contactName,
            contactEmail: p.contactEmail,
            outreachStatus: p.outreachStatus,
            updatedAt: p.updatedAt,
          })),
        },
      };
    }

    case "get_project_prospect_detail": {
      const id = args.id as string;
      const [row] = await db
        .select()
        .from(projectProspects)
        .where(eq(projectProspects.id, id))
        .limit(1);

      if (!row) {
        return { success: false, error: `Prospect with ID '${id}' not found.` };
      }

      return {
        success: true,
        data: row,
      };
    }

    case "create_project_prospect": {
      const companyName = String(args.companyName || "").trim();
      const companyWebsite = String(args.companyWebsite || "").trim();

      const created = await createProspect({
        companyName,
        companyWebsite,
        industry: args.industry ? String(args.industry) : "home_living",
        country: args.country ? String(args.country) : "Netherlands",
        city: args.city ? String(args.city) : undefined,
        timezone: args.timezone ? String(args.timezone) : "Europe/Amsterdam",
        status: (args.status as ProjectProspectStatus) || "sourced",
        estimatedRevenueTier: args.estimatedRevenueTier ? String(args.estimatedRevenueTier) : undefined,
        contactName: args.contactName ? String(args.contactName) : undefined,
        contactRole: args.contactRole ? String(args.contactRole) : undefined,
        contactEmail: args.contactEmail ? String(args.contactEmail) : undefined,
        contactLinkedin: args.contactLinkedin ? String(args.contactLinkedin) : undefined,
        mvpDemoUrl: args.mvpDemoUrl ? String(args.mvpDemoUrl) : undefined,
        loomVideoUrl: args.loomVideoUrl ? String(args.loomVideoUrl) : undefined,
        notes: args.notes ? String(args.notes) : undefined,
      });

      return {
        success: true,
        message: `Project prospect '${created.companyName}' (${created.companyWebsite}) created successfully.`,
        data: created,
      };
    }

    case "update_project_prospect": {
      const id = args.id as string;
      const updates: Partial<NewProjectProspect> = {};

      if (args.companyName) updates.companyName = String(args.companyName).trim();
      if (args.companyWebsite) updates.companyWebsite = String(args.companyWebsite).trim();
      if (args.industry) updates.industry = String(args.industry).trim();
      if (args.country) updates.country = String(args.country).trim();
      if (args.city !== undefined) updates.city = args.city ? String(args.city).trim() : undefined;
      if (args.timezone) updates.timezone = String(args.timezone).trim();
      if (args.status) updates.status = args.status as ProjectProspectStatus;
      if (args.estimatedRevenueTier !== undefined)
        updates.estimatedRevenueTier = args.estimatedRevenueTier ? String(args.estimatedRevenueTier).trim() : undefined;
      if (args.mvpDemoUrl !== undefined) updates.mvpDemoUrl = args.mvpDemoUrl ? String(args.mvpDemoUrl).trim() : undefined;
      if (args.loomVideoUrl !== undefined) updates.loomVideoUrl = args.loomVideoUrl ? String(args.loomVideoUrl).trim() : undefined;
      if (args.pitchScript !== undefined) updates.pitchScript = args.pitchScript ? String(args.pitchScript).trim() : undefined;
      if (args.contactName !== undefined) updates.contactName = args.contactName ? String(args.contactName).trim() : undefined;
      if (args.contactRole !== undefined) updates.contactRole = args.contactRole ? String(args.contactRole).trim() : undefined;
      if (args.contactEmail !== undefined) updates.contactEmail = args.contactEmail ? String(args.contactEmail).trim() : undefined;
      if (args.contactLinkedin !== undefined) updates.contactLinkedin = args.contactLinkedin ? String(args.contactLinkedin).trim() : undefined;
      if (args.outreachStatus !== undefined) updates.outreachStatus = args.outreachStatus ? String(args.outreachStatus).trim() : undefined;
      if (args.notes !== undefined) updates.notes = args.notes ? String(args.notes).trim() : undefined;

      const updated = await updateProspect(id, updates);
      return {
        success: true,
        message: `Project prospect '${updated.companyName}' (ID: ${id}) updated successfully.`,
        data: updated,
      };
    }

    case "delete_project_prospect": {
      const id = args.id as string;
      const [existing] = await db
        .select({ companyName: projectProspects.companyName })
        .from(projectProspects)
        .where(eq(projectProspects.id, id))
        .limit(1);

      if (!existing) {
        return { success: false, error: `Prospect with ID '${id}' not found.` };
      }

      await deleteProspect(id);
      return {
        success: true,
        message: `Prospect '${existing.companyName}' (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    case "run_project_prospect_audit": {
      const id = args.id as string;
      const result = await aiRunProspectAudit(id);
      return {
        success: true,
        message: `AI audit for '${result.companyName}' completed with Opportunity Score ${result.auditScore}/100.`,
        data: {
          id: result.id,
          companyName: result.companyName,
          auditScore: result.auditScore,
          auditAnalysis: result.auditAnalysis,
          status: result.status,
        },
      };
    }

    case "generate_project_prospect_pitch": {
      const id = args.id as string;
      const pitch = await aiGeneratePitch(id);
      return {
        success: true,
        message: `Modernization pitch pack generated successfully for prospect ID '${id}'.`,
        data: pitch,
      };
    }

    case "run_instant_project_hunter_audit": {
      const url = String(args.url).trim();
      const companyName = args.companyName ? String(args.companyName).trim() : undefined;
      const industry = args.industry ? String(args.industry).trim() : undefined;

      const audit = await aiRunInstantHunterAudit(url, companyName, industry);
      return {
        success: true,
        message: `Instant audit completed for ${url}. Opportunity Score: ${audit.modernizationOpportunityScore}/100.`,
        data: audit,
      };
    }

    default:
      return null;
  }
}
