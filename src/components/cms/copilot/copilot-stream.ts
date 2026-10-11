import type { CmsActivePageContext } from "@/lib/cms-page-context";

export interface StreamCallbacks {
  onSessionId: (id: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>) => void;
  onToolResult: (name: string, result: Record<string, unknown>) => void;
  onTextChunk: (chunk: string) => void;
  onError: (errMsg: string) => void;
  onSkillActivated?: (skillId: string) => void;
}

export async function streamCopilotChat(
  payload: {
    sessionId?: string;
    currentPath: string;
    pageContext?: CmsActivePageContext | null;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  },
  callbacks: StreamCallbacks
): Promise<string> {
  const response = await fetch("/api/cms/copilot/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error || "Gagal menghubungi Gemini API");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const data = JSON.parse(jsonStr);

        if (data.type === "session_id" && data.sessionId) {
          callbacks.onSessionId(data.sessionId);
        } else if (data.type === "skill_activated" && typeof data.skillId === "string") {
          callbacks.onSkillActivated?.(data.skillId);
        } else if (data.type === "tool_call") {
          callbacks.onToolCall(data.toolName, data.args);
        } else if (data.type === "tool_result") {
          callbacks.onToolResult(data.toolName, data.result);
        } else if (data.type === "text" && typeof data.content === "string") {
          fullText += data.content;
          callbacks.onTextChunk(fullText);
        } else if (data.type === "error") {
          callbacks.onError(data.content || "Error from Copilot");
        }
      } catch (parseErr) {
        console.error("SSE parse error:", parseErr);
      }
    }
  }

  return fullText;
}
