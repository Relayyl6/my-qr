# Visual Builder: What to Transform and What to Add

**Extends:** `docs/BUILDER_SPEC.md` (the earlier spec). Where the two disagree about **UI scope**, this file wins. Where they disagree about **security, the locked destination URL, the one-renderer rule, or the "AI returns operations only" rule**, the earlier spec wins.

**Save as:** `docs/BUILDER_SUITE.md`, then use the phase prompts in section 9.

**How to read it**
- Items are checkboxes so your agent (or you) can track them.
- **T1** = what makes it feel like a design tool. Do this first.
- **T2** = power features and breadth.
- **T3** = platform features. Later, and each needs its own spec.
- **Scope honesty:** this is a Framer-class builder for one-page sites, not Figma. Vector pen tools, boolean operations, prototyping flows, and multi-page CMS are out of scope (section 10).

---

## 1. What your screenshots show

| Area | What exists now | What is missing |
|---|---|---|
| Top bar | Breakpoint switcher, 1280px badge, zoom, undo/redo, Preview, Save & Publish | No tools (move, hand, insert, text, shape, comment), no align or distribute, no view options, no device presets, no version history, no share |
| Layers | Tree with type icons, search, selection sync | No visibility or lock toggles per row, no drag handles, no multi-select, names truncated, no breadcrumb, no override indicators |
| Canvas | Exact-width frame, selection box with 8 handles, label chip, "stack" chip, custom-width handle | No rotation, no corner-radius handles, no padding or gap handles, no distance measurements, no guides or rulers, no snapping feedback, no multi-select box |
| Inspector: Layout tab | Width mode (Fill / Hug / Fixed), width slider, height mode, height slider, Positioning (In-Flow / Free) | No padding, margin, gap, alignment, direction, wrap, min/max, aspect ratio, overflow, grid controls, X/Y, rotation |
| Inspector: Content tab | **Empty** for the LinkRow in screenshot 1 | Per-element fields (label, subtitle, icon, link, tracking) |
| Inspector: Style tab | Not shown in your screenshots | Fills, strokes, effects, typography, radius, opacity |
| Inspector: Resp tab | Overrides summary and two "Copy Mobile Styles" buttons. **Both tablet and desktop show 0 overrides** | Per-breakpoint reorder, content overrides, hide controls, reset per property |
| Page at desktop | Mobile column stretched wide. Link rows run about 850px across. Hero is one centred stack | Designed desktop layouts: two-column hero, constrained widths, multi-column sections |
| AI bar | Floating prompt bar | Modes, scope chips, history, preview before apply |

**The key observation:** because tablet and desktop both show zero overrides, the builder currently renders your mobile design wider. The point of the product, three genuinely different layouts, is not yet happening. The fixes below are what unlock that.

---

## 2. Fix first (visible in your screenshots)

- [ ] **Content tab is blank for LinkRow.** Every element type needs a Content form (table in 3.1).
- [ ] **The round floating button overlaps the "Fixed (px)" control** in the Layout tab, and it floats over the panel edge. Dock it into the top bar or the canvas corner, make it collapsible, and never let it cover an inspector control.
- [ ] **Pink horizontal lines** near the bottom of the Layers list and near the bottom of the canvas look like stuck drop indicators. Clear all drag indicators on pointer-up, on Escape, and when the pointer leaves the window.
- [ ] **Layer names are truncated** ("Card: Core ...", "Link: Schedule a..."). Make the left panel resizable, show the full name in a tooltip, and generate shorter automatic names ("Link: Schedule", "Card: Core Design").
- [ ] **Size modes are named inconsistently.** Width says Fill / Hug / Fixed, height says Auto / Hug and Fixed (px). Use the same set for both: **Fixed, Fill, Hug, Relative (%), Screen** (section 3.1).
- [ ] **New elements inherit mobile widths on desktop.** Give every element and section sensible tablet and desktop defaults at creation (for example link rows capped at 560px and centred, services grid at 3 columns).
- [ ] **The canvas is not centred.** At 64% the frame sits high with a large empty area below. "Fit" should fit both axes and centre the frame.
- [ ] **The iframe scrollbar is bright white** on a dark page. Set `color-scheme` and `scrollbar-color` from the palette so it matches, on the published page as well.
- [ ] **The AI bar placeholder is cut off** ("...(C"). Shorten it so the shortcut shows fully.
- [ ] **Nothing selected means a blank right panel?** Show a Page inspector instead (section 3.5).

