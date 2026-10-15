import { z } from "zod";
import { registerPrompt, PromptDefinition } from "./index";

export const qrStyleSpecSchema = z.object({
  fgColor: z.string().describe("Hex color for QR modules (e.g. #0F172A)"),
  bgColor: z.string().describe("Hex color for QR background (e.g. #F8FAFC)"),
  accentColor: z.string().describe("Hex accent for finder patterns (e.g. #059669)"),
  cornerDotColor: z.string().describe("Hex color for corner center squares"),
  gradientType: z.enum(["none", "linear", "radial"]).default("linear"),
  gradientColors: z.array(z.string()).describe("2-3 colors for gradient backdrop"),
  artisticStyle: z.string().describe("Aesthetic classification (e.g. Brutalist, Cyberpunk, Luxury, Woodblock)"),
  errorCorrectionLevel: z.literal("H").default("H"),
});

export type QrStyleSpec = z.infer<typeof qrStyleSpecSchema>;

export const prompt: PromptDefinition<{ prompt: string }, QrStyleSpec> = {
  version: "v1",
  model: "gemini-3.8-flash",
  temperature: 0.4,
  cacheTtlSeconds: 86400,
  system: `You are an elite creative director and computational visual designer.
Translate artistic style prompts into high-contrast, scannable QR code visual palettes.
CRITICAL CONSTRAINTS:
1. Always ensure high contrast (luminance delta) between fgColor and bgColor so mobile phone cameras can effortlessly read the QR code.
2. For gradientColors, choose 2 rich, vibrant, saturated colors that visibly pop (e.g., Electric Indigo #4338CA to Radiant Cyan #06B6D4 for Cyberpunk; Rich Bronze #78350F to Radiant Gold #D97706 for Luxury; Deep Crimson #9F1239 to Radiant Tangerine #EA580C for Sunset). Never use muddy black or dim greys for gradientColors.
3. Always set errorCorrectionLevel to 'H'.`,
  buildUserPrompt: (input) => `
Artistic Prompt: "${input.prompt}"

Generate the precise QR visual specification with high-contrast colors, vibrant gradient pairs, and stylistic flair.
`,
  schema: qrStyleSpecSchema,
  fallback: (input) => {
    const p = input.prompt.toLowerCase();
    if (p.includes("cyberpunk") || p.includes("neon") || p.includes("electric") || p.includes("indigo") || p.includes("cyan")) {
      return {
        fgColor: "#06B6D4",
        bgColor: "#05050A",
        accentColor: "#38BDF8",
        cornerDotColor: "#818CF8",
        gradientType: "linear",
        gradientColors: ["#4338CA", "#06B6D4"],
        artisticStyle: "Cyberpunk Neon",
        errorCorrectionLevel: "H",
      };
    }
    if (p.includes("emerald") || p.includes("green") || p.includes("nature") || p.includes("botanical")) {
      return {
        fgColor: "#059669",
        bgColor: "#F0FDF4",
        accentColor: "#10B981",
        cornerDotColor: "#047857",
        gradientType: "linear",
        gradientColors: ["#064E3B", "#059669"],
        artisticStyle: "Emerald Botanical",
        errorCorrectionLevel: "H",
      };
    }
    if (p.includes("gold") || p.includes("luxury") || p.includes("vip") || p.includes("amber")) {
      return {
        fgColor: "#D97706",
        bgColor: "#FFFBEB",
        accentColor: "#F59E0B",
        cornerDotColor: "#B45309",
        gradientType: "linear",
        gradientColors: ["#78350F", "#D97706"],
        artisticStyle: "Warm Gold Foil",
        errorCorrectionLevel: "H",
      };
    }
    if (p.includes("sunset") || p.includes("ember") || p.includes("crimson") || p.includes("orange")) {
      return {
        fgColor: "#EA580C",
        bgColor: "#FFF1F2",
        accentColor: "#F97316",
        cornerDotColor: "#BE123C",
        gradientType: "linear",
        gradientColors: ["#9F1239", "#EA580C"],
        artisticStyle: "Sunset Ember",
        errorCorrectionLevel: "H",
      };
    }
    if (p.includes("ocean") || p.includes("sapphire") || p.includes("blue") || p.includes("water")) {
      return {
        fgColor: "#0284C7",
        bgColor: "#F0F9FF",
        accentColor: "#38BDF8",
        cornerDotColor: "#1D4ED8",
        gradientType: "linear",
        gradientColors: ["#1E3A8A", "#0284C7"],
        artisticStyle: "Oceanic Sapphire",
        errorCorrectionLevel: "H",
      };
    }
    return {
      fgColor: "#18181B",
      bgColor: "#FFFFFF",
      accentColor: "#E11D48",
      cornerDotColor: "#BE123C",
      gradientType: "linear",
      gradientColors: ["#09090B", "#3F3F46"],
      artisticStyle: "Swiss Minimalist",
      errorCorrectionLevel: "H",
    };
  },
};

registerPrompt("qr-artist.v1", prompt);
