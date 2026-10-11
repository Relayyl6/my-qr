import { z } from "zod";

export const themeSchema = z.object({
  primaryColor: z.string().default("#11140F"),
  accentColor: z.string().default("#059669"),
  backgroundColor: z.string().default("#FAFAFA"),
  textColor: z.string().default("#11140F"),
  cardBg: z.string().default("#FFFFFF"),
});

export const heroBlockSchema = z.object({
  type: z.literal("hero"),
  title: z.string(),
  subtitle: z.string().optional(),
  avatarUrl: z.string().optional(),
  badgeText: z.string().optional(),
});

export const linkItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  subtitle: z.string().optional(),
  highlight: z.boolean().default(false),
});

export const linkListBlockSchema = z.object({
  type: z.literal("linkList"),
  title: z.string().optional(),
  items: z.array(linkItemSchema),
});

export const menuItemSchema = z.object({
  name: z.string(),
  price: z.string(),
  description: z.string().optional(),
});

export const menuBlockSchema = z.object({
  type: z.literal("menu"),
  title: z.string(),
  items: z.array(menuItemSchema),
});

export const contactBlockSchema = z.object({
  type: z.literal("contact"),
  title: z.string().default("Get in Touch"),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  mapUrl: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
});

export const landingBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  linkListBlockSchema,
  menuBlockSchema,
  contactBlockSchema,
]);

export type LandingBlock = z.infer<typeof landingBlockSchema>;
export type LandingTheme = z.infer<typeof themeSchema>;

export const landingPageSpecSchema = z.object({
  businessName: z.string(),
  bio: z.string().optional(),
  theme: themeSchema,
  blocks: z.array(landingBlockSchema),
});

export type LandingPageSpec = z.infer<typeof landingPageSpecSchema>;
