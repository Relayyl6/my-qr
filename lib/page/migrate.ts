// lib/page/migrate.ts
import { Page, PageSchema } from "./schema";
import { PALETTES, LIMITS, PaletteKey, PageTemplate } from "./config";
import { LandingPageSpec, LandingBlock } from "@/lib/landing/types";

function truncateWords(str: string, maxWords: number): string {
  const parts = str.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= maxWords) return str.trim();
  return parts.slice(0, maxWords).join(" ");
}

/**
 * Maps arbitrary legacy hex colors to the closest curated WCAG AA palette
 */
function matchClosestPalette(bg?: string, primary?: string): PaletteKey {
  const lowerBg = (bg || "").toLowerCase();
  const lowerPrim = (primary || "").toLowerCase();

  if (lowerBg.includes("#0f") || lowerBg.includes("#1") || lowerBg.includes("#2") || lowerPrim.includes("#38b")) {
    return "ink";
  }
  if (lowerBg.includes("#faf") || lowerBg.includes("#fbf") || lowerBg.includes("#f7") || lowerPrim.includes("#b45")) {
    return "sand";
  }
  if (lowerBg.includes("#f3") || lowerPrim.includes("#059669") || lowerPrim.includes("#15803d") || lowerPrim.includes("#10b981")) {
    return "forest";
  }
  if (lowerBg.includes("#fdf") || lowerPrim.includes("#c2410c") || lowerPrim.includes("#ea580c")) {
    return "clay";
  }
  if (lowerBg.includes("#f0f") || lowerPrim.includes("#0284c7") || lowerPrim.includes("#3b82f6")) {
    return "sky";
  }
  return "mono";
}

/**
 * Checks if an object is already adhering to the new flat Page schema
 */
export function isPageSchema(obj: any): obj is Page {
  return (
    obj &&
    typeof obj === "object" &&
    obj.schemaVersion === 1 &&
    typeof obj.brand === "object" &&
    typeof obj.cta === "object"
  );
}

/**
 * Converts legacy block-based LandingPageSpec into the unified flat Page schema
 */
export function migrateLegacySpec(
  rawSpec: any,
  fallbackDestinationUrl: string = "https://example.com"
): Page {
  // If already in Page format, validate and return
  if (isPageSchema(rawSpec)) {
    const parseRes = PageSchema.safeParse(rawSpec);
    if (parseRes.success) {
      return parseRes.data;
    }
  }

  const legacy = rawSpec as Partial<LandingPageSpec>;
  const blocks: LandingBlock[] = Array.isArray(legacy.blocks) ? legacy.blocks : [];

  // 1. Extract hero block
  const heroBlock = blocks.find((b): b is Extract<LandingBlock, { type: "hero" }> => b.type === "hero");
  const businessName = (heroBlock?.title || legacy.businessName || "My Business").slice(0, 60);
  const headline = truncateWords(heroBlock?.title || legacy.businessName || "Welcome", LIMITS.headlineWords);
  const tagline = truncateWords(heroBlock?.subtitle || legacy.bio || "", LIMITS.taglineWords);
  const logoUrl = heroBlock?.avatarUrl && heroBlock.avatarUrl.startsWith("http") ? heroBlock.avatarUrl : undefined;

  // 2. Extract links block & primary CTA
  const linkListBlock = blocks.find((b): b is Extract<LandingBlock, { type: "linkList" }> => b.type === "linkList");
  const rawItems = linkListBlock?.items || [];

  // Pick highlighted link or first item as CTA; fallback to destination URL
  const primaryItem = rawItems.find((i) => i.highlight) || rawItems[0];
  const ctaLabel = truncateWords(primaryItem?.title || "Visit Website", LIMITS.ctaWords);
  const ctaUrl = primaryItem?.url && primaryItem.url.startsWith("http") ? primaryItem.url : fallbackDestinationUrl;

  // Remaining items become links (max 4)
  const remainingItems = primaryItem ? rawItems.filter((i) => i !== primaryItem) : rawItems;
  const links = remainingItems
    .filter((i) => i.url && (i.url.startsWith("http://") || i.url.startsWith("https://")))
    .slice(0, LIMITS.links)
    .map((i) => ({
      label: truncateWords(i.title || "Link", 6),
      url: i.url,
    }));

  // 3. Extract menu items into services (max 6)
  const menuBlock = blocks.find((b): b is Extract<LandingBlock, { type: "menu" }> => b.type === "menu");
  const services = (menuBlock?.items || []).slice(0, LIMITS.services).map((m) => ({
    name: m.name.slice(0, 80),
    price: m.price ? m.price.slice(0, 40) : "",
    desc: m.description ? truncateWords(m.description, LIMITS.serviceDescWords) : "",
  }));

  // 4. Extract contact block
  const contactBlock = blocks.find((b): b is Extract<LandingBlock, { type: "contact" }> => b.type === "contact");
  const contact = {
    phone: (contactBlock?.phone || "").slice(0, 30),
    email: contactBlock?.email && contactBlock.email.includes("@") ? contactBlock.email : "",
    address: (contactBlock?.address || "").slice(0, 160),
    whatsapp: "",
    instagram: (contactBlock?.instagram || "").slice(0, 40),
  };

  // Determine template: if menu items exist, default to restaurant; otherwise creator
  const template: PageTemplate = services.length > 0 ? "restaurant" : "creator";
  const palette = matchClosestPalette(legacy.theme?.backgroundColor, legacy.theme?.primaryColor);

  const rawPage = {
    schemaVersion: 1 as const,
    template,
    brand: {
      name: businessName,
      headline,
      tagline,
      logoUrl,
      palette,
    },
    cta: {
      label: ctaLabel,
      url: ctaUrl,
    },
    links,
    services,
    contact,
  };

  return PageSchema.parse(rawPage);
}