---

## 3. TRANSFORM: upgrade what exists

### 3.1 The Inspector, rebuilt (T1)

The inspector is where "limited operability" lives. Replace the three-slider Layout tab with a sectioned panel like the one below. Sections appear only when they apply to the selected element.

**Header (always):** inline-rename name, type chip, breakpoint badge, lock, visibility toggle for this breakpoint, component badge if any, a dot with count when this breakpoint has overrides, and a "reset breakpoint" action.

**Section A: Position and size** (all elements)
- [ ] X, Y fields (for free-frame children), or "In flow" label for stack children
- [ ] W, H fields, each with a mode menu: **Fixed (px)**, **Fill**, **Hug**, **Relative (%)**, **Screen (vh/svh)**
- [ ] Min and max width and height
- [ ] Aspect ratio lock and preset ratios (1:1, 4:3, 3:2, 16:9, 3:4, 2:3, custom)
- [ ] Rotation (free-frame children), flip horizontal and vertical
- [ ] Constraints widget (pin left, right, top, bottom, centre, scale) for free-frame children
- [ ] "Ignore auto layout" toggle, so one child can float inside a stack
- [ ] Positioning: In flow, Free, Sticky (with offset), Fixed to screen (with offsets), plus z-index

**Section B: Auto layout** (stack, grid, section, card)
- [ ] Direction: vertical, horizontal, grid, with a wrap toggle
- [ ] 3×3 alignment picker (as in Figma), plus distribution: packed, space between, space around
- [ ] Gap: single value, or separate row and column gap, or "auto" (space between)
- [ ] Padding: single value or per side
- [ ] Reverse order toggle
- [ ] Clip content, and overflow: visible, hidden, scroll-x, scroll-y, with optional scroll snap
- [ ] Grid: column count or a template (`1fr 2fr`, `auto-fit minmax(240px, 1fr)`), row template, gaps, item alignment
- [ ] Per-child grid span (column span, row span)
- [ ] Section: content width (token), full-bleed toggle, vertical padding preset

**Section C: Alignment bar** (appears on selection)
- [ ] Align left, centre, right, top, middle, bottom, relative to the parent (single selection) or the selection bounds (multi)
- [ ] Distribute horizontally and vertically, and "tidy up" to equal spacing
- [ ] Match width and match height

**Section D: Appearance**
- [ ] Opacity
- [ ] Blend mode: normal, multiply, screen, overlay
- [ ] Corner radius: single, or per corner, with a "pill" and "circle" shortcut
- [ ] Visibility per breakpoint (three small toggles)

**Section E: Fill**
- [ ] Multiple fills, reorderable
- [ ] Solid (token or hex), with the contrast chip against text on top
- [ ] Linear and radial gradient with a stop editor, angle, and presets
- [ ] Image fill: asset picker, fit (cover, contain, tile), **focal point** picker, position, and a separate image per breakpoint
- [ ] Overlay scrim (colour plus opacity) for text on photos
- [ ] Video background (small muted loop, poster required)
- [ ] Eyedropper, recent colours, "colours in this selection"

**Section F: Stroke**
- [ ] Colour, weight, style (solid, dashed, dotted), per-side widths, position (inside, outside)

**Section G: Effects**
- [ ] Multiple drop shadows (x, y, blur, spread, colour), inner shadow
- [ ] Layer blur, **background blur** (frosted glass)
- [ ] Shadow presets (sm, md, lg, glow)

