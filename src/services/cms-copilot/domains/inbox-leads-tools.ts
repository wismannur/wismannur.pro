import { Type } from "@google/genai";
import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { CopilotToolExecutionResult } from "../types";
import type { Contact } from "../../contacts/types";
import type { HireRequestStatus } from "../../hire-requests/types";
import { deleteContact, getById as getContactById } from "../../contacts/actions";
import { deleteHireRequest, getById as getHireRequestById } from "../../hire-requests/actions";
import { deleteServiceRequest, getById as getServiceRequestById } from "../../service-requests/actions";

type ServiceReqStatus = "new" | "in-progress" | "completed" | "cancelled";

const { contacts, hireRequests, serviceRequests, inquiryMessages } = schema;

export const INBOX_LEADS_TOOL_DECLARATIONS = [
  {
    name: "get_inbox_overview",
    description:
      "Get high-level overview counts of incoming leads: new contacts, hire inquiries, and service requests.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "list_contacts",
    description: "List incoming contact messages from the contact form.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Filter status: new, read, replied, archived, or all",
        },
        limit: {
          type: Type.INTEGER,
          description: "Number of records to retrieve (default: 10)",
        },
      },
    },
  },
  {
    name: "get_contact_detail",
    description:
      "Retrieve comprehensive details and message thread of a specific contact inquiry by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Contact ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "update_contact_status",
    description: "Update the status of a contact message (e.g. mark as read, replied, archived).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Contact ID",
        },
        status: {
          type: Type.STRING,
          description: "Status: new, read, replied, archived",
        },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "delete_contact",
    description: "Permanently delete an incoming contact inquiry by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Contact ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_contact",
    description: "Manually log a new contact message or inbound client lead.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "Sender name",
        },
        email: {
          type: Type.STRING,
          description: "Sender email address",
        },
        subject: {
          type: Type.STRING,
          description: "Subject / title",
        },
        message: {
          type: Type.STRING,
          description: "Message body",
        },
        status: {
          type: Type.STRING,
          description: "Status: new, read, replied, archived (default: new)",
        },
      },
      required: ["name", "email", "subject", "message"],
    },
  },
  {
    name: "list_hire_requests",
    description: "List incoming job offers, recruiter outreach, and client hire inquiries.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Status: new, reviewed, interviewing, offered, rejected, archived, or all",
        },
        limit: {
          type: Type.INTEGER,
          description: "Number of records to retrieve (default: 10)",
        },
      },
    },
  },
  {
    name: "get_hire_request_detail",
    description: "Retrieve full details and thread of a recruiter or company hire request by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Hire Request ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "update_hire_request_status",
    description: "Update the status of a hire request inquiry.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Hire Request ID",
        },
        status: {
          type: Type.STRING,
          description: "Status: new, reviewed, interviewing, offered, rejected, archived",
        },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "delete_hire_request",
    description: "Permanently delete a hire request inquiry by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Hire Request ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_hire_request",
    description:
      "Manually record a recruiter or company hire request/offer received directly or offline.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "Recruiter / contact name",
        },
        email: {
          type: Type.STRING,
          description: "Contact email",
        },
        company: {
          type: Type.STRING,
          description: "Company name",
        },
        roleTitle: {
          type: Type.STRING,
          description: "Target role title",
        },
        message: {
          type: Type.STRING,
          description: "Job / proposal details",
        },
        employmentType: {
          type: Type.STRING,
          description: "Full-time, Contract, Part-time, etc.",
        },
        workplaceType: {
          type: Type.STRING,
          description: "Remote, Hybrid, Onsite",
        },
        salaryRange: {
          type: Type.STRING,
          description: "Salary range estimation",
        },
        location: {
          type: Type.STRING,
          description: "Location",
        },
        status: {
          type: Type.STRING,
          description:
            "Status: new, reviewed, interviewing, offered, rejected, archived (default: new)",
        },
      },
      required: ["name", "email", "company", "roleTitle", "message"],
    },
  },
  {
    name: "list_service_requests",
    description: "List client requests for freelance, consulting, or software development services.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Status: new, in-progress, completed, cancelled, or all",
        },
        limit: {
          type: Type.INTEGER,
          description: "Number of records to retrieve (default: 10)",
        },
      },
    },
  },
  {
    name: "get_service_request_detail",
    description: "Retrieve full details and project scope of a client service request by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Service Request ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "update_service_request_status",
    description: "Update the status of a service request.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Service Request ID",
        },
        status: {
          type: Type.STRING,
          description: "Status: new, in-progress, completed, cancelled",
        },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "delete_service_request",
    description: "Permanently delete a service request by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: "Service Request ID to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_service_request",
    description: "Manually record a client request for freelance development, consulting, or engineering.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "Client name",
        },
        email: {
          type: Type.STRING,
          description: "Client email",
        },
        company: {
          type: Type.STRING,
          description: "Client company",
        },
        serviceType: {
          type: Type.STRING,
          description: "Service type: frontend, ui-ux, performance, api, leadership",
        },
        budget: {
          type: Type.STRING,
          description: "Budget estimate",
        },
        timeframe: {
          type: Type.STRING,
          description: "Timeframe (e.g. asap, 1-2-weeks, 1-month)",
        },
        projectDetails: {
          type: Type.STRING,
          description: "Scope and project details",
        },
        status: {
          type: Type.STRING,
          description: "Status: new, in-progress, completed, cancelled (default: new)",
        },
      },
      required: ["name", "email", "serviceType", "budget", "timeframe", "projectDetails"],
    },
  },
];

