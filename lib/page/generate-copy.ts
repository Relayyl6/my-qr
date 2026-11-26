// lib/page/generate-copy.ts
import { createHash } from "crypto";
import { AiCopySchema, type AiCopy } from "./schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { LIVE_TEMPLATES, LivePageTemplate } from "./config";

export type GenerateInput = {
  name: string;
  description: string;
  items?: string;
  contact?: string;
  destinationUrl: string; // owner's URL, injected by code, never sent to the model
};

export type GenerateResult =
  | { ok: true; copy: AiCopy; source: "ai" | "cache" }
  | { ok: false; reason: "rate_limited" | "model_failed" | "invalid_output"; errors?: string[] };

export type ModelCall = (system: string, user: string) => Promise<string>;

export interface CopyCache {
  get(k: string): Promise<AiCopy | null>;
  set(k: string, v: AiCopy): Promise<void>;
}

// In-memory process fallback cache
const memoryCache = new Map<string, AiCopy>();
export const defaultMemoryCache: CopyCache = {
  get: async (k: string) => memoryCache.get(k) || null,
  set: async (k: string, v: AiCopy) => {
    memoryCache.set(k, v);
  },
};

// Remove any price, phone, or address the model produced that the input never contained.
export function stripInventedFacts(copy: AiCopy, input: GenerateInput): AiCopy {
  const source = [input.description, input.items, input.contact].filter(Boolean).join(" ").toLowerCase();
  
  return {
    ...copy,
    services: copy.services.map((s) => {
      const priceFound = s.price === "" || source.includes(s.price.toLowerCase());
      return { ...s, price: priceFound ? s.price : "" };
    }),
  };
}

export async function generateCopy(
  input: GenerateInput,
  call: ModelCall,
  cache: CopyCache = defaultMemoryCache,
  opts = { maxAttempts: 2 }
): Promise<GenerateResult> {
  const key = createHash("sha256")
    .update(
      JSON.stringify([
        input.name,
        input.description,
        input.items,
        input.contact,
        LIVE_TEMPLATES,
      ])
    )
    .digest("hex");

  const hit = await cache.get(key);
  if (hit) return { ok: true, copy: hit, source: "cache" };

  let errors: string[] = [];
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    const user =
      buildUserPrompt(input) +
      (errors.length ? `\n\nFix these errors and return JSON only:\n${errors.join("\n")}` : "");

    let raw: string;
    try {
      raw = await call(SYSTEM_PROMPT, user);
    } catch {
      return { ok: false, reason: "model_failed" };
    }

    let parsed: unknown;
    try {
      // Strip markdown code fences if model enclosed them
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      errors = ["Output was not valid JSON."];
      continue;
    }

    const result = AiCopySchema.safeParse(parsed);
    if (!result.success) {
      errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      continue;
    }

    // Constrain to live templates only.
    const isLive = LIVE_TEMPLATES.includes(result.data.template as LivePageTemplate);
    const template: LivePageTemplate = isLive ? (result.data.template as LivePageTemplate) : "creator";
    const copy = stripInventedFacts({ ...result.data, template }, input);

    await cache.set(key, copy);
    return { ok: true, copy, source: "ai" };
  }

  return { ok: false, reason: "invalid_output", errors };
}