**Section H: Typography** (text, heading, button, link elements)
- [ ] Font family (curated list with live preview), weight, size, line height, letter spacing (with the small negative floor kept)
- [ ] **Fluid size:** one control that generates a `clamp()` between the mobile and desktop sizes
- [ ] Align horizontal and vertical, case, underline, strikethrough
- [ ] Paragraph spacing, line clamp (truncate after N lines)
- [ ] Auto-resize mode: auto width, auto height, fixed
- [ ] Colour with gradient option
- [ ] Inline marks (bold, italic, link, accent colour) stored as structured runs, never HTML (so "PICK YOUR **PACKAGE**" with a gold word is possible)
- [ ] Apply a **text style** from the library (H1, H2, Body, Caption, Button)

**Section I: Image** (image elements)
- [ ] Crop tool, focal point, rotate, flip
- [ ] Adjustments: brightness, contrast, saturation, grayscale, sepia, hue
- [ ] Alt text (with an AI suggest button), caption, link
- [ ] Load priority (eager for the top image, lazy for the rest)
- [ ] Art direction: a different image or crop per breakpoint

**Section J: States and transitions**
- [ ] State tabs: Default, Hover, Pressed, Focus, Disabled
- [ ] Per state: any appearance, fill, stroke, effect, transform value
- [ ] Transition: duration, easing preset, delay

**Section K: Interactions** (T2)
- [ ] Trigger: click, hover, in view, page load
- [ ] Action: open link, scroll to element, call, WhatsApp, copy text, toggle element, open lightbox, open drawer
- [ ] Animation preset: fade, fade up, slide, scale, blur in, with stagger for children

**Section L: Responsive**
- [ ] Table of what this element overrides at tablet and desktop, with per-property reset
- [ ] Reorder children at this breakpoint (image first on mobile, text first on desktop)
- [ ] Content overrides per breakpoint (different text, image, or button label)
- [ ] Copy styles to another breakpoint, reset all
- [ ] Fluid sizing toggles

**Section M: Advanced**
- [ ] Layer name, anchor ID, ARIA label, role, HTML tag (h1 to h6, section, nav, div)
- [ ] Tab order, "skip for screen readers"
- [ ] Lock, notes, export settings

**Multi-select behaviour:** show shared fields, display "Mixed" where values differ, and apply any change to all selected elements as one undo step.

**The Content tab, per element type**

| Element | Fields |
|---|---|
| Heading | Text, level, accent-word marks |
| Text | Text with inline marks, max lines |
| Button | Label, icon (left or right), variant, size, action, bound to destination (locked) or link |
| LinkRow | Title, subtitle, icon, link target, new-tab toggle, tracking label |
| Image | Asset, alt, caption, link, crop |
| Gallery | Image list (add, reorder, remove), layout type, captions |
| Card | Slots for title, text, image, price, badge, link |
| PriceItem | Name, price, currency, badge, description, link |
| Contact | Each field with show/hide toggle and order |
| Social | Network list, handle, order |
| Accordion | Items (question, answer, default open) |
| Testimonial | Quote, name, role, photo |
| Video | Provider, ID, poster, autoplay (muted only) |
| Map | Address, link label |
| Form | Fields, validation, success message, destination |
| Collection list | Source collection, template, filter, sort, limit |

**Done when:** selecting any element shows a populated Content tab, the Layout tab covers every item above that applies, and each control writes to the active breakpoint only, with an override dot.

### 3.2 Canvas transformation (T1)

