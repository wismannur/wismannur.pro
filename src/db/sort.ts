import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

// Postgres puts NULLs first on DESC; the legacy sort treated a missing
// publishedDate as 0 (i.e. last). Shared by the blog/project actions.
export const descNullsLast = (column: AnyPgColumn) => sql`${column} desc nulls last`;

export const countRows = sql<number>`count(*)::int`;
