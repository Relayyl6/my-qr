// lib/page/schema.ts
import { z } from "zod";
import { TEMPLATES, PALETTES, LIMITS } from "./config";

const https = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://") || u.startsWith("http://"), "must be a valid URL");

const words = (max: number) => (s: string) =>
  s.trim().split(/\s+/).filter(Boolean).length <= max;

export const PageSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  template: z.enum(TEMPLATES),
  brand: z.object({
    name: z.string().min(1).max(60),
    headline: z
      .string()
      .max(120)
      .refine(words(LIMITS.headlineWords), `headline must be ${LIMITS.headlineWords} words max`),
    tagline: z
      .string()
      .max(200)
      .refine(words(LIMITS.taglineWords), `tagline must be ${LIMITS.taglineWords} words max`)
      .default(""),
    logoUrl: https.optional(),
    palette: z.enum(Object.keys(PALETTES) as [keyof typeof PALETTES, ...(keyof typeof PALETTES)[]]),
  }),
  cta: z.object({
    label: z
      .string()
      .min(1)
      .max(40)
      .refine(words(LIMITS.ctaWords), `CTA label must be ${LIMITS.ctaWords} words max`),
    url: https, // overwritten by code after AI generation
  }),
  links: z
    .array(
      z.object({
        label: z.string().min(1).max(60),
        url: https,
      })
    )
    .max(LIMITS.links)
    .default([]),
  services: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        price: z.string().max(40).default(""),
        desc: z
          .string()
          .max(200)
          .refine(words(LIMITS.serviceDescWords), `description must be ${LIMITS.serviceDescWords} words max`)
          .default(""),
      })
    )
    .max(LIMITS.services)
    .default([]),
  contact: z
    .object({
      phone: z.string().max(30).default(""),
      email: z.string().email().or(z.literal("")).default(""),
      address: z.string().max(160).default(""),
      whatsapp: z.string().max(30).default(""),
      instagram: z.string().max(40).default(""),
    })
    .default({}),
});

export type Page = z.infer<typeof PageSchema>;

// Schema for what the AI returns: copy fields only, no URLs, no contact, no palette.
export const AiCopySchema = z.object({
  template: z.enum(TEMPLATES),
  headline: z.string().max(120).refine(words(LIMITS.headlineWords), `headline exceeds ${LIMITS.headlineWords} words`),
  tagline: z.string().max(200).refine(words(LIMITS.taglineWords), `tagline exceeds ${LIMITS.taglineWords} words`).default(""),
  ctaLabel: z.string().max(40).refine(words(LIMITS.ctaWords), `ctaLabel exceeds ${LIMITS.ctaWords} words`),
  services: z
    .array(
      z.object({
        name: z.string().max(80),
        price: z.string().max(40).default(""),
        desc: z.string().max(200).refine(words(LIMITS.serviceDescWords), `service description exceeds ${LIMITS.serviceDescWords} words`).default(""),
      })
    )
    .max(LIMITS.services)
    .default([]),
});

export type AiCopy = z.infer<typeof AiCopySchema>;