- [ ] **Move:** 3px drag threshold, ghost preview, Shift locks the axis, Alt duplicates, Ctrl/Cmd bypasses snapping. Dragging out of a container reparents the element.
- [ ] **Resize:** eight handles, Shift keeps proportions, Alt resizes from the centre, live "W × H" badge. Resizing a stack child switches that dimension to Fixed and shows a short toast with an undo ("Width set to 360px. Hug").
- [ ] **Rotate:** handle outside each corner, Shift snaps to 15°. Free-frame children only.
- [ ] **Corner radius handles:** dots inside the corners, drag for all, Alt for one corner.
- [ ] **Padding and gap handles:** pink zones on hover and selection, drag to adjust, Alt for opposite sides, Shift for all sides, live px label.
- [ ] **Measurements:** hold Alt over another element to see the distance to it and to the parent.
- [ ] **Snapping:** edges, centres, siblings, parent bounds, guides, 8px grid, equal-spacing detection. Smart guides drawn in the overlay. A snap settings popover.
- [ ] **Selection model:** click selects, Alt+click cycles layers under the pointer, double-click enters a container or starts text editing, Enter selects the first child, Shift+Enter selects the parent, Tab and Shift+Tab move to the next and previous sibling, Esc goes up one level.
- [ ] **Multi-select:** Shift-click, marquee, Ctrl/Cmd+A, "select same type", and a shared transform box with proportional group resize.
- [ ] **Overlay rules:** handles stay a constant on-screen size at any zoom, hit areas at least 8px, colours by state (hover blue, selected green, parent dashed, component purple, locked grey).
- [ ] **Right-click menu:** cut, copy, paste, paste here, paste over, duplicate, delete, group, ungroup, wrap in stack, frame selection, bring forward and back, copy and paste styles, hide at this breakpoint, lock, rename, create component, add to library, copy to other breakpoints.
- [ ] **Clear all indicators** on pointer-up, Escape, and window blur (see section 2).

### 3.3 Layers panel (T1)

- [ ] Eye and lock icons on every row, revealed on hover and always visible when active
- [ ] Drag to reorder and reparent, with an indent-aware drop line
- [ ] Multi-select (Shift for range, Ctrl/Cmd for toggle)
- [ ] Inline rename (double-click or F2). Automatic names come from the content ("Heading: Architecting…")
- [ ] Per-breakpoint indicators: a dot where this breakpoint has overrides, a ghosted row where the element is hidden at this breakpoint
- [ ] Component, locked, and placeholder badges
- [ ] Collapse all and expand all, and filter by type
- [ ] Resizable panel width, with a tooltip for any truncated name
- [ ] **Breadcrumb bar** above the canvas (Main > Hero > Stack > Button), each part clickable
- [ ] **Isolate mode:** work inside one container with everything else dimmed
- [ ] A section outline for jumping between top-level sections

### 3.4 Top bar and toolbars (T1)

- [ ] **Tool group:** Move (V), Hand (H), Insert (+), Text (T), Stack (F), Shape (R), Image (I), Comment (C)
- [ ] **Contextual toolbar** on selection: align, distribute, group, wrap in stack, component, link
- [ ] **Device menu:** iPhone SE, iPhone 15, Pixel, iPad Mini, iPad Pro, Laptop 1440, Desktop 1920, plus custom size and orientation
- [ ] **Zoom menu:** Fit, 50, 100, 200, zoom to selection
- [ ] **View menu:** rulers, guides, layout grid, pixel grid, outline (wireframe) mode, spacing overlays, show or hide the device frame
- [ ] **Compare view** (section 3.6)
- [ ] **Preview:** in-editor preview, open in a new tab, and **"Scan to preview on your phone"**, a QR for the signed draft URL (a natural fit for DynamicQR)
- [ ] Version history, Share, Help and shortcuts
- [ ] Publish button opens the pre-publish checklist rather than publishing blindly

### 3.5 Workspace (T1)

- [ ] **Rulers** with draggable guides, and a guide manager
- [ ] **Layout grid overlay** per breakpoint (columns, gutter, margin), and an optional baseline grid
- [ ] Canvas background options (dark, light, checker)
- [ ] Frame label above each frame ("Desktop, 1280")
- [ ] Pan with Space, middle mouse, or Hand tool. Zoom centred on the pointer
- [ ] A minimap for long pages
- [ ] **Page inspector** shown when nothing is selected: page background, content width, fonts, colour tokens, text styles, layout grid, SEO fields, social image

