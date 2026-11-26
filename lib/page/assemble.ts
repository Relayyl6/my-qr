// lib/page/assemble.ts
import { PageSchema, type Page, type AiCopy } from "./schema";

export type AssembleInput = {
  brandName: string;
  palette: Page["brand"]["palette"];
  destinationUrl: string;
  links?: Page["links"];
  contact?: Page["contact"];
  logoUrl?: string;
};

// Turns AI copy + user form state into a publishable page. Code owns every URL and every setting.
export function assemble(copy: AiCopy, form: AssembleInput): Page {
  const page = {
    schemaVersion: 1 as const,
    template: copy.template,
    brand: {
      name: form.brandName.trim() || "My Business",
      headline: copy.headline,
      tagline: copy.tagline,
      logoUrl: form.logoUrl,
      palette: form.palette,
    },
    cta: {
      label: copy.ctaLabel,
      url: form.destinationUrl, // always the owner's destination URL
    },
    links: form.links || [],
    services: copy.services,
    contact: form.contact || {},
  };

  return PageSchema.parse(page); // throws if anything is out of bounds
}
