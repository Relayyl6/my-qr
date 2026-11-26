# Mini Site Builder: Agent Build Spec

**What this is:** the full brief for turning the V2 "Micro-Landing Page Engine" into a visual builder (a Framer-lite for one-page micro sites) with drag-and-drop, resizing, exact mobile / tablet / desktop windows, and built-in AI prompting.

**How to use it:**
1. Save this file in your repo as `docs/BUILDER_SPEC.md`.
2. Paste the **Master Brief** (section 4) into your agent once, at the start of the session.
3. Then paste the **Phase prompts** (section 12) one at a time. Do not move to the next phase until the acceptance criteria of the current one pass.

The agent cannot hold a project this size in one prompt, so the spec lives in the repo and the prompts point at it.

> I have only seen the code you pasted earlier and your two screenshots, not the whole repo. Phase 0 makes the agent read the repo and report before it changes anything. Where this spec names a file or library, the agent should check it against what actually exists.

---

## 1. What the two screenshots show

These are the problems visible right now. Phase 0.5 fixes them first, before any new building.

| # | Observation | Where | Fix |
|---|---|---|---|
| 1 | The public page stretches edge to edge on a wide screen. The CTA is one giant bar the width of the browser, so the 480px constraint is not applied outside the editor preview | Screenshot 1 | Public route must wrap content in the same container the editor uses |
| 2 | The page published generic fallback copy: "Welcome to our space", "Core Offering", "Direct service tailored for you", "MY BUSINESS" | Both | Fallback copy must be marked as placeholder, shown with a visible badge in the editor, and publishing must warn while placeholders remain |
| 3 | The small "MY BUSINESS" eyebrow is a dim blue on navy and looks low contrast | Both | Contrast check on every text/background pair, not just the main palette pair |
| 4 | The headline shows colour fringing and very tight letter spacing | Both | Remove negative letter-spacing and any text-shadow on headings |
| 5 | The phone preview has a white strip across the top, above the dark page | Screenshot 2 | The page background must fill the whole device screen, including the safe-area region |
| 6 | The preview label is cut off ("480px Cente") and the header's right edge is clipped | Screenshot 2 | The editor layout overflows horizontally. Fix the shell so nothing is clipped at common laptop widths |
| 7 | The form is a stack of accordions with one email-sized set of fields. There is no way to change layout, only text | Screenshot 2 | This is the main thing the builder replaces |

**A note on my earlier advice.** I recommended one fixed single-column layout, and you built it. This brief replaces that decision: the 480px column becomes the **mobile frame**, and tablet and desktop get their own layouts. What stays from that advice is the guardrails: the locked destination URL, schema validation, contrast checks, the AI never choosing URLs, click tracking, and versioned publishing.

---

## 2. Product definition

**One sentence:** a visual editor where a non-designer builds a one-page micro site, sees it in an exact mobile, tablet, or desktop window, drags and resizes elements, and uses AI to generate or adjust any part of it.

**Positioning against the tools you named:**
- **Framer** is the closest model: a canvas, breakpoints, auto-layout stacks, and an inspector. Copy its structure.
- **Figma** contributes interaction feel only: selection, handles, layers, snapping, shortcuts. There is no vector drawing.
- **WordPress** contributes nothing structurally. It is a multi-page CMS with plugins, which is out of scope.

### In scope for v1
- One page per site, built from a tree of elements
- Three breakpoints, each previewed in an exact-width window
- Drag from a palette, reorder on canvas and in layers, resize with handles, spacing handles
- Auto-layout (stack and grid) as the default, with optional free positioning inside a "free frame"
- Design tokens (colours, fonts, radius, spacing), with six palette presets
- Section library and six starter templates
- Media library with image upload
- A deterministic linter (contrast, tap targets, overflow, placeholder text)
- AI command bar that edits the document through validated operations
- Draft, publish, versions, rollback
- Locked destination URL, `/r/` click tracking, QR download

### Out of scope for v1 (say no to these)
Multi-page sites, a CMS or blog, vector drawing, plugins, custom code or embeds, e-commerce or payments, forms that need a backend, custom domains, real-time collaboration, and animation beyond simple presets. Phase 9 lists them as later work.

### Honest scope warning
This is a large product. The hard part is the editor canvas (iframe, overlays, drag and drop, resize), not the AI. Phases 2 and 3 will take the most time. Do not skip the parity tests in section 13, because a builder whose preview differs from the published page loses trust quickly.

---

## 3. Non-negotiables

1. **Mobile view is kept and is the base.** The mobile frame is 390px wide, and its design is what exists today, migrated without visual change.
2. **Exact windows.** Switching to tablet or desktop renders the page in an element exactly that wide, so CSS media queries fire for real. It is not a scaled-down approximation.
3. **One renderer.** The editor canvas and the published page use the same render code. There is no separate "preview renderer".
4. **The destination URL stays locked by code.** It is stored once on the document, and CTA elements bind to it. No element, and no AI operation, can set it.
5. **The AI never writes HTML, CSS, or JavaScript.** It returns typed operations that are validated and applied through the same command system as user edits.
6. **No raw CSS or HTML is ever stored or rendered.** Styles are an allowlisted object, text is plain, and URLs are scheme-checked.
7. **Every edit is undoable.** A drag is one undo step, and an AI action is one undo step.
8. **Published pages are static HTML and CSS** with no framework JavaScript.
9. **Keep what works.** The V2 renderer stays behind a flag until the migrated pages pass the parity tests. Existing published pages must not change appearance on mobile.

---

## 4. MASTER BRIEF (paste this into the agent first)

```text
You are a senior full-stack engineer extending an existing Next.js (App Router) + TypeScript
project: a QR-code micro-landing-page product. The current V2 engine renders a single-column page
from a flat "Page" object (brand, cta, links, services, contact) with an AI copy assist.

GOAL
Turn it into a visual one-page site builder in the style of Framer: canvas, layers, inspector,
drag and drop, resize handles, three breakpoints (mobile, tablet, desktop) each shown in an
exact-width window, design tokens, section library, and a built-in AI command bar.

SOURCE OF TRUTH
Read docs/BUILDER_SPEC.md completely before doing anything. It defines scope, architecture,
schemas, UX, AI behaviour, security rules, phases, and acceptance criteria. If this message and
the spec disagree, the spec wins. If the spec and the repo disagree about a file name or library,
trust the repo and note the difference in your report.

NON-NEGOTIABLES (from spec section 3)
- Mobile (390px) view is the base and must be preserved exactly for existing pages.
- Tablet and desktop render in iframes of exact pixel width so real media queries apply.
- One renderer shared by the editor canvas and the public page.
- The destination URL lives on the document and is locked by code. Nothing else can set it.
- The AI returns typed operations only. Never HTML, CSS, or JS.
- No raw CSS or HTML in stored data. Allowlisted style properties only. https/tel/mailto/wa.me
  URL schemes only.
- Every user gesture and every AI action is exactly one undo step.
- Public pages are static HTML+CSS with no framework JS.
- Do not delete the V2 renderer, schema, or editor until the parity tests in the spec pass.

HOW TO WORK
1. Work in phases. I will give you one phase at a time. Do only that phase.
2. Before coding each phase, state your plan in at most 15 lines: files to add, files to change,
   risks. Then proceed without waiting unless a decision in spec section 14 blocks you.
3. Make small commits with clear messages. One concern per commit.
4. Write tests alongside each module. Run typecheck, lint, and tests before reporting.
5. At the end of each phase, report: what was built, what was tested and how, anything you
   deviated from, and anything you are unsure about. Do not claim something works unless you
   ran it.
6. Do not add dependencies without a one-line justification. Prefer what the repo already uses.
   Allowed without asking: zod, zustand, immer, playwright (dev), vitest or the repo's test
   runner, lucide-react.
7. Keep files under about 300 lines. Split by responsibility.
8. Never use dangerouslySetInnerHTML for user content. Never eval. Never interpolate user strings
   into CSS or HTML.
9. If a requirement is ambiguous, choose the safest default in spec section 14, note it in your
   report, and continue.
10. Do not refactor unrelated code.
```

