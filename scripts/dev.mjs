#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import dotenv from "dotenv";

const rootDir = process.cwd();

// Visual indicators and colors
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const red = "\x1b[31m";
const bold = "\x1b[1m";
const dim = "\x1b[2m";
const reset = "\x1b[0m";

// Check if --prod or --production flag is passed in CLI args or DB_ENV
const args = process.argv.slice(2);
const isProd =
  args.includes("--prod") ||
  args.includes("--production") ||
  process.env.DB_ENV === "prod" ||
  process.env.DB_ENV === "production";

const withCloudflared =
  args.includes("--cloudflared") ||
  args.includes("--tunnel") ||
  process.env.ENABLE_CLOUDFLARED === "true";

const isQuickTunnel = args.includes("--quick");

// Filter out our custom flags before passing the rest to `next dev`
const forwardedArgs = args.filter(
  (arg) =>
    arg !== "--prod" &&
    arg !== "--production" &&
    arg !== "--cloudflared" &&
    arg !== "--tunnel" &&
    arg !== "--quick"
);

// Helper to check if a port is currently available
function isPortAvailable(portNum) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(portNum);
  });
}

// Find next available port starting from startPort
async function findAvailablePort(startPort, maxAttempts = 10) {
  let candidate = Number(startPort);
  for (let i = 0; i < maxAttempts; i++) {
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
    candidate++;
  }
  return Number(startPort);
}

// Extract port or default to 7000
let explicitPort = false;
let port = 7000;
const pIndex = forwardedArgs.indexOf("-p");
const portIndex = forwardedArgs.indexOf("--port");

if (pIndex !== -1 && forwardedArgs[pIndex + 1]) {
  port = Number(forwardedArgs[pIndex + 1]);
  explicitPort = true;
} else if (portIndex !== -1 && forwardedArgs[portIndex + 1]) {
  port = Number(forwardedArgs[portIndex + 1]);
  explicitPort = true;
}

const originalPort = port;
let portSwitched = false;

if (!(await isPortAvailable(port))) {
  if (explicitPort) {
    console.warn(
      `\n${yellow}⚠️  Warning: Specified port ${port} is already in use.${reset}\n`
    );
  } else {
    port = await findAvailablePort(originalPort);
    portSwitched = true;
  }
}

// Update forwardedArgs with the resolved port
if (pIndex !== -1 && forwardedArgs[pIndex + 1]) {
  forwardedArgs[pIndex + 1] = String(port);
} else if (portIndex !== -1 && forwardedArgs[portIndex + 1]) {
  forwardedArgs[portIndex + 1] = String(port);
} else {
  forwardedArgs.push("-p", String(port));
}

/**
 * Load .env files in priority order for the given target environment
 */
function loadEnvironment(targetProd) {
  // Base env files
  const envFiles = targetProd
    ? [
        ".env.production.local",
        ".env.local",
        ".env.production",
        ".env",
      ]
    : [
        ".env.development.local",
        ".env.local",
        ".env.development",
        ".env",
      ];

  // Load files into process.env if they exist
  for (const file of envFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const envConfig = dotenv.parse(fs.readFileSync(filePath));
      for (const k in envConfig) {
        if (!process.env[k]) {
          process.env[k] = envConfig[k];
        }
      }
    }
  }

  // Suffix-based variable resolution within single .env.local
  if (targetProd) {
    process.env.DB_ENV = "prod";
    process.env.NEXT_PUBLIC_DB_ENV = "prod";

    const prodUrl =
      process.env.DATABASE_URL_PROD ||
      process.env.POSTGRES_URL ||
      process.env.PROD_DATABASE_URL ||
      process.env.DATABASE_URL_PRODUCTION ||
      process.env.NEON_DATABASE_URL_PROD;

    if (prodUrl) {
      process.env.DATABASE_URL = prodUrl;
    }

    const prodUnpooled =
      process.env.DATABASE_URL_UNPOOLED_PROD ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.PROD_DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL_NON_POOLING_PROD;
    if (prodUnpooled) {
      process.env.DATABASE_URL_UNPOOLED = prodUnpooled;
    }

    const prodPostgresUrl =
      process.env.POSTGRES_URL_PROD ||
      process.env.POSTGRES_URL ||
      process.env.PROD_POSTGRES_URL;
    if (prodPostgresUrl) {
      process.env.POSTGRES_URL = prodPostgresUrl;
    }
  } else {
    process.env.DB_ENV = "dev";
    process.env.NEXT_PUBLIC_DB_ENV = "dev";

    const devUrl =
      process.env.DATABASE_URL_DEV ||
      process.env.DEV_DATABASE_URL ||
      process.env.DATABASE_URL_DEVELOPMENT ||
      process.env.NEON_DATABASE_URL_DEV;

    if (devUrl) {
      process.env.DATABASE_URL = devUrl;
    }

    const devUnpooled =
      process.env.DATABASE_URL_UNPOOLED_DEV ||
      process.env.DEV_DATABASE_URL_UNPOOLED;
    if (devUnpooled) {
      process.env.DATABASE_URL_UNPOOLED = devUnpooled;
    }
  }
}

