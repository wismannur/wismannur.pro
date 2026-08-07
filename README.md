# wismannur.pro

Personal website, blog, and portfolio of **Wisman Nur** — with a fully self-hosted CMS to manage every piece of content on the site. Live at [wismannur.pro](https://wismannur.pro).

## Features

### Public site (`/`)

- **Home, About, Contact** — profile, skills, resume timeline, and a contact form protected by reCAPTCHA
- **Blog** (`/blog`) — MDX-powered articles with syntax highlighting (Prism), reading time, reading progress bar, and tag filtering
- **Projects** (`/projects`) — portfolio showcase with MDX detail pages
- **Services & Hire Me** (`/services`, `/hire-me`) — service catalog, pricing tiers, process steps, FAQs, testimonials, and availability status
- **Offers** (`/offers`) — promotional offers
- **Legal** — privacy policy & terms of service (editable from the CMS)
- **SEO** — dynamic sitemap, robots.txt, and Open Graph image generation built in

### CMS (`/cms`)

A private admin panel (single-admin, credentials login at `/login`) that manages the entire site from the database — no redeploy needed to change content:

| Area | What it manages |
| --- | --- |
| Dashboard | Content & inquiry overview |
| Blogs / Projects | MDX content with live preview, publish state |
| Profile / Resume / Skills | About-page data & experience/education timeline |
| Services / Pricing / FAQs / Process steps / Testimonials | Everything on the services & hire-me pages |
| Offers / Availability | Promos and open-for-work status |
| Pages / Legal / Site | Per-page copy, legal documents, and global site settings (theme, color scheme) |
| Contacts | Inbound messages & service requests with status tracking |

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS · [shadcn/ui](https://ui.shadcn.com) (Radix UI) · Framer Motion |
| Database | PostgreSQL ([Neon](https://neon.tech) serverless) · [Drizzle ORM](https://orm.drizzle.team) |
| Auth | [Auth.js v5](https://authjs.dev) (next-auth) — credentials + JWT, route-guarded via Next 16 `proxy.ts` |
| Content | MDX rendered with unified/remark/rehype (sanitized) · Prism syntax highlighting |
| Data fetching | Server Actions + TanStack Query |
| Forms | React Hook Form + Zod |
| Uploads | Vercel Blob (avatars, images) |
| Analytics | Umami |
| Hosting | Vercel |

## Getting started

### Prerequisites

- **Node.js 24.x** (see `engines` in `package.json`)
- **pnpm** (`corepack enable` is enough)
- A **PostgreSQL** database (a free [Neon](https://neon.tech) project works out of the box)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```bash
# Database (required)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Auth.js (required)
AUTH_SECRET="..."                # npx auth secret, or: openssl rand -base64 32
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD_HASH_B64="..."    # base64-encoded bcrypt hash — see below

# Site
NEXT_PUBLIC_SITE_URL="http://localhost:7000"

# Contact form (optional in dev — reCAPTCHA is production-gated)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="..."
RECAPTCHA_SECRET_KEY="..."

# Analytics (optional)
NEXT_PUBLIC_UMAMI_WEBSITE_ID="..."
NEXT_PUBLIC_UMAMI_SCRIPT_URL="..."

# Uploads (optional — needed for CMS image/avatar uploads)
BLOB_READ_WRITE_TOKEN="..."
```

> **Why base64?** bcrypt hashes contain `$`, which Next's `.env` loader mangles through variable expansion. Generate the value with:
>
> ```bash
> node -e "const b=require('bcryptjs');console.log(Buffer.from(b.hashSync(process.argv[1],10)).toString('base64'))" 'your-password'
> ```

### 3. Set up the database

```bash
pnpm db:migrate   # apply migrations from src/db/migrations
```

### 4. Run

```bash
pnpm dev          # http://localhost:7000
```

Log in to the CMS at `/login` with the `ADMIN_EMAIL` / password you configured, then start filling in content.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server on port **7000** |
| `pnpm build` | Runs pending DB migrations, then `next build` |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate a new migration from `src/db/schema.ts` changes |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema directly (dev only) |
| `pnpm db:studio` | Drizzle Studio — browse the DB in a UI |

## Project structure

```
src/
├── app/
│   ├── (public)/        # Public pages: about, blog, projects, services, hire-me, …
│   ├── login/           # Admin login page
│   ├── cms/             # Admin panel (one folder per content area, + form/ subroutes)
│   ├── api/auth/        # Auth.js route handlers
│   ├── sitemap.ts       # SEO: sitemap, robots, OG image
│   └── layout.tsx
├── proxy.ts             # Next 16 middleware successor — JWT guard for /cms/*
├── auth.ts              # Auth.js config (server-only; never imported by proxy.ts)
├── db/
│   ├── schema.ts        # Drizzle schema — single source of truth for all tables
│   └── migrations/      # Generated SQL migrations (applied during build)
├── services/            # Data layer: one folder per domain (actions.ts, types.ts)
├── features/            # Feature-specific UI (blog grid/filters, project views, …)
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── mdx/             # MDX rendering components
│   └── …                # layout, cards, forms, site-pages
├── hooks/               # use-reading-progress, use-pagination, use-theme, …
└── lib/                 # mdx pipeline, site metadata, utils
```

### Architecture notes

- **Everything is database-driven.** Blog posts, projects, page copy, settings — all live in Postgres and are edited through the CMS. Deploys are for code, not content.
- **Server Actions as the data layer.** Each domain under `src/services/<domain>/` exposes typed actions consumed by both public pages and the CMS (with TanStack Query on the client side).
- **Auth split by design.** `src/auth.ts` (bcrypt + DB driver) is server-only; `src/proxy.ts` guards `/cms/*` by verifying the JWT cookie directly with `next-auth/jwt`, keeping heavy deps out of the edge bundle.
- **MDX is stored, not filed.** Content is MDX text in the DB, compiled at render time through a sanitized unified pipeline with Prism highlighting and a live preview in the CMS editor.

## Deployment

Deployed on **Vercel**. `pnpm build` runs `drizzle-kit migrate` before `next build`, so schema migrations apply automatically on every deploy — just make sure all environment variables above are set in the Vercel project.

## License

Personal project — feel free to browse the code for inspiration, but the content and design are © Wisman Nur.