---

## 5. Architecture

### 5.1 The document model

Replace the flat `Page` with a **normalised tree**. Nodes live in a flat map, which makes updates, undo, and AI operations cheap and safe.

```ts
// lib/builder/schema.ts
import { z } from "zod";

export const BP = ["mobile", "tablet", "desktop"] as const;
export type Bp = (typeof BP)[number];

export const BREAKPOINTS = {
  mobile:  { minWidth: 0,    frameWidth: 390,  frameHeight: 844 },
  tablet:  { minWidth: 768,  frameWidth: 820,  frameHeight: 1180 },
  desktop: { minWidth: 1024, frameWidth: 1280, frameHeight: 800 },
} as const;

export const NODE_TYPES = [
  "section", "stack", "grid", "free",
  "heading", "text", "button", "linkRow", "image", "gallery",
  "card", "priceItem", "badge", "divider", "spacer", "icon",
  "social", "contact", "accordion", "testimonial", "video", "map", "qr", "footer",
] as const;
export type NodeType = (typeof NODE_TYPES)[number];

// Allowlisted style vocabulary. Anything not listed here cannot be stored.
const Px = z.number().min(0).max(4000);
const Size = z.union([
  z.object({ u: z.literal("px"), v: Px }),
  z.object({ u: z.literal("%"),  v: z.number().min(0).max(100) }),
  z.literal("fill"),   // flex: 1 / 100%
  z.literal("hug"),    // fit-content
  z.literal("auto"),
]);
const Space = z.number().min(0).max(400);
const ColorToken = z.string().regex(/^(bg|fg|accent|muted|surface|border|onAccent|#[0-9a-fA-F]{6})$/);

export const StyleSchema = z.object({
  // layout
  display: z.enum(["flex", "grid", "block", "none"]),
  direction: z.enum(["row", "column"]),
  wrap: z.boolean(),
  align: z.enum(["start", "center", "end", "stretch"]),
  justify: z.enum(["start", "center", "end", "between"]),
  gap: Space,
  columns: z.number().int().min(1).max(6),            // grid
  // box
  width: Size, height: Size,
  minWidth: Size, maxWidth: Size, minHeight: Size,
  padding: z.tuple([Space, Space, Space, Space]),     // top right bottom left
  margin:  z.tuple([Space, Space, Space, Space]),
  aspectRatio: z.enum(["auto", "1/1", "4/3", "3/2", "16/9", "3/4", "2/3"]),
  overflow: z.enum(["visible", "hidden"]),
  // free-position children only
  position: z.enum(["static", "absolute"]),
  x: z.number().min(-2000).max(4000), y: z.number().min(-2000).max(4000),
  zIndex: z.number().int().min(0).max(100),
  rotate: z.number().min(-180).max(180),
  // look
  bg: ColorToken, bgImage: z.string().uuid(),         // media id, never a URL
  bgOverlay: z.number().min(0).max(0.9),
  radius: z.number().min(0).max(999),
  border: z.object({ w: z.number().min(0).max(8), color: ColorToken }),
  shadow: z.enum(["none", "sm", "md", "lg"]),
  opacity: z.number().min(0).max(1),
  // type
  fontFamily: z.enum(["body", "display", "mono"]),
  fontSize: z.number().min(10).max(120),
  fontWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700), z.literal(800)]),
  lineHeight: z.number().min(0.9).max(2.2),
  letterSpacing: z.number().min(-0.02).max(0.2),      // em. Negative floor is deliberately tiny
  textAlign: z.enum(["left", "center", "right"]),
  color: ColorToken,
  textTransform: z.enum(["none", "uppercase"]),
  objectFit: z.enum(["cover", "contain"]),
}).partial().strict();
export type Style = z.infer<typeof StyleSchema>;

export const NodeSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{6,12}$/),
  type: z.enum(NODE_TYPES),
  name: z.string().max(60).optional(),               // layer name
  parent: z.string().nullable(),
  children: z.array(z.string()),
  locked: z.boolean().optional(),                    // cannot be moved or deleted by user or AI
  placeholder: z.boolean().optional(),               // copy not yet written by a human or AI
  hidden: z.object({ mobile: z.boolean(), tablet: z.boolean(), desktop: z.boolean() }).partial().optional(),
  style: z.object({
    mobile: StyleSchema,                             // base, always present
    tablet: StyleSchema.optional(),                  // overrides at >= 768px
    desktop: StyleSchema.optional(),                 // overrides at >= 1024px
  }),
  props: z.record(z.unknown()),                      // validated per type, see PROP_SCHEMAS
});
export type Node = z.infer<typeof NodeSchema>;

export const DocSchema = z.object({
  schemaVersion: z.literal(3),
  root: z.string(),
  nodes: z.record(NodeSchema),
  destination: z.object({ url: z.string().url().startsWith("https://") }), // THE locked URL
  tokens: z.object({
    palette: z.enum(["ink", "sand", "forest", "clay", "sky", "mono", "custom"]),
    colors: z.object({ bg: z.string(), fg: z.string(), accent: z.string(), muted: z.string(),
                       surface: z.string(), border: z.string(), onAccent: z.string() }),
    fonts: z.object({ body: z.string(), display: z.string(), mono: z.string() }), // from curated list
    radius: z.number(), spacingUnit: z.number(),
  }),
  meta: z.object({ title: z.string().max(70), description: z.string().max(160), ogMediaId: z.string().uuid().optional() }),
});
export type Doc = z.infer<typeof DocSchema>;
```

**Key design decisions in that schema**
- **The destination URL is on `doc.destination`.** A `button` node with `props.bind = "destination"` reads it at render time. There is no URL field on that node to edit, so the guarantee does not depend on prompts or UI.
- **Images are referenced by media ID**, never by URL. This blocks hotlinked or AI-invented image links.
- **`StyleSchema` is `.strict()`.** An unknown key is rejected, so neither the AI nor a bad paste can introduce arbitrary CSS.
- **`letterSpacing` has a tiny negative floor.** That prevents the squashed headline in your screenshot.
- **Colours are tokens or six-digit hex.** Tokens let a palette change recolour the whole page.

### 5.2 Breakpoints and style resolution (mobile-first)

Mobile styles are the base. Tablet overrides apply at 768px and up. Desktop overrides apply at 1024px and up. A property set only on mobile is inherited by tablet and desktop.

