import { z } from "zod";
import { registerPrompt, PromptDefinition } from "./index";
import { compiledRuleSchema, CompiledRule } from "@/lib/routing/types";

export interface RouteResolverInput {
  naturalLanguagePrompt: string;
  defaultDestination: string;
}

export const routeResolverOutputSchema = z.object({
  rules: z.array(compiledRuleSchema).describe("Compiled conditional routing rules"),
  explanation: z.string().describe("Clear summary of routing logic applied"),
  confidence: z.number().min(0).max(1),
});

export type RouteResolverOutput = z.infer<typeof routeResolverOutputSchema>;

export const prompt: PromptDefinition<RouteResolverInput, RouteResolverOutput> = {
  version: "v1",
  model: "gemini-flash-lite-latest",
  temperature: 0.1,
  cacheTtlSeconds: 86400,
  system: `You are an elite traffic engineer and routing compiler for DynamicQR.
Translate natural-language redirect requirements into strict conditional routing rules.
Rules can match:
- device: 'ios' | 'android' | 'desktop'
- country: 2-letter uppercase ISO code (e.g. US, NG, GB)
- timeRange: startHour and endHour (0-23 in UTC)
- language: 2-letter code (e.g. en, es, fr)
- referrer: substring (e.g. instagram, tiktok)

Assign logical priority numbers (e.g. 10 for specific device/time, 5 for generic device).
Ensure every rule has a valid destination URL (http/https). If the user mentioned a target without full protocol, prepend https://.`,
  buildUserPrompt: (input) => `
Default Destination URL: ${input.defaultDestination}
User Routing Request: "${input.naturalLanguagePrompt}"

Compile this request into structured routing rules.
`,
  schema: routeResolverOutputSchema,
  fallback: (input) => {
    const text = input.naturalLanguagePrompt.toLowerCase();
    const rules: CompiledRule[] = [];

    if (text.includes("iphone") || text.includes("ios") || text.includes("app store")) {
      rules.push({
        priority: 10,
        label: "iOS / iPhone Visitors",
        destination: "https://apps.apple.com",
        conditions: [{ type: "device", value: "ios" }],
      });
    }

    if (text.includes("android") || text.includes("google play") || text.includes("play store")) {
      rules.push({
        priority: 10,
        label: "Android Visitors",
        destination: "https://play.google.com/store",
        conditions: [{ type: "device", value: "android" }],
      });
    }

    return {
      rules,
      explanation:
        rules.length > 0
          ? `Generated ${rules.length} platform-specific redirect rule(s) based on your intent.`
          : "Standard default routing maintained. You can configure rules manually or provide specific destinations.",
      confidence: rules.length > 0 ? 0.9 : 0.6,
    };
  },
};

registerPrompt("route-resolver.v1", prompt);
