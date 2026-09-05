# wismannur.pro

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.45.2-green?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-336791?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.19-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20GenAI-Gemini%203.8%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Resend](https://img.shields.io/badge/Email-Resend%20v6-black?style=flat-square&logo=resend)](https://resend.com/)

> **Production-grade personal digital ecosystem, technical publication, and full-stack enterprise control plane.**  
> Engineered by **Wisman Nur** with a database-driven architecture, dark-first **Electric Obsidian** design system, streaming **24/7 AI Assistant (RAG + Tool Calling)**, and an end-to-end **Career Hub & Outreaches Orchestrator**.  
> Live at **[wismannur.pro](https://wismannur.pro)**.

---

## Table of Contents

- [1. Executive Architectural Overview](#1-executive-architectural-overview)
- [2. System Topology & Data Flow](#2-system-topology--data-flow)
- [3. Core Subsystems & Capability Matrix](#3-core-subsystems--capability-matrix)
  - [3.1 Public Surface Area (`/`)](#31-public-surface-area-)
  - [3.2 Control Plane (`/cms`)](#32-control-plane-cms)
  - [3.3 24/7 Gemini AI Assistant & RAG Engine](#33-247-gemini-ai-assistant--rag-engine)
  - [3.4 Career Hub & ATS Intelligence](#34-career-hub--ats-intelligence)
  - [3.5 Resend Inbound Pipeline & RFC 5322 Threading](#35-resend-inbound-pipeline--rfc-5322-threading)
- [4. Engineering Invariants & Security Architecture](#4-engineering-invariants--security-architecture)
- [5. Technology Stack](#5-technology-stack)
- [6. Local Development & Operational Runbook](#6-local-development--operational-runbook)
  - [6.1 Prerequisites](#61-prerequisites)
  - [6.2 Quickstart](#62-quickstart)
  - [6.3 Dual-Environment Neon Database Orchestration](#63-dual-environment-neon-database-orchestration)
  - [6.4 Environment Variables Specification](#64-environment-variables-specification)
- [7. CLI Commands & Tooling](#7-cli-commands--tooling)
- [8. Repository Directory Structure](#8-repository-directory-structure)
- [9. Production Deployment Pipeline](#9-production-deployment-pipeline)
- [10. Data Governance & Privacy](#10-data-governance--privacy)
- [11. License](#11-license)

---

## 1. Executive Architectural Overview

This platform is architected around the philosophy of **zero-redeploy content mutations** and **strict edge-to-server isolation**:

- **100% Database-Driven Content**: Every public layout token, MDX article, portfolio case study, pricing tier, workflow stage, FAQ item, testimonial, and availability calendar slot is sourced dynamically from PostgreSQL via Drizzle ORM with selective on-demand Incremental Static Regeneration (ISR).
- **Domain-Driven RPC Service Layer**: Business logic is partitioned into dedicated domain modules under `src/services/<domain>/`, exposing type-safe Next.js Server Actions with uniform error handling (`ServiceError`) and mandatory authorization guards (`assertAdmin`).
- **Edge Proxy Boundary**: Authentication verification for admin routes (`/cms/*`) and login redirects (`/login`) is performed in `src/proxy.ts` using raw JWT verification (`next-auth/jwt`), avoiding heavy cryptographic libraries (`bcryptjs`) or database drivers inside the Edge runtime bundle.
- **Bidirectional Communications Engine**: Integrates Resend with automated inbound webhook ingestion (`/api/webhooks/resend-inbound`), Svix cryptographic signature validation, RFC 5322 thread linking (`In-Reply-To`, `References`), and entity-scoped dynamic routing (`inquiry-{id}@...`, `outreach-{id}@...`).
- **Real-Time Generative AI RAG**: A streaming Server-Sent Events (SSE) chat endpoint (`/api/chat`) leveraging `@google/genai` (Gemini 3.8 / 2.5 Flash / Vertex AI) coupled with database-backed system knowledge context and deterministic tool calling for lead capture.

---

## 2. System Topology & Data Flow

```mermaid
flowchart TB
    subgraph Clients["Clients Layer"]
        PublicUser["Public Visitor (Web / Mobile)"]
        AdminUser["Administrator (CMS Control Plane)"]
        MailClient["Inbound Mail Client (Recruiter / Client)"]
    end

    subgraph EdgeRuntime["Vercel Edge / Proxy Layer (src/proxy.ts)"]
        JWTGuard["JWT Token Guard & Session Router"]
    end

    subgraph NodeRuntime["Node.js Server Runtime (Next.js 16 App Router)"]
        PublicRoutes["Public SSR / ISR Routes (/(public))"]
        CMSRoutes["CMS Admin Pages (/cms/*)"]
        ChatAPI["AI Streaming SSE Endpoint (/api/chat)"]
        WebhookAPI["Resend Inbound Webhook (/api/webhooks/resend-inbound)"]
        ServerActions["Typed RPC Server Actions (src/services/*)"]
    end

    subgraph DataAndAI["Data, Storage & AI Cloud"]
        PostgresDB[("PostgreSQL (Neon Serverless)")]
        GeminiAI["Google Gemini 3.8 / Vertex AI"]
        ResendService["Resend API & SMTP Infrastructure"]
        VercelBlob["Vercel Blob Storage (Media & Assets)"]
    end

    PublicUser --> PublicRoutes
    PublicUser -->|SSE Stream / Prompts| ChatAPI
    PublicUser -->|Submit Lead / Service Request| ServerActions

    AdminUser --> JWTGuard
    JWTGuard -->|Authenticated| CMSRoutes
    CMSRoutes --> ServerActions

    MailClient -->|Inbound Email Reply| ResendService
    ResendService -->|Webhook POST + Svix Signature| WebhookAPI

    ChatAPI -->|RAG Knowledge Hydration| PostgresDB
    ChatAPI -->|Tool Calling / Inference| GeminiAI
    ChatAPI -->|Auto-Create Inquiries| PostgresDB

    WebhookAPI -->|Verify Signature & Deduplicate| PostgresDB
    WebhookAPI -->|Append Thread Message| PostgresDB

    ServerActions -->|Read / Write (Drizzle ORM)| PostgresDB
    ServerActions -->|Dispatch Notifications & Cold Outreaches| ResendService
    ServerActions -->|Upload Images / Avatars| VercelBlob
```

---

## 3. Core Subsystems & Capability Matrix

### 3.1 Public Surface Area (`/`)

- **Electric Obsidian Design System**: Built with modern CSS variables, fluid glassmorphism (`backdrop-blur`), subtle matrix grid overlays, and Framer Motion micro-interactions.
- **Hero & Identity**: Real-time availability indicator, profile stats, core tech competencies, experience & education timeline (`resume_entries`), and CV preview/download engine (`/cv`).
- **Technical Publication (`/blog`, `/blog/[slug]`)**: MDX compilation with Prism syntax highlighting, interactive reading progress bar, reading time calculation, tag-based taxonomy, and optimistic view/like counters.
- **Engineering Portfolio (`/projects`, `/projects/[slug]`)**: Featured case studies, repository & live demo integration, dynamic metadata, and detailed architectural write-ups.
- **Commercial Offerings (`/services`, `/hire-me`, `/offers`)**: Modular service definitions, interactive pricing tiers, workflow roadmap steps, client testimonials, and fixed-price sprint packages.
- **SEO & Social Graph**: Dynamic `sitemap.xml`, `robots.txt`, auto-generated Open Graph cards (`/opengraph-image`), and privacy-first Umami analytics telemetry.

---

### 3.2 Control Plane (`/cms`)

A single-tenant, high-density administration cockpit allowing comprehensive state control over the database:

| Domain | Route | Key Capabilities |
| :--- | :--- | :--- |
| **System Dashboard** | `/cms/dashboard` | Live lead counters, submission trends, recent activity log, and quick actions |
| **Contacts Inbox** | `/cms/contacts` | General inbound inquiries with full two-way threaded message history and status lifecycle |
| **Service Requests** | `/cms/services` | Commercial project leads with budget ranges, delivery timeframes, and tech requirements |
| **Hire Inquiries** | `/cms/hire-requests` | Recruitment opportunities with role specs, compensation expectations, and pipeline tracking |
| **Job Tracker** | `/cms/job-tracker` | Complete ATS application pipeline, interview stages, `.ics` calendar sync, and post-mortems |
| **Job Outreaches** | `/cms/job-outreaches` | Cold pitch email manager with AI composer, RFC 5322 threading headers, and dynamic reply routing |
| **AI Hub & Chat Logs** | `/cms/ai-chat-logs` | Real-time visitor chat transcripts, tool execution inspection, and custom AI knowledge base curation |
| **Publications & Projects** | `/cms/blogs`, `/cms/projects` | Full-featured MDX editor with live split preview, featured flags, tag management, and ISR triggers |
| **Experience & Skills** | `/cms/resume`, `/cms/skills`, `/cms/profile` | Structural date-based career timeline, skill inventory, and public bio configuration |
| **Marketing Modules** | `/cms/pricing`, `/cms/faqs`, `/cms/testimonials` | Modular pricing tiers, accordion FAQs, verified testimonials, and process steps |
| **Offers & Schedule** | `/cms/offers`, `/cms/availability` | Productized service packages and monthly client booking availability slots |
| **Site Copy & Governance**| `/cms/pages`, `/cms/legal`, `/cms/site` | Per-page layout copy overrides, legal policy markdown, global SEO metadata, and AI chat toggles |

---

### 3.3 24/7 Gemini AI Assistant & RAG Engine

The platform features an autonomous AI conversational widget that runs on top of Google Gemini:

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Public Visitor
    participant Widget as UI Chat Widget (SSE)
    participant Route as /api/chat (Next.js Node.js)
    participant RAG as Knowledge Context Builder
    participant DB as PostgreSQL (Neon)
    participant Gemini as Google Gemini 3.8 / Vertex AI
    participant Resend as Resend Notification API

    Visitor->>Widget: Sends prompt ("Are you available for freelance Next.js work?")
    Widget->>Route: POST /api/chat (with recent history & session ID)
    Route->>Route: Check IP rate limiter (in-memory sliding window)
    Route->>RAG: buildKnowledgeContext()
    RAG->>DB: Query profile, skills, projects, services, pricing, faqs, ai_knowledge_items
    DB-->>RAG: Return latest active site records
    RAG-->>Route: Formatted system instruction string
    Route->>Gemini: generateContentStream() with systemInstruction & functionDeclarations
    
    alt Tool Call: submit_hire_inquiry / submit_contact_message
        Gemini-->>Route: Tool Call Intent (execute function with extracted arguments)
        Route->>DB: Insert record into hire_requests / contacts
        Route->>Resend: Dispatch admin email notification & auto-reply
        Route->>Gemini: Return Tool Execution Output
        Gemini-->>Route: Stream final conversational confirmation
    else Direct Conversational Answer
        Gemini-->>Route: Stream tokens via SSE
    end

    Route-->>Widget: SSE stream events (data: {"text": "..."})
    Widget-->>Visitor: Real-time markdown rendering
    Route->>DB: Asynchronously log chat session & message transcript
```

- **SDK & Provider Agnostic**: Configurable for Google AI Studio (`GEMINI_API_KEY`) or enterprise Google Cloud Vertex AI with service account credentials (`GCP_SERVICE_ACCOUNT_KEY` or `GCP_SERVICE_ACCOUNT_BASE64`).
- **Deterministic Tool Calling**: Supports `submit_hire_inquiry` and `submit_contact_message` tools that parse unstructured conversation into strongly typed database leads and trigger immediate asynchronous Resend notifications.
- **Safety & Rate Limiting**: Built-in sliding-window IP rate limiter preventing abuse without impacting legitimate user interactions.

---

### 3.4 Career Hub & ATS Intelligence

Designed to eliminate friction in career progression and recruitment tracking:

1. **Full-Lifecycle Pipeline Kanban**: Tracks applications across discrete states: `wishlist` → `applied` → `screening` → `interview_hr` → `interview_tech` → `interview_user` → `offering` → `accepted` / `rejected` / `withdrawn` / `ghosted`.
2. **ATS Resume Matching Engine**: Compares raw job descriptions against structured candidate resume data, computing matching scores, keyword coverage, and actionable bullet-point recommendations.
3. **Interview Management & `.ics` Calendar Sync**: Generates RFC 5545 `.ics` calendar invite files for scheduled interview stages (HR screening, Live Coding, System Design, Leadership) with direct video meeting links.
4. **Compensation Matrix**: Compares base salary, bonuses, workplace mode (remote/hybrid/onsite), and calculates annualized net values.
5. **Cross-Platform DOM Bookmarklet**: A single-click browser bookmarklet (`src/lib/job-tracker.ts`) that extracts job metadata (title, company, logo, salary, requirements) from LinkedIn, Jobstreet, Glints, and TechInAsia directly into the CMS pipeline.

---

### 3.5 Resend Inbound Pipeline & RFC 5322 Threading

The communication pipeline supports complete two-way asynchronous email threading:

1. **Entity-Scoped Dynamic Reply Routing**:
   - Inbound inquiries use `inquiry-{id}@wismannur.pro`
   - Cold job outreaches use `outreach-{id}@wismannur.pro`
2. **RFC 5322 Thread Headers**:
   - Outbound emails inject persistent `Message-ID`, `In-Reply-To`, and `References` headers.
3. **Webhook Ingestion & Signature Verification**:
   - The route `/api/webhooks/resend-inbound` verifies incoming webhook payloads using **Svix** (`RESEND_WEBHOOK_SECRET`).
   - Implements transactional deduplication (`message_id` check) to guarantee exactly-once message ingestion.
   - Cleans raw HTML/text bodies using `src/lib/email-cleaner.ts` (stripping quoted history and client boilerplate).

---

## 4. Engineering Invariants & Security Architecture

To maintain high code quality and runtime security, the following invariants are enforced across the codebase:

- [x] **RPC Authentication Guard**: Every mutating Server Action **must** invoke `assertAdmin()` from `@/services/core/auth-guard` before executing database transactions.
- [x] **Zero Edge Crypto Leakage**: `src/proxy.ts` must never import `src/auth.ts`, `bcryptjs`, or Drizzle database drivers. Token validation occurs purely via `next-auth/jwt`.
- [x] **Cache Invalidation on Mutation**: Any CMS mutation that modifies public content must trigger `revalidatePath()` on affected routes (`/`, `/blog`, `/projects`, `/services`, `/sitemap.xml`).
- [x] **Database Single Source of Truth**: All schema modifications originate in `src/db/schema.ts` and are versioned through `drizzle-kit generate` into `src/db/migrations/`.
- [x] **Data Hygiene & Anonymity in Git**: The seed data in `src/db/migrations/` consists solely of fictional placeholder content ("John Doe"). Real personal data, private outreach logs, and client inquiries reside solely in the isolated production database.

---

## 5. Technology Stack

```
Core Framework       : Next.js 16.3.0 (App Router, Server Actions, React Compiler)
Runtime Engine       : Node.js 24.x (LTS) · React 19.2.4 · TypeScript 5.x
UI & Styling         : Tailwind CSS 3.4.19 · Radix UI Primitives (shadcn/ui) · Framer Motion 11.x
Database & ORM       : PostgreSQL (Neon Serverless) · Drizzle ORM 0.45.2 · Drizzle Kit 0.31.10
Authentication       : Auth.js v5 (next-auth 5.0.0-beta.32) · JWT Session Strategy · bcryptjs
Generative AI & LLM  : Google GenAI SDK (@google/genai 2.19.0) · Gemini 3.8 / 2.5 Flash · Vertex AI
Email Infrastructure : Resend 6.24.0 · React Email 1.0.12 · Svix 2.1.0 (Webhook HMAC Verification)
Content Processing   : Unified · Remark 11 · Rehype 8 · Rehype-Sanitize · PrismJS Syntax Highlighting
State & Forms        : TanStack React Query v5 · React Hook Form 7.x · Zod 3.23.8
Assets & Analytics   : Vercel Blob Storage · Umami Analytics · Google reCAPTCHA v3
```

---

## 6. Local Development & Operational Runbook

### 6.1 Prerequisites

- **Node.js**: `^24.0.0` (enforced via `package.json` engines)
- **Package Manager**: `pnpm` (version `11.5.1` or higher via `corepack enable`)
- **Database Instance**: A PostgreSQL database (free [Neon](https://neon.tech) serverless branch recommended)

---

### 6.2 Quickstart

```bash
# 1. Clone repository
git clone https://github.com/wismannur/wismannur.pro.git
cd wismannur.pro

# 2. Install pinned dependencies
pnpm install

# 3. Configure local environment (see spec below)
cp .env.example .env.local

# 4. Apply schema migrations
pnpm db:migrate

# 5. Launch development server (default port: 7000)
pnpm dev
```

---

### 6.3 Dual-Environment Neon Database Orchestration

The project includes an intelligent development orchestrator in `scripts/dev.mjs` that isolates development schema experiments from production data:

```bash
# Connects to Neon DEVELOPMENT branch
pnpm dev

# Connects to Neon PRODUCTION branch (with safety warning banner)
pnpm dev:prod
```

```
┌─────────────────────────────────────────────────────────────┐
│  Neon DB Environment Selector                               │
├─────────────────────────────────────────────────────────────┤
│  Target DB: [ DEVELOPMENT BRANCH ]                          │
│  Endpoint : postgresql://neondb_owner:••••••••@ep-dev...     │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.4 Environment Variables Specification

Create `.env.local` in the project root:

```bash
# =============================================================================
# 1. DATABASE CONFIGURATION (Neon Serverless PostgreSQL)
# =============================================================================
DATABASE_URL="postgresql://user:pass@ep-dev.region.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_DEV="postgresql://user:pass@ep-dev.region.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_PROD="postgresql://user:pass@ep-prod.region.aws.neon.tech/neondb?sslmode=require"

# =============================================================================
# 2. AUTHENTICATION & SECURITY (Auth.js v5)
# =============================================================================
AUTH_SECRET="your-32-byte-base64-auth-secret" # openssl rand -base64 32
ADMIN_EMAIL="admin@example.com"
# Next.js env parsing mangles '$' in bcrypt hashes. Generate base64-encoded bcrypt:
ADMIN_PASSWORD_HASH_B64="..."

# =============================================================================
# 3. SITE RUNTIME CONFIGURATION
# =============================================================================
NEXT_PUBLIC_SITE_URL="http://localhost:7000"

# =============================================================================
# 4. GOOGLE GEMINI / VERTEX AI (24/7 AI Assistant Engine)
# =============================================================================
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-3.8-flash"

# Optional: Google Cloud Vertex AI enterprise mode
USE_VERTEX_AI="false"
GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
GOOGLE_CLOUD_LOCATION="global"
# GCP_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
# GCP_SERVICE_ACCOUNT_BASE64="..."

# =============================================================================
# 5. RESEND EMAIL INFRASTRUCTURE & WEBHOOKS
# =============================================================================
RESEND_API_KEY="re_..."
RESEND_EMAIL_DOMAIN="wismannur.pro"
NEXT_PUBLIC_RESEND_EMAIL_DOMAIN="wismannur.pro"
RESEND_WEBHOOK_SECRET="whsec_..."
ADMIN_NOTIFICATION_EMAIL="admin@example.com"
RESEND_FROM_NOTIFICATIONS="Wisman Nur <notifications@wismannur.pro>"
RESEND_FROM_HI="Wisman Nur <hi@wismannur.pro>"

# =============================================================================
# 6. CAPTCHA, STORAGE & TELEMETRY
# =============================================================================
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="..."
RECAPTCHA_SECRET_KEY="..."
BLOB_READ_WRITE_TOKEN="..." # Vercel Blob token for file uploads
NEXT_PUBLIC_UMAMI_WEBSITE_ID="..."
NEXT_PUBLIC_UMAMI_SCRIPT_URL="https://cloud.umami.is/script.js"
```

> **Base64 Bcrypt Password Generator:**
> ```bash
> node -e "const b=require('bcryptjs');console.log(Buffer.from(b.hashSync(process.argv[1],10)).toString('base64'))" 'YOUR_RAW_PASSWORD'
> ```

---

## 7. CLI Commands & Tooling

| Command | Script / Execution | Technical Description |
| :--- | :--- | :--- |
| `pnpm dev` | `node scripts/dev.mjs` | Spawns Next dev server targeting `DATABASE_URL_DEV` on port **7000** |
| `pnpm dev:prod` | `node scripts/dev.mjs --prod` | Spawns Next dev server targeting `DATABASE_URL_PROD` with safety guards |
| `pnpm build` | `drizzle-kit migrate && next build` | Applies pending migrations in order, then executes Next.js production build |
| `pnpm start` | `next start` | Runs the compiled production server |
| `pnpm lint` | `eslint` | Executes ESLint 9 checks across all TypeScript and React files |
| `pnpm typecheck` | `tsc --noEmit` | Strict zero-emission TypeScript compiler type verification |
| `pnpm db:generate` | `drizzle-kit generate` | Generates a new migration SQL file from `src/db/schema.ts` |
| `pnpm db:migrate` | `drizzle-kit migrate` | Executes unapplied SQL migrations against the active database |
| `pnpm db:push` | `drizzle-kit push` | Synchronizes schema definitions directly with the target database (dev only) |
| `pnpm db:studio` | `drizzle-kit studio` | Starts Drizzle Studio web GUI for direct visual database inspection |

---

## 8. Repository Directory Structure

```
.
├── scripts/
│   └── dev.mjs                       # Multi-environment CLI database orchestrator
├── src/
│   ├── app/
│   │   ├── (public)/                 # Public SSR/ISR routes (home, about, blog, projects, etc.)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # Auth.js route handlers
│   │   │   ├── chat/                 # Gemini AI SSE streaming endpoint with tool calling
│   │   │   └── webhooks/resend-inbound/ # Svix-verified email webhook receiver
│   │   ├── cms/                      # CMS Admin pages (one directory per domain + forms)
│   │   ├── cv/                       # CV preview and print engine
│   │   ├── login/                    # Credentials sign-in view
│   │   ├── layout.tsx                # Root layout with global providers & AI assistant widget
│   │   ├── opengraph-image.tsx       # Dynamic edge Open Graph image generator
│   │   ├── robots.ts                 # Dynamic robots.txt generator
│   │   └── sitemap.ts                # Dynamic sitemap.xml generator
│   ├── auth.ts                       # Server-only Auth.js credentials configuration
│   ├── proxy.ts                      # Edge middleware proxy (JWT session validation)
│   ├── db/
│   │   ├── schema.ts                 # Drizzle PostgreSQL schema (single source of truth)
│   │   ├── index.ts                  # Lazy server-only Neon database connection singleton
│   │   └── migrations/               # Version-controlled SQL migration journal
│   ├── services/                     # Domain-driven Server Actions & contracts
│   │   ├── ai-chat/                  # Gemini client, tool declarations & RAG context builder
│   │   ├── blog/                     # Blog actions, mutations & path revalidation
│   │   ├── contacts/                 # Contact inquiries & reply threads
│   │   ├── core/                     # Base service, auth guards & shared email dispatchers
│   │   ├── job-tracker/              # Career Hub: ATS analyzer, pipeline & interview stages
│   │   ├── job-outreaches/           # AI cold email composer, tracking & message threads
│   │   ├── project/                  # Portfolio case studies & MDX storage
│   │   ├── service-requests/         # Commercial service leads & reply threads
│   │   ├── hire-requests/            # Recruitment pipeline & direct hire leads
│   │   └── ...                       # availability, faqs, offers, pricing, resume, site-settings
│   ├── features/                     # Domain-specific UI features (career hub, blog, projects)
│   ├── components/
│   │   ├── ai-chat/                  # 24/7 floating AI conversational widget & modal
│   │   ├── mdx/                      # MDX rendering components (code blocks, callouts)
│   │   ├── ui/                       # shadcn/ui design primitives (Radix UI)
│   │   └── ...                       # Layouts, navigation, cards, footer
│   ├── hooks/                        # Custom React hooks (reading-progress, theme, media-query)
│   └── lib/                          # Utility modules (gemini, mdx, resend, site-url, umami)
└── drizzle.config.ts                 # Drizzle Kit CLI configuration
```

---

## 9. Production Deployment Pipeline

The application is engineered for continuous deployment on **[Vercel](https://vercel.com)**:

1. **Continuous Deployment**: Every push to `main` triggers a build pipeline.
2. **Automated Zero-Downtime Migrations**: The build command (`pnpm build`) executes `drizzle-kit migrate` before `next build`. Schema migrations are transactionally applied before incoming traffic hits new application bundles.
3. **Environment Isolation**: Set production environment variables (`DATABASE_URL_PROD`, `AUTH_SECRET`, `RESEND_API_KEY`, etc.) inside the Vercel Project Dashboard.

---

## 10. Data Governance & Privacy

- **Open-Source Integrity**: This is an open-source codebase. Seed data in `src/db/migrations/` contains **strictly synthetic placeholder data** ("John Doe").
- **Zero Production Data Leakage**: Real personal identities, corporate outreach logs, candidate resumes, client service requests, and communication transcripts are strictly stored within the private production PostgreSQL instance.

---

## 11. License

Personal project and proprietary digital platform — feel free to explore the source code for architectural reference and inspiration. Design system, technical publications, and branding are © [Wisman Nur](https://wismannur.pro). All rights reserved.