```ts
// lib/builder/resolve.ts
const ORDER: Bp[] = ["mobile", "tablet", "desktop"];

export function resolveStyle(node: Node, bp: Bp): Style {
  const out: Style = {};
  for (const b of ORDER) {
    Object.assign(out, node.style[b] ?? {});
    if (b === bp) break;
  }
  return out;
}

// Editing rule: a change made while viewing breakpoint X writes ONLY to node.style[X].
// Editing at mobile changes the base, which flows up. Editing at tablet creates a tablet override.
export function isOverridden(node: Node, bp: Bp, key: keyof Style) {
  return bp !== "mobile" && node.style[bp]?.[key] !== undefined;
}
export function resetOverride(node: Node, bp: Bp, key: keyof Style) { /* delete node.style[bp][key] */ }
```

The inspector shows a small dot next to any property overridden at the current breakpoint, with a "reset to inherited" action.

### 5.3 The CSS compiler (no Tailwind on published pages)

Published pages compile the document to a small stylesheet, one class per node, with `min-width` media queries. This keeps the page static and tiny.

```ts
// lib/builder/compile-css.ts  (shape, not complete)
// For each node and each breakpoint: compute the resolved style, then emit only the DIFF versus
// the previous breakpoint. Hidden-per-breakpoint becomes display:none in that breakpoint's block,
// and the correct display value is restored in the next breakpoint where it is visible.
//
// .n_ab12cd{display:flex;flex-direction:column;gap:16px}
// @media (min-width:768px){.n_ab12cd{flex-direction:row}}
// @media (min-width:1024px){.n_ab12cd{gap:32px}}
//
// Rules:
// - Every value passes through a serializer per property. No string from the document is ever
//   concatenated into CSS directly.
// - Colour tokens become CSS variables (--c-bg, --c-fg...). Hex values are re-validated.
// - "fill" and "hug" map to flex:1 / 100% and fit-content. They are not stored as CSS.
// - Absolute positioning only applies to children of a "free" node.
```

### 5.4 One renderer, shared by editor and public page

```ts
// lib/builder/render.tsx
export function RenderDoc({ doc, mode }: { doc: Doc; mode: "published" | "editor" }) {
  // Pure function of the document. Adds data-node-id attributes in "editor" mode only.
  // No browser APIs, so it can render on the server for the public route.
}
```

- The public route calls `RenderDoc` on the server and outputs static HTML plus the compiled CSS.
- The editor canvas calls the same component inside an iframe (5.5).
- Interactive elements use native HTML only: `<details>` for accordions, plain anchors for links. No client JavaScript is needed.

### 5.5 The editor canvas: exact-width windows

This is the part most likely to go wrong, so the approach is fixed here.

- Render the page inside an **`<iframe>` of the exact breakpoint width** (390, 820, or 1280 by default). Media queries inside an iframe respond to the iframe's own width, so tablet and desktop styles fire exactly as they will on a real device.
- Render React into the iframe with a portal (`createPortal` into `iframe.contentDocument.body`) so the editor shares state with the canvas. Inject the compiled CSS into the iframe `<head>`, and recompile on every document change.
- Zoom is a CSS `transform: scale(z)` on the iframe wrapper. The iframe itself stays at its true pixel width.
- **Selection boxes, resize handles, spacing handles, snap guides, and drop indicators are drawn in a separate overlay layer in the parent window**, positioned from `getBoundingClientRect()` of elements inside the iframe, multiplied by the zoom. They never touch the page's DOM, so they cannot change layout or leak into the published output.
- **Hit-testing:** the overlay captures pointer events. On `pointermove` or `pointerdown`, use `iframe.contentDocument.elementsFromPoint(x / z, y / z)` and walk up to the nearest `[data-node-id]`.
- **Device frames:** mobile gets a phone bezel with a notch and safe areas. Tablet gets a thin rounded frame. Desktop gets a simple browser top bar. The frame is decoration around the iframe. It never reduces the iframe's width.
- **Rotating the tablet** to landscape gives a 1180px window, which crosses the 1024px threshold, so desktop styles apply. This is correct. Show a small label: "1180px: desktop styles apply".
- **Custom width handle:** a drag handle on the frame's right edge lets the user resize the iframe between 320px and 1920px to test in-between widths. A badge shows the width and which breakpoint is active. Edits made at a custom width write to whichever breakpoint is active at that width.
- **Preview mode:** a toggle that hides all overlays so hover and accordions can be tried. A second button, "Open on my phone", opens a signed, `noindex` draft URL in a new tab.

### 5.6 State, commands, undo, autosave

```ts
// lib/builder/store.ts  (zustand + immer)
type State = {
  doc: Doc;                       // the document. Only commands change it
  ui: { bp: Bp; zoom: number; selection: string[]; hoverId?: string; mode: "edit" | "preview";
        frameWidth: number; panels: { left: "layers" | "add" | "assets"; right: "inspector" | "ai" } };
  history: { past: Patch[][]; future: Patch[][] };
};

interface Command { label: string; run(doc: Draft<Doc>): void }
// store.exec(cmd) -> produceWithPatches -> push inverse patches -> validate with DocSchema -> set
```

- **Selection and UI state are separate from the document**, and are never saved or undone.
- **Gesture coalescing:** a drag, resize, or slider scrub sends many updates and produces **one** history entry, committed on pointer-up.
- **AI batches** apply as one history entry.
- **Validation:** every command result is checked with `DocSchema.safeParse` in development, and the key invariants (parent/child consistency, `destination` untouched, node count limit) in production.
- **Autosave:** debounced draft save, sending `baseVersion`. If the server returns a conflict, show a banner and offer to reload. Do not silently overwrite.

### 5.7 Layout model: stacks first, free positioning second

Pure absolute positioning (Figma style) breaks on other screen sizes. Framer avoids that by defaulting to auto-layout. Do the same.

- **`stack` and `grid` are the default containers.** Children flow. Resizing a child changes its `width` and `height` mode: **fill**, **hug**, or **fixed**.
- **`free` is an opt-in container** ("free frame") with a fixed height per breakpoint. Children inside it use absolute `x`, `y`, `width`, `height`, `rotate`, and `zIndex`, with snapping and smart guides. Use it for overlays, badges on images, and decorative layering. Warn in the inspector that free frames do not reflow.
- **Resize handle behaviour:** dragging a handle sets that dimension to `fixed` in px. Double-clicking a handle returns it to `hug`. A "Fill" toggle sets `fill`. Holding Shift on an image locks the aspect ratio.
- **Spacing handles:** padding and gap are adjusted by dragging the shaded zones that appear on hover and selection, shown in px as you drag.

---

## 6. Editor UX specification

### 6.1 Layout of the editor

```
+-----------------------------------------------------------------------------------+
| Logo  Page title        [Mobile] [Tablet] [Desktop]  390px  100%   Undo Redo  Preview  Save & Publish |
+-----------+-----------------------------------------------------+----------------+
| LEFT      |  CANVAS (grey workspace)                            | RIGHT          |
| Layers    |       +-----------------------+                     | Inspector      |
| Add       |       |   exact-width iframe  |                     |  Content       |
| Assets    |       |   in device frame     |                     |  Layout        |
|           |       +-----------------------+                     |  Style         |
|           |                                                     |  Responsive    |
|           |   [ Ask AI to change this...                 ]      | AI (tab)       |
+-----------+-----------------------------------------------------+----------------+
```