### 3.6 Responsive controls (T1)

- [ ] **Compare view:** show Mobile, Tablet, and Desktop side by side at reduced zoom. Selection syncs across all three. An edit made in a frame writes to that frame's breakpoint. This is the single most Framer-like feature to add.
- [ ] **Custom breakpoints** (T2): add or remove up to five (for example 360, 390, 820, 1024, 1280, 1536) with per-breakpoint names
- [ ] Per-breakpoint **reorder** and **content overrides** (section 3.1, L)
- [ ] "Fix overflow" button that proposes a safe change for any element wider than its frame
- [ ] Responsive audit table: each breakpoint, each finding, click to select

---

## 4. ADD: the full suite

### 4.1 Elements

| Group | Element | Notes | Tier |
|---|---|---|---|
| Layout | Section, Stack, Grid, Free frame, Card, Divider, Spacer | Core containers | T1 |
| Layout | Columns (2 to 4 with ratios), Sticky container, Scroll row (horizontal, snap) | Scroll row replaces most carousels | T1 |
| Shapes | Rectangle, Ellipse, Line, Pill, Arch, Blob, Star, Triangle, Polygon (presets) | Radius, fill, stroke, effects all apply | T1 |
| Text | Heading, Text, Rich text (runs), Badge, Quote, List (bulleted, numbered, checklist) | Accent-word marks | T1 |
| Text | Marquee / ticker (CSS only) | Respects reduced motion | T2 |
| Actions | Button (variants, sizes, icons), Icon button, Link text, Floating action button (WhatsApp, call), Sticky bottom bar | Primary CTA stays bound to the destination | T1 |
| Media | Image, Avatar, Logo, Icon (searchable library), Gallery (grid, masonry, scroll row), Before and after slider | | T1 |
| Media | Video (YouTube, Vimeo), background video, Audio (Spotify, SoundCloud) | Embeds from a strict allowlist | T2 |
| Navigation | Header (logo, links, CTA, mobile menu), Mobile drawer, Anchor links with scroll spy, Tabs, Accordion, Announcement bar, Back to top, Footer | Header and drawer need a tiny script | T2 |
| Content | Pricing or package cards, Feature list, Stats, Process steps, Timeline, Team, Testimonial (single and scroll row), Logo strip, Rating stars, Trust badges, FAQ | | T2 |
| Local business | Opening hours table with "open now" badge, Map card (link-out), Contact card, Address block, Service area | "Open now" needs a tiny script or a precomputed fallback | T2 |
| Events | Event details (date, time, venue), Countdown, Add to calendar (.ics), RSVP button | | T2 |
| Commerce-lite | Product card (image, price, link-out), Menu with categories and tags, Package selector (link-out) | No checkout in v1 | T2 |
| Social | Social links, Share button (native share sheet), Instagram grid (static thumbnails with links) | | T2 |
| Utility | QR code (for this page or any URL), Download button (PDF or file), Copy-to-clipboard chip | | T2 |
| Forms | Contact form, Inquiry form, Newsletter, RSVP, **"Send to WhatsApp" form** | WhatsApp version needs no backend | T2 |
| Interactive | Lightbox, Modal, Drawer, Tooltip | Tiny script, only included when used | T2 |
| Advanced | Lottie, Calendar embed (Calendly, Cal.com), Custom code | Custom code stays out of v1 | T3 |

### 4.2 Section and template library

- [ ] **Heroes:** centred, split, full-bleed poster with numbered index, strip fan, scroll-row showcase, video hero, minimal link-in-bio
- [ ] **Sections:** services grid, menu or price list, packages, gallery, testimonials, stats, process, FAQ, contact with map link, CTA band, newsletter, footer variants, opening hours, event details
- [ ] **Templates** by industry: restaurant, salon, photographer, creator, consultant, church or event, product launch, portfolio, real estate listing, fitness coach, DJ or artist, lawyer or clinic
- [ ] Every section and template verified at all breakpoints with the linter
- [ ] **Save selection as section** to a personal library
- [ ] Section variants: swap a hero for another hero while keeping the content

