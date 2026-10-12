import { z } from "zod";
import { registerPrompt, PromptDefinition } from "./index";
import { landingPageSpecSchema, LandingPageSpec } from "@/lib/landing/types";

export interface LandingPageBuilderInput {
  prompt: string;
  businessName?: string;
  destinationUrl?: string;
}

export const prompt: PromptDefinition<LandingPageBuilderInput, LandingPageSpec> = {
  version: "v1",
  model: "gemini-flash-lite-latest",
  temperature: 0.3,
  cacheTtlSeconds: 86400,
  system: `You are an elite responsive web designer and copywriter for DynamicQR.
Turn plain-English business descriptions into high-converting, fully-responsive micro showcase landing pages optimized for Mobile (phones), Tablet (iPads), and Desktop (widescreen PCs).
Include:
1. An engaging Hero block (with title, descriptive subtitle/bio, and badge).
2. A LinkList block with 2-4 relevant buttons (Order, Booking, Main Website, Portfolio).
3. If relevant (food/restaurant/service/events), a Menu block with 2-4 items, descriptions, and prices.
4. A Contact block with social handles, email, address, or phone.
5. A cohesive, tasteful theme palette (hex codes).`,
  buildUserPrompt: (input) => `
Business Name / Context: ${input.businessName || "Mobile Landing"}
User Prompt: "${input.prompt}"
Primary Destination URL: ${input.destinationUrl || "https://example.com"}

Generate the complete structured landing page specification.
CRITICAL RULE: The primary call-to-action button in the LinkList block MUST have its "url" set to "${input.destinationUrl || "https://example.com"}" so customers arrive at the owner's actual destination website.
`,
  schema: landingPageSpecSchema,
  fallback: (input) => {
    const name = input.businessName || "My Showcase";
    const mainUrl = input.destinationUrl || "https://example.com";
    return {
      businessName: name,
      bio: "Welcome to our official mobile destination.",
      theme: {
        primaryColor: "#11140F",
        accentColor: "#059669",
        backgroundColor: "#F9FAFB",
        textColor: "#11140F",
        cardBg: "#FFFFFF",
      },
      blocks: [
        {
          type: "hero",
          title: name,
          subtitle: "Discover our latest services, offers, and links below.",
          badgeText: "Welcome",
        },
        {
          type: "linkList",
          title: "Quick Links",
          items: [
            {
              title: "Visit Main Website",
              url: mainUrl,
              subtitle: "Explore our full catalog & company info",
              highlight: true,
            },
            {
              title: "Book an Appointment",
              url: "https://calendly.com",
              subtitle: "Schedule a chat or reservation",
              highlight: false,
            },
          ],
        },
        {
          type: "contact",
          title: "Connect with Us",
          email: "hello@example.com",
          instagram: "@ourbusiness",
        },
      ],
    };
  },
};

registerPrompt("landing-page-builder.v1", prompt);