- The editor shell must not overflow horizontally at 1280px wide or wider. At narrower widths, collapse the left panel first, then the right.
- The **AI command bar** floats at the bottom of the canvas, always visible, and opens the AI tab for results.
- The top bar's breakpoint switcher shows the active breakpoint's name, width, and zoom. Zoom has a "Fit" option and 50, 75, 100, and 150 percent.

### 6.2 Left panel

**Layers:** a tree of the document. Rename on double-click, drag to reorder or reparent, eye icon to hide at the current breakpoint, lock icon, and a search box. Selecting a layer selects it on canvas, and the reverse.

**Add:** a grid of elements and a list of sections (section 7 and 8). Click inserts after the selection. Drag places exactly where dropped.

**Assets:** the media library. Upload by drag or click, list with thumbnails, delete if unused. Uploads are checked for type and size (spec section 10).

### 6.3 Canvas interactions

| Interaction | Behaviour |
|---|---|
| Click | Select the deepest element under the pointer. Click again on the same spot to select the parent. Double-click a container to select its first child |
| Shift-click | Add to or remove from the selection |
| Drag on empty canvas | Marquee select |
| Drag a selected element | Move it. In stacks and grids, show a blue insertion line and highlight the target container. In free frames, move freely with snapping |
| Drag from the Add panel | Same as moving, with a ghost of the element |
| Drag a handle | Resize (section 5.7) |
| Drag a spacing zone | Change padding or gap |
| Double-click text | Edit inline. Plain text only: pasted formatting is stripped and Enter inserts a line break |
| Space + drag, or middle mouse | Pan the workspace |
| Ctrl/Cmd + scroll | Zoom, centred on the pointer |
| Alt + drag | Duplicate while dragging |
| Right-click | Context menu: duplicate, delete, group into stack, ungroup, bring forward or back, copy styles, paste styles, hide at this breakpoint, copy to other breakpoints |

**Drop-target logic for stacks and grids:** on `pointermove`, hit-test the point, find the nearest valid container (one that accepts that child type), then compare the pointer to each child's rect along the container's main axis to choose the insertion index. For grids, choose the nearest cell. Show a 2px accent line for the insertion point and a dashed outline on the target container. An invalid target shows a "not allowed" cursor and no indicator.

**Containment rules:** sections only go in the root. Headings, text, buttons, and images go in stacks, grids, free frames, or cards. A section inside a stack is rejected. Rules live in one table (`CAN_CONTAIN`) used by the editor and by AI validation.

**Snapping and guides (free frames):** snap to the frame's edges and centre, to sibling edges and centres, and to an 8px grid. Show pink guide lines and distance labels while dragging, like Figma. Hold Ctrl to disable snapping.

### 6.4 Keyboard shortcuts

| Keys | Action |
|---|---|
| V | Select tool |
| Ctrl/Cmd + Z, Shift + Z | Undo, redo |
| Ctrl/Cmd + D | Duplicate |
| Ctrl/Cmd + C, V | Copy, paste (works across breakpoints and keeps overrides) |
| Delete, Backspace | Delete selection (locked nodes refuse, with a message) |
| Arrow keys, Shift + arrows | Nudge 1px, 10px (free frames), or move up and down in stacks |
| Ctrl/Cmd + G, Shift + G | Group into stack, ungroup |
| [ and ] | Send backward, bring forward |
| 1, 2, 3 | Switch to mobile, tablet, desktop |
| Ctrl/Cmd + 0 | Fit to window |
| Ctrl/Cmd + K | AI command bar |
| Ctrl/Cmd + S | Save draft |
| Esc | Clear selection, or exit inline editing |
| ? | Show shortcut list |

### 6.5 Inspector tabs (right panel)

1. **Content:** the element's own props (text, label, image, alt text, items). A `button` bound to the destination shows a locked URL row with a lock icon, as it does now.
2. **Layout:** direction, wrap, align, justify, gap, columns (grid), width and height modes with px inputs, min and max width, padding and margin as four linked fields, and position (for free-frame children).
3. **Style:** background (token or colour, image from the media library, overlay), border, radius, shadow, opacity, and typography (font, size, weight, line height, letter spacing, align, colour, transform).
4. **Responsive:** a visibility toggle per breakpoint, a summary of what is overridden at tablet and desktop, "Reset this breakpoint to inherited", "Copy mobile styles to tablet", and "Copy to desktop".
5. **Advanced:** layer name, lock, anchor ID (for in-page links), and for sections, the content max-width token.

Every field that is overridden at the current breakpoint shows the override dot. The panel's header always shows which breakpoint is being edited, in the breakpoint's colour, so the user never edits the wrong one by accident.

---

## 7. Element library

| Type | Purpose | Key props | Default behaviour per breakpoint |
|---|---|---|---|
| `section` | Full-width band, root child only | anchorId | Padding 24 / 48 / 80. Inner content max-width 100% / 720 / 1120 |
| `stack` | Flex container | none | Column on mobile. Direction is editable per breakpoint |
| `grid` | Grid container | none | Columns 1 / 2 / 3. Gap 12 / 16 / 24 |
| `free` | Free-position frame | none | Fixed height per breakpoint. Warn about reflow |
| `heading` | Title | text, level 1 to 3 | Size scales 28 / 36 / 48 for level 1 |
| `text` | Paragraph | text (plain, line breaks only) | 16px minimum on mobile |
| `button` | Action | label, variant (primary, secondary, ghost), bind ("destination" or href), icon | Full width on mobile, hug on tablet and desktop |
| `linkRow` | Secondary link row | label, subtitle, href, icon | Full width |
| `image` | Image | mediaId, alt (required), fit | Fill width, aspect ratio editable |
| `gallery` | Image grid | mediaIds, no lightbox in v1 | Columns 2 / 3 / 4 |
| `card` | Pre-styled container | none (a stack with surface background, border, radius, padding) | Same as stack |
| `priceItem` | Menu or service line | name, price, desc | Full width |
| `badge` | Small label | text | Hug |
| `divider`, `spacer` | Separation | height for spacer | |
| `icon` | Icon | name from a curated lucide subset | |
| `social` | Social links | list of network and handle. The URL is generated by code | Row, wraps |
| `contact` | Contact block | phone, email, address, whatsapp. Links are generated by code (`tel:`, `mailto:`, `https://wa.me/`) | Stack |
| `accordion` | FAQ | items (question, answer). Uses `<details>`, no JS | Full width |
| `testimonial` | Quote | quote, name. User-supplied only | |
| `video` | Video | provider (youtube, vimeo), videoId. Loads a poster image first, iframe on click | 16/9 |
| `map` | Location | address text. Renders a link to Google Maps, no embed in v1 | |
| `qr` | QR for this page | none | Square, hug |
| `footer` | "Powered by" line | locked on the free plan | |

**Link handling:** every link element publishes as `/r/{pageId}/{nodeId}`, which logs the click and redirects. `button` bound to the destination also goes through `/r/`, so primary CTA clicks are counted.