loadEnvironment(isProd);

// Helper to mask credentials for safe terminal logging
function maskDbUrl(dbUrl) {
  if (!dbUrl) return "NOT CONFIGURED";
  try {
    const parsed = new URL(dbUrl);
    const auth = parsed.username
      ? `${parsed.username}:••••••••@`
      : "";
    return `${parsed.protocol}//${auth}${parsed.host}${parsed.pathname}`;
  } catch {
    return "Valid URL (hidden for security)";
  }
}

const targetLabel = isProd
  ? `${red}${bold}[ PRODUCTION / MAIN BRANCH ] ⚠️ CAUTION${reset}`
  : `${green}${bold}[ DEVELOPMENT BRANCH ]${reset}`;

const customDomain = isProd
  ? "https://local-prod.wismannur.pro"
  : "https://local-dev.wismannur.pro";

console.log(`\n${cyan}┌─────────────────────────────────────────────────────────────┐${reset}`);
console.log(`${cyan}│${reset}  ${bold}Neon DB Environment Selector${reset}                              ${cyan}│${reset}`);
console.log(`${cyan}├─────────────────────────────────────────────────────────────┤${reset}`);
console.log(`${cyan}│${reset}  Target DB  : ${targetLabel}`);
console.log(`${cyan}│${reset}  Endpoint   : ${yellow}${maskDbUrl(process.env.DATABASE_URL)}${reset}`);
console.log(`${cyan}│${reset}  Port       : ${cyan}${port}${portSwitched ? ` ${yellow}(switched from ${originalPort})${reset}` : ""}${reset}`);
if (withCloudflared) {
  console.log(`${cyan}│${reset}  Tunnel     : ${green}${bold}[ macbook-local -> ${customDomain} ]${reset}`);
}
if (isProd) {
  console.log(`${cyan}│${reset}  ${red}Note       : Any CMS edits will affect LIVE PRODUCTION data!${reset}  ${cyan}│${reset}`);
}
console.log(`${cyan}└─────────────────────────────────────────────────────────────┘\n${reset}`);

if (portSwitched && originalPort === 7000) {
  console.log(
    `  ${yellow}ℹ Note: Port 7000 is occupied by macOS ControlCenter (AirPlay Receiver).${reset}\n` +
    `  ${green}➜ Server automatically switched to port ${port}.${reset}\n` +
    `  ${yellow}⚠️ Cloudflare route Anda diarahkan ke port 7000!${reset}\n` +
    `  ${dim}Agar https://local-dev.wismannur.pro terhubung ke Next.js, matikan AirPlay Receiver:${reset}\n` +
    `  ${dim}System Settings > General > AirDrop & Handoff > nonaktifkan AirPlay Receiver.${reset}\n`
  );
}

if (isProd && !process.env.DATABASE_URL_PROD && !process.env.DATABASE_URL) {
  console.error(
    `${red}Error: No production database URL found!${reset}\n` +
      `Please set ${bold}DATABASE_URL_PROD${reset} in your ${bold}.env.local${reset} or create a ${bold}.env.production.local${reset} file.\n`,
  );
  process.exit(1);
}

