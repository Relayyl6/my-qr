import { z } from "zod";
import { registerPrompt, PromptDefinition } from "./index";

export interface UrlEnricherInput {
  url: string;
  title: string;
  description: string;
}

export const urlEnricherSchema = z.object({
  shortCode: z
    .string()
    .describe(
      "A concise, memorable, lowercase kebab-case slug (e.g. 'summer-menu', 'sarah-portfolio', 'acme-pricing', 4-18 chars) without punctuation or spaces"
    ),
  label: z
    .string()
    .describe("Clean, professional human-readable title or campaign name"),
  category: z
    .string()
    .describe("Single high-level category (e.g. Portfolio, Commerce, Event, Restaurant, Social, SaaS, Docs)"),
  suggestedTags: z
    .array(z.string())
    .describe("2 to 4 short descriptive tags"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Model confidence score between 0.0 and 1.0"),
});

export type UrlEnricherOutput = z.infer<typeof urlEnricherSchema>;

function cleanSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
}

export const prompt: PromptDefinition<UrlEnricherInput, UrlEnricherOutput> = {
  version: "v1",
  model: "gpt-4o-mini",
  temperature: 0.2,
  cacheTtlSeconds: 86400, // Cache identical URLs for 24h
  system: `You are an elite marketing strategist and metadata analyst for DynamicQR.
Analyze the target URL, page title, and meta description to produce an optimal QR code label and a clean, branded, memorable shortcode slug.
Always follow these rules:
1. shortCode must be lowercase, alphanumeric and hyphens only, 4 to 18 characters (e.g., 'spring-sale', 'dr-smith-cv').
2. label should be clean and readable for flyers and business cards.
3. category should be one concise noun.`,
  buildUserPrompt: (input) => `
Target URL: ${input.url}
Page Title: ${input.title}
Page Description: ${input.description}

Generate the optimal shortCode, label, category, tags, and confidence score.
`,
  schema: urlEnricherSchema,
  fallback: (input) => {
    let base = "link";
    try {
      const u = new URL(input.url);
      const hostPart = u.hostname.replace(/^(www\.)/, "").split(".")[0];
      const pathPart = u.pathname.replace(/^\/|\/$/g, "").split("/").pop();
      base = cleanSlug(pathPart || hostPart || "qr");
    } catch {
      base = "qr-code";
    }

    if (base.length < 3) base = `qr-${base}`;

    return {
      shortCode: base.slice(0, 16),
      label: input.title ? input.title.slice(0, 40) : "Destination Link",
      category: "General",
      suggestedTags: ["qr", "link"],
      confidence: 0.8,
    };
  },
};

// Register in the central prompt registry
registerPrompt("url-enricher.v1", prompt);
registerPrompt("shortcode-generator.v1", prompt);
