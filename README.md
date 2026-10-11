# DynamicQR — Standalone AI-Powered Micro-SaaS

> Production-grade Dynamic QR Code Generator, Smart Conditional Redirect Engine, and Multi-Model AI Layer built on Next.js 14, Prisma, and Neon PostgreSQL.

---

## 🏛️ System Architecture

```text
                                  ┌───────────────────────────┐
                                  │   Physical Flyer / QR     │
                                  └─────────────┬─────────────┘
                                                │ (Camera Scan)
                                                ▼
                                  ┌───────────────────────────┐
                                  │  GET /id/[shortCode]      │
                                  │  - Prefetch-Shield Guard  │
                                  │  - Device/Geo/Time Parser │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
                 ▼                                                             ▼
     [type == 'landing-page']                                       [type == 'redirect']
                 │                                                             │
                 ▼                                                             ▼
  ┌─────────────────────────────┐                               ┌─────────────────────────────┐
  │  Render React Landing Page  │                               │  Evaluate RoutingRule[]     │
  │  (Prompt-to-Page Blocks)    │                               │  (Priority Order Evaluation)│
  └─────────────────────────────┘                               └──────────────┬──────────────┘
                                                                               │
                                                                               ▼
                                                                ┌─────────────────────────────┐
                                                                │  HTTP 307 Redirect + Logs   │
                                                                │  - Increment scan count     │
                                                                │  - Insert detailed Scan row │
                                                                └─────────────────────────────┘

================================ AI ARCHITECTURAL LAYER ================================

   Feature Requests (Enricher, Analyst, Smart Router, QR Art, Landing Pages, Bulk Wizard)
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │      lib/ai/run.ts        │
                                  │  (The Sacred Wrapper)     │
                                  ├───────────────────────────┤
                                  │ 1. assertFeatureAccess    │
                                  │ 2. Sliding Rate Limiter   │
                                  │ 3. AiCache lookup         │
                                  │ 4. AiCredit budget check  │
                                  │ 5. Provider dispatch      │
                                  │ 6. Zod schema validation  │
                                  │ 7. Telemetry & Cost log   │
                                  └─────────────┬─────────────┘
                                                │
                         ┌──────────────────────┴──────────────────────┐
                         ▼                                             ▼
            ┌───────────────────────────┐                 ┌───────────────────────────┐
            │   Neon AI Gateway (Live)  │                 │    Graceful Fallback      │
            │   (Databricks Multi-Model)│                 │   (100% Offline Uptime)   │
            └───────────────────────────┘                 └───────────────────────────┘
```

---

## 🚀 The 6 Production AI Features

| # | Feature | Tier | Description |
|---|---|---|---|
| **1** | 🪄 **One-Click URL Auto-Enricher** | Free | Scrapes meta tags, title, favicon, runs a pre-print health check, and generates semantic shortcodes. |
| **2** | 🧠 **AI Smart Destination Router** | Pro | Compiles plain English (*"Send iPhones to App Store, Android to Google Play"*) into structured conditional rules. |
| **3** | 📊 **AI Campaign Analyst** | Pro | Pre-aggregates scan distributions and generates executive briefs with actionable decisions. |
| **4** | 🎨 **AI Artistic QR Studio** | Premium | Generates custom branded visual palettes with WCAG contrast verification and Error Correction Level H. |
| **5** | 📱 **Prompt-to-Page Mobile Builder** | Pro | Eliminates Linktree by turning business prompts into full mobile landing pages directly linked to the QR. |
| **6** | 🔗 **AI Bulk Campaign Orchestrator** | Pro | Paste batches of URLs or CSVs; AI clusters them into campaigns and scaffolds them into your workspace in one click. |

---

## 🖨️ Print-Ready High-Res Export (300 DPI)

Every downloaded QR code now exports as a **1080×1350px high-resolution print poster** containing:
1. **The Campaign Name / Label** prominently typeset at the top.
2. **High-Contrast QR Code** (720px) with 10% quiet zone and shadow card.
3. **The URL Short Link Pill** (`/id/shortCode`) for immediate physical legibility.
4. **"SCAN WITH CAMERA TO OPEN"** instructions.

---

## 🛠️ Quick Start (From Zero to Running in 5 Minutes)

### 1. Clone & Install
```bash
git clone https://github.com/Relayyl6/my-qr.git
cd my-qr
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your Neon database connection:
```bash
cp .env.example .env
```

### 3. Apply Database Migrations
```bash
npx prisma db push
```

### 4. Start Local Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`.

---

## 🔍 AI Observability & Telemetry

Visit `/admin/ai-usage` in your browser to inspect:
- Total AI invocations and real-time failure rates
- Exact USD cost per feature and user
- p95 and average model latency
- Raw token consumption breakdown

---

## 🗺️ Roadmap
- [ ] Stripe Customer Portal & Automated Tier Subscriptions
- [ ] Custom Domains (`qr.yourcompany.com`) with automated SSL
- [ ] Team Workspaces & Multi-Seat Collaboration
- [ ] White-Label Agency Branding