export async function executeInboxLeadsTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  const db = getDb();

  switch (name) {
    case "get_inbox_overview": {
      const [contactCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(eq(contacts.status, "new"));

      const [hireCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(hireRequests)
        .where(eq(hireRequests.status, "new"));

      const [serviceCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(serviceRequests)
        .where(eq(serviceRequests.status, "new"));

      return {
        success: true,
        data: {
          unreadContacts: Number(contactCount?.count || 0),
          newHireInquiries: Number(hireCount?.count || 0),
          newServiceRequests: Number(serviceCount?.count || 0),
        },
      };
    }

    case "list_contacts": {
      const status = args.status as string | undefined;
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 20) : 10;

      let query = db
        .select()
        .from(contacts)
        .orderBy(desc(contacts.createdAt))
        .limit(limit);

      if (status && status !== "all") {
        query = query.where(eq(contacts.status, status as Contact["status"])) as typeof query;
      }

      const rows = await query;
      return {
        success: true,
        data: {
          count: rows.length,
          contacts: rows.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            subject: c.subject,
            message: c.message,
            status: c.status,
            createdAt: c.createdAt,
          })),
        },
      };
    }

    case "get_contact_detail": {
      const id = args.id as string;
      const contact = await getContactById(id);
      if (!contact) {
        return { success: false, error: `Contact inquiry with ID '${id}' not found.` };
      }
      const threadMessages = await db
        .select()
        .from(inquiryMessages)
        .where(eq(inquiryMessages.inquiryId, id))
        .orderBy(inquiryMessages.createdAt);

      return {
        success: true,
        data: {
          contact,
          messages: threadMessages,
        },
      };
    }

    case "update_contact_status": {
      const id = args.id as string;
      const status = args.status as Contact["status"];

      await db.update(contacts).set({ status }).where(eq(contacts.id, id));
      revalidatePath("/cms/contacts");

      return {
        success: true,
        message: `Contact status updated to '${status}'.`,
      };
    }

    case "delete_contact": {
      const id = args.id as string;
      await deleteContact(id);
      revalidatePath("/cms/contacts");

      return {
        success: true,
        message: `Contact message (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    case "create_contact": {
      const [inserted] = await db
        .insert(contacts)
        .values({
          name: String(args.name).trim(),
          email: String(args.email).trim().toLowerCase(),
          subject: String(args.subject).trim(),
          message: String(args.message).trim(),
          status: (args.status as Contact["status"]) || "new",
        })
        .returning();

      revalidatePath("/cms/contacts");

      return {
        success: true,
        message: `Contact lead from '${inserted.name}' (${inserted.email}) created successfully.`,
        data: inserted,
      };
    }

    case "list_hire_requests": {
      const status = args.status as string | undefined;
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 20) : 10;

      let query = db
        .select()
        .from(hireRequests)
        .orderBy(desc(hireRequests.createdAt))
        .limit(limit);

      if (status && status !== "all") {
        query = query.where(eq(hireRequests.status, status as HireRequestStatus)) as typeof query;
      }

      const rows = await query;
      return {
        success: true,
        data: {
          count: rows.length,
          hireRequests: rows.map((h) => ({
            id: h.id,
            name: h.name,
            email: h.email,
            company: h.company,
            roleTitle: h.roleTitle,
            employmentType: h.employmentType,
            workplaceType: h.workplaceType,
            salaryRange: h.salaryRange,
            message: h.message,
            status: h.status,
            createdAt: h.createdAt,
          })),
        },
      };
    }

    case "get_hire_request_detail": {
      const id = args.id as string;
      const req = await getHireRequestById(id);
      if (!req) {
        return { success: false, error: `Hire request '${id}' not found.` };
      }
      const threadMessages = await db
        .select()
        .from(inquiryMessages)
        .where(eq(inquiryMessages.inquiryId, id))
        .orderBy(inquiryMessages.createdAt);

      return {
        success: true,
        data: {
          hireRequest: req,
          messages: threadMessages,
        },
      };
    }

    case "update_hire_request_status": {
      const id = args.id as string;
      const status = args.status as HireRequestStatus;

      await db
        .update(hireRequests)
        .set({ status, updatedAt: new Date() })
        .where(eq(hireRequests.id, id));

      revalidatePath("/cms/hire-requests");

      return {
        success: true,
        message: `Hire request status updated to '${status}'.`,
      };
    }

    case "delete_hire_request": {
      const id = args.id as string;
      await deleteHireRequest(id);
      revalidatePath("/cms/hire-requests");

      return {
        success: true,
        message: `Hire request (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    case "create_hire_request": {
      const [inserted] = await db
        .insert(hireRequests)
        .values({
          name: String(args.name).trim(),
          email: String(args.email).trim().toLowerCase(),
          company: String(args.company).trim(),
          roleTitle: String(args.roleTitle).trim(),
          employmentType: args.employmentType ? String(args.employmentType) : "full_time",
          workplaceType: args.workplaceType ? String(args.workplaceType) : "remote",
          location: args.location ? String(args.location) : null,
          salaryRange: args.salaryRange ? String(args.salaryRange) : null,
          message: String(args.message).trim(),
          status: (args.status as HireRequestStatus) || "new",
        })
        .returning();

      revalidatePath("/cms/hire-requests");

      return {
        success: true,
        message: `Hire request for '${inserted.roleTitle}' at '${inserted.company}' created successfully.`,
        data: inserted,
      };
    }

    case "list_service_requests": {
      const status = args.status as string | undefined;
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 20) : 10;

      let query = db
        .select()
        .from(serviceRequests)
        .orderBy(desc(serviceRequests.createdAt))
        .limit(limit);

      if (status && status !== "all") {
        query = query.where(eq(serviceRequests.status, status as ServiceReqStatus)) as typeof query;
      }

      const rows = await query;
      return {
        success: true,
        data: {
          count: rows.length,
          serviceRequests: rows.map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            company: s.company,
            serviceType: s.serviceType,
            budget: s.budget,
            timeframe: s.timeframe,
            projectDetails: s.projectDetails,
            status: s.status,
            createdAt: s.createdAt,
          })),
        },
      };
    }

    case "get_service_request_detail": {
      const id = args.id as string;
      const req = await getServiceRequestById(id);
      if (!req) {
        return { success: false, error: `Service request '${id}' not found.` };
      }
      const threadMessages = await db
        .select()
        .from(inquiryMessages)
        .where(eq(inquiryMessages.inquiryId, id))
        .orderBy(inquiryMessages.createdAt);

      return {
        success: true,
        data: {
          serviceRequest: req,
          messages: threadMessages,
        },
      };
    }

    case "update_service_request_status": {
      const id = args.id as string;
      const status = args.status as ServiceReqStatus;

      await db
        .update(serviceRequests)
        .set({ status })
        .where(eq(serviceRequests.id, id));

      revalidatePath("/cms/services");

      return {
        success: true,
        message: `Service request status updated to '${status}'.`,
      };
    }

    case "delete_service_request": {
      const id = args.id as string;
      await deleteServiceRequest(id);
      revalidatePath("/cms/services");

      return {
        success: true,
        message: `Service request (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    case "create_service_request": {
      const [inserted] = await db
        .insert(serviceRequests)
        .values({
          name: String(args.name).trim(),
          email: String(args.email).trim().toLowerCase(),
          company: args.company ? String(args.company).trim() : null,
          serviceType: String(args.serviceType).trim(),
          budget: String(args.budget).trim(),
          timeframe: String(args.timeframe).trim(),
          projectDetails: String(args.projectDetails).trim(),
          status: (args.status as ServiceReqStatus) || "new",
        })
        .returning();

      revalidatePath("/cms/services");

      return {
        success: true,
        message: `Service request from '${inserted.name}' (${inserted.serviceType}) created successfully.`,
        data: inserted,
      };
    }

    default:
      return null;
  }
}