### 4.3 Components, variants, and styles (T2, with tokens in T1)

- [ ] **Variables (tokens):** colour, number (radius, spacing, size), text, boolean. **Modes** (light and dark, or brand A and B) so one switch re-themes the page
- [ ] **Styles:** text styles, colour styles, effect styles, applied by name
- [ ] **Components** with properties (text, image, boolean, variant) and **variants** (type, size, state)
- [ ] Instances with overrides, "reset overrides", "detach instance", "go to main component"
- [ ] Create component from selection, nested components
- [ ] Account-level component library
- [ ] Design lint: off-token colours, off-scale spacing, more than three fonts

### 4.4 Collections: repeating content (T2)

- [ ] **Collection editor** (a table): name, fields (text, rich text, number, image, link, boolean, select), items add, edit, reorder, delete
- [ ] **Collection list element:** a template card repeated per item, columns per breakpoint, filter, sort, limit
- [ ] Bind any element property to a field
- [ ] CSV import
- [ ] Used for services, menu items, portfolio, testimonials, FAQs, team, events
- [ ] **Category filter chips** (portfolio-style) done with CSS where possible

### 4.5 Interactions and motion (T2)

- [ ] Hover, pressed, and focus states with transitions (3.1, J)
- [ ] Scroll-reveal presets, with stagger
- [ ] Sticky header that shrinks on scroll, scroll progress bar
- [ ] Smooth anchor scrolling, scroll spy highlight
- [ ] Carousel built on CSS scroll snap, with dots and arrows
- [ ] Tabs, accordion, lightbox, modal, drawer
- [ ] Parallax-lite using CSS scroll-driven animation where supported, with a static fallback
- [ ] Motion panel: preview all animations on the canvas, replay button
- [ ] **Budget:** the interaction script is included only when a page uses it, under 4 KB gzipped, and every animation respects `prefers-reduced-motion`
- [ ] **T3:** timeline editor, Lottie, page-level choreography

### 4.6 Media and assets (T2)

- [ ] Asset manager: folders, tags, search, replace in place, "used on" list, unused cleanup
- [ ] Image editor: crop, focal point, rotate, filters, automatic WebP and AVIF at responsive sizes
- [ ] Stock photo search (Unsplash and Pexels) with licence and attribution stored
- [ ] Icon library (about 1,000 searchable icons), shape and pattern library, gradient presets
- [ ] SVG upload with sanitising, favicon generator
- [ ] **Social share image designer:** a 1200×630 frame designed inside the same editor
- [ ] Logo upload with palette extraction
- [ ] T3: background removal through a third-party service

### 4.7 Forms and integrations (T2)

- [ ] Field types: short text, long text, email, phone, select, checkbox, radio, date
- [ ] Validation, required fields, consent checkbox, success and error states
- [ ] **Destinations:** WhatsApp message composed from the answers (no backend), email notification, webhook, in-dashboard inbox
- [ ] Spam protection: honeypot, rate limit, optional Turnstile
- [ ] T3: Google Sheets, Mailchimp, Zapier, multi-step forms, conditional fields

### 4.8 AI suite

Builds on the command bar in the earlier spec.

- [ ] **Modes:** edit selection, edit page, add section, generate page, make responsive, fix this breakpoint, write copy
- [ ] **New:** rewrite in a chosen tone, shorten or expand, translate copy, suggest a palette from a logo or photo, suggest alt text for every image, smart-rename layers, suggest SEO title and description, fix accessibility findings, "match the style of this section", "convert my desktop layout to mobile"
- [ ] **Scope chips** above the prompt: Selection, Section, Page, and the active breakpoint
- [ ] **Preview and accept** every change, one undo step, with an AI history list
- [ ] **Prompt library:** saved prompts such as "make this section feel more premium", "tighten spacing", "make buttons easier to tap"
- [ ] **Brand kit** (logo, colours, fonts, tone, banned words, business facts) sent to every AI request as context, never as instructions to override the guardrails
- [ ] Rate limits, caching, and the evaluation gate from the earlier spec apply to all new modes

