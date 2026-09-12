import { Type } from "@google/genai";
import { getSummary } from "@/services/dashboard/actions";
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
];

export async function executeDashboardTool(
  name: string,
  _args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  void _args;
  switch (name) {
    case "get_cms_dashboard_summary": {
      const summary = await getSummary();
      return {
        success: true,
        data: summary,
      };
    }
    default:
      return null;
  }
}
