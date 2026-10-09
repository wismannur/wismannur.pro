import type { ToolCallInfo } from "@/services/cms-copilot/types";

export function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes}m yang lalu`;
  if (diffHours < 24) return `${diffHours}j yang lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatSessionPath(path?: string | null): string | null {
  if (!path) return null;
  const clean = path.replace(/^\/cms\/?/, "").replace(/\/+/g, " › ").trim();
  return clean || "dashboard";
}

export function buildMarkdownFromSession(
  sessionMeta: {
    id: string;
    title?: string | null;
    currentPath?: string | null;
    createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
    messageCount?: number;
  },
  msgs: Array<{
    id?: string;
    role: "user" | "assistant";
    content: string;
    toolCalls?: ToolCallInfo[];
    createdAt?: string | Date | null;
  }>
): { markdown: string; filename: string } {
  const validMsgs = msgs.filter((m) => m.id !== "copilot-welcome" || msgs.length === 1);
  const now = new Date();
  const createdDate = sessionMeta.createdAt ? new Date(sessionMeta.createdAt) : now;
  const updatedDate = sessionMeta.updatedAt ? new Date(sessionMeta.updatedAt) : now;
  const sessionTitle = sessionMeta.title || "CMS Copilot Session";

  let md = "---\n";
  md += `id: "${sessionMeta.id || "temp-session"}"\n`;
  md += `title: "${sessionTitle.replace(/"/g, '\\"')}"\n`;
  if (sessionMeta.currentPath) {
    md += `current_path: "${sessionMeta.currentPath}"\n`;
  }
  md += `message_count: ${validMsgs.length}\n`;
  md += `created_at: "${createdDate.toISOString()}"\n`;
  md += `updated_at: "${updatedDate.toISOString()}"\n`;
  md += "---\n\n";

  md += `# ${sessionTitle}\n\n`;
  md += `> **Ref ID:** \`${sessionMeta.id || "N/A"}\`  \n`;
  if (sessionMeta.currentPath) {
    md += `> **Context Route:** \`${sessionMeta.currentPath}\`  \n`;
  }
  md += `> **Created At:** ${createdDate.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB  \n`;
  md += `> **Source:** CMS Staff Copilot\n\n`;
  md += `---\n\n`;

  for (const m of validMsgs) {
    const isUser = m.role === "user";
    const headerRole = isUser ? "## 👤 User Prompt" : "## 🤖 Copilot Response";
    const timeStr = m.createdAt
      ? new Date(m.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
      : "";

    md += `${headerRole}${timeStr ? ` *(${timeStr} WIB)*` : ""}\n\n`;

    if (m.toolCalls && Array.isArray(m.toolCalls) && m.toolCalls.length > 0) {
      const toolNames = m.toolCalls.map((t) => `\`${t.name}\``).join(", ");
      md += `> ⚡ *Executed Tools:* ${toolNames}\n\n`;
    }

    md += `${m.content.trim()}\n\n`;
    md += `---\n\n`;
  }

  const cleanSlug = sessionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 45);

  const shortId = sessionMeta.id ? sessionMeta.id.slice(0, 8) : "session";
  const filename = `${shortId}-${cleanSlug || "notes"}.md`;

  return { markdown: md, filename };
}

export function triggerFileDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