**Placeholder flag:** when an element is created from a template or fallback with sample copy, set `placeholder: true`. The editor shows a small "Sample text" badge on it. It clears the first time the user or the AI edits the text. Publishing shows a warning listing any remaining placeholder elements.

---

## 8. Section library and starter templates

### Sections (hand-authored JSON, correct at all three breakpoints)

Hero centred, Hero split (image beside text on tablet and desktop), Links list, Features (3-up grid), Menu or price list, Gallery, Testimonials, FAQ, CTA band, Contact with map link, Footer.

### Starter templates (hand-authored, not AI-generated)

Creator, Restaurant or shop, Service, Event, Product or waitlist, Portfolio. Each is a complete document with designed layouts for mobile, tablet, and desktop. Ship two first (Creator, Restaurant), then add the rest.

**Why hand-authored:** the AI should choose a template and fill it, or compose sections from the library. It should not invent layouts from nothing, because that is where the current output went wrong. AI-assisted layout editing (section 9) works on top of good starting points.

### Tokens

Six palette presets (ink, sand, forest, clay, sky, mono) plus custom. Every preset is checked at build time for text-on-background contrast of at least 4.5:1 for body text and 3:1 for large text, for **every** token pair used in the library, including muted and accent text. A custom palette runs the same check live and shows failures in the Theme panel. Fonts come from a curated list of about six, self-hosted. Radius and spacing unit are single sliders.

---

## 9. Built-in AI prompting

### 9.1 What the AI can do

An **AI command bar** (Ctrl/Cmd + K) with a mode selector:

| Mode | Example prompt | Scope sent to the model |
|---|---|---|
| **Edit selection** | "Make this a two-column layout on desktop" | Selected subtree, active breakpoint, tokens |
| **Edit page** | "Make the whole page feel warmer and more spacious" | Compact outline of the page, tokens |
| **Add section** | "Add a pricing section with three plans" | Outline, section library names, tokens |
| **Generate page** | "A bakery in Lagos selling cakes, order on WhatsApp" | Description, section library names, user facts |
| **Make responsive** | "Adapt my mobile design for tablet and desktop" | Whole outline with mobile styles, target breakpoints |
| **Fix this breakpoint** | "Tablet looks cramped" | Linter findings for that breakpoint, subtree |
| **Write copy** | "Rewrite the headline" | Selected node, user facts (this is the V2 copy assist, kept) |

"Make responsive" is the highest-value mode. The user designs mobile, one click proposes sensible tablet and desktop overrides, and the user accepts or edits them.

### 9.2 The AI returns operations, never markup

```ts
// lib/builder/ops.ts
export const OpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("addNode"),    parent: z.string(), index: z.number().int().optional(), node: NodeInputSchema }), // may nest children
  z.object({ op: z.literal("updateProps"), id: z.string(), props: z.record(z.unknown()) }),
  z.object({ op: z.literal("setStyle"),   id: z.string(), bp: z.enum(["mobile", "tablet", "desktop"]), style: StyleSchema }),
  z.object({ op: z.literal("moveNode"),   id: z.string(), parent: z.string(), index: z.number().int() }),
  z.object({ op: z.literal("deleteNode"), id: z.string() }),
  z.object({ op: z.literal("setHidden"),  id: z.string(), bp: z.enum(["mobile", "tablet", "desktop"]), hidden: z.boolean() }),
  z.object({ op: z.literal("applyPalette"), palette: z.enum(["ink", "sand", "forest", "clay", "sky", "mono"]) }),
  z.object({ op: z.literal("setToken"),   key: z.enum(["radius", "spacingUnit"]), value: z.number() }),
]);
export const AiResponseSchema = z.object({ summary: z.string().max(200), ops: z.array(OpSchema).max(30) });
```

There is intentionally **no op that touches `destination`**, no op that writes a URL into a node, and no op that sets a raw colour outside the palette, apart from validated hex on custom tokens.

### 9.3 The apply pipeline (all in code, none in the prompt)

1. **Parse** with `AiResponseSchema`. On failure, retry once with the validation errors appended. On a second failure, show "Couldn't make that change" and change nothing.
2. **Remap IDs.** The model proposes temporary IDs for new nodes. Code assigns real IDs.
3. **Check references.** Every `id` and `parent` must exist, or be a node added earlier in the same batch.
4. **Check containment** against `CAN_CONTAIN`, and the node-count ceiling (150 per document).
5. **Refuse locked nodes.** Any op on a `locked` node is dropped.
6. **Facts guard.** Any price, phone number, email, or address in new text that is not present in the document or the user's provided facts is removed, and the user is told.
7. **Links guard.** Link props may only use URLs from the user's own link list, or generated contact links. New `button`s must use `bind: "destination"`.
8. **Image guard.** `mediaId` must exist in the user's library. Otherwise the node is created with an empty image placeholder.
9. **Contrast guard.** Style ops are applied to a copy, the linter runs, and any new contrast failure rejects that op with a note.
10. **Show a diff preview.** Apply the result to a ghost copy of the document, render it on canvas with changed nodes outlined, and show the summary with **Accept**, **Reject**, and **Refine**. Accept commits one undo step.
11. **Log** the prompt, mode, prompt version, model, ops count, and accept or reject, for the evaluation set.

### 9.4 The builder system prompt

```text
You edit a one-page website by returning a JSON list of operations. You never write HTML, CSS,
or code. Return JSON only, matching the schema you are given. No commentary, no markdown fences.

You will receive: the mode, the user's instruction, the active breakpoint, an outline of the page
(node id, type, short text, parent), the design tokens, the allowed element types and style
properties, the section library names, the user's media IDs, and the user's facts.

Rules:
- Make the smallest change that satisfies the instruction. Do not touch nodes the instruction does
  not concern.
- Mobile is the base design. Changes made for "tablet" or "desktop" go only in that breakpoint's
  style. Do not alter mobile styles unless asked.
- Prefer stacks and grids over free positioning. Use free frames only when asked for overlap.
- Use only element types and style properties from the allowed lists.
- Use colour tokens (bg, fg, accent, muted, surface, border, onAccent). Do not invent hex colours.
- Use only facts present in the user's facts or the existing page. Never invent prices, addresses,
  phone numbers, emails, handles, reviews, awards, or years of experience. If a value is missing,
  leave the text empty or use a clearly generic label.
- Never output a URL. Buttons that lead to the main destination use bind "destination". Other
  links must reference link IDs given to you.
- Images: use only the media IDs given. If none fits, add an image node with no mediaId.
- Copy: plain, direct language. No superlatives, no exclamation marks, no emojis. Headings 6 words
  max, body text 25 words max per element, button labels 4 words max.
- Mobile text must be at least 16px. Tap targets (buttons, link rows) at least 44px high.
- At most 30 operations. Add a "summary" of one sentence describing what you changed.
- If the instruction cannot be done with the allowed operations, return an empty ops list and say
  why in the summary.

Mode "make responsive": read the mobile styles and propose tablet and desktop overrides only.
Typical changes: more grid columns, side-by-side hero, larger type, wider max-width, more padding.
Never change content.
```

### 9.5 The deterministic linter (no AI, runs always)

Shown as a panel with a count badge. Each finding selects the offending node when clicked.

