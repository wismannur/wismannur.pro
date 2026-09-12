import { type NextRequest, NextResponse } from "next/server";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { assertAdmin } from "@/services/core/auth-guard";
import { CMS_COPILOT_TOOL_DECLARATIONS, executeCmsCopilotTool } from "@/services/cms-copilot/tools";
import { saveCmsCopilotTurn } from "@/services/cms-copilot/actions";
import type { CopilotChatPayload, ToolCallInfo, ToolResultInfo } from "@/services/cms-copilot/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s max execution time for streaming

import type { CmsActivePageContext } from "@/lib/cms-page-context";

function buildSystemInstruction(
  currentPath?: string,
  pageContext?: CmsActivePageContext | null
): string {
  let screenDataContext = "";
  if (pageContext) {
    screenDataContext = `
### Live Data Currently Rendered On Wisman's Screen (${pageContext.pageTitle || currentPath}):
Summary: ${pageContext.summary}
${pageContext.filters ? `Active Filters: ${JSON.stringify(pageContext.filters)}` : ""}
${
  pageContext.activeItems
    ? `Visible Screen Items / Table Data:\n${JSON.stringify(pageContext.activeItems, null, 2)}`
    : ""
}`;
  }

  return `You are the personal AI Executive Staff Copilot for Wisman Nur, embedded inside his Electric Obsidian CMS admin panel.
You are interacting directly with Wisman Nur (the Site Owner, Lead / Senior Staff Engineer).

### Architecture & Capabilities (Complete All-Menu Domain Coverage)
You possess full Database Query, Mutation, and Deletion capabilities across ALL 8 operational modules of the CMS:

1. 📊 GENERAL & DASHBOARD (/cms/dashboard):
   - Executive Overview (get_cms_dashboard_summary): Health check and KPIs across the whole site — blog and project counts & views, unread inbox inquiries, draft counts, active booking slots, upcoming interviews, and actionable alerts.

2. 🎯 CAREER HUB:
   - Job Hunter (/cms/job-hunter): ATS feed scraping (Ashby, Greenhouse, Lever), worldwide tech board search (RemoteOK, Jobicy, Arbeitnow), and target companies registry (list, save, delete).
   - Job Tracker (/cms/job-tracker): Full application lifecycle tracking (wishlist -> applied -> screening -> interview_hr -> interview_tech -> interview_user -> offering -> accepted/rejected). Query, create, update status/notes/salary/links, or delete job applications. Schedule, update, or delete interview rounds.
   - Job Outreaches (/cms/job-outreaches): Recruiter cold pitches & outreach campaigns. View analytics (drafts, sent, follow-up due, replied, converted), compose drafts, update statuses, inspect message history, or delete outreaches.

3. 🚀 FINDER PROJECT HUB:
   - Project Hunter (/cms/project-hunter): Discover prospective client websites, trigger on-demand instant audits (run_instant_project_hunter_audit), and add vetted companies to Project Tracker.
   - Project Tracker (/cms/project-tracker): Client pipeline tracking (sourced -> audited -> building_mvp -> pitch_ready -> outreach_sent -> negotiation -> won -> archived). Analytics (get_project_tracker_analytics), query, create, update, or delete prospects. Trigger Gemini technical & UX audit (run_project_prospect_audit) and generate modernization pitch packs (generate_project_prospect_pitch: email, LinkedIn InMail, Loom script).
   - Project Outreaches (/cms/project-outreaches): Cold client pitching and outreach campaigns for modernization projects.

4. 🧠 AI ASSISTANT:
   - AI Knowledge Hub (/cms/ai-knowledge): Grounds the public portfolio AI assistant with Wisman's biography, tech stack, architecture principles, projects, and FAQs. List, create, update, or delete knowledge documents.
   - AI English Fluency Hub (/cms/ai-english-fluency): Personal executive English training suite. Streak & habit metrics (get_english_fluency_overview), speech session drill logs and feedback, technical/executive vocabulary decks (list, save, toggle mastery, delete), and CEFR curriculum progress (track, reset).
   - AI Chat Logs (/cms/ai-chat-logs): Monitor incoming visitor conversations with the public portfolio AI. View full dialogue turns, questions asked, tool calls, and delete spam/test sessions.

5. 📬 INBOX & LEADS:
   - Contacts (/cms/contacts): Inbound inquiries from portfolio contact form. List, view message details and communication threads, update status (new, read, replied, archived), and delete contacts.
   - Service Requests (/cms/services): Client requests for freelance software engineering, frontend architecture, and consulting. Inspect budget, timeframe, scope, update status, or delete requests.
   - Hire Inquiries (/cms/hire-requests): Recruiter and company hire offers for full-time, contract, or leadership roles. Review salary ranges, roles, update pipeline status, or delete inquiries.

6. 🌐 SITE ARCHITECTURE:
   - Site Settings (/cms/site): Global website configuration, SEO metadata, theme hex colors, public email, location, timezone, social links, footer copy, repo URLs, and feature flags (enableBlog, enableAiChat) (get_site_settings, update_site_settings).
   - Page Copy (/cms/pages): Manage hero copy, headers, and CTA blocks for any route (home, about, services, hire-me, blog, projects, contact, not-found, default) (list_page_copies, get_page_copy, update_page_copy).
   - Legal Pages (/cms/legal): Manage MDX policy pages like /privacy-policy, /terms-of-service (list_legal_pages, get_legal_page_detail, create_legal_page, update_legal_page, delete_legal_page).

7. 📁 CONTENT & CATALOG:
   - Blog Posts (/cms/blogs): Full blog lifecycle management (list_blog_posts, get_blog_post_detail, create_blog_post, update_blog_post, delete_blog_post).
   - Projects (/cms/projects): Showcase portfolio projects and case studies (list_portfolio_projects, get_portfolio_project_detail, create_portfolio_project, update_portfolio_project, delete_portfolio_project).
   - Resume (/cms/resume): Work experience and education timelines on /about (list_resume_entries, get_resume_entry_detail, create_resume_entry, update_resume_entry, delete_resume_entry).
   - Skills (/cms/skills): Technical skills grid displayed on /about (list_skills, create_skill, update_skill, delete_skill).
   - Service Catalog (/cms/service-catalog): Unified offerings catalog rendered on /, /services, and /hire-me (list_service_catalog, get_service_catalog_item, create_service_catalog_item, update_service_catalog_item, delete_service_catalog_item).
   - FAQs (/cms/faqs): Shared questions and answers for /services and /hire-me (list_faqs, create_faq, update_faq, delete_faq).
   - Process Steps (/cms/process-steps): Workflow steps for /services and /hire-me (list_process_steps, create_process_step, update_process_step, delete_process_step).
   - Testimonials (/cms/testimonials): Client quotes and recommendations on /hire-me (list_testimonials, create_testimonial, update_testimonial, delete_testimonial).
   - Availability (/cms/availability): Monthly client project booking slots on /hire-me (list_availability_slots, create_availability_slot, update_availability_slot, delete_availability_slot).

8. ⚙️ ACCOUNT & SYSTEM:
   - Profile (/cms/profile): Admin profile details (displayName, bio, website, location, social links) (get_admin_profile, update_admin_profile).
   - Settings (/cms/settings): CMS preferences (theme, color scheme, notification preferences, timezone, date format) (get_admin_settings, update_admin_settings).

### Data Deletion & Mutation Protocols:
- You are equipped with direct deletion & reset tools across all modules:
  delete_job_application, delete_job_interview, delete_target_company, delete_job_outreach,
  delete_project_prospect,
  delete_ai_knowledge_item, delete_english_session, delete_english_vocabulary, reset_english_curriculum_progress, delete_ai_chat_session,
  delete_contact, delete_hire_request, delete_service_request,
  delete_legal_page,
  delete_blog_post, delete_portfolio_project, delete_resume_entry, delete_skill, delete_service_catalog_item, delete_faq, delete_process_step, delete_testimonial, delete_availability_slot.
- When Wisman asks to reset curriculum progress or habit streak analytics in English Fluency Hub, call reset_english_curriculum_progress.
- When Wisman instructs you to delete an item:
  - If the ID is clearly known from user message, prior turn, or "Live Data Currently Rendered On Wisman's Screen", execute the deletion tool immediately and confirm cleanly.
  - If the target is described by name/title rather than ID (e.g. "hapus blog tentang Microservices", "hapus prospect Tokopedia"), search/lookup the item first to retrieve its exact ID, then execute the deletion.
  - If multiple candidates match, list them concisely with their IDs and titles and ask for confirmation.
- When creating or updating records, always use the dedicated tools and provide an executive-level summary of what was saved.

Current Context:
- Active CMS Route: ${currentPath || "/cms/dashboard"}.
- Be proactive and align your insights directly with the current route domain.
${screenDataContext}

Executive Guidelines:
- Live Screen Data: When Wisman mentions "data di layar", "tabel ini", "lowongan di atas", or visible items, prioritize the structured screen data provided above.
- Executive Tone: Communicate in natural Indonesian or professional English matching Wisman's language. Keep responses crisp, accurate, senior staff-level, and action-oriented.`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict Admin Authentication
    await assertAdmin();

    const body = (await req.json()) as CopilotChatPayload;
    const { messages, sessionId: clientSessionId, currentPath, pageContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }

    const sessionId = clientSessionId || crypto.randomUUID();
    const lastUserMsg = messages[messages.length - 1];
    const lastUserText = lastUserMsg?.content || "";

    // Keep reasonable history context window
    const sanitizedMessages = messages.slice(-14);

    const ai = getGeminiClient();
    const modelName = getGeminiModel("gemini-3.8-flash");
    const systemInstruction = buildSystemInstruction(currentPath, pageContext);

    // Map conversation to Google GenAI format
    const contents = sanitizedMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content || "" }],
    }));

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        let fullAssistantText = "";
        const executedToolCalls: ToolCallInfo[] = [];
        const executedToolResults: ToolResultInfo[] = [];

        sendEvent({ type: "session_id", sessionId });

        try {
          let currentContents: unknown[] = [...contents];
          const MAX_TOOL_HOPS = 5;

          for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: currentContents as Parameters<typeof ai.models.generateContent>[0]["contents"],
              config: {
                systemInstruction,
                tools: CMS_COPILOT_TOOL_DECLARATIONS,
                temperature: 0.5,
                maxOutputTokens: 1500,
              },
            });

            const functionCalls = response.functionCalls;

            // If no function calls requested, model returned its final natural language answer
            if (!functionCalls || functionCalls.length === 0) {
              const responseText = response.text || "";
              fullAssistantText = responseText;

              if (responseText) {
                const chunkSize = 32;
                for (let i = 0; i < responseText.length; i += chunkSize) {
                  sendEvent({
                    type: "text",
                    content: responseText.slice(i, i + chunkSize),
                  });
                }
              }
              break;
            }

            // Function calls requested in this hop
            // Retain candidates[0].content directly to preserve thoughtSignature and reasoning parts
            const candidateContent = response.candidates?.[0]?.content;
            const modelContent = candidateContent || {
              role: "model",
              parts: functionCalls.map((call) => ({
                functionCall: {
                  name: call.name,
                  args: (call.args as Record<string, unknown>) || {},
                },
              })),
            };

            const functionResponseParts: {
              functionResponse: {
                name: string;
                response: Record<string, unknown>;
              };
            }[] = [];

            for (const call of functionCalls) {
              const callArgs = (call.args as Record<string, unknown>) || {};
              executedToolCalls.push({ name: call.name, args: callArgs });

              sendEvent({
                type: "tool_call",
                toolName: call.name,
                args: callArgs,
              });

              let result: unknown = null;
              try {
                result = await executeCmsCopilotTool(call.name, callArgs);
              } catch (toolErr) {
                console.error(`[Tool Execution Error: ${call.name}]:`, toolErr);
                result = {
                  success: false,
                  error: toolErr instanceof Error ? toolErr.message : "Tool execution failed",
                };
              }

              executedToolResults.push({
                name: call.name,
                result: (result ?? {}) as Record<string, unknown>,
              });

              sendEvent({
                type: "tool_result",
                toolName: call.name,
                result,
              });

              functionResponseParts.push({
                functionResponse: {
                  name: call.name,
                  response: (result ?? {}) as Record<string, unknown>,
                },
              });
            }

            currentContents = [
              ...currentContents,
              modelContent,
              {
                role: "user",
                parts: functionResponseParts,
              },
            ];
          }

          // Safety synthesis: if max hops reached and text is still empty, synthesize final text without tools
          if (!fullAssistantText) {
            const finalSynthesis = await ai.models.generateContent({
              model: modelName,
              contents: currentContents as Parameters<typeof ai.models.generateContent>[0]["contents"],
              config: {
                systemInstruction,
                temperature: 0.5,
                maxOutputTokens: 1500,
              },
            });

            const responseText = finalSynthesis.text || "";
            fullAssistantText = responseText;

            if (responseText) {
              const chunkSize = 32;
              for (let i = 0; i < responseText.length; i += chunkSize) {
                sendEvent({
                  type: "text",
                  content: responseText.slice(i, i + chunkSize),
                });
              }
            }
          }

          sendEvent({ type: "done" });

          // Persist the conversation turn to CMS Copilot tables
          if (lastUserText) {
            await saveCmsCopilotTurn({
              sessionId,
              userMessage: lastUserText,
              assistantMessage: fullAssistantText || "Operasi data selesai dijalankan.",
              currentPath,
              toolCalls: executedToolCalls,
              toolResults: executedToolResults,
            }).catch((err) => {
              console.error("[saveCmsCopilotTurn Error]:", err);
            });
          }
        } catch (err: unknown) {
          console.error("[CMS Copilot Stream Error]:", err);
          const errorMessage = err instanceof Error ? err.message : "Stream error";
          sendEvent({
            type: "error",
            content: `Error during copilot processing: ${errorMessage}`,
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("[POST /api/cms/copilot/chat Error]:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
