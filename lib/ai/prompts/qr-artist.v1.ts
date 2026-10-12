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
  model: "gemini-flash-lite-latest",
  temperature: 0.4,
  cacheTtlSeconds: 86400,
  system: `You are an elite creative director and computational visual designer.
Translate artistic style prompts into high-contrast, scannable QR code visual palettes.
CRITICAL CONSTRAINT: Always ensure high contrast (luminance delta) between fgColor and bgColor so mobile phone cameras can effortlessly read the QR code.
Never generate low-contrast combinations like grey on white or light-yellow on white.
Always set errorCorrectionLevel to 'H'.`,
  buildUserPrompt: (input) => `
Artistic Prompt: "${input.prompt}"

Generate the precise QR visual specification with high-contrast colors and stylistic flair.
`,
  schema: qrStyleSpecSchema,
  fallback: (input) => {
    const p = input.prompt.toLowerCase();
    if (p.includes("emerald") || p.includes("green") || p.includes("nature")) {
      return {
        fgColor: "#064E3B",
        bgColor: "#F0FDF4",
        accentColor: "#059669",
        cornerDotColor: "#047857",
        gradientType: "linear",
        gradientColors: ["#ECFDF5", "#D1FAE5"],
        artisticStyle: "Emerald Botanical",
        errorCorrectionLevel: "H",
      };
    }
    if (p.includes("gold") || p.includes("luxury") || p.includes("vip")) {
      return {
        fgColor: "#1A1714",
        bgColor: "#FDFBF7",
        accentColor: "#B8842E",
        cornerDotColor: "#94681E",
        gradientType: "linear",
        gradientColors: ["#FAF7F2", "#F5EFE6"],
        artisticStyle: "Luxury Gold",
        errorCorrectionLevel: "H",
      };
    }
    return {
      fgColor: "#0F172A",
      bgColor: "#F8FAFC",
      accentColor: "#3B82F6",
      cornerDotColor: "#1D4ED8",
      gradientType: "linear",
      gradientColors: ["#F1F5F9", "#E2E8F0"],
      artisticStyle: "Modern Architectural",
      errorCorrectionLevel: "H",
    };
  },
};

registerPrompt("qr-artist.v1", prompt);
