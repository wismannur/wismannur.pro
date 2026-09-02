import { Type } from "@google/genai";
import { getDb, schema } from "@/db";
import type {
	SubmitContactMessageArgs,
	SubmitHireInquiryArgs,
	ToolExecutionResult,
} from "./types";
import { sendContactEmails, sendHireRequestEmails } from "../core/resend";

const { hireRequests, contacts } = schema;

export const AI_CHAT_TOOL_DECLARATIONS = [
	{
		functionDeclarations: [
			{
				name: "submit_hire_inquiry",
				description:
					"Submit a direct hiring opportunity, job offer, or project inquiry to Wisman Nur. Use when the user expresses intent to hire or work together.",
				parameters: {
					type: Type.OBJECT,
					properties: {
						name: {
							type: Type.STRING,
							description: "Name of the recruiter, hiring manager, or client",
						},
						email: {
							type: Type.STRING,
							description: "Contact email address",
						},
						company: {
							type: Type.STRING,
							description: "Company or organization name",
						},
						roleTitle: {
							type: Type.STRING,
							description: "Role, position, or project scope title",
						},
						employmentType: {
							type: Type.STRING,
							description:
								"Employment type: full_time, contract, part_time, freelance, internship",
							enum: [
								"full_time",
								"contract",
								"part_time",
								"freelance",
								"internship",
							],
						},
						workplaceType: {
							type: Type.STRING,
							description: "Workplace setup: remote, hybrid, onsite",
							enum: ["remote", "hybrid", "onsite"],
						},
						location: {
							type: Type.STRING,
							description: "Office location or candidate time zone requirement",
						},
						salaryRange: {
							type: Type.STRING,
							description: "Estimated salary range, rate, or project budget",
						},
						message: {
							type: Type.STRING,
							description:
								"Job description, project details, tech stack expectations, or message for Wisman",
						},
					},
					required: ["name", "email", "company", "roleTitle", "message"],
				},
			},
			{
				name: "submit_contact_message",
				description:
					"Submit a general message, question, consultation request, or networking greeting directly to Wisman Nur.",
				parameters: {
					type: Type.OBJECT,
					properties: {
						name: {
							type: Type.STRING,
							description: "Sender's name",
						},
						email: {
							type: Type.STRING,
							description: "Sender's email address",
						},
						subject: {
							type: Type.STRING,
							description: "Subject or topic of the message",
						},
						message: {
							type: Type.STRING,
							description: "Message content",
						},
					},
					required: ["name", "email", "subject", "message"],
				},
			},
		],
	},
];

export async function executeAiChatTool(
	name: string,
	args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
	const db = getDb();

	try {
		if (name === "submit_hire_inquiry") {
			const hireArgs = args as unknown as SubmitHireInquiryArgs;

			if (!hireArgs.name || !hireArgs.email || !hireArgs.company || !hireArgs.roleTitle || !hireArgs.message) {
				return {
					success: false,
					message: "Missing required fields (name, email, company, roleTitle, message).",
				};
			}

			const [{ id }] = await db
				.insert(hireRequests)
				.values({
					name: hireArgs.name.trim(),
					email: hireArgs.email.trim().toLowerCase(),
					company: hireArgs.company.trim(),
					roleTitle: hireArgs.roleTitle.trim(),
					employmentType: hireArgs.employmentType || "full_time",
					workplaceType: hireArgs.workplaceType || "remote",
					location: hireArgs.location?.trim() || null,
					salaryRange: hireArgs.salaryRange?.trim() || null,
					message: hireArgs.message.trim(),
					status: "new",
				})
				.returning({ id: hireRequests.id });

			// Send notification email asynchronously
			sendHireRequestEmails({
				id,
				name: hireArgs.name,
				email: hireArgs.email,
				company: hireArgs.company,
				roleTitle: hireArgs.roleTitle,
				employmentType: hireArgs.employmentType || "full_time",
				workplaceType: hireArgs.workplaceType || "remote",
				location: hireArgs.location,
				salaryRange: hireArgs.salaryRange,
				message: hireArgs.message,
			}).catch((err) => {
				console.error("[AI Chat Tool] Failed to send hire request email notification:", err);
			});

			return {
				success: true,
				message: `Inquiry successfully submitted to Wisman's dashboard (ID: ${id}). Wisman will review and respond via email at ${hireArgs.email}.`,
				data: { id, email: hireArgs.email },
			};
		}

		if (name === "submit_contact_message") {
			const contactArgs = args as unknown as SubmitContactMessageArgs;

			if (!contactArgs.name || !contactArgs.email || !contactArgs.subject || !contactArgs.message) {
				return {
					success: false,
					message: "Missing required fields (name, email, subject, message).",
				};
			}

			const [{ id }] = await db
				.insert(contacts)
				.values({
					name: contactArgs.name.trim(),
					email: contactArgs.email.trim().toLowerCase(),
					subject: contactArgs.subject.trim(),
					message: contactArgs.message.trim(),
					status: "new",
				})
				.returning({ id: contacts.id });

			// Send notification email asynchronously
			sendContactEmails({
				name: contactArgs.name,
				email: contactArgs.email,
				subject: contactArgs.subject,
				message: contactArgs.message,
			}).catch((err) => {
				console.error("[AI Chat Tool] Failed to send contact email notification:", err);
			});

			return {
				success: true,
				message: `Message sent successfully to Wisman's inbox (ID: ${id}). Wisman will get back to you via email at ${contactArgs.email}.`,
				data: { id, email: contactArgs.email },
			};
		}

		return {
			success: false,
			message: `Unknown tool name: ${name}`,
		};
	} catch (error) {
		console.error(`[AI Chat Tool Error] executing ${name}:`, error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to execute tool.",
		};
	}
}
