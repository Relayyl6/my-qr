# Builder Recon Report (Phase 0)

## 1. File Inventory for the V2 Engine
- `lib/page/schema.ts`: Zod schema and TypeScript types for the flat `Page` document model (brand, cta, links, services, contact).
- `lib/page/config.ts`: Curated WCAG AA certified palettes (`ink`, `cream`, `sage`, `ocean`, `terracotta`, `slate`), template definitions, and word/element constraints.
- `lib/page/prompt.ts`: Strict system prompt for the AI copywriter preventing invented URLs, prices, or claims.
- `lib/page/generate-copy.ts`: AI copy generation service with heuristic fallback parsing when offline.
- `lib/page/assemble.ts`: Deterministic assembly pipeline combining user inputs and AI copy into a validated `Page`.
- `lib/page/render.tsx`: React component rendering the single-column responsive landing page.
- `lib/page/migrate.ts`: Backward-compatibility migrator translating legacy polymorphic block specs into the flat `Page` structure.
- `components/PageEditor.tsx`: Existing accordion-based editor with live phone preview and AI copywriter trigger.
- `components/LandingPageEditor.tsx`: Modal wrapper invoking `PageEditor` from the workspace link row.
- `app/page/[shortCode]/page.tsx`: Public Next.js server route rendering published micro-sites with OpenGraph metadata.
- `app/r/[pageId]/[linkIndex]/route.ts`: Click-tracking redirect route forwarding CTA and secondary link clicks.
- `lib/ai/features/landing-page-builder.ts`: Server actions for generating copy, saving, publishing, and reverting landing pages.
- `lib/auth.ts`: Authentication and session resolution via `getCurrentUser()`.
- `lib/media.ts`: Object storage and CDN URL resolution (`getOptimizedStorageUrl`).

## 2. Database Tables Involved & Storage
- `LandingPage` table in Prisma (`prisma/schema.prisma`):
  - `id`: CUID primary key.
  - `qrLinkId`: Unique foreign key to `QrLink` (cascade on delete).
  - `spec`: JSON column storing the document object (`Page`).
  - `published`: Boolean flag indicating if the page is live at `/page/[shortCode]`.
  - `updatedAt`: Timestamp.
- `QrLink` table:
  - Stores `destinationUrl` (strictly enforced destination), `shortCode`, scan telemetry, and ownership (`userId`).
- `AiInvocation` table:
  - Telemetry log tracking token usage, latency, model, and cost per copy/builder invocation.

## 3. UI, State & Styling Libraries in Use
- Styling: Tailwind CSS 3.4.x with `@tailwindcss/postcss` and CSS variables (`globals.css`).
- Icons: `lucide-react` (comprehensive icon set).
- Forms & Validation: `zod` for strict schema definitions.
- Components & State: Native React 18 hooks (`useState`, `useRef`, `useEffect`). No heavy runtime state library installed yet (Zustand & Immer can be added safely per Master Brief rules).
- Media: Cloudflare / Neon S3-compatible image upload.

## 4. What Can Be Reused vs. What Must Change
- **Reuse as-is**:
  - `QrLink` and `LandingPage` database tables (storing JSON document in `spec`).
  - Destination URL locking mechanism and `/r/[pageId]/[linkIndex]` click tracking.
  - Authentication, role gatekeeping, and media upload infrastructure.
  - Color palette tokens and WCAG contrast check foundations.
- **What must change**:
  - `tailwind.config.ts`: Must include `"./lib/**/*.{js,ts,jsx,tsx}"` in `content` so arbitrary Tailwind classes inside `lib/page/render.tsx` compile properly.
  - `PageEditor.tsx`: Accordion form stack is replaced by the Framer-style visual builder canvas (390px mobile, 820px tablet, 1280px desktop), auto-layout stacks, and inspector panels.
  - `RenderPage`: Enhanced to support exact responsive multi-column layouts across breakpoints while preserving exact 390px mobile rendering.
- **What stays behind a flag**:
  - The V2 flat renderer remains accessible for existing pages and fallback migration until parity tests pass.

## 5. Every Place That Reads the V2 Page Shape
- `app/page/[shortCode]/page.tsx` (public site view)
- `app/r/[pageId]/[linkIndex]/route.ts` (click redirect tracker)
- `components/PageEditor.tsx` (editor form and phone preview)
- `components/LandingPageEditor.tsx` (workspace editor modal)
- `lib/ai/features/landing-page-builder.ts` (server actions for saving and copy generation)
- `scripts/verify-ai-suite.ts` (test suite assertions 21, 22, 23, 31)
- `eval/run.ts` (copy evaluation runner)

## 6. Risks & Conflicts with the Repo
- **Tailwind purge gap**: `tailwind.config.ts` currently omits `./lib/**`, which caused the public page to lose `max-w-[480px]` in production and stretch edge-to-edge. Must be fixed immediately in Phase 0.5.
- **Existing AI Test Suite**: `scripts/verify-ai-suite.ts` runs automated assertions on `PageSchema` and `PALETTES`. New builder schema (Phase 1) must be additive or versioned (`schemaVersion: 2`) so existing tests continue to pass 100%.
- **Single destination URL non-negotiable**: The destination URL must never be editable by the AI or placed on arbitrary elements.

## 7. Proposed Answers to Open Decisions (Spec Section 14)
1. **Breakpoints**: 390px (mobile), 820px (tablet), 1280px (desktop).
2. **Free positioning in v1**: Allowed only inside explicit "free frame" containers; default is flex/auto-layout stacks.
3. **Fonts**: System sans (`Inter`), Playfair serif, and monospace fonts already loaded in layout.
4. **Image processing**: Client-side WebP compression + storage CDN URL.
5. **Existing page migration**: Mobile remains 100% identical; tablet/desktop gracefully adapt to responsive grid.
6. **AI Availability**: Free tier gets copy assist; layout modes unlocked for Pro/Plus/Ultra.
7. **Powered by**: Visible by default; white-label removable for Plus/Ultra.
8. **Domain**: Lives at existing `/page/[shortCode]` and custom branded domains.
9. **Analytics**: Retain existing `/r/` node redirect click tracking.
10. **AI Model**: Uses existing Neon / Gemini AI Gateway provider.
