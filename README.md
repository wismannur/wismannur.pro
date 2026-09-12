# wismannur.pro

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.45.2-green?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-336791?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.19-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20GenAI-Gemini%203.8%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Resend](https://img.shields.io/badge/Email-Resend%20v6-black?style=flat-square&logo=resend)](https://resend.com/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5.0.0--beta.32-black?style=flat-square&logo=auth0)](https://authjs.dev/)

> **Production-grade personal digital ecosystem, technical publication, and full-stack enterprise control plane.**  
> Engineered by **Wisman Nur** with a database-driven architecture, dark-first **Electric Obsidian** design system, streaming **24/7 Public Visitor AI Assistant (RAG + Deterministic Tool Calling)**, autonomous **AI CMS Staff Copilot (110+ tools across 8 operational modules)**, an end-to-end **Career Hub & ATS Intelligence Platform**, interactive **Storefront Modernization Concept Showcases (`/showcase/[slug]`)**, and a bidirectional **Resend Inbound Email Engine with RFC 5322 Threading**.  
> Live at **[wismannur.pro](https://wismannur.pro)**.

---

## Table of Contents

- [1. Executive Architectural Overview](#1-executive-architectural-overview)
- [2. System Topology & Data Flow](#2-system-topology--data-flow)
- [3. Core Subsystems & Capability Matrix](#3-core-subsystems--capability-matrix)
  - [3.1 Public Surface Area & Interactive Showcases](#31-public-surface-area--interactive-showcases)
  - [3.2 Enterprise CMS Control Plane (`/cms`)](#32-enterprise-cms-control-plane-cms)
  - [3.3 AI CMS Staff Copilot (Autonomous Control Agent)](#33-ai-cms-staff-copilot-autonomous-control-agent)
  - [3.4 24/7 Visitor AI Assistant & RAG Engine](#34-247-visitor-ai-assistant--rag-engine)
  - [3.5 Finder Project Hub & E-Commerce Modernization Showcases](#35-finder-project-hub--e-commerce-modernization-showcases)
  - [3.6 Career Hub & ATS Intelligence](#36-career-hub--ats-intelligence)
  - [3.7 AI English Fluency Hub](#37-ai-english-fluency-hub)
  - [3.8 Resend Communications Engine & RFC 5322 Threading](#38-resend-communications-engine--rfc-5322-threading)
  - [3.9 Secure Asset Streaming & Proxy Route](#39-secure-asset-streaming--proxy-route)
- [4. Database Architecture (33 PostgreSQL Models)](#4-database-architecture-33-postgresql-models)
- [5. Engineering Invariants & Security Architecture](#5-engineering-invariants--security-architecture)
- [6. Technology Stack](#6-technology-stack)
- [7. Local Development & Operational Runbook](#7-local-development--operational-runbook)
  - [7.1 Prerequisites](#71-prerequisites)
  - [7.2 Quickstart](#72-quickstart)
  - [7.3 Dual-Environment Neon Database Orchestration](#73-dual-environment-neon-database-orchestration)
  - [7.4 Environment Variables Specification](#74-environment-variables-specification)
- [8. CLI Commands & Tooling](#8-cli-commands--tooling)
- [9. Repository Directory Structure](#9-repository-directory-structure)
- [10. Production Deployment Pipeline](#10-production-deployment-pipeline)
- [11. Data Governance & Privacy](#11-data-governance--privacy)
- [12. License](#12-license)

---

## 1. Executive Architectural Overview

This platform is architected around the principles of **zero-redeploy content mutations**, **high-density operational control**, and **strict edge-to-server isolation**:

- **100% Database-Driven Content**: Every public layout token, MDX publication, portfolio case study, pricing tier, workflow stage, FAQ item, testimonial, and availability calendar slot is sourced dynamically from PostgreSQL (Neon) via Drizzle ORM with selective on-demand Incremental Static Regeneration (ISR).
- **Dual AI Orchestration Engine**:
  1. **Public Visitor AI Assistant (`/api/chat`)**: Real-time streaming conversational agent (Server-Sent Events) powered by Google Gemini 3.8 Flash, featuring dynamic RAG knowledge hydration across 7 database tables and deterministic function calling for autonomous lead capture (`submit_contact_message`, `submit_hire_inquiry`).
  2. **AI CMS Staff Copilot (`/api/cms/copilot/chat`)**: Multi-turn admin copilot equipped with **110+ Google GenAI function-calling tools** covering all 8 CMS modules, wired with live page context (`useRegisterCmsPageContext`) and destructive action safety guardrails.
- **Domain-Driven RPC Service Layer**: Business logic is cleanly partitioned into 27 dedicated domain modules under `src/services/<domain>/`, exposing type-safe Next.js Server Actions with uniform error handling (`ServiceError`) and mandatory authorization guards (`assertAdmin`).
- **Edge Proxy Boundary**: Authentication verification for admin routes (`/cms/*`) and login redirects (`/login`) is performed in `src/proxy.ts` using raw JWT verification (`next-auth/jwt`), avoiding heavy cryptographic libraries (`bcryptjs`) or database drivers inside the Edge runtime bundle.
- **Bidirectional Communications Engine**: Integrates Resend with automated inbound webhook ingestion (`/api/webhooks/resend-inbound`), Svix cryptographic signature validation, RFC 5322 thread linking (`In-Reply-To`, `References`), entity-scoped dynamic routing (`inquiry-{id}@...`, `outreach-{id}@...`), and 10 custom React Email templates.
- **Targeted Storefront Modernization Showcases**: High-impact, unindexed client pitch hubs (`/showcase/[slug]`) combining live Core Web Vitals audits, before-and-after architecture comparisons (e.g. monolithic PHP/jQuery vs. Nuxt 4 SSR / Next.js), interactive ROI metrics, and video walkthroughs.

---

## 2. System Topology & Data Flow

```mermaid
flowchart TB
    subgraph Clients["Clients Layer"]
        PublicUser["Public Visitor (Web / Mobile)"]
        ShowcaseViewer["Enterprise Prospect / Client"]
        AdminUser["Administrator / Staff (CMS Control Plane)"]
        MailClient["Inbound Mail Client (Recruiter / Client)"]
    end

    subgraph EdgeRuntime["Vercel Edge / Proxy Layer (src/proxy.ts)"]
        JWTGuard["JWT Token Guard & Session Router"]
    end

    subgraph NodeRuntime["Node.js Server Runtime (Next.js 16 App Router)"]
        PublicRoutes["Public SSR / ISR Routes (/(public))"]
        ShowcaseRoutes["Modernization Showcases (/showcase/[slug])"]
        CMSRoutes["CMS Admin Cockpit (/cms/*)"]
        ChatAPI["Visitor AI SSE Endpoint (/api/chat)"]
        CopilotAPI["Staff Copilot API (/api/cms/copilot/chat)"]
        WebhookAPI["Resend Inbound Webhook (/api/webhooks/resend-inbound)"]
        AttachmentAPI["Blob Streaming Proxy (/attachments/[...path])"]
        ServerActions["Typed RPC Server Actions (src/services/*)"]
    end

    subgraph DataAndAI["Data, Storage & AI Cloud"]
        PostgresDB[("PostgreSQL (Neon Serverless - 33 Tables)")]
        GeminiAI["Google GenAI (Gemini 3.8 / 2.5 Flash / Vertex AI)"]
        ResendService["Resend API & Inbound Infrastructure"]
        VercelBlob["Vercel Blob Storage (Media & Attachments)"]
    end

    PublicUser --> PublicRoutes
    PublicUser -->|SSE Stream / Prompts| ChatAPI
    PublicUser -->|Submit Lead / Service Request| ServerActions

    ShowcaseViewer --> ShowcaseRoutes
    ShowcaseRoutes -->|Read Prospect Audit & Concept| PostgresDB

    AdminUser --> JWTGuard
    JWTGuard -->|Authenticated Session| CMSRoutes
    CMSRoutes -->|Live Page Context & Function Calls| CopilotAPI
    CMSRoutes --> ServerActions

    MailClient -->|Inbound Email Reply| ResendService
    ResendService -->|Webhook POST + Svix Signature| WebhookAPI

    ChatAPI -->|RAG Knowledge Hydration| PostgresDB
    ChatAPI -->|Inference & Lead Tools| GeminiAI
    ChatAPI -->|Auto-Create Inquiries| PostgresDB

    CopilotAPI -->|110+ Domain Function Calling| GeminiAI
    CopilotAPI -->|Execute Tool Mutations| ServerActions
    CopilotAPI -->|Log Sessions & History| PostgresDB

    WebhookAPI -->|Verify Signature & Deduplicate| PostgresDB
    WebhookAPI -->|Append Thread Message| PostgresDB

    AttachmentAPI -->|Fetch & Stream with Immutable Cache| VercelBlob

    ServerActions -->|Read / Write (Drizzle ORM)| PostgresDB
    ServerActions -->|Dispatch Notifications & Outreaches| ResendService
    ServerActions -->|Upload Media & Files| VercelBlob
```

---

## 3. Core Subsystems & Capability Matrix

### 3.1 Public Surface Area & Interactive Showcases

- **Electric Obsidian Design System**: Built with modern CSS variables, fluid glassmorphism (`backdrop-blur-xl`), matrix grid overlays, and Framer Motion micro-interactions.
- **Hero & Identity (`/`)**: Real-time availability status indicator, profile stats, core tech competencies, experience & education timeline (`resume_entries`), and CV preview/download engine (`/cv`).
- **About & Technical Matrix (`/about`)**: Comprehensive background, career timeline, categorized skills matrix with interactive category pills, and personal engineering philosophy.
- **Technical Publication (`/blog`, `/blog/[slug]`)**: MDX compilation with Prism syntax highlighting, interactive reading progress indicator, reading time calculation, tag-based taxonomy, and optimistic view/like counters.
- **Engineering Portfolio (`/projects`, `/projects/[slug]`)**: Featured case studies, repository & live demo integration, dynamic metadata, and detailed architectural write-ups.
- **Commercial Offerings (`/services`, `/hire-me`)**: Modular service definitions, interactive pricing tiers, workflow roadmap steps, client testimonials, and fixed-price sprint packages.
- **Direct Contact & Inquiries (`/contact`)**: Form lead capture with Google reCAPTCHA v3 protection, automated Resend email dispatch, and threaded reply tracking.
- **Storefront Modernization Concept Showcases (`/showcase/[slug]`)**: Tailored client pitch pages (e.g., `/showcase/maxaro`) featuring:
  - Estimated Core Web Vitals optimizations (LCP 4.2s → 0.9s, INP < 100ms, CLS 0.0).
  - Detected legacy tech stack breakdowns vs. modernized Nuxt 4 / Next.js SSR architecture.
  - Interactive ROI conversion lift modeling (+18% to +24% mobile checkout completion).
  - Live interactive demo links and Loom video walkthrough embeds.
  - Hardened privacy via `robots: { index: false, follow: false }` metadata.
- **Legal Compliance (`/privacy-policy`, `/terms-of-service`)**: Dynamic legal documents parsed directly from database MDX in `site_pages`.
- **SEO & Social Graph**: Dynamic `sitemap.xml`, `robots.txt`, auto-generated Open Graph cards (`/opengraph-image`), and privacy-first Umami analytics telemetry.

---

### 3.2 Enterprise CMS Control Plane (`/cms`)

A high-density single-tenant cockpit organized into 8 distinct operational domains:

| Group | Route | Subsystems & Capabilities |
| :--- | :--- | :--- |
| **1. General** | `/cms/dashboard` | Aggregated executive command center: publication stats, unread inquiries, pending client briefs, upcoming interviews, and system alerts. |
| **2. Career Hub** | `/cms/job-hunter`<br>`/cms/job-tracker`<br>`/cms/job-outreaches` | Direct ATS feeds (Ashby, Greenhouse, Lever, etc.), 11-stage Kanban application tracker, interview stages, RFC 5545 `.ics` calendar sync, and cold email outreach engine with dynamic reply routing. |
| **3. Finder Project Hub** | `/cms/project-hunter`<br>`/cms/project-tracker`<br>`/cms/project-outreaches` | High-value e-commerce modernization sourcing (EU, NA, ANZ), instant legacy tech audit (Magento 1, PHP, jQuery), conversion lift ROI pitch generator, prospect pipeline, and showcase URL generator (`/showcase/[slug]`). |
| **4. AI Assistant** | `/cms/ai-knowledge`<br>`/cms/ai-english-fluency`<br>`/cms/ai-chat-logs` | RAG knowledge base curation, English fluency practice hub with CEFR scoring & TTS, and visitor conversation transcript inspector. |
| **5. Inbox & Leads** | `/cms/contacts`<br>`/cms/services`<br>`/cms/hire-requests` | 2-way threaded email management for general contacts, commercial project briefs, and talent recruitment inquiries. |
| **6. Site Architecture** | `/cms/site`<br>`/cms/pages`<br>`/cms/legal` | Global metadata, SEO tags, footer social links, per-page hero copy/CTA overrides, and MDX legal policy document editor. |
| **7. Content & Catalog** | `/cms/blogs`<br>`/cms/projects`<br>`/cms/resume`<br>`/cms/skills`<br>`/cms/service-catalog`<br>`/cms/faqs`<br>`/cms/process-steps`<br>`/cms/testimonials`<br>`/cms/availability` | Complete CRUD & publishing workflow for Articles, Case Studies, Career History, Skills Matrix, Commercial Services, FAQs, How-It-Works Steps, Testimonials, and Consultation Booking Slots. |
| **8. Account & System** | `/cms/profile`<br>`/cms/settings` | Admin credentials, bio, avatar cropper, appearance preferences (theme, color schemes), and notification rules. |

---

### 3.3 AI CMS Staff Copilot (Autonomous Control Agent)

Mounted persistently inside `CmsLayout` (`src/components/cms/copilot/cms-copilot-panel.tsx`), the **AI CMS Staff Copilot** acts as an autonomous staff engineer and executive assistant:

```
src/services/cms-copilot/
├── tools.ts                     # Aggregator & Facade registering 110+ Google GenAI tools
├── types.ts                     # Contract definitions & tool execution interfaces
└── domains/
    ├── dashboard-tools.ts       # 1. get_cms_dashboard_summary
    ├── career-hub-tools.ts      # 2. 23 tools for Job Hunter, Tracker & Outreaches
    ├── project-hub-tools.ts     # 3. 9 tools for Project Hunter, Audits & Outreaches
    ├── ai-assistant-tools.ts    # 4. 17 tools for Knowledge Hub, Fluency & Visitor Logs
    ├── inbox-leads-tools.ts     # 5. 14 tools for Contacts, Service Requests & Hires
    ├── site-architecture-tools.ts # 6. 10 tools for Site Settings, Page Copy & Legal MDX
    ├── content-catalog-tools.ts # 7. 33 tools for Blogs, Projects, Skills, FAQs, etc.
    └── account-system-tools.ts  # 8. 4 tools for Profile & Preferences
```

#### Key Capabilities:
- **110+ Tool Function Declarations**: Uses `@google/genai` function calling to interact directly with Neon PostgreSQL without human SQL errors.
- **Dynamic Live Page Context (`useRegisterCmsPageContext`)**: Automatically captures current table rows, active filters, search queries, pagination, and visible records from the screen so the Copilot answers contextually without prompting.
- **Contextual Quick Prompts**: Bottom suggestion chips dynamically adapt based on the active CMS route (e.g. suggesting tech stack audits on `/cms/project-hunter` or draft review on `/cms/blogs`).
- **Destructive Mutation Guardrails**: Explicit safety rules require human confirmation before performing destructive actions (permanent deletion, purging chat logs).
- **Session Telemetry & CLI Inspector**: All conversation turns are logged to `cms_copilot_sessions` and `cms_copilot_messages` and inspectable via CLI (`pnpm copilot:inspect` or `pnpm copilot:list`).

---

### 3.4 24/7 Visitor AI Assistant & RAG Engine

A floating public AI conversational widget powered by Google Gemini:

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

    Visitor->>Widget: Sends prompt ("Are you available for contract Next.js work?")
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

- **SDK & Provider Agnostic**: Configurable for Google AI Studio (`GEMINI_API_KEY`) or enterprise Google Cloud Vertex AI (`USE_VERTEX_AI="true"`).
- **Deterministic Tool Calling**: Converts unstructured conversation into structured database leads (`submit_hire_inquiry`, `submit_contact_message`) with instant Resend notifications.
- **Safety & Rate Limiting**: Built-in sliding-window IP rate limiter preventing prompt injection and abuse.

---

### 3.5 Finder Project Hub & E-Commerce Modernization Showcases

Targeted sourcing engine for mid-market European, North American, and ANZ brands:

- **Niche Hunter**: Pre-curated datasets across Luxury D2C, Home & Living, Outdoor Mobility, and B2B Wholesale.
- **Instant Web Auditor**: Evaluates legacy stacks (Magento 1, monolithic PHP, outdated jQuery), calculates estimated Core Web Vitals (LCP, CLS), and measures mobile checkout friction.
- **AI Proposal & Pitch Generator**: Synthesizes audit findings into tailored modernization pitches highlighting estimated conversion lifts (+15% to +28%) and headless transition roadmaps (Nuxt 4 / Next.js + Tailwind CSS).
- **Interactive Modernization Concept Showcases (`/showcase/[slug]`)**: Dedicated client landing pages presenting technical architecture solutions, interactive performance comparisons, and video walkthroughs.
- **Multi-Market Clocks**: Real-time timezone monitoring for CET (Amsterdam), ET (New York), PT (Los Angeles), and AEST (Sydney) indicating active business hours.

---

### 3.6 Career Hub & ATS Intelligence

Designed for international senior technical leadership and engineering recruitment:

- **Full-Lifecycle Pipeline Kanban**: 11 application states (`wishlist` → `applied` → `screening` → `interview_hr` → `interview_tech` → `interview_user` → `offering` → `accepted`).
- **Direct ATS Feeds**: Direct API discovery integrations querying Ashby, Greenhouse, Lever, Jobicy, RemoteOK, Remotive, and Arbeitnow.
- **ATS Resume Matcher**: Evaluates job descriptions against candidate resume data, computing match percentages and keyword optimizations.
- **Interview Scheduler & `.ics` Sync**: Generates RFC 5545 `.ics` calendar invites for interviews with meeting links and stage classifications.
- **Cross-Platform Bookmarklet**: One-click DOM extractor (`src/lib/job-tracker.ts`) saving job listings from LinkedIn, Jobstreet, and Glints into the CMS.

---

### 3.7 AI English Fluency Hub

An autonomous conversational fluency training environment for global technical communications:

- **CEFR Level Progression**: Structured learning units targeting B2 (Professional), C1 (Advanced Technical), and C2 (Mastery/Executive).
- **Interactive Practice Sessions**: AI audio and text scenarios simulating architecture reviews, salary negotiations, and executive presentations.
- **Speech Synthesis (TTS)**: Built-in text-to-speech engine (`src/services/ai-english-fluency/tts.ts`) providing natural native voice models.
- **Vocabulary Bank & Mastery**: Real-time extraction of technical idioms, phrasal verbs, and collocation tracking.
- **Streak & Analytics**: Daily streak tracking and retention metrics.

---

### 3.8 Resend Communications Engine & RFC 5322 Threading

Complete two-way asynchronous email communication:

1. **Entity-Scoped Dynamic Reply Routing**:
   - Inbound inquiries use `inquiry-{id}@wismannur.pro`
   - Cold job outreaches use `outreach-{id}@wismannur.pro`
2. **RFC 5322 Thread Headers**:
   - Injects persistent `Message-ID`, `In-Reply-To`, and `References` headers for native mail client threading (Gmail, Apple Mail, Outlook).
3. **Webhook Ingestion & Signature Verification**:
   - The route `/api/webhooks/resend-inbound` verifies incoming payloads using **Svix** (`RESEND_WEBHOOK_SECRET`).
   - Transactional deduplication ensures exactly-once message ingestion.
   - HTML/Text parser (`src/lib/email-cleaner.ts`) strips client boilerplate and quoted history.
4. **10 Custom React Email Templates (`src/components/emails/`)**:
   - `admin-contact-notification.tsx`
   - `admin-direct-email-alert.tsx`
   - `admin-hire-request-notification.tsx`
   - `admin-inbound-alert.tsx`
   - `admin-reply-to-client.tsx`
   - `admin-service-request-notification.tsx`
   - `client-contact-auto-reply.tsx`
   - `client-hire-request-auto-reply.tsx`
   - `client-service-request-auto-reply.tsx`
   - `job-outreach-email.tsx`

---

### 3.9 Secure Asset Streaming & Proxy Route

- **Vercel Blob Storage Integration**: Uploads avatars, case study hero banners, and project attachments via `@vercel/blob`.
- **Dedicated Proxy Route (`/attachments/[...path]`)**:
  - Securely proxies assets from the blob store host.
  - Enforces `inline` Content-Disposition and long-term immutable caching (`public, max-age=31536000, immutable`).
  - Preserves exact content types and content lengths.

---

## 4. Database Architecture (33 PostgreSQL Models)

All database tables are declaratively defined in `src/db/schema.ts` and managed via Drizzle ORM:

```
General & Editorial:
├── blogs                        # MDX articles, reading time, view/like counters, tags
├── projects                     # Portfolio case studies, technologies, demo/repo URLs
├── resume_entries               # Experience & education timeline items
└── site_pages                   # Dynamic legal MDX pages (Privacy, Terms)

Inbox, Leads & Communications:
├── contacts                     # Public contact inquiries
├── service_requests             # Commercial client project briefs
├── hire_requests                # Direct talent acquisition and recruitment leads
└── inquiry_messages             # Two-way threaded message history for leads

Career Hub & Recruitment:
├── job_applications             # ATS job tracking pipeline (Kanban status, salary, company)
├── job_interviews               # Scheduled interview stages (screening, coding, system design)
├── job_outreaches               # Cold recruitment campaigns and target contacts
├── job_outreach_messages        # Threaded outreach email messages (RFC 5322)
└── ats_target_companies         # Pre-configured high-priority ATS targets

Finder Project Hub:
└── project_prospects            # E-commerce modernization prospects, audits, and pitches

AI Assistant & Copilot:
├── ai_knowledge_items           # Curated knowledge base entries for RAG hydration
├── ai_chat_sessions             # Public visitor AI assistant sessions
├── ai_chat_messages             # Visitor AI chat transcripts and tool call logs
├── cms_copilot_sessions         # Staff Copilot conversation sessions
└── cms_copilot_messages         # Staff Copilot message logs and tool execution records

AI English Fluency:
├── ai_english_sessions          # Fluency practice audio/text sessions
├── ai_english_vocabularies      # Tracked vocabulary words, definitions, and mastery levels
├── ai_english_streaks           # Practice streaks and active activity dates
└── ai_english_curriculum_progress # Unit and lesson completion progress

Marketing, Catalog & Governance:
├── skills                       # Skills matrix entries and category order
├── services                     # Commercial services catalog (pricing, features, scope)
├── faqs                         # Categorized accordion FAQs
├── process_steps                # How-it-works roadmap steps (services / hire-me)
├── testimonials                 # Verified client recommendations and ratings
├── availability_slots           # Monthly client booking slots (available/limited/booked)
├── page_copy                    # Per-page hero titles, subtitles, and CTA copy
├── site_settings                # Global SEO metadata, social URLs, and footer bio
├── users                        # Admin user account (email, password hash)
└── user_settings                # Admin preferences (theme mode, color scheme, notifications)
```

---

## 5. Engineering Invariants & Security Architecture

The following engineering invariants are strictly enforced across the codebase:

- [x] **RPC Authentication Guard**: Every mutating Server Action **must** invoke `assertAdmin()` from `@/services/core/auth-guard` before executing database operations.
- [x] **Zero Edge Crypto Leakage**: `src/proxy.ts` must never import `src/auth.ts`, `bcryptjs`, or database drivers. Session validation occurs purely via `next-auth/jwt`.
- [x] **Cache Invalidation on Mutation**: Any CMS mutation that modifies public content triggers `revalidatePath()` on affected routes (`/`, `/blog`, `/projects`, `/services`, `/sitemap.xml`).
- [x] **Single Source of Truth**: All schema changes originate in `src/db/schema.ts` and are versioned through `drizzle-kit generate` into `src/db/migrations/`.
- [x] **Synthetic Seed Data**: Migration seeds in `src/db/migrations/` contain **strictly fictional placeholder data** ("John Doe"). Real operational data resides solely in the production PostgreSQL instance.
- [x] **Strict Type Safety**: The codebase enforces `0` TypeScript compilation errors via `pnpm typecheck` (`tsc --noEmit`).
- [x] **Standardized Entity IDs**: All record identifiers adhere to `<prefix>-<YYMMDDHHMM>-<5char lowercase>` generated by `src/lib/id-generator.ts`.

---

## 6. Technology Stack

```
Core Framework       : Next.js 16.3.4 (App Router, Server Actions, React Compiler)
Runtime Engine       : Node.js 24.x (LTS) · React 19.2.4 · TypeScript 5.x
UI & Styling         : Tailwind CSS 3.4.19 · Radix UI Primitives (shadcn/ui) · Framer Motion 11.x · Lucide Icons
Database & ORM       : PostgreSQL (Neon Serverless) · Drizzle ORM 0.45.2 · Drizzle Kit 0.31.10
Authentication       : Auth.js v5 (next-auth 5.0.0-beta.32) · JWT Session Strategy · bcryptjs
Generative AI & LLM  : Google GenAI SDK (@google/genai 2.19.0) · Gemini 3.8 Flash / 2.5 Flash · Vertex AI
Email Infrastructure : Resend 6.24.0 · React Email 1.0.12 · Svix 2.1.0 (Webhook HMAC Verification)
Content Processing   : Unified · Remark 11 · Rehype 8 · Rehype-Sanitize · PrismJS Syntax Highlighting
State & Forms        : TanStack React Query v5 · React Hook Form 7.x · Zod 3.23.8
Assets & Analytics   : Vercel Blob Storage · Umami Analytics · Google reCAPTCHA v3
```

---

## 7. Local Development & Operational Runbook

### 7.1 Prerequisites

- **Node.js**: `^24.0.0` (enforced via `package.json` engines)
- **Package Manager**: `pnpm` (version `11.5.1` or higher via `corepack enable`)
- **Database Instance**: A PostgreSQL database (free [Neon](https://neon.tech) serverless branch recommended)

---

### 7.2 Quickstart

```bash
# 1. Clone repository
git clone https://github.com/wismannur/wismannur.pro.git
cd wismannur.pro

# 2. Install pinned dependencies
pnpm install

# 3. Configure local environment
cp .env.example .env.local

# 4. Apply schema migrations
pnpm db:migrate

# 5. Launch development server (default port: 7000)
pnpm dev
```

---

### 7.3 Dual-Environment Neon Database Orchestration

The project includes an intelligent development orchestrator in `scripts/dev.mjs` that isolates development schema experiments from production data:

```bash
# Connects to Neon DEVELOPMENT branch
pnpm dev

# Connects to Neon PRODUCTION branch (with interactive confirmation banner)
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

### 7.4 Environment Variables Specification

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
# 4. GOOGLE GEMINI / VERTEX AI (24/7 AI Assistant & Staff Copilot)
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

## 8. CLI Commands & Tooling

| Command | Execution | Technical Description |
| :--- | :--- | :--- |
| `pnpm dev` | `node scripts/dev.mjs` | Spawns Next dev server targeting `DATABASE_URL_DEV` on port **7000** |
| `pnpm dev:prod` | `node scripts/dev.mjs --prod` | Spawns Next dev server targeting `DATABASE_URL_PROD` with safety guards |
| `pnpm build` | `drizzle-kit migrate && next build` | Applies pending migrations in order, then executes Next.js production build |
| `pnpm start` | `next start` | Runs the compiled production server |
| `pnpm lint` | `eslint` | Executes ESLint checks across TypeScript and React files |
| `pnpm typecheck` | `tsc --noEmit` | Strict zero-emission TypeScript compiler type verification |
| `pnpm db:generate` | `drizzle-kit generate` | Generates a new migration SQL file from `src/db/schema.ts` |
| `pnpm db:migrate` | `drizzle-kit migrate` | Executes unapplied SQL migrations against the active database |
| `pnpm db:push` | `drizzle-kit push` | Synchronizes schema definitions directly with the target database (dev only) |
| `pnpm db:studio` | `drizzle-kit studio` | Starts Drizzle Studio web GUI for direct visual database inspection |
| `pnpm copilot:inspect` | `node scripts/inspect-copilot-session.mjs` | Inspects recent Staff Copilot sessions and conversation turns |
| `pnpm copilot:list` | `node scripts/inspect-copilot-session.mjs --list` | Lists all Staff Copilot sessions with message counts and timestamps |

---

## 9. Repository Directory Structure

```
.
├── scripts/
│   ├── dev.mjs                       # Multi-environment CLI database orchestrator
│   └── inspect-copilot-session.mjs   # Staff Copilot session & message inspector CLI
├── src/
│   ├── app/
│   │   ├── (public)/                 # Public SSR/ISR routes (home, about, blog, projects, etc.)
│   │   │   └── showcase/[slug]/      # Client Storefront Modernization Concept Showcase
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # Auth.js route handlers
│   │   │   ├── chat/                 # 24/7 Visitor AI SSE streaming endpoint with lead tools
│   │   │   ├── cms/copilot/chat/     # AI CMS Staff Copilot endpoint (110+ tools)
│   │   │   └── webhooks/resend-inbound/ # Svix-verified email webhook receiver
│   │   ├── attachments/[...path]/    # Secure Vercel Blob proxy streaming route
│   │   ├── cms/                      # CMS Admin cockpit (8 module groups + form editors)
│   │   ├── cv/                       # Printable CV preview and download engine
│   │   ├── login/                    # Secure admin credentials login view
│   │   ├── layout.tsx                # Root layout with providers & floating AI widget
│   │   ├── opengraph-image.tsx       # Dynamic edge Open Graph image generator
│   │   ├── robots.ts                 # Dynamic robots.txt generator
│   │   └── sitemap.ts                # Dynamic sitemap.xml generator
│   ├── auth.ts                       # Server-only Auth.js credentials configuration
│   ├── proxy.ts                      # Edge middleware proxy (JWT session validation)
│   ├── db/
│   │   ├── schema.ts                 # Drizzle PostgreSQL schema (33 tables)
│   │   ├── index.ts                  # Lazy server-only Neon database connection singleton
│   │   └── migrations/               # Version-controlled SQL migration journal
│   ├── services/                     # 27 Domain-driven RPC services & actions
│   │   ├── ai-chat/                  # Visitor AI Gemini client, tools & RAG context builder
│   │   ├── ai-english-fluency/       # English fluency curriculum, TTS & assessment actions
│   │   ├── ai-knowledge/             # Knowledge base item CRUD & indexing
│   │   ├── availability/             # Monthly consultation booking slots
│   │   ├── blog/                     # MDX blog actions, mutations & path revalidation
│   │   ├── cms-copilot/              # Staff Copilot aggregator & 8 domain tool implementations
│   │   │   └── domains/              # dashboard, career, project, ai, inbox, site, content, account
│   │   ├── contacts/                 # Inbound contact inquiries & threaded replies
│   │   ├── core/                     # Base service, auth guards & shared email dispatchers
│   │   ├── dashboard/                # Aggregated system metrics and health overview
│   │   ├── faqs/                     # Categorized FAQ entries
│   │   ├── hire-requests/            # Recruitment pipeline & direct hire leads
│   │   ├── inquiry-messages/         # Two-way threaded message history
│   │   ├── job-discovery/            # Direct ATS integrations (Ashby, Greenhouse, Lever, etc.)
│   │   ├── job-outreaches/           # Cold recruitment outreach campaigns & threading
│   │   ├── job-tracker/              # Career Hub: ATS pipeline, interview stages & .ics sync
│   │   ├── page-copy/                # Per-page hero copy & CTA content
│   │   ├── process-steps/            # How-it-works roadmap steps
│   │   ├── project/                  # Featured portfolio case studies
│   │   ├── project-finder/           # Finder Project Hub: Audits, tech stack scoring & proposals
│   │   ├── resume/                   # Career history & education timeline entries
│   │   ├── service-catalog/          # Commercial services catalog & pricing labels
│   │   ├── service-requests/         # Commercial client project briefs
│   │   ├── site-pages/               # Legal MDX documents (Privacy, Terms)
│   │   ├── site-settings/            # Global metadata, SEO tags, footer bio
│   │   ├── skills/                   # Skills matrix & categories
│   │   ├── testimonials/             # Verified client recommendations
│   │   └── user/                     # Admin profile and system appearance settings
│   ├── features/                     # Domain-specific UI features (blog filters, project grid)
│   ├── components/
│   │   ├── chat/                     # 24/7 floating visitor AI conversational widget
│   │   ├── cms/copilot/              # AI Staff Copilot UI panel & live page context integration
│   │   ├── emails/                   # 10 React Email templates for inquiries & alerts
│   │   ├── mdx/                      # MDX rendering components (code blocks, callouts)
│   │   ├── ui/                       # shadcn/ui design primitives (Radix UI)
│   │   └── ...                       # Layouts, navigation, cards, footer
│   ├── hooks/                        # Custom React hooks (reading-progress, theme, mobile)
│   └── lib/                          # Utility modules (gemini, mdx, resend, cms-page-context)
└── drizzle.config.ts                 # Drizzle Kit CLI configuration
```

---

## 10. Production Deployment Pipeline

The application is engineered for continuous deployment on **[Vercel](https://vercel.com)**:

1. **Continuous Deployment**: Every push to `main` triggers an automated deployment pipeline.
2. **Automated Zero-Downtime Migrations**: The build command (`pnpm build`) runs `drizzle-kit migrate` prior to `next build`. Schema migrations are transactionally applied before incoming traffic hits new application bundles.
3. **Environment Isolation**: Set production environment variables (`DATABASE_URL_PROD`, `AUTH_SECRET`, `RESEND_API_KEY`, etc.) inside the Vercel Project Dashboard.

---

## 11. Data Governance & Privacy

- **Open-Source Integrity**: This is an open-source codebase. Seed data in `src/db/migrations/` contains **strictly synthetic placeholder data** ("John Doe").
- **Zero Production Data Leakage**: Real personal identities, corporate outreach logs, candidate resumes, client service requests, and communication transcripts reside strictly within the private production PostgreSQL instance.
- **Client Pitch Confidentiality**: Storefront modernization showcases (`/showcase/[slug]`) are unlisted and protected from search engine indexing via explicit `robots: { index: false, follow: false }` metadata.

---

## 12. License

Personal project and proprietary digital platform — feel free to explore the source code for architectural reference and inspiration. Design system, technical publications, and branding are © [Wisman Nur](https://wismannur.pro). All rights reserved.
