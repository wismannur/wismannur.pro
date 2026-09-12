#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const rootDir = process.cwd();

// Check if --prod or --production flag is passed in CLI args or DB_ENV
const args = process.argv.slice(2);
const isProd =
	args.includes("--prod") ||
	args.includes("--production") ||
	process.env.DB_ENV === "prod" ||
	process.env.DB_ENV === "production";

// Filter out our custom flags before passing the rest to `next dev`
const forwardedArgs = args.filter(
	(arg) => arg !== "--prod" && arg !== "--production",
);

// If user didn't specify a port in args, default to port 7000
if (!forwardedArgs.includes("-p") && !forwardedArgs.includes("--port")) {
	forwardedArgs.push("-p", "7000");
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

// Visual indicator in console
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const red = "\x1b[31m";
const bold = "\x1b[1m";
const reset = "\x1b[0m";

const targetLabel = isProd
	? `${red}${bold}[ PRODUCTION / MAIN BRANCH ] ⚠️ CAUTION${reset}`
	: `${green}${bold}[ DEVELOPMENT BRANCH ]${reset}`;

console.log(`\n${cyan}┌─────────────────────────────────────────────────────────────┐${reset}`);
console.log(`${cyan}│${reset}  ${bold}Neon DB Environment Selector${reset}                              ${cyan}│${reset}`);
console.log(`${cyan}├─────────────────────────────────────────────────────────────┤${reset}`);
console.log(`${cyan}│${reset}  Target DB: ${targetLabel}`);
console.log(`${cyan}│${reset}  Endpoint : ${yellow}${maskDbUrl(process.env.DATABASE_URL)}${reset}`);
if (isProd) {
	console.log(`${cyan}│${reset}  ${red}Note     : Any CMS edits will affect LIVE PRODUCTION data!${reset}  ${cyan}│${reset}`);
}
console.log(`${cyan}└─────────────────────────────────────────────────────────────┘\n${reset}`);

if (isProd && !process.env.DATABASE_URL_PROD && !process.env.DATABASE_URL) {
	console.error(
		`${red}Error: No production database URL found!${reset}\n` +
			`Please set ${bold}DATABASE_URL_PROD${reset} in your ${bold}.env.local${reset} or create a ${bold}.env.production.local${reset} file.\n`,
	);
	process.exit(1);
}

// Spawn `next dev`
const nextBin = path.join(rootDir, "node_modules", ".bin", "next");
const child = spawn(nextBin, ["dev", ...forwardedArgs], {
	stdio: "inherit",
	env: process.env,
	shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
	} else {
		process.exit(code ?? 0);
	}
});

process.on("SIGINT", () => {
	child.kill("SIGINT");
});

process.on("SIGTERM", () => {
	child.kill("SIGTERM");
});
