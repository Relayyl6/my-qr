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
  model: "gemini-3.8-flash",
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
    const rawPrompt = (input.prompt || "").toLowerCase();
    const mainUrl = input.destinationUrl || "https://example.com";

    // 1. Artisanal, Handcrafted, Studio & Boutique Showcase
    if (
      rawPrompt.includes("artisanal") ||
      rawPrompt.includes("craft") ||
      rawPrompt.includes("ceramics") ||
      rawPrompt.includes("pottery") ||
      rawPrompt.includes("boutique") ||
      rawPrompt.includes("handmade")
    ) {
      return {
        businessName: "The Artisanal Studio & Workshop",
        bio: "Handcrafted small-batch goods, custom creations, and intimate seasonal studio workshops.",
        theme: {
          primaryColor: "#2B1E16",
          accentColor: "#C25E34",
          backgroundColor: "#FAF7F2",
          textColor: "#1C1917",
          cardBg: "#FFFFFF",
        },
        blocks: [
          {
            type: "hero",
            title: "The Artisanal Studio",
            subtitle: "Handcrafted ceramics, limited small-batch creations, and seasonal studio workshops.",
            badgeText: "Artisanal Craft",
          },
          {
            type: "linkList",
            title: "Featured Actions & Online Store",
            items: [
              {
                title: "Explore Core Website & Catalog",
                url: mainUrl,
                subtitle: "Browse our complete collection of handmade goods",
                highlight: true,
              },
              {
                title: "Book Studio Workshop & Specials",
                url: "https://calendly.com",
                subtitle: "Reserve an intimate weekend pottery & craft session",
                highlight: false,
              },
              {
                title: "Follow Our Instagram Gallery",
                url: "https://instagram.com/artisanal.studio",
                subtitle: "Behind-the-scenes firing, studio updates & new drops",
                highlight: false,
              },
            ],
          },
          {
            type: "menu",
            title: "Studio Specials & Experiences",
            items: [
              {
                name: "Intimate Wheel-Throwing Workshop (2h)",
                price: "$85",
                description: "Includes raw stoneware clay, pottery wheel instruction, and 2 glazed pieces fired.",
              },
              {
                name: "Signature Hand-Thrown Ceramic Pitcher",
                price: "$54",
                description: "Small-batch terracotta stoneware with food-safe satin mineral glaze.",
              },
              {
                name: "Artisanal Espresso Cup Duo",
                price: "$36",
                description: "Pair of hand-pinched tactile ceramic espresso vessels.",
              },
            ],
          },
          {
            type: "contact",
            title: "Studio Hours & Direct Contact",
            phone: "+1 (555) 382-7401",
            email: "hello@artisanalstudio.co",
            address: "Wed – Sun: 10:00 AM – 6:00 PM • 42 Old Mill Lane, Artisans Quarter",
            instagram: "@artisanal.studio",
          },
        ],
      };
    }

    // 2. Real Estate, Architecture & Property
    if (
      rawPrompt.includes("real estate") ||
      rawPrompt.includes("property") ||
      rawPrompt.includes("realtor") ||
      rawPrompt.includes("home") ||
      rawPrompt.includes("villa")
    ) {
      return {
        businessName: "Prestige Prime Properties",
        bio: "Curated residential estates, luxury architectural residences, and private advisory.",
        theme: {
          primaryColor: "#0F172A",
          accentColor: "#0284C7",
          backgroundColor: "#F8FAFC",
          textColor: "#0F172A",
          cardBg: "#FFFFFF",
        },
        blocks: [
          {
            type: "hero",
            title: "Prestige Prime Properties",
            subtitle: "Exclusive modern estates and bespoke residential acquisitions.",
            badgeText: "Exclusive Listings",
          },
          {
            type: "linkList",
            title: "Property Portfolios & Inquiries",
            items: [
              {
                title: "View Active Luxury Listings",
                url: mainUrl,
                subtitle: "Explore high-resolution architectural tours & specs",
                highlight: true,
              },
              {
                title: "Schedule a Private Viewing",
                url: "https://calendly.com",
                subtitle: "Book an exclusive confidential walkthrough",
                highlight: false,
              },
              {
                title: "Download Estate Buyer's Dossier",
                url: mainUrl,
                subtitle: "Comprehensive neighborhood analytics & floor plans",
                highlight: false,
              },
            ],
          },
          {
            type: "menu",
            title: "Featured Property Highlights",
            items: [
              {
                name: "The Glass Pavilion Residence",
                price: "$2,850,000",
                description: "4-Bed, 5-Bath minimalist modern home with infinity pool and panoramic views.",
              },
              {
                name: "The Penthouse at Skyline Tower",
                price: "$1,975,000",
                description: "Private rooftop terrace, floor-to-ceiling glass, and dedicated concierge.",
              },
            ],
          },
          {
            type: "contact",
            title: "Private Brokerage Contact",
            phone: "+1 (555) 720-9110",
            email: "advisory@prestigeprime.com",
            address: "740 Fifth Avenue, Suite 1800, New York, NY",
          },
        ],
      };
    }

    // 3. Restaurant, Gastronomy & Cafe
    if (
      rawPrompt.includes("restaurant") ||
      rawPrompt.includes("cafe") ||
      rawPrompt.includes("bistro") ||
      rawPrompt.includes("food") ||
      rawPrompt.includes("dining") ||
      rawPrompt.includes("coffee")
    ) {
      return {
        businessName: "L’Aura Bistro & Bar",
        bio: "Contemporary seasonal dining, artisanal natural wines, and evening atmosphere.",
        theme: {
          primaryColor: "#18181B",
          accentColor: "#E11D48",
          backgroundColor: "#FAFAFA",
          textColor: "#18181B",
          cardBg: "#FFFFFF",
        },
        blocks: [
          {
            type: "hero",
            title: "L’Aura Bistro & Bar",
            subtitle: "Seasonal farm-to-table cuisine, wood-fired specials, and signature cocktails.",
            badgeText: "Reservations Open",
          },
          {
            type: "linkList",
            title: "Quick Dining Actions",
            items: [
              {
                title: "Reserve a Dinner Table",
                url: "https://resy.com",
                subtitle: "Instant confirmation for indoor & patio seating",
                highlight: true,
              },
              {
                title: "Explore Full Digital Menu",
                url: mainUrl,
                subtitle: "Daily rotating appetizers, entrees, and natural wine list",
                highlight: false,
              },
              {
                title: "Order Takeout & Delivery",
                url: mainUrl,
                subtitle: "Carefully packaged for fine dining at home",
                highlight: false,
              },
            ],
          },
          {
            type: "menu",
            title: "Chef’s Seasonal Specials",
            items: [
              {
                name: "Pan-Seared King Salmon",
                price: "$34",
                description: "Wild mushrooms, celery root purée, and brown butter emulsion.",
              },
              {
                name: "Handmade Truffle Pappardelle",
                price: "$28",
                description: "Fresh egg pasta, winter black truffle, and aged parmigiano-reggiano.",
              },
              {
                name: "Wood-Fired Basque Cheesecake",
                price: "$14",
                description: "Burnt caramel crust with seasonal berry compote.",
              },
            ],
          },
          {
            type: "contact",
            title: "Dining Hours & Reservations",
            phone: "+1 (555) 890-4421",
            email: "reservations@laurabistro.com",
            address: "Tue – Sun: 5:00 PM – 11:00 PM • 188 Market Street",
            instagram: "@laurabistro",
          },
        ],
      };
    }

    // 4. Default High-Converting Showcase
    const inferredName = input.businessName || "Official Brand Showcase";
    return {
      businessName: inferredName,
      bio: "Discover our latest services, curated offerings, and direct digital touchpoints.",
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
          title: inferredName,
          subtitle: "Explore our offerings, schedule consultations, and connect with our team.",
          badgeText: "Verified Hub",
        },
        {
          type: "linkList",
          title: "Primary Actions & Links",
          items: [
            {
              title: "Visit Official Website",
              url: mainUrl,
              subtitle: "Explore our core digital experience and offerings",
              highlight: true,
            },
            {
              title: "Book a Consultation / Appointment",
              url: "https://calendly.com",
              subtitle: "Schedule a 1-on-1 session with our specialists",
              highlight: false,
            },
            {
              title: "Follow Our Latest Updates",
              url: mainUrl,
              subtitle: "Subscribe to our news and announcements",
              highlight: false,
            },
          ],
        },
        {
          type: "contact",
          title: "Get in Touch",
          email: "contact@company.com",
          phone: "+1 (555) 402-9182",
          address: "Mon – Fri: 9:00 AM – 6:00 PM",
        },
      ],
    };
  },
};

registerPrompt("landing-page-builder.v1", prompt);