- Text contrast below 4.5:1 (3:1 for large text), checked at each breakpoint against the actual background, including images with overlays
- Mobile body text below 16px
- Tap target below 44px on mobile
- Horizontal overflow at 390, 820, and 1280 (measure `scrollWidth > clientWidth` in the iframe)
- Image without alt text, or with no image selected
- Placeholder text still present
- Empty links or empty buttons
- A free frame whose children extend outside the frame
- More than one `h1`
- Page weight over budget (section 10)

The linter is also the safety net for AI changes (section 9.3, step 9), so both the user and the AI are held to the same checks.

### 9.6 Evaluation harness (extends the earlier one)

Build 30 to 40 instructions across all modes, run through the pipeline against fixed test documents. Record per run and gate on:

| Metric | Gate |
|---|---|
| Schema pass rate after one retry | 98% or higher |
| Guardrail violations reaching the document (facts, links, locked nodes) | 0 |
| New contrast failures introduced | 0 |
| Horizontal overflow at any of the three widths after applying | 0 |
| Node-count ceiling breaches | 0 |
| "Make responsive" outputs where mobile styles changed | 0 |

Render each result at 390, 820, and 1280 in Playwright for the overflow check, and keep screenshots with the results so a human can look at a sample after each prompt change.

---

## 10. Security and performance

### Security
- **No arbitrary markup.** Text is plain. Inline editing strips formatting. There is no HTML, script, or custom-code element, and no `dangerouslySetInnerHTML` for user content.
- **No raw CSS.** All values pass through per-property serializers. `StyleSchema` is strict.
- **URL allowlist:** `https:`, `tel:`, `mailto:`, and `https://wa.me/`. Reject `javascript:`, `data:`, and anything else, both on save and on render.
- **Embeds:** only YouTube and Vimeo, by ID, never by pasted URL or HTML.
- **Uploads:** accept JPEG, PNG, WebP, and AVIF only. Check the real file signature, not just the extension. Cap at 5 MB per file, re-encode and resize on the server, strip metadata, and store under generated names.
- **Public pages** are sent with a strict Content Security Policy: no inline scripts, images from the media origin only, frames only from the YouTube and Vimeo no-cookie domains.
- **Draft preview URLs** are signed, expire, and send `noindex`.
- **Ownership checks** on every API route: a user can only read or write their own documents and media.
- **Rate limits** on AI calls (per user per day, per minute) and on uploads.

### Performance budgets (published pages)
- HTML plus CSS under 30 KB gzipped for a typical page
- Largest Contentful Paint under 1.5 s on a throttled mid-range phone
- Cumulative Layout Shift under 0.05. Every image has stored width and height
- No framework JavaScript on the page. Images use `srcset`, and images below the fold use `loading="lazy"`
- Fonts self-hosted, with `font-display: swap`. A system fallback stack is set for each font

---

## 11. Migrating V2 pages to the new model

Write a pure function `migrateV2(page: PageV2): Doc` and keep the V2 renderer until parity is proven.

| V2 field | Becomes |
|---|---|
| `brand.name`, `brand.headline`, `brand.tagline` | A `section` with a `stack` containing a badge (name), `heading`, and `text` |
| `cta` | A `button` with `bind: "destination"`, `locked: true` |
| `links[]` | A `stack` of `linkRow` elements |
| `services[]` | A `grid` of `card`s, each containing `priceItem` content. Columns 1 / 2 / 3 |
| `contact` | A `contact` element, plus a `social` element if an Instagram handle exists |
| `brand.palette` | `tokens.palette` and `tokens.colors` |
| (new) | `destination.url` taken from the page's CTA URL. `placeholder: true` on any node whose text matches the known fallback strings |

**Mobile must be visually identical** to what each page looks like today. Tablet and desktop get the sensible multi-column layouts from the table above, which is a visible improvement but a change, so tell users about it before enabling for existing pages.

**Parity test:** for a sample of at least 20 real pages, screenshot V2 and migrated V3 at 390px and compare with a small pixel tolerance. Anything over tolerance blocks the cutover and goes on a list for manual review.

---

## 12. Phase prompts (paste one at a time)

Each prompt assumes the Master Brief was already pasted.

### Phase 0: Recon (no code changes)

```text
PHASE 0: RECON. Do not change any code.
Read docs/BUILDER_SPEC.md fully. Then inspect the repo and write docs/builder-recon.md
containing:
1. The file inventory for the V2 engine: prompt, schema, renderer, editor, public route,
   redirect route, database access, storage, auth. Path and one line each.
2. The database tables or collections involved, and how published pages are stored.
3. Which UI, state, and styling libraries are already in use.
4. What you can reuse as is, what must change, and what must stay behind a flag.
5. A list of every place that reads the V2 Page shape.
6. Risks and anything in the spec that conflicts with the repo.
7. Your proposed answers to the open decisions in spec section 14.
Stop after writing the file and summarise it in 10 lines.
```

**Acceptance:** the recon file exists, lists real paths, and names the conflicts honestly. No other files changed.

### Phase 0.5: Fix what is broken now

```text
PHASE 0.5: FIX THE V2 ISSUES (spec section 1). Keep changes small and safe.
1. The public route must wrap the page in the same centred max-width container as the editor
   preview, so it no longer stretches edge to edge on wide screens.
2. Mark fallback copy as placeholder. Show a "Sample text" indicator in the editor on those
   elements. When the user clicks Save & Publish while placeholder text remains, show a warning
   that lists what is left, with a "Publish anyway" option.
3. Run a contrast check on every text and background pair in the rendered page, including the
   small eyebrow label and muted text. Fix any failing pair by choosing the correct token.
4. Remove negative letter-spacing and any text-shadow from headings.
5. Make the page background fill the whole phone preview, including the top safe-area region.
6. Fix the editor shell so nothing is clipped at 1280px wide: the preview label, the header's
   right edge, and the close button.
Add tests where practical. Report with before and after screenshots at 390px and 1280px.
```

**Acceptance:** at 1440px the public page is a centred column. A page with sample copy shows the warning on publish. No pair on the default palettes fails contrast. The phone preview has no white strip. The editor shell has no horizontal overflow at 1280px.

### Phase 1: Document model, compiler, renderer, migration (no editor UI)

```text
PHASE 1: DOCUMENT MODEL AND RENDERER. Spec sections 5.1 to 5.4, 7, and 11.
Build, with tests:
1. lib/builder/schema.ts: DocSchema, NodeSchema, StyleSchema, per-type prop schemas, and the
   CAN_CONTAIN table.
2. lib/builder/resolve.ts: resolveStyle, isOverridden, resetOverride.
3. lib/builder/compile-css.ts: per-node classes, min-width media queries at 768 and 1024, diff
   against the previous breakpoint, hidden-per-breakpoint handling, per-property serializers.
   Unit-test it with strings that attempt CSS injection (semicolons, braces, url(), expression).
   They must be rejected or neutralised.
4. lib/builder/render.tsx: RenderDoc with modes "published" and "editor". Server-renderable.
   Native HTML only.
5. lib/builder/migrate-v2.ts: migrateV2 as in spec section 11.
6. A temporary, auth-protected route /dev/builder-render?page=ID&width=390|820|1280 that renders
   a migrated page in an iframe of that exact width, for visual checks.
7. A Playwright test that screenshots V2 and migrated V3 at 390px for 20 sample pages and compares
   them with a small tolerance.
Do not build any editor UI. Do not remove V2.
```

