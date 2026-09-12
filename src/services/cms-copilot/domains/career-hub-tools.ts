import { Type } from "@google/genai";
import { revalidatePath } from "next/cache";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { CopilotToolExecutionResult } from "../types";
import type {
  InterviewStageType,
  InterviewStatus,
  JobApplicationStatus,
  JobPlatform,
  WorkplaceType,
} from "../../job-tracker/types";
import {
  fetchDirectAtsJobs,
  getTargetCompanies,
  saveTargetCompany,
  deleteTargetCompany,
} from "../../job-discovery/ats-direct/actions";
import { fetchWorldwideTechJobs } from "../../job-discovery/actions";
import type { AtsPlatform } from "../../job-discovery/ats-direct/types";
import {
  getJobOutreaches,
  getJobOutreachById,
  createJobOutreach,
  updateJobOutreach,
  deleteJobOutreach,
  getOutreachAnalytics,
} from "../../job-outreaches/actions";
import type { OutreachStatus, OutreachType } from "../../job-outreaches/types";
import {
  deleteApplication,
  createInterview,
  updateInterview,
  deleteInterview,
  updateApplication,
} from "../../job-tracker/actions";

const { jobApplications, jobInterviews } = schema;

export const CAREER_HUB_TOOL_DECLARATIONS = [
  {
    name: "get_career_hub_analytics",
    description:
      "Fetch summary statistics of job applications, breakdown by status, and upcoming scheduled interviews in Career Hub.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "list_job_applications",
    description:
      "Query job applications from Career Hub. Filter by status (e.g., 'applied', 'interview_tech', 'offering') or search term (company or title).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description:
            "Filter status: wishlist, applied, screening, interview_hr, interview_tech, interview_user, offering, accepted, rejected, withdrawn, ghosted, or all",
        },
        search: {
          type: Type.STRING,
          description: "Search keyword matching company name or job title",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum number of items to return (default: 15)",
        },
      },
    },
  },
  {
    name: "get_job_application_detail",
    description: "Retrieve comprehensive details for a specific job application by its ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "The unique job application ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_job_application",
    description:
      "Create a new job application record in Career Hub. Always provide companyName and jobTitle.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        companyName: {
          type: Type.STRING,
          description: "Name of the target company",
        },
        jobTitle: {
          type: Type.STRING,
          description: "Target job title / role",
        },
        platform: {
          type: Type.STRING,
          description:
            "Job platform: linkedin, glints, jobstreet, indeed, glassdoor, kalibrr, wellfound, direct, referral, other",
        },
        workplaceType: {
          type: Type.STRING,
          description: "Workplace setup: remote, hybrid, onsite",
        },
        status: {
          type: Type.STRING,
          description:
            "Initial status: wishlist, applied, screening, interview_hr, interview_tech, interview_user, offering",
        },
        jobUrl: {
          type: Type.STRING,
          description: "Link to the job posting",
        },
        location: {
          type: Type.STRING,
          description: "Job location (city/country)",
        },
        salaryMin: {
          type: Type.NUMBER,
          description: "Minimum salary estimation",
        },
        salaryMax: {
          type: Type.NUMBER,
          description: "Maximum salary estimation",
        },
        notes: {
          type: Type.STRING,
          description: "Initial notes, highlights, or key tech requirements",
        },
      },
      required: ["companyName", "jobTitle"],
    },
  },
  {
    name: "update_job_application_status",
    description:
      "Update the status pipeline of an existing job application (e.g., move to interview_tech, offering, rejected).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "The job application ID to update",
        },
        status: {
          type: Type.STRING,
          description:
            "New status: wishlist, applied, screening, interview_hr, interview_tech, interview_user, offering, accepted, rejected, withdrawn, ghosted",
        },
        notes: {
          type: Type.STRING,
          description: "Optional log or notes describing what happened in this update",
        },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "update_job_application_notes",
    description: "Add or update notes and follow-up date for a job application.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "The job application ID",
        },
        notes: {
          type: Type.STRING,
          description: "Detailed notes to set or append",
        },
        followUpDate: {
          type: Type.STRING,
          description: "Follow up date string (ISO format or YYYY-MM-DD)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "update_job_application",
    description:
      "Update details of an existing job application (companyName, jobTitle, platform, workplaceType, status, jobUrl, location, salaryMin, salaryMax, notes).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "The job application ID to update",
        },
        companyName: {
          type: Type.STRING,
          description: "Target company name",
        },
        jobTitle: {
          type: Type.STRING,
          description: "Job title / role",
        },
        platform: {
          type: Type.STRING,
          description:
            "Platform: linkedin, glints, jobstreet, indeed, glassdoor, kalibrr, wellfound, direct, referral, other",
        },
        workplaceType: {
          type: Type.STRING,
          description: "Workplace setup: remote, hybrid, onsite",
        },
        status: {
          type: Type.STRING,
          description:
            "Status: wishlist, applied, screening, interview_hr, interview_tech, interview_user, offering, accepted, rejected, withdrawn, ghosted",
        },
        jobUrl: {
          type: Type.STRING,
          description: "Job link URL",
        },
        location: {
          type: Type.STRING,
          description: "Location",
        },
        salaryMin: {
          type: Type.NUMBER,
          description: "Minimum salary",
        },
        salaryMax: {
          type: Type.NUMBER,
          description: "Maximum salary",
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
    name: "delete_job_application",
    description:
      "Permanently delete a job application from Career Hub by ID. Also removes any linked interviews.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Job application ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_job_interviews",
    description:
      "List scheduled or past job interviews in Career Hub. Can filter by applicationId or status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        applicationId: {
          type: Type.STRING,
          description: "Filter by specific job application ID",
        },
        status: {
          type: Type.STRING,
          description: "Filter status: scheduled, completed, passed, failed, cancelled, or all",
        },
        limit: {
          type: Type.INTEGER,
          description: "Max interviews to return (default: 10)",
        },
      },
    },
  },
  {
    name: "create_job_interview",
    description: "Schedule a new interview round for an application in Career Hub.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        applicationId: {
          type: Type.STRING,
          description: "Target job application ID",
        },
        title: {
          type: Type.STRING,
          description: "Interview round title (e.g. 'Technical Interview with Lead Engineer')",
        },
        stageType: {
          type: Type.STRING,
          description:
            "Stage: hr_screening, technical_interview, live_coding, take_home_test, user_interview, system_design, final_leadership, offering_discussion, other",
        },
        scheduledAt: {
          type: Type.STRING,
          description: "Scheduled date-time in ISO format (e.g. 2026-09-15T10:00:00Z)",
        },
        meetingLink: {
          type: Type.STRING,
          description: "Meeting URL (Zoom, Google Meet, Teams)",
        },
        interviewers: {
          type: Type.STRING,
          description: "Names or titles of interviewers",
        },
        notes: {
          type: Type.STRING,
          description: "Preparation notes",
        },
      },
      required: ["applicationId", "title", "stageType", "scheduledAt"],
    },
  },
  {
    name: "update_job_interview",
    description: "Update interview status, debrief feedback, or notes in Career Hub.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Interview ID",
        },
        status: {
          type: Type.STRING,
          description: "New status: scheduled, completed, passed, failed, cancelled",
        },
        feedback: {
          type: Type.STRING,
          description: "Interview debrief feedback or performance evaluation",
        },
        notes: {
          type: Type.STRING,
          description: "Additional notes",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_job_interview",
    description: "Permanently delete an interview session record by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Interview ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "search_job_hunter_feed",
    description:
      "Search and fetch live remote/tech jobs from the Direct ATS Hub (Ashby, Greenhouse, Lever feeds) across company targets.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        platform: {
          type: Type.STRING,
          description: "Filter platform: ashby, greenhouse, lever, or all",
        },
        query: {
          type: Type.STRING,
          description: "Role title or keyword to filter (e.g. 'Senior', 'Golang', 'Backend', 'Staff')",
        },
        limit: {
          type: Type.INTEGER,
          description: "Maximum jobs to return (default: 10)",
        },
      },
    },
  },
  {
    name: "list_target_companies",
    description:
      "List companies configured for direct ATS tracking (Ashby, Greenhouse, Lever).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        platform: {
          type: Type.STRING,
          description: "Filter: ashby, greenhouse, lever, or all",
        },
      },
    },
  },
  {
    name: "save_target_company",
    description: "Add or update an ATS target company for automated job hunting.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "Company name",
        },
        platform: {
          type: Type.STRING,
          description: "ATS platform: greenhouse, lever, ashby",
        },
        slug: {
          type: Type.STRING,
          description: "Company slug on ATS board (e.g. 'stripe', 'datadog')",
        },
        websiteUrl: {
          type: Type.STRING,
          description: "Company website URL",
        },
      },
      required: ["name", "platform", "slug"],
    },
  },
  {
    name: "delete_target_company",
    description: "Remove an ATS target company from Job Hunter by its ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Target company record ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "search_worldwide_jobs",
    description:
      "Search worldwide tech jobs across global tech boards (RemoteOK, Jobicy, Arbeitnow).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Job keyword / tech stack (e.g. 'Fullstack', 'Golang', 'React')",
        },
        limit: {
          type: Type.INTEGER,
          description: "Max results to return (default: 10)",
        },
      },
    },
  },
  {
    name: "get_outreach_analytics",
    description:
      "Get analytics of cold pitches & outreach campaigns (drafts, sent, follow-ups due, replied, converted).",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "list_job_outreaches",
    description:
      "Query cold pitches and job outreach records in Career Hub. Filter by status, type, or search keyword.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Status: draft, sent, follow_up_due, replied, converted, closed, or all",
        },
        type: {
          type: Type.STRING,
          description: "Type: cold_pitch, direct_apply, follow_up, or all",
        },
        search: {
          type: Type.STRING,
          description: "Search keyword matching company, job title, or contact name",
        },
        limit: {
          type: Type.INTEGER,
          description: "Max results (default: 10)",
        },
      },
    },
  },
  {
    name: "get_job_outreach_detail",
    description:
      "Get full details of a specific job outreach including message history and recipient info.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Outreach record ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_job_outreach",
    description: "Create a new cold pitch or job outreach campaign record.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        companyName: {
          type: Type.STRING,
          description: "Target company name",
        },
        jobTitle: {
          type: Type.STRING,
          description: "Target position / role",
        },
        contactName: {
          type: Type.STRING,
          description: "Recipient name (recruiter, hiring manager)",
        },
        contactEmail: {
          type: Type.STRING,
          description: "Recipient email address",
        },
        subject: {
          type: Type.STRING,
          description: "Email subject line",
        },
        body: {
          type: Type.STRING,
          description: "Pitch body text (markdown / plain text)",
        },
        contactRole: {
          type: Type.STRING,
          description: "Role of the contact (e.g. 'Engineering Director')",
        },
        outreachType: {
          type: Type.STRING,
          description: "cold_pitch, direct_apply, follow_up (default: cold_pitch)",
        },
        jobApplicationId: {
          type: Type.STRING,
          description: "Optional linked job application ID",
        },
        notes: {
          type: Type.STRING,
          description: "Internal notes or follow-up strategy",
        },
      },
      required: ["companyName", "jobTitle", "contactName", "contactEmail", "subject", "body"],
    },
  },
  {
    name: "update_job_outreach_status",
    description: "Update the status of an outreach record (e.g. replied, converted, closed).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Outreach ID",
        },
        status: {
          type: Type.STRING,
          description: "New status: draft, sent, follow_up_due, replied, converted, closed",
        },
        notes: {
          type: Type.STRING,
          description: "Optional update notes",
        },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "update_job_outreach",
    description:
      "Update any fields of a job outreach campaign (companyName, jobTitle, contactName, contactEmail, contactRole, subject, body, status, outreachType, notes).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Outreach record ID",
        },
        companyName: {
          type: Type.STRING,
          description: "Company name",
        },
        jobTitle: {
          type: Type.STRING,
          description: "Target role title",
        },
        contactName: {
          type: Type.STRING,
          description: "Recipient name",
        },
        contactEmail: {
          type: Type.STRING,
          description: "Recipient email",
        },
        contactRole: {
          type: Type.STRING,
          description: "Recipient role",
        },
        subject: {
          type: Type.STRING,
          description: "Subject line",
        },
        body: {
          type: Type.STRING,
          description: "Pitch body text",
        },
        status: {
          type: Type.STRING,
          description: "Status: draft, sent, follow_up_due, replied, converted, closed",
        },
        outreachType: {
          type: Type.STRING,
          description: "cold_pitch, direct_apply, follow_up",
        },
        notes: {
          type: Type.STRING,
          description: "Internal notes",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_job_outreach",
    description: "Permanently delete an outreach record and its thread messages.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Outreach record ID to delete",
        },
      },
      required: ["id"],
    },
  },
];