### 4.9 Collaboration and client handoff (T2)

Most relevant if you build sites for clients.

- [ ] **Client edit mode:** share a link where a client can change text and images but cannot move, resize, or delete layout. Locked layers stay locked.
- [ ] **Comments:** pins on the canvas, threads, resolve, mentions, filter by breakpoint
- [ ] **Review link** with optional password, and an approval step before publishing
- [ ] Named versions ("Client v1"), restore, compare two versions
- [ ] Activity log
- [ ] Roles: owner, editor, commenter, viewer
- [ ] White-label option (remove the "Powered by" footer)
- [ ] T3: live multiplayer cursors

### 4.10 Publishing, SEO, analytics (T2)

- [ ] Custom domain (T3) and the existing short URL
- [ ] SEO panel: title, description, canonical, social card, favicon
- [ ] **Automatic structured data** (JSON-LD) generated from the page's own fields: LocalBusiness from contact and hours, Event from event details, Product from product cards
- [ ] Sitemap and robots, redirects, password protection, scheduled publish
- [ ] **Analytics** (privacy-light): views, clicks per element, scroll depth, device, country, referrer, **QR scan versus direct visit**, funnel from scan to button click, UTM builder
- [ ] Export: static site as a zip (HTML, CSS, assets) for hosting elsewhere
- [ ] T3: A/B variants, third-party pixels as an opt-in with consent

### 4.11 Quality tools (T1 for the linter, T2 for the rest)

- [ ] Linter from the earlier spec: contrast, tap targets, text size, overflow at every breakpoint, alt text, placeholder text, empty links
- [ ] Accessibility: heading order, focus order, link text quality, form labels, reduced-motion check
- [ ] Performance meter: page weight, image sizes, estimated LCP, JS bytes
- [ ] SEO checklist and broken-link check
- [ ] Spell check and find-and-replace across text
- [ ] Pre-publish checklist: errors block, warnings allow "publish anyway"

### 4.12 Editor productivity (T1 unless noted)

- [ ] Command palette (Ctrl/Cmd+/), separate from the AI bar (Ctrl/Cmd+K)
- [ ] Full shortcut set and a "?" overlay
- [ ] Copy and paste styles, paste into selection, duplicate with offset
- [ ] Group (Ctrl+G), frame selection, **wrap in stack** (Shift+A), ungroup
- [ ] Find and replace text, select all of one type
- [ ] History panel with named checkpoints, autosave status indicator
- [ ] Export frame as PNG or PDF (T2), JSON import and export, duplicate page, clipboard copy between sites with sanitising on paste (T2)

---

## 5. Engineering rule for every new property

Every control above adds to the document model, so each new style property or element prop needs all five of these before it ships:

1. The key added to `StyleSchema` or the element's prop schema, strict, with limits.
2. A **per-property serializer** in the CSS compiler (no raw strings concatenated).
3. A compiler test, including an injection attempt.
4. An inspector control that writes to the active breakpoint only, with an override dot.
5. The AI vocabulary updated so the model knows it exists, and the evaluation set gets a case for it.

Structured values only. A gradient is `{type, angle, stops[]}`, a shadow is `{x, y, blur, spread, color}`, never a CSS string. Embeds come from the allowlist by ID. Anything that needs JavaScript goes through the tiny interaction runtime, which is only included when used.

---

## 6. Priority map