**Acceptance:** all schema and compiler tests pass, including injection tests. The migrated mobile render matches V2 within tolerance for the sample set, with the mismatches listed. The dev route shows tablet and desktop layouts changing correctly.

### Phase 2: Editor shell, exact-width canvas, selection, inspector, commands

```text
PHASE 2: EDITOR SHELL AND CANVAS. Spec sections 5.5, 5.6, and 6.1 to 6.5 (editing of props only).
Build, behind a feature flag and a new route /builder/[pageId]:
1. The three-pane layout from spec 6.1, with no horizontal overflow at 1280px or wider.
2. The canvas as an iframe of exact width, React rendered into it through a portal, compiled CSS
   injected and refreshed on change.
3. The breakpoint switcher (keys 1, 2, 3), device frames, zoom and Fit, the custom-width drag
   handle with the width and active-breakpoint badge, tablet rotation with the 1180px note, and
   Preview mode with an "Open on my phone" signed draft URL.
4. The overlay layer: hover and selection boxes, label chips, positioned from iframe rects and zoom.
   Hit-testing with elementsFromPoint. Click, shift-click, and marquee selection.
5. The Layers panel: tree, rename, hide per breakpoint, lock, select-sync.
6. The Inspector tabs Content, Layout, Style, Responsive, with override dots and reset. Edits go
   through the command system and write only to the active breakpoint.
7. The zustand and immer store with commands, patch-based undo and redo, gesture coalescing, and
   debounced autosave with baseVersion conflict handling.
8. Inline text editing (plain text only).
Do not build drag and drop or resize handles yet.
```

**Acceptance:** switching to tablet shows an iframe exactly 820px wide, and a style set only at tablet changes only there. Undo and redo work for every inspector edit. A slider scrub is one undo step. Two browser tabs editing the same page show a conflict banner instead of overwriting. The editor fits at 1280px.

### Phase 3: Drag and drop, resize, free frames

```text
PHASE 3: DRAG, DROP, AND RESIZE. Spec sections 5.7, 6.2, 6.3, and 6.4.
Build:
1. Drag from the Add panel to the canvas, and drag to move on canvas, using custom pointer events
   (not a library) with the drop-target logic in spec 6.3: nearest valid container, insertion
   index along the main axis, grid-cell targeting, insertion line and container highlight, and a
   not-allowed state driven by CAN_CONTAIN.
2. Reordering and reparenting in the Layers panel (a library is fine here, since it is in the
   same document).
3. Resize handles with fill, hug, and fixed semantics, double-click to hug, and Shift for aspect
   ratio on images.
4. Spacing handles for padding and gap, with live px labels.
5. The "free" container: absolute children, snapping to edges, centres, siblings, and an 8px
   grid, pink smart guides with distance labels, Ctrl to disable snapping, nudge keys.
6. Duplicate, Alt-drag duplicate, group and ungroup, z-order, copy and paste of nodes and styles
   across breakpoints, and every shortcut in spec 6.4.
7. Every gesture is exactly one undo step.
Include Playwright tests that drag an element from the palette into a stack, reorder it, resize
it, undo all three, and redo.
```

**Acceptance:** dragging works at zoom 50, 100, and 150 percent with the drop line in the right place. A locked node refuses deletion with a message. The Playwright drag test passes in Chromium and WebKit. Resizing a button to a fixed width at tablet changes only the tablet override.

### Phase 4: Responsive controls

```text
PHASE 4: RESPONSIVE TOOLS. Spec sections 5.2, 6.5 (Responsive tab), and 7.
Build:
1. Per-breakpoint visibility toggles on canvas, in layers, and in the inspector, with the correct
   display restore logic in the compiler.
2. Per-breakpoint grid columns, stack direction, gap, and type size, with sensible defaults when
   an element is created (grid 1/2/3 columns, button full width on mobile and hug above).
3. "Copy mobile styles to tablet/desktop" and "Reset breakpoint to inherited" at element and
   section level.
4. A Responsive summary in the inspector listing every property overridden at tablet and desktop.
5. Overflow detection at 390, 820, and 1280 feeding the linter, with a badge on the breakpoint
   switcher when that breakpoint has a finding.
```

**Acceptance:** hiding an element on tablet only leaves it visible on mobile and desktop in the published HTML. The overflow badge appears when a fixed-width element exceeds the mobile frame, and clears when fixed.

### Phase 5: Library, tokens, assets, templates, linter

```text
PHASE 5: LIBRARY AND THEME. Spec sections 7, 8, and 9.5.
Build:
1. All element types in spec section 7, with per-type prop schemas and inspector content forms.
2. The section library as hand-authored JSON, each verified at 390, 820, and 1280.
3. Creator and Restaurant starter templates, complete at all three breakpoints.
4. The Theme panel: six presets plus custom, live contrast results, curated fonts, radius,
   spacing unit. Palette changes recolour the page through tokens.
5. The media library: upload with the checks in spec section 10, server-side resize and re-encode,
   width and height stored, alt text required before publish.
6. The deterministic linter (spec 9.5) as a panel with click-to-select.
Do not build the AI yet.
```

**Acceptance:** a user can build a restaurant page from the template in under five minutes without AI. Every library section passes the linter at all three widths. Uploading a renamed `.exe` as `.jpg` is rejected.

### Phase 6: AI in the builder

```text
PHASE 6: AI COMMAND BAR. Spec section 9.
Build:
1. The command bar (Ctrl/Cmd+K) and the AI tab with the seven modes in spec 9.1.
2. OpSchema and AiResponseSchema exactly as in spec 9.2, and the context builder that sends only
   the compact outline, selection, tokens, vocab, media IDs, link IDs, and user facts.
3. The apply pipeline in spec 9.3, steps 1 to 11, in code. Include the facts guard, links guard,
   image guard, contrast guard, and locked-node refusal.
4. Diff preview on a ghost copy with Accept, Reject, and Refine. Accept is one undo step.
5. The builder system prompt from spec 9.4, stored as a versioned file, with the prompt version
   recorded on every AI action.
6. Port the V2 copy assist into the "Write copy" mode, keeping its behaviour and limits.
7. Daily and per-minute rate limits, response caching by input hash for generate-page mode, and a
   clean fallback (the editor keeps working) when the model call fails.
8. The evaluation harness in spec 9.6 with 30 to 40 cases, Playwright screenshots at the three
   widths, and a gate that exits non-zero on failure.
Report the baseline numbers before tuning any prompt.
```

**Acceptance:** an instruction that tries to set a URL, edit the destination, or delete a locked node results in zero such changes reaching the document. The harness runs end to end and the gate numbers are reported honestly, including failures.

### Phase 7: Publishing, versions, tracking