// Find cloudflared executable (macOS Apple Silicon / Intel / Linux / PATH)
function findCloudflaredBin() {
  if (process.env.CLOUDFLARED_BIN && fs.existsSync(process.env.CLOUDFLARED_BIN)) {
    return process.env.CLOUDFLARED_BIN;
  }

  const candidates = [
    "/opt/homebrew/bin/cloudflared", // Homebrew Apple Silicon
    "/usr/local/bin/cloudflared",    // Homebrew Intel / Linux
    "/usr/bin/cloudflared",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return "cloudflared";
}

let cloudflaredChild = null;
let tunnelUrl = null;

function printTunnelBanner(url, localPort, subtitle = "Tunnel Active") {
  console.log(`\n${cyan}┌─────────────────────────────────────────────────────────────┐${reset}`);
  console.log(`${cyan}│${reset}  ${bold}${green}⚡ Cloudflare Tunnel Active${reset} (${subtitle})`);
  console.log(`${cyan}├─────────────────────────────────────────────────────────────┤${reset}`);
  console.log(`${cyan}│${reset}  Local URL   : ${cyan}http://localhost:${localPort}${reset}`);
  console.log(`${cyan}│${reset}  Custom URL  : ${bold}${yellow}${url}${reset}`);
  console.log(`${cyan}└─────────────────────────────────────────────────────────────┘${reset}`);

  // On macOS, automatically copy the custom public URL to clipboard
  if (process.platform === "darwin") {
    try {
      const pbcopy = spawn("pbcopy");
      pbcopy.stdin.write(url);
      pbcopy.stdin.end();
      console.log(`  ${green}✔ ${url} copied to clipboard!${reset}\n`);
    } catch {
      // ignore clipboard error
    }
  } else {
    console.log("");
  }
}

let isShuttingDown = false;

// Spawn cloudflared if requested
if (withCloudflared) {
  const cloudflaredBin = findCloudflaredBin();
  const tunnelToken = process.env.CLOUDFLARED_TOKEN || process.env.CLOUDFLARE_TUNNEL_TOKEN;
  const tunnelName = process.env.CLOUDFLARED_TUNNEL_NAME || process.env.CLOUDFLARE_TUNNEL_NAME || "macbook-local";

  let cloudflaredArgs;
  let isNamedTunnel = false;

  if (process.env.CLOUDFLARED_ARGS) {
    cloudflaredArgs = process.env.CLOUDFLARED_ARGS.split(/\s+/);
  } else if (tunnelToken) {
    cloudflaredArgs = ["tunnel", "run", "--token", tunnelToken];
    isNamedTunnel = true;
  } else if (isQuickTunnel) {
    cloudflaredArgs = ["tunnel", "--url", `http://localhost:${port}`];
  } else {
    // Default to configured named tunnel 'macbook-local'
    cloudflaredArgs = ["tunnel", "run", tunnelName];
    isNamedTunnel = true;
  }

  const tunnelModeLabel = isNamedTunnel ? `${tunnelName}` : "Quick Tunnel";
  console.log(`  ${cyan}[cloudflared]${reset} Connecting tunnel (${bold}${tunnelModeLabel}${reset}) -> ${cyan}http://localhost:${port}${reset}...`);

  cloudflaredChild = spawn(cloudflaredBin, cloudflaredArgs, {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  if (isNamedTunnel) {
    tunnelUrl = customDomain;
    printTunnelBanner(tunnelUrl, port, `macbook-local`);
  }

  const handleOutput = (data) => {
    const text = data.toString();

    // Match TryCloudflare public URL if running quick tunnel
    if (!tunnelUrl) {
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match) {
        tunnelUrl = match[0];
        printTunnelBanner(tunnelUrl, port, "Quick Tunnel");
      }
    }

    if (process.env.CLOUDFLARED_VERBOSE === "true") {
      process.stderr.write(`${dim}[cloudflared] ${text}${reset}`);
    } else if (/ERR|error|fatal/i.test(text) && !/failed to request quick Tunnel.*retry/i.test(text)) {
      if (/Cannot determine default origin certificate|credentials file|tunnel not found/i.test(text)) {
        console.error(
          `\n${yellow}⚠️  Cloudflare named tunnel '${tunnelName}' memerlukan token otentikasi.${reset}\n` +
          `  Jika dibuat lewat Zero Trust Dashboard, masukkan token ke ${bold}.env.local${reset}:\n` +
          `  ${cyan}CLOUDFLARED_TOKEN=eyJh...${reset}\n` +
          `  Atau gunakan TryCloudflare quick tunnel sementara:\n` +
          `  ${cyan}pnpm dev:cloudflared --quick${reset}\n`
        );
      } else {
        process.stderr.write(`${red}[cloudflared error] ${text}${reset}`);
      }
    }
  };

  cloudflaredChild.stdout.on("data", handleOutput);
  cloudflaredChild.stderr.on("data", handleOutput);

  cloudflaredChild.on("error", (err) => {
    if (err.code === "ENOENT") {
      console.error(
        `\n${red}${bold}[cloudflared error] Binary '${cloudflaredBin}' not found!${reset}\n` +
          `Make sure cloudflared is installed:\n` +
          `  ${cyan}brew install cloudflared${reset}\n`
      );
    } else {
      console.error(`\n${red}[cloudflared error] ${err.message}${reset}\n`);
    }
  });

  cloudflaredChild.on("exit", (code, signal) => {
    if (!isShuttingDown) {
      console.warn(
        `\n${yellow}[cloudflared] Tunnel process terminated${
          code !== null ? ` (code: ${code})` : signal ? ` (signal: ${signal})` : ""
        }.${reset}`
      );
    }
  });
}

// Spawn `next dev`
const nextBin = fs.existsSync(path.join(rootDir, "node_modules", ".bin", "next"))
  ? path.join(rootDir, "node_modules", ".bin", "next")
  : "next";

const child = spawn(nextBin, ["dev", ...forwardedArgs], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (cloudflaredChild && !cloudflaredChild.killed) {
    try {
      cloudflaredChild.kill("SIGTERM");
    } catch {}
  }
  if (child && !child.killed) {
    try {
      child.kill("SIGTERM");
    } catch {}
  }

  setTimeout(() => process.exit(code), 200).unref();
}

child.on("exit", (code, signal) => {
  if (signal) {
    shutdown(1);
  } else {
    shutdown(code ?? 0);
  }
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("exit", () => shutdown(0));
