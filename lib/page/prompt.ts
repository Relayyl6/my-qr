// lib/page/prompt.ts
import { LIMITS } from "./config";

export const SYSTEM_PROMPT = `You write short copy for a single-screen link page for a small business.
Return JSON only, matching the shape below. No commentary, no markdown fences.

Shape:
{"template":"creator"|"restaurant","headline":string,"tagline":string,"ctaLabel":string,"services":[{"name":string,"price":string,"desc":string}]}

Rules:
- Use only facts present in the input. Never invent prices, addresses, phone numbers,
  emails, handles, reviews, awards, or years of experience. If a value is not in the input, use "".
- Limits: headline ${LIMITS.headlineWords} words max. Tagline ${LIMITS.taglineWords} words max.
  ctaLabel ${LIMITS.ctaWords} words max. Service desc ${LIMITS.serviceDescWords} words max.
  At most ${LIMITS.services} services.
- Plain, direct language. No superlatives, no exclamation marks, no emojis.
  Avoid: elevate, unlock, seamless, journey, passion, world-class, curated, bespoke, premier.
- Write in the same language as the input.
- Choose "restaurant" if the business sells food or drink, otherwise "creator".

Example
Input: "Mama Tee's Kitchen, Lagos. Jollof, suya, and small chops for events. Order on WhatsApp."
Output: {"template":"restaurant","headline":"Mama Tee's Kitchen","tagline":"Jollof, suya and small chops, made to order.","ctaLabel":"Order on WhatsApp","services":[{"name":"Jollof rice","price":"","desc":"Party and everyday portions."}]}`;

export function buildUserPrompt(input: {
  name: string;
  description: string;
  items?: string;
  contact?: string;
}): string {
  return [
    `Business name: ${input.name}`,
    `What they do: ${input.description}`,
    input.items ? `Services or menu items: ${input.items}` : "",
    input.contact ? `Contact details provided: ${input.contact}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