export async function executeCareerHubTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  const db = getDb();

  switch (name) {
    case "get_career_hub_analytics": {
      const apps = await db.select().from(jobApplications);
      const interviews = await db
        .select()
        .from(jobInterviews)
        .orderBy(desc(jobInterviews.scheduledAt))
        .limit(5);

      const statusCounts: Record<string, number> = {};
      for (const app of apps) {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      }

      const outreachStats = await getOutreachAnalytics().catch(() => null);

      return {
        success: true,
        data: {
          totalApplications: apps.length,
          statusBreakdown: statusCounts,
          recentInterviews: interviews.map((i) => ({
            id: i.id,
            title: i.title,
            stageType: i.stageType,
            scheduledAt: i.scheduledAt,
            status: i.status,
          })),
          outreachSummary: outreachStats,
        },
      };
    }

    case "list_job_applications": {
      const status = args.status as string | undefined;
      const search = args.search as string | undefined;
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 50) : 15;

      const conditions = [];
      if (status && status !== "all") {
        conditions.push(eq(jobApplications.status, status as JobApplicationStatus));
      }
      if (search) {
        conditions.push(
          or(
            ilike(jobApplications.companyName, `%${search}%`),
            ilike(jobApplications.jobTitle, `%${search}%`)
          )
        );
      }

      let query = db
        .select({
          id: jobApplications.id,
          companyName: jobApplications.companyName,
          jobTitle: jobApplications.jobTitle,
          platform: jobApplications.platform,
          workplaceType: jobApplications.workplaceType,
          status: jobApplications.status,
          appliedAt: jobApplications.appliedAt,
          salaryMin: jobApplications.salaryMin,
          salaryMax: jobApplications.salaryMax,
          salaryCurrency: jobApplications.salaryCurrency,
          updatedAt: jobApplications.updatedAt,
        })
        .from(jobApplications)
        .orderBy(desc(jobApplications.updatedAt))
        .limit(limit);

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as typeof query;
      }

      const results = await query;
      return {
        success: true,
        data: {
          count: results.length,
          applications: results,
        },
      };
    }

    case "get_job_application_detail": {
      const id = args.id as string;
      const [app] = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, id))
        .limit(1);

      if (!app) {
        return { success: false, error: `Job application with ID '${id}' not found.` };
      }

      const interviews = await db
        .select()
        .from(jobInterviews)
        .where(eq(jobInterviews.applicationId, id))
        .orderBy(desc(jobInterviews.scheduledAt));

      return {
        success: true,
        data: {
          application: app,
          interviews,
        },
      };
    }

    case "create_job_application": {
      const companyName = String(args.companyName || "").trim();
      const jobTitle = String(args.jobTitle || "").trim();
      const platform = (args.platform as JobPlatform) || "linkedin";
      const workplaceType = (args.workplaceType as WorkplaceType) || "remote";
      const status = (args.status as JobApplicationStatus) || "wishlist";
      const jobUrl = args.jobUrl ? String(args.jobUrl) : null;
      const location = args.location ? String(args.location) : null;
      const salaryMin = typeof args.salaryMin === "number" ? args.salaryMin : null;
      const salaryMax = typeof args.salaryMax === "number" ? args.salaryMax : null;
      const notes = args.notes ? String(args.notes) : null;

      const [{ id }] = await db
        .insert(jobApplications)
        .values({
          companyName,
          jobTitle,
          platform,
          workplaceType,
          jobType: "full_time",
          status,
          jobUrl,
          location,
          salaryMin,
          salaryMax,
          salaryCurrency: "IDR",
          salaryPeriod: "monthly",
          notes,
          appliedAt: status === "applied" ? new Date() : null,
        })
        .returning({ id: jobApplications.id });

      revalidatePath("/cms/job-tracker");

      return {
        success: true,
        message: `Job application for '${jobTitle}' at '${companyName}' created successfully.`,
        data: { id, companyName, jobTitle, status },
      };
    }

    case "update_job_application_status": {
      const id = args.id as string;
      const newStatus = args.status as JobApplicationStatus;
      const notes = args.notes as string | undefined;

      const [existing] = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, id))
        .limit(1);

      if (!existing) {
        return { success: false, error: `Job application with ID '${id}' not found.` };
      }

      const updatedNotes = notes
        ? existing.notes
          ? `${existing.notes}\n\n[Status Updated to ${newStatus}]: ${notes}`
          : `[Status Updated to ${newStatus}]: ${notes}`
        : existing.notes;

      await db
        .update(jobApplications)
        .set({
          status: newStatus,
          notes: updatedNotes,
          appliedAt:
            newStatus === "applied" && !existing.appliedAt ? new Date() : existing.appliedAt,
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, id));

      revalidatePath("/cms/job-tracker");
      revalidatePath(`/cms/job-tracker/${id}`);

      return {
        success: true,
        message: `Status of '${existing.jobTitle}' at '${existing.companyName}' updated to '${newStatus}'.`,
        data: { id, oldStatus: existing.status, newStatus },
      };
    }

    case "update_job_application_notes": {
      const id = args.id as string;
      const notes = args.notes as string | undefined;
      const followUpDate = args.followUpDate ? new Date(args.followUpDate as string) : undefined;

      const [existing] = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, id))
        .limit(1);

      if (!existing) {
        return { success: false, error: `Job application with ID '${id}' not found.` };
      }

      await db
        .update(jobApplications)
        .set({
          ...(notes ? { notes } : {}),
          ...(followUpDate ? { followUpDate } : {}),
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, id));

      revalidatePath("/cms/job-tracker");
      revalidatePath(`/cms/job-tracker/${id}`);

      return {
        success: true,
        message: `Notes for '${existing.jobTitle}' at '${existing.companyName}' updated successfully.`,
      };
    }

    case "update_job_application": {
      const id = args.id as string;
      const [existing] = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, id))
        .limit(1);

      if (!existing) {
        return { success: false, error: `Job application with ID '${id}' not found.` };
      }

      const updateData: Record<string, unknown> = {};
      if (args.companyName) updateData.companyName = String(args.companyName).trim();
      if (args.jobTitle) updateData.jobTitle = String(args.jobTitle).trim();
      if (args.platform) updateData.platform = args.platform as JobPlatform;
      if (args.workplaceType) updateData.workplaceType = args.workplaceType as WorkplaceType;
      if (args.status) updateData.status = args.status as JobApplicationStatus;
      if (args.jobUrl !== undefined) updateData.jobUrl = args.jobUrl ? String(args.jobUrl) : null;
      if (args.location !== undefined) updateData.location = args.location ? String(args.location) : null;
      if (args.salaryMin !== undefined) updateData.salaryMin = typeof args.salaryMin === "number" ? args.salaryMin : null;
      if (args.salaryMax !== undefined) updateData.salaryMax = typeof args.salaryMax === "number" ? args.salaryMax : null;
      if (args.notes !== undefined) updateData.notes = args.notes ? String(args.notes) : null;

      await updateApplication(id, updateData);

      return {
        success: true,
        message: `Job application for '${updateData.jobTitle || existing.jobTitle}' at '${updateData.companyName || existing.companyName}' updated successfully.`,
        data: { id, ...updateData },
      };
    }

    case "delete_job_application": {
      const id = args.id as string;
      const [existing] = await db
        .select({ companyName: jobApplications.companyName, jobTitle: jobApplications.jobTitle })
        .from(jobApplications)
        .where(eq(jobApplications.id, id))
        .limit(1);

      if (!existing) {
        return { success: false, error: `Job application with ID '${id}' not found.` };
      }

      await deleteApplication(id);

      return {
        success: true,
        message: `Job application for '${existing.jobTitle}' at '${existing.companyName}' (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    case "list_job_interviews": {
      const applicationId = args.applicationId as string | undefined;
      const status = args.status as string | undefined;
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 50) : 10;

      const conditions = [];
      if (applicationId) {
        conditions.push(eq(jobInterviews.applicationId, applicationId));
      }
      if (status && status !== "all") {
        conditions.push(eq(jobInterviews.status, status as InterviewStatus));
      }

      let query = db
        .select()
        .from(jobInterviews)
        .orderBy(desc(jobInterviews.scheduledAt))
        .limit(limit);

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as typeof query;
      }

      const rows = await query;
      return {
        success: true,
        data: {
          count: rows.length,
          interviews: rows,
        },
      };
    }

    case "create_job_interview": {
      const applicationId = args.applicationId as string;
      const title = args.title as string;
      const stageType = args.stageType as InterviewStageType;
      const scheduledAt = new Date(args.scheduledAt as string);

      const id = await createInterview({
        applicationId,
        title,
        stageType,
        scheduledAt,
        meetingLink: args.meetingLink ? String(args.meetingLink) : undefined,
        interviewers: args.interviewers ? String(args.interviewers) : undefined,
        notes: args.notes ? String(args.notes) : undefined,
        status: "scheduled",
      });

      return {
        success: true,
        message: `Interview '${title}' scheduled successfully.`,
        data: { id, applicationId, title, scheduledAt },
      };
    }

    case "update_job_interview": {
      const id = args.id as string;
      const status = args.status as InterviewStatus | undefined;
      const feedback = args.feedback as string | undefined;
      const notes = args.notes as string | undefined;

      await updateInterview(id, {
        ...(status ? { status } : {}),
        ...(feedback ? { feedback } : {}),
        ...(notes ? { notes } : {}),
      });

      return {
        success: true,
        message: `Interview (ID: ${id}) updated successfully.`,
      };
    }

    case "delete_job_interview": {
      const id = args.id as string;
      await deleteInterview(id);
      return {
        success: true,
        message: `Interview (ID: ${id}) deleted successfully.`,
      };
    }

    case "search_job_hunter_feed": {
      const platform = args.platform as AtsPlatform | "all" | undefined;
      const query = (args.query as string | undefined)?.toLowerCase();
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 25) : 10;

      const res = await fetchDirectAtsJobs({
        platform: platform || "all",
      });

      let jobs = res.jobs || [];
      if (query) {
        jobs = jobs.filter(
          (j) =>
            j.title.toLowerCase().includes(query) ||
            j.companyName.toLowerCase().includes(query) ||
            j.matchedSkills?.some((s) => s.toLowerCase().includes(query))
        );
      }

      const topJobs = jobs.slice(0, limit);
      return {
        success: true,
        data: {
          totalMatching: jobs.length,
          sampleResults: topJobs.map((j) => ({
            title: j.title,
            company: j.companyName,
            platform: j.source,
            location: j.location,
            matchScore: j.matchScore,
            salarySnippet: j.salary,
            url: j.jobUrl,
          })),
        },
      };
    }

    case "list_target_companies": {
      const platform = args.platform as string | undefined;
      let companies = await getTargetCompanies();
      if (platform && platform !== "all") {
        companies = companies.filter((c) => c.platform.toLowerCase() === platform.toLowerCase());
      }

      return {
        success: true,
        data: {
          count: companies.length,
          companies: companies.map((c) => ({
            id: c.id,
            name: c.name,
            platform: c.platform,
            slug: c.slug,
            websiteUrl: c.websiteUrl,
            isActive: c.isActive,
          })),
        },
      };
    }

    case "save_target_company": {
      const res = await saveTargetCompany({
        name: String(args.name),
        platform: String(args.platform) as AtsPlatform,
        slug: String(args.slug),
        websiteUrl: args.websiteUrl ? String(args.websiteUrl) : undefined,
      });

      return {
        success: res.success,
        message: res.error
          ? `Failed to save company: ${res.error}`
          : `Target company '${args.name}' saved successfully.`,
        data: res.company,
      };
    }

    case "delete_target_company": {
      const id = args.id as string;
      const res = await deleteTargetCompany(id);
      return {
        success: res.success,
        message: res.error
          ? `Failed to delete company: ${res.error}`
          : `Target company (ID: ${id}) deleted successfully.`,
      };
    }

    case "search_worldwide_jobs": {
      const query = (args.query as string | undefined) || "";
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 20) : 10;
      const allJobs = await fetchWorldwideTechJobs({
        query: query || undefined,
      });

      const jobs = allJobs.slice(0, limit);
      return {
        success: true,
        data: {
          totalFetched: allJobs.length,
          sampleJobs: jobs.map((j) => ({
            title: j.title,
            companyName: j.companyName,
            platform: j.source,
            workplaceType: j.workplaceType,
            location: j.location,
            salarySnippet: j.salary,
            jobUrl: j.jobUrl,
          })),
        },
      };
    }

    case "get_outreach_analytics": {
      const analytics = await getOutreachAnalytics();
      return {
        success: true,
        data: analytics,
      };
    }

    case "list_job_outreaches": {
      const status = args.status as OutreachStatus | "all" | undefined;
      const type = args.type as OutreachType | "all" | undefined;
      const search = args.search as string | undefined;
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 50) : 15;

      const results = await getJobOutreaches({
        status,
        type,
        search,
      });

      const sliced = results.slice(0, limit);
      return {
        success: true,
        data: {
          count: results.length,
          outreaches: sliced.map((o) => ({
            id: o.id,
            companyName: o.companyName,
            jobTitle: o.jobTitle,
            contactName: o.contactName,
            contactEmail: o.contactEmail,
            outreachType: o.outreachType,
            status: o.status,
            subject: o.subject,
            followUpDueDate: o.followUpDueDate,
            sentAt: o.sentAt,
          })),
        },
      };
    }

    case "get_job_outreach_detail": {
      const id = args.id as string;
      const outreach = await getJobOutreachById(id);
      if (!outreach) {
        return { success: false, error: `Outreach with ID '${id}' not found.` };
      }
      return {
        success: true,
        data: outreach,
      };
    }

    case "create_job_outreach": {
      const newOutreach = await createJobOutreach({
        companyName: String(args.companyName),
        jobTitle: String(args.jobTitle),
        contactName: String(args.contactName),
        contactEmail: String(args.contactEmail),
        subject: String(args.subject),
        body: String(args.body),
        status: "draft",
        contactRole: args.contactRole ? String(args.contactRole) : undefined,
        outreachType: (args.outreachType as OutreachType) || "cold_pitch",
        jobApplicationId: args.jobApplicationId ? String(args.jobApplicationId) : undefined,
        notes: args.notes ? String(args.notes) : undefined,
      });

      return {
        success: true,
        message: `Outreach draft for '${newOutreach.contactName}' at '${newOutreach.companyName}' created successfully.`,
        data: { id: newOutreach.id, company: newOutreach.companyName, status: newOutreach.status },
      };
    }

    case "update_job_outreach_status": {
      const id = args.id as string;
      const status = args.status as OutreachStatus;
      const notes = args.notes as string | undefined;

      const updated = await updateJobOutreach(id, {
        status,
        ...(notes ? { notes } : {}),
      });

      return {
        success: true,
        message: `Outreach (ID: ${id}) status updated to '${status}'.`,
        data: updated,
      };
    }

    case "update_job_outreach": {
      const id = args.id as string;
      const updates: Record<string, unknown> = {};
      if (args.companyName) updates.companyName = String(args.companyName).trim();
      if (args.jobTitle) updates.jobTitle = String(args.jobTitle).trim();
      if (args.contactName) updates.contactName = String(args.contactName).trim();
      if (args.contactEmail) updates.contactEmail = String(args.contactEmail).trim();
      if (args.contactRole !== undefined) updates.contactRole = args.contactRole ? String(args.contactRole) : undefined;
      if (args.subject) updates.subject = String(args.subject).trim();
      if (args.body) updates.body = String(args.body).trim();
      if (args.status) updates.status = args.status as OutreachStatus;
      if (args.outreachType) updates.outreachType = args.outreachType as OutreachType;
      if (args.notes !== undefined) updates.notes = args.notes ? String(args.notes) : undefined;

      const updated = await updateJobOutreach(id, updates);
      return {
        success: true,
        message: `Job outreach (ID: ${id}) updated successfully.`,
        data: updated,
      };
    }

    case "delete_job_outreach": {
      const id = args.id as string;
      await deleteJobOutreach(id);
      return {
        success: true,
        message: `Job outreach (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    default:
      return null;
  }
}
