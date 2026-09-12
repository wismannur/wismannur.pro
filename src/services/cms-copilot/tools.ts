import { assertAdmin } from "../core/auth-guard";
import type { CopilotToolExecutionResult } from "./types";

import {
  DASHBOARD_TOOL_DECLARATIONS,
  executeDashboardTool,
} from "./domains/dashboard-tools";
import {
  CAREER_HUB_TOOL_DECLARATIONS,
  executeCareerHubTool,
} from "./domains/career-hub-tools";
import {
  PROJECT_HUB_TOOL_DECLARATIONS,
  executeProjectHubTool,
} from "./domains/project-hub-tools";
import {
  AI_ASSISTANT_TOOL_DECLARATIONS,
  executeAiAssistantTool,
} from "./domains/ai-assistant-tools";
import {
  INBOX_LEADS_TOOL_DECLARATIONS,
  executeInboxLeadsTool,
} from "./domains/inbox-leads-tools";
import {
  SITE_ARCHITECTURE_TOOL_DECLARATIONS,
  executeSiteArchitectureTool,
} from "./domains/site-architecture-tools";
import {
  CONTENT_CATALOG_TOOL_DECLARATIONS,
  executeContentCatalogTool,
} from "./domains/content-catalog-tools";
import {
  ACCOUNT_SYSTEM_TOOL_DECLARATIONS,
  executeAccountSystemTool,
} from "./domains/account-system-tools";

export const CMS_COPILOT_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      ...DASHBOARD_TOOL_DECLARATIONS,
      ...CAREER_HUB_TOOL_DECLARATIONS,
      ...PROJECT_HUB_TOOL_DECLARATIONS,
      ...AI_ASSISTANT_TOOL_DECLARATIONS,
      ...INBOX_LEADS_TOOL_DECLARATIONS,
      ...SITE_ARCHITECTURE_TOOL_DECLARATIONS,
      ...CONTENT_CATALOG_TOOL_DECLARATIONS,
      ...ACCOUNT_SYSTEM_TOOL_DECLARATIONS,
    ],
  },
];

export async function executeCmsCopilotTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult> {
  await assertAdmin();

  try {
    // 1. Dashboard
    const dashboardRes = await executeDashboardTool(name, args);
    if (dashboardRes) return dashboardRes;

    // 2. Career Hub
    const careerHubRes = await executeCareerHubTool(name, args);
    if (careerHubRes) return careerHubRes;

    // 3. Finder Project Hub
    const projectHubRes = await executeProjectHubTool(name, args);
    if (projectHubRes) return projectHubRes;

    // 4. AI Assistant
    const aiAssistantRes = await executeAiAssistantTool(name, args);
    if (aiAssistantRes) return aiAssistantRes;

    // 5. Inbox & Leads
    const inboxLeadsRes = await executeInboxLeadsTool(name, args);
    if (inboxLeadsRes) return inboxLeadsRes;

    // 6. Site Architecture
    const siteArchRes = await executeSiteArchitectureTool(name, args);
    if (siteArchRes) return siteArchRes;

    // 7. Content & Catalog
    const contentCatalogRes = await executeContentCatalogTool(name, args);
    if (contentCatalogRes) return contentCatalogRes;

    // 8. Account & System
    const accountSystemRes = await executeAccountSystemTool(name, args);
    if (accountSystemRes) return accountSystemRes;

    return {
      success: false,
      error: `Unknown tool name: ${name}`,
    };
  } catch (err: unknown) {
    console.error(`[executeCmsCopilotTool Error in ${name}]:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Execution error in CMS tool.",
    };
  }
}
