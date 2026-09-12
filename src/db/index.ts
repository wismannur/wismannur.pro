import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

// Neon's HTTP driver: one fetch per query, no connection to hold — the right
// shape for serverless/scale-to-zero (compute may be suspended between
// requests). If interactive transactions become necessary later, switch to
// `drizzle-orm/neon-serverless` + `Pool` (WebSocket).
//
// Lazy singleton so merely importing this module (e.g. during `next build` of
// routes that never touch the DB) doesn't require DATABASE_URL.
// `server-only` makes any accidental import from a client component a
// build-time error. Node scripts (seed/migrations) must NOT import this file —
// they create their own client from `./schema` directly.

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const isProd =
    process.env.DB_ENV === "prod" ||
    process.env.DB_ENV === "production" ||
    process.env.NEXT_PUBLIC_DB_ENV === "prod" ||
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" &&
      process.env.DB_ENV !== "dev" &&
      process.env.DB_ENV !== "development");

  const url = isProd
    ? process.env.DATABASE_URL_PROD ||
      process.env.POSTGRES_URL ||
      process.env.PROD_DATABASE_URL ||
      process.env.DATABASE_URL_PRODUCTION ||
      process.env.DATABASE_URL
    : process.env.DATABASE_URL_DEV ||
      process.env.DEV_DATABASE_URL ||
      process.env.DATABASE_URL_DEVELOPMENT ||
      process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Run `vercel env pull .env.local` to fetch it from the Neon⇄Vercel integration."
    );
  }
  return drizzle(neon(url), { schema });
}

export function getDb() {
  return (_db ??= createDb());
}

export { schema };
