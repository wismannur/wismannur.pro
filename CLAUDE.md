# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev          # dev server with Neon development DB (port 7000)
pnpm dev --prod   # dev server with Neon production DB / main branch (alias: pnpm dev:prod)
pnpm build        # runs drizzle-kit migrate FIRST, then next build — needs DATABASE_URL
pnpm lint         # eslint
pnpm exec tsc --noEmit   # typecheck (no test suite exists in this repo)

pnpm db:generate  # generate migration from src/db/schema.ts changes (works offline)
pnpm db:migrate   # apply migrations (needs DATABASE_URL in .env.local)
pnpm db:studio    # browse the DB
```

Environment lives in `.env.local` (never committed). You can configure `DATABASE_URL` (or `DATABASE_URL_DEV` and `DATABASE_URL_PROD` for easy switching between Neon branches). Required: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH_B64`. The password hash is base64-encoded because bcrypt hashes contain `$`, which Next's env loader mangles via variable expansion. See README for the full list.

## Architecture

Personal site + blog/portfolio with a self-hosted CMS. Everything content-related lives in Postgres (Neon) and is edited through `/cms` — deploys ship code, not content.

**Route layout** (`src/app/`): `(public)/` public pages · `cms/` admin panel (each area = `page.tsx` list + `form/` subroutes) · `login/` admin sign-in · `api/auth/[...nextauth]` Auth.js handlers.

**Data layer** — `src/services/<domain>/{actions.ts,types.ts,index.ts}`. Each domain exposes `"use server"` actions built on Drizzle (`getDb()` from `@/db`). Critical invariants:

- **Every admin/mutating action must call `assertAdmin()` (or `requireAdminUid()`) from `services/core/auth-guard` first.** Server actions are public POST endpoints; the `/cms/*` proxy guard only protects page navigation, not the RPC layer.
- **CMS mutations must `revalidatePath()` the public routes they affect** (see `revalidateBlogPaths` in `services/blog/actions.ts` for the pattern). `/blog/[slug]`, `/projects/[slug]`, and the sitemap are SSG and read the DB at build time — without revalidation, published edits only appear after a redeploy.
- Errors are thrown as `ServiceError` (`services/core/base-service.ts`).

**Auth split (deliberate, do not merge)** — `src/auth.ts` is Auth.js v5 credentials config (bcrypt + DB driver, server-only); `src/proxy.ts` is the Next 16 middleware successor guarding `/cms/*` and `/login`, and verifies the JWT cookie directly via `next-auth/jwt`. `proxy.ts` must never import `auth.ts` — that would pull bcrypt and the DB driver into the edge bundle. Single admin; identity comes from env vars, not the `users` table.

**Database** — schema single source of truth is `src/db/schema.ts`; migrations in `src/db/migrations/` are applied automatically during `pnpm build` (i.e., on every Vercel deploy). Drizzle decides what to apply by the timestamps in `meta/_journal.json`, not file hashes. `getDb()` is a lazy server-only singleton; standalone scripts must not import `@/db` and should create their own client from `./schema`.

**Content pipeline** — blog/project bodies are MDX text stored in the DB, rendered through the sanitized unified pipeline in `src/lib/mdx.ts` with Prism highlighting; MDX UI components live in `src/components/mdx/`.

**Client side** — TanStack Query for CMS data fetching, `contexts/auth-context` wraps Auth.js sign-in/out, forms use React Hook Form + Zod, UI primitives are shadcn/ui in `src/components/ui/`.

## Public-repo rules

- This is a public repository. The seed data in `src/db/migrations/` is deliberately fictional placeholder content ("John Doe") — never seed real personal data, real pricing, or real contact info into migrations or code. Real content lives only in the production DB via the CMS.
- Editing the content of an already-applied migration is safe for existing databases (timestamp-based dedupe), but never edit `meta/_journal.json` timestamps.

## Commit conventions

- Never add `Co-Authored-By: Claude ...` or any other AI attribution trailer to commit messages in this repo.
