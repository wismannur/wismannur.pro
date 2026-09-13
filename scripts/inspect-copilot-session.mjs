#!/usr/bin/env node

/**
 * CLI Tool: Inspect CMS Staff Copilot Sessions & Messages
 *
 * Usage:
 *   node scripts/inspect-copilot-session.mjs                    # List recent sessions
 *   node scripts/inspect-copilot-session.mjs --list             # List recent sessions
 *   node scripts/inspect-copilot-session.mjs <session-id>       # View full conversation transcript
 *   node scripts/inspect-copilot-session.mjs <session-id> --prod # Query production database
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

// Load environment variables matching scripts/dev.mjs priority
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
  console.log(`${bold}${cyan}║                      CMS STAFF COPILOT SESSIONS                              ║${reset}`);
  console.log(`${bold}${cyan}╚══════════════════════════════════════════════════════════════════════════════╝${reset}`);
  console.log(`${dim}Target DB: ${isProd ? `${red}PRODUCTION` : `${green}DEVELOPMENT`}${reset}\n`);

  try {
    const rows = await sql`
      SELECT id, title, current_path, message_count, updated_at, created_at
      FROM cms_copilot_sessions
      ORDER BY updated_at DESC
      LIMIT 20
    `;

    if (rows.length === 0) {
      console.log(`${yellow}No Copilot sessions recorded yet.${reset}\n`);
      return;
    }

    console.log(
      `${bold}${"SESSION ID".padEnd(38)} ${"MSGS".padStart(5)}  ${"ROUTE".padEnd(25)} ${"UPDATED".padEnd(16)} TITLE${reset}`
    );
    console.log(`${dim}${"─".repeat(110)}${reset}`);

    for (const r of rows) {
      const id = `${magenta}${r.id}${reset}`;
      const msgs = String(r.message_count || 0).padStart(5);
      const route = (r.current_path || "/cms").slice(0, 24).padEnd(25);
      const date = new Date(r.updated_at || r.created_at).toLocaleString("en-GB", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).padEnd(16);
      const title = (r.title || "New Session").slice(0, 45);

      console.log(`${id} ${msgs}  ${cyan}${route}${reset} ${dim}${date}${reset} ${title}`);
    }

    console.log(`\n${dim}Tip: Run ${bold}node scripts/inspect-copilot-session.mjs <session-id>${reset}${dim} to view full transcript.${reset}\n`);
  } catch (err) {
    console.error(`${red}Failed to query sessions:${reset}`, err.message);
    process.exit(1);
  }
}

async function inspectSession(query) {
  console.log(`\n${bold}${cyan}Fetching CMS Copilot session matching: ${yellow}${query}${reset}...\n`);

  try {
    const sessions = await sql`
      SELECT id, title, current_path, message_count, created_at, updated_at
      FROM cms_copilot_sessions
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
    console.log(`${bold}║ SESSION DETAILS                                                              ║${reset}`);
    console.log(`${bold}╚══════════════════════════════════════════════════════════════════════════════╝${reset}`);
    console.log(`${bold}ID:${reset}           ${magenta}${session.id}${reset}`);
    console.log(`${bold}Title:${reset}        ${session.title}`);
    console.log(`${bold}Route:${reset}        ${cyan}${session.current_path || "N/A"}${reset}`);
    console.log(`${bold}Messages:${reset}     ${session.message_count}`);
    console.log(`${bold}Created At:${reset}   ${new Date(session.created_at).toLocaleString()}`);
    console.log(`${bold}Updated At:${reset}   ${new Date(session.updated_at).toLocaleString()}`);
    console.log(`${dim}${"═".repeat(80)}${reset}\n`);

    const messages = await sql`
      SELECT id, role, content, tool_calls, tool_results, created_at
      FROM cms_copilot_messages
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
        console.log(`${bold}${green}▶ USER${reset} ${dim}[${timeStr}]${reset}`);
        console.log(`${m.content.trim()}\n`);
      } else {
        console.log(`${bold}${blue}🤖 COPILOT (Assistant)${reset} ${dim}[${timeStr}]${reset}`);

        // If tool calls were executed in this turn
        if (m.tool_calls && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
          console.log(`  ${yellow}⚡ Tool Calls Executed (${m.tool_calls.length}):${reset}`);
          for (const tc of m.tool_calls) {
            console.log(`    ${bold}${tc.name}${reset}`);
            if (tc.args && Object.keys(tc.args).length > 0) {
              const formattedArgs = JSON.stringify(tc.args, null, 2)
                .split("\n")
                .map((line) => "      " + line)
                .join("\n");
              console.log(`${dim}${formattedArgs}${reset}`);
            }
          }
        }

        // If tool results are available
        if (m.tool_results && Array.isArray(m.tool_results) && m.tool_results.length > 0) {
          console.log(`  ${cyan}✓ Tool Results (${m.tool_results.length}):${reset}`);
          for (const tr of m.tool_results) {
            console.log(`    ${bold}${tr.name}${reset}: ${tr.result?.success ? green + "SUCCESS" : red + "FAILED"}${reset}`);
            if (tr.result) {
              const summary = JSON.stringify(tr.result, null, 2)
                .split("\n")
                .slice(0, 15) // limit snippet
                .map((line) => "      " + line)
                .join("\n");
              console.log(`${dim}${summary}${reset}`);
            }
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
