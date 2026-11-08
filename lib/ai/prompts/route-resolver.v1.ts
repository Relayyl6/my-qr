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
  model: "gemini-3.8-flash",
  temperature: 0.1,
  cacheTtlSeconds: 86400,
  system: `You are an elite traffic engineer and routing compiler for DynamicQR.
Translate natural-language redirect requirements into strict conditional routing rules.
Rules can match:
- schedule: daysOfWeek ([0..6] where 0=Sun, 1=Mon, ..., 6=Sat), startTime ("HH:mm"), endTime ("HH:mm"), timezone (default "UTC")
- device: 'ios' | 'android' | 'desktop'
- country: 2-letter uppercase ISO code (e.g. US, NG, GB)
- timeRange: startHour and endHour (0-23 in UTC)
- language: 2-letter code (e.g. en, es, fr)
- referrer: substring (e.g. instagram, tiktok)

Special Focus on Non-Technical & Everyday Language:
- Users frequently speak in informal, everyday, simple, or broken English, Nigerian Pidgin, shorthand, or casual speech.
- Examples:
  * "morning breakfast, night dinner"
  * "weekdays go website, weekend whatsapp"
  * "from 9 to 5 store catalog, after 6 flash deal"
  * "make morning go my menu, night time make e go whatsapp"
  * "iphone people app store, android play store"
- Graciously interpret their intention:
  * "morning" or "breakfast": 08:00 - 12:00
  * "afternoon" or "lunch": 12:00 - 17:00
  * "cocktails" or "happy hour": 15:00 - 19:00
  * "evening" or "dinner" or "night": 19:00 - 23:59
  * "weekdays" or "work days" or "monday to friday": daysOfWeek [1, 2, 3, 4, 5]
  * "weekends" or "saturday and sunday": daysOfWeek [0, 6]
  * "sundays": daysOfWeek [0]
  * "whatsapp": if phone number provided (e.g. 080... or +234...), format as https://wa.me/NUMBER, otherwise https://wa.me
  * "instagram": https://instagram.com
- Assign logical priority numbers (e.g. 15-20 for schedule slots, 10 for device rules).
- Ensure every rule has a valid destination URL (http/https). If user omitted URL for a slot, generate a clean, sensible destination URL (e.g. default-destination/breakfast or https://example.com/breakfast-menu).
- Write a warm, friendly, plain-English explanation summarizing what rules were created so anyone can understand!`,
  buildUserPrompt: (input) => `
Default Destination URL: ${input.defaultDestination}
User Routing Request: "${input.naturalLanguagePrompt}"

Compile this request into structured routing rules.
`,
  schema: routeResolverOutputSchema,
  fallback: (input) => {
    const text = input.naturalLanguagePrompt.toLowerCase();
    const rules: CompiledRule[] = [];

    // 1. Breakfast / Morning Schedule Slot
    if (text.includes("breakfast") || text.includes("morning") || text.includes("8:00") || text.includes("9:00") || text.includes("08:00")) {
      rules.push({
        priority: 16,
        label: "Morning Breakfast & Coffee (08:00 – 12:00)",
        destination: "https://example.com/breakfast-menu",
        conditions: [
          {
            type: "schedule",
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: "08:00",
            endTime: "12:00",
            timezone: "UTC",
          },
        ],
      });
    }

    // 2. Lunch / Afternoon Schedule Slot
    if (text.includes("lunch") || text.includes("afternoon") || text.includes("11:00") || (text.includes("11") && text.includes("15"))) {
      rules.push({
        priority: 15,
        label: "Lunch Specials (11:00 – 15:00)",
        destination: "https://example.com/lunch-menu",
        conditions: [
          {
            type: "schedule",
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "11:00",
            endTime: "15:00",
            timezone: "UTC",
          },
        ],
      });
    }

    // 3. Cocktail Hour / Evening Social
    if (text.includes("cocktail") || text.includes("happy hour") || (text.includes("15") && text.includes("19"))) {
      rules.push({
        priority: 14,
        label: "Cocktail Hour (15:00 – 19:00)",
        destination: "https://example.com/cocktails",
        conditions: [
          {
            type: "schedule",
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: "15:00",
            endTime: "19:00",
            timezone: "UTC",
          },
        ],
      });
    }

    // 4. Dinner / Night / Tasting Slot
    if (text.includes("dinner") || text.includes("tasting") || text.includes("night") || text.includes("close") || text.includes("evening")) {
      rules.push({
        priority: 13,
        label: "Chef Tasting & Dinner (19:00 – Close)",
        destination: "https://example.com/dinner-tasting",
        conditions: [
          {
            type: "schedule",
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: "19:00",
            endTime: "23:59",
            timezone: "UTC",
          },
        ],
      });
    }

    // 5. Weekday vs Weekend Routing
    if (text.includes("weekday") || text.includes("work day") || text.includes("monday to friday")) {
      rules.push({
        priority: 12,
        label: "Weekday Operations (Mon–Fri)",
        destination: input.defaultDestination,
        conditions: [
          {
            type: "schedule",
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "09:00",
            endTime: "18:00",
            timezone: "UTC",
          },
        ],
      });
    }

    if (text.includes("weekend") || text.includes("saturday") || text.includes("sunday")) {
      const isWhatsApp = text.includes("whatsapp") || text.includes("wa.me") || text.includes("chat");
      rules.push({
        priority: 12,
        label: isWhatsApp ? "Weekend VIP WhatsApp Support" : "Weekend Special Event",
        destination: isWhatsApp ? "https://wa.me" : "https://instagram.com",
        conditions: [
          {
            type: "schedule",
            daysOfWeek: [0, 6],
            startTime: "00:00",
            endTime: "23:59",
            timezone: "UTC",
          },
        ],
      });
    }

    // 6. Device Routing: Apple iPhone / iOS
    if (text.includes("iphone") || text.includes("ios") || text.includes("app store") || text.includes("apple")) {
      rules.push({
        priority: 10,
        label: "iOS / iPhone Visitors",
        destination: "https://apps.apple.com",
        conditions: [{ type: "device", value: "ios" }],
      });
    }

    // 7. Device Routing: Android / Play Store
    if (text.includes("android") || text.includes("google play") || text.includes("play store") || text.includes("samsung")) {
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
          ? `✨ Perfectly understood! Generated ${rules.length} simple schedule & routing rule(s) matching your request.`
          : "Standard default routing maintained. You can describe your schedule in simple words or choose an industry preset.",
      confidence: rules.length > 0 ? 0.95 : 0.6,
    };
  },
};

registerPrompt("route-resolver.v1", prompt);
