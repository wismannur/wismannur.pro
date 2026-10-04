#!/usr/bin/env node

/**
 * CLI Tool: Inspect Public Portfolio AI Chat Logs & Messages
 *
 * Usage:
 *   node scripts/inspect-ai-chat-session.mjs                    # List recent visitor chat sessions
 *   node scripts/inspect-ai-chat-session.mjs --list             # List recent visitor chat sessions
 *   node scripts/inspect-ai-chat-session.mjs <session-id>       # View full conversation transcript
 *   node scripts/inspect-ai-chat-session.mjs <session-id> --prod # Query production database
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

const rootDir = process.cwd();
const rawArgs = process.argv.slice(2);

const isProd = rawArgs.includes("--prod") || rawArgs.includes("--production");
const isList =
  rawArgs.includes("--list") || rawArgs.includes("-l") || rawArgs.filter((a) => !a.startsWith("-")).length === 0;

const targetSessionQuery = rawArgs.find((a) => !a.startsWith("-"));

// ANSI color codes for terminal
const reset = "\x1b[0m";
const bold = "\x1b[1m";
const dim = "\x1b[2m";
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
const magenta = "\x1b[35m";
const red = "\x1b[31m";

function getDatabaseUrl() {
  const envFiles = isProd
    ? [".env.production.local", ".env.local", ".env.production", ".env"]
    : [".env.development.local", ".env.local", ".env.development", ".env"];

  const env = {};
  for (const file of envFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const parsed = dotenv.parse(fs.readFileSync(filePath));
      Object.assign(env, parsed);
    }
  }

  const url = isProd
    ? env.DATABASE_URL_PROD || env.DATABASE_URL || env.POSTGRES_URL
    : env.DATABASE_URL_DEV || env.DATABASE_URL || env.POSTGRES_URL;

  if (!url) {
    console.error(`${red}Error: No database URL found in environment files.${reset}`);
    process.exit(1);
  }

  return url;
}

const dbUrl = getDatabaseUrl();
const sql = neon(dbUrl);

async function listSessions() {
  console.log(`\n${bold}${cyan}╔══════════════════════════════════════════════════════════════════════════════╗${reset}`);
  console.log(`${bold}${cyan}║                      AI CHAT LOGS (VISITOR ASSISTANT)                        ║${reset}`);
  console.log(`${bold}${cyan}╚══════════════════════════════════════════════════════════════════════════════╝${reset}`);
  console.log(`${dim}Target DB: ${isProd ? `${red}PRODUCTION` : `${green}DEVELOPMENT`}${reset}\n`);

  try {
    const rows = await sql`
      SELECT id, title, visitor_id, ip_address, message_count, updated_at, created_at
      FROM ai_chat_sessions
      ORDER BY updated_at DESC
      LIMIT 20
    `;

    if (rows.length === 0) {
      console.log(`${yellow}No visitor chat sessions recorded yet.${reset}\n`);
      return;
    }

    console.log(
      `${bold}${"SESSION ID".padEnd(38)} ${"MSGS".padStart(5)}  ${"IP ADDRESS".padEnd(18)} ${"UPDATED".padEnd(16)} TITLE${reset}`
    );
    console.log(`${dim}${"─".repeat(110)}${reset}`);

    for (const r of rows) {
      const id = `${magenta}${r.id}${reset}`;
      const msgs = String(r.message_count || 0).padStart(5);
      const ip = (r.ip_address || "N/A").slice(0, 17).padEnd(18);
      const date = new Date(r.updated_at || r.created_at).toLocaleString("en-GB", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).padEnd(16);
      const title = (r.title || "New Conversation").slice(0, 45);

      console.log(`${id} ${msgs}  ${cyan}${ip}${reset} ${dim}${date}${reset} ${title}`);
    }

    console.log(`\n${dim}Tip: Run ${bold}node scripts/inspect-ai-chat-session.mjs <session-id>${reset}${dim} to view full transcript.${reset}\n`);
  } catch (err) {
    console.error(`${red}Failed to query sessions:${reset}`, err.message);
    process.exit(1);
  }
}

async function inspectSession(query) {
  console.log(`\n${bold}${cyan}Fetching AI Chat session matching: ${yellow}${query}${reset}...\n`);

  try {
    const sessions = await sql`
      SELECT id, title, visitor_id, ip_address, user_agent, message_count, created_at, updated_at
      FROM ai_chat_sessions
      WHERE id = ${query} OR id ILIKE ${query + "%"}
      LIMIT 1
    `;

    if (sessions.length === 0) {
      console.log(`${red}Session not found for query: "${query}".${reset}`);
      console.log(`${dim}Use --list to view all available sessions.${reset}\n`);
      return;
    }

    const session = sessions[0];

    console.log(`${bold}╔══════════════════════════════════════════════════════════════════════════════╗${reset}`);
    console.log(`${bold}║ AI CHAT SESSION DETAILS                                                      ║${reset}`);
    console.log(`${bold}╚══════════════════════════════════════════════════════════════════════════════╝${reset}`);
    console.log(`${bold}ID:${reset}           ${magenta}${session.id}${reset}`);
    console.log(`${bold}Title:${reset}        ${session.title}`);
    console.log(`${bold}Visitor ID:${reset}   ${cyan}${session.visitor_id || "N/A"}${reset}`);
    console.log(`${bold}IP Address:${reset}   ${session.ip_address || "N/A"}`);
    console.log(`${bold}User Agent:${reset}   ${dim}${session.user_agent || "N/A"}${reset}`);
    console.log(`${bold}Messages:${reset}     ${session.message_count}`);
    console.log(`${bold}Created At:${reset}   ${new Date(session.created_at).toLocaleString()}`);
    console.log(`${bold}Updated At:${reset}   ${new Date(session.updated_at).toLocaleString()}`);
    console.log(`${dim}${"═".repeat(80)}${reset}\n`);

    const messages = await sql`
      SELECT id, role, content, tool_call_name, tool_call_args, tool_call_result, created_at
      FROM ai_chat_messages
      WHERE session_id = ${session.id}
      ORDER BY created_at ASC
    `;

    if (messages.length === 0) {
      console.log(`${yellow}No messages recorded for this session.${reset}\n`);
      return;
    }

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const isUser = m.role === "user";
      const timeStr = new Date(m.created_at).toLocaleTimeString();

      if (isUser) {
        console.log(`${bold}${green}▶ VISITOR (User)${reset} ${dim}[${timeStr}]${reset}`);
        console.log(`${m.content.trim()}\n`);
      } else {
        console.log(`${bold}${blue}🤖 WISMAN AI ASSISTANT${reset} ${dim}[${timeStr}]${reset}`);

        if (m.tool_call_name) {
          console.log(`  ${yellow}⚡ Tool Executed: ${bold}${m.tool_call_name}${reset}`);
          if (m.tool_call_args) {
            console.log(`${dim}${JSON.stringify(m.tool_call_args, null, 2)}${reset}`);
          }
        }

        console.log(`${m.content.trim()}`);
        console.log(`\n${dim}${"─".repeat(80)}${reset}\n`);
      }
    }
  } catch (err) {
    console.error(`${red}Inspection error:${reset}`, err);
    process.exit(1);
  }
}

if (isList) {
  await listSessions();
} else {
  await inspectSession(targetSessionQuery);
}