```text
PHASE 7: PUBLISH PIPELINE. Spec sections 3, 7, and 10.
Build:
1. Draft versus published state. Publishing writes an immutable version row and moves a live
   pointer. Rollback moves the pointer back.
2. The public route serves the live version from the shared renderer as static HTML plus compiled
   CSS, with cache invalidation on publish and the CSP headers in spec section 10.
3. The /r/{pageId}/{nodeId} redirect for every link and every destination-bound button, logging
   asynchronously with minimal data (timestamp, page, node, coarse region). Redirect overhead
   target under 50 ms.
4. Page meta (title, description, OG image), the generated OG image fallback, and a slug field.
5. A dashboard view: clicks per link, per page, per day. QR download lives here and in the QR
   element, generated from the live URL.
6. Pre-publish checklist: linter findings, placeholder text, missing alt text, with a "Publish
   anyway" only for warnings, never for errors.
```

**Acceptance:** publishing twice and rolling back returns the first version byte for byte. Clicks appear on the dashboard within a minute. The public page ships no framework JavaScript, verified in a test that inspects the HTML.

### Phase 8: Hardening

```text
PHASE 8: HARDEN. Spec sections 10 and 13.
1. Run the full test plan in spec section 13 and fix what fails.
2. Accessibility: keyboard operation of the editor (layers, inspector, add panel, and moving
   selected elements with arrows), visible focus, labelled controls, and screen-reader names for
   canvas selection. Published pages: semantic landmarks, one h1, visible focus, reduced-motion
   respected.
3. Performance: confirm the budgets in spec section 10 on five representative pages and fix
   regressions.
4. Browser checks: Chrome, Safari (including iOS Safari for the published page), Firefox. Fix
   100vh and safe-area problems.
5. Empty states, error states, loading states, and an onboarding hint sequence for the first visit.
6. A security review pass against the list in spec section 10, with written findings.
Report every failure found and how it was fixed.
```

**Acceptance:** every item in section 13 passes or is listed with a reason and an owner. No critical security finding remains open.

### Phase 9 (later, separate decisions)

Multi-page sites, forms with a backend, animation presets (CSS only, reduced-motion safe), custom domains, team collaboration, a CMS-lite for repeating items. Each needs its own spec. Do not start any of them inside this build.

---

## 13. Test plan

| Area | Test | Tool |
|---|---|---|
| Schema | Valid docs pass. Unknown style keys, bad URLs, bad colours, oversize numbers, and missing parents fail | Unit |
| Compiler | Output for a known doc matches a snapshot. Injection strings are neutralised. Hidden-per-breakpoint restores display correctly | Unit |
| Parity | The same document in editor mode and published mode has identical layout (bounding boxes of every node within 1px) at 390, 820, and 1280 | Playwright |
| Migration | 20 real pages: V2 vs V3 at 390px within tolerance | Playwright |
| Breakpoints | A tablet-only change does not alter mobile or desktop output | Unit and Playwright |
| Drag and drop | Palette to stack, reorder, reparent, invalid drop refused, at three zoom levels | Playwright, Chromium and WebKit |
| Resize | Fill, hug, fixed, aspect lock, one undo step per gesture | Playwright |
| Undo | Every command type undoes and redoes cleanly, including AI batches | Unit |
| Autosave | Conflict returns 409 and shows the banner. No silent overwrite | Integration |
| AI | Guardrail cases: URL injection, destination edit, locked deletion, invented phone, unknown mediaId | Unit |
| AI quality | The evaluation harness gate in spec 9.6 | Script |
| Linter | Each rule fires on a crafted document and clears when fixed | Unit |
| Security | Upload spoofing, `javascript:` links, script text, oversized files, cross-user access | Integration |
| Performance | Budgets in spec section 10 on five pages | Lighthouse CI |
| Accessibility | Keyboard-only walkthrough of build and publish. Automated axe check on the editor and a published page | Playwright and axe |

---

## 14. Decisions to make, with the defaults the agent will use

| # | Decision | Default if you do not answer |
|---|---|---|
| 1 | Breakpoint widths | 390 / 820 / 1280 frames, thresholds at 768 and 1024 |
| 2 | Free positioning in v1 | Included, but only inside an explicit "free" container |
| 3 | Fonts | Six curated, self-hosted fonts (one display, one body, one mono, plus three alternates) |
| 4 | Image processing | Server-side resize to three widths, WebP output |
| 5 | Does existing users' tablet and desktop appearance change on migration? | Yes, to the new multi-column layouts, after a notice. Mobile stays identical |
| 6 | AI availability | Free tier gets the copy mode only. Layout modes are paid. Daily cap 20 |
| 7 | Footer "Powered by" | Locked on the free plan, removable on paid plans |
| 8 | Domain | Page lives at the existing `/page/[code]` URL |
| 9 | Analytics detail | Clicks per node and per day, coarse region only, no raw IPs |
| 10 | AI provider and model | Whatever the repo already calls. Wrap it behind one function so it can be swapped |

---

## 15. Definition of done

The build is done when all of these are true:

1. An existing V2 page opens in the builder, looks identical on mobile, and gets sensible tablet and desktop layouts.
2. A new user builds a restaurant page from a template, in the three windows, in under ten minutes, without help.
3. Dragging, resizing, and reordering work in all three windows, and every gesture undoes as one step.
4. The editor's tablet and desktop windows show exactly what the published page will show, confirmed by the parity test.
5. The AI can generate a page, edit a selection, and adapt mobile to tablet and desktop, and cannot change the destination URL, set arbitrary links, invent contact details, or touch locked elements. The evaluation gate passes.
6. Published pages ship no framework JavaScript and meet the performance budgets.
7. The linter reports zero errors on every shipped template and section at all three widths.
8. V2 code is removed in a single commit after the parity tests pass.

---

## 16. Realistic expectations

- **Time:** for one developer working with an agent part-time, expect roughly 10 to 16 weeks for phases 1 to 8, with the canvas and drag-and-drop phases taking the largest share. The estimate is rough, because it depends heavily on how well the repo's existing structure fits.
- **What will feel unfinished first:** free-frame snapping, touch-device editing (the editor is designed for desktop browsers, so editing on a phone is not a v1 goal), and the finer points of text editing. Decide early whether those are acceptable.
- **The risk worth watching:** drift between the editor canvas and the published page. The single shared renderer and the parity test exist to prevent it. If a shortcut ever breaks either, fix it before building anything else.
- **Where the AI helps most:** "Make responsive", "Add section", and copy writing. Where it helps least: freeform "make it look better" requests, which are subjective and hard to evaluate. Lead with the first group in how the feature is presented to users.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-26T13:07:39+01:00.

The user has uploaded 4 image(s):
- C:/Users/USER/.gemini/antigravity/brain/b0d8d596-0373-4dd4-a6e0-c6210f15e548/.user_uploaded/media_1795691321435_27132fc6.png
- C:/Users/USER/.gemini/antigravity/brain/b0d8d596-0373-4dd4-a6e0-c6210f15e548/.user_uploaded/media_1795691394304_687630f7.jpg
- C:/Users/USER/.gemini/antigravity/brain/b0d8d596-0373-4dd4-a6e0-c6210f15e548/.user_uploaded/media_1795691459202_a602943d.png
- C:/Users/USER/.gemini/antigravity/brain/b0d8d596-0373-4dd4-a6e0-c6210f15e548/.user_uploaded/media_1795692733204_31be67d6.jpg
You can embed these images in an artifact if you need the USER to review them.
</ADDITIONAL_METADATA>