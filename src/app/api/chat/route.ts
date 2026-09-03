import { type NextRequest, NextResponse } from "next/server";
import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import { buildSystemInstruction } from "@/services/ai-chat/knowledge-context";
import { checkChatRateLimit } from "@/services/ai-chat/rate-limiter";
import { AI_CHAT_TOOL_DECLARATIONS, executeAiChatTool } from "@/services/ai-chat/tools";
import { logChatInteraction } from "@/services/ai-chat/actions";
import type { ChatRequestPayload } from "@/services/ai-chat/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max execution time for streaming

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";
    const rateLimit = checkChatRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many messages in a short period. Please try again in ${rateLimit.resetInSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetInSeconds),
          },
        }
      );
    }

    const body = (await req.json()) as ChatRequestPayload;
    const { messages, clientSessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }

    const sessionId = clientSessionId || crypto.randomUUID();
    const lastUserMsg = messages[messages.length - 1];
    const lastUserText = lastUserMsg?.content || "";

    // Ensure we don't exceed reasonable conversation history length
    const sanitizedMessages = messages.slice(-12);

    const ai = getGeminiClient();
    const modelName = getGeminiModel();
    const systemInstruction = await buildSystemInstruction();

    // Convert message format for Google GenAI SDK
    const contents = sanitizedMessages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content || "" }],
    }));

    // Create SSE Stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        let fullAssistantText = "";
        let executedToolName: string | undefined;
        let executedToolArgs: Record<string, unknown> | undefined;
        let executedToolResult: Record<string, unknown> | undefined;

        // Send session ID back to client
        sendEvent({ type: "session_id", sessionId });

        try {
          // 1. First attempt to generate with tools enabled
          const initialResponse = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              tools: AI_CHAT_TOOL_DECLARATIONS,
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          });

          const functionCalls = initialResponse.functionCalls;

          // If model wants to call a tool
          if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
              executedToolName = call.name;
              executedToolArgs = (call.args as Record<string, unknown>) || {};

              sendEvent({
                type: "tool_call",
                toolName: call.name,
                args: executedToolArgs,
              });

              const executionResult = await executeAiChatTool(call.name, executedToolArgs);

              executedToolResult = executionResult as unknown as Record<string, unknown>;

              sendEvent({
                type: "tool_result",
                toolName: call.name,
                result: executionResult,
              });

              // Now feed back function result to Gemini to get a natural confirmation stream
              const followUpContents = [
                ...contents,
                {
                  role: "model",
                  parts: [
                    {
                      functionCall: {
                        name: call.name,
                        args: call.args || {},
                      },
                    },
                  ],
                },
                {
                  role: "user",
                  parts: [
                    {
                      functionResponse: {
                        name: call.name,
                        response: executionResult,
                      },
                    },
                  ],
                },
              ];

              const followUpStream = await ai.models.generateContentStream({
                model: modelName,
                contents: followUpContents as unknown as Parameters<
                  typeof ai.models.generateContentStream
                >[0]["contents"],
                config: {
                  systemInstruction,
                  temperature: 0.7,
                  maxOutputTokens: 1000,
                },
              });

              for await (const chunk of followUpStream) {
                const text = chunk.text;
                if (text) {
                  fullAssistantText += text;
                  sendEvent({
                    type: "text",
                    content: text,
                  });
                }
              }
            }
          } else {
            // No tool call triggered: initialResponse already contains the complete text from a single pass.
            // Stream it directly to the client to avoid 2x latency and 2x token costs.
            const responseText = initialResponse.text || "";
            fullAssistantText = responseText;

            if (responseText) {
              const chunkSize = 48;
              for (let i = 0; i < responseText.length; i += chunkSize) {
                const slice = responseText.slice(i, i + chunkSize);
                sendEvent({
                  type: "text",
                  content: slice,
                });
              }
            }
          }

          sendEvent({ type: "done" });

          // Log interaction to Database
          if (lastUserText && fullAssistantText) {
            await logChatInteraction({
              sessionId,
              visitorId: sessionId,
              ipAddress: ip,
              userAgent,
              userMessage: lastUserText,
              assistantMessage: fullAssistantText,
              toolCallName: executedToolName,
              toolCallArgs: executedToolArgs,
              toolCallResult: executedToolResult,
            }).catch((err) => {
              console.error("[logChatInteraction Error]:", err);
            });
          }
        } catch (err: unknown) {
          console.error("[Chat Stream Error]:", err);
          const errorMessage = err instanceof Error ? err.message : "Internal streaming error";
          sendEvent({
            type: "error",
            content: `Sorry, an issue occurred while processing your response: ${errorMessage}`,
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
    console.error("[POST /api/chat Error]:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
