// lib/page/config.ts
export const TEMPLATES = ["creator", "restaurant", "service", "event", "product", "portfolio"] as const;
export type PageTemplate = typeof TEMPLATES[number];

export const LIVE_TEMPLATES = ["creator", "restaurant"] as const; // v1 templates; flip more on as built
export type LivePageTemplate = typeof LIVE_TEMPLATES[number];

export const PALETTES = {
  ink:    { label: "Ink",    bg: "#0F172A", fg: "#F8FAFC", accent: "#38BDF8", cardBg: "#1E293B", border: "#334155" },
  sand:   { label: "Sand",   bg: "#FBF7F0", fg: "#1C1917", accent: "#B45309", cardBg: "#FFFFFF", border: "#E7E2D8" },
  forest: { label: "Forest", bg: "#F3F7F4", fg: "#14532D", accent: "#15803D", cardBg: "#FFFFFF", border: "#DCFCE7" },
  clay:   { label: "Clay",   bg: "#FDF2EE", fg: "#431407", accent: "#C2410C", cardBg: "#FFFFFF", border: "#FFEDD5" },
  sky:    { label: "Sky",    bg: "#F0F9FF", fg: "#0C4A6E", accent: "#0284C7", cardBg: "#FFFFFF", border: "#E0F2FE" },
  mono:   { label: "Mono",   bg: "#FFFFFF", fg: "#111111", accent: "#111111", cardBg: "#F9FAFB", border: "#E5E7EB" },
} as const;
export type PaletteKey = keyof typeof PALETTES;

export const LIMITS = {
  links: 4,
  services: 6,
  headlineWords: 5,
  taglineWords: 14,
  ctaWords: 4,
  serviceDescWords: 12,
} as const;