| Tier | What | Why this order |
|---|---|---|
| **T1** | Section 2 fixes; full inspector (3.1); canvas transforms (3.2); layers upgrade (3.3); toolbar and tools (3.4); workspace (3.5); Compare view and per-breakpoint reorder and content overrides (3.6); shapes, columns, scroll row; tokens and text styles; linter; productivity set (4.12) | This is what makes it feel like a design tool. Without it, nothing else will |
| **T2** | Element and section breadth; components and variants; collections; interactions and states; media editor; forms (WhatsApp first); custom breakpoints; comments and client mode; SEO and JSON-LD; analytics; export | Turns it from an editor into a product people can build real sites with |
| **T3** | Custom domains, motion timeline, Lottie, A/B testing, localisation, multiplayer, third-party integrations, background removal | Each needs its own spec, and several carry cost or privacy decisions |

Rough guess: T1 alone is about 6 to 10 weeks for one developer with an agent, part-time. T2 is a further 10 to 16 weeks. These depend heavily on how clean the current editor code is.

---

## 7. Phase prompts (paste one at a time, after the Master Brief from the earlier spec)

**Phase S0: fixes**
```text
Read docs/BUILDER_SUITE.md section 2. Fix every item listed there. Add a test where practical.
Report with before and after screenshots of the inspector, the layers panel, and the canvas.
```

**Phase S1: inspector rebuild**
```text
Read docs/BUILDER_SUITE.md sections 3.1 and 5. Rebuild the inspector. Build Sections A to H and
L, and the Content tab for every existing element type. For every new property, follow the
five-step rule in section 5. Multi-select must show Mixed values and apply as one undo step.
Do not change the canvas yet.
```
*Done when:* every existing element has a populated Content tab, the Layout tab covers section 3.1 A and B, and each change writes only to the active breakpoint.

**Phase S2: canvas transforms**
```text
Read docs/BUILDER_SUITE.md section 3.2. Implement move, resize, rotate, corner radius handles,
padding and gap handles, measurements, snapping with smart guides, the selection model, and
multi-select with a shared transform box. Every gesture is one undo step. Clear all indicators
on pointer-up, Escape, and window blur. Add Playwright tests at zoom 50, 100, and 150.
```

**Phase S3: layers, toolbar, workspace, Compare view**
```text
Read docs/BUILDER_SUITE.md sections 3.3 to 3.6 and 4.12. Build the layers upgrades, the tool
group and contextual toolbar, the device and view menus, rulers and guides, the layout grid, the
page inspector, and Compare view with synced selection. Compare view must render all three
breakpoints from the same document, each in an exact-width iframe.
```

**Phase S4: tokens, styles, shapes, columns, scroll row**
```text
Read docs/BUILDER_SUITE.md sections 4.1 (T1 rows) and 4.3 (variables and styles only). Add
variables with modes, text and colour and effect styles, the shape elements, columns, sticky
container, and scroll row. Follow section 5 for every property.
```

**Phase S5 onward (T2)**
```text
Read docs/BUILDER_SUITE.md section 4. I will name one subsection per prompt (for example
"4.4 collections" or "4.7 forms"). Implement only that subsection, following section 5 and the
security rules in docs/BUILDER_SPEC.md section 10. Report what you built, what you tested, and
what you left out.
```

---

## 8. Risks to watch

- **Property sprawl.** Each new control multiplies work in the schema, compiler, inspector, AI vocabulary, and tests. Hold to the five-step rule, and refuse "just one more property" without it.
- **Editor and published page drifting apart.** Compare view and the parity test in the earlier spec are your protection. If a feature only works in the editor, it is not done.
- **JavaScript creep.** Menus, tabs, lightboxes, and scroll effects tempt you to ship a framework. Keep the interaction runtime small, optional, and measured.
- **Embeds and forms are security surface.** Allowlist embeds by ID, protect forms against spam, and never accept pasted HTML.
- **Performance of the canvas.** Many iframes in Compare view, plus overlays and snapping, can be slow. Throttle recompiling, avoid re-rendering unselected frames, and test on a mid-range laptop.

---

## 9. Out of scope (do not build)

Pen tool and vector editing, boolean operations, prototyping flows between screens, full multi-page sites and a blog CMS, e-commerce checkout, plugins and a marketplace, custom code injection on the free path, and importing from Figma. Each is its own product.
